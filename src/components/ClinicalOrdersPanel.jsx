import React, { useState, useEffect } from 'react';
// Clinical Orders Panel — CPOE integrated
import {
  FlaskConical, Radio, Syringe, Building2, Pill,
  Send, CheckCircle, Clock, AlertTriangle, Zap,
  ChevronDown, ChevronUp, Activity, Loader2, Plus, X
} from 'lucide-react';

// ── Drug master (shortcode autocomplete) ──
const DRUG_MASTER = [
  { code: 'PCM', name: 'Tab Paracetamol',   dose: '500mg' },
  { code: 'PKT', name: 'Tab Panadol',        dose: '650mg' },
  { code: 'AMX', name: 'Cap Amoxicillin',    dose: '500mg' },
  { code: 'AZI', name: 'Tab Azithromycin',   dose: '500mg' },
  { code: 'IBU', name: 'Tab Ibuprofen',      dose: '400mg' },
  { code: 'PAN', name: 'Tab Pantoprazole',   dose: '40mg'  },
  { code: 'CET', name: 'Tab Cetirizine',     dose: '10mg'  },
  { code: 'BCO', name: 'Cap B-Complex',      dose: '1 Cap' },
  { code: 'CFL', name: 'Tab Ciprofloxacin',  dose: '500mg' },
  { code: 'AUG', name: 'Tab Augmentin',      dose: '625mg' },
  { code: 'ASP', name: 'Tab Aspirin',        dose: '75mg'  },
  { code: 'MTF', name: 'Tab Metformin',      dose: '500mg' },
  { code: 'ATR', name: 'Tab Atorvastatin',   dose: '10mg'  },
  { code: 'AML', name: 'Tab Amlodipine',     dose: '5mg'   },
  { code: 'OFX', name: 'Tab Ofloxacin',      dose: '200mg' },
];

// ─────────────────────────────────────────────
//  ACTION CATALOGUE
// ─────────────────────────────────────────────
const ACTION_CATALOGUE = [
  {
    category: 'Diagnostics',
    color: '#0d9488',       // teal-600
    bgLight: 'rgba(13,148,136,0.08)',
    borderColor: '#0d9488',
    icon: <FlaskConical size={16} />,
    options: ['Blood Test', 'Urine Test', 'ECG', 'EEG', 'CT Scan', 'MRI', 'Ultrasound', 'X-Ray']
  },
  {
    category: 'Nursing',
    color: '#8b5cf6',       // violet-500
    bgLight: 'rgba(139,92,246,0.08)',
    borderColor: '#8b5cf6',
    icon: <Syringe size={16} />,
    options: ['Injection', 'Cannulation', 'IV Fluids', 'Dressing', 'Observation']
  },
  {
    category: 'Patient Mgmt',
    color: '#f59e0b',       // amber-500
    bgLight: 'rgba(245,158,11,0.08)',
    borderColor: '#f59e0b',
    icon: <Building2 size={16} />,
    options: ['Admission', 'ICU Transfer', 'Surgery Required', 'Follow-up Visit', 'Emergency Monitoring', 'Discharge']
  },
  {
    category: 'Pharmacy',
    color: '#10b981',       // emerald-500
    bgLight: 'rgba(16,185,129,0.08)',
    borderColor: '#10b981',
    icon: <Pill size={16} />,
    options: ['Send Prescription', 'Urgent Medication']
  }
];

