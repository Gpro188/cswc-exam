import React, { useState } from 'react';
import { Shield, ShieldAlert, Award, ArrowRight, UserCheck, Trash2, Zap, Plus, X, Edit2 } from 'lucide-react';

const CenterAllocation = ({ institutions, registrations, previousStudents = [], onUpdateInstitutions, onDeleteInstitution, onAddInstitution, onEditInstitution }) => {
  const [selectedZone, setSelectedZone] = useState(institutions[0]?.zone || '');
  const [activeCenterCode, setActiveCenterCode] = useState('');

  // Form states for manual college addition
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newPlace, setNewPlace] = useState('');
  const [newZone, setNewZone] = useState('');
  const [newDistrict, setNewDistrict] = useState('');

  // States for inline editing
  const [editingSchoolCode, setEditingSchoolCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editZone, setEditZone] = useState('');

  // States for supervisor editing
  const [editingSupervisorCode, setEditingSupervisorCode] = useState('');
  const [supName, setSupName] = useState('');
  const [supPlace, setSupPlace] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [sup2Name, setSup2Name] = useState('');
  const [sup2Place, setSup2Place] = useState('');
  const [sup2Phone, setSup2Phone] = useState('');

  const startEditing = (school) => {
    setEditingSchoolCode(school.code);
    setEditName(school.name);
    setEditPlace(school.place || '');
    setEditDistrict(school.district || '');
    setEditZone(school.zone || '');
  };

  const cancelEditing = () => {
    setEditingSchoolCode('');
  };

  const saveEditing = (school) => {
    if (!editName.trim() || !editDistrict.trim() || !editZone.trim()) {
      alert("Name, District, and Zone are required!");
      return;
    }
    const updatedSchool = {
      ...school,
      name: editName.trim(),
      place: editPlace.trim(),
      district: editDistrict.trim(),
      zone: editZone.trim()
    };
    onEditInstitution(updatedSchool);
    setEditingSchoolCode('');
  };

  const startEditingSupervisor = (center) => {
    setEditingSupervisorCode(center.code);
    setSupName(center.supervisor_name || '');
    setSupPlace(center.supervisor_place || '');
    setSupPhone(center.supervisor_phone || '');
    setSup2Name(center.supervisor2_name || '');
    setSup2Place(center.supervisor2_place || '');
    setSup2Phone(center.supervisor2_phone || '');
  };

  const saveSupervisor = (center) => {
    onEditInstitution({
      ...center,
      supervisor_name: supName.trim(),
      supervisor_place: supPlace.trim(),
      supervisor_phone: supPhone.trim(),
      supervisor2_name: sup2Name.trim(),
      supervisor2_place: sup2Place.trim(),
      supervisor2_phone: sup2Phone.trim()
    });
    setEditingSupervisorCode('');
  };

  // Get zones
  const zones = [...new Set(institutions.map(i => i.zone).filter(Boolean))];

  // Filter institutions in the selected zone
  const zoneInstitutions = institutions.filter(i => i.zone === selectedZone);
  const examCenters = zoneInstitutions.filter(i => i.isExamCenter);
  const nonCenters = zoneInstitutions.filter(i => !i.isExamCenter);

  const handleCollegeSubmit = (e) => {
    e.preventDefault();
    if (!newCode || !newName || !newPlace || !newDistrict) {
      alert("Please fill in Code, Name, Place, and District.");
      return;
    }

    const codeUpper = newCode.trim().toUpperCase();
    const exists = institutions.some(inst => inst.code.toUpperCase() === codeUpper);
    if (exists) {
      alert(`Institution with code "${codeUpper}" already exists.`);
      return;
    }

    const newInst = {
      code: codeUpper,
      name: newName.trim(),
      place: newPlace.trim(),
      zone: newZone || selectedZone || 'UNASSIGNED',
      district: newDistrict.trim(),
      isExamCenter: false,
      assignedToCenter: '',
      email: '', phone1: '', phone2: '', principal: '', principal_mobile: '', incharge: '', incharge_mobile: ''
    };

    onAddInstitution(newInst);
    setNewCode('');
    setNewName('');
    setNewPlace('');
    setNewDistrict('');
    setNewZone('');
    setShowAddForm(false);
  };

  // Set first exam center as active if none is set
  if (examCenters.length > 0 && !activeCenterCode) {
    setActiveCenterCode(examCenters[0].code);
  }

  // Count candidates for a school
  const getSchoolStudentCount = (schoolCode) => {
    const regularIds = registrations.filter(r => r.school_code === schoolCode).map(r => r.uid);
    const prevIds = previousStudents.filter(r => r.school_code === schoolCode).map(r => r.uid);
    return new Set([...regularIds, ...prevIds]).size;
  };

  // Toggle Exam Center status
  const handleToggleCenter = (code) => {
    const updated = institutions.map(inst => {
      if (inst.code === code) {
        const nextIsCenter = !inst.isExamCenter;
        return {
          ...inst,
          isExamCenter: nextIsCenter,
          // Reset assignment if it becomes a center, or clear assignments to it if disabled
          assignedToCenter: nextIsCenter ? '' : inst.assignedToCenter
        };
      }
      return inst;
    });

    // If we disabled the active center, reset activeCenterCode
    if (code === activeCenterCode) {
      const remainingCenters = updated.filter(i => i.zone === selectedZone && i.isExamCenter);
      setActiveCenterCode(remainingCenters[0]?.code || '');
    }

    // Clean up mapping: if a school was assigned to the disabled center, clear it
    const finalUpdated = updated.map(inst => {
      if (!inst.isExamCenter && inst.assignedToCenter === code) {
        return { ...inst, assignedToCenter: '' };
      }
      return inst;
    });

    onUpdateInstitutions(finalUpdated);
  };

  // Assign school to active center
  const handleAssignSchool = (schoolCode, centerCode) => {
    const updated = institutions.map(inst => {
      if (inst.code === schoolCode) {
        return { ...inst, assignedToCenter: centerCode };
      }
      return inst;
    });
    onUpdateInstitutions(updated);
  };

  // Remove assignment
  const handleRemoveAssignment = (schoolCode) => {
    const updated = institutions.map(inst => {
      if (inst.code === schoolCode) {
        return { ...inst, assignedToCenter: '' };
      }
      return inst;
    });
    onUpdateInstitutions(updated);
  };

  // Quick Assign all unassigned schools in zone to center
  const handleQuickAssignAll = (centerCode) => {
    const updated = institutions.map(inst => {
      if (inst.zone === selectedZone && !inst.isExamCenter && !inst.assignedToCenter) {
        return { ...inst, assignedToCenter: centerCode };
      }
      return inst;
    });
    onUpdateInstitutions(updated);
  };

  // Calculate stats for center
  const getCenterStats = (centerCode) => {
    const assignedSchools = institutions.filter(i => i.assignedToCenter === centerCode || i.code === centerCode);
    const schoolCodes = assignedSchools.map(s => s.code);
    
    // Unique student IDs
    const studentIds = new Set([
      ...registrations.filter(r => schoolCodes.includes(r.school_code)).map(r => r.uid),
      ...previousStudents.filter(r => schoolCodes.includes(r.school_code)).map(r => r.uid)
    ]);
    
    // Subject papers count (regular + previous say)
    const regularPapers = registrations.filter(r => schoolCodes.includes(r.school_code)).length;
    let prevPapers = 0;
    previousStudents.filter(r => schoolCodes.includes(r.school_code)).forEach(r => {
      prevPapers += (r.subjects ? r.subjects.length : 1);
    });
    const totalPapers = regularPapers + prevPapers;

    // Unique student breakdown by class
    const classCandidates = {};
    const addCandidate = (cls, uid) => {
      const clsKey = cls || 'UNKNOWN';
      if (!classCandidates[clsKey]) {
        classCandidates[clsKey] = new Set();
      }
      classCandidates[clsKey].add(uid);
    };

    registrations.forEach(r => {
      if (schoolCodes.includes(r.school_code)) {
        addCandidate(r.class, r.uid);
      }
    });

    previousStudents.forEach(r => {
      if (schoolCodes.includes(r.school_code)) {
        addCandidate(r.class, r.uid);
      }
    });

    const classBreakdown = {};
    Object.entries(classCandidates).forEach(([cls, uids]) => {
      classBreakdown[cls] = uids.size;
    });

    return {
      schoolsCount: assignedSchools.length,
      candidatesCount: studentIds.size,
      papersCount: totalPapers,
      classBreakdown
    };
  };

  // Group all centers by zone for dropdown mapping across zones
  const allCentersGroupedByZone = {};
  institutions.filter(i => i.isExamCenter).forEach(c => {
    if (!allCentersGroupedByZone[c.zone]) {
      allCentersGroupedByZone[c.zone] = [];
    }
    allCentersGroupedByZone[c.zone].push(c);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Add Button Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }} className="no-print">
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <><X size={16} /> Close Form</> : <><Plus size={16} /> Add College Manually</>}
        </button>
      </div>

      {/* Manual Add College Form */}
      {showAddForm && (
        <div className="card no-print">
          <div className="card-title">
            <h3>Add Institution Manually</h3>
          </div>
          <form onSubmit={handleCollegeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-row-grid">
              <div className="form-group">
                <label>College Code (Unique)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. SMC" 
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>College Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. MARKAZ COLLEGE FOR GIRLS" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Place</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. SOUTH KALAMASSERY" 
                  required
                  value={newPlace}
                  onChange={(e) => setNewPlace(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label>District</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. ERANAKULAM" 
                  required
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Zone</label>
                <select 
                  className="form-select"
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                >
                  <option value="">-- Use Selected Zone ({selectedZone}) --</option>
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                  <option value="UNASSIGNED">UNASSIGNED</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
              <Plus size={16} /> Save Institution
            </button>
          </form>
        </div>
      )}

      {/* Zone Selector */}
      <div className="filter-bar">
        <div className="form-group" style={{ minWidth: '300px' }}>
          <label>Select Examination Zone</label>
          <select 
            className="form-select" 
            value={selectedZone} 
            onChange={(e) => {
              setSelectedZone(e.target.value);
              const firstCenter = institutions.find(i => i.zone === e.target.value && i.isExamCenter);
              setActiveCenterCode(firstCenter?.code || '');
            }}
          >
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', marginLeft: 'auto' }}>
          Total Schools in Zone: {zoneInstitutions.length} | Designated Centers: {examCenters.length}
        </div>
      </div>

      <div className="allocation-split">
        
        {/* Left Panel: List of schools in zone and center designation */}
        <div className="card">
          <div className="panel-title-bar">
            <h3>Institutions in {selectedZone}</h3>
          </div>
          
          <div className="school-list-container">
            {zoneInstitutions.map(school => {
              const studentCount = getSchoolStudentCount(school.code);
              
              if (school.code === editingSchoolCode) {
                return (
                  <div key={school.code} className="school-card-item editing" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch', padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }} 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                        />
                      </div>
                      <div style={{ width: '150px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Zone</label>
                        <select 
                          className="form-select" 
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }} 
                          value={editZone} 
                          onChange={(e) => setEditZone(e.target.value)}
                        >
                          {zones.map(z => <option key={z} value={z}>{z}</option>)}
                          {!zones.includes('UNASSIGNED') && <option value="UNASSIGNED">UNASSIGNED</option>}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>Place</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }} 
                          value={editPlace} 
                          onChange={(e) => setEditPlace(e.target.value)} 
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }}>District</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ width: '100%', padding: '6px 10px', fontSize: '13px' }} 
                          value={editDistrict} 
                          onChange={(e) => setEditDistrict(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={cancelEditing}>Cancel</button>
                      <button className="btn btn-success btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => saveEditing(school)}>Save</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={school.code} className={`school-card-item ${school.isExamCenter ? 'selected' : ''}`}>
                  <div className="school-info-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4>{school.name}</h4>
                      {school.isExamCenter && <span className="badge badge-success">CENTER</span>}
                      {school.assignedToCenter && (
                        <span className="badge badge-neutral">Mapped to {school.assignedToCenter}</span>
                      )}
                    </div>
                    <p>{school.place} | {school.district}</p>
                    <p style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '11px', marginTop: '4px' }}>
                      {studentCount} Candidates Registered
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {school.isExamCenter ? (
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleToggleCenter(school.code)}
                        title="Remove Center Status"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                      >
                        Remove Center
                      </button>
                    ) : (
                      <>
                        <button 
                          className="btn btn-success" 
                          onClick={() => handleToggleCenter(school.code)}
                          title="Designate as Exam Center"
                          style={{ padding: '8px 12px', fontSize: '12px' }}
                        >
                          Make Center
                        </button>
                        
                        {Object.keys(allCentersGroupedByZone).length > 0 && (
                          <select
                            className="form-select"
                            style={{ padding: '8px', fontSize: '12px', minWidth: '120px' }}
                            value={school.assignedToCenter}
                            onChange={(e) => handleAssignSchool(school.code, e.target.value)}
                          >
                            <option value="">-- Assign Center --</option>
                            {Object.entries(allCentersGroupedByZone).map(([zoneName, centers]) => (
                              <optgroup key={zoneName} label={zoneName}>
                                {centers.map(ec => (
                                  <option key={ec.code} value={ec.code}>{ec.code} - {ec.name.slice(0, 15)}...</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        )}
                      </>
                    )}

                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => startEditing(school)}
                      title="Edit College"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => onDeleteInstitution(school.code)}
                      title="Delete College"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Centers and Assigned Schools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="panel-title-bar">
            <h3>Designated Exam Centers ({examCenters.length})</h3>
          </div>

          {examCenters.length === 0 ? (
            <div className="card" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '200px', borderStyle: 'dashed', color: 'var(--text-muted)' }}>
              <ShieldAlert size={48} style={{ color: 'var(--warning)', marginBottom: '12px' }} />
              <h4>No Exam Centers Designated yet!</h4>
              <p style={{ fontSize: '13px' }}>Click "Make Center" on any institution on the left to designate it as an exam center for this zone.</p>
            </div>
          ) : (
            examCenters.map(center => {
              const stats = getCenterStats(center.code);
              const assigned = institutions.filter(i => i.assignedToCenter === center.code);
              
              return (
                <div key={center.code} className={`exam-center-card ${activeCenterCode === center.code ? 'active' : ''}`} onClick={() => setActiveCenterCode(center.code)}>
                  <div className="exam-center-header">
                    <div className="exam-center-title">
                      <h4>{center.name} ({center.code})</h4>
                      <p>{center.place}, {center.district}</p>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      {stats.candidatesCount} Students
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '12px 16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                    <div>Assigned Schools: <strong>{stats.schoolsCount}</strong></div>
                    <div>Candidates: <strong>{stats.candidatesCount}</strong></div>
                    <div>Total Papers: <strong>{stats.papersCount}</strong></div>
                  </div>

                  {/* Supervisor Details */}
                  <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '700', fontSize: '12px' }}>SUPERVISOR DETAILS</div>
                      {editingSupervisorCode !== center.code && (
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={(e) => { e.stopPropagation(); startEditingSupervisor(center); }}>
                          <Edit2 size={12} style={{ marginRight: '4px' }} /> Edit
                        </button>
                      )}
                    </div>
                    
                    {editingSupervisorCode === center.code ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Primary Supervisor</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input className="form-input" style={{ flex: 1, padding: '6px', fontSize: '12px' }} placeholder="Name" value={supName} onChange={e => setSupName(e.target.value)} />
                          <input className="form-input" style={{ flex: 1, padding: '6px', fontSize: '12px' }} placeholder="Place" value={supPlace} onChange={e => setSupPlace(e.target.value)} />
                          <input className="form-input" style={{ flex: 1, padding: '6px', fontSize: '12px' }} placeholder="Phone/Number" value={supPhone} onChange={e => setSupPhone(e.target.value)} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Secondary Supervisor (Optional)</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input className="form-input" style={{ flex: 1, padding: '6px', fontSize: '12px' }} placeholder="Name (Optional)" value={sup2Name} onChange={e => setSup2Name(e.target.value)} />
                          <input className="form-input" style={{ flex: 1, padding: '6px', fontSize: '12px' }} placeholder="Place" value={sup2Place} onChange={e => setSup2Place(e.target.value)} />
                          <input className="form-input" style={{ flex: 1, padding: '6px', fontSize: '12px' }} placeholder="Phone/Number" value={sup2Phone} onChange={e => setSup2Phone(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setEditingSupervisorCode('')}>Cancel</button>
                          <button className="btn btn-success btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => saveSupervisor(center)}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px', display: 'flex', gap: '16px' }}>
                          <div>Name: <strong>{center.supervisor_name || 'Not Set'}</strong></div>
                          <div>Place: <strong>{center.supervisor_place || 'Not Set'}</strong></div>
                          <div>Number: <strong>{center.supervisor_phone || 'Not Set'}</strong></div>
                        </div>
                        {(center.supervisor2_name || center.supervisor2_place || center.supervisor2_phone) && (
                          <div style={{ fontSize: '13px', display: 'flex', gap: '16px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '11px', alignSelf: 'center', marginRight: '4px' }}>2ND SUP:</div>
                            <div>Name: <strong>{center.supervisor2_name || '-'}</strong></div>
                            <div>Place: <strong>{center.supervisor2_place || '-'}</strong></div>
                            <div>Number: <strong>{center.supervisor2_phone || '-'}</strong></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 16px', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>
                      Class-wise Candidates:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Object.entries(stats.classBreakdown).map(([cls, count]) => (
                        <span key={cls} className="badge badge-neutral" style={{ fontSize: '11px', padding: '4px 8px' }}>
                          {cls}: <strong>{count}</strong>
                        </span>
                      ))}
                      {Object.keys(stats.classBreakdown).length === 0 && (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No candidates mapped yet</span>
                      )}
                    </div>
                  </div>

                  <div className="exam-center-body">
                    <h5>MAPPED INSTITUTIONS (writing at this center):</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '6px' }}>
                      {/* Center itself */}
                      <span className="mapped-school-tag" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                        <Award size={14} style={{ marginRight: '4px' }} /> {center.name} (Self)
                      </span>

                      {/* Other assigned schools */}
                      {assigned.map(sch => (
                        <span key={sch.code} className="mapped-school-tag">
                          {sch.name} ({getSchoolStudentCount(sch.code)} std)
                          <button onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAssignment(sch.code);
                          }} title="Unassign school">
                            <Trash2 size={12} style={{ marginLeft: '4px' }} />
                          </button>
                        </span>
                      ))}

                      {assigned.length === 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: '4px 0' }}>
                          No other schools assigned to this center yet.
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAssignAll(center.code);
                      }}
                      disabled={nonCenters.filter(i => !i.assignedToCenter).length === 0}
                    >
                      <Zap size={14} /> Quick Assign Unassigned ({nonCenters.filter(i => !i.assignedToCenter).length})
                    </button>
                  </div>
                </div>
              );
            })
          )}

        </div>

      </div>

    </div>
  );
};

export default CenterAllocation;
