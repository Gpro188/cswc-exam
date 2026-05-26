import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { cleanSubjectName } from '../utils/matching';

const TimeTable = ({ registrations, previousStudents = [], timeTable, onUpdateTimeTable }) => {
  // Step 1 states: Create Slot
  const [date, setDate] = useState('');
  const [session, setSession] = useState('Forenoon (FN)');

  const [fnTime, setFnTime] = useState(() => {
    return localStorage.getItem('cswc_fn_time') || '09:30 AM - 12:30 PM';
  });
  const [anTime, setAnTime] = useState(() => {
    return localStorage.getItem('cswc_an_time') || '01:30 PM - 04:30 PM';
  });

  // Step 2 states: Assign Subjects to Slot
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // Sync selected subjects when selected slot changes
  useEffect(() => {
    if (selectedSlotId) {
      const slot = timeTable.find(s => s.id === selectedSlotId);
      setSelectedSubjects(slot ? slot.subjects.map(s => {
        if (s.includes('||')) return s;
        // Fallback for unmigrated data
        return `UNKNOWN||${cleanSubjectName(s)}`;
      }) : []);
    } else {
      setSelectedSubjects([]);
    }
  }, [selectedSlotId, timeTable]);

  // Set default slot if none is selected and there are slots
  useEffect(() => {
    if (timeTable.length > 0 && !selectedSlotId) {
      const sorted = [...timeTable].sort((a, b) => new Date(a.date) - new Date(b.date));
      setSelectedSlotId(sorted[0].id);
    }
  }, [timeTable, selectedSlotId]);

  // Extract unique classes
  const classes = useMemo(() => {
    const allRegClasses = registrations.map(r => r.class);
    const allPrevClasses = previousStudents.map(r => r.class);
    return [...new Set([...allRegClasses, ...allPrevClasses].filter(Boolean))].sort();
  }, [registrations, previousStudents]);

  // Extract unique subjects filtered by class if selected
  const classSubjects = useMemo(() => {
    const allRegSubjects = registrations.map(r => `${r.class}||${cleanSubjectName(r.subject)}`);
    const allPrevSubjects = [];
    previousStudents.forEach(st => {
      if (st.subjects) {
        st.subjects.forEach(sub => allPrevSubjects.push(`${st.class}||${cleanSubjectName(sub)}`));
      }
    });

    const combinedSubjects = [...allRegSubjects, ...allPrevSubjects].filter(r => !r.startsWith('undefined||') && !r.startsWith('||'));

    if (!selectedClass) {
      return [...new Set(combinedSubjects)].sort();
    }
    return [...new Set(combinedSubjects.filter(r => r.startsWith(`${selectedClass}||`)))].sort();
  }, [registrations, previousStudents, selectedClass]);

  // Calculate subjects that are already scheduled in the timetable (excluding current slot)
  const scheduledSubjects = useMemo(() => {
    const subs = new Set();
    timeTable.forEach(slot => {
      if (slot.id !== selectedSlotId) {
        slot.subjects.forEach(s => subs.add(s));
      }
    });
    return subs;
  }, [timeTable, selectedSlotId]);

  // Calculate pending subjects (unscheduled across ALL registrations)
  const pendingSubjects = useMemo(() => {
    const allRegSubjects = registrations.map(r => `${r.class}||${cleanSubjectName(r.subject)}`);
    const allPrevSubjects = [];
    previousStudents.forEach(st => {
      if (st.subjects) {
        st.subjects.forEach(sub => allPrevSubjects.push(`${st.class}||${cleanSubjectName(sub)}`));
      }
    });

    const combinedSubjects = [...allRegSubjects, ...allPrevSubjects].filter(r => !r.startsWith('undefined||') && !r.startsWith('||'));
    const allUniqueSubs = [...new Set(combinedSubjects)].sort();
    
    const allScheduled = new Set();
    timeTable.forEach(slot => {
      slot.subjects.forEach(s => allScheduled.add(s));
    });
    return allUniqueSubs.filter(s => !allScheduled.has(s));
  }, [registrations, previousStudents, timeTable]);

  // Filter subjects by class, search text, and pending status
  const filteredSubjects = useMemo(() => {
    let list = classSubjects;
    if (showOnlyPending) {
      list = list.filter(sub => !scheduledSubjects.has(sub));
    }
    return list.filter(sub => {
      const displaySub = sub.split('||')[1] || sub;
      return displaySub.toLowerCase().includes(searchSubject.toLowerCase());
    });
  }, [classSubjects, searchSubject, showOnlyPending, scheduledSubjects]);

  const displaySubject = (str) => {
    const parts = str.split('||');
    if (parts.length > 1) {
      if (selectedClass && parts[0] === selectedClass) {
        return parts[1];
      }
      return `${parts[1]} (${parts[0]})`;
    }
    return str;
  };

  const handleToggleSubject = (sub) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  // Step 1: Create a slot (date + session)
  const handleCreateSlot = (e) => {
    e.preventDefault();
    if (!date) {
      alert('Please select a date!');
      return;
    }

    // Check if slot already exists
    const exists = timeTable.some(slot => slot.date === date && slot.session === session);
    if (exists) {
      alert('This Date and Session slot already exists. Please select it from the dropdown to manage subjects.');
      return;
    }

    const newSlot = {
      id: `slot_${Date.now()}`,
      date,
      session,
      time: session.includes('FN') ? fnTime : anTime,
      subjects: []
    };

    const nextTimeTable = [...timeTable, newSlot];
    onUpdateTimeTable(nextTimeTable);
    setSelectedSlotId(newSlot.id); // Automatically select the newly created slot
    
    // Reset date input
    setDate('');
    alert(`Exam slot for ${new Date(date).toLocaleDateString()} (${session}) created! Now assign subjects to it in Step 2.`);
  };

  // Step 2: Save subjects to slot
  const handleSaveSubjectsToSlot = (e) => {
    e.preventDefault();
    if (!selectedSlotId) {
      alert('Please select a slot first!');
      return;
    }

    const updated = timeTable.map(slot => {
      if (slot.id === selectedSlotId) {
        return { ...slot, subjects: selectedSubjects };
      }
      return slot;
    });

    onUpdateTimeTable(updated);
    alert('Subjects saved successfully to this exam slot!');
  };

  const handleDeleteSlot = (id) => {
    if (window.confirm('Are you sure you want to delete this exam slot? All its subject assignments will be removed.')) {
      const remaining = timeTable.filter(slot => slot.id !== id);
      onUpdateTimeTable(remaining);
      if (selectedSlotId === id) {
        setSelectedSlotId(remaining[0]?.id || '');
      }
    }
  };

  const handleUpdateSlotTime = (slotId, newTime) => {
    const updated = timeTable.map(slot => {
      if (slot.id === slotId) {
        return { ...slot, time: newTime };
      }
      return slot;
    });
    onUpdateTimeTable(updated);
  };

  // Group timetable slots by date
  const sortedSlots = useMemo(() => {
    return [...timeTable].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [timeTable]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Creation and Subject Assignment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STEP 1: Create Slot */}
          <div className="card">
            <div className="card-title">
              <h3>Step 1: Set Exam Date & Session</h3>
            </div>
            
            <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Exam Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  required
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Exam Session</label>
                <select 
                  className="form-select"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                >
                  <option value="Forenoon (FN)">Forenoon (FN) ({fnTime})</option>
                  <option value="Afternoon (AN)">Afternoon (AN) ({anTime})</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} /> Create Exam Slot
              </button>
            </form>

            {/* Session Timings Editor */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Configure Session Timings
              </h4>
              <div className="form-row-grid" style={{ marginBottom: '12px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Forenoon (FN) Time</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    value={fnTime}
                    onChange={(e) => {
                      setFnTime(e.target.value);
                      localStorage.setItem('cswc_fn_time', e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Afternoon (AN) Time</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ padding: '6px 10px', fontSize: '13px' }}
                    value={anTime}
                    onChange={(e) => {
                      setAnTime(e.target.value);
                      localStorage.setItem('cswc_an_time', e.target.value);
                    }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                * Changing these values will update all displayed timetable slots and print layouts instantly.
              </p>
            </div>
          </div>

          {/* STEP 2: Assign Subjects */}
          <div className="card">
            <div className="card-title">
              <h3>Step 2: Assign Subjects to Slot</h3>
            </div>

            {timeTable.length === 0 ? (
              <div style={{ padding: '20px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
                <span>Please create at least one exam slot in Step 1 first.</span>
              </div>
            ) : (
              <form onSubmit={handleSaveSubjectsToSlot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Select Scheduled Slot to Manage</label>
                  <select
                    className="form-select"
                    required
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                  >
                    {sortedSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {new Date(slot.date).toLocaleDateString()} ({slot.session})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Filter Subjects by Class</label>
                  <select
                    className="form-select"
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                    }}
                  >
                    <option value="">-- All Classes --</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label>Select Subjects for this Session</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--primary)', fontWeight: '700' }}>
                      <input 
                        type="checkbox"
                        checked={showOnlyPending}
                        onChange={(e) => setShowOnlyPending(e.target.checked)}
                      />
                      Show Only Pending ({pendingSubjects.length} left)
                    </label>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search subject..."
                    value={searchSubject}
                    onChange={(e) => setSearchSubject(e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                  
                  <div className="subject-checkbox-grid">
                    {filteredSubjects.map(sub => {
                      const isPending = !scheduledSubjects.has(sub);
                      return (
                        <label key={sub} className="subject-checkbox-item" dir="rtl" style={{ justifyContent: 'flex-end', textAlign: 'right' }}>
                          <span style={{ marginRight: '8px', fontSize: '13px' }}>
                            {displaySubject(sub)} {!isPending && <span style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 'normal' }}>(Scheduled in other slot)</span>}
                          </span>
                          <input 
                            type="checkbox"
                            checked={selectedSubjects.includes(sub)}
                            onChange={() => handleToggleSubject(sub)}
                          />
                        </label>
                      );
                    })}
                    {filteredSubjects.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '12px', textAlign: 'center' }}>
                        No subjects found.
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Selected in this slot: <strong>{selectedSubjects.length}</strong> subjects
                  </div>
                </div>

                <button type="submit" className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} /> Save Subject Assignments
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Right Side: Active Timetable List */}
        <div className="card">
          <div className="card-title">
            <h3>Active Time Table</h3>
            <span className="badge badge-neutral">Slots: {timeTable.length}</span>
          </div>

          {sortedSlots.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <h4>No Exams Scheduled</h4>
              <p style={{ fontSize: '13px' }}>Create exam slots in Step 1 and select matching subjects in Step 2.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sortedSlots.map(slot => (
                <div 
                  key={slot.id} 
                  style={{ 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '16px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px', 
                    backgroundColor: 'var(--bg-app)',
                    borderColor: selectedSlotId === slot.id ? 'var(--primary)' : 'var(--border-color)',
                    borderLeft: selectedSlotId === slot.id ? '4px solid var(--primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedSlotId(slot.id)}
                >
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Calendar size={18} style={{ color: 'var(--primary)' }} />
                      <strong style={{ fontSize: '15px' }}>
                        {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </strong>
                    </div>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent selecting the slot on delete click
                        handleDeleteSlot(slot.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', flexWrap: 'wrap' }}>
                    <Clock size={14} style={{ flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'nowrap' }}>Session: {slot.session}</span>
                    <input 
                      type="text"
                      className="form-input"
                      style={{ padding: '2px 8px', fontSize: '12px', width: '160px', height: '24px', marginLeft: 'auto' }}
                      value={slot.time !== undefined ? slot.time : (slot.session.includes('FN') ? fnTime : anTime)}
                      onChange={(e) => handleUpdateSlotTime(slot.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Enter custom time..."
                      title="Click to edit timings for this date slot"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                      Scheduled Subjects ({slot.subjects.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {slot.subjects.map(sub => (
                        <span key={sub} className="badge badge-neutral" style={{ fontSize: '11px', padding: '4px 8px' }} dir="rtl">
                          {displaySubject(sub)}
                        </span>
                      ))}
                      {slot.subjects.length === 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--danger)', fontStyle: 'italic' }}>
                          No subjects assigned yet. Select this slot to assign.
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Pending Subjects Card */}
      <div className="card">
        <div className="card-title">
          <h3>Pending Subjects to Schedule ({pendingSubjects.length})</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {pendingSubjects.map(sub => (
            <span key={sub} className="badge badge-warning" style={{ fontSize: '11px', padding: '6px 10px', textTransform: 'none' }} dir="rtl">
              {displaySubject(sub)}
            </span>
          ))}
          {pendingSubjects.length === 0 && (
            <div style={{ color: 'var(--success)', fontSize: '14px', fontWeight: '700', padding: '8px 0' }}>
              ✓ All registered subjects have been scheduled in the active timetable!
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TimeTable;