// Department routing map
const DEPT_MAP = {
  'Blood Test':            { dept: 'Lab',       badge: 'LAB',  color: '#0d9488' },
  'Urine Test':            { dept: 'Lab',       badge: 'LAB',  color: '#0d9488' },
  'ECG':                   { dept: 'Radiology', badge: 'RAD',  color: '#4f46e5' },
  'EEG':                   { dept: 'Radiology', badge: 'RAD',  color: '#4f46e5' },
  'CT Scan':               { dept: 'Radiology', badge: 'RAD',  color: '#4f46e5' },
  'MRI':                   { dept: 'Radiology', badge: 'RAD',  color: '#4f46e5' },
  'Ultrasound':            { dept: 'Radiology', badge: 'RAD',  color: '#4f46e5' },
  'X-Ray':                 { dept: 'Radiology', badge: 'RAD',  color: '#4f46e5' },
  'Injection':             { dept: 'Nursing',   badge: 'NRS',  color: '#8b5cf6' },
  'Cannulation':           { dept: 'Nursing',   badge: 'NRS',  color: '#8b5cf6' },
  'IV Fluids':             { dept: 'Nursing',   badge: 'NRS',  color: '#8b5cf6' },
  'Dressing':              { dept: 'Nursing',   badge: 'NRS',  color: '#8b5cf6' },
  'Observation':           { dept: 'Nursing',   badge: 'NRS',  color: '#8b5cf6' },
  'Admission':             { dept: 'IP Desk',   badge: 'IPD',  color: '#f59e0b' },
  'ICU Transfer':          { dept: 'IP Desk',   badge: 'IPD',  color: '#ef4444' },
  'Surgery Required':      { dept: 'OT Desk',   badge: 'OT',   color: '#ef4444' },
  'Follow-up Visit':       { dept: 'Reception', badge: 'REC',  color: '#6b7280' },
  'Emergency Monitoring':  { dept: 'ER',        badge: 'ER',   color: '#ef4444' },
  'Discharge':             { dept: 'Billing',   badge: 'BIL',  color: '#6b7280' },
  'Send Prescription':     { dept: 'Pharmacy',  badge: 'RX',   color: '#10b981' },
  'Urgent Medication':     { dept: 'Pharmacy',  badge: 'RX',   color: '#ef4444' }
};

const STATUS_COLORS = {
  'Pending':     { bg: '#fef3c7', text: '#92400e' },
  'Accepted':    { bg: '#dbeafe', text: '#1e40af' },
  'In Progress': { bg: '#ede9fe', text: '#5b21b6' },
  'Completed':   { bg: '#d1fae5', text: '#065f46' }
};

function generateQueueToken(dept) {
  const code = dept.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  return `QT-${code}-${String(Math.floor(100 + Math.random() * 900))}`;
}

