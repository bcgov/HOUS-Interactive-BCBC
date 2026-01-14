import { useState } from 'react';
import { ChevronRight, ChevronDown, Book, FileText, Folder, FolderOpen, GitBranch } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { TableOfContentsItem } from '@/types';

interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { 
    setSelectedArticleId, 
    setSelectedArticle, 
    setSelectedContentType, 
    setSelectedContentData,
    setSelectedContent,
    setHighlightedContentId
  } = useAppStore();

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = async (item: TableOfContentsItem) => {
    try {
      const response = await fetch('/bcbc-full.json');
      const bcbcData = await response.json();
      
      if (item.type === 'article') {
        // Load the full article data
        const article = findArticleById(bcbcData, item.id);
        if (article) {
          const articleWithBreadcrumb = {
            ...article,
            breadcrumb: {
              division: item.id.includes('divA') ? 'Division A' : 
                       item.id.includes('divB') ? 'Division B' : 
                       item.id.includes('divC') ? 'Division C' : 'Division',
              part: `Part ${extractPartNumber(item.id)}`,
              section: `Section ${extractSectionNumber(item.id)}`,
              subsection: `Subsection ${extractSubsectionNumber(item.id)}`
            }
          };
          
          setSelectedArticleId(item.id);
          setSelectedArticle(articleWithBreadcrumb);
          setSelectedContentType('article');
          setSelectedContentData(null);
          setSelectedContent(null);
          setHighlightedContentId(null);
        }
      } else if (item.type === 'part') {
        // Load part data
        const part = findPartById(bcbcData, item.id);
        if (part) {
          setSelectedArticleId(null);
          setSelectedArticle(null);
          setSelectedContentType('part');
          setSelectedContentData(part);
          setSelectedContent(null);
          setHighlightedContentId(null);
        }
      } else if (item.type === 'section') {
        // Load section data
        const section = findSectionById(bcbcData, item.id);
        if (section) {
          setSelectedArticleId(null);
          setSelectedArticle(null);
          setSelectedContentType('section');
          setSelectedContentData(section);
          setSelectedContent(null);
          setHighlightedContentId(null);
        }
      } else if (item.type === 'subsection') {
        // Load subsection data
        const subsection = findSubsectionById(bcbcData, item.id);
        if (subsection) {
          setSelectedArticleId(null);
          setSelectedArticle(null);
          setSelectedContentType('subsection');
          setSelectedContentData(subsection);
          setSelectedContent(null);
          setHighlightedContentId(null);
        }
      } else {
        // For divisions, just toggle expansion
        toggleExpanded(item.id);
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  };

  const getIcon = (item: TableOfContentsItem, isExpanded: boolean) => {
    switch (item.type) {
      case 'division':
        return <Book className="w-4 h-4 text-blue-600" />;
      case 'part':
        return isExpanded ? <FolderOpen className="w-4 h-4 text-green-600" /> : <Folder className="w-4 h-4 text-green-600" />;
      case 'section':
        return isExpanded ? <FolderOpen className="w-4 h-4 text-orange-600" /> : <Folder className="w-4 h-4 text-orange-600" />;
      case 'subsection':
        return isExpanded ? <FolderOpen className="w-4 h-4 text-purple-600" /> : <Folder className="w-4 h-4 text-purple-600" />;
      case 'article':
        return <FileText className="w-4 h-4 text-gray-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const renderItem = (item: TableOfContentsItem) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isClickable = item.type !== 'division'; // All except divisions are clickable

    return (
      <div key={item.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors
            ${isClickable ? 'cursor-pointer hover:bg-gray-100' : ''}
            ${item.level === 0 ? 'font-semibold' : ''}
            ${item.level === 1 ? 'font-medium' : ''}
            ${item.level >= 2 ? 'text-sm' : ''}
          `}
          style={{ paddingLeft: `${8 + item.level * 16}px` }}
          onClick={() => isClickable ? handleItemClick(item) : undefined}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </button>
          )}
          
          {/* Icon */}
          <div className="flex-shrink-0">
            {getIcon(item, isExpanded)}
          </div>
          
          {/* Number */}
          <span className="flex-shrink-0 text-xs font-mono text-gray-500 min-w-[2rem]">
            {item.type === 'division' ? item.number : 
             item.type === 'article' ? `${item.number}` : 
             `${item.number}`}
          </span>
          
          {/* Title */}
          <span className="flex-1 truncate">
            {item.title}
          </span>
          
          {/* Revision Indicator */}
          {item.hasRevisions && (
            <GitBranch className="w-3 h-3 text-blue-500 flex-shrink-0" />
          )}
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {item.children!.map(child => renderItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Book className="w-4 h-4" />
          Table of Contents
        </h3>
        <div className="space-y-1">
          {items.map(item => renderItem(item))}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function findArticleById(bcbcData: any, articleId: string): any {
  for (const division of bcbcData.divisions) {
    for (const part of division.parts) {
      for (const section of part.sections) {
        for (const subsection of section.subsections) {
          for (const article of subsection.articles) {
            if (article.id === articleId) {
              return article;
            }
          }
        }
      }
    }
  }
  return null;
}

function findPartById(bcbcData: any, partId: string): any {
  for (const division of bcbcData.divisions) {
    for (const part of division.parts) {
      if (part.id === partId) {
        return {
          ...part,
          breadcrumb: {
            division: `Division ${division.letter}`,
            divisionTitle: division.title
          }
        };
      }
    }
  }
  return null;
}

function findSectionById(bcbcData: any, sectionId: string): any {
  for (const division of bcbcData.divisions) {
    for (const part of division.parts) {
      for (const section of part.sections) {
        if (section.id === sectionId) {
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
      }
    }
  }
  return null;
}

function findSubsectionById(bcbcData: any, subsectionId: string): any {
  for (const division of bcbcData.divisions) {
    for (const part of division.parts) {
      for (const section of part.sections) {
        for (const subsection of section.subsections) {
          if (subsection.id === subsectionId) {
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
        }
      }
    }
  }
  return null;
}

function extractPartNumber(id: string): string {
  const match = id.match(/\.part(\d+)\./);
  return match ? match[1] : '';
}

function extractSectionNumber(id: string): string {
  const match = id.match(/\.sect(\d+)\./);
  return match ? match[1] : '';
}

function extractSubsectionNumber(id: string): string {
  const match = id.match(/\.subsect(\d+)\./);
  return match ? match[1] : '';
}