import React, { useState } from 'react';
import { 
  CheckCircle, X, Plus, Activity, Syringe, Pill, 
  Bed, DoorOpen, Save, FileText 
} from 'lucide-react';

const ACTION_CATEGORIES = {
  Diagnostics: {
    icon: <Activity size={18} />,
    color: 'var(--accent-cyan)',
    options: ['Blood Test', 'Urine Test', 'ECG', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound', 'Biopsy']
  },
  Procedures: {
    icon: <Syringe size={18} />,
    color: 'var(--accent-emerald)',
    options: ['Injection', 'IV Cannulation', 'Dressing', 'Nebulization', 'Suturing', 'Catheterization']
  },
  Pharmacy: {
    icon: <Pill size={18} />,
    color: 'var(--accent-purple)',
    options: ['Prescription (auto-route to pharmacy)']
  },
  Observation: {
    icon: <Bed size={18} />,
    color: 'var(--accent-amber)',
    options: ['Keep for Observation', 'Admit to IP']
  },
  Discharge: {
    icon: <DoorOpen size={18} />,
    color: 'var(--accent-rose)',
    options: ['Discharge with prescription', 'Refer to another doctor']
  }
};

export default function PostConsultationActions({ patient, onSave, onClose }) {
  const [selectedActions, setSelectedActions] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Diagnostics');

  const handleToggleAction = (category, option) => {
    const exists = selectedActions.find(a => a.category === category && a.option === option);
    if (exists) {
      setSelectedActions(selectedActions.filter(a => !(a.category === category && a.option === option)));
    } else {
      setSelectedActions([...selectedActions, { id: Date.now() + Math.random(), category, option, note: '' }]);
    }
  };

  const handleUpdateNote = (id, note) => {
    setSelectedActions(selectedActions.map(a => a.id === id ? { ...a, note } : a));
  };

  const handleSave = () => {
    if (onSave) {
      // In a real app, this would hit an API/Supabase. 
      // We pass it to the parent to update the queue status to 'Action Pending'
      // and alert the receptionist.
      onSave(selectedActions);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-slide-up" style={{
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={24} style={{ color: 'var(--accent-blue)' }}/>
              Post-Consultation Actions
            </h2>
            <p className="mediq-subtitle">
              Patient: <span style={{ color: 'var(--accent-blue)' }}>{patient?.name || 'Unknown'} ({patient?.uhid || patient?.id || 'No ID'})</span>
            </p>
          </div>
          <button onClick={onClose} className="btn btn-glass" style={{ padding: '8px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' }}>
          
          {/* Left Panel: Categories & Options */}
          <div style={{ 
            flex: '1 1 300px', 
            borderRight: '1px solid var(--border-color)', 
            display: 'flex', 
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            {/* Category Tabs */}
            <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', padding: '12px 12px 0 12px' }}>
              {Object.entries(ACTION_CATEGORIES).map(([cat, details]) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeCategory === cat ? `2px solid ${details.color}` : '2px solid transparent',
                    color: activeCategory === cat ? details.color : 'var(--text-secondary)',
                    fontWeight: activeCategory === cat ? '700' : '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {details.icon}
                  {cat}
                </button>
              ))}
            </div>

            {/* Options List for Active Category */}
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
              {ACTION_CATEGORIES[activeCategory].options.map(option => {
                const isSelected = selectedActions.find(a => a.category === activeCategory && a.option === option);
                const color = ACTION_CATEGORIES[activeCategory].color;
                return (
                  <div
                    key={option}
                    onClick={() => handleToggleAction(activeCategory, option)}
                    style={{
                      border: `1px solid ${isSelected ? color : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? `${color}15` : 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      gap: '8px',
                      minHeight: '80px',
                      transition: 'var(--transition-fast)',
                      position: 'relative'
                    }}
                  >
                    {isSelected && (
                      <CheckCircle size={16} style={{ color, position: 'absolute', top: '8px', right: '8px' }} />
                    )}
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: isSelected ? '600' : '500', 
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Actions & Notes */}
          <div style={{ 
            flex: '1 1 350px', 
            backgroundColor: 'var(--bg-primary)', 
            display: 'flex', 
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Selected Actions 
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {selectedActions.length}
                </span>
              </h3>
            </div>

            <div style={{ padding: '16px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedActions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                  <Plus size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.9rem' }}>Select actions from the left panel.</p>
                </div>
              ) : (
                selectedActions.map(action => {
                  const catDetails = ACTION_CATEGORIES[action.category];
                  return (
                    <div key={action.id} style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ color: catDetails.color }}>{catDetails.icon}</div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', display: 'block' }}>
                              {action.category}
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {action.option}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleToggleAction(action.category, action.option)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      {/* Doctor Note */}
                      <div>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Add short note (e.g. Stat, Fasting required, etc.)"
                          value={action.note}
                          onChange={(e) => handleUpdateNote(action.id, e.target.value)}
                          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Action Footer */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <button 
                onClick={handleSave}
                disabled={selectedActions.length === 0}
                className="btn btn-cyan" 
                style={{ width: '100%', height: '48px', fontSize: '1rem', justifyContent: 'center' }}
              >
                <Save size={18} />
                Save & Update Status
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                Patient status will be updated to "Action Pending"
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
