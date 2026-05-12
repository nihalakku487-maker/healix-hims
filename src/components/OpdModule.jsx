import React from 'react';
import { Ticket, Users, CheckCircle, FileText, Plus, Stethoscope, Clipboard } from 'lucide-react';

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
  setPharmacyOrders
}) {

  const handleStartConsultation = (token) => {
    setOpQueue(prev => prev.map(p => p.tokenNo === token.tokenNo ? { ...p, status: 'In Consultation' } : p));
    setSelectedConsultToken(token);
    setOpQueueSubTab('consult');
    addNotification("Consultation Started", `Started consultation for ${token.name} (${token.tokenNo})`, "info");
  };

  const handleCompleteConsultation = (e) => {
    e.preventDefault();
    if (!selectedConsultToken) return;

    const uhid = selectedConsultToken.uhid;
    const patientName = selectedConsultToken.name;

    // 1. Mark Queue Token as Complete
    setOpQueue(prev => prev.map(p => p.tokenNo === selectedConsultToken.tokenNo ? { ...p, status: 'Completed' } : p));

    // 2. Dispatch Lab Orders if any
    if (consultOrderedServices.includes('Lab Tests')) {
      setLabOrders(prev => [
        ...prev,
        {
          id: "LAB-" + Math.floor(100 + Math.random() * 900),
          uhid: uhid,
          patientName: patientName,
          testName: "Doctor Prescribed Lab Panel",
          status: "Pending",
          timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      handlePostCharge(uhid, "OPD Consult Lab Panel Ordered", 750, "OPD_Consult");
    }

    // 3. Dispatch Radiology if any
    if (consultOrderedServices.includes('X-Ray/Scan')) {
      setRadiologyOrders(prev => [
        ...prev,
        {
          id: "RAD-" + Math.floor(100 + Math.random() * 900),
          uhid: uhid,
          patientName: patientName,
          scanType: "Doctor Prescribed Scan",
          status: "Pending",
          timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      handlePostCharge(uhid, "OPD Consult Radiology Ordered", 1200, "OPD_Consult");
    }

    // 4. Dispatch Prescription to Pharmacy if not empty
    if (consultPrescription.trim()) {
      setPharmacyOrders(prev => [
        ...prev,
        {
          id: "RX-" + Math.floor(100 + Math.random() * 900),
          uhid: uhid,
          patientName: patientName,
          medicines: consultPrescription,
          status: "Pending",
          timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    addNotification("Consultation Finished", `Saved visit data for ${patientName}. Patient routed to next node.`, "success");
    
    // Reset Form
    setSelectedConsultToken(null);
    setConsultChiefComplaint('');
    setConsultDiagnosis('');
    setConsultNotes('');
    setConsultOrderedServices([]);
    setConsultPrescription('');
    setOpQueueSubTab('queue');
  };

  const toggleService = (service) => {
    if (consultOrderedServices.includes(service)) {
      setConsultOrderedServices(prev => prev.filter(s => s !== service));
    } else {
      setConsultOrderedServices(prev => [...prev, service]);
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* SUB NAV */}
      <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
        <button 
          onClick={() => setOpQueueSubTab('queue')} 
          className={`btn ${opQueueSubTab === 'queue' ? 'btn-cyan' : 'btn-glass'}`} 
          style={{ flex: 1, fontWeight: '700', fontSize: '0.85rem', gap: '8px' }}
        >
          <Ticket size={16} /> Live OP Queue
        </button>
        <button 
          onClick={() => {
            if (selectedConsultToken) setOpQueueSubTab('consult');
            else addNotification("No Active Token", "Please select a waiting patient from the queue first.", "warning");
          }} 
          className={`btn ${opQueueSubTab === 'consult' ? 'btn-emerald' : 'btn-glass'}`} 
          style={{ flex: 1, fontWeight: '700', fontSize: '0.85rem', gap: '8px', opacity: selectedConsultToken ? 1 : 0.5 }}
        >
          <FileText size={16} /> Consultant Desk
        </button>
      </div>

      {/* ================= QUEUE VIEW ================= */}
      {opQueueSubTab === 'queue' && (
        <div className="animate-slide-up">
          <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users /> Token Dispatch & Status Board
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Real-time management of walk-in and pre-booked consultations.
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
                    <tr key={item.tokenNo} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', fontSize: '0.9rem' }}>
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
                          item.status === 'Completed' ? 'badge-glass' : 
                          item.status === 'In Consultation' ? 'badge-emerald animate-pulse' : 
                          'badge-amber'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.time}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                        {item.status === 'Waiting' && (
                          <button 
                            onClick={() => handleStartConsultation(item)}
                            className="btn btn-cyan" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700' }}
                          >
                            Call Next
                          </button>
                        )}
                        {item.status === 'In Consultation' && (
                          <button 
                            onClick={() => {
                              setSelectedConsultToken(item);
                              setOpQueueSubTab('consult');
                            }}
                            className="btn btn-emerald" 
                            style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700' }}
                          >
                            Resume Consult
                          </button>
                        )}
                        {item.status === 'Completed' && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: '700' }}>✓ Visited</span>
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

      {/* ================= CONSULTATION VIEW ================= */}
      {opQueueSubTab === 'consult' && selectedConsultToken && (
        <div className="animate-slide-up">
          <form onSubmit={handleCompleteConsultation} style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
            
            {/* MAIN WORKSPACE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent-emerald)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Currently Assessing</h4>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '4px' }}>{selectedConsultToken.name}</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                      {selectedConsultToken.uhid} • {selectedConsultToken.gender}, {selectedConsultToken.age} Years
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-emerald" style={{ padding: '8px 16px', fontSize: '0.9rem', fontWeight: '900' }}>
                      {selectedConsultToken.tokenNo}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>
                      Chief Complaints & Vitals
                    </label>
                    <textarea 
                      placeholder="Enter present complaints, BP, SpO2, Weight etc..."
                      className="form-control"
                      style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', padding: '12px' }}
                      value={consultChiefComplaint}
                      onChange={e => setConsultChiefComplaint(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>
                      Provisional Diagnosis
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Acute Pharyngitis, Viral Fever..."
                      className="form-control"
                      style={{ width: '100%', height: '42px', background: 'rgba(0,0,0,0.2)' }}
                      value={consultDiagnosis}
                      onChange={e => setConsultDiagnosis(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>💊 Prescription / Medication Management</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Routes automatically to Pharmacy Desk</span>
                    </label>
                    <textarea 
                      placeholder="e.g. Tab. Calpol 650mg (1-0-1) x 5 Days..."
                      className="form-control"
                      style={{ width: '100%', minHeight: '120px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', fontFamily: 'monospace' }}
                      value={consultPrescription}
                      onChange={e => setConsultPrescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '12px' }}>
                  Clinical Notes & Review Plan
                </label>
                <textarea 
                  placeholder="Additional internal doctor notes..."
                  className="form-control"
                  style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.2)', padding: '12px' }}
                  value={consultNotes}
                  onChange={e => setConsultNotes(e.target.value)}
                />
              </div>
            </div>

            {/* SIDE ACTIONS PANELS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* ORDER SETS */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '12px', color: 'var(--accent-amber)' }}>
                  ⚡ Diagnostic Dispatches
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Selecting these creates instant parallel queues in corresponding labs.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div 
                    onClick={() => toggleService('Lab Tests')}
                    style={{ 
                      padding: '12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid', transition: '0.2s',
                      background: consultOrderedServices.includes('Lab Tests') ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.02)',
                      borderColor: consultOrderedServices.includes('Lab Tests') ? 'var(--accent-cyan)' : 'transparent'
                    }}
                  >
                    <strong style={{ fontSize: '0.85rem', color: consultOrderedServices.includes('Lab Tests') ? 'var(--accent-cyan)' : '#fff' }}>
                      {consultOrderedServices.includes('Lab Tests') ? '☑' : '☐'} Dispatch to LAB Terminal
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Triggers CBC/Blood panel queue</span>
                  </div>

                  <div 
                    onClick={() => toggleService('X-Ray/Scan')}
                    style={{ 
                      padding: '12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid', transition: '0.2s',
                      background: consultOrderedServices.includes('X-Ray/Scan') ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                      borderColor: consultOrderedServices.includes('X-Ray/Scan') ? 'var(--accent-purple)' : 'transparent'
                    }}
                  >
                    <strong style={{ fontSize: '0.85rem', color: consultOrderedServices.includes('X-Ray/Scan') ? 'var(--accent-purple)' : '#fff' }}>
                      {consultOrderedServices.includes('X-Ray/Scan') ? '☑' : '☐'} Dispatch to RADIOLOGY
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Triggers PACS scanning request</span>
                  </div>
                </div>
              </div>

              {/* DISPOSITION */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'rgba(16, 185, 129, 0.02)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '16px' }}>
                  🏁 Finish Consultation
                </h4>
                <button 
                  type="submit" 
                  className="btn btn-emerald" 
                  style={{ width: '100%', height: '50px', fontWeight: '800', fontSize: '1rem', gap: '8px' }}
                >
                  <CheckCircle size={18} /> Save & Discharge OP
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                  Generates immutable consult charges automatically upon save.
                </p>
              </div>

            </div>

          </form>
        </div>
      )}

    </div>
  );
}
