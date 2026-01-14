# BC Building Code 2024 - Search & Navigation Application

A modern, fast, and intuitive web application for searching and navigating the British Columbia Building Code 2024.

## Features

- **Fast Full-Text Search**: Powered by FlexSearch for sub-50ms search results
- **Smart Filtering**: Filter by division, part, section, and content type
- **Article Number Lookup**: Direct navigation via article numbers (e.g., A.1.1.1.1)
- **BC Amendments Highlighting**: Clearly marked BC-specific amendments
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Clean UI**: Modern interface with Tailwind CSS
- **Optimized Performance**: Efficient indexing for ~20MB JSON files

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Search**: FlexSearch (client-side full-text search)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm

## Installation

1. Extract the zip file:
```bash
unzip bcbc-search-app.zip
cd bcbc-search-app
```

2. Install dependencies:
```bash
npm install
```

3. Build the search index:

**Option A: With your BCBC JSON file**
```bash
# Place your bcbc-2024.json in the public folder
npm run build:index public/bcbc-full.json public/search
```

**Option B: Use sample data (for testing)**
```bash
# The build script will automatically create sample data
npm run build:index
```

4. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Project Structure

```
bcbc-search-app/
├── public/
│   ├── search/              # Generated search index files
│   │   ├── documents.json   # Flattened search documents
│   │   └── metadata.json    # Metadata and statistics
│   └── bcbc-full.json       # Full BCBC data (place your file here)
├── scripts/
│   └── build-search-index.ts # Index builder script
├── src/
│   ├── components/           # React components
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SearchFilters.tsx
│   │   ├── SearchResults.tsx
│   │   └── ArticleViewer.tsx
│   ├── services/
│   │   └── searchService.ts  # Search service with FlexSearch
│   ├── store/
│   │   └── appStore.ts       # Zustand state management
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Building Your Search Index

To use your actual BCBC 2024 JSON file:

1. Place your JSON file in the `public/` directory as `bcbc-full.json`

2. Run the index builder:
```bash
npm run build:index
```

This will:
- Parse your BCBC JSON structure
- Flatten the hierarchy into searchable documents
- Generate optimized search index
- Create metadata for filters and navigation
- Output to `public/search/` directory

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

To preview the production build:
```bash
npm run preview
```

## Deployment

The built application is a static site that can be deployed to:

- **Vercel**: `vercel deploy`
- **Netlify**: Drag & drop the `dist` folder
- **GitHub Pages**: Push the `dist` folder
- **AWS S3**: Upload the `dist` folder to S3 bucket
- **Any static hosting**: Serve the `dist` folder

### Important for Deployment

Make sure to:
1. Build the search index first: `npm run build:index`
2. Then build the app: `npm run build`
3. The `dist` folder will contain everything needed

## Usage

### Searching

1. **Keyword Search**: Enter any term (e.g., "fire separation", "building height")
2. **Article Number**: Enter article number directly (e.g., "A.1.1.1.1")
3. **Filters**: 
   - Filter by Division (A, B, C)
   - Filter by Part
   - Show only BC Amendments
   - Show only articles with tables

### Viewing Articles

- Click any search result to view the full article
- Navigate through sentences, clauses, and subclauses
- View tables, figures, and notes
- See BC amendment indicators

## Customization

### Styling

Edit `tailwind.config.js` to customize colors, fonts, etc:

```js
theme: {
  extend: {
    colors: {
      primary: {
        // Customize primary color
      }
    }
  }
}
```

### Search Configuration

Edit `src/services/searchService.ts` to adjust search behavior:

- Field weights (boost title vs content)
- Resolution (search precision)
- Context depth (contextual search)

### Adding Features

The codebase is modular and well-typed. To add features:

1. Add types to `src/types/index.ts`
2. Update store in `src/store/appStore.ts`
3. Create/modify components in `src/components/`
4. Update search service if needed

## Performance

- **Initial Load**: ~500ms (loads 3-4MB compressed index)
- **Search**: < 50ms for most queries
- **Article Load**: < 100ms (lazy loads from 20MB JSON)
- **Memory**: ~30MB for full index in memory

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Search index not loading

1. Check that `public/search/documents.json` exists
2. Verify `public/search/metadata.json` exists
3. Run `npm run build:index` again

### No search results

1. Verify your BCBC JSON matches the expected schema
2. Check browser console for errors
3. Ensure the index was built successfully

### Slow performance

1. Check JSON file size (should be ~20MB or less)
2. Verify search index was built (not searching raw JSON)
3. Check browser DevTools for memory issues

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## License

This project is provided as-is for use with the BC Building Code 2024.

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify all files are properly generated
3. Ensure Node.js version is 18+

## Future Enhancements

Potential features to add:
- Bookmark/favorite articles
- Export to PDF
- Print-friendly view
- Advanced search operators (AND, OR, NOT)
- Search history
- Offline support with service worker
- Cross-reference navigation
- Glossary term lookup
