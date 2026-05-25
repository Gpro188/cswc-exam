import React from 'react';
import { School, Users, FileText, CheckSquare, MapPin } from 'lucide-react';

const Dashboard = ({ institutions, registrations, previousStudents }) => {
  const totalSchools = institutions.length;
  
  // Unique students count
  const uniqueStudents = new Set(registrations.map(r => r.uid)).size;
  const totalSubjectsRegistered = registrations.length;
  
  // Designated exam centers
  const examCenters = institutions.filter(i => i.isExamCenter);
  const totalCenters = examCenters.length;
  
  // Total previous SAY students
  const totalPrevStudents = previousStudents.length;

  // Breakdown by Zone
  const zoneStats = {};
  institutions.forEach(inst => {
    const zone = inst.zone || 'UNASSIGNED';
    if (!zoneStats[zone]) {
      zoneStats[zone] = { schools: 0, students: 0, centers: 0 };
    }
    zoneStats[zone].schools += 1;
    if (inst.isExamCenter) {
      zoneStats[zone].centers += 1;
    }
  });

  registrations.forEach(reg => {
    const zone = reg.zone || 'UNASSIGNED';
    if (!zoneStats[zone]) {
      zoneStats[zone] = { schools: 0, students: 0, centers: 0 };
    }
    // Since registrations are subject-level, we count students by unique UID per zone
  });

  // Calculate unique students per zone
  const zoneStudents = {};
  registrations.forEach(reg => {
    const zone = reg.zone || 'UNASSIGNED';
    if (!zoneStudents[zone]) {
      zoneStudents[zone] = new Set();
    }
    zoneStudents[zone].add(reg.uid);
  });
  
  Object.keys(zoneStudents).forEach(zone => {
    if (zoneStats[zone]) {
      zoneStats[zone].students = zoneStudents[zone].size;
    }
  });

  // Class distribution
  const classCounts = {};
  registrations.forEach(reg => {
    const cls = reg.class || 'UNKNOWN';
    classCounts[cls] = (classCounts[cls] || 0) + 1;
  });

  // Subject distribution (top 5)
  const subjectCounts = {};
  registrations.forEach(reg => {
    const sub = reg.subject || 'UNKNOWN';
    subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
  });
  const topSubjects = Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Stat Cards Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <School size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalSchools}</div>
            <div className="stat-label">Total institutions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{uniqueStudents}</div>
            <div className="stat-label">Registered Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalSubjectsRegistered}</div>
            <div className="stat-label">Exam Entries</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <MapPin size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalCenters}</div>
            <div className="stat-label">Designated Centers</div>
          </div>
        </div>
      </div>

      {/* Main grids */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Zone Statistics */}
        <div className="card">
          <div className="card-title">
            <h3>Zone-wise Distribution</h3>
            <span className="badge badge-neutral">Active Zones: {Object.keys(zoneStats).length}</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Total Colleges</th>
                  <th>Designated Centers</th>
                  <th>Total Candidates</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(zoneStats).map(([zone, stat]) => (
                  <tr key={zone}>
                    <td style={{ fontWeight: '700' }}>{zone}</td>
                    <td>{stat.schools}</td>
                    <td>
                      <span className={`badge ${stat.centers > 0 ? 'badge-success' : 'badge-warning'}`}>
                        {stat.centers} {stat.centers === 1 ? 'Center' : 'Centers'}
                      </span>
                    </td>
                    <td><strong>{stat.students}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Subjects & Classes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <div className="card-title">
              <h3>Top 5 Subjects</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topSubjects.map(([sub, count], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dir="rtl">
                    {sub}
                  </span>
                  <span className="badge badge-neutral">{count} papers</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <h3>Previous SAY Candidates</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
                <CheckSquare size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '20px', fontWeight: '800' }}>{totalPrevStudents}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Additional candidates loaded</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Class distribution card */}
      <div className="card">
        <div className="card-title">
          <h3>Candidate Entries by Class</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {Object.entries(classCounts).map(([cls, count]) => (
            <div key={cls} style={{ flexGrow: 1, minWidth: '150px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--bg-card)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{cls}</span>
              <strong style={{ fontSize: '18px', color: 'var(--primary)' }}>{count} entries</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
