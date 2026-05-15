import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Shield, ShieldCheck, Users, AlertTriangle, RefreshCw, CheckCircle, Clock, Barcode, ChevronRight, Search, Plus, X, Settings, Edit, HelpCircle } from 'lucide-react';

export default function AnalyzerGateway({ labOrders, setLabOrders, addNotification, theme = {} }) {
  // ------------------------------------------------------------------
  // 🗂️ SUB-TABS MAPPING
  // ------------------------------------------------------------------
  const [gatewayTab, setGatewayTab] = useState('dashboard'); // dashboard, connection_log, worklist, host_query, operators, preview, autoval_rules

  // Default Lis Theme fallbacks
  const lisTheme = {
    bg: theme.bg || '#f8fafc',
    borderColor: theme.borderColor || '#cbd5e1',
    headerBg: theme.headerBg || '#1e3a8a',
    fontSize: theme.fontSize || '0.75rem',
    ...theme
  };

  // ------------------------------------------------------------------
  // 📊 FEATURE 1: Analyzer Connection Database & State
  // ------------------------------------------------------------------
  const [analyzers, setAnalyzers] = useState([
    {
      id: 'sysmex-1',
      name: 'Sysmex XN-1000',
      ip: '192.168.2.21',
      port: '6001',
      protocol: 'HL7 v2.5',
      status: 'Connected', // Connected, Disconnected, Timeout
      latency: 12,
      uptime: 99.8,
      encrypted: true,
      autoReconnect: true,
      sessionTimeout: 15,
      whitelist: '192.168.2.21,192.168.2.100',
      lastPing: new Date().toLocaleTimeString()
    },
    {
      id: 'cobas-1',
      name: 'Roche Cobas c311',
      ip: '192.168.2.22',
      port: '5002',
      protocol: 'ASTM E1394',
      status: 'Connected',
      latency: 34,
      uptime: 99.4,
      encrypted: false,
      autoReconnect: true,
      sessionTimeout: 10,
      whitelist: '192.168.2.22,192.168.2.100',
      lastPing: new Date().toLocaleTimeString()
    },
    {
      id: 'vitek-1',
      name: 'bioMérieux Vitek 2',
      ip: '192.168.2.23',
      port: '5003',
      protocol: 'LIS2-A2',
      status: 'Disconnected',
      latency: 0,
      uptime: 87.2,
      encrypted: true,
      autoReconnect: false,
      sessionTimeout: 20,
      whitelist: '192.168.2.23',
      lastPing: 'Never'
    }
  ]);

  const [connectionLogs, setConnectionLogs] = useState([
    { time: '14:30:01', analyzer: 'Sysmex XN-1000', event: 'Connected', duration: 0, method: 'Auto', triggeredBy: 'SYSTEM' },
    { time: '14:15:22', analyzer: 'Roche Cobas c311', event: 'Reconnected', duration: 4.5, method: 'Auto', triggeredBy: 'SYSTEM' },
    { time: '14:10:52', analyzer: 'Roche Cobas c311', event: 'Disconnected', duration: 4.5, method: 'Manual', triggeredBy: 'UNPLUGGED' },
    { time: '13:00:00', analyzer: 'bioMérieux Vitek 2', event: 'Timeout', duration: 90, method: 'Manual', triggeredBy: 'SYSTEM' }
  ]);

  // Ping simulation effect
  useEffect(() => {
    const pingInterval = setInterval(() => {
      setAnalyzers(prev => prev.map(az => {
        if (az.status === 'Connected') {
          const newLatency = Math.floor(Math.random() * 40) + 5;
          return { ...az, latency: newLatency, lastPing: new Date().toLocaleTimeString() };
        }
        return az;
      }));
    }, 30000); // Auto-Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, []);

  const handleForceReconnect = (id) => {
    setAnalyzers(prev => prev.map(az => {
      if (az.id === id) {
        logConnectionEvent(az.name, 'Reconnected', 'Manual', 'ADMIN_TECH');
        addNotification('Connection Restored', `${az.name} has successfully re-established socket sync.`, 'success');
        return { ...az, status: 'Connected', latency: 15 };
      }
      return az;
    }));
  };

  const handlePingNow = (id) => {
    setAnalyzers(prev => prev.map(az => {
      if (az.id === id) {
        const success = Math.random() > 0.1; // 90% success mock
        if (success) {
          addNotification('Ping Success', `${az.name} responded in ${Math.floor(Math.random() * 20) + 5}ms`, 'info');
          return { ...az, status: 'Connected', latency: Math.floor(Math.random() * 20) + 5, lastPing: new Date().toLocaleTimeString() };
        } else {
          addNotification('Ping Timeout', `No echo received from ${az.name} (${az.ip}:${az.port})`, 'warning');
          return { ...az, status: 'Timeout', latency: 0 };
        }
      }
      return az;
    }));
  };

  const logConnectionEvent = (name, event, method, user) => {
    const newLog = {
      time: new Date().toLocaleTimeString(),
      analyzer: name,
      event,
      duration: event === 'Reconnected' ? Math.floor(Math.random() * 10) : 0,
      method,
      triggeredBy: user
    };
    setConnectionLogs(prev => [newLog, ...prev]);
  };

  // ------------------------------------------------------------------
  // 📤 FEATURE 2: Worklist Transmission & Load Balancing State
  // ------------------------------------------------------------------
  const [worklistOrders, setWorklistOrders] = useState([
    { id: 'WL-8812', labNo: 'LAB-101', patient: 'Sunil Kumar', tests: 'CBC, HbA1c', priority: 'Urgent', analyzer: 'Sysmex XN-1000', sent: true, ack: true, time: '13:45' },
    { id: 'WL-8813', labNo: 'LAB-102', patient: 'Anjali Sharma', tests: 'Lipid Profile', priority: 'Routine', analyzer: 'Roche Cobas c311', sent: true, ack: true, time: '13:48' }
  ]);

  const [hostQueries, setHostQueries] = useState([
    { time: '14:45:12', barcode: 'LAB-101', analyzer: 'Sysmex XN-1000', found: true, sentBack: true, latency: 250 },
    { time: '14:46:30', barcode: 'LAB-102', analyzer: 'Roche Cobas c311', found: true, sentBack: true, latency: 410 }
  ]);

  const [isLoadBalancing, setIsLoadBalancing] = useState(false);
  const [isWorklistModalOpen, setIsWorklistModalOpen] = useState(false);

  const handleTransmitWorklist = (order, analyzerName) => {
    const newWl = {
      id: `WL-${Math.floor(1000 + Math.random() * 9000)}`,
      labNo: order.id,
      patient: order.patientName,
      tests: order.testName,
      priority: order.isStat ? 'STAT' : 'Routine',
      analyzer: analyzerName,
      sent: true,
      ack: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setWorklistOrders(prev => [newWl, ...prev]);
    addNotification('Worklist Dispatched', `Successfully pushed ${order.testName} orders to ${analyzerName}.`, 'success');
  };

  // ------------------------------------------------------------------
  // 👥 FEATURE 3: Operator Certifications State
  // ------------------------------------------------------------------
  const [certifications, setCertifications] = useState([
    { id: 1, name: 'Rajesh K', analyzer: 'Sysmex XN-1000', certified: true, expiry: '2026-12-15', score: 94 },
    { id: 2, name: 'Deepa S', analyzer: 'Roche Cobas c311', certified: true, expiry: '2026-11-20', score: 88 },
    { id: 3, name: 'Admin Tech', analyzer: 'Sysmex XN-1000', certified: true, expiry: '2026-05-28', score: 100 }, // Nearing expiry!
    { id: 4, name: 'Intern John', analyzer: 'bioMérieux Vitek 2', certified: false, expiry: '2025-01-01', score: 55 } // Expired/Not cert
  ]);

  const [activeOperators, setActiveOperators] = useState({
    'sysmex-1': 'Admin Tech',
    'cobas-1': 'Deepa S',
    'vitek-1': 'None'
  });

  // ------------------------------------------------------------------
  // 📝 FEATURE 4: Pending Results & Result Preview Deck State
  // ------------------------------------------------------------------
  const [pendingResults, setPendingResults] = useState([
    {
      id: 1,
      sampleId: 'LAB-101',
      testCode: 'hb',
      testName: 'Hemoglobin',
      value: 13.2,
      unit: 'g/dL',
      min: 12.0,
      max: 16.0,
      flag: 'Normal',
      hli: 0.02,
      rawFlag: 'OK',
      decodedFlag: 'Normal Distribution',
      analyzer: 'Sysmex XN-1000',
      time: '14:55'
    },
    {
      id: 2,
      sampleId: 'LAB-101',
      testCode: 'wbc',
      testName: 'Total WBC Count',
      value: 18200, // HIGH
      unit: 'cells/µL',
      min: 4000,
      max: 11000,
      flag: 'High',
      hli: 0.05,
      rawFlag: 'WBC Abn Scatter',
      decodedFlag: 'Abnormal white cell population - manual differential recommended',
      analyzer: 'Sysmex XN-1000',
      time: '14:55'
    },
    {
      id: 3,
      sampleId: 'LAB-102',
      testCode: 'chol',
      testName: 'Total Cholesterol',
      value: 285, // HIGH
      unit: 'mg/dL',
      min: 120,
      max: 200,
      flag: 'High',
      hli: 1.25, // Critical Lipemia Warning
      rawFlag: 'LIPEMIA_POS',
      decodedFlag: 'Lipemic specimen detected - Verify clinically',
      analyzer: 'Roche Cobas c311',
      time: '14:58'
    },
    {
      id: 4,
      sampleId: 'LAB-104',
      testCode: 'pot',
      testName: 'Serum Potassium',
      value: 2.2, // CRITICAL LOW
      unit: 'mEq/L',
      min: 3.5,
      max: 5.1,
      flag: 'Critical Low',
      hli: 0.01,
      rawFlag: 'CRIT_L',
      decodedFlag: 'Panic Level: Contact prescribing clinician immediately!',
      analyzer: 'Roche Cobas c311',
      time: '15:02'
    }
  ]);

  const [resultOverrides, setResultOverrides] = useState([]);
  const [overridingResult, setOverridingResult] = useState(null);
  const [overrideVal, setOverrideVal] = useState('');
  const [overrideReason, setOverrideReason] = useState('Instrument error');
  const [overrideDoc, setOverrideDoc] = useState('Dr. Vinod');

  const handleApplyOverride = () => {
    if (!overridingResult) return;
    const originalVal = overridingResult.value;
    const newRecord = {
      sampleId: overridingResult.sampleId,
      testCode: overridingResult.testCode,
      originalValue: originalVal,
      overrideValue: parseFloat(overrideVal) || overrideVal,
      overrideReason,
      authorizedBy: overrideDoc,
      overriddenBy: 'TECH_001',
      overriddenAt: new Date().toLocaleTimeString()
    };
    
    setResultOverrides(prev => [...prev, newRecord]);
    setPendingResults(prev => prev.map(r => r.id === overridingResult.id ? { 
      ...r, 
      value: overrideVal, 
      flag: 'Overridden',
      decodedFlag: `[Tech Override] Original: ${originalVal} | Authorized: ${overrideDoc}` 
    } : r));

    addNotification('Result Overridden', `Adjusted ${overridingResult.testName} to ${overrideVal}. Audit logged.`, 'warning');
    setOverridingResult(null);
  };

  // ------------------------------------------------------------------
  // ⚙️ FEATURE 5: Auto-Validation Rules Engine State
  // ------------------------------------------------------------------
  const [autovalRules, setAutovalRules] = useState([
    { id: 1, name: 'Range Bound Safe Release', type: 'Result Range', condition: 'Inside Ref Range', action: 'Auto-Release', active: true },
    { id: 2, name: 'Instrument Flag Gatekeeper', type: 'Instrument Flag', condition: 'No Warnings', action: 'Hold for Review', active: true },
    { id: 3, name: 'Lipemia Filter', type: 'HLI Index', condition: 'Lipemia < 1.0', action: 'Hold for Review', active: true },
    { id: 4, name: 'QC Safety Block', type: 'QC Run Status', condition: 'QC Passed < 24h', action: 'Block Release', active: true }
  ]);

  // Dynamic Auto-Validation dashboard KPI mocks
  const autoValKPI = {
    released: 142,
    held: 18,
    blocked: 3
  };

  const toggleRule = (id) => {
    setAutovalRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
    addNotification('Rule Configuration Saved', 'Auto-validation parameters updated.', 'info');
  };

  // ------------------------------------------------------------------
  // ⚖️ FEATURE 6: Delta Check Engine State
  // ------------------------------------------------------------------
  const [deltaAcknowledged, setDeltaAcknowledged] = useState({});
  const [historicalResults, setHistoricalResults] = useState({
    'LAB-101-hb': { val: 14.1, time: '48h ago', delta: -6.3 },
    'LAB-101-wbc': { val: 9800, time: '48h ago', delta: +85.7 }, // Massively high delta!
    'LAB-102-chol': { val: 240, time: '7 days ago', delta: +18.75 }
  });

  // ------------------------------------------------------------------
  // 📈 FEATURE 7: Advanced QC Charts & Westgard Engine State
  // ------------------------------------------------------------------
  const [qcLots, setQcLots] = useState([
    { id: 'L1-2026', analyte: 'Hemoglobin', level: 'Level 1 (Low)', mean: 8.2, sd: 0.2, targetUnit: 'g/dL' },
    { id: 'L2-2026', analyte: 'Hemoglobin', level: 'Level 2 (Normal)', mean: 13.5, sd: 0.3, targetUnit: 'g/dL' }
  ]);
  const [selectedQcAnalyte, setSelectedQcAnalyte] = useState('Hemoglobin');
  const [selectedQcLevel, setSelectedQcLevel] = useState('L2-2026');
  
  const [qcRuns, setQcRuns] = useState([
    { day: 1, val: 13.4 }, { day: 2, val: 13.6 }, { day: 3, val: 13.5 }, { day: 4, val: 13.2 },
    { day: 5, val: 13.8 }, { day: 6, val: 13.9 }, { day: 7, val: 13.4 }, { day: 8, val: 14.2 }, // Exceeds 2SD
    { day: 9, val: 13.5 }, { day: 10, val: 13.6 }
  ]);

  const [westgardAlerts, setWestgardAlerts] = useState([
    { time: '08:00 AM', type: '1_2s Warning', analyte: 'Hemoglobin', level: 'L2-2026', status: 'Acknowledged', code: 'W1' },
    { time: 'Yesterday', type: '2_2s Reject', analyte: 'Glucose', level: 'L1-Chem', status: 'Resolved', code: 'R1' }
  ]);

  // ------------------------------------------------------------------
  // 🧪 FEATURE 8: Reagent & Calibration Tracker State
  // ------------------------------------------------------------------
  const [reagentInventory, setReagentInventory] = useState([
    { name: 'Sysmex Cellpack DCL', lot: 'SP-4910A', pct: 74, expiry: '2026-08-30', state: 'Normal', analyzer: 'Sysmex XN-1000' },
    { name: 'Cobas Cleaner Solution', lot: 'CS-882', pct: 18, expiry: '2026-06-10', state: 'Critical', analyzer: 'Roche Cobas c311' },
    { name: 'Cobas ALTL Reagent', lot: 'ALT-29', pct: 42, expiry: '2026-10-15', state: 'Normal', analyzer: 'Roche Cobas c311' }
  ]);

  const [calibrationSchedules, setCalibrationSchedules] = useState([
    { test: 'Hemoglobin Calibration', status: 'Passed', nextDue: '2026-06-01', analyzer: 'Sysmex XN-1000' },
    { test: 'Total Cholesterol Calib', status: 'Due Now', nextDue: '2026-05-15', analyzer: 'Roche Cobas c311' }
  ]);

  // ------------------------------------------------------------------
  // ⏳ FEATURE 9: Partial Result & Rerun Protocols State
  // ------------------------------------------------------------------
  const [partialLogs, setPartialLogs] = useState([
    { sampleId: 'LAB-103', received: 3, expected: 4, pending: 'Platelets', minutesLeft: 18, analyzer: 'Sysmex XN-1000' }
  ]);

  // Auto partial countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setPartialLogs(prev => prev.map(p => ({
        ...p,
        minutesLeft: p.minutesLeft > 0 ? p.minutesLeft - 1 : 0
      })));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // ------------------------------------------------------------------
  // 🛣️ FEATURE 10: Auto-Fetch & Smart Result Routing State
  // ------------------------------------------------------------------
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);
  const [routingRules, setRoutingRules] = useState([
    { id: 1, category: 'STAT Patient Specimen', match: 'STAT', destination: 'EMR Fast-Track Queue', active: true },
    { id: 2, category: 'Routine Patient Specimen', match: 'Routine', destination: 'Doctor Outpatient Panel', active: true },
    { id: 3, category: 'QC Run Control', match: 'QC Control', destination: 'Supervisor QC Ledger', active: true }
  ]);

  // ------------------------------------------------------------------
  // 🪞 FEATURE 11: Reflex Rules Matrix State
  // ------------------------------------------------------------------
  const [reflexRules, setReflexRules] = useState([
    { id: 1, triggerTest: 'WBC Count', criteria: '> 50.0 x10³/µL', reflexAction: 'Manual Differential Slide', autoAdd: true },
    { id: 2, triggerTest: 'TSH', criteria: '> 10.0 uIU/mL', reflexAction: 'Free T4 Titer', autoAdd: true }
  ]);

  // ------------------------------------------------------------------
  // 🚨 FEATURE 12: Critical Callback Logger State
  // ------------------------------------------------------------------
  const [isCriticalModalOpen, setIsCriticalModalOpen] = useState(false);
  const [activeCriticalLog, setActiveCriticalLog] = useState(null);
  const [criticalCallbacks, setCriticalCallbacks] = useState([
    { id: 1, sampleId: 'LAB-999', analyte: 'Potassium', val: '2.2', verifiedBy: 'Dr. Sarah Connor', time: '08:15 AM', status: 'Logged' }
  ]);
  
  // Inputs for critical verification modal
  const [callbackFields, setCallbackFields] = useState({ contacted: '', method: 'Phone', readbackConfirm: false, techPin: '' });

  // ------------------------------------------------------------------
  // 📡 FEATURE 13: Raw Transmission Packet Dump Logs
  // ------------------------------------------------------------------
  const [rawPackets, setRawPackets] = useState([
    { timestamp: '09:34:12', direction: 'INBOUND', raw: 'MSH|^~\\&|SYSMEX|XN1000|||||ORU^R01|94102|P|2.3\rPID|1||PAT-4021^^^MRN||DOE^JOHN||19850612|M\rOBR|1||4021^LIS|CBC^Complete Blood Count\rOBX|1|NM|WBC^White Blood Cell|10.5|10*3/uL|4.0-11.0|N|||F\rOBX|2|NM|RBC^Red Blood Cell|4.8|10*6/uL|4.5-5.9|N|||F' },
    { timestamp: '09:32:05', direction: 'OUTBOUND', raw: 'MSH|^~\\&|LIS||SYSMEX|XN1000||||QRY^R02|88213|P|2.3\rQRD|20260515093205|R|I|88213|||1^RD|||OTH\rQRF|MONITOR|20260515|||LAB-103' }
  ]);

  // ------------------------------------------------------------------
  // 🛡️ FEATURE 14: Whitelist Controls & Security
  // ------------------------------------------------------------------
  const [ipWhitelist, setIpWhitelist] = useState([
    { id: 1, analyzer: 'Sysmex Main', ip: '192.168.1.12', mac: '00:1A:2B:3C:4D:5E', active: true },
    { id: 2, analyzer: 'Roche Cobas', ip: '192.168.1.44', mac: '94:E9:7F:1A:2C:3B', active: true }
  ]);

  // ------------------------------------------------------------------
  // 🔧 FEATURE 15: Maintenance Scheduler State
  // ------------------------------------------------------------------
  const [maintenanceSchedules, setMaintenanceSchedules] = useState([
    { id: 1, analyzer: 'Sysmex XN-1000', task: 'Daily Shutdown & Rinse', cycle: 'Daily', due: 'Due Now', status: 'Pending' },
    { id: 2, analyzer: 'Roche Cobas c311', task: 'Photometer Lamp Check', cycle: 'Weekly', due: '2 Days', status: 'Scheduled' }
  ]);

  // ------------------------------------------------------------------
  // ☁️ FEATURE 16: EMR Transmitter Logs
  // ------------------------------------------------------------------
  const [emrPushes, setEmrPushes] = useState([
    { id: 'TX-9011', patientId: 'PAT-4021', target: 'Epic Systems', ackCode: 'AA (Accept)', latency: '45ms', time: '09:35 AM' },
    { id: 'TX-9010', patientId: 'PAT-1104', target: 'Cerner Millennium', ackCode: 'AA (Accept)', latency: '52ms', time: '09:22 AM' }
  ]);

  // ------------------------------------------------------------------
  // 📊 FEATURE 17: Operational Performance Metrics State
  // ------------------------------------------------------------------
  const [perfStats, setPerfStats] = useState({
    todayVolume: 840,
    rejectionRate: 1.2,
    avgTatMinutes: 14.5,
    throughputHour: [12, 18, 45, 95, 84, 70] // Mock throughput per hour
  });

  const handleSaveCriticalCallback = () => {
    if (!activeCriticalLog) return;
    if (!callbackFields.contacted || !callbackFields.readbackConfirm) {
      addNotification('Logging Failed', 'You must specify the contacted clinician and confirm "Read-Back" verification.', 'error');
      return;
    }

    const newCallbackRecord = {
      id: Date.now(),
      sampleId: activeCriticalLog.sampleId,
      analyte: activeCriticalLog.testName,
      val: activeCriticalLog.value,
      verifiedBy: callbackFields.contacted,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Logged'
    };

    setCriticalCallbacks(prev => [...prev, newCallbackRecord]);
    addNotification('Critical Verified', `Callback for ${activeCriticalLog.testName} documented. Result ready for commit.`, 'success');
    
    setIsCriticalModalOpen(false);
    setActiveCriticalLog(null);
    setCallbackFields({ contacted: '', method: 'Phone', readbackConfirm: false, techPin: '' });
  };

  return (
    <div className="animate-slide-up" style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      
      {/* Gateway Application Header */}
      <div style={{ background: '#f8fafc', padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: lisTheme.headerBg, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <Activity size={16} /> Analyzer TCP/IP Bidirectional Gateway <span style={{ fontSize: '0.6rem', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '10px', textTransform: 'uppercase' }}>v5.0 Enterprise</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* FEATURE 10: Smart Routing / Auto Fetch Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '10px', borderRight: `1px solid ${lisTheme.borderColor}` }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b' }}>⚡ Auto-Fetch</span>
            <button 
              onClick={() => {
                setAutoFetchEnabled(!autoFetchEnabled);
                addNotification('Auto-Fetch Configured', autoFetchEnabled ? 'Analyzer auto-polling paused.' : 'Real-time auto-fetch initialized.', 'info');
              }}
              style={{ 
                background: autoFetchEnabled ? '#10b981' : '#cbd5e1',
                border: 'none', width: '28px', height: '14px', borderRadius: '10px', 
                position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px'
              }}
            >
              <div style={{ 
                width: '10px', height: '10px', background: 'white', borderRadius: '50%',
                marginLeft: autoFetchEnabled ? 'auto' : '0', transition: 'all 0.2s'
              }} />
            </button>
          </div>

          <button onClick={() => setIsWorklistModalOpen(true)} style={{ background: '#1e40af', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', boxShadow: '0 1px 2px rgba(30,64,175,0.2)' }}>
            <Barcode size={13} /> Send Worklist
          </button>
          <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '4px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span> LISTENING PORT 5000
          </div>
        </div>
      </div>

      {/* Local Tab Navigation */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderBottom: `1px solid ${lisTheme.borderColor}`, padding: '0 12px', flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: 'Health Monitor' },
          { id: 'connection_log', label: 'Connection Logs' },
          { id: 'worklist', label: 'Active Worklist' },
          { id: 'host_query', label: 'Host Queries' },
          { id: 'operators', label: 'Operator Mgmt' },
          { id: 'preview', label: 'Result Preview Console' },
          { id: 'qc_dashboard', label: 'Westgard QC & Charts' },
          { id: 'reagents_calib', label: 'Reagent & Calib' },
          { id: 'routing_settings', label: 'Auto-Val / Smart Routing' },
          { id: 'reflex_matrix', label: 'Reflex Rules Engine' },
          { id: 'maintenance_ops', label: 'Maintenance Scheduler' },
          { id: 'sys_analytics', label: 'Packet Logs & Security Hub' }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setGatewayTab(tb.id)}
            style={{
              border: 'none', background: gatewayTab === tb.id ? '#ffffff' : 'transparent',
              color: gatewayTab === tb.id ? '#1e40af' : '#64748b',
              padding: '8px 12px', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer',
              borderBottom: gatewayTab === tb.id ? '2px solid #1e40af' : 'none',
              borderRight: `1px solid #e2e8f0`
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Content Panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f8fafc' }}>
        
        {/* ================= FEATURE 1: DASHBOARD (HEALTH CARDS) ================= */}
        {gatewayTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Analyzer Carousel Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {analyzers.map(az => {
                const isCon = az.status === 'Connected';
                const isErr = az.status === 'Disconnected';
                const opName = activeOperators[az.id] || 'None';
                
                return (
                  <div key={az.id} style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.8rem' }}>{az.name}</div>
                        <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b', marginTop: '2px' }}>
                          {az.ip}:{az.port}
                        </div>
                      </div>
                      <span style={{ 
                        fontSize: '0.55rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
                        background: isCon ? '#ecfdf5' : (isErr ? '#fee2e2' : '#fffbeb'),
                        color: isCon ? '#059669' : (isErr ? '#dc2626' : '#d97706'),
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isCon ? '#10b981' : (isErr ? '#ef4444' : '#f59e0b') }}></span>
                        {az.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '8px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.65rem' }}>
                          <div>
                            <div style={{ color: '#94a3b8' }}>Latency (ms)</div>
                            <div style={{ fontWeight: '700', color: '#334155' }}>{isCon ? `${az.latency} ms` : 'N/A'}</div>
                          </div>
                          <div>
                            <div style={{ color: '#94a3b8' }}>Uptime Today</div>
                            <div style={{ fontWeight: '700', color: '#334155' }}>{az.uptime}%</div>
                          </div>
                          <div>
                            <div style={{ color: '#94a3b8' }}>Protocol</div>
                            <div style={{ fontWeight: '700', color: '#1e40af', textTransform: 'uppercase' }}>{az.protocol}</div>
                          </div>
                          <div>
                            <div style={{ color: '#94a3b8' }}>Security</div>
                            <div style={{ fontWeight: '700', color: az.encrypted ? '#059669' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Shield size={10} /> {az.encrypted ? 'ENCRYPTED' : 'PLAIN TEXT'}
                            </div>
                          </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={12} style={{ color: '#64748b' }} />
                        <span style={{ fontSize: '0.62rem', fontWeight: '600', color: '#475569' }}>Op: {opName}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handlePingNow(az.id)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}>
                          Ping
                        </button>
                        <button onClick={() => handleForceReconnect(az.id)} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}>
                          Reconnect
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AUTOVAL SUMMARY ROW */}
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: '#1d4ed8' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e3a8a' }}>Auto-Validation Dynamic Engine</div>
                  <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: '500' }}>Rules actively processing matching instrument telemetry feeds</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#059669' }}>{autoValKPI.released}</div>
                  <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: '700' }}>AUTO-RELEASED</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#d97706' }}>{autoValKPI.held}</div>
                  <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: '700' }}>HELD FOR REV</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '900', color: '#dc2626' }}>{autoValKPI.blocked}</div>
                  <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: '700' }}>BLOCKED</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= FEATURE 1: CONNECTION LOG TAB ================= */}
        {gatewayTab === 'connection_log' && (
          <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Time</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Analyzer</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Event</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Outage Duration</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Reconnect Method</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Triggered By</th>
                </tr>
              </thead>
              <tbody>
                {connectionLogs.map((lg, i) => {
                  const isRed = lg.event === 'Disconnected' || lg.event === 'Timeout';
                  const isGreen = lg.event === 'Connected' || lg.event === 'Reconnected';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: isRed ? '#fef2f2' : (isGreen ? '#f0fdf4' : 'white') }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{lg.time}</td>
                      <td style={{ padding: '10px 16px', fontWeight: '700' }}>{lg.analyzer}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ 
                          fontWeight: '800',
                          color: isRed ? '#991b1b' : (isGreen ? '#166534' : '#334155')
                        }}>{lg.event}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>{lg.duration > 0 ? `${lg.duration} mins` : '-'}</td>
                      <td style={{ padding: '10px 16px' }}>{lg.method}</td>
                      <td style={{ padding: '10px 16px', fontWeight: '600', color: '#64748b' }}>{lg.triggeredBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= FEATURE 2: WORKLIST TAB ================= */}
        {gatewayTab === 'worklist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="loadbalance"
                  checked={isLoadBalancing} 
                  onChange={() => {
                    setIsLoadBalancing(!isLoadBalancing);
                    addNotification('Load Balancer Toggled', isLoadBalancing ? 'Switched to manual worklist assignment' : 'Automatic 50/50 split queue depth engine active', 'info');
                  }} 
                  style={{ cursor: 'pointer' }} 
                />
                <label htmlFor="loadbalance" style={{ fontSize: '0.7rem', fontWeight: '800', color: '#1e293b', cursor: 'pointer' }}>
                  📊 Enable Smart Load Balancing (Splits automatically on same-type analyzers)
                </label>
              </div>
              <div style={{ fontSize: '0.65rem', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontWeight: '700', color: '#475569' }}>
                Current Queue Depth Imbalance: <span style={{ color: '#059669' }}>12% (Stable)</span>
              </div>
            </div>

            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>WL ID</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Lab Number</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Patient Name</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Ordered Tests</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Target Analyzer</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Priority</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Ack Status</th>
                  </tr>
                </thead>
                <tbody>
                  {worklistOrders.map((wl, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: '700' }}>{wl.id}</td>
                      <td style={{ padding: '10px 16px', color: '#1e40af', fontWeight: '800' }}>|| {wl.labNo}</td>
                      <td style={{ padding: '10px 16px', fontWeight: '700' }}>{wl.patient}</td>
                      <td style={{ padding: '10px 16px' }}>{wl.tests}</td>
                      <td style={{ padding: '10px 16px', fontWeight: '700', color: '#475569' }}>{wl.analyzer}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ 
                          padding: '2px 6px', borderRadius: '4px', fontWeight: '900', fontSize: '0.55rem',
                          background: wl.priority === 'STAT' ? '#fee2e2' : '#f1f5f9',
                          color: wl.priority === 'STAT' ? '#dc2626' : '#475569'
                        }}>{wl.priority}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {wl.ack ? (
                          <span style={{ color: '#059669', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> ACKNOWLEDGED
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontWeight: '800' }}>PENDING</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= FEATURE 2: HOST QUERY TAB ================= */}
        {gatewayTab === 'host_query' && (
          <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.7rem', fontWeight: '700', color: '#475569' }}>
              🚨 Live Host Query Broadcast Logs (Analyzer Pull Requests)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Query Time</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Barcode Scanned</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Querying Analyzer</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Patient Found?</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Worklist Sent?</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Response Time</th>
                </tr>
              </thead>
              <tbody>
                {hostQueries.map((q, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{q.time}</td>
                    <td style={{ padding: '10px 16px', fontWeight: '800', color: '#1e293b' }}>|| {q.barcode}</td>
                    <td style={{ padding: '10px 16px', fontWeight: '700' }}>{q.analyzer}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {q.found ? <span style={{ color: '#059669', fontWeight: '800' }}>YES</span> : <span style={{ color: '#dc2626', fontWeight: '800' }}>NO</span>}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {q.sentBack ? <span style={{ color: '#059669', fontWeight: '800' }}>YES</span> : <span style={{ color: '#64748b' }}>-</span>}
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: '700' }}>{q.latency} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= FEATURE 3: OPERATORS TAB ================= */}
        {gatewayTab === 'operators' && (
          <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#334155' }}>📜 Authorized Operator Certifications</span>
              <button onClick={() => addNotification('Operation Blocked', 'Role expansion requires Supervisor elevation.', 'warning')} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}>
                Add New Cert
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Staff Name</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Machine Assigned</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Cert Status</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Expiry Date</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Comp Score</th>
                  <th style={{ padding: '10px 16px', fontWeight: '800' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certifications.map((c, i) => {
                  const isExp = new Date(c.expiry) < new Date();
                  const isNear = !isExp && (new Date(c.expiry) - new Date()) < (14 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px', fontWeight: '700' }}>{c.name}</td>
                      <td style={{ padding: '10px 16px', fontWeight: '600', color: '#475569' }}>{c.analyzer}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ 
                          padding: '2px 6px', borderRadius: '4px', fontWeight: '900', fontSize: '0.55rem',
                          background: c.certified && !isExp ? '#dcfce3' : '#fee2e2',
                          color: c.certified && !isExp ? '#166534' : '#991b1b'
                        }}>
                          {c.certified && !isExp ? 'CERTIFIED' : 'UNAUTHORIZED'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700' }}>{c.expiry}</span>
                          {isExp && <span style={{ fontSize: '0.52rem', color: '#b91c1c', fontWeight: '800' }}>🔴 EXPIRED - BLOCKED</span>}
                          {isNear && <span style={{ fontSize: '0.52rem', color: '#b45309', fontWeight: '800' }}>🟡 EXPIRES WITHIN 14 DAYS</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: '700' }}>{c.score}%</td>
                      <td style={{ padding: '10px 16px' }}>
                        <button style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontSize: '0.65rem', fontWeight: '700' }}>
                          Revoke Access
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= FEATURE 4 & 6: RESULT PREVIEW CONSOLE ================= */}
        {gatewayTab === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* FEATURE 9: Partial Result Dashboard */}
            {partialLogs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', color: '#b45309', fontSize: '0.75rem' }}>
                  <Clock size={14} /> Active Partial Buffers & Rerun Logs
                </div>
                {partialLogs.map((pl, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#1e293b' }}>
                      || {pl.sampleId} ({pl.analyzer}) — Received: <span style={{ color: '#d97706' }}>{pl.received}/{pl.expected}</span> | Missing: <span style={{ fontWeight: '800' }}>{pl.pending}</span>
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.62rem', background: pl.minutesLeft < 20 ? '#fee2e2' : '#f1f5f9', color: pl.minutesLeft < 20 ? '#dc2626' : '#475569', padding: '3px 6px', borderRadius: '4px', fontWeight: '800' }}>
                        Timeout: {pl.minutesLeft}m Left
                      </span>
                      <button 
                        onClick={() => addNotification('Rerun Dispatched', `Host command "RERUN" transmitted to ${pl.analyzer} for ${pl.sampleId}.`, 'info')}
                        style={{ background: '#0f172a', border: 'none', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Order Rerun
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Critical Alerts Panel */}
            {pendingResults.some(r => r.flag === 'High') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 16px', borderRadius: '8px', color: '#991b1b' }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>
                  ⚠️ ABNORMAL VALUES DETECTED - High values, decoded alarms and delta checks require manual technician signature.
                </span>
              </div>
            )}

            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '800' }}>Sample ID</th>
                    <th style={{ padding: '12px 16px', fontWeight: '800' }}>Test Analyzed</th>
                    <th style={{ padding: '12px 16px', fontWeight: '800' }}>Instrument Value</th>
                    {/* FEATURE 6: Delta Header */}
                    <th style={{ padding: '12px 16px', fontWeight: '800' }}>Delta Check (Prior)</th>
                    <th style={{ padding: '12px 16px', fontWeight: '800' }}>Unit</th>
                    <th style={{ padding: '12px 16px', fontWeight: '800' }}>Ref Range</th>
                    <th style={{ padding: '12px 16px', fontWeight: '800' }}>HLI Index</th>
                    <th style={{ padding: '12px 16px', fontWeight: '800' }}>Decoded Flags</th>
                    <th style={{ padding: '12px 16px', fontWeight: '800' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingResults.map((res) => {
                    const isHigh = res.flag === 'High';
                    const isOverridden = res.flag === 'Overridden';
                    const isHliBad = res.hli > 1.0;
                    
                    // Delta Check Math
                    const historyKey = `${res.sampleId}-${res.testCode}`;
                    const history = historicalResults[historyKey];
                    const hasHighDelta = history && Math.abs(history.delta) > 20; // 20% rule
                    const isDeltaAck = deltaAcknowledged[historyKey] || false;
                    
                    return (
                      <tr key={res.id} style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: isHigh ? '#fffbeb' : (isOverridden ? '#eff6ff' : 'white')
                      }}>
                        <td style={{ padding: '12px 16px', fontWeight: '800', fontFamily: 'monospace', color: '#1e40af' }}>|| {res.sampleId}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '700' }}>{res.testName}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            fontWeight: '900', fontSize: '0.85rem',
                            color: isHigh ? '#d97706' : (isOverridden ? '#1e40af' : '#059669')
                          }}>{res.value}</span>
                        </td>
                        
                        {/* FEATURE 6: Delta Column */}
                        <td style={{ padding: '12px 16px' }}>
                          {history ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#475569' }}>
                                Prev: {history.val} <span style={{ 
                                  fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px',
                                  background: hasHighDelta ? '#fee2e2' : '#dcfce3',
                                  color: hasHighDelta ? '#b91c1c' : '#166534',
                                  fontWeight: '800', marginLeft: '4px'
                                }}>
                                  {history.delta > 0 ? '▲' : '▼'} {Math.abs(history.delta)}%
                                </span>
                              </div>
                              {hasHighDelta && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.58rem', color: '#b91c1c', fontWeight: '700', cursor: 'pointer' }}>
                                  <input 
                                    type="checkbox" 
                                    checked={isDeltaAck} 
                                    onChange={(e) => setDeltaAcknowledged(prev => ({ ...prev, [historyKey]: e.target.checked }))} 
                                    style={{ cursor: 'pointer' }}
                                  />
                                  Ack Delta!
                                </label>
                              )}
                            </div>
                          ) : <span style={{ color: '#94a3b8' }}>No History</span>}
                        </td>

                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{res.unit}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#475569' }}>{res.min} - {res.max}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ 
                            fontWeight: '800', padding: '2px 5px', borderRadius: '4px', fontSize: '0.6rem',
                            background: isHliBad ? '#fae8ff' : '#f1f5f9',
                            color: isHliBad ? '#86198f' : '#64748b'
                          }}>{res.hli} {isHliBad && '⚠️ INTF'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '220px' }}>
                            <span style={{ fontWeight: '800', fontSize: '0.6rem', color: '#b91c1c' }}>[{res.rawFlag}]</span>
                            <span style={{ fontSize: '0.58rem', color: '#475569', marginTop: '2px' }}>{res.decodedFlag}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => {
                              setOverridingResult(res);
                              setOverrideVal(res.value);
                            }} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}>
                              Override
                            </button>
                            <button 
                              onClick={() => {
                                if (hasHighDelta && !isDeltaAck) {
                                  addNotification('Validation Blocked', 'You must manually check "Ack Delta" to approve result variance!', 'error');
                                  return;
                                }
                                
                                const isCrit = res.flag && res.flag.toLowerCase().includes('critical');
                                const alreadyDone = criticalCallbacks.some(cc => cc.sampleId === res.sampleId && cc.status === 'Logged');
                                
                                if (isCrit && !alreadyDone) {
                                  setActiveCriticalLog(res);
                                  setIsCriticalModalOpen(true);
                                  return;
                                }
                                
                                addNotification('Result Validated', `${res.testName} released successfully.`, 'success');
                              }} 
                              style={{ 
                                background: (hasHighDelta && !isDeltaAck) ? '#94a3b8' : (res.flag && res.flag.includes('Critical') ? '#ef4444' : '#10b981'), 
                                color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', 
                                fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' 
                              }}
                            >
                              {res.flag && res.flag.includes('Critical') ? 'Verify Panic' : 'Release'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= FEATURE 7: WESTGARD QC & DYNAMIC CHARTS ================= */}
        {gatewayTab === 'qc_dashboard' && (() => {
          // Dynamic LJ calculation
          const currentLot = qcLots.find(l => l.id === selectedQcLevel) || qcLots[0];
          const { mean, sd, targetUnit } = currentLot;

          // SVG Layout Constants
          const width = 600;
          const height = 200;
          const padding = 30;
          const scaleY = (val) => {
            // Map range [mean - 3.5sd, mean + 3.5sd] to [height - padding, padding]
            const yMin = mean - 3.5 * sd;
            const yMax = mean + 3.5 * sd;
            return height - padding - ((val - yMin) / (yMax - yMin)) * (height - 2 * padding);
          };
          const scaleX = (idx) => padding + (idx / (qcRuns.length - 1)) * (width - 2 * padding);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Controls Row */}
              <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Analyte / Matrix</label>
                  <select value={selectedQcAnalyte} onChange={e => setSelectedQcAnalyte(e.target.value)} style={{ fontSize: '0.75rem', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '6px', padding: '5px 10px' }}>
                    <option value="Hemoglobin">Hemoglobin (Whole Blood)</option>
                    <option value="Glucose">Glucose (Serum)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Control Lot Level</label>
                  <select value={selectedQcLevel} onChange={e => setSelectedQcLevel(e.target.value)} style={{ fontSize: '0.75rem', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '6px', padding: '5px 10px' }}>
                    {qcLots.map(l => <option key={l.id} value={l.id}>{l.level} [Lot: {l.id}]</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto', fontSize: '0.65rem', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${lisTheme.borderColor}` }}>
                  <div>Mean: <strong>{mean}</strong></div>
                  <div>1 SD: <strong>{sd}</strong></div>
                  <div>3 SD (Reject): <strong>{(mean + 3 * sd).toFixed(2)}</strong></div>
                </div>
              </div>

              {/* Top Row: Levey Jennings Chart & Westgard Alarms */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                {/* SVG Levey-Jennings Rendering */}
                <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.75rem', color: '#1e293b', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📈 Levey-Jennings Multi-Rule Chart</span>
                    <span style={{ color: '#64748b', fontSize: '0.6rem' }}>Target Range ({targetUnit})</span>
                  </div>
                  
                  <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
                    <svg width={width} height={height} style={{ background: '#fafbfc', borderRadius: '4px' }}>
                      {/* Horizontal Grid Lines (SD Boundaries) */}
                      {[-3, -2, -1, 0, 1, 2, 3].map(num => {
                        const val = mean + num * sd;
                        const y = scaleY(val);
                        const isMean = num === 0;
                        const isThree = Math.abs(num) === 3;
                        const isTwo = Math.abs(num) === 2;
                        
                        let strokeColor = '#e2e8f0';
                        if (isMean) strokeColor = '#10b981';
                        else if (isThree) strokeColor = '#ef4444';
                        else if (isTwo) strokeColor = '#f59e0b';

                        return (
                          <g key={num}>
                            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke={strokeColor} strokeWidth={isMean ? 2 : 1} strokeDasharray={isMean ? '0' : '4,4'} />
                            <text x={padding - 5} y={y + 3} fontSize="8" fill="#64748b" textAnchor="end">
                              {num === 0 ? 'Mean' : `${num > 0 ? '+' : ''}${num}SD`}
                            </text>
                            <text x={width - padding + 5} y={y + 3} fontSize="8" fill="#94a3b8">
                              {val.toFixed(1)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Connect Lines */}
                      <polyline
                        fill="none"
                        stroke="#1e40af"
                        strokeWidth="1.5"
                        points={qcRuns.map((r, i) => `${scaleX(i)},${scaleY(r.val)}`).join(' ')}
                      />

                      {/* Point Circles */}
                      {qcRuns.map((r, i) => {
                        const y = scaleY(r.val);
                        const x = scaleX(i);
                        const deviation = Math.abs(r.val - mean) / sd;
                        const isOut = deviation > 2.0;

                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r={isOut ? 4 : 3.5} fill={isOut ? '#ef4444' : '#1e40af'} stroke="white" strokeWidth="1" />
                            {/* Tooltip Label */}
                            <text x={x} y={y - 8} fontSize="7" fontWeight="700" fill={isOut ? '#b91c1c' : '#64748b'} textAnchor="middle">
                              d{r.day}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Westgard Engine Rules Logger */}
                <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: '800', color: '#334155' }}>
                    ⚠️ Westgard Multi-Rule Violations
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {westgardAlerts.map((wa, idx) => (
                      <div key={idx} style={{ 
                        background: wa.type.includes('Reject') ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${wa.type.includes('Reject') ? '#fecaca' : '#fde68a'}`,
                        borderRadius: '6px', padding: '10px', fontSize: '0.65rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ 
                            fontWeight: '900', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px',
                            background: wa.type.includes('Reject') ? '#dc2626' : '#d97706', color: 'white'
                          }}>{wa.type.toUpperCase()}</span>
                          <span style={{ color: '#94a3b8' }}>{wa.time}</span>
                        </div>
                        <div style={{ fontWeight: '700', color: '#334155' }}>{wa.analyte} (Lot: {wa.level})</div>
                        <div style={{ color: '#64748b', marginTop: '2px' }}>Rule Code: <span style={{ fontFamily: 'monospace', fontWeight: '800' }}>{wa.code}</span> | Action: Lock Patient Run</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ================= FEATURE 8: REAGENT & CALIBRATION TRACKER ================= */}
        {gatewayTab === 'reagents_calib' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Reagent Inventory Capacity */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '0.75rem', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🧪 On-Board Reagent Cartridges</span>
                <button onClick={() => addNotification('Log Dispatched', 'Opened Lot Validation Log.', 'info')} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}>
                  Log New Lot
                </button>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reagentInventory.map((re, i) => {
                  const isCritical = re.pct < 20;
                  return (
                            <div key={i}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '800', color: '#1e293b' }}>{re.name} <span style={{ fontWeight: '400', color: '#64748b' }}>({re.analyzer})</span></span>
                                <span style={{ fontWeight: '800', color: isCritical ? '#b91c1c' : '#1e293b' }}>{re.pct}%</span>
                              </div>
                              <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '4px' }}>
                                <div style={{ 
                                  background: isCritical ? '#ef4444' : (re.pct < 50 ? '#f59e0b' : '#10b981'),
                                  width: `${re.pct}%`, height: '100%', transition: 'all 0.5s'
                                }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: '#94a3b8' }}>
                                <span>Lot: {re.lot}</span>
                                <span style={{ color: isCritical ? '#b91c1c' : '#94a3b8', fontWeight: isCritical ? '700' : '400' }}>
                                  Exp: {re.expiry} {isCritical && '⚠️ CRITICAL'}
                                </span>
                              </div>
                            </div>
                  );
                })}
              </div>
            </div>

            {/* Calibrations Dashboard */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '0.75rem', color: '#334155' }}>
                🗓️ Calibration & Verification Schedules
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Test / Assay</th>
                    <th style={{ padding: '10px 12px' }}>Analyzer</th>
                    <th style={{ padding: '10px 12px' }}>Cal Status</th>
                    <th style={{ padding: '10px 12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {calibrationSchedules.map((cs, idx) => {
                    const isDue = cs.status === 'Due Now';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: isDue ? '#fffbeb' : 'white' }}>
                        <td style={{ padding: '10px 12px', fontWeight: '700' }}>{cs.test}</td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{cs.analyzer}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ 
                            padding: '2px 5px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: '900',
                            background: isDue ? '#fee2e2' : '#dcfce3',
                            color: isDue ? '#991b1b' : '#166534'
                          }}>{cs.status.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button 
                            onClick={() => addNotification('Calibration Triggered', `Initiating calibration cycle on ${cs.analyzer}.`, 'info')}
                            style={{ background: isDue ? '#ef4444' : '#0f172a', border: 'none', color: 'white', padding: '3px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Run Calib
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= FEATURE 5 & 10: SMART ROUTER & AUTOVAL RULES ================= */}
        {gatewayTab === 'routing_settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* FEATURE 10: Auto-Routing Destinations Array */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#334155' }}>🛣️ Smart Result Downstream Router Configurations</span>
                <span style={{ fontSize: '0.62rem', color: '#059669', fontWeight: '800' }}>● Auto-routing engine active</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Specimen Category</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Match Code</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Target Sub-System</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Mode</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Trigger Status</th>
                  </tr>
                </thead>
                <tbody>
                  {routingRules.map((rr) => (
                    <tr key={rr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px', fontWeight: '700' }}>{rr.category}</td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: '800', color: '#1e40af' }}>{rr.match}</td>
                      <td style={{ padding: '10px 16px', fontWeight: '700', color: '#475569' }}>{rr.destination}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: '700', background: '#dcfce3', color: '#166534', padding: '2px 5px', borderRadius: '4px' }}>PUSH-HL7</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <button 
                          onClick={() => addNotification('Router Rule Confirmed', 'Routing node updated.', 'info')}
                          style={{ background: rr.active ? '#10b981' : '#cbd5e1', border: 'none', padding: '3px 8px', borderRadius: '10px', color: 'white', fontSize: '0.55rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                          {rr.active ? 'LIVE' : 'DISABLED'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FEATURE 5: Auto-Validation Gatekeepers Matrix */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '0.75rem', color: '#334155' }}>
                ⚙️ Auto-Validation Threshold Blocks & Gatekeepers
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Block Rule</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Target Class</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Condition Matrix</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Failsafe Command</th>
                    <th style={{ padding: '10px 16px', fontWeight: '800' }}>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {autovalRules.map((rl) => (
                    <tr key={rl.id} style={{ borderBottom: '1px solid #f1f5f9', background: rl.active ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '10px 16px', fontWeight: '700', color: rl.active ? '#1e293b' : '#94a3b8' }}>{rl.name}</td>
                      <td style={{ padding: '10px 16px', color: '#64748b' }}>{rl.type}</td>
                      <td style={{ padding: '10px 16px', fontWeight: '700', color: '#1e40af' }}>{rl.condition}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ 
                          fontWeight: '900', fontSize: '0.58rem', padding: '2px 6px', borderRadius: '4px',
                          background: rl.action === 'Auto-Release' ? '#dcfce3' : '#fee2e2',
                          color: rl.action === 'Auto-Release' ? '#166534' : '#b91c1c'
                        }}>{rl.action.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <button 
                          onClick={() => toggleRule(rl.id)}
                          style={{ 
                            background: rl.active ? '#10b981' : '#cbd5e1',
                            border: 'none', padding: '3px 8px', borderRadius: '10px', color: 'white',
                            fontWeight: '800', fontSize: '0.55rem', cursor: 'pointer'
                          }}
                        >
                          {rl.active ? 'ON' : 'OFF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ================= FEATURE 11: REFLEX RULES ENGINE ================= */}
        {gatewayTab === 'reflex_matrix' && (
          <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#334155' }}>🪞 Automated Reflex Testing Matrix</span>
              <button onClick={() => addNotification('Rule Wizard Launched', 'Ready to define reflex parameters.', 'info')} style={{ background: '#1e40af', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}>
                + Add Reflex Trace
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '800' }}>Trigger Analyte</th>
                  <th style={{ padding: '12px 16px', fontWeight: '800' }}>Panic Threshold</th>
                  <th style={{ padding: '12px 16px', fontWeight: '800' }}>Reflex Action (Auto-Order)</th>
                  <th style={{ padding: '12px 16px', fontWeight: '800' }}>Auto-Add to Billing</th>
                  <th style={{ padding: '12px 16px', fontWeight: '800' }}>State</th>
                </tr>
              </thead>
              <tbody>
                {reflexRules.map(rl => (
                  <tr key={rl.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>{rl.triggerTest}</td>
                    <td style={{ padding: '12px 16px', color: '#b91c1c', fontWeight: '800', fontFamily: 'monospace' }}>{rl.criteria}</td>
                    <td style={{ padding: '12px 16px', color: '#1e40af', fontWeight: '700' }}>➡️ {rl.reflexAction}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: '800', color: '#059669' }}>Yes (Code 201)</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => addNotification('Reflex Trace Updated', 'System reflex mapping live.', 'info')} style={{ background: '#10b981', border: 'none', color: 'white', padding: '3px 6px', borderRadius: '4px', fontSize: '0.55rem', fontWeight: '900', cursor: 'pointer' }}>
                        LIVE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= FEATURE 12 & 15: MAINTENANCE & CRITICALS ================= */}
        {gatewayTab === 'maintenance_ops' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
            
            {/* FEATURE 15: Maintenance Table */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '0.75rem', color: '#334155' }}>
                🔧 Analyzer Preventative Maintenance Logs
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Analyzer</th>
                    <th style={{ padding: '10px 12px' }}>Task</th>
                    <th style={{ padding: '10px 12px' }}>Interval</th>
                    <th style={{ padding: '10px 12px' }}>Due In</th>
                    <th style={{ padding: '10px 12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceSchedules.map(m => {
                    const isDue = m.due === 'Due Now';
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', background: isDue ? '#fef2f2' : 'white' }}>
                        <td style={{ padding: '10px 12px', fontWeight: '700' }}>{m.analyzer}</td>
                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#475569' }}>{m.task}</td>
                        <td style={{ padding: '10px 12px' }}>{m.cycle}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: '800', color: isDue ? '#dc2626' : '#475569' }}>{m.due}</span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button 
                            onClick={() => {
                              setMaintenanceSchedules(prev => prev.map(p => p.id === m.id ? { ...p, due: 'Completed', status: 'Done' } : p));
                              addNotification('Maintenance Executed', `${m.task} signed off.`, 'success');
                            }}
                            style={{ background: isDue ? '#ef4444' : '#0f172a', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 6px', fontSize: '0.55rem', fontWeight: '700', cursor: 'pointer' }}
                          >
                            {isDue ? 'Sign Off' : 'Execute'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FEATURE 12: Critical Callback Ledger Audit */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '0.75rem', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🚨 Critical Phone Callback Log Audit</span>
                <span style={{ fontSize: '0.55rem', background: '#fee2e2', color: '#b91c1c', fontWeight: '900', padding: '2px 5px', borderRadius: '4px' }}>CLIA COMPLIANT</span>
              </div>
              <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {criticalCallbacks.map(cc => (
                  <div key={cc.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px', fontSize: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', color: '#1e40af' }}>|| {cc.sampleId}</span>
                      <span style={{ fontWeight: '800', color: '#64748b' }}>{cc.time}</span>
                    </div>
                    <div style={{ fontWeight: '700', color: '#334155' }}>{cc.analyte}: <span style={{ color: '#ef4444', fontWeight: '900' }}>{cc.val}</span></div>
                    <div style={{ marginTop: '4px', color: '#64748b', fontSize: '0.6rem', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>
                      📞 Contacted: <strong style={{ color: '#1e293b' }}>{cc.verifiedBy}</strong> | Read-back confirmed.
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================= FEATURE 13,14,16,17: SYS ANALYTICS HUB ================= */}
        {gatewayTab === 'sys_analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* TOP: Performance KPI Cards + Bar Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
              
              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: '700' }}>Today's Volume</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b', margin: '4px 0' }}>{perfStats.todayVolume}</div>
                  <div style={{ fontSize: '0.55rem', color: '#059669', fontWeight: '700' }}>▲ 12% vs yesterday</div>
                </div>
                <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: '700' }}>Avg Turnaround (TAT)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b', margin: '4px 0' }}>{perfStats.avgTatMinutes}m</div>
                  <div style={{ fontSize: '0.55rem', color: '#059669', fontWeight: '700' }}>▼ 2.1m (Optimization)</div>
                </div>
                <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: '700' }}>Result Reject Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#b91c1c', margin: '4px 0' }}>{perfStats.rejectionRate}%</div>
                  <div style={{ fontSize: '0.55rem', color: '#64748b' }}>Target: &lt; 2.0%</div>
                </div>
                <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: '700' }}>Downstream Push Succ</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981', margin: '4px 0' }}>99.8%</div>
                  <div style={{ fontSize: '0.55rem', color: '#059669', fontWeight: '700' }}>HL7 Ack Accepted</div>
                </div>
              </div>

              {/* Throughput Hourly Chart */}
              <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>📊 Real-Time Sample Throughput (Past 6 Hours)</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                  {perfStats.throughputHour.map((b, i) => {
                    const maxVal = Math.max(...perfStats.throughputHour) || 1;
                    const pct = (b / maxVal) * 100;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%', height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>{b}</span>
                        <div style={{ background: '#1e40af', width: '100%', height: `${pct}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease-out' }}></div>
                        <span style={{ fontSize: '0.55rem', color: '#94a3b8', marginTop: '4px', position: 'absolute', transform: 'translateY(16px)' }}>H-{6-i}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BOTTOM: Raw Packets (F13) & Whitelists (F14) & EMR Transmitter (F16) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
              
              {/* FEATURE 13: Raw Byte Hex Dump */}
              <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', background: '#0f172a', color: 'white', fontSize: '0.7rem', fontWeight: '800', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📡 HL7/ASTM Raw Packet Stream Analyzer</span>
                  <span style={{ fontSize: '0.55rem', color: '#38bdf8', fontFamily: 'monospace' }}>TCP STREAM CAPTURED</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: '180px', background: '#1e293b', padding: '10px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rawPackets.map((pk, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', marginBottom: '2px' }}>
                        <span style={{ color: pk.direction === 'INBOUND' ? '#4ade80' : '#fbbf24', fontWeight: '800' }}>[{pk.direction}]</span>
                        <span style={{ color: '#94a3b8' }}>{pk.timestamp}</span>
                      </div>
                      <div style={{ color: '#cbd5e1', fontSize: '0.6rem', whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>
                        {pk.raw}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FEATURE 14: Whitelist Hub */}
              <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '10px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '0.7rem', color: '#334155' }}>
                  🛡️ Device Authorization Whitelist
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.62rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>IP Node</th>
                      <th style={{ padding: '8px' }}>MAC Binding</th>
                      <th style={{ padding: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ipWhitelist.map(w => (
                      <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', fontWeight: '700', color: '#1e40af' }}>{w.ip}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{w.mac}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ background: '#dcfce3', color: '#166534', fontSize: '0.5rem', padding: '1px 4px', borderRadius: '4px', fontWeight: '800' }}>LIVE</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FEATURE 16: EMR Transmitter Output Log */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '0.7rem', color: '#334155' }}>
                ☁️ Outbound EMR Transmitter Logs (HL7 ORU^R01 Bundles)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.62rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Transmit ID</th>
                    <th style={{ padding: '8px 12px' }}>Dest EMR</th>
                    <th style={{ padding: '8px 12px' }}>Patient ID</th>
                    <th style={{ padding: '8px 12px' }}>ACK Status</th>
                    <th style={{ padding: '8px 12px' }}>Network Latency</th>
                    <th style={{ padding: '8px 12px' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {emrPushes.map(ep => (
                    <tr key={ep.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 12px', fontWeight: '700' }}>{ep.id}</td>
                      <td style={{ padding: '8px 12px', color: '#475569', fontWeight: '700' }}>{ep.target}</td>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{ep.patientId}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: '#dcfce3', color: '#166534', padding: '2px 5px', borderRadius: '4px', fontWeight: '800' }}>{ep.ackCode}</span>
                      </td>
                      <td style={{ padding: '8px 12px', color: '#475569' }}>{ep.latency}</td>
                      <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{ep.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}


      </div>

      {/* ================= MODALS ================= */}

      {/* Result Override Form Modal */}
      {overridingResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', width: '400px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#0f172a', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '0.75rem' }}>🔧 Override Clinical Instrument Value</span>
              <X size={14} style={{ cursor: 'pointer' }} onClick={() => setOverridingResult(null)} />
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>Test Name / Original Value</label>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', marginTop: '4px' }}>
                  {overridingResult.testName} ({overridingResult.value} {overridingResult.unit})
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>Enter Override Adjusted Value</label>
                <input 
                  type="text" 
                  value={overrideVal}
                  onChange={e => setOverrideVal(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', outline: 'none', fontSize: '0.75rem', fontWeight: '700' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>Reason for Override</label>
                <select 
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', fontSize: '0.75rem' }}
                >
                  <option value="Instrument error">Instrument error</option>
                  <option value="Dilution needed">Dilution needed</option>
                  <option value="Interference detected">Interference detected</option>
                  <option value="Clerical error">Clerical error</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700' }}>Authorized Pathologist / Doctor</label>
                <select 
                  value={overrideDoc}
                  onChange={e => setOverrideDoc(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '4px', fontSize: '0.75rem' }}
                >
                  <option value="Dr. Vinod">Dr. Vinod</option>
                  <option value="Dr. Susan">Dr. Susan</option>
                  <option value="Dr. Geetha">Dr. Geetha</option>
                </select>
              </div>
              <button onClick={handleApplyOverride} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '800', fontSize: '0.75rem', marginTop: '8px', cursor: 'pointer' }}>
                Apply Override & Lock Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Worklist Configuration Modal */}
      {isWorklistModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ background: 'white', width: '600px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ background: '#1e40af', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Barcode size={14} /> Dispatch Host-Worklist Command</span>
              <X size={14} style={{ cursor: 'pointer' }} onClick={() => setIsWorklistModalOpen(false)} />
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.65rem', color: '#475569' }}>Select active lab orders collected today to push directly into target analyzer buffers.</div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 12px' }}>Lab ID</th>
                      <th style={{ padding: '8px 12px' }}>Patient Name</th>
                      <th style={{ padding: '8px 12px' }}>Tests</th>
                      <th style={{ padding: '8px 12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labOrders.filter(o => o.status !== 'Sample Pending').map((order, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px', fontWeight: '800', color: '#1e40af' }}>|| {order.id}</td>
                        <td style={{ padding: '8px 12px', fontWeight: '700' }}>{order.patientName}</td>
                        <td style={{ padding: '8px 12px' }}>{order.testName}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <select 
                            defaultValue="" 
                            onChange={(e) => {
                              if (e.target.value) {
                                handleTransmitWorklist(order, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            style={{ padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.62rem' }}
                          >
                            <option value="" disabled>Transmit to...</option>
                            <option value="Sysmex XN-1000">Sysmex XN-1000</option>
                            <option value="Roche Cobas c311">Roche Cobas c311</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEATURE 12: Critical Value Phone Callback Form Modal */}
      {isCriticalModalOpen && activeCriticalLog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', width: '450px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 35px rgba(0,0,0,0.3)', border: '2px solid #ef4444' }}>
            
            <div style={{ background: '#ef4444', color: 'white', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '900', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} /> FORCED INTERCEPT: PANIC / CRITICAL VALUE
              </span>
              <X size={14} style={{ cursor: 'pointer' }} onClick={() => {
                setIsCriticalModalOpen(false);
                setActiveCriticalLog(null);
              }} />
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Critical Summary Banner */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#991b1b', fontWeight: '800' }}>PANIC VALUE DETECTED</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#ef4444' }}>
                    {activeCriticalLog.testName}: {activeCriticalLog.value} {activeCriticalLog.unit}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Ref Range: {activeCriticalLog.min} - {activeCriticalLog.max}</div>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', fontFamily: 'monospace', color: '#1e293b', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                  || {activeCriticalLog.sampleId}
                </div>
              </div>

              <div style={{ fontSize: '0.65rem', color: '#475569', lineHeight: '1.4' }}>
                📄 <strong>CLIA Regulation Directive:</strong> Results exceeding panic bounds must be verbally communicated to authorized medical personnel within 15 minutes. Please document phone callback below.
              </div>

              {/* Input Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', color: '#1e293b', fontWeight: '800', display: 'block', marginBottom: '4px' }}>👤 Contacted Clinician Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Dr. Sarah Connor / Nurse Jacobs"
                    value={callbackFields.contacted}
                    onChange={e => setCallbackFields(prev => ({ ...prev, contacted: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.65rem', color: '#1e293b', fontWeight: '800', display: 'block', marginBottom: '4px' }}>📞 Communication Method</label>
                  <select 
                    value={callbackFields.method}
                    onChange={e => setCallbackFields(prev => ({ ...prev, method: e.target.value }))}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem' }}
                  >
                    <option value="Phone">Direct Phone Call (Standard)</option>
                    <option value="SMS/Pager">Hospital Pager System</option>
                    <option value="Face to Face">Face-to-Face Handover</option>
                  </select>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input 
                      type="checkbox" 
                      checked={callbackFields.readbackConfirm}
                      onChange={e => setCallbackFields(prev => ({ ...prev, readbackConfirm: e.target.checked }))}
                      style={{ marginTop: '2px' }}
                    />
                    <span style={{ fontSize: '0.65rem', color: '#1e293b', fontWeight: '700', lineHeight: '1.3' }}>
                      ✅ <strong>Confirm Read-Back Verification:</strong> I confirm the recipient has read back the Patient Name, Lab ID, and the Panic Value ({activeCriticalLog.value}) word-for-word.
                    </span>
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: '0.65rem', color: '#1e293b', fontWeight: '800', display: 'block', marginBottom: '4px' }}>🔒 Authorized Technician PIN Sign-Off</label>
                  <input 
                    type="password" 
                    placeholder="••••"
                    value={callbackFields.techPin}
                    onChange={e => setCallbackFields(prev => ({ ...prev, techPin: e.target.value }))}
                    style={{ width: '100px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.75rem', letterSpacing: '2px' }}
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveCriticalCallback} 
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '900', marginTop: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                💾 Document Callback & Authorize Result
              </button>

            </div>
          </div>
        </div>
      )}


    </div>
  );
}