// ─────────────────────────────────────────────
//  LIVE STATUS BADGE (with simulated progression)
// ─────────────────────────────────────────────
function LiveStatusBadge({ order, onStatusChange }) {
  useEffect(() => {
    if (order.status === 'Pending') {
      const t1 = setTimeout(() => onStatusChange(order.id, 'Accepted'), 3000);
      return () => clearTimeout(t1);
    }
    if (order.status === 'Accepted') {
      const t2 = setTimeout(() => onStatusChange(order.id, 'In Progress'), 6000);
      return () => clearTimeout(t2);
    }
  }, [order.status, order.id, onStatusChange]);

  const s = STATUS_COLORS[order.status] || STATUS_COLORS['Pending'];
  const isPending = order.status === 'Pending';
  const isInProgress = order.status === 'In Progress';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: '#fff',
      border: '1px solid #f1f5f9',
      borderRadius: '10px',
      gap: '10px',
      animation: 'slideInUp 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        {/* Dept badge */}
        <div style={{
          padding: '3px 8px',
          borderRadius: '5px',
          background: (DEPT_MAP[order.action]?.color || '#6b7280') + '20',
          color: DEPT_MAP[order.action]?.color || '#6b7280',
          fontWeight: '800',
          fontSize: '0.65rem',
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap'
        }}>
          {DEPT_MAP[order.action]?.badge || 'GEN'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.action}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
            {order.queueToken} • {order.priority}
          </div>
        </div>
      </div>
      {/* Status pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '20px',
        background: s.bg,
        color: s.text,
        fontSize: '0.7rem',
        fontWeight: '700',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}>
        {isPending && <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />}
        {isInProgress && <Activity size={10} style={{ animation: 'pulseGlow 1.5s infinite' }} />}
        {order.status === 'Completed' && <CheckCircle size={10} />}
        {order.status === 'Accepted' && <CheckCircle size={10} />}
        {order.status}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PANEL COMPONENT
// ─────────────────────────────────────────────
export default function ClinicalOrdersPanel({
  patient,
  addNotification,
  handlePostCharge,
  setLabOrders,
  setRadiologyOrders,
  setPharmacyOrders,
  setNursingOrders,
  setIpAdmissions,
  setOpQueue
}) {
  const [selectedActions, setSelectedActions] = useState([]);
  const [priority, setPriority] = useState('Normal');
  const [instructions, setInstructions] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchedOrders, setDispatchedOrders] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Diagnostics');

  // ── CPOE Prescription states (used when Pharmacy tab is active) ──
  const [rxDrug, setRxDrug] = useState('');
  const [rxDose, setRxDose] = useState('');
  const [rxFreq, setRxFreq] = useState('1-0-1');
  const [rxDuration, setRxDuration] = useState('');
  const [rxInstructions, setRxInstructions] = useState('After Food');
  const [rxList, setRxList] = useState([]);
  const [showDrugSugg, setShowDrugSugg] = useState(false);
  const [isRxSent, setIsRxSent] = useState(false);

  const addRxItem = () => {
    if (!rxDrug) return;
    setRxList(prev => [...prev, { drug: rxDrug, dose: rxDose, freq: rxFreq, duration: rxDuration || 'As needed', instructions: rxInstructions }]);
    setRxDrug(''); setRxDose(''); setRxDuration('');
  };

  const buildRxString = () => rxList.map(rx => {
    let f = rx.freq === '1-1-1' ? 3 : rx.freq === '1-0-1' ? 2 : 1;
    let qty = f * (parseInt(rx.duration) || 5);
    return `${rx.drug.replace(/^(Tab |Cap |Syr )/i,'').trim()} ${rx.dose} x${qty} (${rx.freq} – ${rx.instructions})`;
  }).join(', ');

  const handleSendPrescription = () => {
    if (rxList.length === 0) { addNotification('Empty Rx', 'Add medicines before sending.', 'warning'); return; }
    const queueToken = generateQueueToken('Pharmacy');
    const timestamp = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPharmacyOrders(prev => [...prev, {
      id: 'RX-' + Math.floor(100 + Math.random() * 900),
      uhid: patient?.uhid || patient?.id,
      patientName: patient?.name,
      medicines: buildRxString(),
      status: priority === 'Emergency' ? 'URGENT Pending' : 'Pending',
      priority,
      doctor: `Dr. ${patient?.doctor || 'Attending'}`,
      queueToken,
      timestamp
    }]);
    const newOrder = { id: Date.now(), action: 'Prescription Sent', priority, status: 'Pending', queueToken };
    setDispatchedOrders(prev => [newOrder, ...prev]);
    setRxList([]); setRxDrug(''); setRxDose(''); setRxDuration('');
    setIsRxSent(true);
    setTimeout(() => setIsRxSent(false), 2500);
    addNotification('Rx Dispatched', `Prescription sent to Pharmacy for ${patient?.name}.`, 'success');
  };

  const toggleAction = (option) => {
    setSelectedActions(prev =>
      prev.includes(option) ? prev.filter(a => a !== option) : [...prev, option]
    );
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setDispatchedOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleDispatch = () => {
    if (selectedActions.length === 0) {
      addNotification('No Orders', 'Please select at least one clinical action.', 'warning');
      return;
    }
    if (!patient) return;

    setIsDispatching(true);

    const timestamp = 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrders = selectedActions.map(action => {
      const deptInfo = DEPT_MAP[action] || { dept: 'General', badge: 'GEN', color: '#6b7280' };
      const queueToken = generateQueueToken(deptInfo.dept);

      const baseOrder = {
        id: Date.now() + Math.random(),
        uhid: patient.uhid || patient.id,
        patientName: patient.name,
        doctor: `Dr. ${patient.doctor || 'Attending'}`,
        action,
        priority,
        status: 'Pending',
        queueToken,
        timestamp,
        instructions
      };

      // ── Route to department state ──
      if (action === 'Blood Test' || action === 'Urine Test') {
        setLabOrders(prev => [...prev, {
          id: 'LAB-' + Math.floor(1000 + Math.random() * 9000),
          uhid: baseOrder.uhid,
          patientName: baseOrder.patientName,
          testName: action,
          status: priority === 'Emergency' ? 'STAT Pending' : 'Sample Pending',
          doctor: baseOrder.doctor,
          priority,
          queueToken,
          timestamp
        }]);
        if (priority !== 'Normal') handlePostCharge(baseOrder.uhid, `STAT Lab: ${action}`, 600, 'Lab_Desk');
      }

      if (['ECG', 'EEG', 'CT Scan', 'MRI', 'Ultrasound', 'X-Ray'].includes(action)) {
        setRadiologyOrders(prev => [...prev, {
          id: 'RAD-' + Math.floor(100 + Math.random() * 900),
          uhid: baseOrder.uhid,
          patientName: baseOrder.patientName,
          scanType: action,
          status: priority === 'Emergency' ? 'STAT Pending' : 'Pending',
          doctor: baseOrder.doctor,
          priority,
          queueToken,
          timestamp
        }]);
      }

      if (['Injection', 'Cannulation', 'IV Fluids', 'Dressing', 'Observation'].includes(action)) {
        if (setNursingOrders) {
          setNursingOrders(prev => [...prev, {
            id: 'NRS-' + Math.floor(100 + Math.random() * 900),
            uhid: baseOrder.uhid,
            patientName: baseOrder.patientName,
            procedure: action,
            status: 'Pending',
            doctor: baseOrder.doctor,
            priority,
            queueToken,
            instructions,
            timestamp
          }]);
        }
        handlePostCharge(baseOrder.uhid, `Nursing: ${action}`, 150, 'Nursing_Desk');
      }

      if (action === 'Send Prescription' || action === 'Urgent Medication') {
        const rxStr = rxList.length > 0 ? buildRxString() : (instructions || `${action} — refer prescription`);
        setPharmacyOrders(prev => [...prev, {
          id: 'RX-' + Math.floor(100 + Math.random() * 900),
          uhid: baseOrder.uhid,
          patientName: baseOrder.patientName,
          medicines: rxStr,
          status: action === 'Urgent Medication' ? 'URGENT Pending' : 'Pending',
          priority,
          doctor: baseOrder.doctor,
          queueToken,
          timestamp
        }]);
      }

      if (action === 'Admission' || action === 'ICU Transfer') {
        if (setIpAdmissions) {
          setIpAdmissions(prev => [...prev, {
            admId: 'ADM-' + Math.floor(100 + Math.random() * 900),
            uhid: baseOrder.uhid,
            name: baseOrder.patientName,
            ward: action === 'ICU Transfer' ? 'ICU' : 'General',
            bed: '',
            admDate: new Date().toISOString().split('T')[0],
            doctor: baseOrder.doctor,
            diagnosis: instructions || 'Referred from OPD',
            deposit: 0,
            status: 'Active',
            notes: [`Admitted via OPD Order — Priority: ${priority}`]
          }]);
          handlePostCharge(baseOrder.uhid, `IP Admission (${action})`, action === 'ICU Transfer' ? 8000 : 2000, 'Admission_Desk');
        }
      }

      if (action === 'Discharge') {
        if (setOpQueue) {
          setOpQueue(prev => prev.map(p =>
            (p.uhid === baseOrder.uhid || p.tokenNo === patient.tokenNo)
              ? { ...p, status: 'Action Pending' }
              : p
          ));
        }
      }

      return baseOrder;
    });

    // Add to local order tracker
    setTimeout(() => {
      setDispatchedOrders(prev => [...newOrders, ...prev]);
      setSelectedActions([]);
      setInstructions('');
      setIsDispatching(false);
      addNotification(
        '🚀 Clinical Orders Dispatched',
        `${newOrders.length} order(s) routed to departments for ${patient.name}. Priority: ${priority}.`,
        'success'
      );
    }, 600);
  };

  const PRIORITY_CONFIG = {
    Normal:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: <Clock size={14}/> },
    Urgent:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <AlertTriangle size={14}/> },
    Emergency: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: <Zap size={14}/> }
  };

  const currentCat = ACTION_CATALOGUE.find(c => c.category === activeCategory);

  return (
    <div className="glass-panel" style={{
      borderRadius: 'var(--radius-lg)',
      borderTop: '4px solid #0d9488',
      overflow: 'hidden',
      animation: 'slideInUp 0.35s ease'
    }}>

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
          background: 'rgba(13,148,136,0.04)'
        }}
        onClick={() => setIsExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(13,148,136,0.15)', color: '#0d9488' }}>
            <Radio size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Clinical Action Orders
              {dispatchedOrders.length > 0 && (
                <span style={{ background: '#0d9488', color: '#fff', fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>
                  {dispatchedOrders.length} Active
                </span>
              )}
            </h4>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0, fontWeight: '500' }}>
              Route orders to departments instantly
            </p>
          </div>
        </div>
        <div style={{ color: '#94a3b8' }}>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* ── Live Order Status Strip ── */}
          {dispatchedOrders.length > 0 && (
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Live Order Tracker
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {dispatchedOrders.map(order => (
                  <LiveStatusBadge key={order.id} order={order} onStatusChange={updateOrderStatus} />
                ))}
              </div>
            </div>
          )}

          {/* ── Category Tabs ── */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
            {ACTION_CATALOGUE.map(cat => (
              <button
                key={cat.category}
                type="button"
                onClick={() => setActiveCategory(cat.category)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  border: `1px solid ${activeCategory === cat.category ? cat.color : '#f1f5f9'}`,
                  borderRadius: '8px',
                  background: activeCategory === cat.category ? cat.bgLight : 'transparent',
                  color: activeCategory === cat.category ? cat.color : '#94a3b8',
                  fontWeight: activeCategory === cat.category ? '700' : '500',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-sans)'
                }}
              >
                {cat.icon}
                {cat.category}
              </button>
            ))}
          </div>

          {/* ── Action Grid OR Pharmacy CPOE ── */}
          {currentCat && activeCategory !== 'Pharmacy' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
              {currentCat.options.map(option => {
                const isSelected = selectedActions.includes(option);
                const deptInfo = DEPT_MAP[option];
                return (
                  <div key={option} onClick={() => toggleAction(option)} style={{
                    position: 'relative', padding: '12px 10px',
                    border: `1.5px solid ${isSelected ? currentCat.color : '#f1f5f9'}`,
                    borderRadius: '10px', background: isSelected ? currentCat.bgLight : '#fafafa',
                    cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '6px', minHeight: '72px', justifyContent: 'center'
                  }}>
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '6px', right: '6px', width: '16px', height: '16px', borderRadius: '50%', background: currentCat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={10} color="#fff" />
                      </div>
                    )}
                    {deptInfo && (
                      <div style={{ fontSize: '0.6rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: deptInfo.color + '20', color: deptInfo.color, letterSpacing: '0.5px' }}>
                        {deptInfo.badge}
                      </div>
                    )}
                    <span style={{ fontSize: '0.78rem', fontWeight: isSelected ? '700' : '500', color: isSelected ? '#1e293b' : '#475569', lineHeight: 1.3, fontFamily: 'var(--font-sans)' }}>
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PHARMACY CPOE (shown when Pharmacy tab active) ── */}
          {activeCategory === 'Pharmacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Drug name with autocomplete */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Drug Name or Code (e.g., PKT, PCM)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Tab Paracetamol or PKT"
                  value={rxDrug}
                  onChange={e => { setRxDrug(e.target.value); setShowDrugSugg(true); }}
                  onFocus={() => setShowDrugSugg(true)}
                  onBlur={() => setTimeout(() => setShowDrugSugg(false), 180)}
                />
                {showDrugSugg && rxDrug && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '160px', overflowY: 'auto' }}>
                    {DRUG_MASTER.filter(d => d.code.toLowerCase().includes(rxDrug.toLowerCase()) || d.name.toLowerCase().includes(rxDrug.toLowerCase())).map(drug => (
                      <div key={drug.code}
                        onMouseDown={() => { setRxDrug(drug.name); if (!rxDose) setRxDose(drug.dose); setShowDrugSugg(false); }}
                        style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>{drug.name}</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: '#d1fae5', color: '#065f46' }}>{drug.code} · {drug.dose}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dosage + Frequency */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Dosage</label>
                  <input type="text" className="form-control" placeholder="e.g. 500mg" value={rxDose} onChange={e => setRxDose(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Frequency</label>
                  <select className="form-control" value={rxFreq} onChange={e => setRxFreq(e.target.value)}>
                    <option value="1-0-1">1-0-1 (BD – Twice daily)</option>
                    <option value="1-1-1">1-1-1 (TDS – Three times)</option>
                    <option value="1-0-0">1-0-0 (OD – Morning)</option>
                    <option value="0-0-1">0-0-1 (OD – Night)</option>
                    <option value="0-1-0">0-1-0 (OD – Afternoon)</option>
                    <option value="SOS">SOS (As needed)</option>
                  </select>
                </div>
              </div>

              {/* Duration + Instructions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Duration</label>
                  <input type="text" className="form-control" placeholder="e.g. 5 Days" value={rxDuration} onChange={e => setRxDuration(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Instructions</label>
                  <select className="form-control" value={rxInstructions} onChange={e => setRxInstructions(e.target.value)}>
                    <option>After Food</option>
                    <option>Before Food</option>
                    <option>Empty Stomach</option>
                    <option>With Water</option>
                    <option>At Bedtime</option>
                  </select>
                </div>
              </div>

              {/* Add to list button */}
              <button type="button" onClick={addRxItem} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '9px', border: '1.5px dashed #10b981', borderRadius: '8px', background: 'transparent', color: '#10b981', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                <Plus size={15} /> Add Medicine to List
              </button>

              {/* Medicine list */}
              <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px', minHeight: '80px', maxHeight: '180px', overflowY: 'auto' }}>
                {rxList.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', marginTop: '16px' }}>No medicines prescribed yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {rxList.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>{item.drug} <span style={{ color: '#0d9488' }}>{item.dose}</span></div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{item.freq} · {item.duration} · {item.instructions}</div>
                        </div>
                        <button type="button" onClick={() => setRxList(rxList.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transfer to Pharmacy button */}
              <button
                type="button"
                onClick={handleSendPrescription}
                style={{
                  width: '100%', padding: '13px', border: 'none', borderRadius: '10px',
                  background: rxList.length === 0 ? '#f1f5f9' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: rxList.length === 0 ? '#94a3b8' : '#fff',
                  fontWeight: '800', fontSize: '0.9rem',
                  cursor: rxList.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: rxList.length > 0 ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {isRxSent ? <><CheckCircle size={18} /> Sent to Pharmacy!</> : <><Send size={18} /> Transfer e-Prescription to Pharmacy</>}
              </button>
            </div>
          )}

          {/* ── Priority Selector ── */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Priority
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {Object.entries(PRIORITY_CONFIG).map(([level, cfg]) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  style={{
                    flex: 1,
                    padding: '9px 6px',
                    border: `1.5px solid ${priority === level ? cfg.color : '#f1f5f9'}`,
                    borderRadius: '8px',
                    background: priority === level ? cfg.bg : 'transparent',
                    color: priority === level ? cfg.color : '#94a3b8',
                    fontWeight: priority === level ? '700' : '500',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cfg.icon}
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* ── Instructions ── */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Doctor Instructions / Notes
            </label>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="E.g. Fasting required, STAT processing, contrast-enhanced CT..."
              style={{
                width: '100%',
                minHeight: '72px',
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-sans)',
                color: '#1e293b',
                resize: 'vertical',
                outline: 'none',
                background: '#fff',
                lineHeight: 1.5,
                boxSizing: 'border-box'
              }}
              onFocus={e => (e.target.style.borderColor = '#0d9488')}
              onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
            />
          </div>

          {/* ── Selected Summary ── */}
          {selectedActions.length > 0 && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(13,148,136,0.06)',
              borderRadius: '10px',
              border: '1px solid rgba(13,148,136,0.2)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0d9488', marginRight: '4px' }}>
                Queued ({selectedActions.length}):
              </span>
              {selectedActions.map(a => (
                <span key={a} style={{
                  padding: '3px 10px',
                  borderRadius: '20px',
                  background: DEPT_MAP[a]?.color + '20' || '#f1f5f9',
                  color: DEPT_MAP[a]?.color || '#475569',
                  fontSize: '0.72rem',
                  fontWeight: '600'
                }}>
                  {a}
                </span>
              ))}
            </div>
          )}

          {/* ── Dispatch Button ── */}
          <button
            onClick={handleDispatch}
            type="button"
            disabled={selectedActions.length === 0 || isDispatching}
            style={{
              width: '100%',
              padding: '13px',
              border: 'none',
              borderRadius: '10px',
              background: selectedActions.length === 0
                ? '#f1f5f9'
                : 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
              color: selectedActions.length === 0 ? '#94a3b8' : '#fff',
              fontWeight: '800',
              fontSize: '0.9rem',
              cursor: selectedActions.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'var(--font-sans)',
              boxShadow: selectedActions.length > 0 ? '0 4px 14px rgba(13,148,136,0.35)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isDispatching ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Dispatching Orders…</>
            ) : (
              <><Send size={18} /> Dispatch Clinical Orders to Departments</>
            )}
          </button>
          {selectedActions.length > 0 && (
            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '-10px', fontStyle: 'italic' }}>
              {selectedActions.length} order(s) will be routed automatically · Priority: <strong style={{ color: PRIORITY_CONFIG[priority].color }}>{priority}</strong>
            </p>
          )}

        </div>
      )}

      {/* Spin keyframe (inline) */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
