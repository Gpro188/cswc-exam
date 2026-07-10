import React, { useState } from 'react';
import { Printer, Plus, Trash2, Calendar, Clock, BookOpen, Users, MapPin } from 'lucide-react';
import { FadheelaPrintTemplates } from './FadheelaPrintTemplates';

export default function FadheelaExamManager() {
  const [data, setData] = useState({
    centerName: '',
    departmentName: '',
    year: '2026',
    timetable: []
  });

  const [newSubject, setNewSubject] = useState({
    date: '',
    time: '',
    subject: '',
    count: 0
  });

  const handleAddSubject = () => {
    if (!newSubject.date || !newSubject.time || !newSubject.subject || newSubject.count <= 0) {
      alert('Please fill in all subject fields correctly.');
      return;
    }
    setData({
      ...data,
      timetable: [...data.timetable, { ...newSubject, id: Date.now().toString() }]
    });
    setNewSubject({ date: '', time: '', subject: '', count: 0 });
  };

  const handleRemoveSubject = (id) => {
    setData({
      ...data,
      timetable: data.timetable.filter(t => t.id !== id)
    });
  };

  const handlePrint = () => {
    if (!data.centerName || !data.departmentName || data.timetable.length === 0) {
      alert('Please enter Center, Department, and at least one Subject before generating documents.');
      return;
    }
    window.print();
  };

  return (
    <div className="view-container">
      {/* Action Header */}
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem' }}>Fadheela PG Examination</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
            Configure offline exam materials and generate print-ready documents.
          </p>
        </div>
        <button className="primary-btn" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Printer size={18} /> Generate Exam Pack
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Form Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: 'var(--primary)' }}>
              <MapPin size={20} /> Center & Dept
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Exam Center Name / Code</label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: '100%', padding: '10px' }}
                  placeholder="e.g. Center A (C-001)"
                  value={data.centerName}
                  onChange={(e) => setData({ ...data, centerName: e.target.value })}
                />
              </div>
              <div>
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
              <div>
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
          </div>

          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, color: 'var(--primary)' }}>
              <Plus size={20} /> Add Subject to Schedule
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Date</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="date"
                    className="search-input"
                    style={{ width: '100%', padding: '10px 10px 10px 36px' }}
                    value={newSubject.date}
                    onChange={(e) => setNewSubject({ ...newSubject, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Time (e.g. 10:00 AM - 01:00 PM)</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="10:00 AM - 01:00 PM"
                    className="search-input"
                    style={{ width: '100%', padding: '10px 10px 10px 36px' }}
                    value={newSubject.time}
                    onChange={(e) => setNewSubject({ ...newSubject, time: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Subject Name</label>
                <div style={{ position: 'relative' }}>
                  <BookOpen size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="e.g. Advanced Fiqh"
                    className="search-input"
                    style={{ width: '100%', padding: '10px 10px 10px 36px' }}
                    value={newSubject.subject}
                    onChange={(e) => setNewSubject({ ...newSubject, subject: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>Student Count</label>
                <div style={{ position: 'relative' }}>
                  <Users size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    min="1"
                    className="search-input"
                    style={{ width: '100%', padding: '10px 10px 10px 36px' }}
                    value={newSubject.count || ''}
                    onChange={(e) => setNewSubject({ ...newSubject, count: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <button className="primary-btn" onClick={handleAddSubject} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                Add to Schedule
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview Schedule */}
        <div>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', height: '100%' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>Current Schedule ({data.timetable.length} Subjects)</h3>
            
            {data.timetable.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: '12px', marginTop: '1rem' }}>
                <Calendar size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>No subjects added yet.</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>Use the form to add subjects to the timetable.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table className="data-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Subject</th>
                      <th style={{ textAlign: 'center' }}>Count</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.timetable.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.date}</strong></td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.time}</td>
                        <td>{item.subject}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {item.count}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            onClick={() => handleRemoveSubject(item.id)}
                            className="danger-btn"
                            style={{ padding: '6px' }}
                            title="Remove subject"
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

            {data.timetable.length > 0 && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Generation Preview:</h4>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div> 1x Pack Cover Page</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div> 1x Admin Document Checklist</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div> 1x Schedule & Seating Overview</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div> {data.timetable.length}x Attendance Sheets</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden print templates that are revealed by @media print */}
      <FadheelaPrintTemplates data={data} />
    </div>
  );
}
