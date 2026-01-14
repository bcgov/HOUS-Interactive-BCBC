# FlexSearch Architecture Documentation

## Overview

The BCBC (British Columbia Building Code) application uses FlexSearch to provide fast, in-memory full-text search capabilities across building code articles. The search system is designed for instant response times by loading all search data into memory during initialization.

## Architecture Components

### 1. Index Building Phase

**File**: `scripts/build-search-index.ts`

The build script processes the complete BCBC JSON data and creates optimized search documents:

- **Input**: `public/bcbc-full.json` (complete building code data)
- **Processing**: Flattens hierarchical structure into searchable documents
- **Output**: 
  - `public/search/documents.json` (2,099 search documents)
  - `public/search/metadata.json` (statistics and structure info)

#### Document Structure
Each search document contains:
```typescript
interface SearchDocument {
  id: string;                    // Canonical ID (e.g., "nbc.divA.part1.sect1.subsect1.art1")
  type: 'article' | 'table' | 'figure';
  articleNumber: string;         // Human-readable number (e.g., "A.1.1.1.1")
  title: string;                 // Article title
  text: string;                  // Full text content (references stripped)
  
  // Hierarchical context
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
  
  // Navigation
  path: string;                  // Breadcrumb path
  breadcrumbs: string[];         // Array of titles for navigation
  
  // Content flags
  hasAmendment: boolean;         // BC-specific amendments
  amendmentType?: 'add' | 'replace' | 'delete';
  hasInternalRefs: boolean;
  hasExternalRefs: boolean;
  hasStandardRefs: boolean;
  hasTermRefs: boolean;
  hasTables: boolean;
  hasFigures: boolean;
  hasObjectives: boolean;
  
  searchPriority: number;        // Boost factor (8 for amendments, 5 for regular)
}
```

### 2. Runtime Search Service

**File**: `src/services/searchService.ts`

The search service manages the in-memory FlexSearch index and provides search functionality.

#### Initialization Process
1. **HTTP Requests**: Downloads `documents.json` and `metadata.json`
2. **Index Creation**: Creates FlexSearch Document index in memory
3. **Document Loading**: Adds all 2,099 documents to the index
4. **Ready State**: Search becomes available instantly

#### FlexSearch Configuration
```typescript
new FlexSearch.Document({
  tokenize: "forward",           // Progressive tokenization
  optimize: true,                // Enable optimizations
  resolution: 9,                 // High precision scoring
  cache: 100,                    // Cache recent queries
  context: {
    depth: 2,                    // Context window size
    bidirectional: true,         // Bidirectional context
    resolution: 9,               // Context precision
  },
  document: {
    id: "id",
    index: [
      { field: "articleNumber", tokenize: "strict", resolution: 9 },    // Exact matching
      { field: "title", tokenize: "forward", resolution: 9 },           // High precision
      { field: "text", tokenize: "forward", resolution: 5 },            // Medium precision
      { field: "path", tokenize: "forward", resolution: 3 }             // Lower precision
    ]
  }
})
```

## Memory Storage Strategy

### In-Memory Components

1. **FlexSearch Index**: 
   - Inverted indexes for 4 fields per document
   - Optimized data structures for fast retrieval
   - Approximately 2,099 documents × 4 fields

2. **Documents Map**: 
   - Complete SearchDocument objects stored in Map<string, SearchDocument>
   - Enables instant document retrieval by ID
   - Used for result enrichment and filtering

3. **Lazy-Loaded Data**:
   - **Full BCBC Data**: Loaded only when viewing complete articles
   - **Glossary Terms**: Loaded on-demand for term definitions

### Memory Usage Estimation

| Component | Size | Description |
|-----------|------|-------------|
| Search Documents | ~2MB | 2,099 flattened search documents |
| FlexSearch Index | ~3-5MB | Inverted indexes for 4 fields |
| Full BCBC Data | ~8-12MB | Complete hierarchical data (lazy-loaded) |
| Glossary | ~500KB | Term definitions (lazy-loaded) |
| **Total Initial** | **~5-7MB** | **Loaded during initialization** |

## Search Features

### Multi-Field Search
- **Article Numbers**: Exact matching with highest priority (score × 10)
- **Titles**: High precision matching (score × 5)
- **Content Text**: Full-text search (score × 1)
- **Breadcrumb Paths**: Context-aware search (score × 2)

### Smart Scoring Algorithm
```typescript
// Base score from field matches
let score = fieldScores.reduce((sum, s) => sum + s, 0);

// Priority boost
score *= doc.searchPriority / 5;

// Amendment boost
if (doc.hasAmendment) score *= 1.5;

// Exact phrase boost
if (doc.title.toLowerCase().includes(query.toLowerCase())) {
  score *= 2;
}
```

### Advanced Features
- **Article Number Recognition**: Direct lookup for patterns like "A.1.1.1.1"
- **Contextual Highlighting**: Generates highlighted snippets with surrounding context
- **Filter Support**: Division, part, section, amendments-only, tables-only
- **Pagination**: Efficient offset/limit handling
- **Auto-suggestions**: Real-time query suggestions

## Performance Characteristics

### Advantages
- **Instant Search**: No network latency after initialization
- **Offline Capable**: Works without server connection
- **Scalable**: Handles 2,000+ documents efficiently
- **Rich Features**: Multi-field search, highlighting, filtering

### Trade-offs
- **Initial Load Time**: ~2-3 seconds to download and index
- **Memory Usage**: ~5-7MB baseline, up to ~15MB with full data
- **Update Frequency**: Requires rebuild for content changes

## Usage Patterns

### Typical Search Flow
1. User enters query in search bar
2. Service checks if query matches article number pattern
3. If not, performs multi-field FlexSearch query
4. Results are scored, filtered, and paginated
5. Highlights are generated for matched terms
6. Results displayed with breadcrumb navigation

### Initialization Flow
```typescript
// Automatic initialization on first search
await searchService.initialize();

// Search becomes available
const results = await searchService.search("fire separation");
```

## Future Considerations

### Potential Optimizations
- **Web Workers**: Move search processing to background thread
- **IndexedDB**: Persist index locally to reduce initialization time
- **Incremental Updates**: Support partial index updates
- **Compression**: Compress search documents for faster download

### Scalability Limits
- **Document Count**: Current architecture scales to ~10,000 documents
- **Memory Constraints**: Mobile devices may struggle with larger datasets
- **Network Bandwidth**: Initial download time increases with dataset size

## Technical Dependencies

- **FlexSearch**: v0.7.x - Core search engine
- **TypeScript**: Type safety for search interfaces
- **Fetch API**: Document loading from static files
- **Map/Set**: Efficient data structures for document storage

This architecture provides a robust, fast search experience optimized for the building code domain while maintaining reasonable resource usage.