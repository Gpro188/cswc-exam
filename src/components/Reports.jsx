import React, { useState, useMemo } from 'react';
import { Printer, FileSpreadsheet, Layers, ShieldCheck, UserCheck } from 'lucide-react';
import { cleanSubjectName } from '../utils/matching';

const Reports = ({ institutions, registrations, timeTable }) => {
  const [reportType, setReportType] = useState('office_summary');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [deskSlipsViewMode, setDeskSlipsViewMode] = useState('chart');

  const fnTime = localStorage.getItem('cswc_fn_time') || '09:30 AM - 12:30 PM';
  const anTime = localStorage.getItem('cswc_an_time') || '01:30 PM - 04:30 PM';

  // Exam centers list
  const examCenters = useMemo(() => {
    return institutions.filter(i => i.isExamCenter);
  }, [institutions]);

  // Unique classes list
  const classesList = useMemo(() => {
    return [...new Set(registrations.map(r => r.class).filter(Boolean))].sort();
  }, [registrations]);

  // Set default center if none is selected
  if (examCenters.length > 0 && !selectedCenter && selectedCenter !== 'all') {
    setSelectedCenter(examCenters[0].code);
  }

  // Set default slot if none is selected
  if (timeTable.length > 0 && !selectedSlotId) {
    setSelectedSlotId(timeTable[0].id);
  }

  // Set default class if none is selected
  if (classesList.length > 0 && !selectedClass) {
    setSelectedClass(classesList[0]);
  }

  // Get subjects in selected class
  const subjectsInClass = useMemo(() => {
    if (!selectedClass) return [];
    return [...new Set(
      registrations
        .filter(r => r.class === selectedClass)
        .map(r => cleanSubjectName(r.subject))
    )].sort();
  }, [registrations, selectedClass]);

  // Map school code to center code
  const schoolToCenterCode = useMemo(() => {
    const mapping = {};
    institutions.forEach(inst => {
      if (inst.isExamCenter) {
        mapping[inst.code] = inst.code;
      } else if (inst.assignedToCenter) {
        mapping[inst.code] = inst.assignedToCenter;
      } else {
        mapping[inst.code] = ''; // Not assigned
      }
    });
    return mapping;
  }, [institutions]);

  // 1. Calculate Office Summary (Total counts grouped by Class + Subject, ordered F1, F2, D1, D2, D3)
  const officeSummary = useMemo(() => {
    const counts = {}; // "class_subject" -> { class, subject, count }
    registrations.forEach(r => {
      const klass = r.class || 'UNKNOWN';
      const subject = cleanSubjectName(r.subject || 'UNKNOWN');
      const key = `${klass}_${subject}`;
      if (!counts[key]) {
        counts[key] = { class: klass, subject: subject, count: 0 };
      }
      counts[key].count += 1;
    });

    const CLASS_ORDER = ['F1', 'F2', 'D1', 'D2', 'D3'];
    const getClassOrderIndex = (cls) => {
      const idx = CLASS_ORDER.indexOf(cls);
      return idx === -1 ? 999 : idx;
    };

    return Object.values(counts).sort((a, b) => {
      const classDiff = getClassOrderIndex(a.class) - getClassOrderIndex(b.class);
      if (classDiff !== 0) return classDiff;
      return a.subject.localeCompare(b.subject);
    });
  }, [registrations]);

  // 2. Calculate Center packing summary
  const centerPackingData = useMemo(() => {
    const data = {}; // centerCode -> { subject -> count }
    
    // Seed center structures
    examCenters.forEach(ec => {
      data[ec.code] = { name: ec.name, place: ec.place, subjects: {} };
    });

    registrations.forEach(r => {
      const centerCode = schoolToCenterCode[r.school_code];
      if (centerCode && data[centerCode]) {
        const cleanedSub = cleanSubjectName(r.subject);
        data[centerCode].subjects[cleanedSub] = (data[centerCode].subjects[cleanedSub] || 0) + 1;
      }
    });

    return data;
  }, [registrations, examCenters, schoolToCenterCode]);

  // 3. Attendance Register Data
  const attendanceData = useMemo(() => {
    if (!selectedSlotId || !selectedCenter) return [];
    
    const slot = timeTable.find(s => s.id === selectedSlotId);
    if (!slot) return [];

    const centerCode = selectedCenter;
    const scheduledSubjects = slot.subjects.map(s => cleanSubjectName(s));

    // Filter registrations that belong to this center AND have subjects in this session
    return registrations.filter(r => {
      const regCenterCode = schoolToCenterCode[r.school_code];
      return regCenterCode === centerCode && scheduledSubjects.includes(cleanSubjectName(r.subject));
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [registrations, timeTable, selectedSlotId, selectedCenter, schoolToCenterCode]);

  // 4. Center Allocation List Data grouped by Zone
  const institutionsByZone = useMemo(() => {
    const grouped = {};
    institutions.forEach(inst => {
      const zone = inst.zone || 'UNASSIGNED';
      if (!grouped[zone]) {
        grouped[zone] = [];
      }
      grouped[zone].push(inst);
    });

    const sortedZones = Object.keys(grouped).sort();
    const result = [];
    sortedZones.forEach(zone => {
      const sortedInsts = [...grouped[zone]].sort((a, b) => a.name.localeCompare(b.name));
      result.push({
        zone,
        institutions: sortedInsts
      });
    });
    return result;
  }, [institutions]);

  // 5. Centre Exam & Seating Summary
  const centreExamSummaryData = useMemo(() => {
    const result = [];
    const centers = institutions.filter(i => i.isExamCenter);

    centers.forEach(center => {
      const centerSlots = [];
      const sortedSlots = [...timeTable].sort((a, b) => new Date(a.date) - new Date(b.date));

      sortedSlots.forEach(slot => {
        const slotSubjectsData = [];
        let slotTotal = 0;
        const scheduledSubjects = slot.subjects.map(s => cleanSubjectName(s));

        scheduledSubjects.forEach(subject => {
          const count = registrations.filter(r => {
            const regCenterCode = schoolToCenterCode[r.school_code];
            return regCenterCode === center.code && cleanSubjectName(r.subject) === subject;
          }).length;

          if (count > 0) {
            slotSubjectsData.push({ subject, count });
            slotTotal += count;
          }
        });

        centerSlots.push({
          slotId: slot.id,
          date: slot.date,
          session: slot.session,
          time: slot.time || (slot.session.includes('FN') ? fnTime : anTime),
          subjects: slotSubjectsData,
          totalCount: slotTotal
        });
      });

      result.push({
        centerCode: center.code,
        centerName: center.name,
        place: center.place,
        slots: centerSlots
      });
    });

    return result;
  }, [institutions, registrations, timeTable, schoolToCenterCode, fnTime, anTime]);

  // 6. Seating Candidates list (flat)
  const seatingCandidates = useMemo(() => {
    if (!selectedSlotId || !selectedCenter) return [];

    const slotsToProcess = selectedSlotId === 'all' 
      ? timeTable 
      : timeTable.filter(s => s.id === selectedSlotId);

    const centersToProcess = selectedCenter === 'all'
      ? examCenters.map(ec => ec.code)
      : [selectedCenter];

    const result = [];

    centersToProcess.forEach(centerCode => {
      slotsToProcess.forEach(slot => {
        const scheduledSubjects = slot.subjects.map(s => cleanSubjectName(s));

        const matchingRegs = registrations.filter(r => {
          const regCenterCode = schoolToCenterCode[r.school_code];
          return regCenterCode === centerCode && scheduledSubjects.includes(cleanSubjectName(r.subject));
        });

        const sortedRegs = [...matchingRegs].sort((a, b) => {
          const nameCompare = a.name.localeCompare(b.name);
          if (nameCompare !== 0) return nameCompare;
          return a.subject.localeCompare(b.subject);
        });

        sortedRegs.forEach((reg, idx) => {
          result.push({
            ...reg,
            seatNo: idx + 1,
            slotId: slot.id,
            slotDate: slot.date,
            slotSession: slot.session,
            slotTime: slot.time || (slot.session.includes('FN') ? fnTime : anTime),
            centerCode
          });
        });
      });
    });

    return result;
  }, [registrations, timeTable, selectedSlotId, selectedCenter, schoolToCenterCode, examCenters, fnTime, anTime]);

  // 7. Grouped Seating Candidates by Center & Slot
  const groupedSeatingData = useMemo(() => {
    const groups = {};

    seatingCandidates.forEach(cand => {
      const key = `${cand.centerCode}_${cand.slotId}`;
      if (!groups[key]) {
        const centerObj = institutions.find(i => i.code === cand.centerCode);
        groups[key] = {
          centerCode: cand.centerCode,
          centerName: centerObj?.name || cand.centerCode,
          centerPlace: centerObj?.place || '',
          slotId: cand.slotId,
          slotDate: cand.slotDate,
          slotSession: cand.slotSession,
          slotTime: cand.slotTime,
          candidates: []
        };
      }
      groups[key].candidates.push(cand);
    });

    return Object.values(groups);
  }, [seatingCandidates, institutions]);

  const handlePrint = () => {
    window.print();
  };

  const selectedSlot = timeTable.find(s => s.id === selectedSlotId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Configuration Header */}
      <div className="filter-bar no-print">
        <div className="form-group">
          <label>Select Report Type</label>
          <select 
            className="form-select"
            value={reportType}
            onChange={(e) => {
              const val = e.target.value;
              setReportType(val);
              if (val === 'centre_exam_summary' || val === 'desk_slips') {
                setSelectedCenter('all');
              }
              if (val === 'desk_slips') {
                setSelectedSlotId('all');
              }
            }}
          >
            <option value="office_summary">Office Summary (Total Question Paper Print Counts)</option>
            <option value="center_packing">Center Packing Counts (Envelop Packing Sheet)</option>
            <option value="centre_exam_summary">Centre Exam Schedule & Seating Summary</option>
            <option value="attendance_register">Center Attendance Register (Subject-wise by Class)</option>
            <option value="desk_slips">Desk Slips & Seating Arrangement Chart</option>
            <option value="center_list">Center Allocation List (For Publication to Principals)</option>
            <option value="institution_enrollment">Institution Enrollment Summary (For Center Planning)</option>
          </select>
        </div>

        {(reportType === 'center_packing' || reportType === 'centre_exam_summary') && (
          <div className="form-group">
            <label>Exam Center Filter</label>
            <select
              className="form-select"
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
            >
              <option value="all">All Exam Centers (Sequential list)</option>
              {examCenters.map(ec => (
                <option key={ec.code} value={ec.code}>{ec.code} - {ec.name}</option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'desk_slips' && (
          <>
            <div className="form-group">
              <label>Select Exam Center</label>
              <select
                className="form-select"
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
              >
                <option value="all">All Exam Centers (Sequential list)</option>
                {examCenters.map(ec => (
                  <option key={ec.code} value={ec.code}>{ec.code} - {ec.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Exam Slot</label>
              <select
                className="form-select"
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
              >
                <option value="all">All Exam Slots (Sequential list)</option>
                {timeTable.map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {new Date(slot.date).toLocaleDateString()} ({slot.session})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>View Mode</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button"
                  className={`btn ${deskSlipsViewMode === 'chart' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDeskSlipsViewMode('chart')}
                  style={{ padding: '8px 12px', fontSize: '13px', whiteSpace: 'nowrap', height: '42px' }}
                >
                  Seating Chart
                </button>
                <button 
                  type="button"
                  className={`btn ${deskSlipsViewMode === 'slips' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDeskSlipsViewMode('slips')}
                  style={{ padding: '8px 12px', fontSize: '13px', whiteSpace: 'nowrap', height: '42px' }}
                >
                  Desk Slips (8/Page)
                </button>
              </div>
            </div>
          </>
        )}

        {reportType === 'attendance_register' && (
          <>
            <div className="form-group">
              <label>Select Exam Center</label>
              <select
                className="form-select"
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
              >
                {examCenters.map(ec => (
                  <option key={ec.code} value={ec.code}>{ec.code} - {ec.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Class</label>
              <select
                className="form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classesList.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
                {classesList.length === 0 && <option value="">-- No Classes Found --</option>}
              </select>
            </div>
          </>
        )}

        <button className="btn btn-primary" onClick={handlePrint} style={{ height: '42px', marginTop: 'auto' }}>
          <Printer size={16} /> Print Report / Save PDF
        </button>
      </div>

      {/* Printable Report Paper */}
      <div className="print-section">
        
        {/* OFFICE SUMMARY REPORT */}
        {reportType === 'office_summary' && (
          <div>
            <div className="print-report-header">
              <h2>Council of Samastha Womens Colleges (CSWC)</h2>
              <h3>SAY & Improvement Examinations</h3>
              <p>Office Summary Report - Question Paper Printing Requirements</p>
            </div>

            <div className="print-meta-grid">
              <div className="meta-item">Report Date: <strong>{new Date().toLocaleDateString()}</strong></div>
              <div className="meta-item">Total Subject Registers: <strong>{registrations.length}</strong></div>
              <div className="meta-item">Total Candidates: <strong>{new Set(registrations.map(r=>r.uid)).size}</strong></div>
              <div className="meta-item">Total Institutions: <strong>{institutions.length}</strong></div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>SL NO</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Class</th>
                  <th style={{ textAlign: 'left' }}>Subject Name</th>
                  <th style={{ width: '180px', textAlign: 'center' }}>Required Prints</th>
                </tr>
              </thead>
              <tbody>
                {officeSummary.map((item, idx) => (
                  <tr key={`${item.class}_${item.subject}`}>
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '12px', padding: '6px 12px', fontWeight: '800' }}>
                        {item.class}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', fontSize: '15px', textAlign: 'left' }}>
                      {item.subject}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '16px', color: 'var(--primary)' }}>
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="print-signatures">
              <div className="sig-block">Prepared By</div>
              <div className="sig-block">Checked By</div>
              <div className="sig-block">Controller of Examinations</div>
            </div>
          </div>
        )}

        {/* CENTER PACKING REPORT */}
        {reportType === 'center_packing' && (
          <div>
            {selectedCenter === 'all' ? (
              // Print all centers sequentially
              Object.entries(centerPackingData).map(([cCode, cData], cIdx) => {
                const subEntries = Object.entries(cData.subjects);
                const totalPapers = subEntries.reduce((sum, [_, v]) => sum + v, 0);
                
                return (
                  <div key={cCode} className="page-break-after" style={{ marginBottom: '40px' }}>
                    <div className="print-report-header">
                      <h2>Council of Samastha Womens Colleges (CSWC)</h2>
                      <h3>Question Paper Packing Sheet</h3>
                      <p>Center-wise Subject Counts</p>
                    </div>

                    <div className="print-meta-grid">
                      <div className="meta-item">Center Name: <strong>{cData.name} ({cCode})</strong></div>
                      <div className="meta-item">Place: <strong>{cData.place}</strong></div>
                      <div className="meta-item">Report Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                      <div className="meta-item">Total Packets (Papers): <strong>{totalPapers}</strong></div>
                    </div>

                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>SL NO</th>
                          <th style={{ textAlign: 'left' }}>Subject Name</th>
                          <th style={{ width: '150px', textAlign: 'center' }}>Total Papers Required</th>
                          <th style={{ width: '150px' }}>Packed Status (Tick)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subEntries.map(([subject, count], idx) => (
                          <tr key={subject}>
                            <td>{idx + 1}</td>
                            <td style={{ fontWeight: '700', textAlign: 'left' }}>{subject}</td>
                            <td style={{ textAlign: 'center', fontWeight: '800' }}>{count}</td>
                            <td>[ &nbsp; ]</td>
                          </tr>
                        ))}
                        {subEntries.length === 0 && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic', padding: '24px' }}>
                              No candidate registrations are assigned to write at this center.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="print-signatures">
                      <div className="sig-block">Packing Clerk</div>
                      <div className="sig-block">Verified By (Superintendent)</div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Print single center
              (() => {
                const cData = centerPackingData[selectedCenter];
                if (!cData) return <div>No center found</div>;
                const subEntries = Object.entries(cData.subjects);
                const totalPapers = subEntries.reduce((sum, [_, v]) => sum + v, 0);

                return (
                  <div>
                    <div className="print-report-header">
                      <h2>Council of Samastha Womens Colleges (CSWC)</h2>
                      <h3>Question Paper Packing Sheet</h3>
                      <p>Center-wise Subject Counts</p>
                    </div>

                    <div className="print-meta-grid">
                      <div className="meta-item">Center Name: <strong>{cData.name} ({selectedCenter})</strong></div>
                      <div className="meta-item">Place: <strong>{cData.place}</strong></div>
                      <div className="meta-item">Report Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                      <div className="meta-item">Total Packets (Papers): <strong>{totalPapers}</strong></div>
                    </div>

                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>SL NO</th>
                          <th style={{ textAlign: 'left' }}>Subject Name</th>
                          <th style={{ width: '150px', textAlign: 'center' }}>Total Papers Required</th>
                          <th style={{ width: '150px' }}>Packed Status (Tick)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subEntries.map(([subject, count], idx) => (
                          <tr key={subject}>
                            <td>{idx + 1}</td>
                            <td style={{ fontWeight: '700', textAlign: 'left' }}>{subject}</td>
                            <td style={{ textAlign: 'center', fontWeight: '800' }}>{count}</td>
                            <td>[ &nbsp; ]</td>
                          </tr>
                        ))}
                        {subEntries.length === 0 && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic', padding: '24px' }}>
                              No candidate registrations are assigned to write at this center.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="print-signatures">
                      <div className="sig-block">Packing Clerk</div>
                      <div className="sig-block">Verified By (Superintendent)</div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* CENTRE EXAM SCHEDULE & SEATING SUMMARY */}
        {reportType === 'centre_exam_summary' && (
          <div>
            <div className="print-report-header">
              <h2>Council of Samastha Womens Colleges (CSWC)</h2>
              <h3>SAY & Improvement Examinations</h3>
              <p>Centre Exam Schedule & Seating Summary</p>
            </div>

            <div className="print-meta-grid">
              <div className="meta-item">Report Date: <strong>{new Date().toLocaleDateString()}</strong></div>
              <div className="meta-item">Total Exam Centers: <strong>{examCenters.length}</strong></div>
              <div className="meta-item">Timetable Slots: <strong>{timeTable.length}</strong></div>
              <div className="meta-item">Total Paper Registrations: <strong>{registrations.length}</strong></div>
            </div>

            {centreExamSummaryData
              .filter(center => selectedCenter === 'all' || center.centerCode === selectedCenter)
              .map(center => {
                const totalCandidatesForCenter = center.slots.reduce((sum, s) => sum + s.totalCount, 0);
                
                return (
                  <div key={center.centerCode} className="page-break-after" style={{ marginBottom: '40px' }}>
                    <h4 style={{ 
                      backgroundColor: 'var(--primary-light)', 
                      color: 'var(--primary)', 
                      padding: '10px 16px', 
                      borderRadius: 'var(--radius-sm)', 
                      marginBottom: '12px',
                      borderLeft: '4px solid var(--primary)',
                      fontSize: '16px',
                      fontWeight: '800',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>CENTER: [{center.centerCode}] {center.centerName}, {center.place}</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                        Total Seat Allocations: {totalCandidatesForCenter}
                      </span>
                    </h4>

                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '150px', textAlign: 'center' }}>Date & Session</th>
                          <th style={{ width: '180px', textAlign: 'center' }}>Time Slot</th>
                          <th style={{ textAlign: 'left' }}>Subject-wise Allocation Breakdown</th>
                          <th style={{ width: '140px', textAlign: 'center' }}>Total Attending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {center.slots.map(slot => (
                          <tr key={slot.slotId}>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>
                              <div>{new Date(slot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{slot.session}</div>
                            </td>
                            <td style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                              {slot.time}
                            </td>
                            <td style={{ textAlign: 'left' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {slot.subjects.map(sub => (
                                  <span key={sub.subject} className="badge badge-neutral" style={{ fontSize: '11px', padding: '4px 8px' }}>
                                    {sub.subject}: <strong>{sub.count}</strong>
                                  </span>
                                ))}
                                {slot.subjects.length === 0 && (
                                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>
                                    No exams scheduled / no students assigned
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '15px', color: slot.totalCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                              {slot.totalCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

            <div className="print-signatures">
              <div className="sig-block">Prepared By</div>
              <div className="sig-block">Checked By</div>
              <div className="sig-block">Controller of Examinations</div>
            </div>
          </div>
        )}

        {/* ATTENDANCE REGISTER */}
        {reportType === 'attendance_register' && (
          <div>
            {(() => {
              const centerObj = institutions.find(i => i.code === selectedCenter);
              
              // Filter subjects in class that have students registered at this center
              const activeSubjects = subjectsInClass.filter(subject => {
                return registrations.some(r => {
                  const regCenterCode = schoolToCenterCode[r.school_code];
                  return regCenterCode === selectedCenter && r.class === selectedClass && cleanSubjectName(r.subject) === subject;
                });
              });

              return (
                <div>
                  {activeSubjects.map((subject, sIdx) => {
                    const subjectAttendance = registrations.filter(r => {
                      const regCenterCode = schoolToCenterCode[r.school_code];
                      return regCenterCode === selectedCenter && r.class === selectedClass && cleanSubjectName(r.subject) === subject;
                    }).sort((a, b) => a.name.localeCompare(b.name));

                    const slot = timeTable.find(s => s.subjects.map(sub => cleanSubjectName(sub)).includes(subject));
                    const isLast = sIdx === activeSubjects.length - 1;

                    return (
                      <div key={subject} className={isLast ? '' : 'page-break-after'} style={{ marginBottom: '40px' }}>
                        <div className="print-report-header">
                          <h2>Council of Samastha Womens Colleges (CSWC)</h2>
                          <h3>SAY & Improvement Examinations</h3>
                          <p>Exam Attendance Register (Subject-wise)</p>
                        </div>

                        <div className="print-meta-grid">
                          <div className="meta-item">Exam Center: <strong>{centerObj?.name} ({selectedCenter})</strong></div>
                          <div className="meta-item">Place: <strong>{centerObj?.place}</strong></div>
                          <div className="meta-item">Class: <strong>{selectedClass}</strong></div>
                          <div className="meta-item">Subject: <strong>{subject}</strong></div>
                          
                          {slot ? (
                            <>
                              <div className="meta-item">Exam Date: <strong>{new Date(slot.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                              <div className="meta-item">Session: <strong>{slot.session} ({slot.session.includes('FN') ? fnTime : anTime})</strong></div>
                            </>
                          ) : (
                            <>
                              <div className="meta-item">Exam Date: <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>Not Scheduled yet</span></div>
                              <div className="meta-item">Session: <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>Not Scheduled yet</span></div>
                            </>
                          )}
                          <div className="meta-item">Total Candidates: <strong>{subjectAttendance.length}</strong></div>
                        </div>

                        <table className="data-table">
                          <thead>
                            <tr>
                              <th style={{ width: '50px', textAlign: 'center' }}>SL</th>
                              <th style={{ width: '100px' }}>Student UID</th>
                              <th style={{ textAlign: 'left' }}>Student Name</th>
                              <th style={{ width: '80px', textAlign: 'center' }}>Class</th>
                              <th style={{ textAlign: 'left' }}>College Name</th>
                              <th style={{ width: '150px' }}>Candidate Signature</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subjectAttendance.map((reg, idx) => (
                              <tr key={idx}>
                                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                <td><code>{reg.uid}</code></td>
                                <td style={{ fontWeight: '700', textAlign: 'left' }}>{reg.name}</td>
                                <td style={{ textAlign: 'center' }}><span className="badge badge-neutral" style={{ fontSize: '10px' }}>{reg.class}</span></td>
                                <td style={{ textAlign: 'left' }}>{reg.school_name}</td>
                                <td style={{ height: '35px' }}></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="print-signatures" style={{ marginTop: '80px' }}>
                          <div className="sig-block" style={{ borderTop: '1px solid #000' }}>Invigilator Name & Sig.</div>
                          <div className="sig-block" style={{ borderTop: '1px solid #000' }}>Chief Superintendent (Seal & Sig.)</div>
                        </div>
                      </div>
                    );
                  })}

                  {activeSubjects.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>No candidates found for Class {selectedClass} at this center.</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Try selecting a different exam center or class.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* CENTER ALLOCATION LIST */}
        {reportType === 'center_list' && (
          <div>
            <div className="print-report-header">
              <h2>Council of Samastha Womens Colleges (CSWC)</h2>
              <h3>SAY & Improvement Examinations</h3>
              <p>Exam Center Allocation List (For Publication to Principals)</p>
            </div>

            <div className="print-meta-grid">
              <div className="meta-item">Report Date: <strong>{new Date().toLocaleDateString()}</strong></div>
              <div className="meta-item">Total Institutions: <strong>{institutions.length}</strong></div>
              <div className="meta-item">Designated Centers: <strong>{examCenters.length}</strong></div>
              <div className="meta-item">Unassigned Colleges: <strong style={{ color: institutions.filter(i => !i.isExamCenter && !i.assignedToCenter).length > 0 ? 'var(--danger)' : 'var(--success)' }}>{institutions.filter(i => !i.isExamCenter && !i.assignedToCenter).length}</strong></div>
            </div>

            {institutionsByZone.map(({ zone, institutions: zoneInsts }) => (
              <div key={zone} style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginBottom: '32px' }}>
                <h4 style={{ 
                  backgroundColor: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  padding: '10px 16px', 
                  borderRadius: 'var(--radius-sm)', 
                  marginBottom: '12px',
                  borderLeft: '4px solid var(--primary)',
                  fontSize: '16px',
                  fontWeight: '800'
                }}>
                  ZONE: {zone} ({zoneInsts.length} Colleges)
                </h4>

                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>SL NO</th>
                      <th style={{ width: '80px' }}>CODE</th>
                      <th style={{ textAlign: 'left' }}>COLLEGE NAME & PLACE</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>CANDIDATES</th>
                      <th style={{ textAlign: 'left' }}>ASSIGNED EXAM CENTER</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>CENTER STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneInsts.map((inst, idx) => {
                      const studentCount = new Set(registrations.filter(r => r.school_code === inst.code).map(r => r.uid)).size;
                      const paperCount = registrations.filter(r => r.school_code === inst.code).length;
                      
                      // Center details
                      let centerDisplay = '';
                      let statusBadge = null;

                      if (inst.isExamCenter) {
                        centerDisplay = 'SELF CENTER';
                        statusBadge = <span className="badge badge-success">SELF CENTER</span>;
                      } else if (inst.assignedToCenter) {
                        const center = institutions.find(i => i.code === inst.assignedToCenter);
                        if (center) {
                          centerDisplay = `[${center.code}] ${center.name}, ${center.place}`;
                          statusBadge = <span className="badge badge-neutral">MAPPED</span>;
                        } else {
                          centerDisplay = `[${inst.assignedToCenter}] (Center Details Missing)`;
                          statusBadge = <span className="badge badge-warning">MAPPED (MISSING)</span>;
                        }
                      } else {
                        centerDisplay = 'NOT ASSIGNED';
                        statusBadge = <span className="badge badge-danger">UNASSIGNED</span>;
                      }

                      return (
                        <tr key={inst.code}>
                          <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ fontWeight: '600' }}><code>{inst.code}</code></td>
                          <td style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: '700' }}>{inst.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inst.place} | {inst.district}</div>
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '13px' }}>
                            {studentCount > 0 ? (
                              <span><strong>{studentCount}</strong> std <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({paperCount} papers)</span></span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>0 std</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'left', fontWeight: inst.isExamCenter ? '600' : '400' }}>
                            {inst.isExamCenter ? (
                              <span style={{ color: 'var(--success)', fontWeight: '700' }}>{centerDisplay}</span>
                            ) : inst.assignedToCenter ? (
                              <span>{centerDisplay}</span>
                            ) : (
                              <span style={{ color: 'var(--danger)', fontWeight: '700' }}>{centerDisplay}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {statusBadge}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}

            <div className="print-signatures" style={{ marginTop: '50px' }}>
              <div className="sig-block">Prepared By</div>
              <div className="sig-block">Checked By</div>
              <div className="sig-block">Controller of Examinations</div>
            </div>
          </div>
        )}

        {/* INSTITUTION ENROLLMENT SUMMARY */}
        {reportType === 'institution_enrollment' && (
          <div>
            <div className="print-report-header">
              <h2>Council of Samastha Womens Colleges (CSWC)</h2>
              <h3>SAY & Improvement Examinations</h3>
              <p>Institution Enrollment Summary - For Center Planning & Allocation</p>
            </div>

            <div className="print-meta-grid">
              <div className="meta-item">Report Date: <strong>{new Date().toLocaleDateString()}</strong></div>
              <div className="meta-item">Total Institutions: <strong>{institutions.length}</strong></div>
              <div className="meta-item">Total Candidates: <strong>{new Set(registrations.map(r=>r.uid)).size}</strong></div>
              <div className="meta-item">Total Paper Registrations: <strong>{registrations.length}</strong></div>
            </div>

            {institutionsByZone.map(({ zone, institutions: zoneInsts }) => {
              // Calculate unique student count and paper registrations for this zone
              const zoneSchoolCodes = new Set(zoneInsts.map(i => i.code));
              const zoneUniqueCandidates = new Set(
                registrations
                  .filter(r => zoneSchoolCodes.has(r.school_code))
                  .map(r => r.uid)
              ).size;
              const zoneTotalPapers = registrations
                .filter(r => zoneSchoolCodes.has(r.school_code))
                .length;

              return (
                <div key={zone} style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginBottom: '32px' }}>
                  <h4 style={{ 
                    backgroundColor: 'var(--primary-light)', 
                    color: 'var(--primary)', 
                    padding: '10px 16px', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '12px',
                    borderLeft: '4px solid var(--primary)',
                    fontSize: '16px',
                    fontWeight: '800',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>ZONE: {zone} ({zoneInsts.length} Colleges)</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                      Zone Candidates: {zoneUniqueCandidates} std ({zoneTotalPapers} papers)
                    </span>
                  </h4>

                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>SL NO</th>
                        <th style={{ width: '80px' }}>CODE</th>
                        <th style={{ textAlign: 'left' }}>COLLEGE NAME & PLACE</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>DISTRICT</th>
                        <th style={{ width: '150px', textAlign: 'center' }}>UNIQUE CANDIDATES</th>
                        <th style={{ width: '150px', textAlign: 'center' }}>PAPER REGISTRATIONS</th>
                        <th style={{ textAlign: 'left' }}>CENTER STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zoneInsts.map((inst, idx) => {
                        const studentCount = new Set(registrations.filter(r => r.school_code === inst.code).map(r => r.uid)).size;
                        const paperCount = registrations.filter(r => r.school_code === inst.code).length;
                        
                        let centerDisplay = '';
                        if (inst.isExamCenter) {
                          centerDisplay = 'SELF CENTER';
                        } else if (inst.assignedToCenter) {
                          const center = institutions.find(i => i.code === inst.assignedToCenter);
                          centerDisplay = center ? `MAPPED TO: [${center.code}] ${center.name}` : `MAPPED TO: ${inst.assignedToCenter}`;
                        } else {
                          centerDisplay = 'UNASSIGNED';
                        }

                        return (
                          <tr key={inst.code}>
                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ fontWeight: '600' }}><code>{inst.code}</code></td>
                            <td style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: '700' }}>{inst.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inst.place}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>{inst.district}</td>
                            <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '14px', color: studentCount > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                              {studentCount}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '600', color: paperCount > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                              {paperCount}
                            </td>
                            <td style={{ textAlign: 'left' }}>
                              {inst.isExamCenter ? (
                                <span className="badge badge-success" style={{ fontWeight: 'bold' }}>{centerDisplay}</span>
                              ) : inst.assignedToCenter ? (
                                <span className="badge badge-neutral">{centerDisplay}</span>
                              ) : (
                                <span className="badge badge-danger" style={{ fontWeight: 'bold' }}>{centerDisplay}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}

            <div className="print-signatures" style={{ marginTop: '50px' }}>
              <div className="sig-block">Prepared By</div>
              <div className="sig-block">Checked By</div>
              <div className="sig-block">Controller of Examinations</div>
            </div>
          </div>
        )}

        {/* DESK SLIPS & SEATING CHART */}
        {reportType === 'desk_slips' && (
          <div>
            {groupedSeatingData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>No candidates found for the selected Exam Center and Slot.</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verify that the slot contains scheduled subjects and the center has assigned schools with registrations.</p>
              </div>
            ) : (
              groupedSeatingData.map((group, gIdx) => {
                const totalCand = group.candidates.length;
                const isLast = gIdx === groupedSeatingData.length - 1;

                if (deskSlipsViewMode === 'chart') {
                  // RENDER SEATING CHART LIST
                  return (
                    <div key={`${group.centerCode}_${group.slotId}`} className={isLast ? '' : 'page-break-after'} style={{ marginBottom: '40px' }}>
                      <div className="print-report-header">
                        <h2>Council of Samastha Womens Colleges (CSWC)</h2>
                        <h3>SAY & Improvement Examinations</h3>
                        <p>Exam Seating Arrangement Chart</p>
                      </div>

                      <div className="print-meta-grid">
                        <div className="meta-item">Exam Center: <strong>[{group.centerCode}] {group.centerName}</strong></div>
                        <div className="meta-item">Place: <strong>{group.centerPlace}</strong></div>
                        <div className="meta-item">Exam Date: <strong>{new Date(group.slotDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
                        <div className="meta-item">Session: <strong>{group.slotSession} ({group.slotTime})</strong></div>
                        <div className="meta-item">Total Candidates: <strong>{totalCand}</strong></div>
                        <div className="meta-item">Report Date: <strong>{new Date().toLocaleDateString()}</strong></div>
                      </div>

                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '80px', textAlign: 'center' }}>SEAT NO</th>
                            <th style={{ width: '120px', textAlign: 'center' }}>STUDENT UID</th>
                            <th style={{ textAlign: 'left' }}>STUDENT NAME</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>CLASS</th>
                            <th style={{ textAlign: 'left' }}>SUBJECT</th>
                            <th style={{ textAlign: 'left' }}>COLLEGE NAME</th>
                            <th style={{ width: '140px', textAlign: 'center' }}>SIGNATURE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.candidates.map((cand) => (
                            <tr key={cand.id}>
                              <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '15px' }}>
                                {String(cand.seatNo).padStart(2, '0')}
                              </td>
                              <td style={{ textAlign: 'center' }}><code>{cand.uid}</code></td>
                              <td style={{ fontWeight: '700', textAlign: 'left' }}>{cand.name}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                                  {cand.class}
                                </span>
                              </td>
                              <td style={{ textAlign: 'left', fontWeight: '600' }}>{cand.subject}</td>
                              <td style={{ textAlign: 'left', fontSize: '12px' }}>{cand.school_name}</td>
                              <td style={{ height: '35px' }}></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="print-signatures" style={{ marginTop: '60px' }}>
                        <div className="sig-block" style={{ borderTop: '1px solid #000' }}>Invigilator Name & Sig.</div>
                        <div className="sig-block" style={{ borderTop: '1px solid #000' }}>Chief Superintendent (Seal & Sig.)</div>
                      </div>
                    </div>
                  );
                } else {
                  // RENDER PRINTABLE DESK SLIPS (8 PER PAGE)
                  const chunks = [];
                  for (let i = 0; i < group.candidates.length; i += 8) {
                    chunks.push(group.candidates.slice(i, i + 8));
                  }

                  return (
                    <div key={`${group.centerCode}_${group.slotId}`}>
                      {chunks.map((chunk, cIdx) => {
                        const isLastChunk = cIdx === chunks.length - 1;
                        const pageIsLast = isLast && isLastChunk;
                        return (
                          <div 
                            key={cIdx} 
                            className={`desk-slips-page ${pageIsLast ? '' : 'page-break-after'}`}
                            style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '1fr 1fr', 
                              gridTemplateRows: 'repeat(4, 1fr)', 
                              gap: '12px',
                              boxSizing: 'border-box',
                              marginBottom: '20px'
                            }}
                          >
                            {chunk.map((cand) => (
                              <div key={cand.id} className="desk-slip-card">
                                <div className="desk-slip-header">
                                  <div className="desk-slip-logo">CSWC</div>
                                  <div className="desk-slip-title">SAY/IMP EXAM 2026</div>
                                </div>
                                <div className="desk-slip-body">
                                  <div className="desk-slip-row">
                                    <span className="desk-slip-label">Center:</span>
                                    <span className="desk-slip-value" style={{ fontWeight: '800', textTransform: 'uppercase' }}>
                                      [{group.centerCode}] {group.centerName.substring(0, 30)}{group.centerName.length > 30 ? '...' : ''}
                                    </span>
                                  </div>
                                  
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                      <span className="desk-slip-label">Seat No:</span>
                                      <span className="desk-slip-seat-no">
                                        {String(cand.seatNo).padStart(2, '0')}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                      <span className="desk-slip-label">Class:</span>
                                      <span className="desk-slip-class">{cand.class}</span>
                                    </div>
                                  </div>

                                  <div className="desk-slip-row">
                                    <span className="desk-slip-label">Candidate Name:</span>
                                    <span className="desk-slip-name">{cand.name}</span>
                                  </div>
                                  
                                  <div className="desk-slip-row">
                                    <span className="desk-slip-label">UID:</span>
                                    <span className="desk-slip-uid">{cand.uid}</span>
                                  </div>

                                  <div className="desk-slip-row">
                                    <span className="desk-slip-label">Subject:</span>
                                    <span className="desk-slip-subject">{cand.subject}</span>
                                  </div>

                                  <div className="desk-slip-row-split">
                                    <div>
                                      <span className="desk-slip-label">Date:</span>
                                      <span className="desk-slip-value" style={{ fontSize: '10px' }}>
                                        {new Date(group.slotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="desk-slip-label">Session:</span>
                                      <span className="desk-slip-value" style={{ fontSize: '10px' }}>
                                        {group.slotSession.includes('FN') ? 'FN' : 'AN'} ({group.slotTime})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
              })
            )}
          </div>
        )}

      </div>

    </div>
  );
};

export default Reports;
