// Core BCBC Data Types
export interface BCBCData {
  document_type: string;
  version: string;
  canonical_version: string;
  generated_timestamp: string;
  metadata: Metadata;
  divisions: Division[];
  cross_references: CrossReferences;
  bc_amendments: Amendment[];
  glossary: Record<string, GlossaryTerm>;
  statistics: Statistics;
}

export interface Metadata {
  title: string;
  subtitle: string;
  authority: string;
  publication_date: string;
  nrc_number: string;
  isbn: string;
  volumes: Volume[];
}

export interface Volume {
  volume: string;
  title: string;
  subtitle: string;
}

export interface Division {
  id: string;
  type: string;
  letter: string;
  title: string;
  number: string;
  parts: Part[];
}

export interface Part {
  id: string;
  type: string;
  number: number;
  title: string;
  sections: Section[];
}

export interface Section {
  id: string;
  type: string;
  number: number;
  title: string;
  subsections: Subsection[];
}

export interface Subsection {
  id: string;
  type: string;
  number: number;
  title: string;
  articles: Article[];
}

export interface Article {
  id: string;
  type: string;
  number: number;
  title: string;
  content: Content[];
  revisions?: Revision[];
}

export interface Revision {
  type: 'original' | 'revision';
  revision_type?: 'amendment';
  revision_id?: string;
  sequence?: number;
  effective_date: string;
  status?: string;
  title: string;
  content: Content[];
  change_summary?: string;
  note?: string;
}

export interface Content {
  id: string;
  type: 'sentence' | 'table' | 'figure' | 'note' | 'objective' | 'functional_statement';
  number?: number;
  text?: string;
  clauses?: Clause[];
  title?: string;
  structure?: TableStructure;
  graphic?: Graphic;
  notes?: Note[];
  objectives?: Objective[];
  functional_statements?: FunctionalStatement[];
  revisions?: SentenceRevision[];
}

export interface SentenceRevision {
  type: 'original' | 'revision';
  revision_type?: 'amendment';
  revision_id?: string;
  sequence?: number;
  effective_date: string;
  status?: string;
  text: string;
  change_summary?: string;
  note?: string;
}

export interface Clause {
  id: string;
  type: string;
  letter: string;
  text: string;
  subclauses?: Subclause[];
}

export interface Subclause {
  id: string;
  type: string;
  number: number;
  text: string;
}

export interface TableStructure {
  columns: number;
  column_specs: ColumnSpec[];
  header_rows: TableRow[];
  body_rows: TableRow[];
}

export interface ColumnSpec {
  name: string;
  width: string;
}

export type TableRow = TableCell[];

export interface TableCell {
  content: string;
  colspan?: number;
  rowspan?: number;
}

export interface Graphic {
  src: string;
  alt_text: string;
}

export interface Note {
  id: string;
  content: string;
}

export interface Objective {
  id: string;
  key: string;
  title: string;
  definition: string;
  sub_objectives: SubObjective[];
}

export interface SubObjective {
  id: string;
  key: string;
  title: string;
  definition: string;
}

export interface FunctionalStatement {
  id: string;
  key: string;
  definition: string;
}

export interface CrossReferences {
  internal_references: InternalReference[];
  external_references: ExternalReference[];
  standard_references: StandardReference[];
  term_references: TermReference[];
}

export interface InternalReference {
  source_id: string;
  target_id: string;
  display_type: string;
  pretext?: string;
}

export interface ExternalReference {
  source_id: string;
  target: string;
  text: string;
}

export interface StandardReference {
  source_id: string;
  standard_id: string;
  text: string;
}

export interface TermReference {
  source_id: string;
  term_id: string;
  text: string;
}

export interface Amendment {
  location_id: string;
  type: string;
  content?: string;
  revision_type?: 'add' | 'replace' | 'delete';
  revision_id?: string;
  sequence?: number;
  date?: string;
  status?: string;
  added?: string;
  note?: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  location_id: string;
}

export interface Statistics {
  total_divisions: number;
  total_parts: number;
  total_sections: number;
  total_articles: number;
  total_sentences: number;
  total_tables: number;
  total_figures: number;
}

// Search Types
export interface SearchDocument {
  id: string;
  type: 'article' | 'table' | 'figure' | 'part' | 'section' | 'subsection';
  articleNumber: string;
  title: string;
  text: string;
  
  // Hierarchy
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
  
  // Display
  path: string;
  breadcrumbs: string[];
  
  // Metadata
  hasAmendment: boolean;
  amendmentType?: 'add' | 'replace' | 'delete';
  hasInternalRefs: boolean;
  hasExternalRefs: boolean;
  hasStandardRefs: boolean;
  hasTermRefs: boolean;
  
  // Content indicators
  hasTables: boolean;
  hasFigures: boolean;
  hasObjectives: boolean;
  
  // Search optimization
  searchPriority: number;
}

export interface SearchOptions {
  divisionFilter?: string;
  partFilter?: number;
  sectionFilter?: number;
  amendmentsOnly?: boolean;
  tablesOnly?: boolean;
  figuresOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  highlights?: Highlight[];
}

export interface Highlight {
  field: string;
  text: string;
}

export interface SearchMetadata {
  version: string;
  generatedAt: string;
  statistics: Statistics & {
    totalDocuments: number;
    totalArticles: number;
    totalTables: number;
    totalFigures: number;
    totalParts: number;
    totalSections: number;
    totalSubsections: number;
    totalAmendments: number;
    totalRevisionDates: number;
  };
  divisions: DivisionSummary[];
  revisionDates: RevisionDate[];
  tableOfContents: TableOfContentsItem[];
}

export interface RevisionDate {
  effectiveDate: string;
  displayDate: string;
  count: number;
  type: 'mixed' | 'original' | 'amendment';
}

export interface TableOfContentsItem {
  id: string;
  type: 'division' | 'part' | 'section' | 'subsection' | 'article';
  number: string | number;
  title: string;
  level: number;
  children?: TableOfContentsItem[];
  hasRevisions?: boolean;
}

export interface DivisionSummary {
  id: string;
  letter: string;
  title: string;
  parts: PartSummary[];
}

export interface PartSummary {
  id: string;
  number: number;
  title: string;
}
