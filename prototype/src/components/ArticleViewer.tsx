import { useAppStore } from "@/store/appStore";
import { X, FileText, AlertCircle } from "lucide-react";
import type { Content } from "@/types";
import { ReferenceResolver } from "./ReferenceResolver";
import { NavigableBreadcrumb } from "./NavigableBreadcrumb";
import { GlobalRevisionManager } from "@/lib/globalRevisionManager";

export function ArticleViewer() {
  const {
    selectedArticle,
    selectedContent,
    selectedContentType,
    selectedContentData,
    highlightedContentId,
    articleLoading,
    globalRevisionDate,
    setSelectedArticleId,
    setSelectedArticle,
    setSelectedContent,
    setSelectedContentType,
    setSelectedContentData,
    setHighlightedContentId,
  } = useAppStore();

  const handleClose = () => {
    setSelectedArticleId(null);
    setSelectedArticle(null);
    setSelectedContent(null);
    setSelectedContentType('article');
    setSelectedContentData(null);
    setHighlightedContentId(null);
  };

  if (articleLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  // Handle standalone table or figure view
  if (selectedContentType !== 'article' && selectedContent && !selectedArticle && !selectedContentData) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-mono text-primary-600 mb-1">
                {selectedContentType === 'table' ? 'Table' : 'Figure'}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedContent.title || `${selectedContentType === 'table' ? 'Table' : 'Figure'}`}
              </h1>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 ml-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <ContentBlock content={selectedContent} />
          </div>
        </div>
      </div>
    );
  }

  // Handle part, section, or subsection view
  if (['part', 'section', 'subsection'].includes(selectedContentType) && selectedContentData) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Breadcrumb */}
              {selectedContentData.breadcrumb && (
                <NavigableBreadcrumb 
                  breadcrumb={selectedContentData.breadcrumb}
                  currentType={selectedContentType}
                  currentData={selectedContentData}
                />
              )}

              <div className="text-sm font-mono text-primary-600 mb-1">
                {selectedContentType === 'part' && `Part ${selectedContentData.number}`}
                {selectedContentType === 'section' && `Section ${selectedContentData.number}`}
                {selectedContentType === 'subsection' && `Subsection ${selectedContentData.number}`}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedContentData.title}
              </h1>

              {/* Global Revision Indicator */}
              {globalRevisionDate && (
                <div className="mt-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md inline-block">
                  <span className="text-sm text-blue-800">
                    Content as of {new Date(globalRevisionDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 ml-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <StructuralContentView 
              contentType={selectedContentType} 
              contentData={selectedContentData}
              globalRevisionDate={globalRevisionDate}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!selectedArticle && !selectedContentData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <FileText className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Content Selected
          </h2>
          <p className="text-gray-500">
            Search for content or browse the table of contents to view articles, sections, or parts
          </p>
        </div>
      </div>
    );
  }

  // Get content based on global revision date
  const displayContent = selectedArticle ? GlobalRevisionManager.getContentForGlobalDate(selectedArticle, globalRevisionDate || undefined) : [];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Breadcrumb */}
            {selectedArticle && (selectedArticle as any).breadcrumb && (
              <NavigableBreadcrumb 
                breadcrumb={(selectedArticle as any).breadcrumb}
                currentType="article"
                currentData={selectedArticle}
              />
            )}

            <div className="text-sm font-mono text-primary-600 mb-1">
              Article {selectedArticle?.number}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedArticle?.title}
            </h1>

            {/* Global Revision Indicator */}
            {globalRevisionDate && (
              <div className="mt-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md inline-block">
                <span className="text-sm text-blue-800">
                  Content as of {new Date(globalRevisionDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
            
            {/* Show highlighted content info */}
            {highlightedContentId && selectedContent && (
              <div className="mt-2 px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-md inline-block">
                <span className="text-sm text-yellow-800">
                  Showing: {selectedContent.title || `${selectedContentType === 'table' ? 'Table' : 'Figure'}`}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {displayContent.map((content, index) => (
            <ContentBlock 
              key={content.id || index} 
              content={content} 
              isHighlighted={content.id === highlightedContentId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentBlock({ content, isHighlighted = false }: { content: Content; isHighlighted?: boolean }) {
  const baseClasses = isHighlighted ? "ring-2 ring-yellow-400 bg-yellow-50 rounded-lg p-4" : "";
  
  switch (content.type) {
    case "sentence":
      return (
        <div className={baseClasses}>
          <SentenceBlock content={content} />
        </div>
      );
    case "table":
      return (
        <div className={baseClasses}>
          <TableBlock content={content} />
        </div>
      );
    case "figure":
      return (
        <div className={baseClasses}>
          <FigureBlock content={content} />
        </div>
      );
    case "note":
      return (
        <div className={baseClasses}>
          <NoteBlock content={content} />
        </div>
      );
    default:
      return null;
  }
}

function SentenceBlock({ content }: { content: Content }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <span className="flex-shrink-0 font-mono text-sm text-gray-500">
          ({content.number})
        </span>
        <div className="flex-1">
          <p className="text-gray-800 leading-relaxed">
            <ReferenceResolver text={content.text || ""} />
          </p>

          {/* Clauses */}
          {content.clauses && content.clauses.length > 0 && (
            <div className="mt-3 ml-6 space-y-2">
              {content.clauses.map((clause) => (
                <div key={clause.id} className="flex gap-3">
                  <span className="flex-shrink-0 font-mono text-sm text-gray-500">
                    {clause.letter})
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-800">
                      <ReferenceResolver text={clause.text} />
                    </p>

                    {/* Subclauses */}
                    {clause.subclauses && clause.subclauses.length > 0 && (
                      <div className="mt-2 ml-6 space-y-1">
                        {clause.subclauses.map((subclause) => (
                          <div key={subclause.id} className="flex gap-2">
                            <span className="flex-shrink-0 font-mono text-sm text-gray-500">
                              {subclause.number})
                            </span>
                            <p className="text-gray-800 text-sm">
                              <ReferenceResolver text={subclause.text} />
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TableBlock({ content }: { content: Content }) {
  if (!content.structure) return null;

  return (
    <div className="my-6">
      {content.title && (
        <h3 className="font-semibold text-gray-900 mb-3">{content.title}</h3>
      )}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Header */}
          {content.structure.header_rows &&
            content.structure.header_rows.length > 0 && (
              <thead className="bg-gray-50">
                {content.structure.header_rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <th
                        key={cellIndex}
                        className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-r border-gray-200 last:border-r-0"
                      >
                        <ReferenceResolver text={cell.content} />
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
            )}

          {/* Body */}
          {content.structure.body_rows &&
            content.structure.body_rows.length > 0 && (
              <tbody className="bg-white divide-y divide-gray-200">
                {content.structure.body_rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-3 text-sm text-gray-800 border-r border-gray-200 last:border-r-0"
                      >
                        <ReferenceResolver text={cell.content} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
        </table>
      </div>
    </div>
  );
}

function FigureBlock({ content }: { content: Content }) {
  if (!content.graphic) return null;

  return (
    <div className="my-6">
      {content.title && (
        <h3 className="font-semibold text-gray-900 mb-3">{content.title}</h3>
      )}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <img
          src={content.graphic.src}
          alt={content.graphic.alt_text || "Figure"}
          className="max-w-full h-auto mx-auto"
        />
        {content.graphic.alt_text && (
          <p className="text-sm text-gray-600 text-center mt-2">
            {content.graphic.alt_text}
          </p>
        )}
      </div>
    </div>
  );
}

function NoteBlock({ content }: { content: Content }) {
  if (!content.notes || content.notes.length === 0) return null;

  return (
    <div className="my-4 space-y-2">
      {content.notes.map((note) => (
        <div
          key={note.id}
          className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">Note</p>
            <p className="text-sm text-blue-800">
              <ReferenceResolver text={note.content} />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Component for rendering structural content (parts, sections, subsections)
function StructuralContentView({ 
  contentType, 
  contentData, 
  globalRevisionDate 
}: { 
  contentType: string; 
  contentData: any; 
  globalRevisionDate: string | null;
}) {
  const { setSelectedArticleId, setSelectedArticle, setSelectedContentType, setSelectedContentData } = useAppStore();

  const handleArticleClick = (article: any) => {
    const articleWithBreadcrumb = {
      ...article,
      breadcrumb: contentData.breadcrumb
    };
    
    setSelectedArticleId(article.id);
    setSelectedArticle(articleWithBreadcrumb);
    setSelectedContentType('article');
    setSelectedContentData(null);
  };

  const handleSubsectionClick = (subsection: any) => {
    const subsectionWithBreadcrumb = {
      ...subsection,
      breadcrumb: {
        ...contentData.breadcrumb,
        section: `Section ${contentData.number}`,
        sectionTitle: contentData.title
      }
    };
    
    setSelectedContentType('subsection');
    setSelectedContentData(subsectionWithBreadcrumb);
  };

  const handleSectionClick = (section: any) => {
    const sectionWithBreadcrumb = {
      ...section,
      breadcrumb: {
        ...contentData.breadcrumb,
        part: `Part ${contentData.number}`,
        partTitle: contentData.title
      }
    };
    
    setSelectedContentType('section');
    setSelectedContentData(sectionWithBreadcrumb);
  };

  if (contentType === 'part') {
    return (
      <div className="space-y-8">
        <div className="prose max-w-none">
          <p className="text-gray-600 text-lg">
            This part contains {contentData.sections?.length || 0} sections with various requirements and specifications.
          </p>
        </div>

        {contentData.sections && contentData.sections.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sections</h2>
            <div className="grid gap-4">
              {contentData.sections.map((section: any) => (
                <div 
                  key={section.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSectionClick(section)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        Section {section.number}: {section.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {section.subsections?.length || 0} subsections
                      </p>
                    </div>
                    <div className="text-sm text-primary-600 font-mono">
                      {contentData.breadcrumb?.division?.replace('Division ', '')}.{contentData.number}.{section.number}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (contentType === 'section') {
    return (
      <div className="space-y-8">
        <div className="prose max-w-none">
          <p className="text-gray-600 text-lg">
            This section contains {contentData.subsections?.length || 0} subsections with specific requirements.
          </p>
        </div>

        {contentData.subsections && contentData.subsections.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Subsections</h2>
            <div className="grid gap-4">
              {contentData.subsections.map((subsection: any) => (
                <div 
                  key={subsection.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSubsectionClick(subsection)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        Subsection {subsection.number}: {subsection.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {subsection.articles?.length || 0} articles
                      </p>
                    </div>
                    <div className="text-sm text-primary-600 font-mono">
                      {contentData.breadcrumb?.division?.replace('Division ', '')}.{contentData.breadcrumb?.part?.replace('Part ', '')}.{contentData.number}.{subsection.number}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (contentType === 'subsection') {
    return (
      <div className="space-y-8">
        <div className="prose max-w-none">
          <p className="text-gray-600 text-lg">
            This subsection contains {contentData.articles?.length || 0} articles with detailed requirements.
          </p>
        </div>

        {contentData.articles && contentData.articles.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Articles</h2>
            <div className="grid gap-4">
              {contentData.articles.map((article: any) => {
                // Get content for the current global revision date
                const displayContent = GlobalRevisionManager.getContentForGlobalDate(article, globalRevisionDate || undefined);
                const previewText = displayContent
                  .filter((c: any) => c.type === 'sentence')
                  .slice(0, 2)
                  .map((c: any) => c.text || '')
                  .join(' ')
                  .substring(0, 200) + '...';

                return (
                  <div 
                    key={article.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleArticleClick(article)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          Article {article.number}: {article.title}
                        </h3>
                      </div>
                      <div className="text-sm text-primary-600 font-mono">
                        {contentData.breadcrumb?.division?.replace('Division ', '')}.{contentData.breadcrumb?.part?.replace('Part ', '')}.{contentData.breadcrumb?.section?.replace('Section ', '')}.{contentData.number}.{article.number}
                      </div>
                    </div>
                    {previewText && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {previewText}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}