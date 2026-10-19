import React, { useState, useMemo } from 'react';
import { 
  Move, 
  AlertTriangle, 
  CheckCircle, 
  Printer, 
  FileText, 
  Users, 
  Sparkles, 
  Building2,
  Calendar,
  Clock,
  ArrowRightLeft,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { checkBenchRuleViolations } from '../utils/seatingArrangementEngine';

// Vibrant distinct color palettes for classes to easily identify side-by-side / adjacent distribution
const CLASS_PALETTES = [
  { name: 'Blue', bg: '#eff6ff', border: '#3b82f6', badgeBg: '#dbeafe', badgeText: '#1d4ed8', dot: '#2563eb' },
  { name: 'Emerald', bg: '#ecfdf5', border: '#10b981', badgeBg: '#d1fae5', badgeText: '#047857', dot: '#059669' },
  { name: 'Amber', bg: '#fffbeb', border: '#f59e0b', badgeBg: '#fef3c7', badgeText: '#b45309', dot: '#d97706' },
  { name: 'Purple', bg: '#faf5ff', border: '#a855f7', badgeBg: '#f3e8ff', badgeText: '#7e22ce', dot: '#9333ea' },
  { name: 'Rose', bg: '#fff1f2', border: '#f43f5e', badgeBg: '#ffe4e6', badgeText: '#be123c', dot: '#e11d48' },
  { name: 'Cyan', bg: '#ecfeff', border: '#06b6d4', badgeBg: '#cffafe', badgeText: '#0e7490', dot: '#0891b2' },
  { name: 'Orange', bg: '#fff7ed', border: '#f97316', badgeBg: '#ffedd5', badgeText: '#c2410c', dot: '#ea580c' },
  { name: 'Indigo', bg: '#eef2ff', border: '#6366f1', badgeBg: '#e0e7ff', badgeText: '#4338ca', dot: '#4f46e5' },
  { name: 'Teal', bg: '#f0fdfa', border: '#14b8a6', badgeBg: '#ccfbf1', badgeText: '#0f766e', dot: '#0d9488' },
  { name: 'Fuchsia', bg: '#fdf4ff', border: '#d946ef', badgeBg: '#fae8ff', badgeText: '#a21caf', dot: '#c026d3' }
];

export default function SeatingArrangementView({
  examDetails,
  arrangement,
  rulesConfig = { separateSameClassAdjacent: true, disallowSameClassBench: false },
  onToggleRule,
  onUpdateArrangement,
  onOpenPrint
}) {
  const [selectedHallId, setSelectedHallId] = useState(
    arrangement?.hallAllocations?.[0]?.hallId || ''
  );

  // Drag-and-drop state or Click-to-swap state
  const [draggedSeat, setDraggedSeat] = useState(null);
  const [selectedSeatForSwap, setSelectedSeatForSwap] = useState(null);
  const [transferModalStudent, setTransferModalStudent] = useState(null); // For manual quick transfer modal

  if (!arrangement || !arrangement.hallAllocations || arrangement.hallAllocations.length === 0) {
    return (
      <div className="card" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px' }}>
        <Sparkles size={48} style={{ opacity: 0.3, marginBottom: '12px', color: 'var(--primary)' }} />
        <h3>No Seating Arrangement Generated Yet</h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '8px auto' }}>
          Select your Exam Details, configure Halls & Benches, assign Classes for the exam session, and click "Generate Seating Arrangement".
        </p>
      </div>
    );
  }

  const currentHall = arrangement.hallAllocations.find(h => h.hallId === selectedHallId) 
    || arrangement.hallAllocations[0];

  // Map each unique class to a distinct color palette
  const classColorMap = useMemo(() => {
    const map = {};
    let colorIndex = 0;
    arrangement.hallAllocations.forEach(hall => {
      hall.benches.forEach(bench => {
        bench.seats.forEach(seat => {
          if (seat.student?.className && !map[seat.student.className]) {
            map[seat.student.className] = CLASS_PALETTES[colorIndex % CLASS_PALETTES.length];
            colorIndex++;
          }
        });
      });
    });
    return map;
  }, [arrangement]);

  // Check rule violations across all benches in this hall according to active rules
  const currentHallViolations = useMemo(() => {
    return checkBenchRuleViolations(currentHall?.benches || [], {
      adjacentOnly: !rulesConfig.disallowSameClassBench,
      disallowSameClassBench: !!rulesConfig.disallowSameClassBench
    });
  }, [currentHall, rulesConfig]);

  // Swapping two seat assignments (supports SAME HALL or ACROSS DIFFERENT HALLS)
  const handleSwapSeats = (source, target) => {
    if (!source || !target) return;
    if (source.hallId === target.hallId && 
        source.benchId === target.benchId && 
        source.seatIndex === target.seatIndex) {
      // Same seat clicked
      return;
    }

    const updatedHalls = arrangement.hallAllocations.map(hall => {
      const updatedBenches = hall.benches.map(bench => {
        const updatedSeats = bench.seats.map((seat, sIdx) => {
          // Check if this is source seat
          if (hall.hallId === source.hallId && bench.benchId === source.benchId && sIdx === source.seatIndex) {
            return {
              ...seat,
              student: target.student
            };
          }
          // Check if this is target seat
          if (hall.hallId === target.hallId && bench.benchId === target.benchId && sIdx === target.seatIndex) {
            return {
              ...seat,
              student: source.student
            };
          }
          return seat;
        });
        return { ...bench, seats: updatedSeats };
      });
      return { ...hall, benches: updatedBenches };
    });

    onUpdateArrangement({
      ...arrangement,
      hallAllocations: updatedHalls
    });

    setSelectedSeatForSwap(null);
    setDraggedSeat(null);
    setTransferModalStudent(null);
  };

  // Drag and drop handlers
  const onDragStart = (e, seatData) => {
    setDraggedSeat(seatData);
    e.dataTransfer.setData('text/plain', JSON.stringify(seatData));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (e, targetSeatData) => {
    e.preventDefault();
    if (draggedSeat) {
      handleSwapSeats(draggedSeat, targetSeatData);
    }
  };

  // Transfer student to target hall (first empty seat or swapped with seat in that hall)
  const handleDropOnHallTab = (targetHallId, candidateSeat = null) => {
    const seatToMove = candidateSeat || draggedSeat || selectedSeatForSwap;
    if (!seatToMove || !seatToMove.student) {
      console.warn('No student selected or dragged to transfer');
      return;
    }
    if (seatToMove.hallId === targetHallId) return;

    const targetHall = arrangement.hallAllocations.find(h => h.hallId === targetHallId);
    if (!targetHall) return;

    // Look for first empty seat in target hall
    let targetSeatFound = null;
    for (const b of targetHall.benches) {
      for (let sIdx = 0; sIdx < b.seats.length; sIdx++) {
        if (!b.seats[sIdx].student) {
          targetSeatFound = {
            hallId: targetHall.hallId,
            benchId: b.benchId,
            benchNumber: b.benchNumber,
            seatIndex: sIdx,
            student: null
          };
          break;
        }
      }
      if (targetSeatFound) break;
    }

    // If no empty seat found in target hall, swap with the very first seat in target hall
    if (!targetSeatFound && targetHall.benches[0]?.seats[0]) {
      targetSeatFound = {
        hallId: targetHall.hallId,
        benchId: targetHall.benches[0].benchId,
        benchNumber: targetHall.benches[0].benchNumber,
        seatIndex: 0,
        student: targetHall.benches[0].seats[0].student
      };
    }

    if (targetSeatFound) {
      handleSwapSeats(seatToMove, targetSeatFound);
      setSelectedHallId(targetHallId);
    }
  };

  // Click-to-swap fallback
  const handleSeatClick = (seatData) => {
    if (!selectedSeatForSwap) {
      if (seatData.student) {
        setSelectedSeatForSwap(seatData);
      }
    } else {
      handleSwapSeats(selectedSeatForSwap, seatData);
    }
  };

  // Count total students placed
  let totalAssigned = 0;
  let totalCapacity = 0;
  arrangement.hallAllocations.forEach(h => {
    h.benches.forEach(b => {
      b.seats.forEach(s => {
        totalCapacity++;
        if (s.student) totalAssigned++;
      });
    });
  });

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              {examDetails.examName || 'Exam Seating Arrangement'}
            </h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {examDetails.examDate || 'No date set'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {examDetails.examTime || 'No time set'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--primary)' }}>
                <Users size={14} /> {totalAssigned} Students Seated / {totalCapacity} Seats
              </span>
            </div>
          </div>
        </div>

        {/* Print Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onOpenPrint('hall_plan')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}
          >
            <Printer size={16} /> Print Seating Plan (Map)
          </button>
          <button
            onClick={() => onOpenPrint('hall_roster')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}
          >
            <FileText size={16} /> Print Seating List (Roster)
          </button>
          <button
            onClick={() => onOpenPrint('student_notice')}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700 }}
          >
            <Printer size={16} /> Print Student Announcement List
          </button>
        </div>
      </div>

      {/* Class Color Legend & Rule Toggles */}
      <div style={{
        background: '#fff',
        borderRadius: '10px',
        padding: '12px 18px',
        marginBottom: '16px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginRight: '6px' }}>
            <Layers size={16} color="var(--primary)" />
            <span>Class Colors:</span>
          </div>
          {Object.entries(classColorMap).map(([cName, palette]) => (
            <div
              key={cName}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: palette.bg,
                border: `1.5px solid ${palette.border}`,
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: palette.badgeText
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: palette.dot }}></span>
              <span>{cName}</span>
            </div>
          ))}
        </div>

        {/* Quick Rule Toggle Options */}
        {onToggleRule && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 700, color: '#475569' }}>Rules Active:</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={rulesConfig.separateSameClassAdjacent ?? true}
                onChange={() => onToggleRule('separateSameClassAdjacent')}
              />
              <span>No Direct Side-by-Side</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={rulesConfig.disallowSameClassBench ?? false}
                onChange={() => onToggleRule('disallowSameClassBench')}
              />
              <span>Strict 1-Per-Bench</span>
            </label>
          </div>
        )}
      </div>

      {/* Instruction Tip & Active Selected Seat Bar */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '10px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '0.875rem',
        color: '#1e40af'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Move size={18} />
          <span>
            <strong>Drag & Drop to adjust:</strong> Drag any student card onto another seat to swap, <strong>drag onto a Hall tab to transfer to that hall</strong>, or click one seat then click another.
          </span>
        </div>
        {selectedSeatForSwap && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600, color: '#b45309', background: '#fef3c7', border: '1px solid #fde047', padding: '4px 10px', borderRadius: '6px' }}>
              Selected: <strong>{selectedSeatForSwap.student?.rollNo}</strong> ({selectedSeatForSwap.student?.name}) from Bench #{selectedSeatForSwap.benchNumber}
            </span>
            <button
              onClick={() => setSelectedSeatForSwap(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              title="Cancel selection"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Violations Warning if any */}
      {currentHallViolations.length > 0 && (
        <div style={{
          background: 'var(--warning-bg)',
          border: '1px solid var(--warning)',
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.875rem',
          color: '#854d0e'
        }}>
          <AlertTriangle size={18} color="var(--warning)" />
          <div>
            <strong>Rule Advisory:</strong> Direct side-by-side neighbors from the same class detected in {currentHallViolations.length} bench(es) ({currentHallViolations.map(v => `Bench #${v.benchNumber}`).join(', ')}). Drag & drop to separate them.
          </div>
        </div>
      )}

      {/* Hall Tabs (With Drag-Drop Target Support to Transfer to Next Hall) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '6px' }}>
        {arrangement.hallAllocations.map(hall => {
          const isSelected = hall.hallId === selectedHallId;
          const hallViolations = checkBenchRuleViolations(hall.benches || [], {
            adjacentOnly: !rulesConfig.disallowSameClassBench,
            disallowSameClassBench: !!rulesConfig.disallowSameClassBench
          });
          const studentCount = hall.benches.reduce((acc, b) => acc + b.seats.filter(s => s.student).length, 0);

          return (
            <div
              key={hall.hallId}
              onDragOver={(e) => onDragOver(e)}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnHallTab(hall.hallId);
              }}
              onClick={() => { setSelectedHallId(hall.hallId); }}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: isSelected ? '2px solid var(--primary)' : '1px dashed var(--border-color)',
                background: isSelected ? 'var(--primary)' : '#fff',
                color: isSelected ? '#fff' : 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
              title={`Click to view ${hall.hallName} or drag a student here to transfer`}
            >
              <Building2 size={16} />
              <span>{hall.hallName}</span>
              <span style={{
                background: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                color: isSelected ? '#fff' : 'var(--text-muted)',
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {studentCount} Students
              </span>

              {/* Transfer button if a student is currently selected */}
              {selectedSeatForSwap && selectedSeatForSwap.hallId !== hall.hallId && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDropOnHallTab(hall.hallId);
                  }}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                  title="Move selected student to this hall"
                >
                  <ArrowRight size={12} /> Transfer Here
                </button>
              )}

              {hallViolations.length > 0 && (
                <span style={{
                  background: isSelected ? '#ef4444' : '#fee2e2',
                  color: isSelected ? '#fff' : '#b91c1c',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {hallViolations.length} clashes
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Hall Layout View */}
      {currentHall && (
        <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          {/* Hall Header & Blackboard Indicator */}
          <div style={{
            background: '#1e293b',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            marginBottom: '24px',
            fontWeight: 700,
            fontSize: '0.9rem',
            letterSpacing: '2px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}>
            ▲ BLACKBOARD / PODIUM (FRONT OF {currentHall.hallName.toUpperCase()}) ▲
          </div>

          {/* Benches Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${currentHall.columns || 4}, 1fr)`,
            gap: '16px',
            overflowX: 'auto'
          }}>
            {currentHall.benches.map(bench => {
              // Check if this bench has any rule clash based on active rules
              const hasClash = currentHallViolations.some(v => v.benchId === bench.benchId);

              return (
                <div
                  key={bench.benchId}
                  style={{
                    border: hasClash ? '2px solid var(--danger)' : '1px solid var(--border-color)',
                    background: hasClash ? '#fff5f5' : '#f8fafc',
                    borderRadius: '10px',
                    padding: '10px',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: hasClash ? 'var(--danger)' : 'var(--text-main)' }}>
                      Bench #{bench.benchNumber}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      R{bench.rowNum} : C{bench.colNum}
                    </span>
                  </div>

                  {/* Seats on Bench */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {bench.seats.map((seat, sIdx) => {
                      const student = seat.student;
                      const palette = student?.className ? classColorMap[student.className] || CLASS_PALETTES[0] : null;

                      const isSelectedForSwap = selectedSeatForSwap && 
                        selectedSeatForSwap.hallId === currentHall.hallId &&
                        selectedSeatForSwap.benchId === bench.benchId &&
                        selectedSeatForSwap.seatIndex === sIdx;

                      const seatData = {
                        hallId: currentHall.hallId,
                        benchId: bench.benchId,
                        benchNumber: bench.benchNumber,
                        seatIndex: sIdx,
                        student
                      };

                      return (
                        <div
                          key={sIdx}
                          draggable={!!student}
                          onDragStart={(e) => onDragStart(e, seatData)}
                          onDragOver={onDragOver}
                          onDrop={(e) => onDrop(e, seatData)}
                          onClick={() => handleSeatClick(seatData)}
                          style={{
                            flex: 1,
                            minHeight: '88px',
                            background: isSelectedForSwap 
                              ? '#fef08a' 
                              : student && palette
                                ? palette.bg 
                                : '#f1f5f9',
                            border: isSelectedForSwap 
                              ? '2px solid #ca8a04' 
                              : student && palette
                                ? `1.5px solid ${palette.border}` 
                                : '1px dashed #cbd5e1',
                            borderRadius: '8px',
                            padding: '8px 6px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: student ? 'grab' : (selectedSeatForSwap ? 'pointer' : 'default'),
                            transition: 'all 0.15s ease',
                            boxShadow: student ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                            position: 'relative'
                          }}
                          title={student ? `Drag or click to move ${student.name} (${student.rollNo})` : 'Empty seat (Click or drop to place selected student)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                            <span>{seat.seatPositionName}</span>
                            {student && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTransferModalStudent(seatData);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: palette?.badgeText || '#64748b',
                                    cursor: 'pointer',
                                    padding: '1px'
                                  }}
                                  title="Transfer to another hall"
                                >
                                  <ArrowRightLeft size={12} />
                                </button>
                                <Move size={12} style={{ opacity: 0.6 }} />
                              </div>
                            )}
                          </div>

                          {student ? (
                            <div style={{ textAlign: 'center', marginTop: '4px' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                                {student.rollNo}
                              </div>
                              <div style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: palette ? palette.badgeText : '#0284c7',
                                background: palette ? palette.badgeBg : '#e0f2fe',
                                border: palette ? `1px solid ${palette.border}40` : 'none',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                maxWidth: '100%',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginTop: '3px'
                              }}>
                                {student.className}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                color: '#334155',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                marginTop: '3px'
                              }}>
                                {student.name}
                              </div>
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', padding: '12px 0' }}>
                              [ Empty ]
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Quick Transfer Modal */}
      {transferModalStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1500,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} color="var(--primary)" />
                Transfer Student to Another Hall
              </h3>
              <button onClick={() => setTransferModalStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Select target hall to transfer <strong>{transferModalStudent.student?.name}</strong> (Roll: {transferModalStudent.student?.rollNo}):
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {arrangement.hallAllocations
                .filter(h => h.hallId !== transferModalStudent.hallId)
                .map(targetHall => (
                  <button
                    key={targetHall.hallId}
                    type="button"
                    onClick={() => {
                      handleDropOnHallTab(targetHall.hallId, transferModalStudent);
                      setTransferModalStudent(null);
                    }}
                    className="btn btn-secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{targetHall.hallName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {targetHall.totalBenches} benches
                      </div>
                    </div>
                    <ArrowRight size={16} color="var(--primary)" />
                  </button>
                ))}
              {arrangement.hallAllocations.length <= 1 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>
                  No other halls assigned in this session. Add more halls in the "Halls & Benches Setup" tab first.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setTransferModalStudent(null)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Students Notice (if any) */}
      {arrangement.unassignedStudents && arrangement.unassignedStudents.length > 0 && (
        <div style={{
          marginTop: '20px',
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid var(--danger)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 700, marginBottom: '8px' }}>
            <AlertTriangle size={20} />
            <span>Unassigned Candidates ({arrangement.unassignedStudents.length})</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            These students could not be seated due to bench capacity limits or lack of alternating class seats. Consider increasing benches in your hall configuration or adding another hall.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
            {arrangement.unassignedStudents.map((std, idx) => {
              const pal = classColorMap[std.className] || CLASS_PALETTES[0];
              return (
                <span key={idx} style={{
                  background: pal.bg,
                  border: `1px solid ${pal.border}`,
                  color: pal.badgeText,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {std.rollNo} - {std.name} ({std.className})
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
