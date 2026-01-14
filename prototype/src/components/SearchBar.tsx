import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { debounce } from '@/lib/utils';
import { searchService } from '@/services/searchService';
import { useAppStore } from '@/store/appStore';

export function SearchBar() {
  const [localQuery, setLocalQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { 
    setSearchQuery, 
    setSearchResults, 
    setSearchLoading,
    searchOptions 
  } = useAppStore();
  
  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setSuggestions([]);
        return;
      }
      
      setSearchLoading(true);
      
      try {
        const [results, suggestions] = await Promise.all([
          searchService.search(query, searchOptions),
          searchService.getSuggestions(query, 5)
        ]);
        
        setSearchResults(results);
        setSuggestions(suggestions);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300),
    [searchOptions]
  );
  
  useEffect(() => {
    debouncedSearch(localQuery);
  }, [localQuery, debouncedSearch]);
  
  const handleQueryChange = (value: string) => {
    setLocalQuery(value);
    setSearchQuery(value);
    setShowSuggestions(value.length >= 2);
  };
  
  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
    setSearchResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion);
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };
  
  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(localQuery.length >= 2 && suggestions.length > 0)}
          placeholder="Search by keyword, article number (e.g., A.1.1.1.1), or topic..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="text-sm text-gray-700">{suggestion}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
