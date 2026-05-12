import React, { useState, useEffect } from 'react';
import { Database, Beaker, Activity, FileEdit, FileText, Settings, ShieldCheck, Printer, Save, Search, RefreshCw, Barcode, CheckSquare, Clock, Truck, AlertTriangle, TrendingUp, CheckCircle, BarChart2 } from 'lucide-react';
import LisResultIssuing from './LisResultIssuing';

export default function LisModule({
  labOrders, setLabOrders,
  handlePostCharge, addNotification,
  labMasterTests
}) {
  const [lisTab, setLisTab] = useState('accession'); 

  // Accessioning State
  const [accPatient, setAccPatient] = useState({ name: '', age: '', gender: 'Male', phone: '', refBy: '' });
  const [accTests, setAccTests] = useState([]);
  const [accSearch, setAccSearch] = useState('');

  // Local state for features not yet hoisted to global App state
  const [activeEntryOrder, setActiveEntryOrder] = useState(null);
  const [entryTests, setEntryTests] = useState([]);
  
  // Simulated QC Data
  const [qcData, setQcData] = useState([
    { day: 1, val: 100 }, { day: 2, val: 102 }, { day: 3, val: 98 }, { day: 4, val: 105 },
    { day: 5, val: 95 }, { day: 6, val: 99 }, { day: 7, val: 101 }, { day: 8, val: 112 }, // Violation on Day 8
    { day: 9, val: 100 }, { day: 10, val: 97 }
  ]);

  // Outsource Data
  const [outsourceQueue, setOutsourceQueue] = useState([
    { id: 'OUT-901', patient: 'Ramesh K', test: 'Histopathology Biopsy', lab: 'Lal PathLabs', status: 'Dispatched', time: '10:30 AM' },
    { id: 'OUT-902', patient: 'Sunita M', test: 'HLA B27', lab: 'SRL Diagnostics', status: 'Pending Pickup', time: '12:15 PM' }
  ]);

  const loadEntryOrder = (order) => {
    setActiveEntryOrder(order);
    // Dummy parameters for simulation
    setEntryTests([
      { id: 1, param: 'Uric Acid', result: '5.4', min: 3.5, max: 7.2, unit: 'mg/dL', flag: '' },
      { id: 2, param: 'Calcium Total', result: '8.9', min: 9.0, max: 10.5, unit: 'mg/dL', flag: 'L' },
      { id: 3, param: 'Hemoglobin', result: '13.2', min: 12.0, max: 15.0, unit: 'g/dL', flag: '' },
      { id: 4, param: 'Glucose Fasting', result: '110', min: 70, max: 100, unit: 'mg/dL', flag: 'H' }
    ]);
  };

  const handleResultChange = (id, value) => {
    setEntryTests(entryTests.map(t => {
      if (t.id === id) {
        let flag = '';
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) {
          if (numVal < t.min) flag = 'L';
          if (numVal > t.max) flag = 'H';
        }
        return { ...t, result: value, flag };
      }
      return t;
    }));
  };

  const lisTheme = {
    bg: '#f0f4f8',
    headerBg: '#1e3a8a', // Darker corporate blue for enterprise feel
    navBg: '#e2e8f0',
    borderColor: '#cbd5e1',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '0.75rem',
    textColor: '#1e293b'
  };

  const handleBookTest = () => {
    if (!accPatient.name || accTests.length === 0) return;
    const newOrderId = Math.floor(1000 + Math.random() * 9000).toString();
    const newOrder = {
      id: newOrderId,
      uhid: `UHID-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: accPatient.name,
      testName: accTests.map(t => t.name).join(', '),
      timestamp: new Date().toLocaleString(),
      status: 'Sample Pending' // Initial status for new workflow
    };
    
    setLabOrders(prev => [...prev, newOrder]);
    
    const totalAmount = accTests.reduce((sum, t) => sum + t.price, 0);
    handlePostCharge(newOrder.uhid, 'LIS Accession Billing', totalAmount, 'Lab_Desk');
    addNotification('Accession Saved', `Order ${newOrderId} successfully accessioned into LIS.`, 'success');
    
    setAccPatient({ name: '', age: '', gender: 'Male', phone: '', refBy: '' });
    setAccTests([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: lisTheme.fontFamily, color: lisTheme.textColor }}>
      
      {/* Top Application Header */}
      <div style={{ background: lisTheme.headerBg, color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Database size={20} style={{ color: '#60a5fa' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '1px' }}>i-LISWARE 5.0 Enterprise</div>
            <div style={{ fontSize: '0.65rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '2px' }}>Healix Core Integration Module</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', fontWeight: '500' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14} /> SUPER_ADMIN</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} /> MAIN-LAB-NODE</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* LIS Navigation Toolbar */}
      <div style={{ background: lisTheme.navBg, borderBottom: `1px solid ${lisTheme.borderColor}`, padding: '4px 8px', display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
        {[
          { id: 'accession', label: '1. Accession', icon: <FileEdit size={14} /> },
          { id: 'collection', label: '2. Phlebotomy (Barcodes)', icon: <Barcode size={14} /> },
          { id: 'worklist', label: '3. Analyzer Sync', icon: <RefreshCw size={14} /> },
          { id: 'entry', label: '4. Tech Entry', icon: <FileText size={14} /> },
          { id: 'auth', label: '5. Pathologist Auth', icon: <CheckSquare size={14} /> },
          { id: 'issuing', label: '6. Report Issuing', icon: <Printer size={14} /> },
          { id: 'qc', label: 'QC & Calibration', icon: <Activity size={14} /> },
          { id: 'outsource', label: 'Outsource Mgmt', icon: <Truck size={14} /> },
          { id: 'tat', label: 'TAT Analytics', icon: <BarChart2 size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setLisTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: lisTab === tab.id ? '#ffffff' : 'transparent',
              border: `1px solid ${lisTab === tab.id ? lisTheme.borderColor : 'transparent'}`,
              borderBottom: lisTab === tab.id ? 'none' : `1px solid ${lisTheme.borderColor}`,
              padding: '6px 10px',
              fontSize: '0.75rem',
              fontWeight: lisTab === tab.id ? '700' : '500',
              cursor: 'pointer',
              color: lisTab === tab.id ? '#1e40af' : '#475569',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              whiteSpace: 'nowrap',
              boxShadow: lisTab === tab.id ? '0 -2px 5px rgba(0,0,0,0.02)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Module Content Area */}
      <div style={{ flex: 1, background: lisTheme.bg, padding: '16px', overflowY: 'auto' }}>
        
        {/* ================= 1. ACCESSION ================= */}
        {lisTab === 'accession' && (
          <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', height: '100%' }}>
            {/* Demographics */}
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', borderBottom: `1px solid ${lisTheme.borderColor}`, paddingBottom: '8px', marginBottom: '16px', color: lisTheme.headerBg }}>
                Demographics Entry
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: lisTheme.fontSize }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontWeight: '600', marginBottom: '4px', color: '#64748b' }}>Patient Name *</label>
                  <input type="text" value={accPatient.name} onChange={e => setAccPatient({...accPatient, name: e.target.value})} style={{ border: `1px solid ${lisTheme.borderColor}`, padding: '8px', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <label style={{ fontWeight: '600', marginBottom: '4px', color: '#64748b' }}>Age</label>
                    <input type="text" value={accPatient.age} onChange={e => setAccPatient({...accPatient, age: e.target.value})} style={{ border: `1px solid ${lisTheme.borderColor}`, padding: '8px', borderRadius: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <label style={{ fontWeight: '600', marginBottom: '4px', color: '#64748b' }}>Gender</label>
                    <select value={accPatient.gender} onChange={e => setAccPatient({...accPatient, gender: e.target.value})} style={{ border: `1px solid ${lisTheme.borderColor}`, padding: '8px', borderRadius: '4px' }}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontWeight: '600', marginBottom: '4px', color: '#64748b' }}>Phone Number</label>
                  <input type="text" value={accPatient.phone} onChange={e => setAccPatient({...accPatient, phone: e.target.value})} style={{ border: `1px solid ${lisTheme.borderColor}`, padding: '8px', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontWeight: '600', marginBottom: '4px', color: '#64748b' }}>Referred By</label>
                  <input type="text" value={accPatient.refBy} onChange={e => setAccPatient({...accPatient, refBy: e.target.value})} style={{ border: `1px solid ${lisTheme.borderColor}`, padding: '8px', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            {/* Test Selection */}
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, padding: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${lisTheme.borderColor}`, paddingBottom: '8px', marginBottom: '16px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: lisTheme.headerBg }}>Test Selection</span>
                <button onClick={handleBookTest} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', fontSize: lisTheme.fontSize, cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={14} /> Accession Order
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
                {/* Available Tests */}
                <div style={{ border: `1px solid ${lisTheme.borderColor}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', fontSize: lisTheme.fontSize, fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>
                    Master Test Directory
                  </div>
                  <div style={{ padding: '8px', borderBottom: `1px solid ${lisTheme.borderColor}` }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: '#94a3b8' }} />
                      <input type="text" placeholder="Search tests..." value={accSearch} onChange={e => setAccSearch(e.target.value)} style={{ width: '100%', border: `1px solid ${lisTheme.borderColor}`, padding: '6px 6px 6px 28px', borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                    </div>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
                    {labMasterTests?.filter(t => t.name.toLowerCase().includes(accSearch.toLowerCase())).map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => !accTests.find(at => at.id === t.id) && setAccTests([...accTests, t])}
                        style={{ padding: '8px 12px', fontSize: lisTheme.fontSize, cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}
                      >
                        <span style={{ fontWeight: '500' }}>{t.name}</span>
                        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>₹{t.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Tests */}
                <div style={{ border: `1px solid ${lisTheme.borderColor}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', fontSize: lisTheme.fontSize, fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>
                    Selected Panels ({accTests.length})
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
                    {accTests.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: lisTheme.fontSize, borderBottom: '1px solid #f1f5f9', background: '#f0fdf4', marginBottom: '4px', borderRadius: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#166534' }}>{t.name}</span>
                        <span style={{ color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setAccTests(accTests.filter(at => at.id !== t.id))}>✕</span>
                      </div>
                    ))}
                    {accTests.length === 0 && <div style={{ color: '#94a3b8', padding: '16px', fontSize: lisTheme.fontSize, textAlign: 'center' }}>No tests selected.</div>}
                  </div>
                  <div style={{ background: '#f8fafc', padding: '12px', borderTop: `1px solid ${lisTheme.borderColor}`, textAlign: 'right', fontWeight: '800', fontSize: '0.9rem', color: lisTheme.headerBg }}>
                    Total Amount: ₹{accTests.reduce((sum, t) => sum + t.price, 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. PHLEBOTOMY & BARCODE ================= */}
        {lisTab === 'collection' && (
          <div className="animate-slide-up" style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, height: '100%', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: lisTheme.headerBg }}>Sample Collection & Barcoding</span>
              <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: lisTheme.fontSize, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <Printer size={14} /> Print Pending Barcodes
              </button>
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(100% - 50px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: lisTheme.fontSize }}>
                <thead style={{ background: '#f1f5f9', textAlign: 'left', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569', fontWeight: '600' }}>Lab Accession No</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569', fontWeight: '600' }}>Patient Name</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569', fontWeight: '600' }}>Tests Ordered</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569', fontWeight: '600' }}>Vial Barcode (Code-128)</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569', fontWeight: '600' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {labOrders.length === 0 ? <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No pending samples.</td></tr> : null}
                  {labOrders.map((order, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: order.status === 'Sample Pending' ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: lisTheme.headerBg }}>{order.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{order.patientName}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{order.testName}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {order.status !== 'Sample Pending' ? (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '-1px', color: 'black', lineHeight: '1' }}>
                              ||||| |||| || |||||| |
                            </div>
                            <span style={{ fontSize: '0.6rem', letterSpacing: '1px', marginTop: '2px' }}>* {order.id} *</span>
                          </div>
                        ) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Pending Generation</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700',
                          background: order.status === 'Sample Pending' ? '#fef3c7' : '#dcfce3',
                          color: order.status === 'Sample Pending' ? '#d97706' : '#16a34a'
                        }}>
                          {order.status === 'Sample Pending' ? 'Awaiting Phlebotomy' : 'Sample Collected'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {order.status === 'Sample Pending' ? (
                          <button onClick={() => {
                            setLabOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Processing' } : o));
                            addNotification('Sample Collected', `Barcodes generated and sent to printer for ${order.patientName}`, 'success');
                          }} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '600' }}>
                            Collect & Print
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12}/> Collected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 3. MACHINE WORKLIST (BIDIRECTIONAL) ================= */}
        {lisTab === 'worklist' && (
          <div className="animate-slide-up" style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, height: '100%', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: lisTheme.headerBg, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} /> Analyzer Bidirectional Interface (TCP/IP)
              </span>
              <button style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: lisTheme.fontSize, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <RefreshCw size={14} /> Poll LIS Bridge
              </button>
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(100% - 50px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: lisTheme.fontSize }}>
                <thead style={{ background: '#f1f5f9', textAlign: 'left', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Barcode ID</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Target Analyzer</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Protocol</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Machine Status</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {labOrders.filter(o => o.status !== 'Sample Pending').length === 0 ? <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No samples arrived at machine yet.</td></tr> : null}
                  {labOrders.filter(o => o.status !== 'Sample Pending').map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700', fontFamily: 'monospace', fontSize: '0.85rem' }}>|| {order.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#334155' }}>
                        {order.testName.includes('CBC') ? 'Sysmex XN-1000' : 'Roche Cobas c311'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>ASTM / HL7</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
                          background: order.status === 'Processing' ? '#e0f2fe' : '#dcfce3',
                          color: order.status === 'Processing' ? '#0284c7' : '#16a34a',
                          display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content'
                        }}>
                          {order.status === 'Processing' ? <><RefreshCw size={10} className="animate-spin" /> In Machine</> : <><CheckCircle size={10} /> Data Received</>}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {order.status === 'Processing' ? (
                          <button onClick={() => {
                            setLabOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Tech Entry' } : o));
                            addNotification("HL7 Success", `Analyzer results for ${order.patientName} pushed to Tech Queue.`, "success");
                          }} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '600' }}>
                            Fetch Results (Simulate)
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Synced</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 4. TECH ENTRY (MAKER) ================= */}
        {lisTab === 'entry' && (
          <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', height: '100%' }}>
            {/* Worklist Sidebar */}
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#f8fafc', padding: '12px', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, fontSize: '0.8rem', color: lisTheme.headerBg }}>
                Tech Validation Queue
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {labOrders.filter(o => o.status === 'Tech Entry' || o.status === 'Pending Auth').map(order => (
                  <div key={order.id} onClick={() => loadEntryOrder(order)} style={{ 
                    padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: lisTheme.fontSize, 
                    background: activeEntryOrder?.id === order.id ? '#eff6ff' : (order.status === 'Pending Auth' ? '#f0fdf4' : 'white'),
                    borderLeft: activeEntryOrder?.id === order.id ? '4px solid #3b82f6' : '4px solid transparent'
                  }}>
                    <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{order.id} - {order.patientName}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '6px' }}>{order.testName}</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: order.status === 'Pending Auth' ? '#16a34a' : '#d97706' }}>
                      {order.status === 'Pending Auth' ? '✓ Submitted for Auth' : '⚠ Action Required'}
                    </div>
                  </div>
                ))}
                {labOrders.filter(o => o.status === 'Tech Entry' || o.status === 'Pending Auth').length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: lisTheme.fontSize }}>Queue is empty.</div>}
              </div>
            </div>

            {/* Entry Form */}
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: lisTheme.headerBg }}>Delta Validation & Entry {activeEntryOrder && `(${activeEntryOrder.patientName})`}</span>
                {activeEntryOrder && activeEntryOrder.status === 'Tech Entry' && (
                  <button onClick={() => {
                    setLabOrders(prev => prev.map(o => o.id === activeEntryOrder.id ? { ...o, status: 'Pending Auth' } : o));
                    addNotification('Sent to Pathologist', 'Results submitted to Checker Queue successfully.', 'success');
                    setActiveEntryOrder(null);
                  }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Save size={14} /> Submit to Pathologist
                  </button>
                )}
              </div>
              <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                {activeEntryOrder ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: lisTheme.fontSize }}>
                    <thead style={{ background: '#f1f5f9', textAlign: 'left' }}>
                      <tr>
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Parameter</th>
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Result Value</th>
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Delta Flag</th>
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Reference Range</th>
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryTests.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 12px', fontWeight: '600', color: '#1e293b' }}>{t.param}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <input 
                              type="text" 
                              value={t.result} 
                              onChange={(e) => handleResultChange(t.id, e.target.value)}
                              disabled={activeEntryOrder.status !== 'Tech Entry'}
                              style={{ 
                                width: '100px', 
                                border: `1px solid ${t.flag ? '#fca5a5' : lisTheme.borderColor}`, 
                                padding: '6px', borderRadius: '4px',
                                background: activeEntryOrder.status !== 'Tech Entry' ? '#f1f5f9' : (t.flag ? '#fef2f2' : 'white'),
                                color: t.flag ? '#dc2626' : '#334155',
                                fontWeight: t.flag ? '700' : '500',
                                boxShadow: t.flag ? '0 0 0 1px #fca5a5' : 'none'
                              }} 
                            />
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {t.flag && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', fontSize: '0.7rem' }}>{t.flag === 'H' ? 'HIGH ▲' : 'LOW ▼'}</span>}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748b' }}>{t.min} - {t.max}</td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{t.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <FileText size={40} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                    Select an order from the queue to enter and validate results.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. PATHOLOGIST AUTH (CHECKER) ================= */}
        {lisTab === 'auth' && (
          <div className="animate-slide-up" style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, height: '100%', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: lisTheme.headerBg, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={16} /> MD Pathologist Authorization Dashboard
              </span>
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(100% - 50px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: lisTheme.fontSize }}>
                <thead style={{ background: '#f1f5f9', textAlign: 'left', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Order ID</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Patient Name</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Test Profile</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Critical Flags</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {labOrders.filter(o => o.status === 'Pending Auth' || o.status === 'Authorized').length === 0 ? <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No reports pending authorization.</td></tr> : null}
                  {labOrders.filter(o => o.status === 'Pending Auth' || o.status === 'Authorized').map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #e2e8f0', background: order.status === 'Authorized' ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>{order.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{order.patientName}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{order.testName}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {order.status === 'Pending Auth' ? (
                           <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', fontSize: '0.7rem' }}>1 H, 1 L</span>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                        {order.status === 'Pending Auth' ? (
                          <>
                            <button onClick={() => {
                              setLabOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Authorized' } : o));
                              addNotification("Authorized", `Report ${order.id} electronically signed by Dr. Admin.`, "success");
                            }} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '600' }}>
                              Approve & Sign
                            </button>
                            <button style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '600' }}>
                              Reject
                            </button>
                          </>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Approved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 6. ISSUING ================= */}
        {lisTab === 'issuing' && (
           // Only pass authorized orders to the issuing component
          <LisResultIssuing labOrder={labOrders.find(o => o.status === 'Authorized')} addNotification={addNotification} />
        )}

        {/* ================= 7. QUALITY CONTROL (QC) ================= */}
        {lisTab === 'qc' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: lisTheme.headerBg, display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> QC Module - Levey-Jennings Chart</h3>
                <select style={{ padding: '6px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: '0.8rem' }}>
                  <option>Glucose (Level 1 Normal)</option>
                  <option>Uric Acid (Level 2 Pathological)</option>
                </select>
              </div>
              
              <div style={{ position: 'relative', height: '200px', borderLeft: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', marginLeft: '30px', marginBottom: '20px' }}>
                {/* SD Lines */}
                <div style={{ position: 'absolute', top: '20%', width: '100%', borderTop: '1px dashed #fca5a5', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', top: '50%', width: '100%', borderTop: '1px solid #94a3b8', zIndex: 1 }}></div>
                <div style={{ position: 'absolute', top: '80%', width: '100%', borderTop: '1px dashed #fca5a5', zIndex: 1 }}></div>
                
                {/* Labels */}
                <span style={{ position: 'absolute', left: '-35px', top: '15%', fontSize: '0.65rem', color: '#ef4444' }}>+2 SD</span>
                <span style={{ position: 'absolute', left: '-35px', top: '48%', fontSize: '0.65rem', color: '#64748b' }}>Mean</span>
                <span style={{ position: 'absolute', left: '-35px', top: '78%', fontSize: '0.65rem', color: '#ef4444' }}>-2 SD</span>

                {/* Data Points */}
                <div style={{ display: 'flex', justifyContent: 'space-between', height: '100%', alignItems: 'flex-end', padding: '0 10px', position: 'relative', zIndex: 2 }}>
                  {qcData.map((d, i) => {
                    const topPos = `${100 - ((d.val - 90) / 30) * 100}%`; // rough scaling
                    const isViolation = d.val > 110 || d.val < 90;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '20px' }}>
                        <div style={{ 
                          width: '8px', height: '8px', borderRadius: '50%', 
                          background: isViolation ? '#ef4444' : '#3b82f6', 
                          position: 'absolute', top: topPos,
                          boxShadow: isViolation ? '0 0 0 4px rgba(239, 68, 68, 0.2)' : 'none'
                        }}></div>
                        <span style={{ position: 'absolute', bottom: '-20px', fontSize: '0.65rem', color: '#64748b' }}>Day {d.day}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '30px' }}>
                <AlertTriangle size={20} color="#dc2626" />
                <div>
                  <div style={{ fontWeight: '700', color: '#991b1b', fontSize: '0.85rem' }}>Westgard Rule Violation: 1_2s Warning</div>
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Day 8 Glucose Control exceeded +2 Standard Deviations. Calibration required.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 8. OUTSOURCED LABS ================= */}
        {lisTab === 'outsource' && (
          <div className="animate-slide-up" style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, height: '100%', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: lisTheme.headerBg, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={16} /> Reference Lab Dispatch Management
              </span>
              <button style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: lisTheme.fontSize, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                New Dispatch
              </button>
            </div>
            <div style={{ overflowY: 'auto', height: 'calc(100% - 50px)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: lisTheme.fontSize }}>
                <thead style={{ background: '#f1f5f9', textAlign: 'left', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Batch ID</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Patient / Test</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Destination Lab</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outsourceQueue.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>{item.id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600' }}>{item.patient}</div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{item.test}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>{item.lab}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
                          background: item.status === 'Dispatched' ? '#e0e7ff' : '#fef3c7',
                          color: item.status === 'Dispatched' ? '#4338ca' : '#d97706'
                        }}>
                          {item.status} ({item.time})
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {item.status === 'Pending Pickup' ? (
                          <button onClick={() => {
                            setOutsourceQueue(prev => prev.map(o => o.id === item.id ? { ...o, status: 'Dispatched', time: 'Just Now' } : o));
                            addNotification("Courier Updated", `Batch ${item.id} marked as handed over to courier.`, "info");
                          }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '600' }}>
                            Mark Dispatched
                          </button>
                        ) : (
                          <button style={{ background: 'white', color: '#16a34a', border: '1px solid #16a34a', padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '600' }}>
                            Upload PDF Result
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 9. TAT ANALYTICS ================= */}
        {lisTab === 'tat' && (
          <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: '100%' }}>
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: lisTheme.headerBg, display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={18} /> Daily Turnaround Time (TAT) Compliance</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                    <span>Routine Biochemistry (Target: 4 Hrs)</span>
                    <span style={{ color: '#16a34a' }}>92% Compliant</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '92%', height: '100%', background: '#22c55e' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                    <span>STAT/Emergency (Target: 1 Hr)</span>
                    <span style={{ color: '#d97706' }}>78% Compliant</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '78%', height: '100%', background: '#f59e0b' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                    <span>Microbiology Cultures (Target: 48 Hrs)</span>
                    <span style={{ color: '#16a34a' }}>98% Compliant</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '98%', height: '100%', background: '#22c55e' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '40px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}` }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '12px' }}>Current Bottleneck Analysis</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', fontSize: '0.8rem', fontWeight: '600' }}>
                  <AlertTriangle size={16} /> 
                  Phase: "Tech Entry to Pathologist Auth" is averaging 45 mins (Target: 15 mins).
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: lisTheme.headerBg, display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} /> Pending TAT Violations (Live)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ padding: '12px', borderLeft: '4px solid #ef4444', background: '#fef2f2', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: '#991b1b', fontSize: '0.85rem' }}>STAT Trop-I (ER-992)</span>
                    <span style={{ fontWeight: '800', color: '#dc2626', fontSize: '0.85rem' }}>-12 mins (Breached)</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Stuck in: Phlebotomy Collection</div>
                </div>

                <div style={{ padding: '12px', borderLeft: '4px solid #f59e0b', background: '#fffbeb', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', color: '#b45309', fontSize: '0.85rem' }}>CBC Urgent (IPD-General)</span>
                    <span style={{ fontWeight: '800', color: '#d97706', fontSize: '0.85rem' }}>05 mins remaining</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309' }}>Stuck in: Pathologist Authorization</div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
