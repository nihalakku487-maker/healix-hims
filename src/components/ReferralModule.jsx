import React from 'react';
import { FileText, ArrowRightCircle } from 'lucide-react';

export default function ReferralModule({
  referralSlips,
  setReferralSlips,
  refFromDept,
  setRefFromDept,
  refToDept,
  setRefToDept,
  refReason,
  setRefReason,
  refPatientUhid,
  setRefPatientUhid,
  refPatientName,
  setRefPatientName,
  addNotification,
  handlePostCharge
}) {

  const handleReferral = (e) => {
    e.preventDefault();
    const refId = 'REF-' + Math.floor(100 + Math.random() * 900);
    const newRef = {
      refId,
      fromDept: refFromDept,
      toDept: refToDept,
      uhid: refPatientUhid,
      patientName: refPatientName,
      reason: refReason,
      doctor: 'Dr. Primary',
      status: 'Pending',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setReferralSlips(prev => [...prev, newRef]);
    addNotification("Referral Issued", `Internal reference created to ${refToDept} for ${refPatientName}`, "success");
    
    setRefPatientName('');
    setRefPatientUhid('');
    setRefReason('');
  };

  return (
    <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
      
      <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowRightCircle color="var(--accent-purple)" /> Issue Cross-Referral
        </h3>
        <form onSubmit={handleReferral} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Patient Name</label>
            <input type="text" className="form-control" required value={refPatientName} onChange={e => setRefPatientName(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label">Source Dept</label>
              <select className="form-control" value={refFromDept} onChange={e => setRefFromDept(e.target.value)}>
                <option>General Medicine</option><option>Emergency</option><option>OBG</option>
              </select>
            </div>
            <div>
              <label className="form-label">Target Specialty</label>
              <select className="form-control" value={refToDept} onChange={e => setRefToDept(e.target.value)}>
                <option>Cardiology</option><option>Neurology</option><option>Orthopedics</option><option>General Surgery</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Reason / Consultation Details</label>
            <textarea className="form-control" rows={3} required value={refReason} onChange={e => setRefReason(e.target.value)} placeholder="Clinical indications for reference..." />
          </div>
          <button type="submit" className="btn btn-purple" style={{ height: '44px', fontWeight: '800' }}>Dispatch Referral</button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>Recent Internal References</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {referralSlips.map(r => (
            <div key={r.refId} className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--accent-purple)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{r.patientName}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: '700', marginTop: '2px' }}>
                  {r.fromDept} ➔ {r.toDept}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>"{r.reason}"</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-glass">{r.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
