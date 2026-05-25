import React, { useState, useMemo } from 'react';
import { Search, MapPin, CheckCircle, HelpCircle, Trash2, Plus, X } from 'lucide-react';
import { cleanSubjectName } from '../utils/matching';

const StudentRegistrations = ({ registrations, institutions, onDeleteRegistration, onAddRegistration }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  
  // Manual Add Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUid, setNewUid] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');
  const [newPayment, setNewPayment] = useState('PAID');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!newUid || !newName || !newClass || !newSubject || !newSchoolCode) {
      alert("All fields are required!");
      return;
    }

    const schoolObj = institutions.find(inst => inst.code === newSchoolCode);
    if (!schoolObj) {
      alert("Selected college not found!");
      return;
    }

    const newReg = {
      uid: newUid.trim().toUpperCase(),
      name: newName.trim(),
      class: newClass.trim(),
      subject: cleanSubjectName(newSubject.trim()),
      school_code: schoolObj.code,
      school_name: schoolObj.name,
      district: schoolObj.district,
      zone: schoolObj.zone,
      payment: newPayment,
      source: 'MANUAL_INPUT'
    };

    const success = onAddRegistration(newReg);
    if (success) {
      setNewUid('');
      setNewName('');
      setNewClass('');
      setNewSubject('');
      setNewSchoolCode('');
      setNewPayment('PAID');
      setShowAddForm(false);
    }
  };

  // Build filters list
  const subjects = useMemo(() => [...new Set(registrations.map(r => cleanSubjectName(r.subject)).filter(Boolean))].sort(), [registrations]);
  const classes = useMemo(() => [...new Set(registrations.map(r => r.class).filter(Boolean))].sort(), [registrations]);
  const zones = useMemo(() => [...new Set(institutions.map(i => i.zone).filter(Boolean))].sort(), [institutions]);
  const schools = useMemo(() => [...new Set(registrations.map(r => r.school_name).filter(Boolean))].sort(), [registrations]);

  // Create school code to center mapping for fast lookup
  const schoolToCenterMap = useMemo(() => {
    const mapping = {};
    institutions.forEach(inst => {
      if (inst.isExamCenter) {
        mapping[inst.code] = { name: inst.name, code: inst.code };
      } else if (inst.assignedToCenter) {
        const center = institutions.find(i => i.code === inst.assignedToCenter);
        if (center) {
          mapping[inst.code] = { name: center.name, code: center.code };
        }
      }
    });
    return mapping;
  }, [institutions]);

  // Filtered registrations
  const filteredRegs = useMemo(() => {
    setCurrentPage(1); // Reset page on filter change
    return registrations.filter(reg => {
      // Search matches
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        reg.name.toLowerCase().includes(searchLower) ||
        reg.uid.toLowerCase().includes(searchLower) ||
        reg.school_name.toLowerCase().includes(searchLower);

      const matchesSubject = !selectedSubject || reg.subject === selectedSubject;
      const matchesClass = !selectedClass || reg.class === selectedClass;
      const matchesZone = !selectedZone || reg.zone === selectedZone;
      const matchesSchool = !selectedSchool || reg.school_name === selectedSchool;

      return matchesSearch && matchesSubject && matchesClass && matchesZone && matchesSchool;
    });
  }, [registrations, searchTerm, selectedSubject, selectedClass, selectedZone, selectedSchool]);

  // Paginated item list
  const paginatedRegs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRegs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRegs, currentPage]);

  const totalPages = Math.ceil(filteredRegs.length / itemsPerPage) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Add Button Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }} className="no-print">
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Add Candidate Manually</>}
        </button>
      </div>

      {/* Manual Add Candidate Card */}
      {showAddForm && (
        <div className="card no-print">
          <div className="card-title">
            <h3>Register Candidate Manually</h3>
          </div>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-row-grid">
              <div className="form-group">
                <label>Student UID</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. FL25C0999" 
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
                  placeholder="e.g. AMINA SHAFEEQ" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Class</label>
                <select 
                  className="form-select"
                  required
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="F1">F1</option>
                  <option value="F2">F2</option>
                  <option value="D1">D1</option>
                  <option value="D2">D2</option>
                  <option value="D3">D3</option>
                  <option value="FADHILA 1ST YEAR">FADHILA 1ST YEAR</option>
                  <option value="FADHILA 2ND YEAR">FADHILA 2ND YEAR</option>
                  <option value="FADHEELA IST YEAR">FADHEELA IST YEAR</option>
                  <option value="FADHEELA 2ND YEAR">FADHEELA 2ND YEAR</option>
                  <option value="FADHEELA 3RD YEAR">FADHEELA 3RD YEAR</option>
                </select>
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. التمهيد في النحو 1" 
                  required
                  list="subjects-datalist"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  dir="rtl"
                />
                <datalist id="subjects-datalist">
                  {subjects.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label>College / School</label>
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
                <label>Payment Status</label>
                <select 
                  className="form-select"
                  value={newPayment}
                  onChange={(e) => setNewPayment(e.target.value)}
                >
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
              <Plus size={16} /> Save Student Registration
            </button>
          </form>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="filter-bar">
        
        {/* Search */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search by student name, UID, or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Zone */}
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

        {/* District / School */}
        <div className="form-group">
          <label>Filter by College</label>
          <select
            className="form-select"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
          >
            <option value="">All Colleges</option>
            {schools.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Class */}
        <div className="form-group">
          <label>Filter by Class</label>
          <select
            className="form-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div className="form-group">
          <label>Filter by Subject</label>
          <select
            className="form-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

      </div>

      {/* Registrations Table */}
      <div className="card" style={{ padding: 0, gap: 0 }}>
        <div className="card-title" style={{ padding: '20px 24px 12px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h3>Student Entries ({filteredRegs.length} filtered / {registrations.length} total)</h3>
        </div>

        <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>UID</th>
                <th>Student Name</th>
                <th>Class</th>
                <th style={{ textAlign: 'left' }}>Subject</th>
                <th>College</th>
                <th>Zone</th>
                <th>Exam Center</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRegs.map((reg, idx) => {
                const center = schoolToCenterMap[reg.school_code];
                return (
                  <tr key={idx}>
                    <td><code style={{ fontWeight: '700', color: 'var(--primary)' }}>{reg.uid}</code></td>
                    <td><strong style={{ fontSize: '14px' }}>{reg.name}</strong></td>
                    <td><span className="badge badge-neutral">{reg.class}</span></td>
                    <td style={{ fontWeight: '600', textAlign: 'left' }}>{reg.subject}</td>
                    <td>{reg.school_name}</td>
                    <td>{reg.zone || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>}</td>
                    <td>
                      {center ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} /> {center.code} - {center.name.slice(0, 15)}...
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <HelpCircle size={12} /> Not Assigned
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => onDeleteRegistration(reg.uid, reg.subject)}
                        title="Delete Student Registration"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedRegs.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No registrations found matching the select filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="table-footer">
          <div>
            Showing {filteredRegs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredRegs.length)} of {filteredRegs.length} students
          </div>
          
          <div className="table-pagination">
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontWeight: '600' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default StudentRegistrations;
