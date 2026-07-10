import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Plus, Trash2, Calendar, Clock, BookOpen, Users, Building, AlertCircle } from 'lucide-react';
import { FadheelaPrintTemplates } from './FadheelaPrintTemplates';

const DEPARTMENTS = [
  'THAFSEER',
  'HADITH',
  'FIQH',
  'THASAWUF',
  'LUGHA'
];

export default function FadheelaExamManager({ institutions = [] }) {
  const [printMode, setPrintMode] = useState('ALL');

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('fadheelaExamDataV3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return {
      year: '2026',
      timetable: [], // { id, department, date, time, subject }
      centers: []    // { id, centerName, department, count }
    };
  });

  useEffect(() => {
    localStorage.setItem('fadheelaExamDataV3', JSON.stringify(data));
  }, [data]);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to completely wipe all subjects and centers?')) {
      setData({
        year: '2026',
        timetable: [],
        centers: []
      });
    }
  };

  const handleClearCenters = () => {
    if (window.confirm('Clear all assigned centers? (Your Master Schedule will be kept)')) {
      setData({
        ...data,
        centers: []
      });
    }
  };

  const pgCenters = [
    "MSA WOMEN'S COLLEGE, THALASSERY - THRISSUR",
    "TWAIBA ISLAMIC WOMEN'S COLLEGE, CHERPULASSERRI - PALAKKAD",
    "SAYED HYDERALI SHIHAB THANGAL MEMORIAL SAMASTHA FADHILA COLLEGE, VALIYAD - MALAPPURAM",
    "MUNAVVIRUL ISLAM SAMASTHA FADHEELA WOMEN'S COLLEGE, TRIKARIPUR - KASARAGOD"
  ];

  const [newSubject, setNewSubject] = useState({
    department: 'THAFSEER',
    date: '',
    time: '',
    subject: ''
  });

  const [newCenter, setNewCenter] = useState({
    centerName: '',
    department: 'THAFSEER',
    count: 0
  });

  const handleAddSubject = () => {
    if (!newSubject.date || !newSubject.time || !newSubject.subject || !newSubject.department) {
      alert('Please fill in Department, Date, Time, and Subject correctly.');
      return;
    }
    setData({
      ...data,
      timetable: [...data.timetable, { ...newSubject, id: Date.now().toString() }]
    });
    setNewSubject({ ...newSubject, subject: '' }); // Keep date, time, and dept to speed up entry
  };

  const handleRemoveSubject = (id) => {
    setData({
      ...data,
      timetable: data.timetable.filter(t => t.id !== id)
    });
  };

  const handleAddCenter = () => {
    if (!newCenter.centerName || newCenter.count <= 0 || !newCenter.department) {
      alert('Please select an Exam Center, Department, and enter a valid Student Count.');
      return;
    }
    setData({
      ...data,
      centers: [...data.centers, { ...newCenter, id: Date.now().toString() }]
    });
    setNewCenter({ ...newCenter, centerName: '', count: 0 }); // Keep department to speed up entry
  };

  const handleRemoveCenter = (id) => {
    setData({
      ...data,
      centers: data.centers.filter(c => c.id !== id)
    });
  };

  const handlePrint = (mode) => {
    if (data.timetable.length === 0 || data.centers.length === 0) {
      alert('Please enter at least one Subject and at least one Exam Center.');
      return;
    }
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="view-container">
      <div className="no-print">
        {/* Action Header */}
        <div className="header-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem' }}>Fadheela Bulk Print Engine</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                Configure your Master Schedule once, then bulk-generate pack covers for multiple centers and departments.
              </p>
            </div>
            <button className="danger-btn" onClick={handleClearAll} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={18} /> Clear All Data
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '10px' }}>
            <button className="primary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handlePrint('MASTER_COVERS')}>
              <Printer size={16} /> Total Cover Data (Outer Box)
            </button>
            <button className="primary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handlePrint('SESSION_COVERS')}>
              <Printer size={16} /> On Time Pack (Unpack On)
            </button>
            <button className="primary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handlePrint('ATTENDANCE_COVERS')}>
              <Printer size={16} /> Attendance Covers
            </button>
            <button className="primary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handlePrint('SUBJECT_COVERS')}>
              <Printer size={16} /> Subject Covers
            </button>
          </div>
        </div>

        {/* Global Settings */}
        <div style={{ background: 'var(--surface)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Exam Year</label>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', padding: '10px' }}
              placeholder="2026"
              value={data.year}
              onChange={(e) => setData({ ...data, year: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          {/* Left Column: Master Schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: 'var(--primary)' }}>
                <Clock size={20} /> 1. Master Schedule Setup
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Department</label>
                  <select
                    className="search-input"
                    style={{ width: '100%', padding: '10px' }}
                    value={newSubject.department}
                    onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Date</label>
                    <input
                      type="date"
                      className="search-input"
                      style={{ width: '100%', padding: '10px' }}
                      value={newSubject.date}
                      onChange={(e) => setNewSubject({ ...newSubject, date: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Time</label>
                    <input
                      type="text"
                      placeholder="10:00 AM - 01:00 PM"
                      className="search-input"
                      style={{ width: '100%', padding: '10px' }}
                      value={newSubject.time}
                      onChange={(e) => setNewSubject({ ...newSubject, time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Advanced Fiqh"
                    className="search-input"
                    style={{ width: '100%', padding: '10px' }}
                    value={newSubject.subject}
                    onChange={(e) => setNewSubject({ ...newSubject, subject: e.target.value })}
                  />
                </div>
                <button className="primary-btn" onClick={handleAddSubject} style={{ width: '100%', justifyContent: 'center' }}>
                  <Plus size={16} /> Add Subject to {newSubject.department}
                </button>
              </div>

              {/* Subject List */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Master Subjects ({data.timetable.length})</h4>
                {data.timetable.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No subjects added.</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.timetable.map(sub => (
                      <li key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.7rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{sub.department}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.subject}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{sub.date} | {sub.time}</div>
                        </div>
                        <button onClick={() => handleRemoveSubject(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Center Assignments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: 'var(--primary)' }}>
                  <Building size={20} /> 2. Bulk Center Processing
                </h3>
                {data.centers.length > 0 && (
                  <button className="danger-btn" onClick={handleClearCenters} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                    Clear Centers
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Exam Center Name</label>
                  <select
                    className="search-input"
                    style={{ width: '100%', padding: '10px' }}
                    value={newCenter.centerName}
                    onChange={(e) => setNewCenter({ ...newCenter, centerName: e.target.value })}
                  >
                    <option value="">-- Select PG Center --</option>
                    {pgCenters.map((center, idx) => (
                      <option key={idx} value={center}>
                        {center}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Department</label>
                    <select
                      className="search-input"
                      style={{ width: '100%', padding: '10px' }}
                      value={newCenter.department}
                      onChange={(e) => setNewCenter({ ...newCenter, department: e.target.value })}
                    >
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Student Count</label>
                    <input
                      type="number"
                      min="1"
                      className="search-input"
                      style={{ width: '100%', padding: '10px' }}
                      value={newCenter.count || ''}
                      placeholder="0"
                      onChange={(e) => setNewCenter({ ...newCenter, count: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <button className="primary-btn" onClick={handleAddCenter} style={{ width: '100%', justifyContent: 'center' }}>
                  <Plus size={16} /> Assign {newCenter.count || 0} students to {newCenter.department}
                </button>
              </div>

              {/* Assigned Centers List */}
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Assigned Centers for Printing ({data.centers.length})</h4>
                {data.centers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--background)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    <AlertCircle size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>Add centers to apply the Master Schedule.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Center</th>
                          <th>Department</th>
                          <th style={{ textAlign: 'center' }}>Count</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.centers.map((c) => (
                          <tr key={c.id}>
                            <td style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.centerName}</td>
                            <td style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{c.department}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                {c.count}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                onClick={() => handleRemoveCenter(c.id)}
                                className="danger-btn"
                                style={{ padding: '6px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Hidden print templates that are revealed by @media print */}
      <FadheelaPrintTemplates data={data} printMode={printMode} />
    </div>
  );
}
