import React, { useState } from 'react';
import {
  Ticket, Users, CheckCircle, Stethoscope,
  Activity, Search, HeartPulse, X
} from 'lucide-react';
import PostConsultationActions from './PostConsultationActions';
import ClinicalOrdersPanel from './ClinicalOrdersPanel';

export default function OpdModule({
  opQueue,
  setOpQueue,
  tokenCounter,
  setTokenCounter,
  opQueueSubTab,
  setOpQueueSubTab,
  selectedConsultToken,
  setSelectedConsultToken,
  consultChiefComplaint,
  setConsultChiefComplaint,
  consultDiagnosis,
  setConsultDiagnosis,
  consultNotes,
  setConsultNotes,
  consultOrderedServices,
  setConsultOrderedServices,
  consultPrescription,
  setConsultPrescription,
  addNotification,
  handlePostCharge,
  setLabOrders,
  setRadiologyOrders,
  setPharmacyOrders,
  setNursingOrders,
  setIpAdmissions,
  setActiveTab
}) {
  const [showActionSelector, setShowActionSelector] = useState(false);

  // ─── Start consultation ───
  const handleStartConsultation = (token) => {
    setOpQueue(prev => prev.map(p =>
      p.tokenNo === token.tokenNo ? { ...p, status: 'In Consultation' } : p
    ));
    setSelectedConsultToken(token);
    setOpQueueSubTab('consult');
    addNotification('Consultation Started', `Started consultation for ${token.name} (${token.tokenNo})`, 'info');
    // Reset form fields for new patient
    setConsultChiefComplaint('');
    setConsultDiagnosis('');
    setConsultNotes('');
    setConsultOrderedServices([]);
    setConsultPrescription('');
  };

  // ─── Complete consultation → open PostConsultationActions modal ───
  const handleCompleteConsultation = (e) => {
    e.preventDefault();
    if (!selectedConsultToken) return;
    setShowActionSelector(true);
  };

  // ─── Save actions from modal, update queue status ───
  const handleSaveActions = (actions) => {
    setOpQueue(prev => prev.map(p =>
      p.tokenNo === selectedConsultToken.tokenNo ? { ...p, status: 'Action Pending' } : p
    ));
    handlePostCharge(
      selectedConsultToken.uhid,
      `OPD Consultation - Dr. ${selectedConsultToken.doctor}`,
      600,
      'OPD_Consult'
    );
    const actionNames = actions.map(a => a.option).join(', ');
    addNotification(
      'Consultation Finished',
      `Consultation completed for ${selectedConsultToken.name}. Actions: ${actionNames}.`,
      'success'
    );
    // Reset
    setSelectedConsultToken(null);
    setConsultChiefComplaint('');
    setConsultDiagnosis('');
    setConsultNotes('');
    setConsultOrderedServices([]);
    setConsultPrescription('');
    setOpQueueSubTab('queue');
    setShowActionSelector(false);
  };

  // ─────────────────────────────────────────────
  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ═══ SUB NAV ═══ */}
      <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
        <button
          type="button"
          onClick={() => setOpQueueSubTab('queue')}
          className={`btn ${opQueueSubTab === 'queue' ? 'btn-cyan' : 'btn-glass'}`}
          style={{ flex: 1, fontWeight: '700', fontSize: '0.85rem', gap: '8px' }}
        >
          <Ticket size={16} /> Live OP Queue
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedConsultToken) setOpQueueSubTab('consult');
            else addNotification('No Active Token', 'Please select a waiting patient from the queue first.', 'warning');
          }}
          className={`btn ${opQueueSubTab === 'consult' ? 'btn-emerald' : 'btn-glass'}`}
          style={{ flex: 1, fontWeight: '700', fontSize: '0.85rem', gap: '8px', opacity: selectedConsultToken ? 1 : 0.5 }}
        >
          <Stethoscope size={16} /> Doctor's EMR Window
        </button>
      </div>

      {/* ═══ QUEUE VIEW ═══ */}
      {opQueueSubTab === 'queue' && (
        <div className="animate-slide-up">
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users /> Waiting Room Board
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Select "Call Next" to begin a clinical assessment.
                </p>
              </div>
              <div className="badge badge-glass" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Today's Total: <strong>{opQueue.length} Visits</strong>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <th style={{ padding: '12px 8px' }}>TOKEN NO</th>
                    <th style={{ padding: '12px 8px' }}>PATIENT DETAILS</th>
                    <th style={{ padding: '12px 8px' }}>CONSULTANT</th>
                    <th style={{ padding: '12px 8px' }}>STATUS</th>
                    <th style={{ padding: '12px 8px' }}>TIME</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {opQueue.map(item => (
                    <tr key={item.tokenNo} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '14px 8px' }}>
                        <span className="badge badge-glass" style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                          {item.tokenNo}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: '700' }}>{item.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {item.uhid} • {item.gender}, {item.age}y
                          {item.isFollowUp && <span style={{ color: 'var(--accent-amber)', marginLeft: '8px' }}>↺ Follow-Up</span>}
                        </div>
                      </td>
                      <td style={{ padding: '14px 8px', fontWeight: '600' }}>{item.doctor}</td>
                      <td style={{ padding: '14px 8px' }}>
                        <span className={`badge ${
                          item.status === 'Completed'      ? 'badge-glass' :
                          item.status === 'Action Pending' ? 'badge-amber' :
                          item.status === 'In Consultation'? 'badge-emerald animate-pulse' :
                          'badge-amber'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.time}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                        {item.status === 'Waiting' && (
                          <button
                            type="button"
                            onClick={() => handleStartConsultation(item)}
                            className="btn btn-cyan"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700' }}
                          >
                            Call Next
                          </button>
                        )}
                        {item.status === 'In Consultation' && (
                          <button
                            type="button"
                            onClick={() => { setSelectedConsultToken(item); setOpQueueSubTab('consult'); }}
                            className="btn btn-emerald"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700' }}
                          >
                            Resume EMR
                          </button>
                        )}
                        {item.status === 'Completed' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: '700' }}>✓ Visited</span>
                        )}
                        {item.status === 'Action Pending' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: '700' }}>⏳ Action Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EMR CONSULTATION VIEW ═══ */}
      {opQueueSubTab === 'consult' && selectedConsultToken && (
        <div className="animate-slide-up">
          <form style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>

            {/* ─── LEFT: CLINICAL DOCUMENTATION ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '1 1 500px', minWidth: 0 }}>

              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent-cyan)' }}>
                {/* Patient Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>{selectedConsultToken.name}</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                      {selectedConsultToken.uhid} • {selectedConsultToken.gender}, {selectedConsultToken.age} Years • Dr. {selectedConsultToken.doctor}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-emerald" style={{ padding: '8px 16px', fontSize: '0.9rem', fontWeight: '900' }}>
                      TOKEN: {selectedConsultToken.tokenNo}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Vitals */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {[
                      { label: 'BP (mmHg)', placeholder: '120/80', icon: <Activity size={12}/> },
                      { label: 'Pulse (bpm)', placeholder: '78',    icon: <HeartPulse size={12}/> },
                      { label: 'SpO2 (%)',   placeholder: '98%',    icon: null },
                      { label: 'Temp (°F)',  placeholder: '98.6',   icon: null }
                    ].map(v => (
                      <div key={v.label} style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {v.icon}{v.label}
                        </span>
                        <input type="text" placeholder={v.placeholder} className="form-control"
                          style={{ background: 'transparent', border: 'none', padding: '4px 0', fontSize: '1rem', fontWeight: '700' }} />
                      </div>
                    ))}
                  </div>

                  {/* Chief Complaints */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>
                      Chief Complaints (HPI)
                    </label>
                    <textarea
                      placeholder="Patient presents with..."
                      className="form-control"
                      style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', padding: '12px' }}
                      value={consultChiefComplaint}
                      onChange={e => setConsultChiefComplaint(e.target.value)}
                    />
                  </div>

                  {/* ICD-10 Diagnosis */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', color: 'var(--accent-amber)' }}>
                      Provisional Diagnosis (ICD-10)
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        placeholder="Search disease or enter ICD-10 code..."
                        className="form-control"
                        style={{ flex: 1, height: '42px', background: 'rgba(0,0,0,0.2)' }}
                        value={consultDiagnosis}
                        onChange={e => setConsultDiagnosis(e.target.value)}
                      />
                      <button type="button" className="btn btn-glass"><Search size={16}/></button>
                    </div>
                  </div>

                  {/* Clinical Notes */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>
                      Clinical Notes &amp; Plan
                    </label>
                    <textarea
                      placeholder="Internal remarks and treatment plan..."
                      className="form-control"
                      style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', padding: '12px' }}
                      value={consultNotes}
                      onChange={e => setConsultNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RIGHT: CLINICAL ACTION ORDERS + DISPOSITION ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '1 1 400px', minWidth: 0 }}>

              {/* ══ CLINICAL ACTION ORDERS (unified ordering panel) ══ */}
              <ClinicalOrdersPanel
                patient={selectedConsultToken}
                addNotification={addNotification}
                handlePostCharge={handlePostCharge}
                setLabOrders={setLabOrders}
                setRadiologyOrders={setRadiologyOrders}
                setPharmacyOrders={setPharmacyOrders}
                setNursingOrders={setNursingOrders}
                setIpAdmissions={setIpAdmissions}
                setOpQueue={setOpQueue}
              />

              {/* ══ DISPOSITION ══ */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'rgba(6,182,212,0.05)', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={handleCompleteConsultation}
                  className="btn btn-cyan"
                  style={{ width: '100%', height: '50px', fontWeight: '800', fontSize: '1rem', gap: '8px' }}
                >
                  <CheckCircle size={18} /> Complete Consult &amp; Discharge
                </button>
              </div>

            </div>
          </form>
        </div>
      )}

      {/* ═══ POST-CONSULTATION ACTION MODAL ═══ */}
      {showActionSelector && selectedConsultToken && (
        <PostConsultationActions
          patient={selectedConsultToken}
          onClose={() => setShowActionSelector(false)}
          onSave={handleSaveActions}
        />
      )}
    </div>
  );
}
