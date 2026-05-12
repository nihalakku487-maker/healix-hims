import React from 'react';
import { ShieldCheck, Calendar, Clock, Plus, Users } from 'lucide-react';

export default function OtModule({
  otSchedule,
  setOtSchedule,
  otSubTab,
  setOtSubTab,
  newOtPatient,
  setNewOtPatient,
  newOtSurgery,
  setNewOtSurgery,
  newOtSurgeon,
  setNewOtSurgeon,
  newOtDate,
  setNewOtDate,
  newOtTime,
  setNewOtTime,
  addNotification
}) {

  const handleScheduleSurgery = (e) => {
    e.preventDefault();
    const otId = 'OT-' + Math.floor(100 + Math.random() * 900);
    
    const newProc = {
      otId,
      uhid: 'UHID-' + Math.floor(1000 + Math.random() * 9000),
      name: newOtPatient,
      surgery: newOtSurgery,
      surgeon: newOtSurgeon,
      anaesthetist: 'Dr. Rajan',
      otDate: newOtDate || new Date().toISOString().split('T')[0],
      otTime: newOtTime,
      status: 'Scheduled',
      preOpDone: false,
      consent: true
    };

    setOtSchedule(prev => [...prev, newProc]);
    addNotification("Surgery Scheduled", `Added ${newOtSurgery} for ${newOtPatient} to OT Board.`, "success");
    
    setNewOtPatient('');
    setNewOtSurgery('');
    setOtSubTab('board');
  };

  const togglePreOp = (otId) => {
    setOtSchedule(prev => prev.map(p => p.otId === otId ? { ...p, preOpDone: !p.preOpDone } : p));
    addNotification("Status Updated", "Pre-Op checklist modified", "info");
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', borderRadius: 'var(--radius-md)' }}>
        <button onClick={() => setOtSubTab('board')} className={`btn ${otSubTab === 'board' ? 'btn-cyan' : 'btn-glass'}`} style={{ flex: 1 }}>🖥️ Live OT Board</button>
        <button onClick={() => setOtSubTab('schedule')} className={`btn ${otSubTab === 'schedule' ? 'btn-purple' : 'btn-glass'}`} style={{ flex: 1 }}>📝 Schedule Case</button>
      </div>

      {otSubTab === 'board' && (
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--accent-cyan)' }}>
            <ShieldCheck /> Active OT Daily Theater Schedule
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '0.8rem' }}>
                  <th style={{ padding: '12px' }}>OT ID</th>
                  <th style={{ padding: '12px' }}>PATIENT / UHID</th>
                  <th style={{ padding: '12px' }}>PROCEDURE</th>
                  <th style={{ padding: '12px' }}>SURGEON TEAM</th>
                  <th style={{ padding: '12px' }}>SLOT</th>
                  <th style={{ padding: '12px' }}>PRE-OP</th>
                  <th style={{ padding: '12px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {otSchedule.map(sc => (
                  <tr key={sc.otId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '14px 12px', fontFamily: 'monospace' }}>{sc.otId}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <strong>{sc.name}</strong><br/><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sc.uhid}</span>
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: '700', color: 'var(--accent-purple)' }}>{sc.surgery}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <div>👨‍⚕️ {sc.surgeon}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>💉 {sc.anaesthetist}</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <div className="badge badge-glass" style={{ fontSize: '0.75rem' }}>
                        <Calendar size={10} style={{ marginRight: '4px' }}/> {sc.otDate}
                      </div>
                      <div style={{ marginTop: '4px', fontSize: '0.75rem', fontWeight: '700' }}><Clock size={10} style={{ marginRight: '4px' }}/>{sc.otTime}</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <button 
                        onClick={() => togglePreOp(sc.otId)}
                        className={`badge ${sc.preOpDone ? 'badge-emerald' : 'badge-amber'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {sc.preOpDone ? '✓ READY' : 'PENDING'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className="badge badge-cyan">{sc.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {otSubTab === 'schedule' && (
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent-purple)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>Book Operation Theater Slot</h3>
          <form onSubmit={handleScheduleSurgery} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="form-label">Patient Name</label>
              <input type="text" className="form-control" required value={newOtPatient} onChange={e => setNewOtPatient(e.target.value)} placeholder="Search or Enter Name" />
            </div>
            <div>
              <label className="form-label">Planned Procedure / Surgery</label>
              <input type="text" className="form-control" required value={newOtSurgery} onChange={e => setNewOtSurgery(e.target.value)} placeholder="e.g. Hernioplasty" />
            </div>
            <div>
              <label className="form-label">Primary Surgeon</label>
              <select className="form-control" value={newOtSurgeon} onChange={e => setNewOtSurgeon(e.target.value)}>
                <option>Dr. Vinod</option><option>Dr. Visakh</option><option>Dr. Geetha</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label">OT Date</label>
                <input type="date" className="form-control" value={newOtDate} onChange={e => setNewOtDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Preferred Time</label>
                <input type="time" className="form-control" value={newOtTime} onChange={e => setNewOtTime(e.target.value)} />
              </div>
            </div>
            <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
              <button type="submit" className="btn btn-purple" style={{ width: '100%', fontWeight: '800', height: '44px' }}>Commit to Surgical Schedule</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
