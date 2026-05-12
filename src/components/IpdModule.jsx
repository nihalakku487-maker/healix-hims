import React, { useState, useEffect } from 'react';
import { BedDouble, CheckCircle, FileText, Plus, Search, AlertTriangle, User, Activity, ArrowRightLeft, LogOut, Clock } from 'lucide-react';

const WARD_STRUCTURE = {
  'General': ['G-01', 'G-02', 'G-03', 'G-04', 'G-05', 'G-06', 'G-07', 'G-08', 'G-09', 'G-10', 'G-11', 'G-12'],
  'Semi-Private': ['SP-01', 'SP-02', 'SP-03', 'SP-04', 'SP-05', 'SP-06', 'SP-07', 'SP-08'],
  'Private': ['P-01', 'P-02', 'P-03', 'P-04', 'P-05', 'P-06'],
  'ICU': ['ICU-01', 'ICU-02', 'ICU-03', 'ICU-04', 'ICU-05'],
  'NICU': ['NICU-01', 'NICU-02', 'NICU-03', 'NICU-04']
};

export default function IpdModule({
  ipAdmissions,
  setIpAdmissions,
  ipAdmSubTab,
  setIpAdmSubTab,
  newAdmName,
  setNewAdmName,
  newAdmAge,
  setNewAdmAge,
  newAdmGender,
  setNewAdmGender,
  newAdmWard,
  setNewAdmWard,
  newAdmBed,
  setNewAdmBed,
  newAdmDoctor,
  setNewAdmDoctor,
  newAdmDiagnosis,
  setNewAdmDiagnosis,
  newAdmDeposit,
  setNewAdmDeposit,
  newAdmReferFrom,
  setNewAdmReferFrom,
  selectedAdmission,
  setSelectedAdmission,
  wardRoundNote,
  setWardRoundNote,
  dischargeSummaryText,
  setDischargeSummaryText,
  dischargeRx,
  setDischargeRx,
  addNotification,
  handlePostCharge,
  setPatients
}) {

  const [activeWardView, setActiveWardView] = useState('General');
  const [selectedBedOccupant, setSelectedBedOccupant] = useState(null);

  useEffect(() => {
    // Default to layout view when mounting if it's currently list
    if (ipAdmSubTab === 'list') {
      setIpAdmSubTab('layout');
    }
  }, []);

  const handleAdmitPatient = (e) => {
    e.preventDefault();
    const admId = 'ADM-' + Math.floor(100 + Math.random() * 900);
    const newUhid = 'UHID-' + Math.floor(1000 + Math.random() * 9000);
    
    // Auto-assign bed if none selected
    let finalBed = newAdmBed;
    if (!finalBed) {
      const allWardsBeds = WARD_STRUCTURE[newAdmWard] || [];
      const occupiedBedsInWard = ipAdmissions.filter(a => a.ward === newAdmWard).map(a => a.bed);
      const vacantBeds = allWardsBeds.filter(b => !occupiedBedsInWard.includes(b));
      finalBed = vacantBeds.length > 0 ? vacantBeds[0] : `B-OVERFLOW-${Math.floor(Math.random() * 100)}`;
    }

    const newAdmission = {
      admId,
      uhid: newUhid,
      name: newAdmName,
      ward: newAdmWard,
      bed: finalBed,
      admDate: new Date().toISOString().split('T')[0],
      doctor: newAdmDoctor,
      diagnosis: newAdmDiagnosis,
      deposit: parseInt(newAdmDeposit) || 0,
      status: 'Active',
      notes: []
    };

    setIpAdmissions(prev => [...prev, newAdmission]);

    // Update global patient record
    setPatients(prev => [...prev, {
      id: newUhid,
      name: newAdmName,
      age: parseInt(newAdmAge),
      gender: newAdmGender,
      type: "IP",
      status: "Admitted",
      room: `${newAdmWard} Ward`,
      doctor: newAdmDoctor,
      bed: newAdmission.bed
    }]);

    // Immediate Auto Billing for IP Admission
    handlePostCharge(newUhid, `IP Admission Fee (${newAdmWard} Ward)`, 1500, "IPD_Desk");
    if(newAdmission.deposit > 0) {
      handlePostCharge(newUhid, `Initial IP Security Deposit`, -newAdmission.deposit, "IPD_Desk"); 
    }

    addNotification("Admission Complete", `Created admission ID ${admId} for ${newAdmName}. Assigned to ${finalBed}.`, "success");
    
    // Reset states
    setNewAdmName('');
    setNewAdmAge('');
    setNewAdmDiagnosis('');
    setNewAdmDeposit('');
    setNewAdmBed('');
    setIpAdmSubTab('layout');
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', borderRadius: 'var(--radius-md)' }}>
        <button 
          onClick={() => setIpAdmSubTab('layout')} 
          className={`btn ${ipAdmSubTab === 'layout' ? 'btn-purple' : 'btn-glass'}`} 
          style={{ flex: 1, fontWeight: '700' }}
        >
          🛏️ Visual Bed Layout (Live)
        </button>
        <button 
          onClick={() => setIpAdmSubTab('list')} 
          className={`btn ${ipAdmSubTab === 'list' ? 'btn-cyan' : 'btn-glass'}`} 
          style={{ flex: 1, fontWeight: '700' }}
        >
          📋 Inpatient Census List
        </button>
        <button 
          onClick={() => setIpAdmSubTab('admit')} 
          className={`btn ${ipAdmSubTab === 'admit' ? 'btn-emerald' : 'btn-glass'}`} 
          style={{ flex: 1, fontWeight: '700' }}
        >
          ➕ New Direct Admission
        </button>
      </div>

      {ipAdmSubTab === 'layout' && (
        <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: selectedBedOccupant ? '2fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* WARD SELECTION NAV */}
            <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '10px', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
              {Object.keys(WARD_STRUCTURE).map(ward => {
                const totalBeds = WARD_STRUCTURE[ward].length;
                const occupiedBeds = ipAdmissions.filter(a => a.ward === ward).length;
                const capacity = Math.round((occupiedBeds / totalBeds) * 100);
                
                return (
                  <button 
                    key={ward} 
                    onClick={() => { setActiveWardView(ward); setSelectedBedOccupant(null); }} 
                    className={`btn ${activeWardView === ward ? 'btn-purple' : 'btn-glass'}`} 
                    style={{ fontWeight: '700', padding: '10px 20px', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{ward} Ward</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{capacity}% Full ({occupiedBeds}/{totalBeds})</span>
                  </button>
                );
              })}
            </div>

            {/* VISUAL BED GRID */}
            <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-purple)', margin: 0 }}>
                  {activeWardView} - Live Bed Occupancy Map
                </h3>
                <div style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vacant</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.5)' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Occupied</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.5)' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cleaning</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px' }}>
                {WARD_STRUCTURE[activeWardView].map(bedId => {
                  const occupant = ipAdmissions.find(adm => adm.ward === activeWardView && adm.bed === bedId);
                  const isOccupied = !!occupant;
                  // Simulate 10% of unoccupied beds being in cleaning state for realism
                  const isCleaning = !isOccupied && (bedId.charCodeAt(bedId.length - 1) % 7 === 0);

                  let bgColor = 'rgba(255,255,255,0.02)';
                  let borderColor = 'var(--border-color)';
                  let statusBadge = null;

                  if (isOccupied) {
                    bgColor = 'rgba(6, 182, 212, 0.05)';
                    borderColor = 'rgba(6, 182, 212, 0.3)';
                    statusBadge = <span className="badge badge-cyan animate-pulse-glow" style={{ fontSize: '0.55rem', padding: '2px 4px' }}>OCCUPIED</span>;
                  } else if (isCleaning) {
                    bgColor = 'rgba(245, 158, 11, 0.05)';
                    borderColor = 'rgba(245, 158, 11, 0.3)';
                    statusBadge = <span className="badge badge-amber" style={{ fontSize: '0.55rem', padding: '2px 4px' }}>CLEANING</span>;
                  } else {
                    bgColor = 'rgba(16, 185, 129, 0.05)';
                    borderColor = 'rgba(16, 185, 129, 0.3)';
                    statusBadge = <span className="badge badge-emerald" style={{ fontSize: '0.55rem', padding: '2px 4px' }}>VACANT</span>;
                  }

                  const isSelected = selectedBedOccupant && selectedBedOccupant.bed === bedId;
                  if (isSelected) {
                    borderColor = 'var(--accent-purple)';
                    bgColor = 'rgba(139, 92, 246, 0.1)';
                  }

                  return (
                    <div 
                      key={bedId} 
                      className="glass-panel" 
                      style={{ 
                        padding: '12px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '12px', 
                        background: bgColor, 
                        borderColor: borderColor,
                        borderWidth: isSelected ? '2px' : '1px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                        position: 'relative',
                        height: '110px'
                      }}
                      onClick={() => {
                        if (isOccupied) {
                          setSelectedBedOccupant(occupant);
                        } else if (!isCleaning) {
                          setNewAdmWard(activeWardView);
                          setNewAdmBed(bedId);
                          setIpAdmSubTab('admit');
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <strong style={{ fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>{bedId}</strong>
                        {statusBadge}
                      </div>
                      
                      {isOccupied ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', alignItems: 'flex-start', marginTop: 'auto' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'left', color: 'var(--text-primary)' }}>{occupant.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>{occupant.admId}</span>
                        </div>
                      ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-10px' }}>
                          <BedDouble size={28} style={{ color: isCleaning ? 'var(--accent-amber)' : 'var(--accent-emerald)', opacity: 0.4 }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* OCCUPANT DETAILS SIDE PANEL */}
          {selectedBedOccupant && (
            <div className="glass-panel animate-slide-left" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderColor: 'rgba(6, 182, 212, 0.4)', position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0', color: 'var(--accent-cyan)' }}>{selectedBedOccupant.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedBedOccupant.uhid} | {selectedBedOccupant.admId}</span>
                </div>
                <button onClick={() => setSelectedBedOccupant(null)} className="badge badge-glass" style={{ border: 'none', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Bed</span>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>{selectedBedOccupant.ward} - {selectedBedOccupant.bed}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admission Date</span>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>{selectedBedOccupant.admDate}</strong>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Primary Diagnosis</span>
                  <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-rose)', fontSize: '0.85rem', marginTop: '4px' }}>
                    {selectedBedOccupant.diagnosis}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Consulting Doctor</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <div className="icon-container" style={{ width: '28px', height: '28px' }}><User size={14} /></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedBedOccupant.doctor}</span>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

                {/* QUICK ACTIONS */}
                <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0' }}>Ward Actions</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  <button className="btn btn-glass" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                    <Activity size={16} className="text-emerald" /> Log Patient Vitals (TPR/BP)
                  </button>
                  <button className="btn btn-glass" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                    <ArrowRightLeft size={16} className="text-cyan" /> Initiate Bed Transfer
                  </button>
                  <button 
                    onClick={() => {
                      addNotification("Discharge Initiated", `Sending discharge clearance request for ${selectedBedOccupant.name} to billing.`, "info");
                    }}
                    className="btn btn-glass" 
                    style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '10px', fontSize: '0.8rem', borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)' }}
                  >
                    <LogOut size={16} /> Mark for Discharge
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {ipAdmSubTab === 'list' && (
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <BedDouble /> Active Inpatient Census Ledger
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '12px 8px' }}>ADM ID</th>
                  <th style={{ padding: '12px 8px' }}>PATIENT NAME</th>
                  <th style={{ padding: '12px 8px' }}>WARD / BED</th>
                  <th style={{ padding: '12px 8px' }}>DIAGNOSIS</th>
                  <th style={{ padding: '12px 8px' }}>ADMIT DATE</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {ipAdmissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No active inpatients admitted.</td>
                  </tr>
                ) : (
                  ipAdmissions.map(adm => (
                    <tr key={adm.admId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', fontSize: '0.9rem' }}>
                      <td style={{ padding: '14px 8px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{adm.admId}</td>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ fontWeight: '700' }}>{adm.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{adm.uhid}</div>
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <span className={`badge ${adm.ward === 'ICU' ? 'badge-rose' : 'badge-glass'}`} style={{ marginRight: '8px' }}>{adm.ward}</span>
                        <span style={{ fontWeight: '600' }}>{adm.bed}</span>
                      </td>
                      <td style={{ padding: '14px 8px', color: 'var(--text-secondary)' }}>{adm.diagnosis}</td>
                      <td style={{ padding: '14px 8px', fontSize: '0.8rem' }}>{adm.admDate}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                        <span className="badge badge-emerald">ACTIVE</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ipAdmSubTab === 'admit' && (
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent-emerald)' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '24px', color: '#fff' }}>Create Inpatient Admission Record</h3>
          
          <form onSubmit={handleAdmitPatient} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" required value={newAdmName} onChange={e => setNewAdmName(e.target.value)} placeholder="Enter Patient Full Legal Name" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Age</label>
                  <input type="number" className="form-control" required value={newAdmAge} onChange={e => setNewAdmAge(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={newAdmGender} onChange={e => setNewAdmGender(e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Primary Diagnosis / Admission Reason</label>
                <input type="text" className="form-control" required value={newAdmDiagnosis} onChange={e => setNewAdmDiagnosis(e.target.value)} placeholder="e.g. Acute Appendicitis" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Ward Selection</label>
                  <select className="form-control" value={newAdmWard} onChange={e => { setNewAdmWard(e.target.value); setNewAdmBed(''); }}>
                    {Object.keys(WARD_STRUCTURE).map(ward => <option key={ward} value={ward}>{ward}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Bed Assignment</label>
                  <select className="form-control" value={newAdmBed} onChange={e => setNewAdmBed(e.target.value)}>
                    <option value="">-- Auto Assign --</option>
                    {newAdmWard && WARD_STRUCTURE[newAdmWard] ? WARD_STRUCTURE[newAdmWard].map(bed => {
                      const isOccupied = ipAdmissions.some(a => a.ward === newAdmWard && a.bed === bed);
                      return <option key={bed} value={bed} disabled={isOccupied}>{bed} {isOccupied ? '(Occupied)' : ''}</option>;
                    }) : null}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Admitting Consultant</label>
                <select className="form-control" value={newAdmDoctor} onChange={e => setNewAdmDoctor(e.target.value)}>
                  <option>Dr. Visakh (Gen. Med)</option><option>Dr. Vinod (Cardio)</option><option>Dr. Susan (Gynec)</option><option>Dr. Geetha RMO</option>
                </select>
              </div>
              <div>
                <label className="form-label">Admission Deposit (₹)</label>
                <input type="number" className="form-control" value={newAdmDeposit} onChange={e => setNewAdmDeposit(e.target.value)} placeholder="Initial Payment Deposit" />
              </div>
            </div>

            <div style={{ gridColumn: 'span 2', marginTop: '12px' }}>
              <button type="submit" className="btn btn-emerald" style={{ width: '100%', height: '48px', fontWeight: '800', fontSize: '1.05rem' }}>
                Commit Admission & Reserve Bed
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

