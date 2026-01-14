import { Menu, Book } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { GlobalRevisionDropdown } from './GlobalRevisionDropdown';

export function Header() {
  const { toggleSidebar, metadata } = useAppStore();
  
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center gap-2">
          <Book className="w-6 h-6 text-primary-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              BC Building Code 2024
            </h1>
            {metadata && (
              <p className="text-xs text-gray-500">
                Version {metadata.version}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <GlobalRevisionDropdown />
        
        {metadata && (
          <div className="hidden sm:block text-sm text-gray-600">
            {metadata.statistics.totalArticles} Articles
          </div>
        )}
      </div>
    </header>
  );
}
