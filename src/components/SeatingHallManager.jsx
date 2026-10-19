import React, { useState } from 'react';
import { Building2, Plus, Trash2, Edit3, Check, X, Layers, Users } from 'lucide-react';

export default function SeatingHallManager({
  halls = [],
  onAddHall,
  onUpdateHall,
  onDeleteHall
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHallId, setEditingHallId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    totalBenches: 20,
    studentsPerBench: 2,
    rows: 5,
    columns: 4
  });

  const resetForm = () => {
    setFormData({
      name: '',
      totalBenches: 20,
      studentsPerBench: 2,
      rows: 5,
      columns: 4
    });
    setEditingHallId(null);
    setShowAddModal(false);
  };

  const handleOpenAdd = () => {
    setFormData({
      name: `Hall ${halls.length + 1}`,
      totalBenches: 24,
      studentsPerBench: 2,
      rows: 6,
      columns: 4
    });
    setEditingHallId(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (hall) => {
    setEditingHallId(hall.id);
    setFormData({
      name: hall.name,
      totalBenches: hall.totalBenches,
      studentsPerBench: hall.studentsPerBench || 2,
      rows: hall.rows || Math.ceil(hall.totalBenches / (hall.columns || 4)),
      columns: hall.columns || 4
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Hall name is required.');
      return;
    }
    const benches = Math.max(1, parseInt(formData.totalBenches, 10) || 1);
    const capacityPerBench = Math.max(1, parseInt(formData.studentsPerBench, 10) || 1);
    const columns = Math.max(1, parseInt(formData.columns, 10) || 1);
    const rows = Math.max(1, Math.ceil(benches / columns));

    if (editingHallId) {
      onUpdateHall({
        id: editingHallId,
        name: formData.name.trim(),
        totalBenches: benches,
        studentsPerBench: capacityPerBench,
        rows,
        columns,
        totalCapacity: benches * capacityPerBench
      });
    } else {
      onAddHall({
        id: `hall_${Date.now()}`,
        name: formData.name.trim(),
        totalBenches: benches,
        studentsPerBench: capacityPerBench,
        rows,
        columns,
        totalCapacity: benches * capacityPerBench
      });
    }
    resetForm();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="var(--primary)" />
            Examination Halls & Bench Configuration
          </h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Configure exam halls, specify bench counts, and set how many students sit on each bench.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontWeight: 600, borderRadius: '8px' }}
        >
          <Plus size={18} /> Add New Hall
        </button>
      </div>

      {/* Hall Cards Grid */}
      {halls.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', background: '#fff', borderRadius: '12px' }}>
          <Building2 size={54} style={{ opacity: 0.25, marginBottom: '12px' }} />
          <h4>No Examination Halls Created</h4>
          <p style={{ maxWidth: '400px', margin: '8px auto 16px' }}>
            Add your examination rooms or halls with bench numbers and bench capacity to start allocating seats.
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            + Create First Hall
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {halls.map((hall) => {
            const benchCount = hall.totalBenches;
            const perBench = hall.studentsPerBench || 2;
            const capacity = benchCount * perBench;

            return (
              <div
                key={hall.id}
                className="card"
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px', borderRadius: '8px' }}>
                        <Building2 size={22} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{hall.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Grid: {hall.rows || 5} Rows × {hall.columns || 4} Columns
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleOpenEdit(hall)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                        title="Edit hall details"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${hall.name}"?`)) onDeleteHall(hall.id);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '6px' }}
                        title="Delete hall"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {/* Badges / Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Benches</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{benchCount}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Per Bench</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{perBench}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Capacity</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>{capacity}</div>
                    </div>
                  </div>
                </div>

                {/* Preview Mini Bench layout */}
                <div style={{ marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} />
                  <span>Config: {perBench} {perBench === 1 ? 'student' : 'students'} per bench</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Add / Edit Hall */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {editingHallId ? 'Edit Hall Settings' : 'Create Examination Hall'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  Hall / Room Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Hall 1, Room 102, Science Block"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Total Benches in Hall *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={formData.totalBenches}
                    onChange={(e) => {
                      const b = parseInt(e.target.value, 10) || 1;
                      const c = formData.columns || 4;
                      setFormData({
                        ...formData,
                        totalBenches: b,
                        rows: Math.ceil(b / c)
                      });
                    }}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Students Per Bench *
                  </label>
                  <select
                    value={formData.studentsPerBench}
                    onChange={(e) => setFormData({ ...formData, studentsPerBench: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  >
                    <option value={1}>1 Student (Single Desk)</option>
                    <option value={2}>2 Students (Left & Right)</option>
                    <option value={3}>3 Students (Left, Middle, Right)</option>
                    <option value={4}>4 Students (Wide Bench)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Columns of Benches
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.columns}
                    onChange={(e) => {
                      const c = parseInt(e.target.value, 10) || 1;
                      setFormData({
                        ...formData,
                        columns: c,
                        rows: Math.ceil(formData.totalBenches / c)
                      });
                    }}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    Total Capacity
                  </label>
                  <div style={{ padding: '10px 12px', background: '#f1f5f9', borderRadius: '8px', fontWeight: 700, color: 'var(--primary)' }}>
                    {(parseInt(formData.totalBenches, 10) || 0) * (parseInt(formData.studentsPerBench, 10) || 1)} Seats
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} /> {editingHallId ? 'Save Changes' : 'Create Hall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
