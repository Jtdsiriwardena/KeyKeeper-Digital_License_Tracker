import React, { useEffect, useState } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView({ licenses }) {
  const [licenseMap, setLicenseMap] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const map = {};
    licenses.forEach((license) => {
      if (license.expiryDate) {
        const dateKey = new Date(license.expiryDate).toDateString();
        const daysLeft = (new Date(license.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);

        let risk = 'safe';
        if (daysLeft <= 30) risk = 'soon';
        else if (daysLeft <= 60) risk = 'attention';

        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push({
          licenseKey: license.licenseKey,
          product: license.product?.name || 'Unknown',
          risk,
          expiryDate: license.expiryDate,
          notes: license.notes,
          status: license.status,
          autoRenew: license.autoRenew,
          clientProject: license.clientProject,
        });
      }
    });
    setLicenseMap(map);
  }, [licenses]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayClass = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const key = date.toDateString();
    const today = new Date().toDateString();
    
    let classes = 'relative h-10 sm:h-12 flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all';
    
    if (key === today) {
      classes += ' bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-2';
    } else if (licenseMap[key]) {
      const risks = licenseMap[key].map(l => l.risk);
      if (risks.includes('soon')) {
        classes += ' bg-red-50 text-red-700 border border-red-200 hover:bg-red-100';
      } else if (risks.includes('attention')) {
        classes += ' bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100';
      } else {
        classes += ' bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100';
      }
    } else {
      classes += ' text-gray-700 hover:bg-gray-100';
    }
    
    return classes;
  };

  const onDateClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const key = date.toDateString();
    if (licenseMap[key]) {
      setSelectedDate(key);
    } else {
      setSelectedDate(null);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 sm:h-12"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const key = date.toDateString();
      const hasLicenses = licenseMap[key] && licenseMap[key].length > 0;
      
      days.push(
        <div
          key={day}
          className={getDayClass(day)}
          onClick={() => onDateClick(day)}
        >
          <span>{day}</span>
          {hasLicenses && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
              {licenseMap[key].slice(0, 3).map((_, idx) => (
                <div key={idx} className="w-1 h-1 rounded-full bg-current opacity-60"></div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const renderLicenseDetails = () => {
    if (!selectedDate) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Date</h3>
          <p className="text-sm text-gray-600 max-w-xs">Click on a highlighted date in the calendar to view license expiry details</p>
        </div>
      );
    }

    const items = licenseMap[selectedDate];
    if (!items || items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Licenses</h3>
          <p className="text-sm text-gray-600">No licenses expire on this date</p>
        </div>
      );
    }

    return (
      <div className="h-full">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">License Details</h3>
            <p className="text-xs text-gray-500 mt-0.5">{new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}</p>
          </div>
          <button
            onClick={() => setSelectedDate(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {items.map((license, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-sm truncate">{license.product}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 font-mono truncate">{license.licenseKey}</p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {license.risk === 'soon' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Critical
                    </span>
                  )}
                  {license.risk === 'attention' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3 h-3 mr-1" />
                      Warning
                    </span>
                  )}
                  {license.risk === 'safe' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Safe
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500 mb-0.5">Expiry Date</p>
                  <p className="font-medium text-gray-900">{new Date(license.expiryDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-0.5">Status</p>
                  <p className="font-medium text-gray-900">{license.status}</p>
                </div>
                {license.autoRenew && (
                  <div>
                    <p className="text-gray-500 mb-0.5">Auto Renew</p>
                    <span className="inline-flex items-center text-emerald-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enabled
                    </span>
                  </div>
                )}
                {license.clientProject && (
                  <div>
                    <p className="text-gray-500 mb-0.5">Client/Project</p>
                    <p className="font-medium text-gray-900 truncate">{license.clientProject}</p>
                  </div>
                )}
              </div>
              
              {license.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-gray-500 text-xs mb-1">Notes</p>
                  <p className="text-gray-700 text-xs line-clamp-2">{license.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Renewal Calendar</h2>
              <p className="text-xs text-gray-600">Track upcoming license expirations</p>
            </div>
          </div>
          <button
            onClick={goToToday}
            className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Today
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-gray-900">{formatDate(currentDate)}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>
            
            {/* Legend */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Risk Indicators</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-gray-700">≤30 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-gray-700">≤60 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-gray-700">&gt;60 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <span className="text-xs text-gray-700">Today</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* License Details Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 min-h-[400px]">
              {renderLicenseDetails()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}