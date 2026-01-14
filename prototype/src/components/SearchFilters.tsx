import { useAppStore } from '@/store/appStore';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';

export function SearchFilters() {
  const [showFilters, setShowFilters] = useState(false);
  const { searchOptions, setSearchOptions, resetSearchOptions, metadata } = useAppStore();
  
  const hasActiveFilters = 
    searchOptions.divisionFilter ||
    searchOptions.partFilter !== undefined ||
    searchOptions.amendmentsOnly ||
    searchOptions.tablesOnly ||
    searchOptions.figuresOnly;
  
  const handleDivisionChange = (division: string) => {
    setSearchOptions({ 
      divisionFilter: division || undefined,
      partFilter: undefined // Reset part when division changes
    });
  };
  
  const handlePartChange = (part: string) => {
    setSearchOptions({ 
      partFilter: part ? parseInt(part) : undefined 
    });
  };
  
  const handleReset = () => {
    resetSearchOptions();
  };
  
  return (
    <div className="w-full">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
            Active
          </span>
        )}
      </button>
      
      {showFilters && (
        <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Search Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Division filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division
              </label>
              <select
                value={searchOptions.divisionFilter || ''}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Divisions</option>
                {metadata?.divisions.map((div) => (
                  <option key={div.id} value={div.letter}>
                    Division {div.letter} - {div.title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Part filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part
              </label>
              <select
                value={searchOptions.partFilter?.toString() || ''}
                onChange={(e) => handlePartChange(e.target.value)}
                disabled={!searchOptions.divisionFilter}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Parts</option>
                {searchOptions.divisionFilter &&
                  metadata?.divisions
                    .find((d) => d.letter === searchOptions.divisionFilter)
                    ?.parts.map((part) => (
                      <option key={part.id} value={part.number}>
                        Part {part.number} - {part.title}
                      </option>
                    ))}
              </select>
            </div>
          </div>
          
          {/* Toggle filters */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchOptions.amendmentsOnly || false}
                onChange={(e) => setSearchOptions({ amendmentsOnly: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                BC Amendments Only
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchOptions.tablesOnly || false}
                onChange={(e) => setSearchOptions({ tablesOnly: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Tables Only
              </span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchOptions.figuresOnly || false}
                onChange={(e) => setSearchOptions({ figuresOnly: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">
                Figures Only
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
