import React, { useMemo } from 'react';

// Helper to convert numbers to words for packet covers
const numberToWords = (num) => {
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return; let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() || 'zero';
};

export const FadheelaPrintTemplates = ({ data }) => {
  if (!data || !data.timetable || data.timetable.length === 0 || !data.centers || data.centers.length === 0) return null;

  // 1. Group assignments by unique Center Name
  const uniqueCenters = useMemo(() => {
    const centersMap = {};
    data.centers.forEach(assignment => {
      if (!centersMap[assignment.centerName]) {
        centersMap[assignment.centerName] = {
          centerName: assignment.centerName,
          departments: {} // Map of departmentName -> count
        };
      }
      // If same department is added twice for a center, we take the latest count
      centersMap[assignment.centerName].departments[assignment.department] = assignment.count;
    });

    return Object.values(centersMap).map(centerObj => {
      // 2. For this center, find all subjects in the timetable that match its departments
      const centerSubjects = [];
      Object.keys(centerObj.departments).forEach(deptName => {
        const deptSubjects = data.timetable.filter(t => t.department === deptName);
        deptSubjects.forEach(sub => {
          centerSubjects.push({
            ...sub,
            assignedCount: centerObj.departments[deptName] // Include the student count for this specific subject
          });
        });
      });

      // 3. Group the center's subjects by Session (date + time)
      const sessionsMap = {};
      centerSubjects.forEach(sub => {
        const key = `${sub.date}_${sub.time}`;
        if (!sessionsMap[key]) {
          sessionsMap[key] = {
            date: sub.date,
            time: sub.time,
            subjects: [],
            // Keep track of which departments are active in this session to calculate total candidates
            activeDepartments: new Set()
          };
        }
        sessionsMap[key].subjects.push(sub);
        sessionsMap[key].activeDepartments.add(sub.department);
      });

      // 4. Calculate total candidates per session
      const sessions = Object.values(sessionsMap).map(session => {
        let totalCandidates = 0;
        session.activeDepartments.forEach(dept => {
          totalCandidates += centerObj.departments[dept];
        });
        return {
          ...session,
          totalCandidates,
          departmentList: Array.from(session.activeDepartments).join(', ')
        };
      });

      return {
        centerName: centerObj.centerName,
        departments: centerObj.departments,
        sessions: sessions
      };
    });
  }, [data.centers, data.timetable]);

  return (
    <div className="print-container theme-pack-cover" style={{ display: 'none' }}>
      <style type="text/css" media="print">{`
        @page { size: A4 portrait; margin: 0; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; padding: 0; }
        .view-container > .no-print { display: none !important; }
        .print-container { display: block !important; background: white; width: 100%; }
        
        .pack-cover-page {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm;
          box-sizing: border-box;
          background: white;
          position: relative;
        }
        .page-break-after {
          page-break-after: always;
        }
        
        .pack-cover-inner {
          border: 4px double black;
          padding: 6mm;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .pack-cover-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .pack-cover-header h2 { font-size: 22px; font-weight: 900; margin: 0 0 10px 0; text-transform: uppercase; }
        .pack-cover-header h3 { font-size: 16px; font-weight: bold; margin: 0 0 15px 0; color: #444; }
        .pack-cover-badge-top {
          display: inline-block;
          padding: 8px 24px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: white;
          background-color: #333;
        }
        
        .pack-cover-meta-grid { border: 2px solid black; margin-bottom: 20px; }
        .meta-row { display: flex; border-bottom: 1px solid black; padding: 8px 12px; align-items: flex-start; flex-direction: column; }
        .meta-row:last-child { border-bottom: none; }
        .meta-row-split { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid black; }
        .meta-row-split .meta-row { border-bottom: none; border-right: 1px solid black; }
        .meta-row-split .meta-row:last-child { border-right: none; }
        
        .meta-label { font-size: 10px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 4px; }
        .meta-value { font-size: 15px; font-weight: bold; color: #000; }
        
        .pack-cover-subject-box {
          border: 2px solid black;
          display: flex;
          text-align: center;
          margin-bottom: 20px;
          flex-direction: column;
        }
        .sub-field { padding: 12px; }
        .sub-label { display: block; font-size: 11px; font-weight: bold; color: #666; margin-bottom: 6px; }
        .sub-value { display: block; font-size: 24px; font-weight: 900; }
        .subject-highlight { font-family: "Traditional Arabic", "Amiri", serif; font-size: 28px; line-height: 1.4; padding: 10px 0; }
        .class-highlight { color: #1e3a8a; }
        
        .pack-cover-count-container { text-align: center; margin: 30px 0; }
        .count-label { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; }
        .count-badge-large {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          border: 5px solid black;
          font-size: 64px;
          font-weight: 900;
          margin: 0 auto 15px;
        }
        .count-words { font-size: 13px; font-weight: 500; }
        
        .pack-cover-footer { margin-top: auto; padding-top: 40px; position: relative; display: flex; justify-content: space-between; align-items: flex-end; }
        .signature-section { width: 60%; display: flex; flex-direction: column; gap: 40px; }
        .sig-line { display: flex; flex-direction: column; align-items: flex-start; }
        .sig-line span { margin-bottom: 5px; color: #999; }
        .sig-line strong { font-size: 12px; }
        
        .seal-box {
          width: 120px;
          height: 120px;
          border: 1px dashed black;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: #999;
        }
      `}</style>

      {uniqueCenters.map((centerObj, centerIdx) => {
        const isVeryLastCenter = centerIdx === uniqueCenters.length - 1;
        
        // Calculate all unique departments across all sessions for this center
        const allDepts = Object.keys(centerObj.departments).join(', ');
        
        return (
          <React.Fragment key={`center-${centerIdx}`}>
            {/* 0. CENTER MASTER PACK COVER (One per Center - for the outer parcel) */}
            <div className="pack-cover-page page-break-after">
              <div className="pack-cover-inner" style={{ border: '8px solid black' }}>
                <div className="pack-cover-header" style={{ marginTop: '40px' }}>
                  <h2>Council of Samastha Womens Colleges (CSWC)</h2>
                  <h3>Fadheela PG Examination {data.year}</h3>
                  <div className="pack-cover-badge-top" style={{ backgroundColor: '#1e3a8a', padding: '12px 32px', fontSize: '18px' }}>
                    CENTER MASTER PACK COVER
                  </div>
                </div>

                <div className="pack-cover-body" style={{ marginTop: '40px' }}>
                  <div className="pack-cover-meta-grid" style={{ borderWidth: '3px' }}>
                    <div className="meta-row" style={{ padding: '20px' }}>
                      <span className="meta-label" style={{ fontSize: '14px' }}>EXAM CENTER</span>
                      <span className="meta-value bold" style={{ fontSize: '24px' }}>{centerObj.centerName}</span>
                    </div>
                    <div className="meta-row" style={{ padding: '20px' }}>
                      <span className="meta-label" style={{ fontSize: '14px' }}>DEPARTMENTS INCLUDED</span>
                      <span className="meta-value bold" style={{ fontSize: '18px', color: '#1e3a8a' }}>{allDepts}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '50px', textAlign: 'center', border: '3px dashed black', padding: '40px' }}>
                    <h1 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '28px' }}>Confidential</h1>
                    <h3 style={{ margin: '15px 0 0 0', color: '#444' }}>EXAMINATION MATERIALS ENCLOSED</h3>
                    <p style={{ marginTop: '20px', fontSize: '16px', lineHeight: '1.6' }}>
                      This parcel contains all Question Paper Packets and Attendance Sheet Covers for the sessions scheduled at this center.
                    </p>
                  </div>
                </div>

                <div className="pack-cover-footer" style={{ marginTop: '80px' }}>
                  <div className="signature-section" style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around' }}>
                    <div className="sig-line" style={{ alignItems: 'center' }}>
                      <span>___________________________</span>
                      <strong style={{ marginTop: '10px' }}>DISPATCHED BY</strong>
                    </div>
                    <div className="sig-line" style={{ alignItems: 'center' }}>
                      <span>___________________________</span>
                      <strong style={{ marginTop: '10px' }}>RECEIVED BY (CENTER CHIEF)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {centerObj.sessions.map((session, sIdx) => {
              const isLastSessionInCenter = sIdx === centerObj.sessions.length - 1;

              return (
                <React.Fragment key={`session-${centerIdx}-${sIdx}`}>
                  {/* 1. ATTENDANCE SHEETS COVER (One per session for the whole center) */}
                  <div className="pack-cover-page page-break-after">
                    <div className="pack-cover-inner">
                      <div className="pack-cover-header">
                        <h2>Council of Samastha Womens Colleges (CSWC)</h2>
                        <h3>Fadheela PG Examination {data.year}</h3>
                        <div className="pack-cover-badge-top" style={{ backgroundColor: '#0ea5e9' }}>ATTENDANCE SHEETS COVER</div>
                      </div>

                      <div className="pack-cover-body">
                        <div className="pack-cover-meta-grid">
                          <div className="meta-row">
                            <span className="meta-label">EXAM CENTER</span>
                            <span className="meta-value bold">{centerObj.centerName}</span>
                          </div>
                          <div className="meta-row">
                            <span className="meta-label">DEPARTMENT(S) IN THIS SESSION</span>
                            <span className="meta-value bold">{session.departmentList}</span>
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
                            Attendance Sheets Enclosed For
                          </h4>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '16px', lineHeight: '1.8' }}>
                            {session.subjects.map((sub, i) => (
                               <li key={i} style={{ paddingLeft: '20px', color: '#111', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px dashed #ccc', paddingBottom: '8px' }}>
                                 <span style={{ fontSize: '12px', color: '#666', marginRight: '8px', textTransform: 'uppercase' }}>[{sub.department}]</span>
                                 {sub.subject}
                               </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pack-cover-count-container" style={{ marginTop: '30px' }}>
                          <div className="count-label">TOTAL CANDIDATES IN SESSION</div>
                          <div className="count-badge-large">{session.totalCandidates}</div>
                          <div className="count-words">
                            (In Words: <strong>{numberToWords(session.totalCandidates).toUpperCase()} ONLY</strong>)
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

                  {/* 2. INDIVIDUAL SUBJECT COVERS FOR THIS SESSION */}
                  {session.subjects.map((subject, subIdx) => {
                    const isLastSubjectInSession = subIdx === session.subjects.length - 1;
                    // We page break after EVERY subject, EXCEPT if it's the very last subject of the very last session of the very last center
                    const shouldBreakAfter = !(isVeryLastCenter && isLastSessionInCenter && isLastSubjectInSession);
                    
                    return (
                      <div key={`sub-${centerIdx}-${sIdx}-${subIdx}`} className={`pack-cover-page ${shouldBreakAfter ? 'page-break-after' : ''}`}>
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
                                <span className="meta-value bold">{centerObj.centerName}</span>
                              </div>
                              <div className="meta-row">
                                <span className="meta-label">DEPARTMENT</span>
                                <span className="meta-value bold">{subject.department}</span>
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
                              <div className="count-badge-large">{subject.assignedCount}</div>
                              <div className="count-words">
                                (In Words: <strong>{numberToWords(subject.assignedCount).toUpperCase()} ONLY</strong>)
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
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};
