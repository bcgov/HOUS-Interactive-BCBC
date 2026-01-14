import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { SearchFilters } from './components/SearchFilters';
import { SearchResults } from './components/SearchResults';
import { ArticleViewer } from './components/ArticleViewer';
import { TableOfContents } from './components/TableOfContents';
import { SidebarTabs } from './components/SidebarTabs';
import { useAppStore } from './store/appStore';
import { searchService } from './services/searchService';
import { AlertCircle } from 'lucide-react';

function App() {
  const { sidebarOpen, setMetadata, metadata } = useAppStore();
  const [initError, setInitError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'toc'>('search');
  
  useEffect(() => {
    async function initializeApp() {
      try {
        await searchService.initialize();
        const metadata = searchService.getMetadata();
        if (metadata) {
          setMetadata(metadata);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError('Failed to load search index. Please refresh the page.');
      } finally {
        setInitializing(false);
      }
    }
    
    initializeApp();
  }, [setMetadata]);
  
  if (initializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading BC Building Code 2024...</p>
          <p className="text-gray-500 text-sm mt-2">Initializing search index</p>
        </div>
      </div>
    );
  }
  
  if (initError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Initialization Error
          </h2>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Search Panel */}
        <aside
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
            fixed lg:relative
            z-30 lg:z-0
            w-full lg:w-96
            h-full
            bg-white
            border-r border-gray-200
            transition-transform duration-300
            flex flex-col
          `}
        >
          {/* Sidebar Tabs */}
          <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          {/* Search Tab Content */}
          {activeTab === 'search' && (
            <>
              {/* Search Section */}
              <div className="flex-shrink-0 p-4 space-y-4 border-b border-gray-200">
                <SearchBar />
                <SearchFilters />
              </div>
              
              {/* Results Section */}
              <div className="flex-1 overflow-y-auto p-4">
                <SearchResults />
              </div>
            </>
          )}
          
          {/* Table of Contents Tab Content */}
          {activeTab === 'toc' && metadata?.tableOfContents && (
            <div className="flex-1 overflow-hidden">
              <TableOfContents items={metadata.tableOfContents} />
            </div>
          )}
        </aside>
        
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => useAppStore.setState({ sidebarOpen: false })}
          />
        )}
        
        {/* Main Content - Article Viewer */}
        <main className="flex-1 overflow-hidden">
          <ArticleViewer />
        </main>
      </div>
    </div>
  );
}

export default App;
