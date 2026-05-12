import React from 'react';
import { Shield, Check, Plus, FileText } from 'lucide-react';

export default function InsuranceModule({
  insuranceClaims,
  setInsuranceClaims,
  insSubTab,
  setInsSubTab,
  newClaimUhid,
  setNewClaimUhid,
  newClaimPatient,
  setNewClaimPatient,
  newClaimTpa,
  setNewClaimTpa,
  newClaimPolicy,
  setNewClaimPolicy,
  newClaimValidity,
  setNewClaimValidity,
  newClaimAmt,
  setNewClaimAmt,
  newClaimCopay,
  setNewClaimCopay,
  addNotification
}) {

  const handleNewClaim = (e) => {
    e.preventDefault();
    const claimId = 'CLM-' + Math.floor(100 + Math.random() * 900);
    
    const newClaim = {
      claimId,
      uhid: newClaimUhid || 'UHID-' + Math.floor(1000 + Math.random() * 9000),
      patientName: newClaimPatient,
      tpaName: newClaimTpa,
      policyNo: newClaimPolicy,
      validity: newClaimValidity,
      preAuthStatus: 'Pending Verification',
      preAuthAmt: parseInt(newClaimAmt) || 0,
      copay: parseInt(newClaimCopay) || 0,
      claimStatus: 'Open'
    };

    setInsuranceClaims(prev => [...prev, newClaim]);
    addNotification("Policy Registered", `TPA verification initiated for ${newClaimPatient}`, "info");
    
    setNewClaimPatient('');
    setNewClaimPolicy('');
    setInsSubTab('list');
  };

  const updateStatus = (claimId, newStatus) => {
    setInsuranceClaims(prev => prev.map(c => c.claimId === claimId ? { ...c, preAuthStatus: newStatus } : c));
    addNotification("Auth Status Changed", `Status updated to ${newStatus}`, "success");
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', borderRadius: 'var(--radius-md)' }}>
        <button onClick={() => setInsSubTab('list')} className={`btn ${insSubTab === 'list' ? 'btn-cyan' : 'btn-glass'}`} style={{ flex: 1 }}>📑 Active Claims Ledger</button>
        <button onClick={() => setInsSubTab('new')} className={`btn ${insSubTab === 'new' ? 'btn-emerald' : 'btn-glass'}`} style={{ flex: 1 }}>🛡️ New Pre-Auth Request</button>
      </div>

      {insSubTab === 'list' && (
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--accent-cyan)' }}>
            <Shield /> TPA & Insurance Pre-Authorization Workspace
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '12px' }}>CLAIM ID</th>
                  <th style={{ padding: '12px' }}>PATIENT / POLICY</th>
                  <th style={{ padding: '12px' }}>TPA CARRIER</th>
                  <th style={{ padding: '12px' }}>PRE-AUTH LIMIT</th>
                  <th style={{ padding: '12px' }}>VERIFICATION</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {insuranceClaims.map(c => (
                  <tr key={c.claimId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '14px 12px', fontFamily: 'monospace' }}>{c.claimId}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ fontWeight: '700' }}>{c.patientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No: {c.policyNo}</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className="badge badge-glass" style={{ color: 'var(--accent-cyan)' }}>{c.tpaName}</span>
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: '700' }}>
                      ₹{c.preAuthAmt.toLocaleString()}
                      <div style={{ fontSize: '0.65rem', fontWeight: 'normal', color: 'var(--accent-amber)' }}>Co-Pay: ₹{c.copay}</div>
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span className={`badge ${c.preAuthStatus === 'Approved' ? 'badge-emerald' : 'badge-amber'}`}>
                        {c.preAuthStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                      {c.preAuthStatus !== 'Approved' ? (
                        <button onClick={() => updateStatus(c.claimId, 'Approved')} className="btn btn-glass" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                          Approve Auth
                        </button>
                      ) : <span style={{ color: 'var(--accent-emerald)', fontWeight: '700', fontSize: '0.75rem' }}>✓ AUTH VALID</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {insSubTab === 'new' && (
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent-cyan)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>Register Insurance Policy for Pre-Authorization</h3>
          <form onSubmit={handleNewClaim} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label className="form-label">Patient Name</label>
              <input type="text" className="form-control" required value={newClaimPatient} onChange={e => setNewClaimPatient(e.target.value)} />
            </div>
            <div>
              <label className="form-label">UHID (If existing)</label>
              <input type="text" className="form-control" value={newClaimUhid} onChange={e => setNewClaimUhid(e.target.value)} placeholder="UHID-XXXX" />
            </div>
            <div>
              <label className="form-label">Insurance Provider / TPA</label>
              <select className="form-control" value={newClaimTpa} onChange={e => setNewClaimTpa(e.target.value)}>
                <option>Star Health</option><option>ICICI Lombard</option><option>HDFC Ergo</option><option>ECHS Gov</option>
              </select>
            </div>
            <div>
              <label className="form-label">Policy Number</label>
              <input type="text" className="form-control" required value={newClaimPolicy} onChange={e => setNewClaimPolicy(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Requested Amt (₹)</label>
              <input type="number" className="form-control" value={newClaimAmt} onChange={e => setNewClaimAmt(e.target.value)} />
            </div>
             <div>
              <label className="form-label">Known Co-Pay (₹)</label>
              <input type="number" className="form-control" value={newClaimCopay} onChange={e => setNewClaimCopay(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <button type="submit" className="btn btn-cyan" style={{ width: '100%', fontWeight: '800', height: '44px' }}>File Request with Gateway</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
