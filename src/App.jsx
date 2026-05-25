import { useState, useEffect } from 'react';
import seedData from './data/seed_data.json';
import './App.css';
import { cleanSubjectName } from './utils/matching';

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
  School
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [institutions, setInstitutions] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [previousStudents, setPreviousStudents] = useState([]);
  const [timeTable, setTimeTable] = useState([]);

  // Load initial state from LocalStorage or seedData
  useEffect(() => {
    const savedInstitutions = localStorage.getItem('cswc_institutions');
    const savedRegistrations = localStorage.getItem('cswc_registrations');
    const savedPreviousStudents = localStorage.getItem('cswc_previous_students');
    const savedTimeTable = localStorage.getItem('cswc_timetable');

    if (savedInstitutions) {
      setInstitutions(JSON.parse(savedInstitutions));
    } else {
      setInstitutions(seedData.institutions);
      localStorage.setItem('cswc_institutions', JSON.stringify(seedData.institutions));
    }

    if (savedRegistrations) {
      setRegistrations(JSON.parse(savedRegistrations));
    } else {
      setRegistrations(seedData.registrations);
      localStorage.setItem('cswc_registrations', JSON.stringify(seedData.registrations));
    }

    if (savedPreviousStudents) {
      setPreviousStudents(JSON.parse(savedPreviousStudents));
    } else {
      setPreviousStudents(seedData.previous_say_students || []);
      localStorage.setItem('cswc_previous_students', JSON.stringify(seedData.previous_say_students || []));
    }

    if (savedTimeTable) {
      setTimeTable(JSON.parse(savedTimeTable));
    } else {
      setTimeTable([]);
      localStorage.setItem('cswc_timetable', JSON.stringify([]));
    }
  }, []);

  // Auto-heal database: recreate missing placeholder institutions and clean subject names
  useEffect(() => {
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
        const cleanedSubs = slot.subjects.map(s => cleanSubjectName(s));
        if (JSON.stringify(slot.subjects) !== JSON.stringify(cleanedSubs)) {
          timetableUpdated = true;
          updatedSlot = { ...slot, subjects: cleanedSubs };
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
  }, [institutions, registrations, previousStudents, timeTable]);

  // Sync state to local storage when state changes
  const updateInstitutions = (data) => {
    setInstitutions(data);
    localStorage.setItem('cswc_institutions', JSON.stringify(data));
  };

  const updateRegistrations = (data) => {
    setRegistrations(data);
    localStorage.setItem('cswc_registrations', JSON.stringify(data));
  };

  const updatePreviousStudents = (data) => {
    setPreviousStudents(data);
    localStorage.setItem('cswc_previous_students', JSON.stringify(data));
  };

  const updateTimeTable = (data) => {
    setTimeTable(data);
    localStorage.setItem('cswc_timetable', JSON.stringify(data));
  };

  // Manual Add/Delete Handlers
  const handleAddInstitution = (newInst) => {
    const updated = [...institutions, newInst];
    updateInstitutions(updated);
  };

  const handleEditInstitution = (updatedSchool) => {
    // 1. Update institutions
    const nextInsts = institutions.map(i => i.code === updatedSchool.code ? updatedSchool : i);
    updateInstitutions(nextInsts);

    // 2. Sync registrations
    const nextRegs = registrations.map(r => {
      if (r.school_code === updatedSchool.code) {
        return {
          ...r,
          school_name: updatedSchool.name,
          district: updatedSchool.district,
          zone: updatedSchool.zone
        };
      }
      return r;
    });
    updateRegistrations(nextRegs);

    // 3. Sync previous students
    const nextPrev = previousStudents.map(s => {
      if (s.school_code === updatedSchool.code) {
        return {
          ...s,
          college: updatedSchool.name,
          zone: updatedSchool.zone
        };
      }
      return s;
    });
    updatePreviousStudents(nextPrev);
  };

  const handleDeleteInstitution = (code) => {
    if (window.confirm(`Are you sure you want to delete institution ${code}? All its students' registrations will be updated to UNKNOWN school.`)) {
      // Delete the school
      const updatedInsts = institutions.filter(inst => inst.code !== code);
      updateInstitutions(updatedInsts);
      
      // Update registration mappings
      const updatedRegs = registrations.map(reg => {
        if (reg.school_code === code) {
          return { ...reg, school_code: 'UNKNOWN', school_name: 'UNKNOWN', zone: 'UNASSIGNED' };
        }
        return reg;
      });
      updateRegistrations(updatedRegs);
    }
  };

  const handleAddRegistration = (newReg) => {
    // Check if duplicate student-subject registration
    const exists = registrations.some(r => r.uid === newReg.uid && r.subject === newReg.subject);
    if (exists) {
      alert(`Student with UID ${newReg.uid} is already registered for subject "${newReg.subject}".`);
      return false;
    }
    const updated = [...registrations, newReg];
    updateRegistrations(updated);
    return true;
  };

  const handleDeleteRegistration = (uid, subject) => {
    if (window.confirm(`Are you sure you want to delete registration for student ${uid} in subject "${subject}"?`)) {
      const updated = registrations.filter(r => !(r.uid === uid && r.subject === subject));
      updateRegistrations(updated);
    }
  };

  const handleAddPreviousStudent = (newStudent) => {
    const exists = previousStudents.some(s => s.uid === newStudent.uid);
    if (exists) {
      alert(`Student with UID ${newStudent.uid} already exists in previous SAY list.`);
      return false;
    }
    const updated = [...previousStudents, newStudent];
    updatePreviousStudents(updated);
    return true;
  };

  const handleDeletePreviousStudent = (uid) => {
    if (window.confirm(`Are you sure you want to delete student ${uid} from previous SAY list?`)) {
      const updated = previousStudents.filter(s => s.uid !== uid);
      updatePreviousStudents(updated);
    }
  };

  const handleResetData = () => {
    setInstitutions(seedData.institutions);
    setRegistrations(seedData.registrations);
    setPreviousStudents([]);
    setTimeTable([]);
    localStorage.setItem('cswc_institutions', JSON.stringify(seedData.institutions));
    localStorage.setItem('cswc_registrations', JSON.stringify(seedData.registrations));
    localStorage.setItem('cswc_previous_students', JSON.stringify([]));
    localStorage.setItem('cswc_timetable', JSON.stringify([]));
  };

  const handleClearAllData = () => {
    setInstitutions([]);
    setRegistrations([]);
    setPreviousStudents([]);
    setTimeTable([]);
    localStorage.setItem('cswc_institutions', JSON.stringify([]));
    localStorage.setItem('cswc_registrations', JSON.stringify([]));
    localStorage.setItem('cswc_previous_students', JSON.stringify([]));
    localStorage.setItem('cswc_timetable', JSON.stringify([]));
  };

  // Switch views
  const renderActiveView = () => {
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

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar no-print">
        <div className="sidebar-logo">
          <div className="logo-icon">CS</div>
          <div className="logo-text">
            <h1>CSWC PANEL</h1>
            <p>Exam Center System</p>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={18} /> Dashboard
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'allocation' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('allocation')}>
              <MapPin size={18} /> Center Mapping
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'registrations' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('registrations')}>
              <Users size={18} /> Registrations
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'timetable' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('timetable')}>
              <Calendar size={18} /> Time Table
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'previous' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('previous')}>
              <CheckSquare size={18} /> Previous SAY
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'reports' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('reports')}>
              <Printer size={18} /> Reports & Print
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'import' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('import')}>
              <Settings size={18} /> Settings & Import
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          CSWC Examination Panel v1.0.0
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="app-content">
        <header className="content-header no-print">
          <div className="header-title">
            <h2>{getViewTitle()}</h2>
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
