import { useState, useEffect } from 'react';
import seedData from './data/seed_data.json';
import './App.css';
import { cleanSubjectName } from './utils/matching';

// Firebase
import { onSnapshot } from "firebase/firestore";
import { collections, setDocument, deleteDocument, clearCollection, syncBatchToCollection } from "./services/db";

// Components
import Dashboard from './components/Dashboard';
import CenterAllocation from './components/CenterAllocation';
import StudentRegistrations from './components/StudentRegistrations';
import TimeTable from './components/TimeTable';
import PreviousSayStudents from './components/PreviousSayStudents';
import Reports from './components/Reports';
import DataImport from './components/DataImport';

// Icons
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Calendar, 
  CheckSquare, 
  Printer, 
  Settings, 
  FileText,
  School,
  Loader,
  Menu,
  X
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [previousStudents, setPreviousStudents] = useState([]);
  const [timeTable, setTimeTable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load state from Firestore
  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 4) setLoading(false);
    };

    const unsubInstitutions = onSnapshot(collections.institutions, (snapshot) => {
      setInstitutions(snapshot.docs.map(doc => ({...doc.data(), id: doc.id})));
      checkLoaded();
    });
    const unsubRegistrations = onSnapshot(collections.registrations, (snapshot) => {
      setRegistrations(snapshot.docs.map(doc => ({...doc.data(), id: doc.id})));
      checkLoaded();
    });
    const unsubPreviousStudents = onSnapshot(collections.previousStudents, (snapshot) => {
      setPreviousStudents(snapshot.docs.map(doc => ({...doc.data(), id: doc.id})));
      checkLoaded();
    });
    const unsubTimeTable = onSnapshot(collections.timeTable, (snapshot) => {
      setTimeTable(snapshot.docs.map(doc => ({...doc.data(), id: doc.id})));
      checkLoaded();
    });

    return () => {
      unsubInstitutions();
      unsubRegistrations();
      unsubPreviousStudents();
      unsubTimeTable();
    };
  }, []);

  // Sync state helpers for mass operations
  const updateInstitutions = async (data) => {
    await syncBatchToCollection("institutions", data.map(d => ({...d, id: d.code})), "id");
  };

  const updateRegistrations = async (data) => {
    await syncBatchToCollection("registrations", data.map(d => ({...d, id: d.id || `${d.uid}_${d.subject}`})), "id");
  };

  const updatePreviousStudents = async (data) => {
    await syncBatchToCollection("previousStudents", data.map(d => ({...d, id: d.id || d.uid})), "id");
  };

  const updateTimeTable = async (data) => {
    await syncBatchToCollection("timeTable", data.map((d, i) => ({...d, id: d.id || `slot_${i}`})), "id");
  };

  // Auto-heal database: recreate missing placeholder institutions and clean subject names
  useEffect(() => {
    if (loading) return; // Wait until Firebase has loaded
    if (institutions.length === 0 && registrations.length === 0) return;

    const existingCodes = new Set(institutions.map(i => i.code.toUpperCase()));
    const missingPlaceholderSchools = [];
    const usedCodes = new Set(institutions.map(i => i.code.toUpperCase()));

    let regsUpdated = false;
    const nextRegs = registrations.map(reg => {
      const cleanedSub = cleanSubjectName(reg.subject);
      let updatedReg = reg;
      if (reg.subject !== cleanedSub) {
        regsUpdated = true;
        updatedReg = { ...reg, subject: cleanedSub };
      }

      if (!updatedReg.school_code || updatedReg.school_code === 'UNKNOWN') return updatedReg;
      const codeUpper = updatedReg.school_code.toUpperCase();
      
      if (!existingCodes.has(codeUpper)) {
        let placeholder = missingPlaceholderSchools.find(p => p.code.toUpperCase() === codeUpper);
        if (!placeholder) {
          placeholder = {
            code: updatedReg.school_code,
            name: updatedReg.school_name || `Placeholder (${updatedReg.school_code})`,
            place: updatedReg.district || 'UNKNOWN',
            zone: 'UNASSIGNED',
            district: updatedReg.district || 'UNKNOWN',
            isExamCenter: false,
            assignedToCenter: '',
            email: '', phone1: '', phone2: '', principal: '', principal_mobile: '', incharge: '', incharge_mobile: ''
          };
          missingPlaceholderSchools.push(placeholder);
          usedCodes.add(codeUpper);
        }
      }
      return updatedReg;
    });

    let prevUpdated = false;
    const nextPrev = previousStudents.map(student => {
      let updatedStudent = student;
      if (student.subjects && Array.isArray(student.subjects)) {
        const cleanedSubs = student.subjects.map(s => cleanSubjectName(s));
        if (JSON.stringify(student.subjects) !== JSON.stringify(cleanedSubs)) {
          prevUpdated = true;
          updatedStudent = { ...student, subjects: cleanedSubs };
        }
      } else if (student.subject) {
        const cleanedSub = cleanSubjectName(student.subject);
        if (student.subject !== cleanedSub) {
          prevUpdated = true;
          updatedStudent = { ...student, subject: cleanedSub };
        }
      }

      if (!updatedStudent.school_code || updatedStudent.school_code === 'UNKNOWN') return updatedStudent;
      const codeUpper = updatedStudent.school_code.toUpperCase();
      
      if (!existingCodes.has(codeUpper)) {
        let placeholder = missingPlaceholderSchools.find(p => p.code.toUpperCase() === codeUpper);
        if (!placeholder) {
          placeholder = {
            code: updatedStudent.school_code,
            name: updatedStudent.college || `Placeholder (${updatedStudent.school_code})`,
            place: 'UNKNOWN',
            zone: 'UNASSIGNED',
            district: 'UNKNOWN',
            isExamCenter: false,
            assignedToCenter: '',
            email: '', phone1: '', phone2: '', principal: '', principal_mobile: '', incharge: '', incharge_mobile: ''
          };
          missingPlaceholderSchools.push(placeholder);
          usedCodes.add(codeUpper);
        }
      }
      return updatedStudent;
    });

    let timetableUpdated = false;
    const nextTimeTable = timeTable.map(slot => {
      let updatedSlot = slot;
      if (slot.subjects && Array.isArray(slot.subjects)) {
        const migratedSubs = [];
        let didMigrate = false;
        
        slot.subjects.forEach(s => {
          if (s.includes('||')) {
            migratedSubs.push(s);
          } else {
            didMigrate = true;
            const cleaned = cleanSubjectName(s);
            const classesWithSub = [...new Set(registrations.filter(r => cleanSubjectName(r.subject) === cleaned).map(r => r.class))];
            if (classesWithSub.length > 0) {
              classesWithSub.forEach(c => migratedSubs.push(`${c}||${cleaned}`));
            } else {
              migratedSubs.push(`UNKNOWN||${cleaned}`);
            }
          }
        });

        if (didMigrate || JSON.stringify(slot.subjects) !== JSON.stringify(migratedSubs)) {
          timetableUpdated = true;
          updatedSlot = { ...slot, subjects: [...new Set(migratedSubs)] };
        }
      }
      return updatedSlot;
    });

    if (missingPlaceholderSchools.length > 0) {
      console.log(`Auto-healing: Recreated ${missingPlaceholderSchools.length} missing placeholder colleges.`, missingPlaceholderSchools);
      const updated = [...institutions, ...missingPlaceholderSchools];
      updateInstitutions(updated);
    }

    if (regsUpdated) {
      console.log('Auto-healing: Normalized subject names in registrations.');
      updateRegistrations(nextRegs);
    }

    if (prevUpdated) {
      console.log('Auto-healing: Normalized subject names in previous SAY students.');
      updatePreviousStudents(nextPrev);
    }

    if (timetableUpdated) {
      console.log('Auto-healing: Normalized subject names in timetable.');
      updateTimeTable(nextTimeTable);
    }
  }, [institutions, registrations, previousStudents, timeTable, loading]);

  // Manual Add/Delete Handlers
  const handleAddInstitution = async (newInst) => {
    await setDocument("institutions", newInst.code, newInst);
  };

  const handleEditInstitution = async (updatedSchool) => {
    await setDocument("institutions", updatedSchool.code, updatedSchool);

    // Sync registrations
    const updatedRegs = registrations.filter(r => r.school_code === updatedSchool.code).map(r => ({
      ...r,
      school_name: updatedSchool.name,
      district: updatedSchool.district,
      zone: updatedSchool.zone
    }));
    if (updatedRegs.length > 0) await updateRegistrations(updatedRegs);

    // Sync previous students
    const updatedPrev = previousStudents.filter(s => s.school_code === updatedSchool.code).map(s => ({
      ...s,
      college: updatedSchool.name,
      zone: updatedSchool.zone
    }));
    if (updatedPrev.length > 0) await updatePreviousStudents(updatedPrev);
  };

  const handleDeleteInstitution = async (code) => {
    if (window.confirm(`Are you sure you want to delete institution ${code}? All its students' registrations will be updated to UNKNOWN school.`)) {
      await deleteDocument("institutions", code);
      
      const updatedRegs = registrations.filter(reg => reg.school_code === code).map(reg => ({
        ...reg, school_code: 'UNKNOWN', school_name: 'UNKNOWN', zone: 'UNASSIGNED'
      }));
      if (updatedRegs.length > 0) await updateRegistrations(updatedRegs);
    }
  };

  const handleAddRegistration = async (newReg) => {
    const exists = registrations.some(r => r.uid === newReg.uid && r.subject === newReg.subject);
    if (exists) {
      alert(`Student with UID ${newReg.uid} is already registered for subject "${newReg.subject}".`);
      return false;
    }
    await setDocument("registrations", `${newReg.uid}_${newReg.subject}`, newReg);
    return true;
  };

  const handleDeleteRegistration = async (uid, subject) => {
    if (window.confirm(`Are you sure you want to delete registration for student ${uid} in subject "${subject}"?`)) {
      await deleteDocument("registrations", `${uid}_${subject}`);
    }
  };

  const handleAddPreviousStudent = async (newStudent) => {
    const exists = previousStudents.some(s => s.uid === newStudent.uid);
    if (exists) {
      alert(`Student with UID ${newStudent.uid} already exists in previous SAY list.`);
      return false;
    }
    await setDocument("previousStudents", newStudent.uid, newStudent);
    return true;
  };

  const handleDeletePreviousStudent = async (uid) => {
    if (window.confirm(`Are you sure you want to delete student ${uid} from previous SAY list?`)) {
      await deleteDocument("previousStudents", uid);
    }
  };

  const handleResetData = async () => {
    await clearCollection("institutions", institutions, "id");
    await clearCollection("registrations", registrations, "id");
    await clearCollection("previousStudents", previousStudents, "id");
    await clearCollection("timeTable", timeTable, "id");
    
    await updateInstitutions(seedData.institutions);
    await updateRegistrations(seedData.registrations);
  };

  const handleClearAllData = async () => {
    await clearCollection("institutions", institutions, "id");
    await clearCollection("registrations", registrations, "id");
    await clearCollection("previousStudents", previousStudents, "id");
    await clearCollection("timeTable", timeTable, "id");
  };

  // Switch views
  const renderActiveView = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
          <Loader size={48} className="spin" style={{ marginBottom: '16px', color: 'var(--primary)' }} />
          <h3>Connecting to Firebase...</h3>
          <p>Syncing live database data</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            institutions={institutions} 
            registrations={registrations} 
            previousStudents={previousStudents} 
          />
        );
      case 'allocation':
        return (
          <CenterAllocation 
            institutions={institutions} 
            registrations={registrations} 
            previousStudents={previousStudents}
            onUpdateInstitutions={updateInstitutions} 
            onDeleteInstitution={handleDeleteInstitution}
            onAddInstitution={handleAddInstitution}
            onEditInstitution={handleEditInstitution}
          />
        );
      case 'registrations':
        return (
          <StudentRegistrations 
            registrations={registrations} 
            institutions={institutions} 
            onDeleteRegistration={handleDeleteRegistration}
            onAddRegistration={handleAddRegistration}
          />
        );
      case 'timetable':
        return (
          <TimeTable 
            registrations={registrations}
            timeTable={timeTable}
            onUpdateTimeTable={updateTimeTable}
          />
        );
      case 'previous':
        return (
          <PreviousSayStudents 
            previousStudents={previousStudents}
            institutions={institutions}
            registrations={registrations}
            onUpdatePreviousStudents={updatePreviousStudents}
            onDeletePreviousStudent={handleDeletePreviousStudent}
            onAddPreviousStudent={handleAddPreviousStudent}
            onUpdateInstitutions={updateInstitutions}
          />
        );
      case 'reports':
        return (
          <Reports 
            institutions={institutions}
            registrations={registrations}
            timeTable={timeTable}
            previousStudents={previousStudents}
          />
        );
      case 'import':
        return (
          <DataImport 
            onResetData={handleResetData}
            onClearAllData={handleClearAllData}
            onUpdateInstitutions={updateInstitutions}
            onUpdateRegistrations={updateRegistrations}
            institutions={institutions}
            registrations={registrations}
            timeTable={timeTable}
            previousStudents={previousStudents}
            onAddInstitution={handleAddInstitution}
            onAddRegistration={handleAddRegistration}
            onAddPreviousStudent={handleAddPreviousStudent}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  const getViewTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'allocation': return 'Exam Center Designation & Mapping';
      case 'registrations': return 'Student Registrations';
      case 'timetable': return 'Exam Schedule & Time Table';
      case 'previous': return 'Previous SAY Candidates Uploader';
      case 'reports': return 'Print Office Reports & Center Lists';
      case 'import': return 'Database Import & Settings';
      default: return 'CSWC Exam Panel';
    }
  };

  const getViewSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Summary statistics and active zone allocations';
      case 'allocation': return 'Designate exam centers and map schools to centers zone-wise';
      case 'registrations': return 'Search, filter, and view registered candidates';
      case 'timetable': return 'Assign exam dates and sessions to subjects';
      case 'previous': return 'Upload external previous exam SAY student spreadsheets';
      case 'reports': return 'Export summaries, packing counts, and print attendance registers';
      case 'import': return 'Upload new schools, append student registries, and database backups';
      default: return '';
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`app-sidebar no-print ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">CS</div>
          <div className="logo-text">
            <h1>CSWC PANEL</h1>
            <p>Exam Center System</p>
          </div>
          <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <ul className="sidebar-menu">
          <li className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => handleTabChange('dashboard')}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'allocation' ? 'active' : ''}`}>
            <button onClick={() => handleTabChange('allocation')}>
              <MapPin size={18} /> Center Mapping
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'registrations' ? 'active' : ''}`}>
            <button onClick={() => handleTabChange('registrations')}>
              <Users size={18} /> Registrations
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'timetable' ? 'active' : ''}`}>
            <button onClick={() => handleTabChange('timetable')}>
              <Calendar size={18} /> Time Table
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'previous' ? 'active' : ''}`}>
            <button onClick={() => handleTabChange('previous')}>
              <CheckSquare size={18} /> Previous SAY
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`}>
            <button onClick={() => handleTabChange('reports')}>
              <Printer size={18} /> Reports & Print
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'import' ? 'active' : ''}`}>
            <button onClick={() => handleTabChange('import')}>
              <Settings size={18} /> Settings & Import
            </button>
          </li>
        </ul>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span>CSWC Examination Panel v2.0.0</span>
          {loading ? (
            <span style={{ fontSize: '11px', color: 'var(--warning)' }}>Connecting...</span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--success)' }}>🟢 Live Database Connected</span>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="app-content">
        {isMobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}
        <header className="content-header no-print">
          <div className="header-title">
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu size={24} />
              </button>
              <h2>{getViewTitle()}</h2>
            </div>
            <p>{getViewSubtitle()}</p>
          </div>
        </header>

        {/* Dynamic View rendering */}
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
