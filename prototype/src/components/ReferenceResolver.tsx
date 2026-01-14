import { useState, useRef, useEffect } from "react";
import { parseTextWithRefs, type ParsedRef } from "@/lib/refParser";
import { searchService } from "@/services/searchService";
import { useAppStore } from "@/store/appStore";

interface ReferenceResolverProps {
  text: string;
}

interface TermReferenceProps {
  refId: string;
  displayText?: string;
}

function TermReference({ refId, displayText }: TermReferenceProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const term = searchService.getGlossaryTerm(refId);

  useEffect(() => {
    if (showTooltip && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const tooltipWidth = 384; // w-96 = 24rem = 384px
      const tooltipHeight = 100; // Approximate height
      
      let top = rect.top - tooltipHeight - 8; // 8px gap above
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      
      // Adjust if tooltip would go off screen horizontally
      if (left < 8) left = 8;
      if (left + tooltipWidth > window.innerWidth - 8) {
        left = window.innerWidth - tooltipWidth - 8;
      }
      
      // If no room above, show below
      if (top < 8) {
        top = rect.bottom + 8;
      }
      
      setTooltipPosition({ top, left });
    }
  }, [showTooltip]);

  if (!term) {
    return <span className="text-blue-600">{displayText || refId}</span>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-blue-600 underline decoration-dotted cursor-help">
          {displayText || term.term}
        </span>
      </span>

      {showTooltip && (
        <div 
          className="fixed z-[9999] w-96 p-3 bg-gray-900 text-white text-sm rounded shadow-lg pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          <strong className="block mb-1">{term.term}</strong>
          <span className="text-gray-200">{stripRefs(term.definition)}</span>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      )}
    </>
  );
}

interface InternalReferenceProps {
  refId: string;
  displayType: "short" | "long";
}

function InternalReference({ refId, displayType }: InternalReferenceProps) {
  const { setSelectedArticleId, setArticleLoading, setSelectedArticle } =
    useAppStore();

  const handleClick = async () => {
    try {
      setArticleLoading(true);
      setSelectedArticleId(refId);

      const result = await searchService.getFullContent(refId);

      if (result.article) {
        setSelectedArticle(result.article);
      } else {
        console.error("Article not found:", refId);
      }
    } catch (error) {
      console.error("Error loading article:", error);
    } finally {
      setArticleLoading(false);
    }
  };

  // Use the search service to resolve the reference to human-readable text
  const displayText = searchService.resolveReference(refId, displayType);

  return (
    <button
      onClick={handleClick}
      className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
    >
      {displayText}
    </button>
  );
}

interface ExternalReferenceProps {
  refId: string;
}

function ExternalReference({ refId }: ExternalReferenceProps) {
  return <span className="text-purple-600 font-medium">{refId}</span>;
}

function renderReference(ref: ParsedRef, nextText?: string, index: number = 0): JSX.Element {
  // Create a more unique key by combining reference type, id, and index
  const uniqueKey = `${ref.type}-${ref.id}-${index}`;
  
  switch (ref.type) {
    case "term": {
      // Extract display text from the next text segment
      const displayMatch = nextText?.match(/^([^\s,.\[)]+)/);
      const displayText = displayMatch ? displayMatch[1] : undefined;
      return (
        <TermReference
          key={uniqueKey}
          refId={ref.id}
          displayText={displayText}
        />
      );
    }

    case "internal":
      return (
        <InternalReference
          key={uniqueKey}
          refId={ref.id}
          displayType={ref.displayType || "short"}
        />
      );

    case "external":
      return <ExternalReference key={uniqueKey} refId={ref.id} />;

    case "functional-statement":
    case "standard":
      return (
        <span key={uniqueKey} className="text-green-600 font-medium">
          {ref.id}
        </span>
      );

    default:
      return <span key={uniqueKey}>{ref.originalText}</span>;
  }
}

export function ReferenceResolver({ text }: ReferenceResolverProps) {
  const segments = parseTextWithRefs(text);

  if (
    segments.length === 0 ||
    (segments.length === 1 && segments[0].type === "text")
  ) {
    // Check for special patterns in plain text like "Sentences (6) to (10)"
    const processedText = processSpecialPatterns(text);
    return <>{processedText}</>;
  }

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          // Check if this is display text for a term reference
          const prevSegment = index > 0 ? segments[index - 1] : null;
          if (prevSegment?.type === "ref" && prevSegment.ref?.type === "term") {
            // Extract and remove the display text from this segment
            const displayMatch = segment.content.match(/^([^\s,.\[)]+)/);
            if (displayMatch) {
              const remainingText = segment.content.substring(
                displayMatch[1].length,
              );
              return <span key={index}>{processSpecialPatterns(remainingText)}</span>;
            }
          }
          return <span key={index}>{processSpecialPatterns(segment.content)}</span>;
        } else if (segment.ref) {
          const nextSegment =
            index < segments.length - 1 ? segments[index + 1] : null;
          const nextText =
            nextSegment?.type === "text" ? nextSegment.content : undefined;
          return renderReference(segment.ref, nextText, index);
        }
        return null;
      })}
    </>
  );
}

// Helper function to process special patterns in text
function processSpecialPatterns(text: string): string {
  // Handle patterns like "Sentences (6) to (10)" - these are already human-readable
  // Handle patterns like "Article BV2.1.10.14.4" -> "Article B.1.10.14.4"
  return text.replace(/BV2\./g, 'B.');
}

// Helper functions

function stripRefs(text: string): string {
  return text.replace(/\[REF:[^\]]+\]/g, "");
}
