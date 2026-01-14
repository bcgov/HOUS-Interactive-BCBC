import { useAppStore } from '@/store/appStore';

interface BreadcrumbItem {
  label: string;
  id?: string;
  type?: 'division' | 'part' | 'section' | 'subsection';
}

interface NavigableBreadcrumbProps {
  breadcrumb: any;
  currentType: string;
  currentData: any;
}

export function NavigableBreadcrumb({ breadcrumb, currentData }: NavigableBreadcrumbProps) {
  const { 
    setSelectedContentType, 
    setSelectedContentData, 
    setSelectedArticle, 
    setSelectedArticleId,
    setSelectedContent,
    setHighlightedContentId
  } = useAppStore();

  const handleBreadcrumbClick = async (type: string) => {
    try {
      const response = await fetch('/bcbc-full.json');
      const bcbcData = await response.json();
      
      let contentData = null;
      
      if (type === 'part') {
        // Extract part number from breadcrumb
        const partNumber = breadcrumb.part?.replace('Part ', '');
        const divisionLetter = breadcrumb.division?.replace('Division ', '');
        contentData = findPartByNumber(bcbcData, divisionLetter, partNumber);
      } else if (type === 'section') {
        // Extract section number from breadcrumb
        const sectionNumber = breadcrumb.section?.replace('Section ', '');
        const partNumber = breadcrumb.part?.replace('Part ', '');
        const divisionLetter = breadcrumb.division?.replace('Division ', '');
        contentData = findSectionByNumber(bcbcData, divisionLetter, partNumber, sectionNumber);
      } else if (type === 'subsection') {
        // For subsection, we need to find it by the current data's parent info
        const subsectionNumber = currentData.number;
        const sectionNumber = breadcrumb.section?.replace('Section ', '');
        const partNumber = breadcrumb.part?.replace('Part ', '');
        const divisionLetter = breadcrumb.division?.replace('Division ', '');
        contentData = findSubsectionByNumber(bcbcData, divisionLetter, partNumber, sectionNumber, subsectionNumber);
      }
      
      if (contentData) {
        setSelectedArticleId(null);
        setSelectedArticle(null);
        setSelectedContent(null);
        setSelectedContentType(type as any);
        setSelectedContentData(contentData);
        setHighlightedContentId(null);
      }
    } catch (error) {
      console.error('Failed to navigate via breadcrumb:', error);
    }
  };

  const breadcrumbItems: BreadcrumbItem[] = [];
  
  if (breadcrumb.division) {
    breadcrumbItems.push({
      label: breadcrumb.division,
      type: 'division'
    });
  }
  
  if (breadcrumb.part) {
    breadcrumbItems.push({
      label: breadcrumb.part,
      type: 'part'
    });
  }
  
  if (breadcrumb.section) {
    breadcrumbItems.push({
      label: breadcrumb.section,
      type: 'section'
    });
  }
  
  // Always show subsection in breadcrumb if it exists, regardless of current type
  if (breadcrumb.subsection) {
    breadcrumbItems.push({
      label: breadcrumb.subsection,
      type: 'subsection'
    });
  }

  return (
    <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {item.type === 'division' ? (
            // Division is not clickable
            <span className="text-gray-600">{item.label}</span>
          ) : (
            // Other levels are clickable
            <button
              onClick={() => handleBreadcrumbClick(item.type!)}
              className="text-primary-600 hover:text-primary-800 hover:underline transition-colors font-medium cursor-pointer"
              title={`Navigate to ${item.label}`}
            >
              {item.label}
            </button>
          )}
          {index < breadcrumbItems.length - 1 && (
            <span className="text-gray-400 mx-1">›</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Helper functions to find content by numbers
function findPartByNumber(bcbcData: any, divisionLetter: string, partNumber: string): any {
  const division = bcbcData.divisions.find((d: any) => d.letter === divisionLetter);
  if (!division) return null;
  
  const part = division.parts.find((p: any) => p.number.toString() === partNumber);
  if (!part) return null;
  
  return {
    ...part,
    breadcrumb: {
      division: `Division ${division.letter}`,
      divisionTitle: division.title
    }
  };
}

function findSectionByNumber(bcbcData: any, divisionLetter: string, partNumber: string, sectionNumber: string): any {
  const division = bcbcData.divisions.find((d: any) => d.letter === divisionLetter);
  if (!division) return null;
  
  const part = division.parts.find((p: any) => p.number.toString() === partNumber);
  if (!part) return null;
  
  const section = part.sections.find((s: any) => s.number.toString() === sectionNumber);
  if (!section) return null;
  
  return {
    ...section,
    breadcrumb: {
      division: `Division ${division.letter}`,
      divisionTitle: division.title,
      part: `Part ${part.number}`,
      partTitle: part.title
    }
  };
}

function findSubsectionByNumber(bcbcData: any, divisionLetter: string, partNumber: string, sectionNumber: string, subsectionNumber: string): any {
  const division = bcbcData.divisions.find((d: any) => d.letter === divisionLetter);
  if (!division) return null;
  
  const part = division.parts.find((p: any) => p.number.toString() === partNumber);
  if (!part) return null;
  
  const section = part.sections.find((s: any) => s.number.toString() === sectionNumber);
  if (!section) return null;
  
  const subsection = section.subsections.find((ss: any) => ss.number.toString() === subsectionNumber);
  if (!subsection) return null;
  
  return {
    ...subsection,
    breadcrumb: {
      division: `Division ${division.letter}`,
      divisionTitle: division.title,
      part: `Part ${part.number}`,
      partTitle: part.title,
      section: `Section ${section.number}`,
      sectionTitle: section.title
    }
  };
}