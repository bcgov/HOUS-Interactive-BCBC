import { useState, useEffect } from 'react';
import { ChevronDown, Calendar, Info } from 'lucide-react';
import type { Article } from '@/types';
import { RevisionManager } from '@/lib/revisionManager';

interface RevisionDropdownProps {
  article: Article;
  selectedDate: string | null;
  onDateChange: (date: string | null) => void;
}

export function RevisionDropdown({ article, selectedDate, onDateChange }: RevisionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableDates = RevisionManager.getAvailableDates(article);

  // Set default selected date if none is selected
  useEffect(() => {
    if (!selectedDate && availableDates.length > 0) {
      onDateChange(availableDates[0].effectiveDate);
    }
  }, [selectedDate, availableDates, onDateChange]);

  if (!RevisionManager.hasRevisions(article)) {
    return null;
  }

  const selectedRevisionInfo = availableDates.find(info => info.effectiveDate === selectedDate);
  const changeSummary = selectedDate ? RevisionManager.getChangeSummary(article, selectedDate) : null;

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
      >
        <Calendar className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-800">
          {selectedRevisionInfo ? selectedRevisionInfo.displayDate : 'Select Revision'}
        </span>
        <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Document Revisions</h3>
              <p className="text-xs text-gray-500">Select an effective date to view content</p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {availableDates.map((revisionInfo) => {
                const isSelected = revisionInfo.effectiveDate === selectedDate;
                const revision = revisionInfo.revision;
                
                return (
                  <button
                    key={revisionInfo.effectiveDate}
                    onClick={() => {
                      onDateChange(revisionInfo.effectiveDate);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-green-50 border-r-2 border-green-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-green-800' : 'text-gray-900'
                          }`}>
                            {revisionInfo.displayDate}
                          </span>
                          {revision.type === 'revision' && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Rev {revision.sequence || ''}
                            </span>
                          )}
                          {revision.type === 'original' && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                              Original
                            </span>
                          )}
                        </div>
                        
                        {revision.change_summary && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {revision.change_summary}
                          </p>
                        )}
                        
                        {revision.note && (
                          <p className="text-xs text-blue-600 mt-1">
                            {revision.note}
                          </p>
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Change Summary Display */}
      {changeSummary && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Change Summary</p>
              <p className="text-sm text-blue-800 mt-1">{changeSummary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}