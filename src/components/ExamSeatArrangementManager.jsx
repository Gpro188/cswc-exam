import React, { useState, useEffect } from 'react';
import { 
  Armchair, 
  Users, 
  Building2, 
  Calendar, 
  Clock, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import SeatingClassManager from './SeatingClassManager';
import SeatingHallManager from './SeatingHallManager';
import SeatingArrangementView from './SeatingArrangementView';
import SeatingPrintTemplates from './SeatingPrintTemplates';
import { generateSeatingArrangement } from '../utils/seatingArrangementEngine';

const STORAGE_KEY = 'exam_seating_system_data_v2';

export default function ExamSeatArrangementManager() {
  const [activeSubTab, setActiveSubTab] = useState('classes'); // 'classes' | 'halls' | 'schedule' | 'arrangement'

  // Central state saved to localStorage
  const [examData, setExamData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse exam seating state', e);
      }
    }
    return {
      examDetails: {
        examName: 'Annual Board Examination 2026',
        examDate: '2026-11-15',
        examTime: '09:30 AM - 12:30 PM'
      },
      // Configurable seating rules
      rulesConfig: {
        separateSameClassAdjacent: true, // Only prevent directly adjacent seats on same bench
        disallowSameClassBench: false,   // Forbid same class on same bench entirely
        fillEmptySeatsIfLeftover: true    // Fill vacant seats if only 1 class remaining
      },
      classes: [
        {
          id: 'cls_1',
          name: 'Class 10 - Science A',
          students: [
            { id: 's1', rollNo: '1001', name: 'Muhammed Nihal' },
            { id: 's2', rollNo: '1002', name: 'Aysha Ridha' },
            { id: 's3', rollNo: '1003', name: 'Fathima Sana' },
            { id: 's4', rollNo: '1004', name: 'Ahmed Basil' },
            { id: 's5', rollNo: '1005', name: 'Zayan Ali' },
            { id: 's6', rollNo: '1006', name: 'Hiba Fathima' },
            { id: 's7', rollNo: '1007', name: 'Salman Faris' },
            { id: 's8', rollNo: '1008', name: 'Rayan Shafi' }
          ]
        },
        {
          id: 'cls_2',
          name: 'Class 12 - Commerce B',
          students: [
            { id: 's9', rollNo: '2001', name: 'Ibrahim Khalil' },
            { id: 's10', rollNo: '2002', name: 'Mariyam Nasrin' },
            { id: 's11', rollNo: '2003', name: 'Adil Shareef' },
            { id: 's12', rollNo: '2004', name: 'Noufia Banu' },
            { id: 's13', rollNo: '2005', name: 'Shameem Akram' },
            { id: 's14', rollNo: '2006', name: 'Lubna Shireen' },
            { id: 's15', rollNo: '2007', name: 'Hamza Tariq' },
            { id: 's16', rollNo: '2008', name: 'Thasneem K' }
          ]
        }
      ],
      halls: [
        {
          id: 'hall_1',
          name: 'Examination Hall 1 (Ground Floor)',
          totalBenches: 12,
          studentsPerBench: 4,
          columns: 3,
          rows: 4,
          totalCapacity: 48
        }
      ],
      selectedClassIdsForExam: ['cls_1', 'cls_2'],
      selectedHallIdsForExam: ['hall_1'],
      arrangement: null
    };
  });

  // Print modal state
  const [printModal, setPrintModal] = useState({
    isOpen: false,
    printType: 'hall_plan'
  });

  // Save to localStorage on state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(examData));
  }, [examData]);

  // Handlers for Classes
  const handleAddClass = (newClass) => {
    setExamData(prev => ({
      ...prev,
      classes: [...prev.classes, newClass],
      selectedClassIdsForExam: [...prev.selectedClassIdsForExam, newClass.id]
    }));
  };

  const handleDeleteClass = (classId) => {
    setExamData(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c.id !== classId),
      selectedClassIdsForExam: prev.selectedClassIdsForExam.filter(id => id !== classId)
    }));
  };

  const handleAddStudentToClass = (classId, student) => {
    setExamData(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id === classId) {
          return {
            ...c,
            students: [...(c.students || []), student]
          };
        }
        return c;
      })
    }));
  };

  const handleDeleteStudent = (classId, studentId) => {
    setExamData(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id === classId) {
          return {
            ...c,
            students: (c.students || []).filter(s => s.id !== studentId)
          };
        }
        return c;
      })
    }));
  };

  const handleImportStudentsExcel = (classId, newStudents) => {
    setExamData(prev => ({
      ...prev,
      classes: prev.classes.map(c => {
        if (c.id === classId) {
          return {
            ...c,
            students: [...(c.students || []), ...newStudents]
          };
        }
        return c;
      })
    }));
  };

  // Handlers for Halls
  const handleAddHall = (newHall) => {
    setExamData(prev => ({
      ...prev,
      halls: [...prev.halls, newHall],
      selectedHallIdsForExam: [...prev.selectedHallIdsForExam, newHall.id]
    }));
  };

  const handleUpdateHall = (updatedHall) => {
    setExamData(prev => ({
      ...prev,
      halls: prev.halls.map(h => h.id === updatedHall.id ? updatedHall : h)
    }));
  };

  const handleDeleteHall = (hallId) => {
    setExamData(prev => ({
      ...prev,
      halls: prev.halls.filter(h => h.id !== hallId),
      selectedHallIdsForExam: prev.selectedHallIdsForExam.filter(id => id !== hallId)
    }));
  };

  // Rule config toggle handler
  const handleToggleRule = (ruleKey) => {
    setExamData(prev => ({
      ...prev,
      rulesConfig: {
        ...prev.rulesConfig,
        [ruleKey]: !prev.rulesConfig?.[ruleKey]
      }
    }));
  };

  // Generate Arrangement
  const handleGenerateArrangement = () => {
    const activeClasses = examData.classes.filter(c => examData.selectedClassIdsForExam.includes(c.id));
    const activeHalls = examData.halls.filter(h => examData.selectedHallIdsForExam.includes(h.id));

    if (activeClasses.length === 0) {
      alert('Please assign at least one class for this exam session.');
      return;
    }
    if (activeHalls.length === 0) {
      alert('Please assign at least one exam hall for this exam session.');
      return;
    }

    const totalStudentsToSeat = activeClasses.reduce((acc, c) => acc + (c.students || []).length, 0);
    if (totalStudentsToSeat === 0) {
      alert('The selected classes have 0 enrolled students. Please add or import students first.');
      return;
    }

    const result = generateSeatingArrangement(activeHalls, activeClasses, examData.rulesConfig);
    setExamData(prev => ({
      ...prev,
      arrangement: result
    }));
    setActiveSubTab('arrangement');
  };

  const handleUpdateArrangement = (updatedArrangement) => {
    setExamData(prev => ({
      ...prev,
      arrangement: updatedArrangement
    }));
  };

  // Reset all seating arrangement data
  const handleResetData = () => {
    if (window.confirm('Reset all seating module data to initial defaults?')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('exam_seating_system_data_v1');
      window.location.reload();
    }
  };

  // Metrics for overview
  const totalClasses = examData.classes.length;
  const totalStudents = examData.classes.reduce((acc, c) => acc + (c.students || []).length, 0);
  const totalHalls = examData.halls.length;
  const totalCapacity = examData.halls.reduce((acc, h) => acc + (h.totalBenches * (h.studentsPerBench || 2)), 0);

  return (
    <div className="seating-system-wrapper" style={{ padding: '4px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, hsl(256, 70%, 54%) 0%, hsl(222, 47%, 20%) 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
              EXAMINATION SEAT MANAGEMENT
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
            Exam Seat Arrangement & Plan Generator
          </h2>
          <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: '0.9rem', maxWidth: '620px' }}>
            Configure exam timetable sessions, import students via Excel, set up halls and benches, select your desired seating rules, and generate clean seat plans.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>CLASSES</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{totalClasses}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>STUDENTS</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{totalStudents}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '10px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>HALL CAPACITY</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{totalCapacity}</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveSubTab('classes')}
          className={`btn ${activeSubTab === 'classes' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}
        >
          <Users size={18} /> 1. Classes & Students (Excel)
        </button>
        <button
          onClick={() => setActiveSubTab('halls')}
          className={`btn ${activeSubTab === 'halls' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}
        >
          <Building2 size={18} /> 2. Halls & Benches Setup
        </button>
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`btn ${activeSubTab === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}
        >
          <Calendar size={18} /> 3. Exam Schedule & Rules
        </button>
        <button
          onClick={() => setActiveSubTab('arrangement')}
          className={`btn ${activeSubTab === 'arrangement' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontWeight: 600 }}
        >
          <Sparkles size={18} /> 4. Seating Plan & Drag-Drop View
        </button>

        <button
          onClick={handleResetData}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <RotateCcw size={14} /> Reset Defaults
        </button>
      </div>

      {/* SUB TAB 1: Classes & Excel Import */}
      {activeSubTab === 'classes' && (
        <SeatingClassManager
          classes={examData.classes}
          onAddClass={handleAddClass}
          onDeleteClass={handleDeleteClass}
          onAddStudentToClass={handleAddStudentToClass}
          onDeleteStudent={handleDeleteStudent}
          onImportStudentsExcel={handleImportStudentsExcel}
        />
      )}

      {/* SUB TAB 2: Halls & Benches */}
      {activeSubTab === 'halls' && (
        <SeatingHallManager
          halls={examData.halls}
          onAddHall={handleAddHall}
          onUpdateHall={handleUpdateHall}
          onDeleteHall={handleDeleteHall}
        />
      )}

      {/* SUB TAB 3: Exam Session & Class/Hall Assignment & Rules */}
      {activeSubTab === 'schedule' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left: Exam Details Form */}
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="var(--primary)" />
              Exam Timing & Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Exam Name / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Examination 2026, Semester Final"
                  value={examData.examDetails.examName}
                  onChange={(e) => setExamData({
                    ...examData,
                    examDetails: { ...examData.examDetails, examName: e.target.value }
                  })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examData.examDetails.examDate}
                    onChange={(e) => setExamData({
                      ...examData,
                      examDetails: { ...examData.examDetails, examDate: e.target.value }
                    })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Time Slot / Session
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM - 12:30 PM (FN)"
                    value={examData.examDetails.examTime}
                    onChange={(e) => setExamData({
                      ...examData,
                      examDetails: { ...examData.examDetails, examTime: e.target.value }
                    })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>
              </div>

              {/* Class Selection for this Session */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>
                  Assign Classes Having Exam at this Time:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px' }}>
                  {examData.classes.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No classes available. Create classes first.</div>
                  ) : (
                    examData.classes.map(cls => {
                      const isChecked = examData.selectedClassIdsForExam.includes(cls.id);
                      return (
                        <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '6px', background: isChecked ? 'var(--primary-light)' : '#f9fafb', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExamData({ ...examData, selectedClassIdsForExam: [...examData.selectedClassIdsForExam, cls.id] });
                              } else {
                                setExamData({ ...examData, selectedClassIdsForExam: examData.selectedClassIdsForExam.filter(id => id !== cls.id) });
                              }
                            }}
                          />
                          <span style={{ fontWeight: 600, flex: 1 }}>{cls.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(cls.students || []).length} Students</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Hall Selection & Rule Selection Options */}
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="var(--primary)" />
                Assign Examination Halls
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>
                {examData.halls.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No halls available. Create halls in step 2.</div>
                ) : (
                  examData.halls.map(hall => {
                    const isChecked = examData.selectedHallIdsForExam.includes(hall.id);
                    const cap = hall.totalBenches * (hall.studentsPerBench || 2);
                    return (
                      <label key={hall.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '6px', background: isChecked ? 'var(--primary-light)' : '#f9fafb', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExamData({ ...examData, selectedHallIdsForExam: [...examData.selectedHallIdsForExam, hall.id] });
                            } else {
                              setExamData({ ...examData, selectedHallIdsForExam: examData.selectedHallIdsForExam.filter(id => id !== hall.id) });
                            }
                          }}
                        />
                        <span style={{ fontWeight: 600, flex: 1 }}>{hall.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {hall.totalBenches} Benches ({cap} Seats)
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Rule Selection Options (Clickable Toggles) */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '10px' }}>
                  <Sliders size={18} color="var(--primary)" />
                  <span>Choose Seating Rules for this Exam:</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Rule 1: No immediate side-by-side neighbors */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <input
                      type="checkbox"
                      checked={examData.rulesConfig?.separateSameClassAdjacent ?? true}
                      onChange={() => handleToggleRule('separateSameClassAdjacent')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        No Immediate Side-by-Side Neighbors (Recommended)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        Students of the same class cannot sit directly next to each other. (If another class sits between them, e.g. Class A - Class B - Class A, it is allowed and safe).
                      </div>
                    </div>
                  </label>

                  {/* Rule 2: Strictly no same class anywhere on same bench */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <input
                      type="checkbox"
                      checked={examData.rulesConfig?.disallowSameClassBench ?? false}
                      onChange={() => handleToggleRule('disallowSameClassBench')}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        Strict Single-Student-Per-Class per Bench (Entire Bench Isolation)
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        Only 1 student of any given class per bench across all 4 seats. Leave unselected if wide benches can hold 2 students from the same class on opposite ends.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                onClick={handleGenerateArrangement}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <Sparkles size={20} /> Generate Seating Arrangement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 4: Visual Arrangement & Drag/Drop Adjustment */}
      {activeSubTab === 'arrangement' && (
        <SeatingArrangementView
          examDetails={examData.examDetails}
          arrangement={examData.arrangement}
          rulesConfig={examData.rulesConfig}
          onToggleRule={handleToggleRule}
          onUpdateArrangement={handleUpdateArrangement}
          onOpenPrint={(type) => setPrintModal({ isOpen: true, printType: type })}
        />
      )}

      {/* Print Modal */}
      {printModal.isOpen && (
        <SeatingPrintTemplates
          examDetails={examData.examDetails}
          arrangement={examData.arrangement}
          activePrintType={printModal.printType}
          onClose={() => setPrintModal({ isOpen: false, printType: 'hall_plan' })}
        />
      )}
    </div>
  );
}
