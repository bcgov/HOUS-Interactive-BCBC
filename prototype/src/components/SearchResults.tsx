import { useAppStore } from '@/store/appStore';
import { FileText, Table, Image, AlertCircle, ChevronRight, Folder, Book } from 'lucide-react';
import { searchService } from '@/services/searchService';

export function SearchResults() {
  const { 
    searchResults, 
    searchLoading, 
    searchQuery,
    setSelectedArticleId,
    setSelectedArticle,
    setSelectedContent,
    setSelectedContentType,
    setSelectedContentData,
    setHighlightedContentId,
    setArticleLoading
  } = useAppStore();
  
  const handleContentClick = async (document: any) => {
    setArticleLoading(true);
    
    try {
      if (document.type === 'part' || document.type === 'section' || document.type === 'subsection') {
        // Handle structural content
        const response = await fetch('/bcbc-full.json');
        const bcbcData = await response.json();
        
        let contentData = null;
        if (document.type === 'part') {
          contentData = findPartById(bcbcData, document.id);
        } else if (document.type === 'section') {
          contentData = findSectionById(bcbcData, document.id);
        } else if (document.type === 'subsection') {
          contentData = findSubsectionById(bcbcData, document.id);
        }
        
        if (contentData) {
          setSelectedArticleId(null);
          setSelectedArticle(null);
          setSelectedContent(null);
          setSelectedContentType(document.type);
          setSelectedContentData(contentData);
          setHighlightedContentId(null);
        }
      } else {
        // Handle articles, tables, figures
        const result = await searchService.getFullContent(document.id);
        
        setSelectedArticle(result.article);
        setSelectedContent(result.content);
        setSelectedContentType(result.contentType);
        setSelectedContentData(null);
        
        if (result.contentType === 'article') {
          setSelectedArticleId(document.id);
        } else {
          setSelectedArticleId(null);
        }
        
        // If it's a table or figure, highlight it in the article view
        if (result.contentType !== 'article' && result.content) {
          setHighlightedContentId(document.id);
        } else {
          setHighlightedContentId(null);
        }
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setSelectedArticle(null);
      setSelectedContent(null);
      setSelectedContentType('article');
      setSelectedContentData(null);
      setHighlightedContentId(null);
    } finally {
      setArticleLoading(false);
    }
  };
  
  if (searchLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Searching...</span>
      </div>
    );
  }
  
  if (!searchQuery) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">
          Enter a search query to find articles
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Try searching by keyword, article number, or topic
        </p>
      </div>
    );
  }
  
  if (searchResults.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg">
          No results found for "{searchQuery}"
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-4">
        Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
      </div>
      
      {searchResults.map((result) => (
        <button
          key={result.document.id}
          onClick={() => handleContentClick(result.document)}
          className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {result.document.type === 'table' ? (
                <Table className="w-5 h-5 text-primary-600" />
              ) : result.document.type === 'figure' ? (
                <Image className="w-5 h-5 text-green-600" />
              ) : result.document.type === 'part' ? (
                <Book className="w-5 h-5 text-blue-600" />
              ) : result.document.type === 'section' || result.document.type === 'subsection' ? (
                <Folder className="w-5 h-5 text-orange-600" />
              ) : (
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Article number */}
              <div className="text-sm font-mono text-primary-600 mb-1">
                {result.document.articleNumber}
              </div>
              
              {/* Title */}
              <h3 className="font-medium text-gray-900 mb-1 group-hover:text-primary-600">
                {result.document.title}
              </h3>
              
              {/* Path */}
              <div className="text-xs text-gray-500 mb-2">
                {result.document.path}
              </div>
              
              {/* Highlights */}
              {result.highlights && result.highlights.length > 0 && (
                <div className="space-y-1">
                  {result.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-gray-600"
                      dangerouslySetInnerHTML={{ __html: highlight.text }}
                    />
                  ))}
                </div>
              )}
              
              {/* Badges */}
              <div className="flex items-center gap-2 mt-2">
                {result.document.type === 'part' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    Part
                  </span>
                )}
                {result.document.type === 'section' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                    Section
                  </span>
                )}
                {result.document.type === 'subsection' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    Subsection
                  </span>
                )}
                {result.document.hasAmendment && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                    BC Amendment
                  </span>
                )}
                {result.document.hasTables && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    Has Tables
                  </span>
                )}
                {result.document.type === 'table' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                    Table
                  </span>
                )}
                {result.document.type === 'figure' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Figure
                  </span>
                )}
                {result.document.hasFigures && result.document.type === 'article' && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Has Figures
                  </span>
                )}
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex-shrink-0 mt-1">
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// Helper functions for finding structural content
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