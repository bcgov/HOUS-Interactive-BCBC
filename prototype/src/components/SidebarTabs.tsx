import { Search, List } from 'lucide-react';

interface SidebarTabsProps {
  activeTab: 'search' | 'toc';
  onTabChange: (tab: 'search' | 'toc') => void;
}

export function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps) {
  return (
    <div className="flex border-b border-gray-200 bg-white">
      <button
        onClick={() => onTabChange('search')}
        className={`
          flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
          transition-colors border-b-2
          ${activeTab === 'search' 
            ? 'text-blue-600 border-blue-600 bg-blue-50' 
            : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
          }
        `}
      >
        <Search className="w-4 h-4" />
        Search
      </button>
      
      <button
        onClick={() => onTabChange('toc')}
        className={`
          flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
          transition-colors border-b-2
          ${activeTab === 'toc' 
            ? 'text-blue-600 border-blue-600 bg-blue-50' 
            : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
          }
        `}
      >
        <List className="w-4 h-4" />
        Contents
      </button>
    </div>
  );
}