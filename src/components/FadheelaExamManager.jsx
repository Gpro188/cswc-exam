import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Plus, Trash2, Calendar, Clock, BookOpen, Users, Building, AlertCircle } from 'lucide-react';
import { FadheelaPrintTemplates } from './FadheelaPrintTemplates';

export default function FadheelaExamManager({ institutions = [] }) {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('fadheelaExamDataV2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return {
      departmentName: '',
      year: '2026',
      timetable: [], // Master subjects: { id, date, time, subject }
      centers: []    // Assigned centers: { id, centerName, count }
    };
  });

  useEffect(() => {
    localStorage.setItem('fadheelaExamDataV2', JSON.stringify(data));
  }, [data]);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to completely wipe all subjects and centers?')) {
      setData({
        departmentName: '',
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
    date: '',
    time: '',
    subject: ''
  });

  const [newCenter, setNewCenter] = useState({
    centerName: '',
    count: 0
  });

  const handleAddSubject = () => {
    if (!newSubject.date || !newSubject.time || !newSubject.subject) {
      alert('Please fill in Date, Time, and Subject correctly.');
      return;
    }
    setData({
      ...data,
      timetable: [...data.timetable, { ...newSubject, id: Date.now().toString() }]
    });
    setNewSubject({ date: '', time: '', subject: '' });
  };

  const handleRemoveSubject = (id) => {
    setData({
      ...data,
      timetable: data.timetable.filter(t => t.id !== id)
    });
  };

  const handleAddCenter = () => {
    if (!newCenter.centerName || newCenter.count <= 0) {
      alert('Please select an Exam Center and enter a valid Student Count.');
      return;
    }
    setData({
      ...data,
      centers: [...data.centers, { ...newCenter, id: Date.now().toString() }]
    });
    setNewCenter({ centerName: '', count: 0 });
  };

  const handleRemoveCenter = (id) => {
    setData({
      ...data,
      centers: data.centers.filter(c => c.id !== id)
    });
  };

  const handlePrint = () => {
    if (!data.departmentName || data.timetable.length === 0 || data.centers.length === 0) {
      alert('Please enter Department, at least one Subject, and at least one Exam Center.');
      return;
    }
    window.print();
  };

  return (
    <div className="view-container">
      <div className="no-print">
        {/* Action Header */}
        <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem' }}>Fadheela Bulk Print Engine</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
              Configure your Master Schedule once, then bulk-generate pack covers for multiple centers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="danger-btn" onClick={handleClearAll} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={18} /> Clear All Data
            </button>
            <button className="primary-btn" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={18} /> Generate Covers for {data.centers.length} Centers
            </button>
          </div>
        </div>

        {/* Global Settings */}
        <div style={{ background: 'var(--surface)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Department</label>
            <input
              type="text"
              className="search-input"
              style={{ width: '100%', padding: '10px' }}
              placeholder="e.g. Islamic Studies"
              value={data.departmentName}
              onChange={(e) => setData({ ...data, departmentName: e.target.value })}
            />
          </div>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          
          {/* Left Column: Master Schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: 'var(--primary)' }}>
                <Clock size={20} /> 1. Master Schedule Setup
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Date</label>
                  <input
                    type="date"
                    className="search-input"
                    style={{ width: '100%', padding: '10px' }}
                    value={newSubject.date}
                    onChange={(e) => setNewSubject({ ...newSubject, date: e.target.value })}
                  />
                </div>
                <div>
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
                  <Plus size={16} /> Add Subject
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
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.subject}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.date} | {sub.time}</div>
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
              
              <div style={{ display: 'flex', gap: '1rem', background: 'var(--background)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                <div style={{ flex: 2 }}>
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
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="primary-btn" onClick={handleAddCenter} style={{ height: '41px' }}>
                    Add
                  </button>
                </div>
              </div>

              {/* Fallback input for manual center */}
              <div style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    className="search-input"
                    style={{ width: '100%', padding: '8px' }}
                    placeholder="Or type unlisted center manually..."
                    value={newCenter.centerName}
                    onChange={(e) => setNewCenter({ ...newCenter, centerName: e.target.value })}
                  />
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
                          <th style={{ textAlign: 'center' }}>Count</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.centers.map((c) => (
                          <tr key={c.id}>
                            <td style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.centerName}</td>
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
      <FadheelaPrintTemplates data={data} />
    </div>
  );
}
