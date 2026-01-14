export interface ParsedRef {
  type: 'term' | 'internal' | 'external' | 'standard' | 'functional-statement';
  id: string;
  displayType?: 'short' | 'long';
  originalText: string;
}

export interface TextSegment {
  type: 'text' | 'ref';
  content: string;
  ref?: ParsedRef;
}

// Regular expression to match REF patterns
const REF_PATTERN = /\[REF:(term|internal|external|standard|functional-statement):([^\]:]+)(?::([^\]]+))?\]/g;

/**
 * Parse a REF tag string into a structured object
 */
export function parseRefTag(refString: string): ParsedRef | null {
  const match = refString.match(/\[REF:(term|internal|external|standard|functional-statement):([^\]:]+)(?::([^\]]+))?\]/);

  if (!match) return null;

  const [originalText, type, id, displayType] = match;

  return {
    type: type as ParsedRef['type'],
    id,
    displayType: displayType as 'short' | 'long' | undefined,
    originalText
  };
}

/**
 * Parse text containing REF tags into segments of plain text and references
 */
export function parseTextWithRefs(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  // Find all REF tags
  const matches = Array.from(text.matchAll(REF_PATTERN));

  for (const match of matches) {
    const refStart = match.index!;
    const refEnd = refStart + match[0].length;

    // Add text before the REF tag
    if (refStart > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, refStart)
      });
    }

    // Parse the REF tag
    const ref = parseRefTag(match[0]);
    if (ref) {
      segments.push({
        type: 'ref',
        content: match[0],
        ref
      });
    }

    lastIndex = refEnd;
  }

  // Add remaining text after last REF tag
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex)
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }];
}

/**
 * Extract the display text that follows a term reference
 * Example: "[REF:term:bldng]building" -> "building"
 */
export function extractDisplayText(text: string, refEndIndex: number): string | null {
  // Look for text immediately after the ] until we hit a space, comma, period, or another [
  const afterRef = text.substring(refEndIndex);
  const match = afterRef.match(/^([^\s,.\[]+)/);
  return match ? match[1] : null;
}

/**
 * Parse text and extract display text for term references
 */
export function parseTextWithDisplayText(text: string): Array<{ segment: TextSegment; displayText?: string }> {
  const segments = parseTextWithRefs(text);
  const result: Array<{ segment: TextSegment; displayText?: string }> = [];

  let currentIndex = 0;
  for (const segment of segments) {
    if (segment.type === 'ref' && segment.ref?.type === 'term') {
      const refEndIndex = currentIndex + segment.content.length;
      const displayText = extractDisplayText(text, refEndIndex);

      result.push({ segment, displayText: displayText || undefined });

      // If we found display text, we need to adjust the next text segment
      if (displayText && segments.indexOf(segment) < segments.length - 1) {
        const nextSegment = segments[segments.indexOf(segment) + 1];
        if (nextSegment.type === 'text') {
          nextSegment.content = nextSegment.content.substring(displayText.length);
        }
      }
    } else {
      result.push({ segment });
    }

    currentIndex += segment.content.length;
  }

  return result;
}
