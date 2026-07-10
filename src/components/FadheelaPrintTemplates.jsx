import React, { useMemo } from 'react';

// Helper to convert numbers to words for packet covers
const numberToWords = (num) => {
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (num === 0) return 'zero';
  if (num < 20) return a[num];
  const digit = num % 10;
  if (num < 100) return b[Math.floor(num / 10)] + (digit ? '-' + a[digit] : '');
  const hundred = Math.floor(num / 100);
  const rest = num % 100;
  return a[hundred] + ' hundred' + (rest !== 0 ? ' and ' + numberToWords(rest) : '');
};

export const FadheelaPrintTemplates = ({ data }) => {
  if (!data || !data.timetable || data.timetable.length === 0) return null;

  // Group timetable by session (date + time)
  const sessions = useMemo(() => {
    const map = {};
    data.timetable.forEach(t => {
      const key = `${t.date}_${t.time}`;
      if (!map[key]) {
        map[key] = {
          date: t.date,
          time: t.time,
          subjects: [],
          totalCount: 0
        };
      }
      map[key].subjects.push(t);
      map[key].totalCount += t.count;
    });
    return Object.values(map);
  }, [data.timetable]);

  return (
    <div className="print-container theme-pack-cover" style={{ display: 'none' }}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .app-sidebar, .content-header, .no-print {
            display: none !important;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
        }
      `}</style>

      {/* 1. MASTER ADMIN COVER (Document Checklist) */}
      <div className="pack-cover-page page-break-after">
        <div className="pack-cover-inner">
          <div className="pack-cover-header">
            <h2>Council of Samastha Womens Colleges (CSWC)</h2>
            <h3>Fadheela PG Examination {data.year}</h3>
            <div className="pack-cover-badge-top" style={{ backgroundColor: '#1e3a8a' }}>ADMIN MASTER COVER</div>
          </div>

          <div className="pack-cover-body">
            <div className="pack-cover-meta-grid">
              <div className="meta-row">
                <span className="meta-label">EXAM CENTER</span>
                <span className="meta-value bold">{data.centerName || '________________________'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">DEPARTMENT</span>
                <span className="meta-value bold">{data.departmentName || '________________________'}</span>
              </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid black', paddingBottom: '8px' }}>Enclosed Documents Checklist</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid black', padding: '12px', textAlign: 'left', width: '60px' }}>Sl No</th>
                    <th style={{ border: '1px solid black', padding: '12px', textAlign: 'left' }}>Document Details</th>
                    <th style={{ border: '1px solid black', padding: '12px', textAlign: 'center', width: '180px' }}>Enclosed (Yes/No)</th>
                    <th style={{ border: '1px solid black', padding: '12px', textAlign: 'center', width: '200px' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    "Session Packets (Contains QP & Attendance)",
                    "Blank Answer Booklets",
                    "Invigilator Diaries",
                    "Malpractice Report Forms",
                    "Unused Question Papers Cover",
                    "Used Answer Scripts Cover (Sealed)"
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid black', padding: '16px 12px', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid black', padding: '16px 12px', fontWeight: '600' }}>{item}</td>
                      <td style={{ border: '1px solid black', padding: '16px 12px', textAlign: 'center' }}></td>
                      <td style={{ border: '1px solid black', padding: '16px 12px', textAlign: 'center' }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pack-cover-footer" style={{ marginTop: '60px' }}>
            <div className="signature-section" style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
              <div className="sig-line">
                <span>___________________________</span>
                <strong>HANDED OVER BY</strong>
              </div>
              <div className="sig-line">
                <span>___________________________</span>
                <strong>RECEIVED BY</strong>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Center Chief / Invigilator)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SESSION COVERS (Time-based packets containing Subject packets and Attendance Sheets) */}
      {sessions.map((session, sIdx) => (
        <div key={`session-${sIdx}`} className="pack-cover-page page-break-after">
          <div className="pack-cover-inner">
            <div className="pack-cover-header">
              <h2>Council of Samastha Womens Colleges (CSWC)</h2>
              <h3>Fadheela PG Examination {data.year}</h3>
              <div className="pack-cover-badge-top" style={{ backgroundColor: '#059669' }}>SESSION EXAM PACKET COVER</div>
            </div>

            <div className="pack-cover-body">
              <div className="pack-cover-meta-grid">
                <div className="meta-row">
                  <span className="meta-label">EXAM CENTER</span>
                  <span className="meta-value bold">{data.centerName}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">DEPARTMENT</span>
                  <span className="meta-value bold">{data.departmentName}</span>
                </div>
                <div className="meta-row-split">
                  <div className="meta-row">
                    <span className="meta-label">EXAM DATE</span>
                    <span className="meta-value bold">
                      {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">EXAM TIME</span>
                    <span className="meta-value bold">{session.time}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', border: '3px solid black', borderRadius: '8px', padding: '20px' }}>
                <h4 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', textTransform: 'uppercase' }}>
                  Contents of this Packet
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '16px', lineHeight: '1.8' }}>
                  <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #ccc', paddingBottom: '8px', marginBottom: '8px' }}>
                    <strong>1. Question Paper Packets for Subjects:</strong>
                    <span>{session.subjects.length} Packets</span>
                  </li>
                  {session.subjects.map((sub, i) => (
                     <li key={i} style={{ paddingLeft: '20px', color: '#444', fontStyle: 'italic', marginBottom: '4px' }}>
                       - {sub.subject} ({sub.count} papers)
                     </li>
                  ))}
                  <li style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #ccc', paddingBottom: '8px', marginTop: '16px', marginBottom: '8px' }}>
                    <strong>2. Attendance Sheets:</strong>
                    <span>Included for all subjects</span>
                  </li>
                </ul>
              </div>

              <div className="pack-cover-count-container" style={{ marginTop: '30px' }}>
                <div className="count-label">TOTAL ANSWER SCRIPTS EXPECTED FROM SESSION</div>
                <div className="count-badge-large">{session.totalCount}</div>
                <div className="count-words">
                  (In Words: <strong>{numberToWords(session.totalCount).toUpperCase()} ONLY</strong>)
                </div>
              </div>
            </div>

            <div className="pack-cover-footer">
              <div className="signature-section">
                <div className="sig-line">
                  <span>___________________________</span>
                  <strong>PACKING CLERK</strong>
                </div>
                <div className="sig-line">
                  <span>___________________________</span>
                  <strong>CHIEF SUPERINTENDENT</strong>
                </div>
              </div>
              <div className="seal-box">
                OFFICE SEAL
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 3. INDIVIDUAL SUBJECT COVERS (Question Paper Packets) */}
      {data.timetable.map((subject, idx) => {
        const isLast = idx === data.timetable.length - 1;
        return (
          <div key={`sub-${idx}`} className={`pack-cover-page ${isLast ? '' : 'page-break-after'}`}>
            <div className="pack-cover-inner">
              <div className="pack-cover-header">
                <h2>Council of Samastha Womens Colleges (CSWC)</h2>
                <h3>Fadheela PG Examination {data.year}</h3>
                <div className="pack-cover-badge-top">QUESTION PAPER PACKET COVER</div>
              </div>

              <div className="pack-cover-body">
                <div className="pack-cover-meta-grid">
                  <div className="meta-row">
                    <span className="meta-label">EXAM CENTER</span>
                    <span className="meta-value bold">{data.centerName}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">DEPARTMENT</span>
                    <span className="meta-value bold">{data.departmentName}</span>
                  </div>
                  <div className="meta-row-split">
                    <div className="meta-row">
                      <span className="meta-label">EXAM DATE</span>
                      <span className="meta-value bold">
                        {new Date(subject.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">EXAM TIME</span>
                      <span className="meta-value bold">{subject.time}</span>
                    </div>
                  </div>
                </div>

                <div className="pack-cover-subject-box">
                  <div className="sub-field" style={{ borderRight: 'none', borderBottom: '1px solid black', width: '100%' }}>
                    <span className="sub-label">PROGRAM</span>
                    <span className="sub-value class-highlight">FADHEELA PG REGULAR</span>
                  </div>
                  <div className="sub-field" style={{ width: '100%' }}>
                    <span className="sub-label">SUBJECT</span>
                    <span className="sub-value subject-highlight">{subject.subject}</span>
                  </div>
                </div>

                <div className="pack-cover-count-container">
                  <div className="count-label">TOTAL QUESTION PAPERS ENCLOSED</div>
                  <div className="count-badge-large">{subject.count}</div>
                  <div className="count-words">
                    (In Words: <strong>{numberToWords(subject.count).toUpperCase()} ONLY</strong>)
                  </div>
                </div>
              </div>

              <div className="pack-cover-footer">
                <div className="signature-section">
                  <div className="sig-line">
                    <span>___________________________</span>
                    <strong>PACKING CLERK</strong>
                  </div>
                  <div className="sig-line">
                    <span>___________________________</span>
                    <strong>CHIEF SUPERINTENDENT</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>(Seal & Signature)</span>
                  </div>
                </div>
                <div className="seal-box">
                  OFFICE SEAL
                </div>
              </div>
            </div>
          </div>
        );
      })}

    </div>
  );
};
