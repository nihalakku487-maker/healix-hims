import React, { useState, useEffect } from 'react';
import { Ticket, Users, CheckCircle, FileText, Plus, Stethoscope, Clipboard, Pill, TestTube, Activity, Search, Save, Send, AlertCircle, HeartPulse, X } from 'lucide-react';

const DRUG_MASTER = [
  { code: 'PCM', name: 'Tab Paracetamol', dose: '500mg' },
  { code: 'PKT', name: 'Tab Panadol', dose: '650mg' },
  { code: 'AMX', name: 'Cap Amoxicillin', dose: '500mg' },
  { code: 'AZI', name: 'Tab Azithromycin', dose: '500mg' },
  { code: 'IBU', name: 'Tab Ibuprofen', dose: '400mg' },
  { code: 'PAN', name: 'Tab Pantoprazole', dose: '40mg' },
  { code: 'CET', name: 'Tab Cetirizine', dose: '10mg' },
  { code: 'BCO', name: 'Cap B-Complex', dose: '1 Cap' },
  { code: 'CFL', name: 'Tab Ciprofloxacin', dose: '500mg' },
  { code: 'AUG', name: 'Tab Augmentin', dose: '625mg' },
  { code: 'ASP', name: 'Tab Aspirin', dose: '75mg' }
];

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
  setActiveTab
}) {

  // CPOE (Computerized Physician Order Entry) Local States
  const [rxList, setRxList] = useState([]);
  const [rxDrug, setRxDrug] = useState('');
  const [rxDose, setRxDose] = useState('');
  const [rxFreq, setRxFreq] = useState('1-0-1');
  const [rxDuration, setRxDuration] = useState('');
  const [rxInstructions, setRxInstructions] = useState('After Food');
  const [showDrugSuggestions, setShowDrugSuggestions] = useState(false);
  const [isRxSent, setIsRxSent] = useState(false);
  const [isLabSent, setIsLabSent] = useState(false);

  const [labTestList, setLabTestList] = useState([]);
  const [labTestInput, setLabTestInput] = useState('');

  // Sync internal structured state with the external string state
  useEffect(() => {
    if (rxList.length > 0) {
      const rxString = rxList.map((rx, i) => `${i + 1}. ${rx.drug} ${rx.dose} (${rx.freq}) for ${rx.duration} - ${rx.instructions}`).join('\n');
      setConsultPrescription(rxString);
    } else {
      setConsultPrescription('');
    }
  }, [rxList, setConsultPrescription]);

  const handleStartConsultation = (token) => {
    setOpQueue(prev => prev.map(p => p.tokenNo === token.tokenNo ? { ...p, status: 'In Consultation' } : p));
    setSelectedConsultToken(token);
    setOpQueueSubTab('consult');
    addNotification("Consultation Started", `Started consultation for ${token.name} (${token.tokenNo})`, "info");
    
    // Reset local CPOE states for new patient
    setRxList([]);
    setLabTestList([]);
    setRxDrug(''); setRxDose(''); setRxDuration('');
  };

  const addRxItem = () => {
    if (!rxDrug) {
      addNotification("Validation Error", "Drug name is required.", "error");
      return;
    }
    setRxList([...rxList, { drug: rxDrug, dose: rxDose, freq: rxFreq, duration: rxDuration || 'As needed', instructions: rxInstructions }]);
    setRxDrug(''); setRxDose(''); setRxDuration('');
  };

  const addLabTest = () => {
    if (!labTestInput) return;
    setLabTestList([...labTestList, labTestInput]);
    setLabTestInput('');
  };

  // Dedicated Button: Transfer Rx to Pharmacy
  const handleSendToPharmacy = (e) => {
    e.preventDefault();
    if (rxList.length === 0) {
      addNotification("Empty Prescription", "Please add medicines before sending to Pharmacy.", "warning");
      return;
    }
    
    const uhid = selectedConsultToken.uhid;
    const patientName = selectedConsultToken.name;
    const rxString = rxList.map(rx => {
      let f = 1;
      if (rx.freq === '1-0-1') f = 2;
      else if (rx.freq === '1-1-1') f = 3;
      else if (rx.freq === '1-0-0' || rx.freq === '0-0-1') f = 1;
      
      let d = parseInt(rx.duration) || 5; 
      let qty = f * d;
      
      // Clean prefix for better pharmacy matching
      let cleanName = rx.drug.replace(/^(Tab |Cap |Syr )/i, '').trim();
      
      return `${cleanName} ${rx.dose} x${qty}`;
    }).join(', ');

    setPharmacyOrders(prev => [
      ...prev,
      {
        id: "RX-" + Math.floor(100 + Math.random() * 900),
        uhid: uhid,
        patientName: patientName,
        medicines: rxString,
        status: "Pending",
        timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    
    addNotification("Rx Dispatched", "Prescription successfully sent to Central Pharmacy Terminal.", "success");
    
    // Button animation feedback
    setIsRxSent(true);
    setTimeout(() => setIsRxSent(false), 2000);
  };

  // Dedicated Button: Order Lab Tests
  const handleSendToLab = (e) => {
    e.preventDefault();
    if (labTestList.length === 0) {
      addNotification("Empty Order", "Please add at least one test before sending to Lab.", "warning");
      return;
    }

    const uhid = selectedConsultToken.uhid;
    const patientName = selectedConsultToken.name;

    setLabOrders(prev => [
      ...prev,
      {
        id: "LAB-" + Math.floor(1000 + Math.random() * 9000).toString(),
        uhid: uhid,
        patientName: patientName,
        testName: labTestList.join(', '),
        status: "Sample Pending", // Aligning with new LIS Enterprise workflow
        timestamp: new Date().toLocaleString()
      }
    ]);
    
    // Auto post charge for ordered labs
    handlePostCharge(uhid, `LIS Orders: ${labTestList.join(', ')}`, labTestList.length * 450, "Lab_Desk");
    addNotification("Lab Orders Sent", "Diagnostic tests securely routed to LIS Terminal.", "success");

    // Button animation feedback
    setIsLabSent(true);
    setTimeout(() => setIsLabSent(false), 2000);
  };

  const handleCompleteConsultation = (e) => {
    e.preventDefault();
    if (!selectedConsultToken) return;

    // 1. Mark Queue Token as Complete
    setOpQueue(prev => prev.map(p => p.tokenNo === selectedConsultToken.tokenNo ? { ...p, status: 'Completed' } : p));

    // Post charge for Doctor Consultation
    handlePostCharge(selectedConsultToken.uhid, `OPD Consultation - Dr. ${selectedConsultToken.doctor}`, 600, "OPD_Consult");

    addNotification("Consultation Finished", `Consultation completed for ${selectedConsultToken.name}. Billing updated.`, "success");
    
    // Reset Form
    setSelectedConsultToken(null);
    setConsultChiefComplaint('');
    setConsultDiagnosis('');
    setConsultNotes('');
    setConsultOrderedServices([]);
    setConsultPrescription('');
    setRxList([]);
    setLabTestList([]);
    setOpQueueSubTab('queue');
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
          <Stethoscope size={16} /> Doctor's EMR Window
        </button>
      </div>

      {/* ================= QUEUE VIEW ================= */}
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
                            Resume EMR
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

      {/* ================= EMR CONSULTATION VIEW (DOCTOR'S WINDOW) ================= */}
      {opQueueSubTab === 'consult' && selectedConsultToken && (
        <div className="animate-slide-up">
          <form style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            
            {/* LEFT: CLINICAL DOCUMENTATION */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '1 1 500px', minWidth: 0 }}>
              
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent-cyan)' }}>
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
                  {/* Vitals Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={12}/> BP (mmHg)</span>
                      <input type="text" placeholder="120/80" className="form-control" style={{ background: 'transparent', border: 'none', padding: '4px 0', fontSize: '1rem', fontWeight: '700' }} />
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><HeartPulse size={12}/> Pulse (bpm)</span>
                      <input type="text" placeholder="78" className="form-control" style={{ background: 'transparent', border: 'none', padding: '4px 0', fontSize: '1rem', fontWeight: '700' }} />
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SpO2 (%)</span>
                      <input type="text" placeholder="98%" className="form-control" style={{ background: 'transparent', border: 'none', padding: '4px 0', fontSize: '1rem', fontWeight: '700' }} />
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Temp (°F)</span>
                      <input type="text" placeholder="98.6" className="form-control" style={{ background: 'transparent', border: 'none', padding: '4px 0', fontSize: '1rem', fontWeight: '700' }} />
                    </div>
                  </div>

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

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>
                      Clinical Notes & Plan
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

            {/* RIGHT: CPOE (PRESCRIPTION & INVESTIGATIONS) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '1 1 400px', minWidth: 0 }}>
              
              {/* DRUG PRESCRIPTION BUILDER */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', borderTop: '4px solid var(--accent-emerald)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
                  <Pill size={18} /> Medication Order Entry (CPOE)
                </h4>
                
                {/* Rx Form */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ gridColumn: 'span 2', position: 'relative' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Drug Name or Code (e.g., PKT, PCM)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Tab Paracetamol or PKT" 
                      className="form-control" 
                      style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }} 
                      value={rxDrug} 
                      onChange={e => { setRxDrug(e.target.value); setShowDrugSuggestions(true); }} 
                      onFocus={() => setShowDrugSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDrugSuggestions(false), 200)}
                    />
                    {showDrugSuggestions && rxDrug && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '150px', overflowY: 'auto' }}>
                        {DRUG_MASTER.filter(d => d.code.toLowerCase().includes(rxDrug.toLowerCase()) || d.name.toLowerCase().includes(rxDrug.toLowerCase())).map(drug => (
                          <div 
                            key={drug.code} 
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onMouseDown={() => {
                              setRxDrug(drug.name);
                              if (!rxDose) setRxDose(drug.dose);
                              setShowDrugSuggestions(false);
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{drug.name}</span>
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>{drug.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Dosage</label>
                    <input type="text" placeholder="e.g. 500mg" className="form-control" style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }} value={rxDose} onChange={e => setRxDose(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Frequency</label>
                    <select className="form-control" style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }} value={rxFreq} onChange={e => setRxFreq(e.target.value)}>
                      <option value="1-0-1">1-0-1 (BD)</option>
                      <option value="1-1-1">1-1-1 (TDS)</option>
                      <option value="1-0-0">1-0-0 (OD - Morning)</option>
                      <option value="0-0-1">0-0-1 (OD - Night)</option>
                      <option value="SOS">SOS (As needed)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Duration</label>
                    <input type="text" placeholder="e.g. 5 Days" className="form-control" style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }} value={rxDuration} onChange={e => setRxDuration(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>Instructions</label>
                    <select className="form-control" style={{ width: '100%', padding: '8px', fontSize: '0.85rem' }} value={rxInstructions} onChange={e => setRxInstructions(e.target.value)}>
                      <option>After Food</option>
                      <option>Before Food</option>
                      <option>Empty Stomach</option>
                    </select>
                  </div>
                </div>
                
                <button type="button" onClick={addRxItem} className="btn btn-glass" style={{ width: '100%', padding: '8px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '16px' }}>
                  <Plus size={14} /> Add Medicine to List
                </button>

                {/* Rx List */}
                <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '12px', minHeight: '120px', maxHeight: '180px', overflowY: 'auto' }}>
                  {rxList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '20px' }}>No medicines prescribed yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {rxList.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '4px' }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.drug} <span style={{ color: 'var(--accent-cyan)' }}>{item.dose}</span></div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.freq} • {item.duration} • {item.instructions}</div>
                          </div>
                          <X size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => setRxList(rxList.filter((_, i) => i !== idx))} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DISPATCH TO PHARMACY BUTTON */}
                <button 
                  type="button" 
                  onClick={handleSendToPharmacy}
                  className="btn btn-emerald" 
                  style={{ width: '100%', marginTop: '16px', padding: '12px', fontWeight: '800', gap: '8px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', transition: '0.3s' }}
                >
                  {isRxSent ? (
                    <><CheckCircle size={16} /> Sent to Pharmacy!</>
                  ) : (
                    <><Send size={16} /> Transfer e-Prescription to Pharmacy</>
                  )}
                </button>
              </div>

              {/* LAB / RADIOLOGY ORDERS */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', borderTop: '4px solid var(--accent-purple)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)' }}>
                  <TestTube size={18} /> Diagnostic Orders
                </h4>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <input 
                    type="text" 
                    placeholder="Search Lab Test (e.g., CBC, HbA1c)..." 
                    className="form-control" 
                    style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }} 
                    value={labTestInput} 
                    onChange={e => setLabTestInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLabTest())}
                  />
                  <button type="button" onClick={addLabTest} className="btn btn-glass" style={{ padding: '8px 12px' }}><Plus size={16}/></button>
                </div>

                {/* Lab List */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {labTestList.map((test, idx) => (
                    <span key={idx} style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#ddd', padding: '4px 8px', borderRadius: '16px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {test} <X size={10} style={{ cursor: 'pointer' }} onClick={() => setLabTestList(labTestList.filter((_, i) => i !== idx))} />
                    </span>
                  ))}
                  {labTestList.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No tests selected.</span>}
                </div>

                {/* DISPATCH TO LAB BUTTON */}
                <button 
                  type="button" 
                  onClick={handleSendToLab}
                  className="btn btn-purple" 
                  style={{ width: '100%', padding: '12px', fontWeight: '800', gap: '8px', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)', transition: '0.3s' }}
                >
                  {isLabSent ? (
                    <><CheckCircle size={16} /> Sent to LIS!</>
                  ) : (
                    <><Send size={16} /> Send Orders to LIS / Pathology</>
                  )}
                </button>
              </div>

              {/* DISPOSITION */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', background: 'rgba(6, 182, 212, 0.05)', marginTop: 'auto' }}>
                <button 
                  type="button" 
                  onClick={handleCompleteConsultation}
                  className="btn btn-cyan" 
                  style={{ width: '100%', height: '50px', fontWeight: '800', fontSize: '1rem', gap: '8px' }}
                >
                  <CheckCircle size={18} /> Complete Consult & Discharge
                </button>
              </div>

            </div>

          </form>
        </div>
      )}

    </div>
  );
}
