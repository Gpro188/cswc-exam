import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, Users, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';

export default function SeatingClassManager({ 
  classes = [], 
  onAddClass, 
  onDeleteClass, 
  onAddStudentToClass, 
  onDeleteStudent,
  onImportStudentsExcel
}) {
  const [newClassName, setNewClassName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [singleStudent, setSingleStudent] = useState({ rollNo: '', name: '' });
  const [uploadStatus, setUploadStatus] = useState(null);

  // Generate and download sample Excel template for student upload
  const handleDownloadTemplate = () => {
    const templateData = [
      { "Roll No": "1001", "Student Name": "Muhammed Nihal" },
      { "Roll No": "1002", "Student Name": "Aysha Ridha" },
      { "Roll No": "1003", "Student Name": "Fathima Sana" },
      { "Roll No": "1004", "Student Name": "Ahmed Basil" },
      { "Roll No": "1005", "Student Name": "Zayan Ali" }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    // Set friendly column widths
    worksheet['!cols'] = [{ wch: 18 }, { wch: 30 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "StudentList");
    
    const classNameClean = (currentClass?.name || 'Class').replace(/[^a-zA-Z0-9_-]/g, '_');
    XLSX.writeFile(workbook, `${classNameClean}_Students_Template.xlsx`);
  };

  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    const newId = `cls_${Date.now()}`;
    onAddClass({
      id: newId,
      name: newClassName.trim(),
      students: []
    });
    setSelectedClassId(newId);
    setNewClassName('');
  };

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];

  const handleAddSingleStudent = (e) => {
    e.preventDefault();
    if (!currentClass) {
      alert('Please select or create a class first.');
      return;
    }
    if (!singleStudent.rollNo.trim() || !singleStudent.name.trim()) {
      alert('Please enter both ID/Roll Number and Student Name.');
      return;
    }
    onAddStudentToClass(currentClass.id, {
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rollNo: singleStudent.rollNo.trim(),
      name: singleStudent.name.trim()
    });
    setSingleStudent({ rollNo: '', name: '' });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentClass) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!json || json.length < 2) {
          setUploadStatus({ type: 'error', message: 'Excel file is empty or missing headers.' });
          return;
        }

        // Find headers
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(json.length, 5); i++) {
          const rowStr = json[i].map(x => String(x || '').toUpperCase());
          if (rowStr.some(h => h.includes('ID') || h.includes('ROLL') || h.includes('NAME') || h.includes('REG') || h.includes('NO'))) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = json[headerRowIndex].map(h => String(h || '').trim().toUpperCase());
        const dataRows = json.slice(headerRowIndex + 1);

        let idIdx = headers.findIndex(h => h.includes('ID') || h.includes('ROLL') || h.includes('REG') || h.includes('NO') || h.includes('CODE'));
        let nameIdx = headers.findIndex(h => h.includes('NAME') || h.includes('STUDENT'));

        if (idIdx === -1 && nameIdx === -1) {
          idIdx = 0;
          nameIdx = 1;
        } else if (idIdx === -1) {
          idIdx = nameIdx === 0 ? 1 : 0;
        } else if (nameIdx === -1) {
          nameIdx = idIdx === 0 ? 1 : 0;
        }

        const newStudents = [];
        dataRows.forEach((row, idx) => {
          if (!row || row.length === 0) return;
          const rollVal = String(row[idIdx] !== undefined ? row[idIdx] : '').trim();
          const nameVal = String(row[nameIdx] !== undefined ? row[nameIdx] : '').trim();
          if (rollVal || nameVal) {
            newStudents.push({
              id: `std_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
              rollNo: rollVal || `STD-${idx + 1}`,
              name: nameVal || `Student ${idx + 1}`
            });
          }
        });

        if (newStudents.length > 0) {
          onImportStudentsExcel(currentClass.id, newStudents);
          setUploadStatus({
            type: 'success',
            message: `Successfully imported ${newStudents.length} students into ${currentClass.name}!`
          });
        } else {
          setUploadStatus({ type: 'error', message: 'No valid student records found in file.' });
        }
      } catch (err) {
        console.error(err);
        setUploadStatus({ type: 'error', message: `Error parsing Excel: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  return (
    <div className="seating-section-container" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
      {/* Left Column: Classes List & Add Class */}
      <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--primary)" />
          Classes & Batches
        </h3>

        <form onSubmit={handleCreateClass} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Class 10-A, B.Com 1st Year"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={16} /> Add
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '480px', overflowY: 'auto' }}>
          {classes.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No classes added yet. Create your first class above!
            </div>
          ) : (
            classes.map(cls => {
              const isSelected = cls.id === (currentClass?.id || selectedClassId);
              return (
                <div
                  key={cls.id}
                  onClick={() => { setSelectedClassId(cls.id); setUploadStatus(null); }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: isSelected ? 'var(--primary-light)' : '#fcfcfc',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>{cls.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(cls.students || []).length} Students
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Delete Class"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete class "${cls.name}" and all its students?`)) {
                        onDeleteClass(cls.id);
                        if (selectedClassId === cls.id) {
                          const remaining = classes.filter(c => c.id !== cls.id);
                          setSelectedClassId(remaining[0]?.id || '');
                        }
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Selected Class Students & Excel Import */}
      <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        {currentClass ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  {currentClass.name}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total Enrolled: <strong>{(currentClass.students || []).length} Students</strong>
                </p>
              </div>

              {/* Excel Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid var(--border-color)', borderRadius: '6px', background: '#fff', fontSize: '0.875rem', fontWeight: 600 }}
                  title="Download blank sample Excel template with Roll No and Student Name columns"
                >
                  <Download size={16} color="var(--primary)" />
                  <span>Download Excel Template (.xlsx)</span>
                </button>

                <label className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 14px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600 }}>
                  <FileSpreadsheet size={16} color="#fff" />
                  <span>Import Students Excel</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>

            {uploadStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                background: uploadStatus.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: uploadStatus.type === 'success' ? 'var(--success)' : 'var(--danger)'
              }}>
                {uploadStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {uploadStatus.message}
              </div>
            )}

            {/* Quick Add Student Single Form */}
            <form onSubmit={handleAddSingleStudent} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 100px', gap: '10px', marginBottom: '20px', background: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
              <input
                type="text"
                placeholder="ID / Roll No"
                value={singleStudent.rollNo}
                onChange={(e) => setSingleStudent({ ...singleStudent, rollNo: e.target.value })}
                style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              />
              <input
                type="text"
                placeholder="Student Full Name"
                value={singleStudent.name}
                onChange={(e) => setSingleStudent({ ...singleStudent, name: e.target.value })}
                style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Plus size={16} /> Add
              </button>
            </form>

            {/* Students Table */}
            <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 14px', width: '60px' }}>#</th>
                    <th style={{ padding: '10px 14px', width: '180px' }}>Roll / ID No</th>
                    <th style={{ padding: '10px 14px' }}>Student Name</th>
                    <th style={{ padding: '10px 14px', width: '70px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentClass.students || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No students in this class. Add manually above or import using the Excel button.
                        <div style={{ fontSize: '0.8rem', marginTop: '6px', color: '#94a3b8' }}>
                          Excel columns recognized: <code>Roll No / ID Number</code> and <code>Student Name</code>.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentClass.students.map((std, idx) => (
                      <tr key={std.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 14px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '8px 14px', fontWeight: 600 }}>{std.rollNo}</td>
                        <td style={{ padding: '8px 14px' }}>{std.name}</td>
                        <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => onDeleteStudent(currentClass.id, std.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                            title="Remove student"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <h4>No Class Selected</h4>
            <p>Please select an existing class from the left panel or create a new class.</p>
          </div>
        )}
      </div>
    </div>
  );
}
