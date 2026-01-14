import FlexSearch from "flexsearch";
import type {
  SearchDocument,
  SearchOptions,
  SearchResult,
  SearchMetadata,
  Article,
} from "@/types";

export class BCBCSearchService {
  private index: FlexSearch.Document<SearchDocument> | null = null;
  private documents: Map<string, SearchDocument> = new Map();
  private fullData: any = null;
  private metadata: SearchMetadata | null = null;
  private initialized = false;
  private glossary: Map<string, any> = new Map();
  private crossReferences: Map<string, any> = new Map();
  private reverseReferences: Map<string, string> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.time("Search index initialization");

    try {
      // Load documents and metadata
      const [docsData, metaData] = await Promise.all([
        fetch("/search/documents.json").then((r) => r.json()),
        fetch("/search/metadata.json").then((r) => r.json()),
      ]);

      // Create FlexSearch index
      this.index = new FlexSearch.Document<SearchDocument>({
        tokenize: "forward",
        optimize: true,
        resolution: 9,
        cache: 100,
        context: {
          depth: 2,
          bidirectional: true,
          resolution: 9,
        },
        document: {
          id: "id",
          index: [
            {
              field: "articleNumber",
              tokenize: "strict",
              resolution: 9,
            },
            {
              field: "title",
              tokenize: "forward",
              resolution: 9,
            },
            {
              field: "text",
              tokenize: "forward",
              resolution: 5,
            },
            {
              field: "path",
              tokenize: "forward",
              resolution: 3,
            },
          ],
          store: true as any,
        },
      });

      // Add documents to index
      docsData.forEach((doc: SearchDocument) => {
        this.documents.set(doc.id, doc);
        this.index!.add(doc);
      });

      this.metadata = metaData;
      this.initialized = true;

      console.timeEnd("Search index initialization");
      console.log(`Loaded ${this.documents.size} documents`);
    } catch (error) {
      console.error("Failed to initialize search service:", error);
      throw error;
    }
  }

  async search(
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!query || query.trim().length < 2) {
      return [];
    }

    const {
      divisionFilter,
      partFilter,
      sectionFilter,
      amendmentsOnly = false,
      tablesOnly = false,
      figuresOnly = false,
      limit = 50,
      offset = 0,
    } = options;

    // Check if query is article number format
    const articleNumberMatch = query.match(
      /^([A-C])\.(\d+)\.(\d+)\.(\d+)\.(\d+)$/i,
    );
    if (articleNumberMatch) {
      return this.searchByArticleNumber(query);
    }

    // Perform search
    const rawResults = this.index!.search(query, {
      limit: limit * 3,
      enrich: true,
    });

    // Combine results from all fields
    const resultMap = new Map<
      string,
      { doc: SearchDocument; fieldScores: number[] }
    >();

    rawResults.forEach((fieldResult: any, fieldIndex: number) => {
      if (!fieldResult.result) return;

      fieldResult.result.forEach((item: any) => {
        const doc = this.documents.get(item.id);
        if (!doc) return;

        if (!resultMap.has(item.id)) {
          resultMap.set(item.id, { doc, fieldScores: [] });
        }

        // Field-specific scores
        let fieldScore = 1;
        switch (fieldIndex) {
          case 0:
            fieldScore = 10;
            break; // articleNumber
          case 1:
            fieldScore = 5;
            break; // title
          case 2:
            fieldScore = 1;
            break; // text
          case 3:
            fieldScore = 2;
            break; // path
          default:
            fieldScore = 0.5;
        }

        resultMap.get(item.id)!.fieldScores.push(fieldScore);
      });
    });

    // Apply filters and calculate scores
    let filtered = Array.from(resultMap.values())
      .filter(({ doc }) => {
        if (divisionFilter && doc.divisionLetter !== divisionFilter)
          return false;
        if (partFilter !== undefined && doc.partNumber !== partFilter)
          return false;
        if (sectionFilter !== undefined && doc.sectionNumber !== sectionFilter)
          return false;
        if (amendmentsOnly && !doc.hasAmendment) return false;
        if (tablesOnly && !doc.hasTables) return false;
        if (figuresOnly && !doc.hasFigures) return false;
        return true;
      })
      .map(({ doc, fieldScores }) => ({
        document: doc,
        score: this.calculateFinalScore(doc, fieldScores, query),
        highlights: this.generateHighlights(doc, query),
      }));

    // Sort by score
    filtered.sort((a, b) => b.score - a.score);

    // Apply pagination
    return filtered.slice(offset, offset + limit);
  }

  private searchByArticleNumber(articleNum: string): SearchResult[] {
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (doc.articleNumber === articleNum) {
        results.push({
          document: doc,
          score: 1000,
          highlights: [],
        });
        break;
      }
    }

    return results;
  }

  private calculateFinalScore(
    doc: SearchDocument,
    fieldScores: number[],
    query: string,
  ): number {
    let score = fieldScores.reduce((sum, s) => sum + s, 0);

    // Boost by priority
    score *= doc.searchPriority / 5;

    // Boost amendments
    if (doc.hasAmendment) score *= 1.5;

    // Boost exact phrase in title
    if (doc.title.toLowerCase().includes(query.toLowerCase())) {
      score *= 2;
    }

    return score;
  }

  private generateHighlights(doc: SearchDocument, query: string): any[] {
    const highlights = [];
    const queryLower = query.toLowerCase();

    // Title highlight
    if (doc.title.toLowerCase().includes(queryLower)) {
      highlights.push({
        field: "title",
        text: this.highlightText(doc.title, query),
      });
    }

    // Text snippet highlight
    const textLower = doc.text.toLowerCase();
    const index = textLower.indexOf(queryLower);
    if (index !== -1) {
      const start = Math.max(0, index - 50);
      const end = Math.min(doc.text.length, index + query.length + 50);
      const snippet = doc.text.substring(start, end);

      highlights.push({
        field: "text",
        text:
          (start > 0 ? "..." : "") +
          this.highlightText(snippet, query) +
          (end < doc.text.length ? "..." : ""),
      });
    }

    return highlights;
  }

  private highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${this.escapeRegex(query)})`, "gi");
    return text.replace(regex, '<mark class="bg-yellow-200 px-0.5">$1</mark>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async getFullArticle(articleId: string): Promise<Article | null> {
    // Lazy load full data
    if (!this.fullData) {
      console.time("Load full BCBC data");
      this.fullData = await fetch("/bcbc-full.json").then((r) => r.json());
      console.timeEnd("Load full BCBC data");

      // Load glossary
      if (this.fullData.glossary) {
        Object.entries(this.fullData.glossary).forEach(([key, value]) => {
          this.glossary.set(key, value);
        });
        console.log(`Loaded ${this.glossary.size} glossary terms`);
      }

      // Load cross-references
      if (this.fullData.cross_references) {
        this.loadCrossReferences(this.fullData.cross_references);
      }
    }

    return this.findArticleById(articleId, this.fullData);
  }

  async getFullContent(contentId: string): Promise<{ article: Article | null; content: any | null; contentType: 'article' | 'table' | 'figure' }> {
    // Check if this is a table or figure ID
    if (contentId.includes('.table') || contentId.includes('.figure')) {
      // Extract the parent article ID
      const parts = contentId.split('.');
      const articleIdParts = parts.slice(0, -1); // Remove the last part (table/figure identifier)
      const parentArticleId = articleIdParts.join('.');
      
      // Get the full article
      const article = await this.getFullArticle(parentArticleId);
      
      if (article) {
        // Find the specific table or figure within the article
        const content = this.findContentById(contentId, article);
        const contentType = contentId.includes('.table') ? 'table' : 'figure';
        
        return {
          article,
          content,
          contentType: contentType as 'table' | 'figure'
        };
      }
      
      return { article: null, content: null, contentType: 'article' };
    } else {
      // Regular article - make sure to get full article with breadcrumb
      const article = await this.getFullArticle(contentId);
      return {
        article,
        content: null,
        contentType: 'article'
      };
    }
  }

  private findContentById(contentId: string, article: Article): any {
    for (const content of article.content) {
      if (content.id === contentId) {
        return content;
      }
    }
    return null;
  }

  getGlossaryTerm(termId: string): any {
    return this.glossary.get(termId);
  }

  getAllGlossaryTerms(): Map<string, any> {
    return this.glossary;
  }

  private loadCrossReferences(crossRefs: any): void {
    // Load internal references
    if (crossRefs.internal_references) {
      crossRefs.internal_references.forEach((ref: any) => {
        this.crossReferences.set(ref.target_id, ref);
        // Create reverse mapping for quick lookup
        this.reverseReferences.set(ref.target_id, this.formatReferenceText(ref.target_id, ref.display_type));
      });
      console.log(`Loaded ${crossRefs.internal_references.length} internal references`);
    }
  }

  resolveReference(refId: string, displayType: 'short' | 'long' = 'short'): string {
    // Check if we have a pre-computed reference text
    const precomputed = this.reverseReferences.get(refId);
    if (precomputed) {
      return precomputed;
    }

    // Generate reference text from ID
    return this.formatReferenceText(refId, displayType);
  }

  private formatReferenceText(refId: string, displayType: 'short' | 'long' = 'short'): string {
    const parts = refId.split('.');
    
    if (parts.length < 2) {
      return refId;
    }

    // Handle different ID patterns
    if (refId.includes('.table')) {
      return this.formatTableReference(refId, displayType);
    } else if (refId.includes('.figure')) {
      return this.formatFigureReference(refId, displayType);
    } else if (refId.includes('.sent')) {
      return this.formatSentenceReference(refId, displayType);
    } else if (refId.includes('.art')) {
      return this.formatArticleReference(refId, displayType);
    } else if (refId.includes('.subsect')) {
      return this.formatSubsectionReference(refId, displayType);
    } else if (refId.includes('.sect')) {
      return this.formatSectionReference(refId, displayType);
    }

    return refId;
  }

  private formatTableReference(refId: string, _displayType: 'short' | 'long'): string {
    // Parse: nbc.divBV2.part1.sect10.subsect14.art4.table1
    const parts = refId.split('.');
    
    if (parts.length >= 7) {
      let div = parts[1].replace('div', '');
      // Handle special cases like BV2 -> B, etc.
      if (div === 'BV2') div = 'B';
      
      const part = parts[2].replace('part', '');
      const sect = parts[3].replace('sect', '');
      const subsect = parts[4].replace('subsect', '');
      const art = parts[5].replace('art', '');
      const table = parts[6].replace('table', '');

      // Format as "Table B.1.10.14.4.-A" (using the table number as a letter)
      const tableLabel = table === '1' ? 'A' : String.fromCharCode(64 + parseInt(table)); // 1->A, 2->B, etc.
      
      return `Table ${div}.${part}.${sect}.${subsect}.${art}.-${tableLabel}`;
    }

    return `Table ${refId}`;
  }

  private formatFigureReference(refId: string, _displayType: 'short' | 'long'): string {
    // Parse: nbc.divB.part4.sect1.subsect6.art5.figure1
    const parts = refId.split('.');
    
    if (parts.length >= 7) {
      const div = parts[1].replace('div', '');
      const part = parts[2].replace('part', '');
      const sect = parts[3].replace('sect', '');
      const subsect = parts[4].replace('subsect', '');
      const art = parts[5].replace('art', '');
      const figure = parts[6].replace('figure', '');

      return `Figure ${div}.${part}.${sect}.${subsect}.${art}.-${figure}`;
    }

    return `Figure ${refId}`;
  }

  private formatSentenceReference(refId: string, displayType: 'short' | 'long'): string {
    // Parse: nbc.divBV2.part1.sect10.subsect14.art4.sent1
    const parts = refId.split('.');
    
    if (parts.length >= 7) {
      const sent = parts[6].replace('sent', '');
      
      if (displayType === 'long') {
        const div = parts[1].replace('div', '').replace('BV2', 'B');
        const part = parts[2].replace('part', '');
        const sect = parts[3].replace('sect', '');
        const subsect = parts[4].replace('subsect', '');
        const art = parts[5].replace('art', '');
        
        return `Sentence (${sent}) of Article ${div}.${part}.${sect}.${subsect}.${art}.`;
      } else {
        return `Sentence (${sent})`;
      }
    }

    return `Sentence ${refId}`;
  }

  // Special method to handle sentence ranges and complex references
  resolveSentenceRange(startSent: number, endSent: number): string {
    if (startSent === endSent) {
      return `Sentence (${startSent})`;
    } else {
      return `Sentences (${startSent}) to (${endSent})`;
    }
  }

  private formatArticleReference(refId: string, displayType: 'short' | 'long'): string {
    // Parse: nbc.divB.part3.sect2.subsect1.art4
    const parts = refId.split('.');
    
    if (parts.length >= 6) {
      const div = parts[1].replace('div', '').replace('BV2', 'B');
      const part = parts[2].replace('part', '');
      const sect = parts[3].replace('sect', '');
      const subsect = parts[4].replace('subsect', '');
      const art = parts[5].replace('art', '');

      if (displayType === 'long') {
        return `Article ${div}.${part}.${sect}.${subsect}.${art}.`;
      } else {
        return `Article ${div}.${part}.${sect}.${subsect}.${art}.`;
      }
    }

    return `Article ${refId}`;
  }

  private formatSubsectionReference(refId: string, displayType: 'short' | 'long'): string {
    // Parse: nbc.divB.part3.sect2.subsect1
    const parts = refId.split('.');
    
    if (parts.length >= 5) {
      const div = parts[1].replace('div', '').replace('BV2', 'B');
      const part = parts[2].replace('part', '');
      const sect = parts[3].replace('sect', '');
      const subsect = parts[4].replace('subsect', '');

      if (displayType === 'long') {
        return `Subsection ${div}.${part}.${sect}.${subsect}.`;
      } else {
        return `Subsection ${div}.${part}.${sect}.${subsect}.`;
      }
    }

    return `Subsection ${refId}`;
  }

  private formatSectionReference(refId: string, displayType: 'short' | 'long'): string {
    // Parse: nbc.divB.part3.sect2
    const parts = refId.split('.');
    
    if (parts.length >= 4) {
      const div = parts[1].replace('div', '').replace('BV2', 'B');
      const part = parts[2].replace('part', '');
      const sect = parts[3].replace('sect', '');

      if (displayType === 'long') {
        return `Section ${div}.${part}.${sect}.`;
      } else {
        return `Section ${div}.${part}.${sect}.`;
      }
    }

    return `Section ${refId}`;
  }

  private findArticleById(id: string, data: any): Article | null {
    // Parse ID: "nbc.divA.part1.sect1.subsect1.art1"
    const parts = id.split(".");

    try {
      const division = data.divisions.find(
        (d: any) => d.id === `${parts[0]}.${parts[1]}`,
      );
      if (!division) return null;

      const part = division.parts.find(
        (p: any) => p.id === `${parts[0]}.${parts[1]}.${parts[2]}`,
      );
      if (!part) return null;

      const section = part.sections.find((s: any) =>
        s.id === `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}`,
      );
      if (!section) return null;

      const subsection = section.subsections.find((ss: any) =>
        ss.id === `${parts[0]}.${parts[1]}.${parts[2]}.${parts[3]}.${parts[4]}`,
      );
      if (!subsection) return null;

      const article = subsection.articles.find((a: any) => a.id === id);

      if (article) {
        // Attach breadcrumb information to the article
        (article as any).breadcrumb = {
          division: `Division ${division.letter}`,
          divisionTitle: division.title,
          part: `Part ${part.number}`,
          partTitle: part.title,
          section: `Section ${section.number}`,
          sectionTitle: section.title,
          subsection: `Subsection ${subsection.number}`,
          subsectionTitle: subsection.title,
        };
      }

      return article || null;
    } catch (error) {
      console.error("Error finding article:", error);
      return null;
    }
  }

  getMetadata(): SearchMetadata | null {
    return this.metadata;
  }

  async getSuggestions(partial: string, limit: number = 10): Promise<string[]> {
    if (!this.initialized || partial.length < 2) {
      return [];
    }

    const results = await this.search(partial, { limit });
    return results.map((r) => r.document.title).slice(0, limit);
  }
}

// Export singleton instance
export const searchService = new BCBCSearchService();
