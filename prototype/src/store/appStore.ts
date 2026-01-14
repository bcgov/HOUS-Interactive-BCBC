import { create } from 'zustand';
import type { SearchResult, SearchOptions, SearchMetadata, Article } from '@/types';

interface AppState {
  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  searchLoading: boolean;
  searchOptions: SearchOptions;
  
  // UI state
  selectedArticleId: string | null;
  selectedArticle: Article | null;
  selectedContent: any | null;
  selectedContentType: 'article' | 'table' | 'figure' | 'part' | 'section' | 'subsection';
  selectedContentData: any | null; // For storing part/section/subsection data
  highlightedContentId: string | null;
  articleLoading: boolean;
  sidebarOpen: boolean;
  
  // Revision state
  globalRevisionDate: string | null;
  
  // Metadata
  metadata: SearchMetadata | null;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSearchLoading: (loading: boolean) => void;
  setSearchOptions: (options: Partial<SearchOptions>) => void;
  resetSearchOptions: () => void;
  
  setSelectedArticleId: (id: string | null) => void;
  setSelectedArticle: (article: Article | null) => void;
  setSelectedContent: (content: any | null) => void;
  setSelectedContentType: (type: 'article' | 'table' | 'figure' | 'part' | 'section' | 'subsection') => void;
  setSelectedContentData: (data: any | null) => void;
  setHighlightedContentId: (id: string | null) => void;
  setArticleLoading: (loading: boolean) => void;
  
  setGlobalRevisionDate: (date: string | null) => void;
  
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  setMetadata: (metadata: SearchMetadata) => void;
}

const defaultSearchOptions: SearchOptions = {
  divisionFilter: undefined,
  partFilter: undefined,
  sectionFilter: undefined,
  amendmentsOnly: false,
  tablesOnly: false,
  figuresOnly: false,
  limit: 50,
  offset: 0,
};

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  searchOptions: { ...defaultSearchOptions },
  
  selectedArticleId: null,
  selectedArticle: null,
  selectedContent: null,
  selectedContentType: 'article',
  selectedContentData: null,
  highlightedContentId: null,
  articleLoading: false,
  sidebarOpen: true,
  
  globalRevisionDate: null,
  
  metadata: null,
  
  // Actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSearchResults: (results) => set({ searchResults: results }),
  
  setSearchLoading: (loading) => set({ searchLoading: loading }),
  
  setSearchOptions: (options) => 
    set((state) => ({ 
      searchOptions: { ...state.searchOptions, ...options } 
    })),
  
  resetSearchOptions: () => 
    set({ searchOptions: { ...defaultSearchOptions } }),
  
  setSelectedArticleId: (id) => set({ selectedArticleId: id }),
  
  setSelectedArticle: (article) => set({ selectedArticle: article }),
  
  setSelectedContent: (content) => set({ selectedContent: content }),
  
  setSelectedContentType: (type) => set({ selectedContentType: type }),
  
  setSelectedContentData: (data) => set({ selectedContentData: data }),
  
  setHighlightedContentId: (id) => set({ highlightedContentId: id }),
  
  setArticleLoading: (loading) => set({ articleLoading: loading }),
  
  setGlobalRevisionDate: (date) => set({ globalRevisionDate: date }),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setMetadata: (metadata) => set({ metadata }),
}));
