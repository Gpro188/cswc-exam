import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Search, MapPin, Trash2, CheckCircle2, UserPlus, Plus, X, Edit2 } from 'lucide-react';
import { parsePreviousSayExcelFile } from '../utils/excelParser';
import { findMatchedInstitution, generateSchoolCode, cleanSubjectName } from '../utils/matching';

const PreviousSayStudents = ({ previousStudents, institutions, registrations, onUpdatePreviousStudents, onDeletePreviousStudent, onAddPreviousStudent, onUpdateInstitutions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Edit Candidate Modal states
  const [editingStudent, setEditingStudent] = useState(null);
  const [editSubs, setEditSubs] = useState([]);

  // Sync edit state
  useEffect(() => {
    if (editingStudent) {
      setEditSubs(editingStudent.subjects || []);
    } else {
      setEditSubs([]);
    }
  }, [editingStudent]);

  const handleToggleEditSubject = (sub) => {
    if (editSubs.includes(sub)) {
      setEditSubs(editSubs.filter(s => s !== sub));
    } else {
      setEditSubs([...editSubs, sub]);
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (editSubs.length === 0) {
      alert("Please select at least one subject!");
      return;
    }
    
    const updated = {
      ...editingStudent,
      subjects: editSubs
    };
    
    const updatedList = previousStudents.map(st => st.uid === editingStudent.uid ? updated : st);
    onUpdatePreviousStudents(updatedList);
    setEditingStudent(null);
  };

  // Manual Add Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUid, setNewUid] = useState('');
  const [newName, setNewName] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [newZone, setNewZone] = useState('');
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [customSubject, setCustomSubject] = useState('');

  // Parse and upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsedData = await parsePreviousSayExcelFile(file);
      if (parsedData.length === 0) {
        alert("Could not extract any student records. Ensure the Excel has UID, Student Name, College, and subject columns.");
        return;
      }
      
      const newPlaceholderSchools = [];
      const formattedStudents = parsedData.map(st => {
        const combinedSchoolsList = [...institutions, ...newPlaceholderSchools];
        let matchedInst = findMatchedInstitution(st.college, combinedSchoolsList);
        
        if (!matchedInst && st.college) {
          const generatedCode = generateSchoolCode(st.college, combinedSchoolsList);
          matchedInst = {
            code: generatedCode,
            name: st.college,
            place: st.zone || 'UNKNOWN',
            zone: st.zone || 'UNASSIGNED',
            district: st.zone || 'UNKNOWN',
            isExamCenter: false,
            assignedToCenter: '',
            email: '', phone1: '', phone2: '', principal: '', principal_mobile: '', incharge: '', incharge_mobile: ''
          };
          newPlaceholderSchools.push(matchedInst);
        }
        
        return {
          uid: st.uid,
          name: st.name,
          contact: st.contact,
          school_code: matchedInst ? matchedInst.code : 'UNKNOWN',
          college: matchedInst ? matchedInst.name : st.college,
          zone: matchedInst ? matchedInst.zone : 'UNASSIGNED',
          class: st.class || 'UNKNOWN CLASS',
          subjects: (st.subjects || []).map(s => cleanSubjectName(s))
        };
      });

      // Merge or replace
      if (window.confirm(`Successfully parsed ${formattedStudents.length} students. Would you like to append them to the existing previous students list? (Cancel will overwrite)`)) {
        if (newPlaceholderSchools.length > 0) {
          onUpdateInstitutions([...institutions, ...newPlaceholderSchools]);
        }
        onUpdatePreviousStudents([...previousStudents, ...formattedStudents]);
      } else {
        if (newPlaceholderSchools.length > 0) {
          onUpdateInstitutions([...institutions, ...newPlaceholderSchools]);
        }
        onUpdatePreviousStudents(formattedStudents);
      }
    } catch (err) {
      console.error(err);
      alert("Error parsing file: " + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = null; // Clear input
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all previous exam students?")) {
      onUpdatePreviousStudents([]);
    }
  };

  const uniqueSubjects = useMemo(() => {
    return [...new Set(registrations.map(r => cleanSubjectName(r.subject)).filter(Boolean))].sort();
  }, [registrations]);

  const handleToggleSubject = (sub) => {
    if (selectedSubs.includes(sub)) {
      setSelectedSubs(selectedSubs.filter(s => s !== sub));
    } else {
      setSelectedSubs([...selectedSubs, sub]);
    }
  };

  const handleAddCustomSubject = (e) => {
    e.preventDefault();
    if (!customSubject.trim()) return;
    const sub = cleanSubjectName(customSubject.trim());
    if (!selectedSubs.includes(sub)) {
      setSelectedSubs([...selectedSubs, sub]);
    }
    setCustomSubject('');
  };

  const handlePrevStudentSubmit = (e) => {
    e.preventDefault();
    if (!newUid || !newName || !newSchoolCode) {
      alert("Please fill in Name, UID, and select a College.");
      return;
    }
    if (selectedSubs.length === 0) {
      alert("Please select at least one subject!");
      return;
    }

    const schoolObj = institutions.find(inst => inst.code === newSchoolCode);
    if (!schoolObj) {
      alert("Selected college not found.");
      return;
    }

    const newStudent = {
      uid: newUid.trim().toUpperCase(),
      name: newName.trim(),
      contact: newContact.trim(),
      school_code: schoolObj.code,
      college: schoolObj.name,
      zone: schoolObj.zone,
      class: 'UNKNOWN CLASS',
      subjects: selectedSubs.map(s => cleanSubjectName(s))
    };

    const success = onAddPreviousStudent(newStudent);
    if (success) {
      setNewUid('');
      setNewName('');
      setNewContact('');
      setNewSchoolCode('');
      setSelectedSubs([]);
      setShowAddForm(false);
    }
  };

  // Map school name to exam center code (backward-compatible)
  const getStudentCenter = (schoolCode, collegeName) => {
    let matchedInst = null;
    if (schoolCode) {
      matchedInst = institutions.find(inst => inst.code === schoolCode);
    }
    if (!matchedInst && collegeName) {
      matchedInst = findMatchedInstitution(collegeName, institutions);
    }

    if (matchedInst) {
      if (matchedInst.isExamCenter) {
        return { name: matchedInst.name, code: matchedInst.code };
      } else if (matchedInst.assignedToCenter) {
        const center = institutions.find(i => i.code === matchedInst.assignedToCenter);
        if (center) {
          return { name: center.name, code: center.code };
        }
      }
    }
    return null;
  };

  // Build list of unique zones
  const zones = useMemo(() => {
    return [...new Set(previousStudents.map(s => s.zone).filter(Boolean))].sort();
  }, [previousStudents]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return previousStudents.filter(student => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        student.name.toLowerCase().includes(searchLower) ||
        student.uid.toLowerCase().includes(searchLower) ||
        student.college.toLowerCase().includes(searchLower);

      const matchesZone = !selectedZone || student.zone === selectedZone;

      return matchesSearch && matchesZone;
    });
  }, [previousStudents, searchTerm, selectedZone]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header Row with Add Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }} className="no-print">
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Add Candidate Manually</>}
        </button>
      </div>

      {/* Manual Add Previous Candidate Form */}
      {showAddForm && (
        <div className="card no-print">
          <div className="card-title">
            <h3>Register Previous SAY Candidate Manually</h3>
          </div>
          <form onSubmit={handlePrevStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-row-grid">
              <div className="form-group">
                <label>Student UID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. FL24PBS0859" 
                  required
                  value={newUid}
                  onChange={(e) => setNewUid(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Student Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. FATHIMA NAJIYA" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 9847123456" 
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-grid" style={{ gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>College / Institution</label>
                  <select 
                    className="form-select"
                    required
                    value={newSchoolCode}
                    onChange={(e) => setNewSchoolCode(e.target.value)}
                  >
                    <option value="">-- Select College --</option>
                    {institutions.map(inst => (
                      <option key={inst.code} value={inst.code}>{inst.code} - {inst.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Add Custom Subject (if not in checklist)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Type custom subject name..."
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      style={{ flexGrow: 1 }}
                      dir="rtl"
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleAddCustomSubject}
                      style={{ padding: '8px 16px' }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Select Candidate Subjects ({selectedSubs.length} selected)</label>
                <div className="subject-checkbox-grid" style={{ maxHeight: '220px' }}>
                  {uniqueSubjects.map(sub => (
                    <label key={sub} className="subject-checkbox-item" dir="rtl" style={{ justifyContent: 'flex-end', textAlign: 'right' }}>
                      <span style={{ marginRight: '8px', fontSize: '13px' }}>{sub}</span>
                      <input 
                        type="checkbox"
                        checked={selectedSubs.includes(sub)}
                        onChange={() => handleToggleSubject(sub)}
                      />
                    </label>
                  ))}
                  {selectedSubs.filter(s => !uniqueSubjects.includes(s)).map(sub => (
                    <label key={sub} className="subject-checkbox-item" dir="rtl" style={{ justifyContent: 'flex-end', textAlign: 'right', color: 'var(--primary)', fontWeight: '700' }}>
                      <span style={{ marginRight: '8px', fontSize: '13px' }}>{sub} (Custom)</span>
                      <input 
                        type="checkbox"
                        checked={selectedSubs.includes(sub)}
                        onChange={() => handleToggleSubject(sub)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
              <Plus size={16} /> Save Candidate
            </button>
          </form>
        </div>
      )}

      {/* Upload Zone */}
      <div className="card">
        <div className="card-title">
          <h3>Upload Previous SAY Candidates Data</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Upload the previous examinations Excel sheet containing columns like <strong>Student Name</strong>, <strong>UID/Reg Number</strong>, <strong>Contact Number</strong>, <strong>Name of College</strong>, <strong>Zone</strong>, and additional columns for subjects (e.g. marked as "YES" or containing subject text).
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="file"
                id="prev-student-file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <label htmlFor="prev-student-file" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                <Upload size={16} /> {isUploading ? 'Parsing Spreadsheet...' : 'Choose Excel/CSV File'}
              </label>

              {previousStudents.length > 0 && (
                <button className="btn btn-danger" onClick={handleClearAll}>
                  <Trash2 size={16} /> Clear All ({previousStudents.length})
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Column Structure Details</h4>
            <ul style={{ fontSize: '12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Must contain: <strong>Name</strong>, <strong>UID</strong> (or Reg No), and <strong>College</strong>.</li>
              <li>Columns that are NOT metadata are treated as subjects.</li>
              <li>Ticked columns or cells containing "YES" mark a subject registration.</li>
            </ul>
          </div>
        </div>
      </div>

      {previousStudents.length > 0 && (
        <>
          {/* Filters */}
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search candidates by name, UID, or college..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Filter by Zone</label>
              <select
                className="form-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="">All Zones</option>
                {zones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          {/* List Table */}
          <div className="card" style={{ padding: 0, gap: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>UID</th>
                    <th>Candidate Name</th>
                    <th>Class</th>
                    <th>College</th>
                    <th>Zone</th>
                    <th>Subjects Registered</th>
                    <th>Mapped Center</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st, idx) => {
                    const center = getStudentCenter(st.school_code, st.college);
                    return (
                      <tr key={idx}>
                        <td><code>{st.uid}</code></td>
                        <td><strong>{st.name}</strong></td>
                        <td><span className="badge badge-neutral" style={{fontSize: '11px'}}>{st.class || 'UNKNOWN'}</span></td>
                        <td>{st.college}</td>
                        <td>{st.zone}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {st.subjects.map(sub => (
                              <span key={sub} className="badge badge-neutral" style={{ fontSize: '10px' }} dir="rtl">
                                {sub}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {center ? (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={10} /> {center.code} - {center.name.slice(0, 10)}...
                            </span>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                              No Mapped Center
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => setEditingStudent(st)}
                              title="Edit Candidate"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '6px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => onDeletePreviousStudent(st.uid)}
                              title="Delete Student"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit Candidate Modal */}
      {editingStudent && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '550px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--border-color)',
            animation: 'fadeIn 0.2s ease-out',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Edit Registered Subjects</h3>
              <button 
                type="button" 
                onClick={() => setEditingStudent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
              <div style={{ marginBottom: '4px' }}>Candidate: <strong>{editingStudent.name}</strong></div>
              <div style={{ marginBottom: '4px' }}>UID: <code>{editingStudent.uid}</code></div>
              <div>College: <span style={{ color: 'var(--text-muted)' }}>{editingStudent.college}</span></div>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={{ marginBottom: '8px' }}>Select Active Subjects ({editSubs.length} selected)</label>
                <div className="subject-checkbox-grid" style={{ maxHeight: '200px', padding: '10px' }}>
                  {uniqueSubjects.map(sub => (
                    <label key={sub} className="subject-checkbox-item" dir="rtl" style={{ justifyContent: 'flex-end', textAlign: 'right' }}>
                      <span style={{ marginRight: '8px', fontSize: '13px' }}>{sub}</span>
                      <input 
                        type="checkbox"
                        checked={editSubs.includes(sub)}
                        onChange={() => handleToggleEditSubject(sub)}
                      />
                    </label>
                  ))}
                  {editSubs.filter(s => !uniqueSubjects.includes(s)).map(sub => (
                    <label key={sub} className="subject-checkbox-item" dir="rtl" style={{ justifyContent: 'flex-end', textAlign: 'right', color: 'var(--primary)', fontWeight: '700' }}>
                      <span style={{ marginRight: '8px', fontSize: '13px' }}>{sub} (Custom)</span>
                      <input 
                        type="checkbox"
                        checked={editSubs.includes(sub)}
                        onChange={() => handleToggleEditSubject(sub)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PreviousSayStudents;
