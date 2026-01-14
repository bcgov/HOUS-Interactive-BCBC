import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FlexSearch from 'flexsearch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SearchDocument {
  id: string;
  type: 'article' | 'table' | 'figure' | 'part' | 'section' | 'subsection';
  articleNumber: string;
  title: string;
  text: string;
  divisionId: string;
  divisionLetter: string;
  divisionTitle: string;
  partId: string;
  partNumber: number;
  partTitle: string;
  sectionId: string;
  sectionNumber: number;
  sectionTitle: string;
  subsectionId: string;
  subsectionNumber: number;
  subsectionTitle: string;
  path: string;
  breadcrumbs: string[];
  hasAmendment: boolean;
  amendmentType?: 'add' | 'replace' | 'delete';
  hasInternalRefs: boolean;
  hasExternalRefs: boolean;
  hasStandardRefs: boolean;
  hasTermRefs: boolean;
  hasTables: boolean;
  hasFigures: boolean;
  hasObjectives: boolean;
  searchPriority: number;
}

interface RevisionDate {
  effectiveDate: string;
  displayDate: string;
  count: number;
  type: 'mixed' | 'original' | 'amendment';
}

interface TableOfContentsItem {
  id: string;
  type: 'division' | 'part' | 'section' | 'subsection' | 'article';
  number: string | number;
  title: string;
  level: number;
  children?: TableOfContentsItem[];
  hasRevisions?: boolean;
}

class BCBCIndexBuilder {
  private documents: SearchDocument[] = [];
  private revisionDates: Map<string, { count: number; types: Set<string> }> = new Map();
  private tableOfContents: TableOfContentsItem[] = [];
  
  build(bcbcJsonPath: string, outputDir: string) {
    console.log('Loading BCBC JSON...');
    
    let bcbcData: any;
    try {
      bcbcData = JSON.parse(fs.readFileSync(bcbcJsonPath, 'utf-8'));
    } catch (error) {
      console.error('Error reading BCBC JSON:', error);
      // Create sample data
      bcbcData = this.createSampleData();
      console.log('Using sample data');
    }
    
    console.log('Scanning for revision dates...');
    this.scanRevisionDates(bcbcData);
    
    console.log('Building table of contents...');
    this.buildTableOfContents(bcbcData);
    
    console.log('Flattening structure...');
    this.flattenStructure(bcbcData);
    
    console.log(`Indexed ${this.documents.length} documents`);
    console.log(`Found ${this.revisionDates.size} unique revision dates`);
    console.log(`Built table of contents with ${this.tableOfContents.length} top-level items`);
    
    console.log('Exporting documents...');
    this.exportDocuments(outputDir);
    
    console.log('Generating metadata...');
    this.generateMetadata(bcbcData, outputDir);
    
    console.log('Build complete!');
  }
  
