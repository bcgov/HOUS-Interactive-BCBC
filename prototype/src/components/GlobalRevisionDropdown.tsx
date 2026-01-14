import { useState, useEffect } from 'react';
import { ChevronDown, Calendar, Info, Clock } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

export interface GlobalRevisionInfo {
  effectiveDate: string;
  displayDate: string;
  count: number;
  type: 'mixed' | 'original' | 'amendment';
}

export function GlobalRevisionDropdown() {
  const { globalRevisionDate, setGlobalRevisionDate, metadata } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState<GlobalRevisionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Load available dates from metadata
  useEffect(() => {
    if (metadata?.revisionDates) {
      setAvailableDates(metadata.revisionDates);
      
      // Set default to most recent date if none selected
      if (!globalRevisionDate && metadata.revisionDates.length > 0) {
        setGlobalRevisionDate(metadata.revisionDates[0].effectiveDate);
      }
      setLoading(false);
    }
  }, [metadata, globalRevisionDate, setGlobalRevisionDate]);

  const selectedDateInfo = availableDates.find(info => info.effectiveDate === globalRevisionDate);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <Clock className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-600">Loading dates...</span>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        title="Select document version date"
      >
        <Calendar className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">
          {selectedDateInfo ? selectedDateInfo.displayDate : 'Select Date'}
        </span>
        <ChevronDown className={`w-4 h-4 text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Document Version
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                View content as it existed on the selected date
              </p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {availableDates.map((dateInfo) => {
                const isSelected = dateInfo.effectiveDate === globalRevisionDate;
                
                return (
                  <button
                    key={dateInfo.effectiveDate}
                    onClick={() => {
                      setGlobalRevisionDate(dateInfo.effectiveDate);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-blue-800' : 'text-gray-900'
                          }`}>
                            {dateInfo.displayDate}
                          </span>
                          
                          {/* Type Badge */}
                          {dateInfo.type === 'amendment' && (
                            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                              Amendments
                            </span>
                          )}
                          {dateInfo.type === 'original' && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                              Original
                            </span>
                          )}
                          {dateInfo.type === 'mixed' && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full">
                              Mixed
                            </span>
                          )}
                        </div>
                        
                        {/* Revision Count */}
                        <p className="text-xs text-gray-600">
                          {dateInfo.count} revision{dateInfo.count !== 1 ? 's' : ''} effective
                        </p>
                      </div>
                      
                      {isSelected && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Current Selection Info */}
            {selectedDateInfo && (
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-700">Current View</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Showing content as of {selectedDateInfo.displayDate}
                      {selectedDateInfo.count > 0 && (
                        <span> ({selectedDateInfo.count} revisions active)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}