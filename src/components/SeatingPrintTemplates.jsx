import React, { useRef } from 'react';
import { Printer, Download, CheckCircle, School, Calendar, Clock, MapPin } from 'lucide-react';

export default function SeatingPrintTemplates({
  examDetails = {},
  arrangement = null,
  activePrintType = 'hall_plan', // 'hall_plan' | 'hall_roster' | 'student_notice'
  onClose
}) {
  const printRef = useRef();

  if (!arrangement) return null;

  const handlePrint = () => {
    window.print();
  };

  const hallAllocations = arrangement.hallAllocations || [];

  // Group all placed students by class for the class announcement list
  const studentsByClass = {};
  hallAllocations.forEach(hall => {
    hall.benches.forEach(bench => {
      bench.seats.forEach(seat => {
        if (seat.student) {
          const cName = seat.student.className || 'General';
          if (!studentsByClass[cName]) {
            studentsByClass[cName] = [];
          }
          studentsByClass[cName].push({
            rollNo: seat.student.rollNo,
            name: seat.student.name,
            hallName: hall.hallName,
            benchNumber: bench.benchNumber,
            seatPosition: seat.seatPositionName
          });
        }
      });
    });
  });

  // Sort students inside each class by rollNo
  Object.keys(studentsByClass).forEach(cls => {
    studentsByClass[cls].sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }));
  });

  return (
    <div className="seating-print-modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      {/* Control Bar - Not printed */}
      <div className="no-print" style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '1000px',
        marginBottom: '16px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Printer size={22} color="var(--primary)" />
          <div>
            <h4 style={{ margin: 0, fontWeight: 700 }}>Print Preview & Export</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {activePrintType === 'hall_plan' && 'Visual Hall Seating Plan & Bench Map'}
              {activePrintType === 'hall_roster' && 'Hall-wise Detailed Seating Roster'}
              {activePrintType === 'student_notice' && 'Class-wise Student Notice Board Announcement'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', fontWeight: 700, borderRadius: '8px' }}
          >
            <Printer size={18} /> Print Document
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', borderRadius: '8px' }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Printable Paper Area */}
      <div
        ref={printRef}
        id="seating-print-sheet"
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: '1000px',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          color: '#111827',
          fontFamily: 'inherit'
        }}
      >
        {/* ============================================================== */}
        {/* TEMPLATE 1: VISUAL HALL SEATING PLAN (BENCH MAP)               */}
        {/* ============================================================== */}
        {activePrintType === 'hall_plan' && (
          <div>
            {hallAllocations.map((hall, hIdx) => (
              <div key={hall.hallId} style={{ pageBreakAfter: hIdx < hallAllocations.length - 1 ? 'always' : 'auto', marginBottom: '40px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '14px', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
                    {examDetails.examName || 'EXAMINATION SEATING PLAN'}
                  </h2>
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '4px', color: '#1e293b' }}>
                    HALL SEAT LAYOUT: <span style={{ textDecoration: 'underline' }}>{hall.hallName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.85rem', marginTop: '6px', color: '#475569' }}>
                    <span><strong>Date:</strong> {examDetails.examDate || 'N/A'}</span>
                    <span><strong>Time:</strong> {examDetails.examTime || 'N/A'}</span>
                    <span><strong>Total Benches:</strong> {hall.totalBenches}</span>
                    <span><strong>Bench Capacity:</strong> {hall.studentsPerBench} Students</span>
                  </div>
                </div>

                {/* Blackboard / Front indicator */}
                <div style={{
                  background: '#f1f5f9',
                  border: '1px dashed #94a3b8',
                  borderRadius: '6px',
                  padding: '8px',
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '2px',
                  marginBottom: '20px'
                }}>
                  ▲ TEACHER'S DESK / BLACKBOARD (FRONT OF HALL) ▲
                </div>

                {/* Bench Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${hall.columns || 4}, 1fr)`,
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  {hall.benches.map(bench => (
                    <div
                      key={bench.benchId}
                      style={{
                        border: '1.5px solid #334155',
                        borderRadius: '6px',
                        padding: '8px',
                        background: '#ffffff'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        borderBottom: '1px solid #cbd5e1',
                        paddingBottom: '4px',
                        marginBottom: '6px'
                      }}>
                        <span>BENCH #{bench.benchNumber}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>R{bench.rowNum}C{bench.colNum}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {bench.seats.map((seat, sIdx) => {
                          const std = seat.student;
                          return (
                            <div
                              key={sIdx}
                              style={{
                                flex: 1,
                                minHeight: '60px',
                                border: '1px dashed #94a3b8',
                                borderRadius: '4px',
                                padding: '4px',
                                background: std ? '#f8fafc' : '#fef2f2',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                textAlign: 'center',
                                fontSize: '0.75rem'
                              }}
                            >
                              {std ? (
                                <>
                                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                                    {std.rollNo}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {std.className}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {std.name}
                                  </div>
                                </>
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.7rem' }}>
                                  [EMPTY]
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '16px', borderTop: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
                  <div>Invigilator Signature: _______________________</div>
                  <div>Chief Superintendent: _______________________</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 2: HALL-WISE DETAILED ROSTER / ATTENDANCE SHEET       */}
        {/* ============================================================== */}
        {activePrintType === 'hall_roster' && (
          <div>
            {hallAllocations.map((hall, hIdx) => {
              const studentsInHall = [];
              hall.benches.forEach(bench => {
                bench.seats.forEach(seat => {
                  if (seat.student) {
                    studentsInHall.push({
                      benchNumber: bench.benchNumber,
                      seatPosition: seat.seatPositionName,
                      ...seat.student
                    });
                  }
                });
              });

              return (
                <div key={hall.hallId} style={{ pageBreakAfter: hIdx < hallAllocations.length - 1 ? 'always' : 'auto', marginBottom: '40px' }}>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
                      {examDetails.examName || 'EXAMINATION SEATING & ATTENDANCE ROSTER'}
                    </h2>
                    <h3 style={{ fontSize: '1.1rem', margin: '4px 0 0', fontWeight: 700 }}>
                      ROOM / HALL: {hall.hallName}
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.85rem', marginTop: '6px' }}>
                      <span><strong>Date:</strong> {examDetails.examDate || 'N/A'}</span>
                      <span><strong>Session/Time:</strong> {examDetails.examTime || 'N/A'}</span>
                      <span><strong>Total Allotted:</strong> {studentsInHall.length} Candidates</span>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderTop: '1.5px solid #000', borderBottom: '1.5px solid #000' }}>
                        <th style={{ border: '1px solid #94a3b8', padding: '6px 8px', textAlign: 'center', width: '40px' }}>Sl</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '6px 8px', textAlign: 'center', width: '80px' }}>Bench No</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '6px 8px', textAlign: 'center', width: '70px' }}>Position</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '6px 8px', textAlign: 'left', width: '130px' }}>Roll / ID No</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '6px 8px', textAlign: 'left' }}>Candidate Name</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '6px 8px', textAlign: 'left', width: '140px' }}>Class / Batch</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '6px 8px', textAlign: 'center', width: '130px' }}>Candidate Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsInHall.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                            No candidates seated in this hall.
                          </td>
                        </tr>
                      ) : (
                        studentsInHall.map((std, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>
                              Bench {std.benchNumber}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', color: '#475569' }}>
                              {std.seatPosition}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 700 }}>{std.rollNo}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>{std.name}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 600 }}>{std.className}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '16px', fontSize: '0.85rem' }}>
                    <div>Total Present: _______ &nbsp;&nbsp; Total Absent: _______</div>
                    <div>Invigilator Signature: _______________________</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 3: NOTICE BOARD ANNOUNCEMENT LIST (CLASS-WISE)        */}
        {/* ============================================================== */}
        {activePrintType === 'student_notice' && (
          <div>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '14px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>
                {examDetails.examName || 'EXAMINATION SEATING NOTICE'}
              </h2>
              <h3 style={{ fontSize: '1.05rem', margin: '4px 0 0', fontWeight: 700, color: '#334155' }}>
                STUDENT SEAT ALLOCATION NOTICE (CLASS-WISE)
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.85rem', marginTop: '6px', color: '#475569' }}>
                <span><strong>Date:</strong> {examDetails.examDate || 'N/A'}</span>
                <span><strong>Time/Session:</strong> {examDetails.examTime || 'N/A'}</span>
              </div>
            </div>

            {Object.keys(studentsByClass).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No students placed in this arrangement.
              </div>
            ) : (
              Object.entries(studentsByClass).map(([className, students], cIdx) => (
                <div key={className} style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                  <div style={{
                    background: '#1e293b',
                    color: '#fff',
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    borderRadius: '4px 4px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>CLASS / BATCH: {className}</span>
                    <span>Total: {students.length} Candidates</span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #000' }}>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', width: '50px' }}>Sl</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'left', width: '140px' }}>Roll / ID No</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'left' }}>Candidate Name</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', width: '160px' }}>Assigned Hall / Room</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', width: '120px' }}>Bench No</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', width: '100px' }}>Seat Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((std, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 1 ? '#f8fafc' : '#fff' }}>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 700 }}>{std.rollNo}</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px' }}>{std.name}</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', fontWeight: 700, color: '#0369a1' }}>
                            {std.hallName}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>
                            Bench #{std.benchNumber}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', color: '#475569' }}>
                            {std.seatPosition}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
              * Students are requested to occupy their assigned hall and bench at least 15 minutes prior to commencement of examination.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #seating-print-sheet, #seating-print-sheet * {
            visibility: visible;
          }
          #seating-print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            padding: 20px !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
