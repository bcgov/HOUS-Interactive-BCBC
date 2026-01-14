# BC Building Code Interactive Web Application

A client-side search application for the 2024 British Columbia Building Code, enabling users to search, navigate, and explore building code requirements through an intuitive web interface.

## Tech Stack

- **Monorepo**: Turborepo
- **Framework**: Next.js 14+ (App Router, Static Export)
- **Language**: TypeScript
- **UI**: React 18 + Chakra UI
- **Search**: FlexSearch (client-side, pre-built indexes)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BUILD TIME                           │
│  BCBC JSON → Parser → FlexSearch Index + Content Chunks │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    RUNTIME (Client)                     │
│  Load Index → Search → Lazy Load Content → Render       │
└─────────────────────────────────────────────────────────┘
```

**No backend required** — all search and content delivery happens client-side using pre-generated static assets.

## Features

- **Full-text search** with instant results via FlexSearch
- **Hierarchical navigation** (Division → Part → Section → Article)
- **Inline glossary** with clickable term definitions
- **Effective date filtering** for viewing amendments
- **Responsive design** for desktop and mobile
- **WCAG AAA accessible**

## Project Structure

```
bc-building-code/
├── apps/web/              # Next.js application
├── packages/
│   ├── bcbc-parser/       # JSON parsing & types
│   ├── search-indexer/    # FlexSearch index generation
│   ├── content-chunker/   # Content splitting utilities
│   └── ui/                # Shared components
└── scripts/               # Build-time asset generation
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate search index and content from BCBC JSON
pnpm generate-assets

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Key Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm generate-assets` | Generate search index & content chunks |
| `pnpm lint` | Run linting |
| `pnpm test` | Run tests |

## Deployment

Static export deployed to BC Government OpenShift as containerized static assets.

## License

Copyright © Province of British Columbia