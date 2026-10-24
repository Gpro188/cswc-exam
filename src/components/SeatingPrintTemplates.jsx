import React, { useRef, useState } from 'react';
import { 
  Printer, 
  Download, 
  CheckCircle, 
  School, 
  Calendar, 
  Clock, 
  MapPin, 
  Package, 
  Tag, 
  FileText, 
  Layers, 
  Users,
  FileSpreadsheet 
} from 'lucide-react';

export default function SeatingPrintTemplates({
  examDetails = {},
  arrangement = null,
  activePrintType: initialPrintType = 'all_in_one', // 'all_in_one' | 'qp_packing' | 'bench_slips' | 'hall_plan' | 'hall_roster' | 'student_notice'
  onClose
}) {
  const printRef = useRef();
  const [currentPrintType, setCurrentPrintType] = useState(initialPrintType);
  const [slipBenchFilter, setSlipBenchFilter] = useState('all'); // 'all' or hallId
  const [slipsPerPage, setSlipsPerPage] = useState(8); // 8 or 12 per page

  if (!arrangement) return null;

  const handlePrint = () => {
    window.print();
  };

  const hallAllocations = arrangement.hallAllocations || [];

  // 1. Group all placed students by class for the class announcement list
  const studentsByClass = {};
  // 2. Extract all flat seat list for bench sticker slips
  const allSeatSlips = [];
  // 3. Question paper packing counts: Group by Hall -> Class, and Class -> Hall
  const hallClassCounts = {}; // { [hallId]: { hallName, totalStudents, classes: { [className]: count } } }
  const classHallCounts = {}; // { [className]: { total: 0, halls: { [hallName]: count } } }
  let grandTotalStudents = 0;

  hallAllocations.forEach(hall => {
    if (!hallClassCounts[hall.hallId]) {
      hallClassCounts[hall.hallId] = {
        hallId: hall.hallId,
        hallName: hall.hallName,
        totalStudents: 0,
        classes: {}
      };
    }

    hall.benches.forEach(bench => {
      bench.seats.forEach(seat => {
        if (seat.student) {
          grandTotalStudents++;
          const cName = seat.student.className || 'General';

          // Hall -> Class count
          hallClassCounts[hall.hallId].totalStudents++;
          hallClassCounts[hall.hallId].classes[cName] = (hallClassCounts[hall.hallId].classes[cName] || 0) + 1;

          // Class -> Hall count
          if (!classHallCounts[cName]) {
            classHallCounts[cName] = { total: 0, halls: {} };
          }
          classHallCounts[cName].total++;
          classHallCounts[cName].halls[hall.hallName] = (classHallCounts[cName].halls[hall.hallName] || 0) + 1;

          // Group by class
          if (!studentsByClass[cName]) {
            studentsByClass[cName] = [];
          }
          studentsByClass[cName].push({
            rollNo: seat.student.rollNo,
            name: seat.student.name,
            hallName: hall.hallName,
            hallId: hall.hallId,
            benchNumber: bench.benchNumber,
            seatPosition: seat.seatPositionName,
            rowNum: bench.rowNum,
            colNum: bench.colNum
          });

          // All seat slips
          allSeatSlips.push({
            hallId: hall.hallId,
            hallName: hall.hallName,
            benchNumber: bench.benchNumber,
            seatPosition: seat.seatPositionName,
            rowNum: bench.rowNum,
            colNum: bench.colNum,
            rollNo: seat.student.rollNo,
            name: seat.student.name,
            className: cName
          });
        }
      });
    });
  });

  // Sort students inside each class by rollNo
  Object.keys(studentsByClass).forEach(cls => {
    studentsByClass[cls].sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }));
  });

  // Filtered slips
  const filteredSlips = slipBenchFilter === 'all' 
    ? allSeatSlips 
    : allSeatSlips.filter(s => s.hallId === slipBenchFilter);

  // Chunk slips for printing pages
  const slipChunks = [];
  const chunkSize = slipsPerPage;
  for (let i = 0; i < filteredSlips.length; i += chunkSize) {
    slipChunks.push(filteredSlips.slice(i, i + chunkSize));
  }

  // 4. Master Consolidated Full Student List (All seated students sorted by Roll Number)
  const allSeatedStudentsSorted = [...allSeatSlips].sort((a, b) => 
    a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true })
  );

  const allUniqueClasses = Object.keys(classHallCounts).sort();

  return (
    <div className="seating-print-modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(5px)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      {/* Control Bar - Not printed */}
      <div className="no-print" style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '1080px',
        marginBottom: '16px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Top bar title & print buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Printer size={24} color="#3730a3" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: '#1e293b' }}>
                Print & Export Seating Center Suite
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Total Seated: <strong>{grandTotalStudents}</strong> Students across <strong>{hallAllocations.length}</strong> Examination Halls
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                fontWeight: 800,
                fontSize: '0.95rem',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
              }}
              title="Click to print or save as PDF"
            >
              <Printer size={18} /> Print Now / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Navigation tabs for selecting document type */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '12px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'all_in_one', label: '📄 Complete Full Bundle (All Data)', icon: Layers, highlight: true },
            { id: 'qp_packing', label: '📦 QP Packing Summary (Class-wise to Hall)', icon: Package },
            { id: 'bench_slips', label: '🏷️ Bench Seat Slips (Stickers to Stick on Desks)', icon: Tag },
            { id: 'hall_plan', label: '🗺️ Visual Hall Plan (Bench Map)', icon: FileText },
            { id: 'hall_roster', label: '📋 Hall Attendance Roster', icon: Users },
            { id: 'student_notice', label: '📢 Notice Board Announcement', icon: School },
            { id: 'total_list', label: '📑 Total Seated Students List (All Classes)', icon: FileSpreadsheet, highlight: true }
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = currentPrintType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentPrintType(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.825rem',
                  fontWeight: isActive ? 700 : 500,
                  border: isActive ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  background: isActive ? '#eff6ff' : (tab.highlight ? '#fefce8' : '#fff'),
                  color: isActive ? '#1d4ed8' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconComp size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Bench Slips Extra Filter Bar */}
        {currentPrintType === 'bench_slips' && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>Filter Hall for Slips:</span>
              <select
                value={slipBenchFilter}
                onChange={(e) => setSlipBenchFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="all">All Halls ({allSeatSlips.length} Slips)</option>
                {hallAllocations.map(h => (
                  <option key={h.hallId} value={h.hallId}>
                    {h.hallName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>Stickers Per Sheet:</span>
              <select
                value={slipsPerPage}
                onChange={(e) => setSlipsPerPage(Number(e.target.value))}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value={8}>8 per page (2 columns × 4 rows - Standard Bench Size)</option>
                <option value={10}>10 per page (2 columns × 5 rows - Compact)</option>
                <option value={12}>12 per page (3 columns × 4 rows - Micro Stickers)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Printable Paper Area */}
      <div
        ref={printRef}
        id="seating-print-sheet"
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: '1050px',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 25px rgba(0,0,0,0.18)',
          color: '#111827',
          fontFamily: 'inherit'
        }}
      >
        {/* ============================================================== */}
        {/* SECTION: QUESTION PAPER PACKING SUMMARY (CLASS-WISE TO HALL)  */}
        {/* ============================================================== */}
        {(currentPrintType === 'all_in_one' || currentPrintType === 'qp_packing') && (
          <div style={{ marginBottom: '40px', pageBreakAfter: currentPrintType === 'all_in_one' ? 'always' : 'auto' }}>
            <div style={{ textAlign: 'center', borderBottom: '2.5px solid #0f172a', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#475569' }}>
                OFFICIAL EXAMINATION CELL &amp; CONFIDENTIAL PACKING DESK
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, textTransform: 'uppercase', margin: '4px 0', color: '#0f172a' }}>
                {examDetails.examName || 'EXAMINATION QUESTION PAPER PACKING SUMMARY'}
              </h2>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e40af' }}>
                CLASS-WISE QUESTION PAPER DISTRIBUTION &amp; HALL PACKING ENVELOPE SHEET
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.85rem', marginTop: '8px', color: '#334155' }}>
                <span><strong>Date:</strong> {examDetails.examDate || 'N/A'}</span>
                <span><strong>Time/Session:</strong> {examDetails.examTime || 'N/A'}</span>
                <span><strong>Total Candidates:</strong> {grandTotalStudents}</span>
                <span><strong>Total Halls:</strong> {hallAllocations.length}</span>
              </div>
            </div>

            {/* Instruction Callout for Exam Staff */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px dashed #64748b',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '20px',
              fontSize: '0.825rem',
              color: '#334155',
              lineHeight: 1.4
            }}>
              <strong>📌 Question Paper Packing Instructions:</strong> Pack question papers into sealed envelope bundles for each examination hall according to the exact class-wise counts listed below. Verify candidate roll numbers with the hall rosters before sealing.
            </div>

            {/* Table 1: Matrix - Halls (Rows) vs Classes (Columns) */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '14px 0 8px', color: '#0f172a', textTransform: 'uppercase', borderLeft: '4px solid #2563eb', paddingLeft: '8px' }}>
              1. Hall-Wise Question Paper Packing Requirements (Packet Checklist)
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', marginBottom: '24px' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#fff' }}>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', width: '45px' }}>Sl</th>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'left', minWidth: '180px' }}>Examination Hall / Room</th>
                  {allUniqueClasses.map(cls => (
                    <th key={cls} style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center' }}>
                      {cls}
                    </th>
                  ))}
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', width: '90px', background: '#1e3a8a' }}>
                    Total QP Required
                  </th>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', width: '110px' }}>
                    Packet Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {hallAllocations.map((hall, idx) => {
                  const hData = hallClassCounts[hall.hallId] || { totalStudents: 0, classes: {} };
                  return (
                    <tr key={hall.hallId} style={{ background: idx % 2 === 1 ? '#f8fafc' : '#fff' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 700, color: '#0f172a' }}>
                        {hall.hallName}
                        <div style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>
                          Cap: {hall.totalBenches * (hall.studentsPerBench || 2)} Seats ({hall.totalBenches} benches)
                        </div>
                      </td>
                      {allUniqueClasses.map(cls => {
                        const count = hData.classes[cls] || 0;
                        return (
                          <td key={cls} style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: count > 0 ? 800 : 400, color: count > 0 ? '#0f172a' : '#94a3b8' }}>
                            {count > 0 ? count : '-'}
                          </td>
                        );
                      })}
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 900, fontSize: '0.95rem', color: '#1e40af', background: '#eff6ff' }}>
                        {hData.totalStudents}
                      </td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                        [ &nbsp; ] Packed &amp; Sealed
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr style={{ background: '#f1f5f9', fontWeight: 800, borderTop: '2px solid #0f172a' }}>
                  <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '9px 12px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                    Total Question Papers Required:
                  </td>
                  {allUniqueClasses.map(cls => (
                    <td key={cls} style={{ border: '1px solid #cbd5e1', padding: '9px 8px', textAlign: 'center', fontSize: '0.9rem', color: '#0f172a' }}>
                      {classHallCounts[cls]?.total || 0}
                    </td>
                  ))}
                  <td style={{ border: '1px solid #cbd5e1', padding: '9px 8px', textAlign: 'center', fontSize: '1rem', color: '#1e40af', background: '#dbeafe' }}>
                    {grandTotalStudents}
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '9px 8px', textAlign: 'center', fontSize: '0.75rem', color: '#1e293b' }}>
                    Ready for Exam
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Table 2: Class-Wise Breakdown to Halls (Quick Reference for Printing Office) */}
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '20px 0 8px', color: '#0f172a', textTransform: 'uppercase', borderLeft: '4px solid #16a34a', paddingLeft: '8px' }}>
              2. Class-Wise Distribution across Examination Halls (Print Quantity Reference)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {allUniqueClasses.map(cls => {
                const cData = classHallCounts[cls];
                return (
                  <div key={cls} style={{ border: '1.5px solid #cbd5e1', borderRadius: '6px', padding: '10px 14px', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{cls}</span>
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem' }}>
                        Total QP: {cData.total}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                      {Object.entries(cData.halls).map(([hName, cnt]) => (
                        <div key={hName} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span style={{ color: '#475569' }}>{hName}:</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{cnt} copies</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '16px', borderTop: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
              <div>QP Packing Officer: _______________________</div>
              <div>Invigilator In-Charge: _______________________</div>
              <div>Chief Superintendent: _______________________</div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION: BENCH SEAT STICKERS / DESK SLIPS (STICK ON BENCH)    */}
        {/* ============================================================== */}
        {(currentPrintType === 'all_in_one' || currentPrintType === 'bench_slips') && (
          <div style={{ marginBottom: '40px', pageBreakAfter: currentPrintType === 'all_in_one' ? 'always' : 'auto' }}>
            {slipChunks.map((chunk, pageIdx) => {
              const isLastPage = pageIdx === slipChunks.length - 1;
              return (
                <div
                  key={pageIdx}
                  style={{
                    pageBreakAfter: isLastPage ? 'auto' : 'always',
                    marginBottom: '40px'
                  }}
                >
                  {/* Page Header (Slips) */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px dashed #94a3b8',
                    paddingBottom: '8px',
                    marginBottom: '16px',
                    fontSize: '0.75rem',
                    color: '#64748b'
                  }}>
                    <span><strong>BENCH SEAT NUMBER STICKERS</strong> • Cut along dashed borders &amp; stick on top/edge of student bench</span>
                    <span>Page {pageIdx + 1} of {slipChunks.length} • {examDetails.examName || 'Examination'}</span>
                  </div>

                  {/* Stickers Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: slipsPerPage === 12 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                    gap: '12px'
                  }}>
                    {chunk.map((slip, sIdx) => (
                      <div
                        key={sIdx}
                        style={{
                          border: '2px solid #1e293b',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          background: '#fff',
                          position: 'relative',
                          boxSizing: 'border-box',
                          minHeight: '125px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        {/* Cut guide scissors indicator */}
                        <div style={{ position: 'absolute', top: '-8px', right: '12px', fontSize: '0.65rem', color: '#94a3b8', background: '#fff', padding: '0 4px' }}>
                          ✂ CUT &amp; STICK
                        </div>

                        {/* Slip Header */}
                        <div style={{ borderBottom: '1.5px solid #0f172a', paddingBottom: '4px', marginBottom: '6px' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px' }}>
                            {examDetails.examName ? examDetails.examName.substring(0, 38) : 'EXAMINATION SEATING'}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af' }}>
                              {slip.hallName}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
                              {examDetails.examDate || ''}
                            </span>
                          </div>
                        </div>

                        {/* Primary High-Visibility Seat Info */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 8px', borderRadius: '6px', margin: '4px 0' }}>
                          <div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569' }}>BENCH NUMBER</div>
                            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                              BENCH #{slip.benchNumber}
                            </div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b' }}>
                              Side: {slip.seatPosition} (R{slip.rowNum}C{slip.colNum})
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569' }}>ROLL / SEAT NO</div>
                            <div style={{
                              fontSize: '1.25rem',
                              fontWeight: 900,
                              color: '#b91c1c',
                              lineHeight: 1.1,
                              background: '#fee2e2',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              letterSpacing: '0.5px'
                            }}>
                              {slip.rollNo}
                            </div>
                          </div>
                        </div>

                        {/* Candidate Name & Class Footer */}
                        <div style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                            {slip.name}
                          </div>
                          <div style={{ fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                            {slip.className}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 1: VISUAL HALL SEATING PLAN (BENCH MAP)               */}
        {/* ============================================================== */}
        {(currentPrintType === 'all_in_one' || currentPrintType === 'hall_plan') && (
          <div>
            {hallAllocations.map((hall, hIdx) => (
              <div key={hall.hallId} style={{ pageBreakAfter: (hIdx < hallAllocations.length - 1 || currentPrintType === 'all_in_one') ? 'always' : 'auto', marginBottom: '40px' }}>
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
        {(currentPrintType === 'all_in_one' || currentPrintType === 'hall_roster') && (
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
                <div key={hall.hallId} style={{ pageBreakAfter: (hIdx < hallAllocations.length - 1 || currentPrintType === 'all_in_one') ? 'always' : 'auto', marginBottom: '40px' }}>
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
                    {/* Total Row */}
                    <tfoot>
                      <tr style={{ background: '#f1f5f9', fontWeight: 800, borderTop: '2px solid #000' }}>
                        <td colSpan={6} style={{ border: '1px solid #cbd5e1', padding: '8px 12px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.825rem' }}>
                          Total Candidates in {hall.hallName}:
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 900, color: '#1e40af', fontSize: '0.9rem' }}>
                          {studentsInHall.length}
                        </td>
                      </tr>
                    </tfoot>
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
        {(currentPrintType === 'all_in_one' || currentPrintType === 'student_notice') && (
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
                    <tfoot>
                      <tr style={{ background: '#f1f5f9', fontWeight: 800, borderTop: '2px solid #000' }}>
                        <td colSpan={5} style={{ border: '1px solid #cbd5e1', padding: '8px 12px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.825rem' }}>
                          Total {className} Candidates:
                        </td>
                        <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 900, color: '#1e40af', fontSize: '0.9rem' }}>
                          {students.length}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ))
            )}

            {/* Total Summary Footer across All Classes */}
            {Object.keys(studentsByClass).length > 0 && (
              <div style={{
                marginTop: '16px',
                marginBottom: '20px',
                padding: '12px 18px',
                background: '#f8fafc',
                border: '2px solid #0f172a',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pageBreakInside: 'avoid'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                  Total Seated Candidates Across All Classes:
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e40af' }}>
                  {grandTotalStudents} Students ({allUniqueClasses.length} Classes)
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
              * Students are requested to occupy their assigned hall and bench at least 15 minutes prior to commencement of examination.
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TEMPLATE 4: CONSOLIDATED MASTER TOTAL CANDIDATES LIST          */}
        {/* ============================================================== */}
        {(currentPrintType === 'all_in_one' || currentPrintType === 'total_list') && (
          <div style={{ pageBreakBefore: currentPrintType === 'all_in_one' ? 'always' : 'auto' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '14px', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#475569' }}>
                OFFICIAL SEATING EXAMINATION DESK
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', margin: '4px 0', color: '#0f172a' }}>
                {examDetails.examName || 'EXAMINATION SEATING ARRANGEMENT'}
              </h2>
              <h3 style={{ fontSize: '1.05rem', margin: '4px 0 0', fontWeight: 700, color: '#1e40af' }}>
                COMPLETE MASTER SEATING LIST (TOTAL REGISTERED CANDIDATES)
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.85rem', marginTop: '6px', color: '#475569' }}>
                <span><strong>Date:</strong> {examDetails.examDate || 'N/A'}</span>
                <span><strong>Time/Session:</strong> {examDetails.examTime || 'N/A'}</span>
                <span><strong>Total Candidates:</strong> {grandTotalStudents}</span>
                <span><strong>Total Halls:</strong> {hallAllocations.length}</span>
              </div>
            </div>

            {/* Class Breakdown Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {allUniqueClasses.map(cls => (
                <div key={cls} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px 12px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#334155' }}>{cls}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e40af' }}>{classHallCounts[cls]?.total || 0}</span>
                </div>
              ))}
              <div style={{ border: '1.5px solid #1e40af', borderRadius: '6px', padding: '8px 12px', background: '#eff6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e40af' }}>GRAND TOTAL</span>
                <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#1e40af' }}>{grandTotalStudents}</span>
              </div>
            </div>

            {/* Master Table of All Seated Students */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '24px' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#fff' }}>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', width: '45px' }}>Sl</th>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'left', width: '130px' }}>Roll / ID No</th>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'left' }}>Candidate Name</th>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'left', width: '140px' }}>Class / Batch</th>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', width: '150px' }}>Assigned Hall</th>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', width: '100px' }}>Bench No</th>
                  <th style={{ border: '1px solid #334155', padding: '8px', textAlign: 'center', width: '90px' }}>Side</th>
                </tr>
              </thead>
              <tbody>
                {allSeatedStudentsSorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No students found in arrangement.
                    </td>
                  </tr>
                ) : (
                  allSeatedStudentsSorted.map((std, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 1 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 800, color: '#b91c1c' }}>{std.rollNo}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 600, color: '#0f172a' }}>{std.name}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', fontWeight: 600, color: '#0369a1' }}>{std.className}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{std.hallName}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>Bench #{std.benchNumber}</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '6px 8px', textAlign: 'center', color: '#64748b' }}>{std.seatPosition}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 800, borderTop: '2px solid #0f172a' }}>
                  <td colSpan={4} style={{ border: '1px solid #cbd5e1', padding: '10px 12px', textAlign: 'right', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                    Grand Total Seated Candidates:
                  </td>
                  <td colSpan={3} style={{ border: '1px solid #cbd5e1', padding: '10px 12px', textAlign: 'center', fontSize: '1rem', color: '#1e40af', background: '#dbeafe' }}>
                    {grandTotalStudents} Candidates across {hallAllocations.length} Halls
                  </td>
                </tr>
              </tfoot>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '16px', borderTop: '1px solid #cbd5e1', fontSize: '0.85rem' }}>
              <div>Prepared By: _______________________</div>
              <div>Verified By: _______________________</div>
              <div>Chief Superintendent: _______________________</div>
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
            padding: 15px !important;
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