  private scanRevisionDates(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    // Check if this object has revisions
    if (obj.revisions && Array.isArray(obj.revisions)) {
      obj.revisions.forEach((revision: any) => {
        if (revision.effective_date) {
          const existing = this.revisionDates.get(revision.effective_date) || { count: 0, types: new Set() };
          existing.count++;
          existing.types.add(revision.type || 'unknown');
          this.revisionDates.set(revision.effective_date, existing);
        }
      });
    }

    // Recursively check all properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (Array.isArray(value)) {
          value.forEach(item => this.scanRevisionDates(item));
        } else if (typeof value === 'object') {
          this.scanRevisionDates(value);
        }
      }
    }
  }

  private buildTableOfContents(bcbcData: any): void {
    this.tableOfContents = bcbcData.divisions.map((division: any) => {
      const divisionItem: TableOfContentsItem = {
        id: division.id,
        type: 'division',
        number: division.letter,
        title: division.title,
        level: 0,
        children: division.parts?.map((part: any) => {
          const partItem: TableOfContentsItem = {
            id: part.id,
            type: 'part',
            number: part.number,
            title: part.title,
            level: 1,
            children: part.sections?.map((section: any) => {
              const sectionItem: TableOfContentsItem = {
                id: section.id,
                type: 'section',
                number: section.number,
                title: section.title,
                level: 2,
                children: section.subsections?.map((subsection: any) => {
                  const subsectionItem: TableOfContentsItem = {
                    id: subsection.id,
                    type: 'subsection',
                    number: subsection.number,
                    title: subsection.title,
                    level: 3,
                    children: subsection.articles?.map((article: any) => ({
                      id: article.id,
                      type: 'article' as const,
                      number: article.number,
                      title: article.title,
                      level: 4,
                      hasRevisions: this.hasRevisions(article)
                    }))
                  };
                  subsectionItem.hasRevisions = this.hasRevisions(subsection) || 
                    subsectionItem.children?.some(child => child.hasRevisions);
                  return subsectionItem;
                })
              };
              sectionItem.hasRevisions = this.hasRevisions(section) || 
                sectionItem.children?.some(child => child.hasRevisions);
              return sectionItem;
            })
          };
          partItem.hasRevisions = this.hasRevisions(part) || 
            partItem.children?.some(child => child.hasRevisions);
          return partItem;
        })
      };
      divisionItem.hasRevisions = this.hasRevisions(division) || 
        divisionItem.children?.some(child => child.hasRevisions);
      return divisionItem;
    });
  }

  private hasRevisions(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    
    // Check direct revisions
    if (obj.revisions && Array.isArray(obj.revisions) && obj.revisions.length > 0) {
      return true;
    }
    
    // Check content for revisions (sentences, tables, etc.)
    if (obj.content && Array.isArray(obj.content)) {
      return obj.content.some((item: any) => this.hasRevisions(item));
    }
    
    return false;
  }

  private createSampleData() {
    // Create sample BCBC data structure
    return {
      version: '2024.1',
      document_type: 'BC Building Code',
      canonical_version: 'NBC 2020 with BC Amendments',
      generated_timestamp: new Date().toISOString(),
      metadata: {
        title: 'British Columbia Building Code 2024',
        subtitle: 'Based on National Building Code of Canada 2020',
        authority: 'Province of British Columbia',
        publication_date: '2024-03-08',
        nrc_number: 'NRC-CNRC-001',
        isbn: '978-0-660-XXXXX-X',
        volumes: []
      },
      divisions: [
        {
          id: 'nbc.divA',
          type: 'division',
          letter: 'A',
          title: 'Compliance, Objectives and Functional Statements',
          number: '',
          parts: [
            {
              id: 'nbc.divA.part1',
              type: 'part',
              number: 1,
              title: 'Compliance',
              sections: [
                {
                  id: 'nbc.divA.part1.sect1',
                  type: 'section',
                  number: 1,
                  title: 'General',
                  subsections: [
                    {
                      id: 'nbc.divA.part1.sect1.subsect1',
                      type: 'subsection',
                      number: 1,
                      title: 'Application of this Code',
                      articles: [
                        {
                          id: 'nbc.divA.part1.sect1.subsect1.art1',
                          type: 'article',
                          number: 1,
                          title: 'Application of this Code',
                          content: [
                            {
                              id: 'nbc.divA.part1.sect1.subsect1.art1.sent1',
                              type: 'sentence',
                              number: 1,
                              text: 'This Code applies to the design and construction of new buildings, occupancy of buildings, and changes in occupancy.',
                              clauses: []
                            }
                          ]
                        },
                        {
                          id: 'nbc.divA.part1.sect1.subsect1.art2',
                          type: 'article',
                          number: 2,
                          title: 'Compliance Options',
                          content: [
                            {
                              id: 'nbc.divA.part1.sect1.subsect1.art2.sent1',
                              type: 'sentence',
                              number: 1,
                              text: 'Compliance with this Code can be achieved through acceptable solutions or alternative solutions.',
                              clauses: []
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'nbc.divB',
          type: 'division',
          letter: 'B',
          title: 'Acceptable Solutions',
          number: '',
          parts: [
            {
              id: 'nbc.divB.part3',
              type: 'part',
              number: 3,
              title: 'Fire Protection, Occupant Safety and Accessibility',
              sections: [
                {
                  id: 'nbc.divB.part3.sect3',
                  type: 'section',
                  number: 3,
                  title: 'Safety within Floor Areas',
                  subsections: [
                    {
                      id: 'nbc.divB.part3.sect3.subsect2',
                      type: 'subsection',
                      number: 2,
                      title: 'Fire Separations',
                      articles: [
                        {
                          id: 'nbc.divB.part3.sect3.subsect2.art1',
                          type: 'article',
                          number: 1,
                          title: 'Fire Separation Requirements',
                          content: [
                            {
                              id: 'nbc.divB.part3.sect3.subsect2.art1.sent1',
                              type: 'sentence',
                              number: 1,
                              text: 'Fire separations shall have fire-resistance ratings as required by this Subsection.',
                              clauses: []
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      cross_references: {
        internal_references: [],
        external_references: [],
        standard_references: [],
        term_references: []
      },
      bc_amendments: [
        {
          location_id: 'nbc.divA.part1.sect1.subsect1.art1',
          type: 'amendment',
          revision_type: 'replace',
          content: 'BC-specific amendment text',
          date: '2024-03-08',
          status: 'active'
        }
      ],
      glossary: {},
      statistics: {
        total_divisions: 2,
        total_parts: 2,
        total_sections: 2,
        total_articles: 3,
        total_sentences: 3,
        total_tables: 0,
        total_figures: 0
      }
    };
  }
  
  private flattenStructure(bcbcData: any) {
    const amendmentMap = new Map<string, any>();
    if (bcbcData.bc_amendments) {
      bcbcData.bc_amendments.forEach((amendment: any) => {
        amendmentMap.set(amendment.location_id, amendment);
      });
    }
    
    bcbcData.divisions.forEach((division: any) => {
      division.parts.forEach((part: any) => {
        // Add part to search index
        const partDoc = this.createPartSearchDocument(division, part, amendmentMap);
        this.documents.push(partDoc);
        
        part.sections.forEach((section: any) => {
          // Add section to search index
          const sectionDoc = this.createSectionSearchDocument(division, part, section, amendmentMap);
          this.documents.push(sectionDoc);
          
          section.subsections.forEach((subsection: any) => {
            // Add subsection to search index
            const subsectionDoc = this.createSubsectionSearchDocument(division, part, section, subsection, amendmentMap);
            this.documents.push(subsectionDoc);
            
            subsection.articles.forEach((article: any) => {
              // Add the article itself
              const articleDoc = this.createSearchDocument(
                division, part, section, subsection, article,
                amendmentMap
              );
              this.documents.push(articleDoc);
              
              // Add tables and figures within the article
              if (article.content) {
                article.content.forEach((content: any) => {
                  if (content.type === 'table' || content.type === 'figure') {
                    const contentDoc = this.createContentSearchDocument(
                      division, part, section, subsection, article, content,
                      amendmentMap
                    );
                    this.documents.push(contentDoc);
                  }
                });
              }
            });
          });
        });
      });
    });
  }
  
  private createPartSearchDocument(
    division: any,
    part: any,
    amendmentMap: Map<string, any>
  ): SearchDocument {
    const amendment = amendmentMap.get(part.id);
    
    return {
      id: part.id,
      type: 'part',
      articleNumber: `${division.letter}.${part.number}`,
      title: part.title,
      text: part.title,
      
      divisionId: division.id,
      divisionLetter: division.letter,
      divisionTitle: division.title,
      partId: part.id,
      partNumber: part.number,
      partTitle: part.title,
      sectionId: '',
      sectionNumber: 0,
      sectionTitle: '',
      subsectionId: '',
      subsectionNumber: 0,
      subsectionTitle: '',
      
      path: `Division ${division.letter} > Part ${part.number}`,
      breadcrumbs: [
        division.title,
        part.title
      ],
      
      hasAmendment: !!amendment,
      amendmentType: amendment?.revision_type,
      hasInternalRefs: false,
      hasExternalRefs: false,
      hasStandardRefs: false,
      hasTermRefs: false,
      
      hasTables: false,
      hasFigures: false,
      hasObjectives: false,
      
      searchPriority: 10 // High priority for navigation
    };
  }

  private createSectionSearchDocument(
    division: any,
    part: any,
    section: any,
    amendmentMap: Map<string, any>
  ): SearchDocument {
    const amendment = amendmentMap.get(section.id);
    
    return {
      id: section.id,
      type: 'section',
      articleNumber: `${division.letter}.${part.number}.${section.number}`,
      title: section.title,
      text: section.title,
      
      divisionId: division.id,
      divisionLetter: division.letter,
      divisionTitle: division.title,
      partId: part.id,
      partNumber: part.number,
      partTitle: part.title,
      sectionId: section.id,
      sectionNumber: section.number,
      sectionTitle: section.title,
      subsectionId: '',
      subsectionNumber: 0,
      subsectionTitle: '',
      
      path: `Division ${division.letter} > Part ${part.number} > Section ${section.number}`,
      breadcrumbs: [
        division.title,
        part.title,
        section.title
      ],
      
      hasAmendment: !!amendment,
      amendmentType: amendment?.revision_type,
      hasInternalRefs: false,
      hasExternalRefs: false,
      hasStandardRefs: false,
      hasTermRefs: false,
      
      hasTables: false,
      hasFigures: false,
      hasObjectives: false,
      
      searchPriority: 9 // High priority for navigation
    };
  }

  private createSubsectionSearchDocument(
    division: any,
    part: any,
    section: any,
    subsection: any,
    amendmentMap: Map<string, any>
  ): SearchDocument {
    const amendment = amendmentMap.get(subsection.id);
    
    return {
      id: subsection.id,
      type: 'subsection',
      articleNumber: `${division.letter}.${part.number}.${section.number}.${subsection.number}`,
      title: subsection.title,
      text: subsection.title,
      
      divisionId: division.id,
      divisionLetter: division.letter,
      divisionTitle: division.title,
      partId: part.id,
      partNumber: part.number,
      partTitle: part.title,
      sectionId: section.id,
      sectionNumber: section.number,
      sectionTitle: section.title,
      subsectionId: subsection.id,
      subsectionNumber: subsection.number,
      subsectionTitle: subsection.title,
      
      path: `Division ${division.letter} > Part ${part.number} > Section ${section.number} > Subsection ${subsection.number}`,
      breadcrumbs: [
        division.title,
        part.title,
        section.title,
        subsection.title
      ],
      
      hasAmendment: !!amendment,
      amendmentType: amendment?.revision_type,
      hasInternalRefs: false,
      hasExternalRefs: false,
      hasStandardRefs: false,
      hasTermRefs: false,
      
      hasTables: false,
      hasFigures: false,
      hasObjectives: false,
      
      searchPriority: 8 // High priority for navigation
    };
  }

  private createContentSearchDocument(
    division: any,
    part: any,
    section: any,
    subsection: any,
    article: any,
    content: any,
    amendmentMap: Map<string, any>
  ): SearchDocument {
    const amendment = amendmentMap.get(content.id);
    
    // Generate article number for the content (e.g., "B.3.2.1.5 Table 1")
    const contentNumber = content.number || content.id.split('.').pop()?.replace(/[^\d]/g, '') || '1';
    const articleNumber = `${division.letter}.${part.number}.${section.number}.${subsection.number}.${article.number}`;
    const fullContentNumber = `${articleNumber} ${content.type === 'table' ? 'Table' : 'Figure'} ${contentNumber}`;
    
    // Clean up title and extract any descriptive text
    let title = content.title || `${content.type === 'table' ? 'Table' : 'Figure'} ${contentNumber}`;
    title = title.replace(/\[REF:[^\]]+\]/g, '').trim();
    
    // For tables, try to extract column headers or other searchable text
    let searchableText = title;
    if (content.structure && content.structure.headers) {
      const headers = content.structure.headers.map((h: any) => h.text || h).join(' ');
      searchableText += ' ' + headers;
    }
    if (content.structure && content.structure.rows) {
      // Extract some text from table rows (limit to avoid too much noise)
      const rowTexts = content.structure.rows.slice(0, 3).map((row: any) => {
        if (Array.isArray(row.cells)) {
          return row.cells.map((cell: any) => cell.text || cell).join(' ');
        }
        return '';
      }).join(' ');
      searchableText += ' ' + rowTexts;
    }
    
    return {
      id: content.id,
      type: content.type as 'table' | 'figure',
      articleNumber: fullContentNumber,
      title: title,
      text: searchableText,
      
      divisionId: division.id,
      divisionLetter: division.letter,
      divisionTitle: division.title,
      partId: part.id,
      partNumber: part.number,
      partTitle: part.title,
      sectionId: section.id,
      sectionNumber: section.number,
      sectionTitle: section.title,
      subsectionId: subsection.id,
      subsectionNumber: subsection.number,
      subsectionTitle: subsection.title,
      
      path: `Division ${division.letter} > Part ${part.number} > Section ${section.number} > ${subsection.number}.${article.number} > ${content.type === 'table' ? 'Table' : 'Figure'} ${contentNumber}`,
      breadcrumbs: [
        division.title,
        part.title,
        section.title,
        subsection.title,
        article.title,
        title
      ],
      
      hasAmendment: !!amendment,
      amendmentType: amendment?.revision_type,
      hasInternalRefs: false,
      hasExternalRefs: false,
      hasStandardRefs: false,
      hasTermRefs: false,
      
      hasTables: content.type === 'table',
      hasFigures: content.type === 'figure',
      hasObjectives: false,
      
      // Give tables and figures higher priority since they're often specifically searched for
      searchPriority: !!amendment ? 9 : 7
    };
  }
  
  private createSearchDocument(
    division: any,
    part: any,
    section: any,
    subsection: any,
    article: any,
    amendmentMap: Map<string, any>
  ): SearchDocument {
    const sentences = article.content.filter((c: any) => c.type === 'sentence');
    const text = sentences.map((s: any) => {
      let sentenceText = s.text || '';
      sentenceText = sentenceText.replace(/\[REF:[^\]]+\]/g, '');
      if (s.clauses) {
        sentenceText += ' ' + s.clauses.map((c: any) => c.text).join(' ');
      }
      return sentenceText;
    }).join(' ');
    
    const amendment = amendmentMap.get(article.id);
    
    return {
      id: article.id,
      type: 'article',
      articleNumber: `${division.letter}.${part.number}.${section.number}.${subsection.number}.${article.number}`,
      title: article.title,
      text: text,
      
      divisionId: division.id,
      divisionLetter: division.letter,
      divisionTitle: division.title,
      partId: part.id,
      partNumber: part.number,
      partTitle: part.title,
      sectionId: section.id,
      sectionNumber: section.number,
      sectionTitle: section.title,
      subsectionId: subsection.id,
      subsectionNumber: subsection.number,
      subsectionTitle: subsection.title,
      
      path: `Division ${division.letter} > Part ${part.number} > Section ${section.number} > ${subsection.number}.${article.number}`,
      breadcrumbs: [
        division.title,
        part.title,
        section.title,
        subsection.title,
        article.title
      ],
      
      hasAmendment: !!amendment,
      amendmentType: amendment?.revision_type,
      hasInternalRefs: false,
      hasExternalRefs: false,
      hasStandardRefs: false,
      hasTermRefs: false,
      
      hasTables: article.content.some((c: any) => c.type === 'table'),
      hasFigures: article.content.some((c: any) => c.type === 'figure'),
      hasObjectives: false,
      
      searchPriority: !!amendment ? 8 : 5
    };
  }
  
  private exportDocuments(outputDir: string) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write documents
    const docsPath = path.join(outputDir, 'documents.json');
    fs.writeFileSync(docsPath, JSON.stringify(this.documents, null, 2));
    
    console.log(`Documents size: ${(JSON.stringify(this.documents).length / 1024).toFixed(2)}KB`);
  }
  
  private generateMetadata(bcbcData: any, outputDir: string) {
    // Process revision dates
    const revisionDates: RevisionDate[] = Array.from(this.revisionDates.entries()).map(([date, info]) => ({
      effectiveDate: date,
      displayDate: this.formatDisplayDate(date),
      count: info.count,
      type: this.determineType(info.types)
    })).sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    const metadata = {
      version: bcbcData.version,
      generatedAt: new Date().toISOString(),
      statistics: {
        totalDocuments: this.documents.length,
        totalArticles: this.documents.filter(d => d.type === 'article').length,
        totalTables: this.documents.filter(d => d.type === 'table').length,
        totalFigures: this.documents.filter(d => d.type === 'figure').length,
        totalParts: this.documents.filter(d => d.type === 'part').length,
        totalSections: this.documents.filter(d => d.type === 'section').length,
        totalSubsections: this.documents.filter(d => d.type === 'subsection').length,
        totalAmendments: this.documents.filter(d => d.hasAmendment).length,
        totalRevisionDates: revisionDates.length,
        ...bcbcData.statistics
      },
      divisions: bcbcData.divisions.map((d: any) => ({
        id: d.id,
        letter: d.letter,
        title: d.title,
        parts: d.parts.map((p: any) => ({
          id: p.id,
          number: p.number,
          title: p.title
        }))
      })),
      revisionDates: revisionDates,
      tableOfContents: this.tableOfContents
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
  }

  private formatDisplayDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  private determineType(types: Set<string>): 'mixed' | 'original' | 'amendment' {
    if (types.size > 1) return 'mixed';
    const type = Array.from(types)[0];
    if (type === 'original') return 'original';
    if (type === 'revision' || type === 'amendment') return 'amendment';
    return 'mixed';
  }
}

// CLI execution
const builder = new BCBCIndexBuilder();
const bcbcJsonPath = process.argv[2] || path.join(__dirname, '../public/bcbc-full.json');
const outputDir = process.argv[3] || path.join(__dirname, '../public/search');

console.log('BCBC Search Index Builder');
console.log('=========================');
console.log(`Input: ${bcbcJsonPath}`);
console.log(`Output: ${outputDir}`);
console.log('');

builder.build(bcbcJsonPath, outputDir);
