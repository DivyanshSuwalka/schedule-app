import React, { useState, useMemo } from 'react';

// --- Helper Icons (as SVG components) ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
  </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 011-1h8a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

// --- Main App Component ---
export default function App() {
  // --- State Management ---
  
  // 'view' acts as our simple router. 
  // page: 'weekly', 'daily', or 'edit'
  // day: The day we are viewing or editing, e.g., 'Monday'
  const [view, setView] = useState({ page: 'weekly', day: null });

  // This is our main data store for the schedules.
  // The keys are days, and values are arrays of booked hours (24-hour format).
  const [schedule, setSchedule] = useState({
    Monday: [6, 7, 8, 9, 17, 18, 19, 21],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    Sunday: [],
  });

  // 'tempSelection' holds hours selected in the 'edit' view before confirming.
  const [tempSelection, setTempSelection] = useState([]);
  
  // 'selectionStart' is used to handle range selection on the edit page.
  const [selectionStart, setSelectionStart] = useState(null);


  // --- Helper Functions ---

  // Converts a 24-hour format number to a 12-hour AM/PM string.
  const formatTime = (hour) => {
    if (hour === 24) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  /**
   * This is a key function. It takes an array of hours (e.g., [6, 7, 8, 14, 15])
   * and groups consecutive hours into ranges (e.g., "6 AM to 9 AM, 2 PM to 4 PM").
   * This is what makes the weekly overview page look clean.
   */
  const formatSlotsForDay = useMemo(() => (day) => {
    const hours = schedule[day];
    if (!hours || hours.length === 0) return '';

    const sortedHours = [...hours].sort((a, b) => a - b);
    const ranges = [];
    let startRange = sortedHours[0];

    for (let i = 0; i < sortedHours.length; i++) {
      const currentHour = sortedHours[i];
      const nextHour = sortedHours[i + 1];

      // If the next hour is not consecutive, or if we're at the end of the array,
      // we close the current range.
      if (nextHour !== currentHour + 1) {
        // The end of the range is the hour *after* the last one in the block.
        const endRange = currentHour + 1;
        ranges.push(`${formatTime(startRange)} to ${formatTime(endRange)}`);
        startRange = nextHour;
      }
    }
    return ranges.join(', ');
  }, [schedule]);
  

  // --- Event Handlers ---

  const handleDayClick = (day) => {
    setView({ page: 'daily', day });
  };

  const handleEditClick = (day) => {
    setView({ page: 'edit', day });
  };
  
  const handleBackToWeekly = () => {
      setView({ page: 'weekly', day: null });
      setTempSelection([]);
      setSelectionStart(null);
  };
  
  // This handles selecting hours on the edit page, including ranges.
  const handleHourSelect = (hour) => {
    // If the hour is already permanently booked, do nothing.
    if (schedule[view.day].includes(hour)) return;

    // If the hour is in the temporary selection, deselect it.
    if(tempSelection.includes(hour)){
        setTempSelection(prev => prev.filter(h => h !== hour));
        return;
    }

    if (!selectionStart) {
      // This is the first click, starting a new selection (or range).
      setSelectionStart(hour);
      setTempSelection(prev => [...prev, hour]);
    } else {
      // This is the second click, completing a range.
      const start = Math.min(selectionStart, hour);
      const end = Math.max(selectionStart, hour);
      const newRange = [];
      for (let i = start; i <= end; i++) {
        // Only add hours to the range that are not already booked.
        if (!schedule[view.day].includes(i)) {
          newRange.push(i);
        }
      }
      
      // We use a Set to avoid duplicates if the user re-drags over existing selections.
      setTempSelection(prev => [...new Set([...prev, ...newRange])]);
      setSelectionStart(null); // Reset for the next selection.
    }
  };
  
  // Commits the temporary selections to the main schedule.
  const handleConfirm = () => {
    const day = view.day;
    setSchedule(prevSchedule => {
      const existingHours = prevSchedule[day];
      const newHours = [...new Set([...existingHours, ...tempSelection])].sort((a, b) => a - b);
      return { ...prevSchedule, [day]: newHours };
    });
    
    // Go back to the main page after confirming.
    handleBackToWeekly();
  };


  // --- Render Functions for Each Page ---

  const renderWeeklyView = () => {
    const days = Object.keys(schedule);
    return (
      <div className="p-6 bg-[#381E10] rounded-xl flex flex-col h-full">
        <h1 className="text-2xl font-bold text-amber-200 mb-4 shrink-0">Weekly Overview</h1>
        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 overflow-x-hidden">
          {days.map(day => {
            const slots = formatSlotsForDay(day);
            const hasSlots = slots.length > 0;
            return (
              <div
                key={day}
                onClick={() => hasSlots ? handleDayClick(day) : handleEditClick(day)}
                className="bg-[#61341B] p-4 rounded-lg shadow-md cursor-pointer transition-transform hover:scale-105"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg text-white">{day}</p>
                    {hasSlots && <p className="text-xs text-amber-200">{slots}</p>}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the parent div's onClick
                      handleEditClick(day);
                    }}
                    className="bg-amber-800/50 text-white p-2 rounded-full hover:bg-amber-700/70"
                  >
                    {hasSlots ? <PencilIcon /> : <PlusIcon />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // NEW: Helper function to calculate consecutive booked time blocks
  const calculateBlocks = (hours, bookedHours) => {
    const blocks = [];
    let i = 0;
    while (i < hours.length) {
        const hour = hours[i];
        if (bookedHours.includes(hour)) {
            const startIndex = i;
            let endIndex = i;
            while (endIndex + 1 < hours.length && bookedHours.includes(hours[endIndex + 1])) {
                endIndex++;
            }
            
            blocks.push({
                startHour: hour,
                top: `${startIndex * 3}rem`, // h-12 is 3rem
                height: `${(endIndex - startIndex + 1) * 3}rem`
            });

            i = endIndex + 1;
        } else {
            i++;
        }
    }
    return blocks;
  };

  // REFACTORED: This function now renders slots and booked blocks separately
  const renderTimeSlots = (isEditMode = false) => {
      const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM (22:00)
      const bookedHours = schedule[view.day];
      const bookedBlocks = calculateBlocks(hours, bookedHours);

      return (
          <div className="flex-grow flex pr-8">
              {/* Time labels */}
              <div className="flex flex-col text-sm text-gray-400 pt-4">
                  {hours.map(h => (
                      <div key={h} className="h-12 flex items-start -translate-y-2.5">
                          {formatTime(h)}
                      </div>
                  ))}
              </div>
              
              {/* Timeline Ruler */}
              <div className="w-px bg-gray-600/50 mx-2 relative">
                   {hours.slice(0, -1).map(h => (
                       <div key={`tick-${h}`} className="h-12 border-b border-gray-600/30"></div>
                   ))}
              </div>

              {/* Slots visualization container */}
              <div className="flex-1 relative">
                  {/* Layer 1: Background for temporary selections and click handling */}
                  {hours.map(hour => {
                      const isBooked = bookedHours.includes(hour);
                      const isTempSelected = tempSelection.includes(hour);
                      
                      let bgColor = 'bg-transparent';
                      if (!isBooked && isTempSelected) {
                          bgColor = 'bg-amber-500';
                      }
                      
                      const cursor = isBooked ? 'cursor-not-allowed' : 'cursor-pointer';

                      return (
                          <div 
                              key={hour} 
                              className={`h-12 relative ${isEditMode ? cursor : ''}`}
                              onClick={() => isEditMode && handleHourSelect(hour)}
                          >
                            <div className={`absolute inset-0 w-full h-full rounded-md ${bgColor} transition-colors`}></div>
                          </div>
                      );
                  })}
                  
                  {/* Layer 2: Overlay for permanently booked blocks */}
                  {bookedBlocks.map(block => (
                    <div
                        key={block.startHour}
                        className="absolute inset-x-0 bg-amber-600/50 rounded-md"
                        style={{ top: block.top, height: block.height }}
                    >
                        {isEditMode && (
                            <div className="p-2 text-white/70 text-xs flex items-center">
                                <LockIcon /> Booked
                            </div>
                        )}
                    </div>
                  ))}
              </div>
          </div>
      )
  };

  const renderDailyView = () => (
    <div className="p-6 bg-[#381E10] rounded-xl flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
            <button onClick={handleBackToWeekly} className="text-amber-200 text-2xl">&larr;</button>
            <h1 className="text-2xl font-bold text-white">{view.day}</h1>
            <button onClick={() => handleEditClick(view.day)} className="bg-amber-600 text-white p-2.5 rounded-full hover:bg-amber-500">
                <PlusIcon />
            </button>
        </div>
        <div className="overflow-y-auto flex-grow custom-scrollbar">
            {renderTimeSlots(false)}
        </div>
    </div>
  );

  const renderEditView = () => (
    <div className="p-6 bg-[#381E10] rounded-xl flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
            <button onClick={handleBackToWeekly} className="text-amber-200 text-lg">Cancel</button>
            <button 
              onClick={handleConfirm} 
              className="bg-amber-200 text-amber-900 font-bold py-2 px-6 rounded-lg hover:bg-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={tempSelection.length === 0}
            >
              CONFIRM
            </button>
        </div>
        <div className="overflow-y-auto flex-grow custom-scrollbar">
            <p className="text-amber-200 text-sm text-center mb-4">
              {selectionStart ? 'Tap another hour to select a range.' : 'Tap an hour or tap and drag to select a range.'}
            </p>
            {renderTimeSlots(true)}
        </div>
    </div>
  );
  
  const customScrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #61341B;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #8a5a3c;
    }
    /* For Firefox */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #61341B transparent;
    }
  `;

  return (
    <>
      <style>{customScrollbarStyles}</style>
      <div className="bg-zinc-900 min-h-screen text-white font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-sm h-[85vh] bg-[#1E1E1E] rounded-3xl shadow-2xl p-2">
          {/* Simple state-based router */}
          {view.page === 'weekly' && renderWeeklyView()}
          {view.page === 'daily' && renderDailyView()}
          {view.page === 'edit' && renderEditView()}
        </div>
      </div>
    </>
  );
}

