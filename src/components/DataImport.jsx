import React, { useState } from 'react';
import { Upload, Download, RefreshCw, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { parseExcelFile } from '../utils/excelParser';
import { findMatchedInstitution, generateSchoolCode, cleanSubjectName } from '../utils/matching';

const DataImport = ({ onResetData, onClearAllData, onUpdateInstitutions, onUpdateRegistrations, institutions, registrations, timeTable, previousStudents }) => {
  const [isUploadingSchools, setIsUploadingSchools] = useState(false);
  const [isUploadingRegs, setIsUploadingRegs] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const triggerFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  };

  const handleClearAll = () => {
    if (window.confirm("CRITICAL WARNING: This will completely wipe all schools, student registrations, timetable slots, and previous SAY candidates from the database. This action is permanent and cannot be undone unless you have a downloaded backup. Do you want to proceed?")) {
      onClearAllData();
      triggerFeedback('success', 'Database cleared successfully! Start fresh.');
    }
  };

  // Import new school list
  const handleImportSchools = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingSchools(true);
    try {
      const parsedData = await parseExcelFile(file);
      if (parsedData.length === 0) {
        throw new Error("Parsed file is empty. Verify that the sheet contains column headers.");
      }

      // Convert rows to school structures with robust header matching and auto-code generation fallback
      const usedCodes = new Set();
      const formattedSchools = parsedData.map(row => {
        const getField = (possibleHeaders, colIndex) => {
          // 1. Try finding by matching possible headers case-insensitively
          const headerKey = Object.keys(row).find(k => 
            !k.startsWith('__col_') && 
            possibleHeaders.some(ph => k.toLowerCase().replace(/[^a-z0-9]/g, '') === ph.toLowerCase().replace(/[^a-z0-9]/g, ''))
          );
          if (headerKey) return String(row[headerKey]).trim();
          
          // 2. Fall back to index key
          if (colIndex >= 0) {
            const indexKey = `__col_${colIndex}`;
            return row[indexKey] !== undefined ? String(row[indexKey]).trim() : '';
          }
          return '';
        };

        const name = getField(['Institution English', 'InstitutionEnglish', 'Institution', 'Name', 'CollegeName', 'SchoolName'], 0);
        const place = getField(['Place', 'Location'], 1);
        const zone = getField(['Zone'], 2);
        const district = getField(['District', 'Management District', 'ManagementDistrict'], 3);
        let code = getField(['Code', 'Institution Code', 'CollegeCode'], -1); // Only match if explicitly in headers

        if (!name) return null;

        // Auto-generate code if missing
        if (!code) {
          const words = name.toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
          let genCode = '';
          if (words.length > 1) {
            genCode = words.map(w => w[0]).join('');
          } else if (words.length === 1) {
            genCode = words[0].slice(0, 4);
          }
          if (!genCode || genCode.length < 2) {
            genCode = 'COL';
          }
          
          // Guarantee uniqueness in current import batch
          let finalCode = genCode;
          let counter = 1;
          while (usedCodes.has(finalCode)) {
            finalCode = `${genCode}${counter}`;
            counter++;
          }
          code = finalCode;
        }
        
        usedCodes.add(code);

        return {
          code,
          name,
          place,
          zone: zone || 'UNASSIGNED',
          district,
          isExamCenter: false,
          assignedToCenter: '',
          email: String(row["Institution mail"] || '').trim(),
          phone1: String(row["Institution No1"] || '').trim(),
          phone2: String(row["Institution No2"] || '').trim(),
          principal: String(row["Principal Name"] || '').trim(),
          principal_mobile: String(row["Principal Mobile"] || '').trim(),
          incharge: String(row["Office Incharge Name"] || '').trim(),
          incharge_mobile: String(row["Office Incharge Contactno"] || '').trim()
        };
      }).filter(Boolean);

      if (formattedSchools.length === 0) {
        throw new Error("Could not find required 'Code' and 'Institution English' columns.");
      }

      if (window.confirm(`Found ${formattedSchools.length} schools. Overwrite existing schools list?`)) {
        onUpdateInstitutions(formattedSchools);
        triggerFeedback('success', `Successfully imported ${formattedSchools.length} schools!`);
      }
    } catch (err) {
      console.error(err);
      triggerFeedback('danger', "Error importing schools: " + err.message);
    } finally {
      setIsUploadingSchools(false);
      e.target.value = null;
    }
  };

  // Import new student registrations list
  const handleImportRegistrations = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingRegs(true);
    try {
      const parsedData = await parseExcelFile(file);
      if (parsedData.length === 0) {
        throw new Error("Parsed file is empty.");
      }

      // Convert rows to registration structures with case-insensitive header matching and index fallback
      const newPlaceholderSchools = [];

      const formattedRegs = parsedData.map(row => {
        const getField = (possibleHeaders, colIndex) => {
          // 1. Try finding by matching possible headers case-insensitively
          const headerKey = Object.keys(row).find(k => 
            !k.startsWith('__col_') && 
            possibleHeaders.some(ph => k.toLowerCase().replace(/[^a-z0-9]/g, '') === ph.toLowerCase().replace(/[^a-z0-9]/g, ''))
          );
          if (headerKey) return String(row[headerKey]).trim();
          
          // 2. Fall back to index key
          const indexKey = `__col_${colIndex}`;
          return row[indexKey] !== undefined ? String(row[indexKey]).trim() : '';
        };

        const schoolName = getField(['Institution', 'InstitutionName', 'College', 'CollegeName', 'School', 'SchoolName'], 0);
        const district = getField(['District', 'ManagementDistrict'], 1);
        const uid = getField(['Student UID', 'StudentUID', 'UID', 'StudentId', 'ID'], 2);
        const name = getField(['Student Name', 'StudentName', 'Name', 'CandidateName'], 3);
        const klass = getField(['Class', 'Klass', 'Year', 'Grade'], 4);
        const subject = cleanSubjectName(getField(['Subject', 'SubjectName', 'Subjects', 'Exam'], 5));
        const payment = getField(['Payment'], 6) || 'PAID';

        if (!uid || !subject) return null;

        // Try matching in loaded institutions or newly created placeholders in this batch
        const combinedSchoolsList = [...institutions, ...newPlaceholderSchools];
        let matchedInst = findMatchedInstitution(schoolName, combinedSchoolsList);

        if (!matchedInst && schoolName) {
          // Auto-create a placeholder institution for unmatched school
          const generatedCode = generateSchoolCode(schoolName, combinedSchoolsList);
          matchedInst = {
            code: generatedCode,
            name: schoolName,
            place: district || 'UNKNOWN',
            zone: 'UNASSIGNED',
            district: district || 'UNKNOWN',
            isExamCenter: false,
            assignedToCenter: '',
            email: '', phone1: '', phone2: '', principal: '', principal_mobile: '', incharge: '', incharge_mobile: ''
          };
          newPlaceholderSchools.push(matchedInst);
        }

        return {
          uid,
          name,
          class: klass,
          subject,
          school_code: matchedInst ? matchedInst.code : 'UNKNOWN',
          school_name: matchedInst ? matchedInst.name : schoolName,
          district: matchedInst ? matchedInst.district : district,
          zone: matchedInst ? matchedInst.zone : 'UNASSIGNED',
          payment,
          source: 'MANUAL_IMPORT'
        };
      }).filter(Boolean);

      if (formattedRegs.length === 0) {
        throw new Error("Could not find 'Student UID' and 'Subject' columns in sheet.");
      }

      if (window.confirm(`Found ${formattedRegs.length} student registrations. Overwrite existing student list?`)) {
        if (newPlaceholderSchools.length > 0) {
          onUpdateInstitutions([...institutions, ...newPlaceholderSchools]);
        }
        onUpdateRegistrations(formattedRegs);
        triggerFeedback('success', `Successfully imported ${formattedRegs.length} registrations! ${newPlaceholderSchools.length > 0 ? `Added ${newPlaceholderSchools.length} unmatched schools to institutions.` : ''}`);
      }
    } catch (err) {
      console.error(err);
      triggerFeedback('danger', "Error importing registrations: " + err.message);
    } finally {
      setIsUploadingRegs(false);
      e.target.value = null;
    }
  };

  // Export current database to a single JSON backup file
  const handleExportBackup = () => {
    const backupData = {
      institutions,
      registrations,
      timeTable,
      previousStudents,
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cswc_exam_system_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerFeedback('success', 'System backup file downloaded!');
  };

  // Reset database state to the original seed_data.json
  const handleResetToSeed = () => {
    if (window.confirm("WARNING: This will reset all designations, custom exam center mappings, added timetable schedules, and uploaded candidates back to the default factory state. Do you want to continue?")) {
      onResetData();
      triggerFeedback('success', 'System database reset to initial values!');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {feedback.message && (
        <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid', backgroundColor: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', fontSize: '14px' }}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Uploads Panel */}
        <div className="card">
          <div className="card-title">
            <h3>Import Data</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Import Institutions */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '15px' }}>Import Master Colleges List</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overwrites the colleges list. Expects: Code, Institution English, Place, Zone, Management District.</p>
              </div>
              <input
                type="file"
                id="upload-schools-input"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleImportSchools}
              />
              <label htmlFor="upload-schools-input" className="btn btn-secondary" style={{ cursor: 'pointer', alignSelf: 'flex-start' }}>
                <Upload size={14} /> {isUploadingSchools ? 'Processing...' : 'Upload School Excel'}
              </label>
            </div>

            {/* Import Registrations */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h4 style={{ fontSize: '15px' }}>Import Student Registrations</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overwrites student exam lists. Expects: Student UID, Student Name, Class, Subject, Institution, District.</p>
              </div>
              <input
                type="file"
                id="upload-regs-input"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleImportRegistrations}
              />
              <label htmlFor="upload-regs-input" className="btn btn-secondary" style={{ cursor: 'pointer', alignSelf: 'flex-start' }}>
                <Upload size={14} /> {isUploadingRegs ? 'Processing...' : 'Upload Registrations Excel'}
              </label>
            </div>

          </div>
        </div>

        {/* Backups Panel */}
        <div className="card" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="card-title">
              <h3>System Actions & Backup</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Export all system configurations (including designated exam centers, custom school allocations, added timetable exam dates, and student records) to a backup file, or reset the app back to the initial seeding files.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button className="btn btn-primary" onClick={handleExportBackup} style={{ width: '100%' }}>
              <Download size={16} /> Download System Config Backup (.json)
            </button>

            <div style={{ borderTop: '1px solid var(--border-color)', padding: '14px 0', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '14px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> Danger Zone
              </h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleResetToSeed} 
                  style={{ flexGrow: 1, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  type="button"
                >
                  <RefreshCw size={14} /> Reset to Seed Data
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleClearAll} 
                  style={{ flexGrow: 1 }}
                  type="button"
                >
                  <Trash2 size={14} /> Clear All Data (Start Fresh)
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DataImport;
