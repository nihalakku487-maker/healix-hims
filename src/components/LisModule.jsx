import React, { useState, useEffect } from 'react';
import { Database, Beaker, Activity, FileEdit, FileText, Settings, ShieldCheck, Printer, Save, Search, RefreshCw, Barcode, CheckSquare, Clock, Truck, AlertTriangle, TrendingUp, CheckCircle, BarChart2, ShieldAlert, Droplet, FlaskConical, ClipboardList, LayoutDashboard, PieChart, Users, Award } from 'lucide-react';
import LisResultIssuing from './LisResultIssuing';
import AnalyzerGateway from './AnalyzerGateway';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function LisModule({
  labOrders, setLabOrders,
  handlePostCharge, addNotification,
  labMasterTests
}) {
  const [lisTab, setLisTab] = useState('accession'); 

  // Accessioning State
  const [accPatient, setAccPatient] = useState({ name: '', dob: '', age: '', ageUnit: 'Years', gender: 'Male', phone: '', email: '', address: '', refBy: '', isStat: false, prepStatus: 'None', clinicalNotes: '' });
  const [accDiscount, setAccDiscount] = useState({ type: 'percent', value: 0 });
  const [accPaymentMode, setAccPaymentMode] = useState('Cash');
  const [accPaidAmount, setAccPaidAmount] = useState('');
  const [accTests, setAccTests] = useState([]);
  const [accSearch, setAccSearch] = useState('');

  // PANEL TEMPLATES for automated calculations
  const PANEL_TEMPLATES = {
    CBC: [
      { id: 1, key: 'hb', param: 'Hemoglobin (Hb)', result: '13.2', oldResult: '14.5', min: 12.0, max: 16.0, panicMin: 7.0, panicMax: 20.0, unit: 'g/dL', flag: '', isDerived: false },
      { id: 2, key: 'hct', param: 'Hematocrit (PCV)', result: '40.0', oldResult: '44.0', min: 36.0, max: 48.0, unit: '%', flag: '', isDerived: false },
      { id: 3, key: 'rbc', param: 'Total RBC Count', result: '4.5', oldResult: '4.8', min: 4.0, max: 5.5, unit: '10^6/Ã‚ÂµL', flag: '', isDerived: false },
      { id: 4, key: 'mcv', param: 'Mean Corpuscular Volume (MCV)', result: '', min: 80.0, max: 100.0, unit: 'fL', flag: '', isDerived: true },
      { id: 5, key: 'mch', param: 'Mean Corpuscular Hb (MCH)', result: '', min: 27.0, max: 32.0, unit: 'pg', flag: '', isDerived: true },
      { id: 6, key: 'mchc', param: 'Mean Corpuscular Hb Conc (MCHC)', result: '', min: 32.0, max: 36.0, unit: 'g/dL', flag: '', isDerived: true },
      { id: 7, key: 'wbc', param: 'Total WBC Count (TLC)', result: '7500', oldResult: '8200', min: 4000, max: 11000, panicMin: 1500, panicMax: 30000, unit: 'cells/Ã‚ÂµL', flag: '', isDerived: false },
      { id: 8, key: 'neut', param: 'Neutrophils', result: '65', oldResult: '60', min: 40, max: 75, unit: '%', flag: '', isDerived: false },
      { id: 9, key: 'lymph', param: 'Lymphocytes', result: '28', oldResult: '30', min: 20, max: 45, unit: '%', flag: '', isDerived: false },
      { id: 10, key: 'mono', param: 'Monocytes', result: '5', oldResult: '6', min: 2, max: 10, unit: '%', flag: '', isDerived: false },
      { id: 11, key: 'eos', param: 'Eosinophils', result: '1', oldResult: '3', min: 1, max: 6, unit: '%', flag: '', isDerived: false },
      { id: 12, key: 'baso', param: 'Basophils', result: '1', oldResult: '1', min: 0, max: 1, unit: '%', flag: '', isDerived: false },
      { id: 13, key: 'anc', param: 'Absolute Neutrophil Count (ANC)', result: '', min: 2000, max: 7500, unit: 'cells/Ã‚ÂµL', flag: '', isDerived: true },
      { id: 14, key: 'alc', param: 'Absolute Lymphocyte Count (ALC)', result: '', min: 1000, max: 4800, unit: 'cells/Ã‚ÂµL', flag: '', isDerived: true },
      { id: 15, key: 'retic', param: 'Reticulocyte Count', result: '1.2', oldResult: '1.0', min: 0.5, max: 2.5, unit: '%', flag: '', isDerived: false },
      { id: 16, key: 'crc', param: 'Corrected Reticulocyte Count (CRC)', result: '', min: 0.5, max: 2.5, unit: '%', flag: '', isDerived: true }
    ],
    LIPID: [
      { id: 17, key: 'chol', param: 'Total Cholesterol', result: '220', oldResult: '210', min: 120, max: 200, unit: 'mg/dL', flag: 'H', isDerived: false },
      { id: 18, key: 'hdl', param: 'HDL Cholesterol (Good)', result: '45', oldResult: '48', min: 40, max: 60, unit: 'mg/dL', flag: '', isDerived: false },
      { id: 19, key: 'tg', param: 'Triglycerides', result: '150', oldResult: '180', min: 50, max: 150, unit: 'mg/dL', flag: '', isDerived: false },
      { id: 20, key: 'vldl', param: 'VLDL Cholesterol', result: '', min: 5, max: 30, unit: 'mg/dL', flag: '', isDerived: true },
      { id: 21, key: 'ldl', param: 'LDL Cholesterol (Friedewald)', result: '', min: 50, max: 130, unit: 'mg/dL', flag: '', isDerived: true },
      { id: 22, key: 'non_hdl', param: 'Non-HDL Cholesterol', result: '', min: 60, max: 130, unit: 'mg/dL', flag: '', isDerived: true },
      { id: 23, key: 'chol_hdl_ratio', param: 'Cholesterol / HDL Ratio', result: '', min: 3.0, max: 5.0, unit: 'ratio', flag: '', isDerived: true },
      { id: 24, key: 'ldl_hdl_ratio', param: 'LDL / HDL Ratio', result: '', min: 0.5, max: 3.0, unit: 'ratio', flag: '', isDerived: true }
    ],
    RENAL: [
      { id: 25, key: 'cr', param: 'Serum Creatinine', result: '0.9', oldResult: '1.2', min: 0.6, max: 1.2, panicMax: 5.0, unit: 'mg/dL', flag: '', isDerived: false },
      { id: 26, key: 'bun', param: 'Blood Urea Nitrogen (BUN)', result: '18', oldResult: '24', min: 7, max: 20, unit: 'mg/dL', flag: '', isDerived: false },
      { id: 27, key: 'bun_cr_ratio', param: 'BUN / Creatinine Ratio', result: '', min: 10, max: 20, unit: 'ratio', flag: '', isDerived: true },
      { id: 28, key: 'cr_clearance', param: 'Creatinine Clearance (Cockcroft-Gault)', result: '', min: 90, max: 140, unit: 'mL/min', flag: '', isDerived: true },
      { id: 29, key: 'egfr_ckd', param: 'eGFR (CKD-EPI)', result: '', min: 90, max: 200, unit: 'mL/min/1.73mÃ‚Â²', flag: '', isDerived: true }
    ],
    LIVER: [
      { id: 30, key: 'tp', param: 'Total Protein', result: '7.2', oldResult: '7.0', min: 6.0, max: 8.3, unit: 'g/dL', flag: '', isDerived: false },
      { id: 31, key: 'alb', param: 'Albumin', result: '4.2', oldResult: '4.1', min: 3.5, max: 5.0, unit: 'g/dL', flag: '', isDerived: false },
      { id: 32, key: 'globulin', param: 'Globulin', result: '', min: 2.0, max: 3.5, unit: 'g/dL', flag: '', isDerived: true },
      { id: 33, key: 'ag_ratio', param: 'A / G Ratio', result: '', min: 1.1, max: 2.2, unit: 'ratio', flag: '', isDerived: true },
      { id: 34, key: 'tbil', param: 'Total Bilirubin', result: '0.8', oldResult: '1.1', min: 0.2, max: 1.2, panicMax: 15.0, unit: 'mg/dL', flag: '', isDerived: false },
      { id: 35, key: 'dbil', param: 'Direct Bilirubin', result: '0.2', oldResult: '0.3', min: 0.0, max: 0.3, unit: 'mg/dL', flag: '', isDerived: false },
      { id: 36, key: 'indirect_bil', param: 'Indirect Bilirubin', result: '', min: 0.2, max: 0.8, unit: 'mg/dL', flag: '', isDerived: true },
      { id: 37, key: 'ast', param: 'AST (SGOT)', result: '25', oldResult: '30', min: 5, max: 40, panicMax: 500, unit: 'U/L', flag: '', isDerived: false },
      { id: 38, key: 'alt', param: 'ALT (SGPT)', result: '30', oldResult: '32', min: 5, max: 40, panicMax: 500, unit: 'U/L', flag: '', isDerived: false },
      { id: 39, key: 'de_ritis', param: 'De Ritis Ratio (AST/ALT)', result: '', min: 0.8, max: 1.3, unit: 'ratio', flag: '', isDerived: true }
    ],
    METABOLIC: [
      { id: 40, key: 'hba1c', param: 'HbA1c (Glycated Hb)', result: '6.5', oldResult: '7.2', min: 4.0, max: 5.6, unit: '%', flag: 'H', isDerived: false },
      { id: 41, key: 'eag', param: 'Estimated Average Glucose (eAG)', result: '', min: 70, max: 120, unit: 'mg/dL', flag: '', isDerived: true },
      { id: 42, key: 'na', param: 'Sodium (Na+)', result: '140', oldResult: '138', min: 135, max: 145, panicMin: 120, panicMax: 160, unit: 'mEq/L', flag: '', isDerived: false },
      { id: 43, key: 'cl', param: 'Chloride (Cl-)', result: '102', oldResult: '101', min: 96, max: 106, unit: 'mEq/L', flag: '', isDerived: false },
      { id: 44, key: 'hco3', param: 'Bicarbonate (HCO3-)', result: '24', oldResult: '22', min: 22, max: 29, unit: 'mEq/L', flag: '', isDerived: false },
      { id: 45, key: 'anion_gap', param: 'Anion Gap', result: '', min: 8, max: 16, unit: 'mEq/L', flag: '', isDerived: true },
      { id: 46, key: 'ca', param: 'Total Calcium', result: '8.5', oldResult: '8.8', min: 8.5, max: 10.2, unit: 'mg/dL', flag: '', isDerived: false },
      { id: 47, key: 'alb', param: 'Serum Albumin', result: '3.2', oldResult: '3.5', min: 3.5, max: 5.0, unit: 'g/dL', flag: 'L', isDerived: false },
      { id: 48, key: 'corrected_ca', param: 'Corrected Calcium', result: '', min: 8.5, max: 10.2, unit: 'mg/dL', flag: '', isDerived: true },
      { id: 49, key: 'glc', param: 'Random Glucose', result: '120', oldResult: '140', min: 70, max: 140, panicMin: 40, panicMax: 400, unit: 'mg/dL', flag: '', isDerived: false },
      { id: 50, key: 'bun', param: 'BUN', result: '15', oldResult: '15', min: 7, max: 20, unit: 'mg/dL', flag: '', isDerived: false },
      { id: 51, key: 'osmolality', param: 'Calculated Serum Osmolality', result: '', min: 275, max: 295, unit: 'mOsm/kg', flag: '', isDerived: true }
    ],
    DIABETES: [
      { id: 52, key: 'insulin', param: 'Fasting Insulin', result: '12.0', oldResult: '15.0', min: 2.6, max: 24.9, unit: 'Ã‚ÂµU/mL', flag: '', isDerived: false },
      { id: 53, key: 'fglc', param: 'Fasting Glucose', result: '110', oldResult: '125', min: 70, max: 100, panicMin: 40, panicMax: 400, unit: 'mg/dL', flag: 'H', isDerived: false },
      { id: 54, key: 'homa_ir', param: 'HOMA-IR (Insulin Resistance)', result: '', min: 0.5, max: 2.5, unit: 'index', flag: '', isDerived: true }
    ]
  };

  // Local state for features not yet hoisted to global App state
  const [activeEntryOrder, setActiveEntryOrder] = useState(null);
  const [entryTests, setEntryTests] = useState([]);
  const [activeIssuingOrder, setActiveIssuingOrder] = useState(null);
  const [activeAuthOrder, setActiveAuthOrder] = useState(null);
  const [pathologistComment, setPathologistComment] = useState('');
  const [analyzerSearch, setAnalyzerSearch] = useState('');
  const [analyzerFilter, setAnalyzerFilter] = useState('All');
  const [analyzerPage, setAnalyzerPage] = useState(1);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Patient Refused');
  const [aliquotedOrders, setAliquotedOrders] = useState({});
  const [phleboScanInput, setPhleboScanInput] = useState('');
  const [phleboAuditLog, setPhleboAuditLog] = useState([]);
  const [runnerDispatched, setRunnerDispatched] = useState({});
  const [collectionTimestamps, setCollectionTimestamps] = useState({});
  
  // FEATURE 1: Patient Identity Verification State
  const [verifyingOrderId, setVerifyingOrderId] = useState(null);
  const [verifyNameInput, setVerifyNameInput] = useState('');
  const [verifyDobInput, setVerifyDobInput] = useState('');
  const [verifyFeedback, setVerifyFeedback] = useState(null); // null, { success: boolean, message: string }

  // FEATURE 5: Recollection Protocol State
  const [recollectingOrderId, setRecollectingOrderId] = useState(null);
  const [recollectPriority, setRecollectPriority] = useState('Routine');
  const [recollectReason, setRecollectReason] = useState('Sample Hemolyzed');

  // FEATURE 9: Tube Handling Quality Checklist
  const [checkingTubesOrderId, setCheckingTubesOrderId] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  // FEATURE 11: Immutable Clinical Action Log State
  const [historyOrderId, setHistoryOrderId] = useState(null);

  // FEATURE 12: Offline / Downtime Protocol State
  const [isOnlineMode, setIsOnlineMode] = useState(true);
  const [isDowntimeModalOpen, setIsDowntimeModalOpen] = useState(false);

  // FEATURE 6: Add-On Test Protocol State
  const [addonOrderId, setAddonOrderId] = useState(null);
  const [selectedAddonTest, setSelectedAddonTest] = useState('Lipid Profile');
  
  // Interactive QC Module state
  const [qcData, setQcData] = useState([
    { day: 1, val: 100 }, { day: 2, val: 102 }, { day: 3, val: 98 }, { day: 4, val: 105 },
    { day: 5, val: 95 }, { day: 6, val: 99 }, { day: 7, val: 101 }, { day: 8, val: 112 },
    { day: 9, val: 100 }, { day: 10, val: 97 }
  ]);
  const [newQcInput, setNewQcInput] = useState('');

  // Reagent Depletion Operational State
  const [reagents, setReagents] = useState([
    { name: 'Roche Cobas Lipid Pack', unit: 'mL', initialVolume: 500, volPerTest: 0.2, totalTests: 1420, deadVolume: 10, avgDailyConsum: 15, leadTime: 5, safetyStock: 50 },
    { name: 'Sysmex CBC Lyse Reagent', unit: 'mL', initialVolume: 1000, volPerTest: 0.5, totalTests: 1650, deadVolume: 25, avgDailyConsum: 35, leadTime: 3, safetyStock: 100 },
    { name: 'RCRP Latex Sensitized Reagent', unit: 'Tests', initialVolume: 200, volPerTest: 1, totalTests: 182, deadVolume: 5, avgDailyConsum: 8, leadTime: 7, safetyStock: 20 }
  ]);

  // FEATURE 8: Global Sepsis/Escalation Clock State & Effects
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); // Live Tick every 10 seconds for UI reactive precision
    return () => clearInterval(clockTimer);
  }, []);

  // Seed creationTimeMs for pre-existing mock data items on mount to drive the countdown widget reliably
  useEffect(() => {
    setLabOrders(prev => prev.map(o => {
      if (!o.creationTimeMs) {
        let initialMinsAgo = 10;
        if (o.id === 'LAB-101') initialMinsAgo = 25; // Push past limits to test the blinking alert!
        if (o.id === 'LAB-102') initialMinsAgo = 8;
        if (o.id === 'LAB-103') initialMinsAgo = 42; // Push past limits to show OVERDUE for Routine (Routine is 60m limit so not yet, wait, let's make it 65m for overdue)
        if (o.id === 'LAB-103') initialMinsAgo = 65;
        return {
          ...o,
          creationTimeMs: Date.now() - initialMinsAgo * 60 * 1000
        };
      }
      return o;
    }));
  }, [setLabOrders]);

  // ── NEW: Reception / Patient Search State ──────────────────────────────
  const [ptSearchQuery, setPtSearchQuery] = useState('');
  const [ptSearchResult, setPtSearchResult] = useState(null);
  const [selectedExistingPt, setSelectedExistingPt] = useState(null);

  // ── Token Print Modal ────────────────────────────────────────────────────
  const [tokenModalOrder, setTokenModalOrder] = useState(null);

  // ── Patient History Modal ────────────────────────────────────────────────
  const [historyModalPt, setHistoryModalPt] = useState(null);

  // ── Shift Close Confirmation ─────────────────────────────────────────────
  const [shiftCloseConfirm, setShiftCloseConfirm] = useState(false);

  // ── NEW: Sample Receiving State ────────────────────────────────────────
  const [receivingScan, setReceivingScan] = useState('');
  const [receivedSamples, setReceivedSamples] = useState([
    { id: 'LAB-101', patient: 'Riya Sharma', test: 'CBC', tube: 'EDTA (Lavender)', dept: 'Hematology', collectedAt: '08:45', stability: 'Stable', status: 'Pending' },
    { id: 'LAB-102', patient: 'Arun Patel', test: 'LFT + RFT', tube: 'SST Gold', dept: 'Biochemistry', collectedAt: '09:10', stability: 'Stable', status: 'Pending' },
    { id: 'LAB-103', patient: 'Sunita Mehta', test: 'Lipid Profile', tube: 'SST Gold', dept: 'Biochemistry', collectedAt: '07:30', stability: 'Borderline', status: 'Pending' },
  ]);

  // ── NEW: Report Delivery State ──────────────────────────────────────────
  const [deliveryLog, setDeliveryLog] = useState([
    { id: 'LAB-101', patient: 'Riya Sharma', test: 'CBC', authorized: '11:30', sms: false, whatsapp: false, email: false, status: 'Ready' },
    { id: 'LAB-102', patient: 'Arun Patel', test: 'LFT', authorized: '12:15', sms: true, whatsapp: false, email: false, status: 'Dispatched' },
  ]);

  // ── NEW: Daily Closing State ────────────────────────────────────────────
  const [shiftClosed, setShiftClosed] = useState(false);

  // ── Patient search logic ────────────────────────────────────────────────
  const PATIENT_HISTORY_DB = [
    { uhid: 'UHID-4521', name: 'Riya Sharma', phone: '9876543210', dob: '1990-05-12', gender: 'Female',
      visits: [
        { date: '2025-12-10', tests: 'CBC, LFT', amount: 850, status: 'Delivered' },
        { date: '2026-01-15', tests: 'Lipid Profile', amount: 600, status: 'Delivered' }
      ],
      duePay: 0, allergies: 'Penicillin', criticalHistory: 'Anemia (Hb < 8 in Jan 2026)'
    },
    { uhid: 'UHID-3302', name: 'Arun Patel', phone: '9123456789', dob: '1978-11-20', gender: 'Male',
      visits: [
        { date: '2026-02-01', tests: 'RFT, Urine R/M', amount: 700, status: 'Delivered' }
      ],
      duePay: 350, allergies: 'None', criticalHistory: 'CKD Stage 2 — Monitor Creatinine'
    },
  ];

  const handlePatientSearch = () => {
    const q = ptSearchQuery.trim().toLowerCase();
    if (!q) return;
    const found = PATIENT_HISTORY_DB.find(p =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.uhid.toLowerCase().includes(q)
    );
    if (found) { setPtSearchResult('found'); setSelectedExistingPt(found); }
    else { setPtSearchResult('not_found'); setSelectedExistingPt(null); }
  };

  // Outsource Data
  const [outsourceQueue, setOutsourceQueue] = useState([
    { id: 'OUT-901', patient: 'Ramesh K', test: 'Histopathology Biopsy', lab: 'Lal PathLabs', status: 'Dispatched', time: '10:30 AM' },
    { id: 'OUT-902', patient: 'Sunita M', test: 'HLA B27', lab: 'SRL Diagnostics', status: 'Pending Pickup', time: '12:15 PM' }
  ]);

  // Dynamic Clinical Calculation Engine
  const calculateDerivedValues = (currentParams, age = 35, gender = 'Male', weight = 70) => {
    const p = {};
    currentParams.forEach(t => {
      p[t.key] = parseFloat(t.result);
    });

    return currentParams.map(t => {
      if (!t.isDerived) return t;

      let newVal = '';
      
      // Hematology Formulas
      if (t.key === 'mcv' && p.hct && p.rbc) newVal = ((p.hct * 10) / p.rbc).toFixed(1);
      else if (t.key === 'mch' && p.hb && p.rbc) newVal = ((p.hb * 10) / p.rbc).toFixed(1);
      else if (t.key === 'mchc' && p.hb && p.hct) newVal = ((p.hb * 100) / p.hct).toFixed(1);
      else if (t.key === 'anc' && p.wbc && p.neut) newVal = Math.round((p.wbc * p.neut) / 100).toString();
      else if (t.key === 'alc' && p.wbc && p.lymph) newVal = Math.round((p.wbc * p.lymph) / 100).toString();
      else if (t.key === 'amc' && p.wbc && p.mono) newVal = Math.round((p.wbc * p.mono) / 100).toString();
      else if (t.key === 'aec' && p.wbc && p.eos) newVal = Math.round((p.wbc * p.eos) / 100).toString();
      else if (t.key === 'abc' && p.wbc && p.baso) newVal = Math.round((p.wbc * p.baso) / 100).toString();
      else if (t.key === 'crc' && p.retic && p.hct) newVal = (p.retic * (p.hct / 45)).toFixed(2);
      
      // Lipid Formulas
      else if (t.key === 'vldl' && p.tg) newVal = (p.tg / 5).toFixed(1);
      else if (t.key === 'non_hdl' && p.chol && p.hdl) newVal = (p.chol - p.hdl).toFixed(1);
      else if (t.key === 'chol_hdl_ratio' && p.chol && p.hdl) newVal = (p.chol / p.hdl).toFixed(2);
      else if (t.key === 'ldl_hdl_ratio' && p.ldl && p.hdl) newVal = (p.ldl / p.hdl).toFixed(2);
      else if (t.key === 'ldl') {
        if (p.chol && p.hdl && p.tg) {
          if (p.tg > 400) newVal = 'N/A (>400)';
          else newVal = (p.chol - p.hdl - (p.tg / 5)).toFixed(1);
        }
      }
      
      // Renal Formulas
      else if (t.key === 'bun_cr_ratio' && p.bun && p.cr) newVal = (p.bun / p.cr).toFixed(1);
      else if (t.key === 'cr_clearance' && p.cr) {
        const factor = gender === 'Female' ? 0.85 : 1.0;
        newVal = (((140 - age) * weight * factor) / (72 * p.cr)).toFixed(1);
      }
      else if (t.key === 'egfr_ckd' && p.cr) {
        const isFemale = gender === 'Female';
        const k = isFemale ? 0.7 : 0.9;
        const a = isFemale ? -0.329 : -0.411;
        const minTerm = Math.pow(Math.min(p.cr / k, 1), a);
        const maxTerm = Math.pow(Math.max(p.cr / k, 1), -1.209);
        const ageTerm = Math.pow(0.993, age);
        newVal = Math.round(141 * minTerm * maxTerm * ageTerm * (isFemale ? 1.018 : 1)).toString();
      }
      
      // Liver Formulas
      else if (t.key === 'globulin' && p.tp && p.alb) newVal = (p.tp - p.alb).toFixed(1);
      else if (t.key === 'ag_ratio' && p.alb && p.tp) newVal = (p.alb / (p.tp - p.alb)).toFixed(2);
      else if (t.key === 'indirect_bil' && p.tbil && p.dbil) newVal = (p.tbil - p.dbil).toFixed(2);
      else if (t.key === 'de_ritis' && p.ast && p.alt) newVal = (p.ast / p.alt).toFixed(2);
      
      // Metabolic/Endocrine
      else if (t.key === 'eag' && p.hba1c) newVal = ((28.7 * p.hba1c) - 46.7).toFixed(1);
      else if (t.key === 'anion_gap' && p.na && p.cl && p.hco3) newVal = (p.na - (p.cl + p.hco3)).toFixed(1);
      else if (t.key === 'corrected_ca' && p.ca && p.alb) newVal = (p.ca + 0.8 * (4.0 - p.alb)).toFixed(1);
      else if (t.key === 'osmolality' && p.na && p.glc && p.bun) newVal = Math.round((2 * p.na) + (p.glc / 18) + (p.bun / 2.8)).toString();
      else if (t.key === 'homa_ir' && p.insulin && p.fglc) newVal = ((p.insulin * p.fglc) / 405).toFixed(2);

      if (newVal !== '' && newVal !== 'NaN') {
        let flag = '';
        const num = parseFloat(newVal);
        if (!isNaN(num)) {
          if (num < t.min) flag = 'L';
          if (num > t.max) flag = 'H';
          if (t.panicMin && num <= t.panicMin) flag = 'CRITICAL';
          if (t.panicMax && num >= t.panicMax) flag = 'CRITICAL';
        }
        return { ...t, result: newVal, flag };
      }
      return t;
    });
  };

  const loadEntryOrder = (order) => {
    setActiveEntryOrder(order);
    let template = PANEL_TEMPLATES.CBC;
    const tName = (order.testName || "").toUpperCase();
    if (tName.includes('LIPID') || tName.includes('CHOLESTEROL')) {
      template = PANEL_TEMPLATES.LIPID;
    } else if (tName.includes('RENAL') || tName.includes('KIDNEY') || tName.includes('CREATININE') || tName.includes('RFT')) {
      template = PANEL_TEMPLATES.RENAL;
    } else if (tName.includes('LIVER') || tName.includes('LFT') || tName.includes('BILIRUBIN')) {
      template = PANEL_TEMPLATES.LIVER;
    } else if (tName.includes('METABOLIC') || tName.includes('ELECTROLYTE') || tName.includes('CALCIUM') || tName.includes('GLUCOSE')) {
      template = PANEL_TEMPLATES.METABOLIC;
    } else if (tName.includes('DIABETES') || tName.includes('INSULIN') || tName.includes('HOMA')) {
      template = PANEL_TEMPLATES.DIABETES;
    }
    
    let initial = JSON.parse(JSON.stringify(template));
    initial = calculateDerivedValues(initial);
    setEntryTests(initial);
  };

  const handleResultChange = (id, value) => {
    setEntryTests(prev => {
      const updatedRaw = prev.map(t => {
        if (t.id === id) {
          let flag = '';
          const numVal = parseFloat(value);
          if (!isNaN(numVal)) {
            if (numVal < t.min) flag = 'L';
            if (numVal > t.max) flag = 'H';
            if (t.panicMin && numVal <= t.panicMin) flag = 'CRITICAL';
            if (t.panicMax && numVal >= t.panicMax) flag = 'CRITICAL';
          }
          return { ...t, result: value, flag };
        }
        return t;
      });
      return calculateDerivedValues(updatedRaw);
    });
  };

  // Quality Control Statistical Computer
  const computeQCStats = (data) => {
    const vals = data.map(d => d.val);
    const n = vals.length;
    if (n === 0) return { mean: 0, sd: 0, cv: 0, points: [], violations: [] };

    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const variance = n > 1 ? vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1) : 0;
    const sd = Math.sqrt(variance);
    const cv = mean !== 0 ? (sd / mean) * 100 : 0;

    const pointsWithZ = data.map(d => ({ ...d, z: sd > 0 ? (d.val - mean) / sd : 0 }));

    let rulesViolated = [];
    pointsWithZ.forEach((pt, i) => {
      const absZ = Math.abs(pt.z);
      if (absZ > 3.0) rulesViolated.push(`Day ${pt.day}: [Rule 1_3s Reject] Z-Score = ${pt.z.toFixed(2)} (Exceeds 3SD)`);
      else if (absZ > 2.0) rulesViolated.push(`Day ${pt.day}: [Rule 1_2s Warning] Z-Score = ${pt.z.toFixed(2)} (Exceeds 2SD)`);

      if (i > 0) {
        const prev = pointsWithZ[i - 1];
        if ((prev.z > 2 && pt.z > 2) || (prev.z < -2 && pt.z < -2)) {
          rulesViolated.push(`Day ${pt.day}: [Rule 2_2s Reject] Two consecutive points exceeded 2SD same side`);
        }
        if (Math.abs(pt.z - prev.z) > 4.0) {
          rulesViolated.push(`Day ${pt.day}: [Rule R_4s Reject] Difference between point ${pt.day} and ${prev.day} exceeds 4SD`);
        }
      }
    });

    return { mean: mean.toFixed(2), sd: sd.toFixed(2), cv: cv.toFixed(2), points: pointsWithZ, violations: rulesViolated };
  };


  const lisTheme = {
    bg: '#f0f4f8',
    headerBg: '#1e3a8a',
    navBg: '#e2e8f0',
    borderColor: '#cbd5e1',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '0.75rem',
    textColor: '#1e293b'
  };

  // ── Book Test — 3 modes: 'save', 'saveAndContinue', 'saveAndPrint' ───────
  const handleBookTest = (mode = 'save') => {
    if (!accPatient.name || accTests.length === 0) return;
    const newOrderId = `LAB-${Math.floor(1000 + Math.random() * 9000)}`;
    const tokenNumber = `T-${Math.floor(100 + Math.random() * 900)}`;
    const isCbc = accTests.some(t => (t.name || '').toUpperCase().includes('CBC'));
    const totalAmount = accTests.reduce((sum, t) => sum + t.price, 0);
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      id: newOrderId,
      uhid: `UHID-${Math.floor(1000 + Math.random() * 9000)}`,
      tokenNumber,
      patientName: accPatient.name,
      dob: accPatient.dob,
      age: accPatient.age || '32',
      ageUnit: accPatient.ageUnit || 'Years',
      gender: accPatient.gender || 'Male',
      phone: accPatient.phone || '',
      email: accPatient.email || '',
      address: accPatient.address || '',
      refBy: accPatient.refBy || 'Dr. Self Referral',
      clinicalNotes: accPatient.clinicalNotes || '',
      prepStatus: accPatient.prepStatus || 'None',
      testName: accTests.map(t => t.name).join(', '),
      tests: accTests,
      amount: totalAmount,
      timestamp: new Date().toLocaleString(),
      bookedAt: ts,
      status: 'Sample Pending',
      isStat: accPatient.isStat,
      analyzer: isCbc ? 'Sysmex XN-1000' : 'Roche Cobas c311',
      collectionTime: ts,
      qcStatus: 'Passed',
      creationTimeMs: Date.now(),
      statusHistory: [
        { status: 'Registered', timestamp: ts, user: 'RECEPTION_01', detail: `Booked: ${accTests.map(t => t.name).join(', ')}` },
        { status: 'Billed', timestamp: ts, user: 'RECEPTION_01', detail: `\u20b9${totalAmount} via ${accPaymentMode}` }
      ]
    };

    setLabOrders(prev => [...prev, newOrder]);
    handlePostCharge(newOrder.uhid, 'LIS Accession Billing', totalAmount, 'Lab_Desk');
    addNotification(
      'Order Registered',
      `${newOrderId} | Token ${tokenNumber}${accPatient.isStat ? ' \u26a0\ufe0f STAT PRIORITY' : ''} \u2014 Added to phlebotomy queue.`,
      'success'
    );

    if (mode === 'saveAndContinue') setLisTab('collection');
    else if (mode === 'saveAndPrint') setTokenModalOrder(newOrder);

    setAccPatient({ name: '', dob: '', age: '', ageUnit: 'Years', gender: 'Male', phone: '', email: '', address: '', refBy: '', isStat: false, prepStatus: 'None', clinicalNotes: '' });
    setAccDiscount({ type: 'percent', value: 0 });
    setAccPaymentMode('Cash');
    setAccPaidAmount('');
    setAccTests([]);
  };

  // ── Global Handlers for State Sync ────────────────────────────────────
  const handleReceiveAccept = (s) => {
    setReceivedSamples(prev => prev.map(r => r.id === s.id ? { ...r, status: 'Accepted' } : r));
    setLabOrders(prev => prev.map(o => o.id === s.id ? { ...o, status: 'Processing' } : o));
    addNotification('Sample Accepted', `${s.id} \u2014 ${s.patient} received into ${s.dept}.`, 'success');
  };

  const handleReceiveReject = (s) => {
    setReceivedSamples(prev => prev.map(r => r.id === s.id ? { ...r, status: 'Rejected' } : r));
    setLabOrders(prev => prev.map(o => o.id === s.id ? { ...o, status: 'Rejected' } : o));
    addNotification('Sample Rejected', `${s.id} rejected \u2014 recollection required.`, 'error');
  };

  const handleDeliveryDispatch = (d, type) => {
    const update = type === 'sms' ? { sms: true } : type === 'wa' ? { whatsapp: true } : { email: true };
    setDeliveryLog(prev => prev.map(r => r.id === d.id ? { ...r, ...update, status: 'Dispatched' } : r));
    setLabOrders(prev => prev.map(o => o.id === d.id ? { ...o, status: 'Delivered' } : o));
    if (type === 'sms') addNotification('SMS Sent', `Report SMS dispatched to ${d.patient}.`, 'success');
    else if (type === 'wa') addNotification('WhatsApp Sent', `Report link sent via WhatsApp to ${d.patient}.`, 'success');
    else if (type === 'email') addNotification('Email Sent', `PDF report emailed to ${d.patient}.`, 'success');
  };

  const getAnalyzerWorklist = () => {
    const patients = labOrders.filter(o => o.status !== 'Sample Pending').map(o => {
      const baseCount = o.tests ? o.tests.length : (o.testName.split(',').length * 4);
      const isPartial = parseInt(o.id) % 6 === 0;
      const receivedCount = isPartial ? Math.max(1, baseCount - 1) : baseCount; 
      const hasError = parseInt(o.id) % 7 === 0;
      const hardwareAlert = hasError ? 'Short Sample' : (parseInt(o.id) % 9 === 0 ? 'Clot Detected' : 'OK');
      
      return {
        id: o.id,
        patientName: o.patientName,
        category: 'Patient Sample',
        analyzer: o.analyzer || (o.testName.includes('CBC') ? 'Sysmex XN-1000' : 'Roche Cobas c311'),
        ip: o.testName.includes('CBC') ? '192.168.2.21 : 6001' : '192.168.2.22 : 5002',
        status: o.status,
        tests: o.testName,
        paramsRcvd: receivedCount,
        paramsTotal: baseCount,
        hardwareAlert: hardwareAlert,
        rawOrder: o
      };
    });

    const qcs = [
      {
        id: 'CTRL-8821', patientName: 'Control Fluid L1', category: 'Control Level 1 (Low)', 
        analyzer: 'Sysmex XN-1000', ip: '192.168.2.21 : 6001',
        status: 'Synced', tests: 'Sysmex QC Low Calib', paramsRcvd: 12, paramsTotal: 12, hardwareAlert: 'OK'
      },
      {
        id: 'CTRL-9942', patientName: 'Control Fluid L2', category: 'Control Level 2 (Normal)', 
        analyzer: 'Roche Cobas c311', ip: '192.168.2.22 : 5002',
        status: 'Synced', tests: 'Cobas Chemistry QC Run', paramsRcvd: 16, paramsTotal: 16, hardwareAlert: 'OK'
      },
      {
        id: 'CTRL-1033', patientName: 'Control Fluid L3', category: 'Control Level 3 (High)', 
        analyzer: 'Roche Cobas c311', ip: '192.168.2.22 : 5002',
        status: 'Processing', tests: 'Linear calibration run', paramsRcvd: 8, paramsTotal: 10, hardwareAlert: 'Reagent Low'
      }
    ];

    let all = [...patients, ...qcs];

    if (analyzerSearch) {
      all = all.filter(item => item.id.toLowerCase().includes(analyzerSearch.toLowerCase()) || item.patientName.toLowerCase().includes(analyzerSearch.toLowerCase()));
    }

    if (analyzerFilter === 'QC') {
      all = all.filter(item => item.category.includes('Control'));
    } else if (analyzerFilter === 'Patient') {
      all = all.filter(item => item.category === 'Patient Sample');
    } else if (analyzerFilter === 'Error') {
      all = all.filter(item => item.hardwareAlert !== 'OK' || item.paramsRcvd < item.paramsTotal);
    }

    return all;
  };

  const getTubesForOrder = (order) => {
    const tubes = [];
    const testString = (order.testName || '').toUpperCase();
    
    if (testString.includes('CULTURE')) {
      tubes.push({ seq: 1, name: 'Blood Culture Bottle', color: '#f59e0b', label: 'Aerobic Culture', specimen: 'Whole Blood', volume: '10 mL', route: 'Microbiology (4F)' });
    }
    if (testString.includes('PT') || testString.includes('INR') || testString.includes('COAG')) {
      tubes.push({ seq: 2, name: 'Sodium Citrate (Light Blue)', color: '#3b82f6', label: 'Coagulation', specimen: 'Citrated Plasma', volume: '2.7 mL (9:1)', route: 'Hemo Dept (2F)' });
    }
    if (testString.includes('RENAL') || testString.includes('LIPID') || testString.includes('LIVER') || testString.includes('THYROID') || testString.includes('LFT') || testString.includes('KFT') || testString.includes('DIABETES')) {
      tubes.push({ seq: 3, name: 'SST Gold (Gel Activator)', color: '#eab308', label: 'Serum Chemistry', specimen: 'Serum', volume: '5 mL', route: 'Biochem Lab (3F)' });
    }
    if (testString.includes('CBC') || testString.includes('HBA1C') || testString.includes('HEMOGRAM')) {
      tubes.push({ seq: 4, name: 'EDTA (Lavender)', color: '#a855f7', label: 'Whole Blood', specimen: 'Whole Blood', volume: '3 mL', route: 'Hemo Dept (2F)' });
    }
    if (testString.includes('GLUCOSE') || testString.includes('FGLC') || testString.includes('SUGAR')) {
      tubes.push({ seq: 5, name: 'Sodium Fluoride (Grey)', color: '#6b7280', label: 'Plasma Glycolytic', specimen: 'Fluoride Plasma', volume: '2 mL', route: 'Biochem Lab (3F)' });
    }
    
    if (tubes.length === 0) {
      tubes.push({ seq: 3, name: 'Clot Activator (Red)', color: '#ef4444', label: 'General Serum', specimen: 'Serum', volume: '4 mL', route: 'Biochem Lab (3F)' });
    }
    return tubes.sort((a, b) => a.seq - b.seq);
  };

  const getPrepFlags = (order) => {
    const flags = [];
    const t = (order.testName || '').toUpperCase();
    if (t.includes('LIPID') || t.includes('GLUCOSE') || t.includes('FGLC') || t.includes('DIABETES') || t.includes('INSULIN')) {
      flags.push({ label: '12H Fasting Required', color: '#dc2626', bg: '#fee2e2', border: '#fecaca' });
    }
    if (t.includes('POST') || t.includes('PRANDIAL')) {
      flags.push({ label: 'Post-Prandial (2H After Food)', color: '#d97706', bg: '#fef3c7', border: '#fde68a' });
    }
    if (t.includes('THYROID') || t.includes('TSH') || t.includes('T3') || t.includes('T4')) {
      flags.push({ label: 'No Thyroid Medication', color: '#7c3aed', bg: '#f3e8ff', border: '#e9d5ff' });
    }
    if (t.includes('CULTURE')) {
      flags.push({ label: 'Draw Before Antibiotics', color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' });
    }
    if (t.includes('COAG') || t.includes('PT') || t.includes('INR')) {
      flags.push({ label: 'No Anticoagulants 24H', color: '#b45309', bg: '#fef3c7', border: '#fde68a' });
    }
    return flags;
  };

  const logPhleboAudit = (action, orderId, detail) => {
    setPhleboAuditLog(prev => [...prev, {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      user: 'PHLEBO_001',
      action,
      orderId,
      detail
    }]);
  };

  const getPhlebotomyQueue = () => {
    let queue = [...labOrders];
    queue.sort((a, b) => {
      if (a.isStat && !b.isStat) return -1;
      if (!a.isStat && b.isStat) return 1;
      return b.id.localeCompare(a.id);
    });
    return queue;
  };

  const appendStatusHistory = (orderId, newStatus, actionText = '') => {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLabOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const hist = o.statusHistory || [];
        return {
          ...o,
          statusHistory: [...hist, { status: newStatus, timestamp: ts, user: 'PHLEBO_001', detail: actionText }]
        };
      }
      return o;
    }));
  };

  const handleConfirmRecollection = (orderId) => {
    const original = labOrders.find(o => o.id === orderId);
    if (!original) return;

    const currentCount = labOrders.filter(o => o.id.startsWith(`${original.id.replace('-R', '')}-R`)).length;
    const newId = `${original.id.split('-R')[0]}-R${currentCount + 1}`;

    const isStatOrder = recollectPriority === 'STAT';
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder = {
      ...original,
      id: newId,
      status: 'Sample Pending',
      verificationStatus: 'Not Verified',
      timestamp: `Today, ${ts}`,
      isStat: isStatOrder,
      isRecollect: true,
      originalOrderId: original.id,
      statusHistory: [{ status: 'Recollect Registered', timestamp: ts, user: 'PHLEBO_001', detail: `Reason: ${recollectReason} | Priority: ${recollectPriority}` }]
    };

    setLabOrders(prev => {
      const updatedOriginals = prev.map(o => o.id === orderId ? { ...o, recollectRequested: true } : o);
      return [newOrder, ...updatedOriginals];
    });

    logPhleboAudit('RECOLLECT_GEN', original.id, `Created sub-order ${newId}. Reason: ${recollectReason}`);
    addNotification('Recollection Queued', `New draw ${newId} has been generated automatically!`, isStatOrder ? 'error' : 'info');
    setRecollectingOrderId(null);
  };

  const handleConfirmAddon = (orderId) => {
    const order = labOrders.find(o => o.id === orderId);
    if (!order) return;

    const addonCatalog = {
      'Lipid Profile': { code: 'ADD-LIP', vol: 2.5 },
      'HbA1c': { code: 'ADD-HBA', vol: 1.5 },
      'Thyroid Panel (T3/T4/TSH)': { code: 'ADD-THY', vol: 3.0 },
      'Troponin I': { code: 'ADD-TRO', vol: 2.0 },
      'D-Dimer': { code: 'ADD-DDM', vol: 3.5 }
    };

    const testInfo = addonCatalog[selectedAddonTest] || { code: 'ADD-UNK', vol: 2.0 };
    const currentVol = typeof order.sampleVolume === 'number' ? order.sampleVolume : 5.0;
    const canFulfill = currentVol >= testInfo.vol;
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (canFulfill) {
      setLabOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          const existingAddons = o.addonTests || [];
          const hist = o.statusHistory || [];
          return {
            ...o,
            sampleVolume: parseFloat((currentVol - testInfo.vol).toFixed(2)),
            addonTests: [...existingAddons, { name: selectedAddonTest, code: testInfo.code, requestedAt: ts }],
            statusHistory: [...hist, { status: 'Add-on Authorized', timestamp: ts, user: 'PHLEBO_001', detail: `${selectedAddonTest} (-${testInfo.vol}mL)` }]
          };
        }
        return o;
      }));
      logPhleboAudit('ADDON_AUTH', order.id, `Added test ${selectedAddonTest}. Consumed ${testInfo.vol}mL.`);
      addNotification('Add-on Authorized', `${selectedAddonTest} added to existing sample!`, 'success');
      setAddonOrderId(null);
    } else {
      const currentCount = labOrders.filter(o => o.id.startsWith(`${order.id.replace('-R', '')}-R`)).length;
      const newId = `${order.id.split('-R')[0]}-R${currentCount + 1}`;

      const newOrder = {
        ...order,
        id: newId,
        testName: `${selectedAddonTest} (Add-on)`,
        status: 'Sample Pending',
        verificationStatus: 'Not Verified',
        timestamp: `Today, ${ts}`,
        isStat: true,
        isRecollect: true,
        originalOrderId: order.id,
        sampleVolume: 5.0,
        addonTests: [],
        statusHistory: [{ status: 'Add-on Draw Registered', timestamp: ts, user: 'PHLEBO_001', detail: `Reason: Insufficient Vol for ${selectedAddonTest}` }]
      };

      setLabOrders(prev => {
        const updated = prev.map(o => {
          if (o.id === orderId) {
            const hist = o.statusHistory || [];
            return {
              ...o,
              statusHistory: [...hist, { status: 'Add-on Redraw Triggered', timestamp: ts, user: 'PHLEBO_001', detail: `Insufficient vol for ${selectedAddonTest}` }]
            };
          }
          return o;
        });
        return [newOrder, ...updated];
      });

      logPhleboAudit('ADDON_REDRAW', order.id, `Triggered new redraw ${newId} for ${selectedAddonTest} due to insufficient volume.`);
      addNotification('Redraw Triggered', `Insufficient volume. Spawning new draw order ${newId}!`, 'warning');
      setAddonOrderId(null);
    }
  };

  const handleConfirmVerification = (orderId) => {
    const order = labOrders.find(o => o.id === orderId);
    if (!order) return;

    const inputNameClean = verifyNameInput.trim().toLowerCase();
    const dbNameClean = (order.patientName || '').trim().toLowerCase();
    const inputDob = verifyDobInput.trim();
    const dbDob = (order.dob || '').trim();

    // Comparison check
    const isNameMatch = inputNameClean === dbNameClean;
    const isDobMatch = !dbDob || inputDob === dbDob; // If DOB exists in record, enforce it.

    if (isNameMatch && isDobMatch) {
      setVerifyFeedback({ success: true, message: 'Identity successfully verified.' });
      
      // Update parent labOrders state automatically
      setTimeout(() => {
        setLabOrders(prev => prev.map(o => 
          o.id === orderId 
            ? { 
                ...o, 
                verificationStatus: 'Verified', 
                verifiedBy: 'PHLEBO_001', 
                verifiedAt: new Date().toLocaleString(),
                statusHistory: [...(o.statusHistory || []), { status: 'Identity Verified', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), user: 'PHLEBO_001' }]
              } 
            : o
        ));
        logPhleboAudit('VERIFY', orderId, 'Identity check passed');
        addNotification('Identity Verified', `Patient ${order.patientName} verified. Proceed to collection.`, 'success');
        setVerifyingOrderId(null);
        setVerifyFeedback(null);
        setVerifyNameInput('');
        setVerifyDobInput('');
      }, 1200);
    } else {
      setVerifyFeedback({ success: false, message: 'Identity mismatch - do not collect!' });
      logPhleboAudit('VERIFY_FAIL', orderId, 'Identity match attempted but failed');
      addNotification('Verification Failed', 'Incorrect patient demographics provided!', 'warning');
    }
  };

  const handlePhleboScan = (val) => {
    if (!val.trim()) return;
    const found = labOrders.find(o => o.id === val.trim() || o.uhid === val.trim());
    if (found) {
      addNotification('Barcode Scanned', `Located: ${found.id} — ${found.patientName}. Status: ${found.status}`, 'success');
    } else {
      addNotification('Scan Error', `No active order found for barcode: "${val.trim()}"`, 'warning');
    }
    setPhleboScanInput('');
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
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', fontWeight: '500', alignItems: 'center' }}>
          {/* Feature 12: Network Connectivity Toggle Widget */}
          <div 
            onClick={() => {
              const next = !isOnlineMode;
              setIsOnlineMode(next);
              addNotification(
                next ? 'Network Reconnected' : 'OFFLINE MODE ACTIVATED', 
                next ? 'Local cache successfully synchronized with cloud server.' : 'System disconnected. Local changes queuing in IndexedDB.', 
                next ? 'success' : 'error'
              );
              logPhleboAudit('NETWORK_STATE', 'SYS', `Switched node connectivity to: ${next ? 'ONLINE' : 'OFFLINE'}`);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', background: isOnlineMode ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.25)',
              border: `1px solid ${isOnlineMode ? '#22c55e' : '#ef4444'}`, padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
              cursor: 'pointer', color: isOnlineMode ? '#4ade80' : '#fca5a5', transition: 'all 0.2s ease', boxShadow: isOnlineMode ? 'none' : '0 0 8px rgba(239,68,68,0.4)'
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnlineMode ? '#22c55e' : '#ef4444', animation: isOnlineMode ? 'none' : 'pulse 1s infinite' }} />
            {isOnlineMode ? 'ONLINE (SYNCED)' : 'LOCAL MODE (OFFLINE)'}
          </div>

          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14} /> SUPER_ADMIN</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14} /> MAIN-LAB-NODE</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* LIS Navigation Toolbar */}
      <div style={{ background: lisTheme.navBg, borderBottom: `1px solid ${lisTheme.borderColor}`, padding: '4px 8px', display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
        {[
          { id: 'reception', label: '🏥 Reception', icon: <Users size={14} /> },
          { id: 'accession', label: '1. Accession', icon: <FileEdit size={14} /> },
          { id: 'collection', label: '2. Phlebotomy', icon: <Barcode size={14} /> },
          { id: 'receiving', label: '3. Lab Receiving', icon: <FlaskConical size={14} /> },
          { id: 'worklist', label: '4. Analyzer Sync', icon: <RefreshCw size={14} /> },
          { id: 'entry', label: '5. Tech Entry', icon: <FileText size={14} /> },
          { id: 'auth', label: '6. Pathologist Auth', icon: <CheckSquare size={14} /> },
          { id: 'issuing', label: '7. Report Issuing', icon: <Printer size={14} /> },
          { id: 'delivery', label: '8. Delivery', icon: <Truck size={14} /> },
          { id: 'qc', label: 'QC & Calibration', icon: <Activity size={14} /> },
          { id: 'outsource', label: 'Outsource', icon: <Truck size={14} /> },
          { id: 'tat', label: 'TAT Analytics', icon: <BarChart2 size={14} /> },
          { id: 'super_dash', label: 'Phlebo Supervisor', icon: <LayoutDashboard size={14} /> },
          { id: 'closing', label: '📊 Daily Closing', icon: <Award size={14} /> },
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
        
        {/* ================= 0. RECEPTION DASHBOARD ================= */}
        {lisTab === 'reception' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Queue Today', value: labOrders.length, sub: 'Active orders', color: '#1e40af', bg: '#eff6ff', icon: '👥' },
                { label: 'Pending Collection', value: labOrders.filter(o => o.status === 'Sample Pending').length, sub: 'Awaiting phlebotomy', color: '#b45309', bg: '#fffbeb', icon: '🧪' },
                { label: 'Reports Ready', value: labOrders.filter(o => o.status === 'Authorized').length, sub: 'For delivery', color: '#065f46', bg: '#ecfdf5', icon: '📋' },
                { label: 'STAT Alerts', value: labOrders.filter(o => o.isStat).length, sub: 'Emergency priority', color: '#991b1b', bg: '#fef2f2', icon: '🚨' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: kpi.bg, border: `1px solid ${lisTheme.borderColor}`, borderRadius: '10px', padding: '16px', borderLeft: `4px solid ${kpi.color}` }}>
                  <div style={{ fontSize: '1.6rem', marginBottom: '2px' }}>{kpi.icon}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1e293b' }}>{kpi.label}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Patient Search */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ background: '#1e3a8a', color: 'white', padding: '12px 16px', fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={16} /> Patient Lookup — Search Before Registering
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Search by UHID, Mobile Number, or Patient Name..."
                    value={ptSearchQuery}
                    onChange={e => { setPtSearchQuery(e.target.value); setPtSearchResult(null); setSelectedExistingPt(null); }}
                    onKeyDown={e => e.key === 'Enter' && handlePatientSearch()}
                    style={{ flex: 1, padding: '10px 14px', border: `2px solid ${lisTheme.borderColor}`, borderRadius: '8px', fontSize: '0.8rem', outline: 'none' }}
                  />
                  <button onClick={handlePatientSearch} style={{ background: '#1e40af', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Search
                  </button>
                  <button onClick={() => { setLisTab('accession'); setPtSearchQuery(''); setPtSearchResult(null); }} style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>
                    + New Patient
                  </button>
                </div>

                {/* Existing Patient Found */}
                {ptSearchResult === 'found' && selectedExistingPt && (
                  <div style={{ background: '#f0fdf4', border: '2px solid #16a34a', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '900', fontSize: '1rem', color: '#14532d' }}>{selectedExistingPt.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                          {selectedExistingPt.uhid} • {selectedExistingPt.phone} • DOB: {selectedExistingPt.dob} • {selectedExistingPt.gender}
                        </div>
                      </div>
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800' }}>✓ EXISTING PATIENT</span>
                    </div>
                    {/* Allergy / Critical Banner */}
                    {selectedExistingPt.allergies !== 'None' && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 12px', fontSize: '0.7rem', color: '#991b1b', fontWeight: '700' }}>
                        ⚠️ ALLERGY: {selectedExistingPt.allergies}
                      </div>
                    )}
                    {selectedExistingPt.criticalHistory && (
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 12px', fontSize: '0.7rem', color: '#92400e', fontWeight: '700' }}>
                        🏥 HISTORY: {selectedExistingPt.criticalHistory}
                      </div>
                    )}
                    {/* Visit History */}
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.7rem', color: '#475569', marginBottom: '6px' }}>PREVIOUS VISITS ({selectedExistingPt.visits.length})</div>
                      {selectedExistingPt.visits.map((v, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'white', borderRadius: '6px', marginBottom: '4px', fontSize: '0.7rem', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontWeight: '700' }}>{v.date}</span>
                          <span>{v.tests}</span>
                          <span style={{ color: '#059669', fontWeight: '700' }}>₹{v.amount}</span>
                          <span style={{ color: '#475569' }}>{v.status}</span>
                        </div>
                      ))}
                    </div>
                    {selectedExistingPt.duePay > 0 && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 12px', fontSize: '0.7rem', color: '#b91c1c', fontWeight: '800' }}>
                        💰 OUTSTANDING BALANCE: ₹{selectedExistingPt.duePay} — Collect before booking
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => { setAccPatient(prev => ({ ...prev, name: selectedExistingPt.name, phone: selectedExistingPt.phone, dob: selectedExistingPt.dob, gender: selectedExistingPt.gender })); setLisTab('accession'); addNotification('Patient Selected', `${selectedExistingPt.name} loaded for new visit.`, 'success'); }} style={{ background: '#1e40af', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}>
                        ✓ New Visit
                      </button>
                      <button onClick={() => setHistoryModalPt(selectedExistingPt)} style={{ background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}>
                        View History
                      </button>
                    </div>
                  </div>
                )}

                {/* Patient NOT found */}
                {ptSearchResult === 'not_found' && (
                  <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👤</div>
                    <div style={{ fontWeight: '800', color: '#92400e', fontSize: '0.85rem' }}>No patient found for "{ptSearchQuery}"</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', marginBottom: '12px' }}>Create a new registration record for this patient.</div>
                    <button onClick={() => setLisTab('accession')} style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>
                      + Register New Patient
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: `1px solid ${lisTheme.borderColor}`, fontWeight: '800', fontSize: '0.8rem', color: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>⚡ Live Activity Feed</span>
                <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>LIVE</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                {labOrders.slice(-8).reverse().map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.7rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: o.isStat ? '#ef4444' : '#10b981', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'monospace', color: '#1e40af', fontWeight: '700', flexShrink: 0 }}>{o.id}</span>
                    <span style={{ color: '#334155', fontWeight: '600' }}>{o.patientName}</span>
                    <span style={{ color: '#64748b' }}>—</span>
                    <span style={{ color: '#475569' }}>{o.testName.length > 30 ? o.testName.slice(0, 30) + '…' : o.testName}</span>
                    <span style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '10px', fontWeight: '700', fontSize: '0.6rem', background: o.status === 'Sample Pending' ? '#fef3c7' : o.status === 'Authorized' ? '#dcfce7' : '#e0f2fe', color: o.status === 'Sample Pending' ? '#92400e' : o.status === 'Authorized' ? '#166534' : '#0369a1' }}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= 1. ACCESSION ================= */}

        {lisTab === 'accession' && (() => {
          const ap = accPatient;
          const subtotal = accTests.reduce((s, t) => s + t.price, 0);
          const discountAmt = accDiscount.type === 'percent' ? Math.round(subtotal * accDiscount.value / 100) : Math.min(Number(accDiscount.value) || 0, subtotal);
          const taxAmt = Math.round((subtotal - discountAmt) * 0.00); // 0% GST on diagnostic (configurable)
          const netPayable = subtotal - discountAmt + taxAmt;
          const paidAmt = Number(accPaidAmount) || 0;
          const balanceDue = netPayable - paidAmt;

          const autoCalcAge = (dob) => {
            if (!dob) return '';
            const diff = new Date() - new Date(dob);
            const years = Math.floor(diff / (1000*60*60*24*365.25));
            if (years < 1) { const months = Math.floor(diff/(1000*60*60*24*30.4)); return { age: String(months || 1), unit: 'Months' }; }
            return { age: String(years), unit: 'Years' };
          };

          const categories = ['All', 'Hematology', 'Biochemistry', 'Endocrinology', 'Microbiology', 'Serology', 'Cardiology', 'Urine'];
          const [accCatFilter, setAccCatFilter] = accSearch !== undefined ? [accSearch.split('||')[1] || 'All', (v) => setAccSearch(accSearch.split('||')[0] + '||' + v)] : ['All', () => {}];
          const catFilter = accSearch.includes('||') ? accSearch.split('||')[1] : 'All';
          const searchTerm = accSearch.includes('||') ? accSearch.split('||')[0] : accSearch;

          return (
          <PanelGroup autoSaveId="lis-accession" direction="horizontal" className="animate-slide-up" style={{ height: '100%' }}>

            {/* ── LEFT: Demographics & Clinical ── */}
            <Panel defaultSize={35} minSize={25} maxSize={50}>
              <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: '100%' }}>
              <div style={{ background: lisTheme.headerBg, color: 'white', padding: '10px 14px', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileEdit size={14} /> Patient Registration & Accession
                {ap.isStat && <span style={{ marginLeft: 'auto', background: '#e11d48', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>⚠¡ STAT</span>}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: lisTheme.fontSize }}>

                {/* UHID Row */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>UHID / Patient ID</label>
                    <input placeholder="Auto-generated on save" readOnly
                      style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', background: '#f8fafc', fontSize: lisTheme.fontSize, color: '#64748b', cursor: 'not-allowed' }} />
                  </div>
                  <button onClick={() => addNotification('UHID Search', 'Searching patient index for existing records...', 'info')}
                    style={{ padding: '7px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    Search
                  </button>
                </div>

                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Patient Name *</label>
                  <input value={ap.name} onChange={e => setAccPatient({...ap, name: e.target.value})} placeholder="Full legal name"
                    style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                </div>

                {/* DOB + Age */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1.3 }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Date of Birth</label>
                    <input type="date" value={ap.dob} onChange={e => {
                      const calc = autoCalcAge(e.target.value);
                      setAccPatient({...ap, dob: e.target.value, age: calc.age || ap.age, ageUnit: calc.unit || ap.ageUnit});
                    }} style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                  </div>
                  <div style={{ flex: 0.7 }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Age</label>
                    <input type="number" min="0" value={ap.age} onChange={e => setAccPatient({...ap, age: e.target.value})}
                      style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                  </div>
                  <div style={{ flex: 0.8 }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Unit</label>
                    <select value={ap.ageUnit} onChange={e => setAccPatient({...ap, ageUnit: e.target.value})}
                      style={{ width: '100%', padding: '7px 4px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }}>
                      <option>Days</option><option>Months</option><option>Years</option>
                    </select>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Gender</label>
                  <select value={ap.gender} onChange={e => setAccPatient({...ap, gender: e.target.value})}
                    style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>

                {/* Phone + Email */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Phone</label>
                    <input value={ap.phone} onChange={e => setAccPatient({...ap, phone: e.target.value})} placeholder="+91 XXXXX XXXXX"
                      style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Email</label>
                    <input type="email" value={ap.email} onChange={e => setAccPatient({...ap, email: e.target.value})} placeholder="report@mail.com"
                      style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Address / Location</label>
                  <input value={ap.address} onChange={e => setAccPatient({...ap, address: e.target.value})} placeholder="Door No, Street, City, PIN"
                    style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                </div>

                {/* Referred By */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Referred By</label>
                  <input value={ap.refBy} onChange={e => setAccPatient({...ap, refBy: e.target.value})} placeholder="Dr. Name / Self"
                    style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                </div>

                {/* Priority + Prep Status */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Patient Preparation</label>
                    <select value={ap.prepStatus} onChange={e => setAccPatient({...ap, prepStatus: e.target.value})}
                      style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }}>
                      <option>None</option>
                      <option>12H Fasting</option>
                      <option>Post-Prandial (2H)</option>
                      <option>Random (Non-fasting)</option>
                      <option>Pre-Medication</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Priority</label>
                    <button onClick={() => setAccPatient({...ap, isStat: !ap.isStat})}
                      style={{ padding: '7px 12px', background: ap.isStat ? '#e11d48' : '#f1f5f9', color: ap.isStat ? 'white' : '#475569', border: `1px solid ${ap.isStat ? '#e11d48' : '#cbd5e1'}`, borderRadius: '4px', cursor: 'pointer', fontWeight: '800', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                      {ap.isStat ? '⚠¡ STAT' : 'ROUTINE'}
                    </button>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div>
                  <label style={{ display: 'block', fontWeight: '700', color: '#64748b', marginBottom: '3px' }}>Clinical Notes / Provisional Diagnosis</label>
                  <textarea value={ap.clinicalNotes} onChange={e => setAccPatient({...ap, clinicalNotes: e.target.value})}
                    rows={2} placeholder="Provisional diagnosis, medication history, or doctor's remarks..."
                    style={{ width: '100%', padding: '7px 8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize, resize: 'vertical', fontFamily: lisTheme.fontFamily }} />
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="ResizeHandleOuter">
              <div className="ResizeHandleInner"></div>
            </PanelResizeHandle>

            {/* ── RIGHT: Test Selection + Billing ── */}
            <Panel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: 0, paddingLeft: '10px' }}>

              {/* Test picker */}
              <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: 0 }}>
                <div style={{ padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}`, background: '#f8fafc' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.8rem', color: lisTheme.headerBg }}>Master Test Directory</span>
                </div>

                {/* Search + Category filters */}
                <div style={{ padding: '8px 10px', borderBottom: `1px solid ${lisTheme.borderColor}`, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '8px', color: '#94a3b8' }} />
                    <input type="text" placeholder="Search tests or profiles..." value={searchTerm}
                      onChange={e => setAccSearch(e.target.value + (accSearch.includes('||') ? '||' + catFilter : ''))}
                      style={{ width: '100%', padding: '6px 6px 6px 26px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {['All','Hematology','Biochemistry','Endocrinology','Microbiology','Serology','Cardiology'].map(cat => (
                      <button key={cat} onClick={() => setAccSearch(searchTerm + '||' + cat)}
                        style={{ padding: '2px 8px', fontSize: '0.58rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', border: 'none',
                          background: catFilter === cat ? lisTheme.headerBg : '#f1f5f9', color: catFilter === cat ? 'white' : '#64748b' }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  {/* Available */}
                  <div style={{ borderRight: `1px solid ${lisTheme.borderColor}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {(labMasterTests || [])
                        .filter(t => {
                          const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchCat = catFilter === 'All' || t.category === catFilter;
                          return matchSearch && matchCat;
                        })
                        .map(t => (
                          <div key={t.id} onClick={() => !accTests.find(at => at.id === t.id) && setAccTests([...accTests, t])}
                            style={{ padding: '8px 12px', fontSize: lisTheme.fontSize, cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: accTests.find(at => at.id === t.id) ? '#f0fdf4' : 'white' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                            onMouseLeave={e => e.currentTarget.style.background = accTests.find(at => at.id === t.id) ? '#f0fdf4' : 'white'}>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1e293b' }}>{t.name}</div>
                              <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: '1px' }}>
                                {t.category} · {t.type === 'profile' ? '📦 Profile' : '🧪 Individual'}
                              </div>
                            </div>
                            <span style={{ color: '#1e3a8a', fontWeight: '700', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>₹{t.price}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Selected */}
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ background: '#f8fafc', padding: '6px 12px', fontSize: '0.65rem', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>
                      Selected ({accTests.length})
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {accTests.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', fontSize: lisTheme.fontSize, borderBottom: '1px solid #f1f5f9', background: '#f0fdf4' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#166534' }}>{t.name}</div>
                            <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>{t.category}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#1e3a8a', fontWeight: '700', fontSize: '0.72rem' }}>₹{t.price}</span>
                            <span style={{ color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', lineHeight: 1 }} onClick={() => setAccTests(accTests.filter(at => at.id !== t.id))}>✕</span>
                          </div>
                        </div>
                      ))}
                      {accTests.length === 0 && <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center', fontSize: lisTheme.fontSize }}>Click tests to add them.</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Billing Engine ── */}
              <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontSize: lisTheme.fontSize }}>
                <div style={{ fontWeight: '700', color: lisTheme.headerBg, marginBottom: '8px', fontSize: '0.78rem' }}>Billing & Payment</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {/* Subtotal / Discount / Tax */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Subtotal</span>
                      <span style={{ fontWeight: '700' }}>₹{subtotal}</span>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '3px' }}>Discount</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select value={accDiscount.type} onChange={e => setAccDiscount({...accDiscount, type: e.target.value})}
                          style={{ padding: '4px 4px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: '0.65rem' }}>
                          <option value="percent">%</option>
                          <option value="fixed">₹</option>
                        </select>
                        <input type="number" min="0" value={accDiscount.value} onChange={e => setAccDiscount({...accDiscount, value: e.target.value})}
                          placeholder="0"
                          style={{ flex: 1, padding: '4px 6px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                      </div>
                      {discountAmt > 0 && <div style={{ fontSize: '0.6rem', color: '#16a34a', marginTop: '2px' }}>− ₹{discountAmt} discount applied</div>}
                    </div>
                  </div>

                  {/* Net Payable */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center', alignItems: 'center', background: '#f0f9ff', borderRadius: '6px', padding: '8px' }}>
                    <div style={{ fontSize: '0.6rem', color: '#0369a1', fontWeight: '700', textTransform: 'uppercase' }}>Net Payable</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: lisTheme.headerBg }}>₹{netPayable}</div>
                    {balanceDue > 0 && <div style={{ fontSize: '0.6rem', color: '#dc2626', fontWeight: '700' }}>Balance Due: ₹{balanceDue}</div>}
                    {balanceDue <= 0 && paidAmt > 0 && <div style={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: '700' }}>✓ Paid in Full</div>}
                  </div>

                  {/* Payment Mode + Advance */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#64748b', marginBottom: '3px' }}>Payment Mode</label>
                      <select value={accPaymentMode} onChange={e => setAccPaymentMode(e.target.value)}
                        style={{ width: '100%', padding: '5px 6px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }}>
                        <option>Cash</option>
                        <option>Credit Card</option>
                        <option>Debit Card</option>
                        <option>UPI / QR Code</option>
                        <option>Insurance / TPA</option>
                        <option>Corporate Billing</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#64748b', marginBottom: '3px' }}>Paid Amount (Advance)</label>
                      <input type="number" min="0" value={accPaidAmount} onChange={e => setAccPaidAmount(e.target.value)}
                        placeholder={`₹${netPayable}`}
                        style={{ width: '100%', padding: '5px 6px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: lisTheme.fontSize }} />
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', padding: '12px', background: '#f8fafc', borderTop: `1px solid ${lisTheme.borderColor}` }}>
                    <button onClick={() => handleBookTest('save')} disabled={!ap.name || accTests.length === 0}
                      style={{ flex: 1, background: ap.name && accTests.length > 0 ? '#1e40af' : '#cbd5e1', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: ap.name && accTests.length > 0 ? 'pointer' : 'not-allowed' }}>
                      💾 Save Order
                    </button>
                    <button onClick={() => handleBookTest('saveAndContinue')} disabled={!ap.name || accTests.length === 0}
                      style={{ flex: 1, background: ap.name && accTests.length > 0 ? '#059669' : '#cbd5e1', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: ap.name && accTests.length > 0 ? 'pointer' : 'not-allowed' }}>
                      🧪 Save & Phlebotomy ➔
                    </button>
                    <button onClick={() => handleBookTest('saveAndPrint')} disabled={!ap.name || accTests.length === 0}
                      style={{ flex: 1, background: ap.name && accTests.length > 0 ? '#7c3aed' : '#cbd5e1', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: ap.name && accTests.length > 0 ? 'pointer' : 'not-allowed' }}>
                      🖨️ Save & Print Token
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Token Modal */}
            {tokenModalOrder && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '340px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <div style={{ border: '2px dashed #cbd5e1', padding: '16px', width: '100%', textAlign: 'center' }}>
                    <div style={{ fontWeight: '900', fontSize: '1.2rem', marginBottom: '8px' }}>HEALIX DIAGNOSTICS</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '16px' }}>Date: {tokenModalOrder.bookedAt}</div>
                    
                    <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>Patient: {tokenModalOrder.patientName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{tokenModalOrder.id} • {tokenModalOrder.uhid}</div>
                    
                    <div style={{ margin: '20px 0', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '800' }}>TOKEN NUMBER</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1e40af' }}>{tokenModalOrder.tokenNumber}</div>
                    </div>

                    <div style={{ fontSize: '0.7rem', fontWeight: '700' }}>{tokenModalOrder.tests.length} Tests Ordered</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '900', marginTop: '6px' }}>Paid: ₹{tokenModalOrder.amount}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button onClick={() => { window.print(); setTokenModalOrder(null); }} style={{ flex: 1, background: '#1e40af', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>🖨 Print</button>
                    <button onClick={() => setTokenModalOrder(null)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Close</button>
                  </div>
                </div>
              </div>
            )}

              </div>
            </Panel>
          </PanelGroup>
          );
        })()}

        {/* ================= 2. PHLEBOTOMY & BARCODE ================= */}
        {lisTab === 'collection' && (
          <div className="animate-slide-up" style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

            {/* Feature 12: Offline Downtime Alarm Strip */}
            {!isOnlineMode && (
              <div style={{ background: '#7f1d1d', borderBottom: '1px solid #991b1b', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={18} style={{ color: '#fecaca' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       DOWNTIME MODE ACTIVE — LOCAL NODE DISCONNECTED
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '2px' }}>Commands are persisting safely in local client index cache. Synchronizes instantly on connection recovery.</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsDowntimeModalOpen(true);
                    logPhleboAudit('DOWNTIME_MANIFEST', 'PRINT', 'Initiated manual emergency sheet printing.');
                  }}
                  style={{
                    background: 'white', color: '#7f1d1d', border: 'none', padding: '8px 14px', borderRadius: '6px',
                    fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  🖨️ Print Downtime Sheet
                </button>
              </div>
            )}

            {/* ── Global Controls Bar ── */}
            <div style={{ background: lisTheme.headerBg, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Auto-focused scanner input */}
              <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
                <Barcode size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Scan Barcode or UHID — mouse-free input active"
                  value={phleboScanInput}
                  onChange={e => setPhleboScanInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePhleboScan(phleboScanInput)}
                  style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '6px', border: '2px solid #3b82f6', fontSize: '0.75rem', outline: 'none', fontWeight: '600', background: 'white' }}
                />
              </div>
              <button onClick={() => addNotification('Bulk Print', 'Routing all pending labels to Dymo 450 barcode printer.', 'success')}
                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Printer size={13} /> Bulk Print Pending
              </button>
              <button onClick={() => addNotification('Queue Refreshed', 'Pulled latest add-on orders from LIS database.', 'info')}
                style={{ background: '#0f172a', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <RefreshCw size={13} /> Refresh Queue
              </button>
              {/* Status chips */}
              <span style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span> Main-Lab-Node: Online
                </span>
                <span style={{ fontSize: '0.65rem', color: '#93c5fd', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '4px' }}>
                  <ShieldCheck size={10} /> Active: PHLEBO_001
                </span>
              </span>
            </div>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Order-of-Draw Safety Banner Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div style={{ background: '#fefce8', borderBottom: `1px solid #fde68a`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', color: '#92400e', fontWeight: '700' }}>
              <AlertTriangle size={12} />
              CLINICAL ORDER OF DRAW: Blood Culture (Yellow) → Citrate/Blue → SST/Gold → EDTA/Lavender → Fluoride/Grey — Non-compliance causes cross-contamination.
            </div>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Main Grid Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: lisTheme.fontSize }}>
                <thead style={{ background: '#f1f5f9', textAlign: 'left', position: 'sticky', top: 0, zIndex: 5 }}>
                  <tr style={{ color: '#475569', fontSize: '0.72rem', fontWeight: '700' }}>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}` }}>Priority & Lab No</th>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}` }}>Patient Demographics</th>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}`, width: '38%' }}>Required Tubes — Clinical Order of Draw</th>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}`, textAlign: 'center' }}>Collection Status</th>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}` }}>Operational Console</th>
                  </tr>
                </thead>
                <tbody>
                  {labOrders.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                      No active phlebotomy orders in queue. Scan a barcode or check Accession tab.
                    </td></tr>
                  )}

                  {getPhlebotomyQueue().map((order) => {
                    const isStat = order.isStat;
                    const isCancelled = order.status === 'Cancelled' || order.status === 'Rejected';
                    const isCollected = order.status !== 'Sample Pending' && !isCancelled;
                    const tubes = getTubesForOrder(order);
                    const prepFlags = getPrepFlags(order);
                    const aliquots = aliquotedOrders[order.id] || [];
                    const collectedAt = collectionTimestamps[order.id];
                    const runnerStatus = runnerDispatched[order.id] || 'NOT_STARTED';
                    const isUpdated = parseInt(order.id) % 8 === 0 && order.status === 'Sample Pending';

                    // Demographic mismatch check
                    const nameLower = (order.patientName || '').toLowerCase();
                    const genderStored = (order.gender || 'Male');
                    const femaleNames = ['anjali', 'priya', 'sunita', 'pooja', 'kavya', 'meera', 'ritu', 'nisha', 'divya', 'lakshmi'];
                    const maleNames = ['sunil', 'raj', 'amit', 'vikram', 'arjun', 'rahul', 'nihal'];
                    const isMismatch = (femaleNames.some(n => nameLower.includes(n)) && genderStored === 'Male') ||
                                       (maleNames.some(n => nameLower.includes(n)) && genderStored === 'Female');

                    const createdMs = order.creationTimeMs || (Date.now() - 10 * 60 * 1000);
                    const elapsedMs = currentTime - createdMs;
                    const elapsedMins = Math.max(0, Math.floor(elapsedMs / 60000));

                    // Sepsis Countdown logic (STAT: 15m, Urgent: 30m, Routine: 60m)
                    const priorityLimit = isStat ? 15 : (order.priority === 'Urgent' ? 30 : 60);
                    const minsRemaining = priorityLimit - elapsedMins;
                    const pctRemaining = Math.max(0, (minsRemaining / priorityLimit) * 100);

                    return (
                      <React.Fragment key={order.id}>
                        <tr style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: isStat && !isCollected && !isCancelled ? '#fff1f2' : (isCancelled ? '#f8fafc' : '#ffffff'),
                        borderLeft: isStat && !isCollected && !isCancelled ? '4px solid #e11d48' : (isCancelled ? '4px solid #fca5a5' : '4px solid transparent')
                      }}>

                        {/* Priority & Lab No */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {isStat && !isCancelled && (
                              <span style={{ fontSize: '0.58rem', background: '#e11d48', color: 'white', padding: '2px 6px', borderRadius: '3px', width: 'fit-content', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '3px', animation: 'pulse 1.5s infinite' }}>
                                <ShieldAlert size={9} /> STAT
                              </span>
                            )}
                            <span style={{ fontWeight: '800', fontFamily: 'monospace', color: lisTheme.headerBg, fontSize: '0.82rem' }}>|| {order.id}</span>
                            {!isCollected && !isCancelled && (() => {
                              let clockColor, clockBg, clockBorder, animation = 'none';
                              let statusLabel = `${minsRemaining}m left`;

                              if (minsRemaining <= 0) {
                                clockColor = 'white'; clockBg = '#dc2626'; clockBorder = '#b91c1c';
                                statusLabel = '⚠️ OVERDUE';
                                animation = 'pulse 1s infinite';
                              } else if (pctRemaining <= 25) {
                                clockColor = '#991b1b'; clockBg = '#fee2e2'; clockBorder = '#fca5a5';
                                animation = 'pulse 1s infinite';
                              } else if (pctRemaining <= 50) {
                                clockColor = '#854d0e'; clockBg = '#fef3c7'; clockBorder = '#fcd34d';
                              } else {
                                clockColor = '#15803d'; clockBg = '#f0fdf4'; clockBorder = '#bbf7d0';
                              }

                              return (
                                <span style={{ 
                                  fontSize: '0.62rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px',
                                  background: clockBg, color: clockColor, border: `1px solid ${clockBorder}`,
                                  padding: '3px 6px', borderRadius: '4px', width: 'fit-content', marginTop: '3px',
                                  animation: animation
                                }}>
                                  <Clock size={9} /> {statusLabel}
                                </span>
                              );
                            })()}
                            {collectedAt && (
                              <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <CheckCircle size={9} /> Collected: {collectedAt}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Demographics + Prep Flags */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.8rem' }}>{order.patientName}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                            {order.age || '32'}Y / {order.gender || 'Male'} | UHID: {order.uhid || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: '#64748b' }}>☎ {order.phone || '—'} | Ref: {order.refBy || 'Self'}</div>
                          
                          {/* FEATURE 2: Patient Alert Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                            {order.isPediatric && (
                              <span style={{ background: '#f0fdfa', border: '1px solid #5eead4', color: '#0f766e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                👶 PEDIATRIC
                              </span>
                            )}
                            {order.hasLatexAllergy && (
                              <span style={{ background: '#fff1f2', border: '1px solid #fda4af', color: '#be123c', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                🛑 LATEX ALLERGY
                              </span>
                            )}
                            {order.hasDifficultVein && (
                              <span style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                💉 DIFFICULT VEIN
                              </span>
                            )}
                            {order.isIsolationRequired && (
                              <span style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                😷 ISOLATION: {order.isolationType || 'Standard'}
                              </span>
                            )}
                          </div>

                          {/* Consent Pending Banner */}
                          {order.consentGiven === false && (
                            <div style={{
                              marginTop: '6px',
                              background: '#be123c',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.65rem',
                              fontWeight: '800',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 4px rgba(190,18,60,0.2)'
                            }}>
                              <ShieldAlert size={11} /> CONSENT PENDING - DO NOT DRAW
                            </div>
                          )}
                          
                          {isMismatch && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px', fontSize: '0.58rem', color: '#dc2626', background: '#fee2e2', padding: '2px 5px', border: '1px solid #fca5a5', borderRadius: '3px', fontWeight: '800' }}>
                              <AlertTriangle size={9} /> DEMOG MISMATCH — VERIFY IDENTITY
                            </div>
                          )}
                          {isUpdated && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px', fontSize: '0.58rem', color: '#92400e', background: '#fef3c7', padding: '2px 5px', border: '1px solid #fcd34d', borderRadius: '3px', fontWeight: '800' }}>
                              ⚡ ADD-ON ORDER UPDATED
                            </div>
                          )}
                          {prepFlags.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '5px' }}>
                              {prepFlags.map((f, fi) => (
                                <span key={fi} style={{ fontSize: '0.58rem', color: f.color, background: f.bg, border: `1px solid ${f.border}`, padding: '2px 5px', borderRadius: '3px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  ⚠️ {f.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Tubes — Order of Draw */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            {tubes.map((tube, tIdx) => (
                              <div key={tIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', border: '1px solid #f1f5f9', borderRadius: '6px', background: '#fafafa' }}>
                                <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#475569', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: '900', flexShrink: 0 }}>
                                  {tube.seq}
                                </span>
                                <div style={{ width: '9px', height: '26px', background: tube.color, borderRadius: '2px', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }}></div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: '700', fontSize: '0.69rem', color: '#1e293b' }}>{tube.name}</div>
                                  <div style={{ fontSize: '0.58rem', color: '#64748b', marginTop: '1px' }}>
                                    {tube.specimen} · <strong>{tube.volume}</strong>
                                  </div>
                                  <div style={{ fontSize: '0.58rem', color: '#0d9488', fontWeight: '600', marginTop: '1px' }}>
                                    📍 {tube.route}
                                  </div>
                                </div>
                                {isCollected && !isCancelled && (
                                  <button onClick={() => addNotification('Reprint', `Reprint job sent for ${tube.name} — ${order.id}.`, 'info')}
                                    title="Reprint single label"
                                    style={{ padding: '3px 5px', border: '1px solid #dde1e7', background: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                    <Printer size={10} style={{ color: '#3b82f6' }} />
                                  </button>
                                )}
                              </div>
                            ))}

                            {/* Aliquot vials */}
                            {aliquots.length > 0 && (
                              <div style={{ marginTop: '4px', paddingLeft: '20px', borderLeft: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: '700' }}>Aliquotted Split Vials:</div>
                                {aliquots.map((sub, si) => (
                                  <span key={si} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 6px', borderRadius: '3px', color: '#065f46', fontWeight: '700' }}>
                                    <Barcode size={9} /> {sub} <span style={{ fontWeight: '400', color: '#047857' }}>(Centrifuged aliquot split)</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Collection Status — State Machine */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'center' }}>
                          {(() => {
                             let label, bg, color, border;
                             if (isCancelled) { label = 'CANCELLED'; bg = '#fee2e2'; color = '#991b1b'; border = '#fecaca'; }
                             else if (runnerStatus === 'DELIVERED') { label = 'ARRIVED AT LAB'; bg = '#d1fae5'; color = '#065f46'; border = '#34d399'; }
                             else if (runnerStatus === 'IN_TRANSIT') { label = 'IN TRANSIT'; bg = '#fef3c7'; color = '#d97706'; border = '#fcd34d'; }
                             else if (runnerStatus === 'DISPATCHED') { label = 'DISPATCHED'; bg = '#ede9fe'; color = '#5b21b6'; border = '#ddd6fe'; }
                             else if (aliquots.length > 0) { label = 'ALIQUOTTED'; bg = '#ecfdf5'; color = '#065f46'; border = '#a7f3d0'; }
                             else if (isCollected) { label = 'COLLECTED'; bg = '#dcfce7'; color = '#15803d'; border = '#bbf7d0'; }
                             else { label = 'PENDING DRAW'; bg = '#fef3c7'; color = '#b45309'; border = '#fcd34d'; }
                            return (
                              <span style={{ padding: '4px 10px', borderRadius: '10px', fontSize: '0.62rem', fontWeight: '800', display: 'inline-block', background: bg, color, border: `1px solid ${border}` }}>
                                {label}
                              </span>
                            );
                          })()}
                          {isCancelled && order.cancelReason && (
                            <div style={{ fontSize: '0.58rem', color: '#991b1b', fontWeight: '700', marginTop: '4px', background: '#fee2e2', padding: '2px 5px', borderRadius: '3px', display: 'inline-block' }}>
                              🚫 {order.cancelReason}
                            </div>
                          )}
                        </td>

                        {/* Operational Console */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>

                            {/* Ã¢â€â‚¬Ã¢â€â‚¬ PENDING: Draw + Reject Ã¢â€â‚¬Ã¢â€â‚¬ */}
                            {order.status === 'Sample Pending' && (
                              <>
                                {order.verificationStatus !== 'Verified' ? (
                                  <button onClick={() => setVerifyingOrderId(order.id)}
                                    style={{
                                      background: '#3b82f6', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.69rem', cursor: 'pointer', fontWeight: '800',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(59,130,246,0.2)'
                                    }}>
                                    <ShieldCheck size={12} /> Verify Patient ID
                                  </button>
                                ) : (
                                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontSize: '0.65rem', fontWeight: '700' }}>
                                    <CheckCircle size={13} /> Verified By {order.verifiedBy || 'System'}
                                  </div>
                                )}

                                <button 
                                  disabled={order.verificationStatus !== 'Verified' || order.consentGiven === false}
                                  onClick={() => {
                                    setCheckingTubesOrderId(order.id);
                                    setCheckedItems({});
                                  }} 
                                  style={{ 
                                    background: (order.verificationStatus !== 'Verified' || order.consentGiven === false) ? '#e2e8f0' : '#10b981', 
                                    color: (order.verificationStatus !== 'Verified' || order.consentGiven === false) ? '#94a3b8' : 'white', 
                                    border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.69rem', 
                                    cursor: (order.verificationStatus !== 'Verified' || order.consentGiven === false) ? 'not-allowed' : 'pointer', 
                                    fontWeight: '700',
                                    marginTop: '2px'
                                  }}>
                                  Draw & Collect Vials
                                </button>

                                {rejectingOrderId === order.id ? (
                                  <div style={{ padding: '6px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontSize: '0.6rem', fontWeight: '700', color: '#991b1b' }}>Reject Reason:</label>
                                    <select value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                      style={{ border: '1px solid #fca5a5', padding: '4px', borderRadius: '4px', fontSize: '0.65rem', outline: 'none', background: 'white' }}>
                                      <option>Patient Refused</option>
                                      <option>Hard Vein / Collapsing</option>
                                      <option>Patient Not Fasting</option>
                                      <option>Fainted / Adverse Event</option>
                                      <option>Sample Hemolyzed</option>
                                      <option>Mislabeled Order</option>
                                    </select>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <button onClick={() => {
                                        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        setLabOrders(prev => prev.map(o => o.id === order.id ? { 
                                          ...o, 
                                          status: 'Cancelled', 
                                          cancelReason: rejectReason,
                                          statusHistory: [...(o.statusHistory || []), { status: 'Sample Rejected', timestamp: ts, user: 'PHLEBO_001', detail: `Reason: ${rejectReason}` }]
                                        } : o));
                                        logPhleboAudit('REJECT', order.id, `Reason: ${rejectReason}`);
                                        setRejectingOrderId(null);
                                        addNotification('Draw Rejected', `Order ${order.id} cancelled. Reason: ${rejectReason}`, 'warning');
                                      }} style={{ flex: 1, background: '#dc2626', color: 'white', border: 'none', padding: '4px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}>
                                        Confirm
                                      </button>
                                      <button onClick={() => setRejectingOrderId(null)}
                                        style={{ flex: 1, background: '#64748b', color: 'white', border: 'none', padding: '4px', borderRadius: '4px', fontSize: '0.6rem', cursor: 'pointer' }}>
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button onClick={() => { setRejectingOrderId(order.id); setRejectReason('Patient Refused'); }}
                                    style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '5px 10px', borderRadius: '6px', fontSize: '0.69rem', cursor: 'pointer', fontWeight: '700' }}>
                                    Reject Draw
                                  </button>
                                )}
                              </>
                            )}

                            {/* ═══ COLLECTED: Aliquot + Runner ═══ */}
                            {isCollected && !isCancelled && (
                              <>
                                <button onClick={() => {
                                  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                  const code = order.id;
                                  const current = aliquotedOrders[code] || [];
                                  const subCode = `${code}-${String.fromCharCode(65 + current.length)}`;
                                  setAliquotedOrders(prev => ({ ...prev, [code]: [...current, subCode] }));
                                  setLabOrders(prev => prev.map(o => o.id === order.id ? {
                                    ...o,
                                    statusHistory: [...(o.statusHistory || []), { status: 'Aliquot Created', timestamp: ts, user: 'PHLEBO_001', detail: `Split label ${subCode}` }]
                                  } : o));
                                  logPhleboAudit('ALIQUOT', code, `Sub-vial ${subCode} created`);
                                  addNotification('Aliquot Created', `Label ${subCode} generated for centrifuge routing.`, 'info');
                                }} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <RefreshCw size={9} /> Generate Aliquot (Split)
                                </button>

                                {(() => {
                                  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                  if (runnerStatus === 'NOT_STARTED') {
                                    return (
                                      <button onClick={() => {
                                        setRunnerDispatched(prev => ({ ...prev, [order.id]: 'DISPATCHED' }));
                                        setLabOrders(prev => prev.map(o => o.id === order.id ? {
                                          ...o,
                                          statusHistory: [...(o.statusHistory || []), { status: 'Runner Dispatched', timestamp: ts, user: 'PHLEBO_001', detail: 'Courier courier-node assigned' }]
                                        } : o));
                                        logPhleboAudit('RUNNER_DISPATCH', order.id, `Dispatched runner for collection.`);
                                        addNotification('Runner Dispatched', `Courier dispatched for order ${order.id}.`, 'info');
                                      }} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Truck size={9} /> Dispatch Runner
                                      </button>
                                    );
                                  } else if (runnerStatus === 'DISPATCHED') {
                                    return (
                                      <button onClick={() => {
                                        setRunnerDispatched(prev => ({ ...prev, [order.id]: 'IN_TRANSIT' }));
                                        setLabOrders(prev => prev.map(o => o.id === order.id ? {
                                          ...o,
                                          statusHistory: [...(o.statusHistory || []), { status: 'Sample Picked Up', timestamp: ts, user: 'RUNNER_09', detail: 'Cold chain box sealed.' }]
                                        } : o));
                                        logPhleboAudit('RUNNER_PICKUP', order.id, `Runner confirmed specimen pick-up.`);
                                        addNotification('Sample Handover', `Specimen ${order.id} handed over to courier.`, 'success');
                                      }} style={{ background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe', padding: '5px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Barcode size={9} /> 📦 Confirm Pick-Up
                                      </button>
                                    );
                                  } else if (runnerStatus === 'IN_TRANSIT') {
                                    return (
                                      <button onClick={() => {
                                        setRunnerDispatched(prev => ({ ...prev, [order.id]: 'DELIVERED' }));
                                        setLabOrders(prev => prev.map(o => o.id === order.id ? {
                                          ...o,
                                          statusHistory: [...(o.statusHistory || []), { status: 'Received at Lab', timestamp: ts, user: 'LAB_TECH', detail: 'Temp range verified: 4°C.' }]
                                        } : o));
                                        logPhleboAudit('RUNNER_DELIVERY', order.id, `Runner delivered at central lab reception.`);
                                        addNotification('Specimen Arrived', `Sample ${order.id} successfully received at core lab!`, 'success');
                                      }} style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', padding: '5px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle size={9} /> 🏁 Mark Delivered
                                      </button>
                                    );
                                  } else {
                                    return (
                                      <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '5px 10px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                                        <CheckCircle size={10} /> Lab Received ✓
                                      </div>
                                    );
                                  }
                                })()}

                                <button onClick={() => { setAddonOrderId(order.id); setSelectedAddonTest('Lipid Profile'); }}
                                  style={{
                                    background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '5px 10px', borderRadius: '6px',
                                    fontSize: '0.65rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px',
                                    boxShadow: '0 1px 2px rgba(4,120,87,0.05)'
                                  }}>
                                  <FlaskConical size={9} /> Request Add-On Test
                                </button>
                              </>
                            )}

                            {/* CANCELLED / REJECTED: Request Recollection */}
                            {isCancelled && !order.recollectRequested && (
                              <button onClick={() => { setRecollectingOrderId(order.id); setRecollectPriority('Routine'); setRecollectReason(order.cancelReason || 'Sample Hemolyzed'); }}
                                style={{ 
                                  background: '#f97316', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', 
                                  fontSize: '0.69rem', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                                  boxShadow: '0 2px 4px rgba(249,115,22,0.2)'
                                }}>
                                <RefreshCw size={12} /> Request Recollection
                              </button>
                            )}
                            {order.recollectRequested && (
                              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontSize: '0.65rem', fontWeight: '700' }}>
                                <RefreshCw size={12} /> Recollect Queued
                              </div>
                            )}

                            {/* CANCELLED: Restore */}
                             {isCancelled && (
                               <button onClick={() => {
                                 const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                 setLabOrders(prev => prev.map(o => o.id === order.id ? { 
                                   ...o, 
                                   status: 'Sample Pending', 
                                   cancelReason: null,
                                   statusHistory: [...(o.statusHistory || []), { status: 'Re-queued', timestamp: ts, user: 'PHLEBO_001' }]
                                 } : o));
                                 logPhleboAudit('RESTORE', order.id, 'Re-queued from cancelled state');
                                 addNotification('Restored', `Order ${order.id} returned to active queue.`, 'info');
                               }} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '5px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '600' }}>
                                 Restore to Queue
                               </button>
                             )}

                             <button onClick={() => setHistoryOrderId(order.id)}
                               style={{ 
                                 background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', padding: '5px 10px', borderRadius: '6px', 
                                 fontSize: '0.65rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px',
                                 boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                               }}>
                               📜 History
                             </button>
                          </div>
                        </td>
                      </tr>
                      {/* Feature 3: Granular Collection Timeline Sub-row */}
                      <tr style={{ background: '#f8fafc' }}>
                        <td colSpan={5} style={{ padding: '4px 14px', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.52rem', fontWeight: '900', color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={10} /> Workflow Timeline:
                            </span>
                            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '2px', alignItems: 'center', flex: 1, padding: '3px 0' }}>
                              {(order.statusHistory || [{ status: 'Order Created', timestamp: order.timestamp || 'N/A', user: 'SYS' }]).map((h, i) => (
                                <React.Fragment key={i}>
                                  <div style={{ display: 'flex', flexDirection: 'column', background: 'white', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.58rem', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', lineHeight: '1.2' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ fontWeight: '800', color: h.status.includes('Reject') ? '#dc2626' : (h.status.includes('Collected') || h.status.includes('Drawn') ? '#10b981' : '#1e293b') }}>{h.status}</span>
                                      <span style={{ color: '#64748b', fontSize: '0.5rem', fontWeight: '600' }}>{h.timestamp}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                      <span style={{ color: '#94a3b8', fontSize: '0.48rem' }}>Tech: {h.user || 'PHLEBO_001'}</span>
                                      {h.detail && <span style={{ color: '#f97316', fontSize: '0.48rem', fontWeight: '600' }}>• {h.detail}</span>}
                                    </div>
                                  </div>
                                  {i < (order.statusHistory || []).length - 1 && <span style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 'bold' }}>➜</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
                </tbody>
              </table>
            </div>

            {/* ═══ Immutable Audit Trail Footer ═══ */}
            {phleboAuditLog.length > 0 && (
              <div style={{ borderTop: `1px solid ${lisTheme.borderColor}`, background: '#f8fafc', padding: '8px 16px', maxHeight: '90px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🛡️ Phlebotomy Audit Trail (Immutable)
                </div>
                {[...phleboAuditLog].reverse().map((log, li) => (
                  <div key={li} style={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'monospace', lineHeight: '1.6' }}>
                    [{log.time}] [{log.user}] {log.action} —  {log.orderId}: {log.detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= 3. LAB SAMPLE RECEIVING ================= */}
        {lisTab === 'receiving' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Barcode Scan Header */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FlaskConical size={16} /> Lab Sample Receiving Station
                </div>
                <div style={{ background: '#22c55e', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '800' }}>● STATION ACTIVE</div>
              </div>
              <div style={{ padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', borderBottom: `1px solid ${lisTheme.borderColor}` }}>
                <Barcode size={18} style={{ color: '#475569' }} />
                <input
                  type="text"
                  placeholder="Scan or type barcode / Lab ID to receive sample..."
                  value={receivingScan}
                  onChange={e => setReceivingScan(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && receivingScan.trim()) {
                      const found = receivedSamples.find(s => s.id === receivingScan.trim());
                      if (found) {
                        setReceivedSamples(prev => prev.map(s => s.id === receivingScan.trim() ? { ...s, status: 'Accepted' } : s));
                        addNotification('Sample Received', `${receivingScan.trim()} accepted into ${found.dept}.`, 'success');
                      } else {
                        addNotification('Scan Error', `No sample found for barcode: ${receivingScan.trim()}`, 'warning');
                      }
                      setReceivingScan('');
                    }
                  }}
                  style={{ flex: 1, padding: '10px 14px', border: `2px solid #1e40af`, borderRadius: '8px', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '1px' }}
                  autoFocus
                />
                <div style={{ fontSize: '0.65rem', color: '#64748b', textAlign: 'right' }}>
                  <div>Press <strong>Enter</strong> to receive</div>
                  <div>or click buttons below</div>
                </div>
              </div>
            </div>

            {/* Receiving Queue */}
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: `1px solid ${lisTheme.borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', fontSize: '0.8rem', color: '#1e293b' }}>📦 Samples Awaiting Lab Verification</span>
                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{receivedSamples.filter(s => s.status === 'Pending').length} pending • {receivedSamples.filter(s => s.status === 'Accepted').length} accepted • {receivedSamples.filter(s => s.status === 'Rejected').length} rejected</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    {['Lab ID', 'Patient', 'Test / Dept', 'Tube', 'Collected', 'Stability', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: '#475569', fontWeight: '700', fontSize: '0.65rem', borderBottom: `1px solid ${lisTheme.borderColor}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receivedSamples.map((s, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid #f1f5f9`, background: s.status === 'Rejected' ? '#fef2f2' : s.status === 'Accepted' ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: '700', color: '#1e40af' }}>{s.id}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '600', color: '#1e293b' }}>{s.patient}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: '700' }}>{s.test}</div>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>{s.dept}</div>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{s.tube}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b' }}>{s.collectedAt}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '700', background: s.stability === 'Stable' ? '#dcfce7' : '#fef3c7', color: s.stability === 'Stable' ? '#166534' : '#92400e' }}>
                          {s.stability}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '800', background: s.status === 'Accepted' ? '#dcfce7' : s.status === 'Rejected' ? '#fee2e2' : '#e0f2fe', color: s.status === 'Accepted' ? '#166534' : s.status === 'Rejected' ? '#b91c1c' : '#0369a1' }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {s.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleReceiveAccept(s)} style={{ background: '#059669', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}>
                              ✓ Accept
                            </button>
                            <button onClick={() => handleReceiveReject(s)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}>
                              ✗ Reject
                            </button>
                            <button onClick={() => { addNotification('Recollection Triggered', `${s.id} flagged — new draw requested.`, 'warning'); }} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}>
                              ↺ Recollect
                            </button>
                          </div>
                        )}
                        {s.status !== 'Pending' && (
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>Action complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {lisTab === 'worklist' && (

          <AnalyzerGateway 
            lisTheme={lisTheme} 
            addNotification={addNotification} 
            labOrders={labOrders} 
            setLabOrders={setLabOrders} 
          />
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
                      {order.status === 'Pending Auth' ? 'Ã¢Å“â€œ Submitted for Auth' : '⚠️ Action Required'}
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
                    setLabOrders(prev => prev.map(o => o.id === activeEntryOrder.id ? { ...o, status: 'Pending Auth', tests: entryTests } : o));
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
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Prev. Value</th>
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Delta Check</th>
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Ref. Flag</th>
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Reference Range</th>
                        <th style={{ padding: '10px 12px', borderBottom: `1px solid ${lisTheme.borderColor}`, color: '#475569' }}>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryTests.map(t => {
                        const oldVal = parseFloat(t.oldResult);
                        const curVal = parseFloat(t.result);
                        let deltaStr = '-';
                        let deltaFlag = false;
                        if (!isNaN(oldVal) && !isNaN(curVal) && oldVal !== 0) {
                          const deltaPercent = Math.abs((curVal - oldVal) / oldVal) * 100;
                          deltaStr = deltaPercent.toFixed(1) + '%';
                          if (deltaPercent > 15) deltaFlag = true;
                        }

                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid #e2e8f0', background: t.isDerived ? '#f8fafc' : 'transparent' }}>
                            <td style={{ padding: '10px 12px', fontWeight: '600', color: '#1e293b' }}>
                              {t.param}
                              {t.isDerived && <span style={{ marginLeft: '6px', fontSize: '0.6rem', color: '#3b82f6', background: '#eff6ff', border: '1px solid #dbeafe', padding: '2px 4px', borderRadius: '4px' }}>DERIVED</span>}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <input 
                                type="text" 
                                value={t.result} 
                                onChange={(e) => handleResultChange(t.id, e.target.value)}
                                disabled={activeEntryOrder.status !== 'Tech Entry' || t.isDerived}
                                style={{ 
                                  width: '90px', 
                                  border: `1px solid ${t.flag === 'CRITICAL' ? '#dc2626' : (t.flag ? '#fca5a5' : lisTheme.borderColor)}`, 
                                  padding: '6px', borderRadius: '4px',
                                  background: t.isDerived ? '#f8fafc' : (activeEntryOrder.status !== 'Tech Entry' ? '#f1f5f9' : (t.flag ? '#fef2f2' : 'white')),
                                  color: t.flag === 'CRITICAL' ? '#b91c1c' : (t.flag ? '#dc2626' : '#334155'),
                                  fontWeight: t.flag || t.isDerived ? '700' : '500',
                                  boxShadow: t.flag ? '0 0 0 1px #fca5a5' : 'none'
                                }} 
                              />
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace' }}>{t.oldResult || '--'}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ 
                                color: deltaFlag ? '#ea580c' : '#64748b', 
                                fontWeight: deltaFlag ? '700' : '500',
                                fontSize: '0.75rem',
                                background: deltaFlag ? '#ffedd5' : 'transparent',
                                padding: deltaFlag ? '2px 6px' : '0',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {deltaStr} {deltaFlag && <AlertTriangle size={10} />}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              {t.flag === 'CRITICAL' ? (
                                <span style={{ background: '#7f1d1d', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: '800', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px', animation: 'pulse 2s infinite' }}>
                                  <ShieldAlert size={12} /> CRITICAL ALERT (SMS ARMED)
                                </span>
                              ) : t.flag && (
                                <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', fontSize: '0.7rem' }}>
                                  {t.flag === 'H' ? 'HIGH Ã¢â€“Â²' : 'LOW Ã¢â€“Â¼'}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#64748b' }}>{t.min} - {t.max}</td>
                            <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{t.unit}</td>
                          </tr>
                        );
                      })}
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
          <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', height: '100%' }}>
            
            {/* Left Sidebar: Pathologist Validation Queue */}
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#f8fafc', padding: '12px', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, fontSize: '0.8rem', color: lisTheme.headerBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckSquare size={14} /> MD Validation Queue</span>
                {/* Bulk Action Trigger */}
                <button onClick={() => {
                  const pendingNormals = labOrders.filter(o => {
                    if (o.status !== 'Pending Auth') return false;
                    const hasFlags = o.tests && o.tests.some(t => t.flag === 'H' || t.flag === 'L' || t.flag === 'CRITICAL');
                    return !hasFlags;
                  });
                  
                  if (pendingNormals.length > 0) {
                    setLabOrders(prev => prev.map(o => {
                      const isNormalPending = o.status === 'Pending Auth' && (!o.tests || !o.tests.some(t => t.flag === 'H' || t.flag === 'L' || t.flag === 'CRITICAL'));
                      return isNormalPending ? { ...o, status: 'Authorized', comment: 'Auto-Verified: Normal Indices' } : o;
                    }));
                    addNotification("Bulk Safe-Sign", `Electronically authorized ${pendingNormals.length} normal reports. Abnormal cases retained for auditing.`, "success");
                  } else {
                    addNotification("Action Aborted", "No risk-free (completely normal) reports found in queue.", "warning");
                  }
                }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '700' }}>
                  Bulk Sign (Normal)
                </button>
              </div>
              
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {labOrders.filter(o => o.status === 'Pending Auth' || o.status === 'Authorized').map(order => {
                  const hCount = order.tests ? order.tests.filter(t => t.flag === 'H').length : 0;
                  const lCount = order.tests ? order.tests.filter(t => t.flag === 'L').length : 0;
                  const cCount = order.tests ? order.tests.filter(t => t.flag === 'CRITICAL').length : 0;
                  const isStat = order.isStat || false;

                  return (
                    <div key={order.id} onClick={() => { setActiveAuthOrder(order); setPathologistComment(order.comment || ''); }} style={{ 
                      padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: lisTheme.fontSize, 
                      background: activeAuthOrder?.id === order.id ? '#eff6ff' : (order.status === 'Authorized' ? '#f0fdf4' : (isStat ? '#fff1f2' : 'white')),
                      borderLeft: activeAuthOrder?.id === order.id ? '4px solid #2563eb' : '4px solid transparent',
                      position: 'relative'
                    }}>
                      {isStat && order.status !== 'Authorized' && (
                        <span className="animate-pulse" style={{ position: 'absolute', top: '12px', right: '12px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', fontSize: '0.6rem', letterSpacing: '0.5px' }}>STAT</span>
                      )}
                      
                      <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>ID: {order.id}</span>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span>{order.patientName}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '6px' }}>
                        {order.age || '32'}Y / {order.gender === 'Female' ? 'F' : 'M'} • {order.testName}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {order.status === 'Authorized' ? (
                          <span style={{ color: '#059669', fontSize: '0.65rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}><CheckCircle size={10} /> SIGNED</span>
                        ) : (
                          <>
                            {cCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '1px 4px', borderRadius: '3px', fontWeight: '800', fontSize: '0.6rem' }}>{cCount} CRIT!</span>}
                            {hCount > 0 && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 4px', borderRadius: '3px', fontWeight: '700', fontSize: '0.6rem' }}>{hCount} H</span>}
                            {lCount > 0 && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '1px 4px', borderRadius: '3px', fontWeight: '700', fontSize: '0.6rem' }}>{lCount} L</span>}
                            {hCount === 0 && lCount === 0 && cCount === 0 && <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '1px 4px', borderRadius: '3px', fontWeight: '700', fontSize: '0.6rem' }}>NORMAL</span>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {labOrders.filter(o => o.status === 'Pending Auth' || o.status === 'Authorized').length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: lisTheme.fontSize }}>
                    <CheckCircle size={32} style={{ opacity: 0.2, margin: '0 auto 8px' }} />
                    MD queue is currently clear.
                  </div>
                )}
              </div>
            </div>

            {/* Right Screen: Clinical Workspace */}
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {activeAuthOrder ? (
                <>
                  {/* Patient Diagnostic Header */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderBottom: `1px solid ${lisTheme.borderColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: '800', color: lisTheme.headerBg }}>{activeAuthOrder.patientName}</span>
                          <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '0.7rem', color: '#475569' }}>
                            {activeAuthOrder.age || '32'}Y / {activeAuthOrder.gender || 'Male'}
                          </span>
                          {activeAuthOrder.isStat && <span className="animate-pulse" style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', fontSize: '0.7rem' }}>STAT EMERGENCY</span>}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px' }}>
                          <span><strong>UHID:</strong> {activeAuthOrder.uhid}</span>
                          <span>|</span>
                          <span><strong>Ref By:</strong> {activeAuthOrder.refBy || 'Dr. Clinical Specialist'}</span>
                          <span>|</span>
                          <span><strong>Reg:</strong> {activeAuthOrder.timestamp}</span>
                        </div>
                      </div>
                      
                      <div>
                        {activeAuthOrder.status === 'Pending Auth' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => {
                              setLabOrders(prev => prev.map(o => o.id === activeAuthOrder.id ? { ...o, status: 'Authorized', comment: pathologistComment } : o));
                              addNotification("Authorized", `Signed & Seal applied to Order ${activeAuthOrder.id}.`, "success");
                              setActiveAuthOrder(null);
                            }} style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(5,150,105,0.2)' }}>
                              <ShieldCheck size={14} /> Approve & Sign Electronically
                            </button>
                            <button onClick={() => {
                              setLabOrders(prev => prev.map(o => o.id === activeAuthOrder.id ? { ...o, status: 'Tech Entry' } : o));
                              addNotification("Order Rejected", `Order ${activeAuthOrder.id} sent back to tech queue for re-run.`, "error");
                              setActiveAuthOrder(null);
                            }} style={{ background: 'transparent', color: '#dc2626', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}>
                              Query/Reject
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#ecfdf5', padding: '6px 12px', borderRadius: '6px', border: '1px solid #a7f3d0', fontWeight: '800', fontSize: '0.8rem' }}>
                            <CheckCircle size={16} /> SIGNATURE APPLIED (VERIFIED)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Equipment Metadata Strip */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.68rem', color: '#475569', background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} style={{ color: '#64748b' }} /> <strong>Collection Time:</strong> {activeAuthOrder.collectionTime || '11:45 AM'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Beaker size={12} style={{ color: '#64748b' }} /> <strong>Analyzer Engine:</strong> {activeAuthOrder.analyzer || 'Roche Cobas c311'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><RefreshCw size={12} style={{ color: '#64748b' }} /> <strong>Interface:</strong> ASTM Bi-Directional LIS</span>
                      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: '800', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                        <ShieldCheck size={10} /> QC VALIDATION PASSED
                      </span>
                    </div>
                  </div>

                  {/* Raw Laboratory Telemetry Grid */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '800', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Analytical Evaluation Matrix</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>* Delta alarms triggered automatically on variance &gt; 15%</div>
                    </div>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: lisTheme.fontSize }}>
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${lisTheme.borderColor}`, color: '#64748b', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px', fontWeight: '700' }}>Analyte Description</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'center' }}>Current Observed Value</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'center' }}>Status Flag</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'center' }}>Historical Value (Prev)</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700', textAlign: 'center' }}>Delta Check</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700' }}>Unit</th>
                          <th style={{ padding: '8px 12px', fontWeight: '700' }}>Biological Ref Interval</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAuthOrder.tests ? activeAuthOrder.tests.map((t, idx) => {
                          const val = parseFloat(t.result);
                          let histVal = t.oldResult || (isNaN(val) ? 'N/A' : (val * (0.9 + Math.random() * 0.2)).toFixed(1));
                          const delta = !isNaN(val) && !isNaN(parseFloat(histVal)) ? Math.abs(((val - parseFloat(histVal)) / parseFloat(histVal)) * 100).toFixed(0) : '0';
                          
                          let valStyle = { fontWeight: '800', fontSize: '0.85rem', color: '#1e293b' };
                          let flagBadge = <span style={{ color: '#94a3b8' }}>--</span>;
                          let rowBackground = 'transparent';

                          if (t.flag === 'H') {
                            valStyle.color = '#dc2626';
                            flagBadge = <span style={{ background: '#fee2e2', color: '#dc2626', fontWeight: '800', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '3px' }}>HIGH Ã¢â€“Â²</span>;
                          } else if (t.flag === 'L') {
                            valStyle.color = '#2563eb';
                            flagBadge = <span style={{ background: '#eff6ff', color: '#2563eb', fontWeight: '800', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '3px' }}>LOW Ã¢â€“Â¼</span>;
                          } else if (t.flag === 'CRITICAL') {
                            valStyle.color = '#dc2626';
                            rowBackground = '#fff1f2';
                            flagBadge = <span className="animate-pulse" style={{ background: '#ef4444', color: 'white', fontWeight: '900', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '3px' }}>Ã°Å¸Å¡Â¨ CRITICAL</span>;
                          }

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: rowBackground }}>
                              <td style={{ padding: '10px 12px', fontWeight: '600', color: '#334155' }}>
                                {t.param} {t.isDerived && <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '1px 3px', borderRadius: '3px', fontSize: '0.55rem', marginLeft: '4px' }}>CALC</span>}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', ...valStyle }}>
                                {t.result || 'Pending'}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                {flagBadge}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontWeight: '500' }}>
                                {histVal}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                {!isNaN(parseFloat(delta)) && parseFloat(delta) > 0 ? (
                                  <span style={{ 
                                    fontSize: '0.65rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
                                    background: parseFloat(delta) > 15 ? '#fee2e2' : '#f0fdf4',
                                    color: parseFloat(delta) > 15 ? '#b91c1c' : '#15803d'
                                  }}>
                                    {parseFloat(delta) > 15 ? '⚠️ ' : ''}{delta}% shift
                                  </span>
                                ) : '--'}
                              </td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{t.unit}</td>
                              <td style={{ padding: '10px 12px', color: '#475569', fontFamily: 'monospace', fontWeight: '500' }}>{t.min} - {t.max}</td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No tests populated inside order payload.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Diagnostic Commentary Input Box */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderTop: `1px solid ${lisTheme.borderColor}` }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                      <FileText size={14} style={{ color: '#4b5563' }} /> MD Interpretive Commentary & Addendums
                    </label>
                    <textarea 
                      value={pathologistComment}
                      onChange={e => setPathologistComment(e.target.value)}
                      disabled={activeAuthOrder.status === 'Authorized'}
                      placeholder="Enter interpretive observations, suggest radiological correlation, or add clinical advisory notes..."
                      style={{ width: '100%', height: '72px', padding: '10px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '6px', fontSize: '0.75rem', resize: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#94a3b8', gap: '12px' }}>
                  <CheckSquare size={48} style={{ opacity: 0.2 }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Select an order from the validation queue to inspect medical telemetry</div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================= 6. ISSUING ================= */}
        {lisTab === 'issuing' && (
          <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', height: '100%' }}>
             {/* Authorized Reports Sidebar */}
             <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
               <div style={{ background: '#f8fafc', padding: '12px', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, fontSize: '0.8rem', color: lisTheme.headerBg }}>
                 Authorized Reports Queue
               </div>
               <div style={{ overflowY: 'auto', flex: 1 }}>
                 {labOrders.filter(o => o.status === 'Authorized').map(order => (
                   <div key={order.id} onClick={() => setActiveIssuingOrder(order)} style={{ 
                     padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: lisTheme.fontSize, 
                     background: activeIssuingOrder?.id === order.id ? '#f0fdf4' : 'white',
                     borderLeft: activeIssuingOrder?.id === order.id ? '4px solid #16a34a' : '4px solid transparent'
                   }}>
                     <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{order.id} - {order.patientName}</div>
                     <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: '6px' }}>{order.testName}</div>
                     <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       <CheckCircle size={12} /> READY FOR ISSUING
                     </div>
                   </div>
                 ))}
                 {labOrders.filter(o => o.status === 'Authorized').length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: lisTheme.fontSize }}>No authorized reports ready.</div>}
               </div>
             </div>
             
             <div style={{ overflow: 'hidden', height: '100%' }}>
               <LisResultIssuing 
                 labOrder={activeIssuingOrder} 
                 labOrders={labOrders}
                 addNotification={addNotification} 
                 setLabOrders={setLabOrders}
                 setActiveIssuingOrder={setActiveIssuingOrder}
               />
             </div>
          </div>
        )}

        {/* ================= 7. QUALITY CONTROL (QC) ================= */}
        {lisTab === 'qc' && (() => {
          const stats = computeQCStats(qcData);
          const isLocked = stats.violations.some(v => v.includes('Reject'));
          
          return (
            <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '16px', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Statistical Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Current Statistical Mean (xÃŒâ€ž)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{stats.mean}</div>
                  </div>
                  <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Standard Deviation (SD)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{stats.sd}</div>
                  </div>
                  <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Coef. of Variation (CV%)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: stats.cv > 5 ? '#d97706' : '#16a34a' }}>{stats.cv}%</div>
                  </div>
                </div>

                {/* LJ Chart */}
                <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, padding: '20px', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: lisTheme.headerBg, display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> Real-time Levey-Jennings Chart Analysis</h3>
                    <span style={{ background: isLocked ? '#fef2f2' : '#f0fdf4', border: `1px solid ${isLocked ? '#fca5a5' : '#bbf7d0'}`, color: isLocked ? '#991b1b' : '#15803d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {isLocked ? <><ShieldAlert size={12} /> MACHINE LOCKED</> : <><CheckCircle size={12} /> CALIBRATION OK</>}
                    </span>
                  </div>

                  <div style={{ position: 'relative', height: '240px', borderLeft: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1', marginLeft: '40px', marginBottom: '30px', marginRight: '20px', flex: 1 }}>
                    {/* SD Grids */}
                    <div style={{ position: 'absolute', top: '10%', width: '100%', borderTop: '1px dashed #fee2e2', zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', top: '25%', width: '100%', borderTop: '1px dashed #fca5a5', zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', top: '50%', width: '100%', borderTop: '2px solid #94a3b8', zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', top: '75%', width: '100%', borderTop: '1px dashed #fca5a5', zIndex: 1 }}></div>
                    <div style={{ position: 'absolute', top: '90%', width: '100%', borderTop: '1px dashed #fee2e2', zIndex: 1 }}></div>

                    <span style={{ position: 'absolute', left: '-40px', top: '8%', fontSize: '0.6rem', color: '#b91c1c', fontWeight: '800' }}>+3 SD</span>
                    <span style={{ position: 'absolute', left: '-40px', top: '23%', fontSize: '0.6rem', color: '#ea580c', fontWeight: '800' }}>+2 SD</span>
                    <span style={{ position: 'absolute', left: '-40px', top: '48%', fontSize: '0.6rem', color: '#475569', fontWeight: '800' }}>xÃŒâ€ž Mean</span>
                    <span style={{ position: 'absolute', left: '-40px', top: '73%', fontSize: '0.6rem', color: '#ea580c', fontWeight: '800' }}>-2 SD</span>
                    <span style={{ position: 'absolute', left: '-40px', top: '88%', fontSize: '0.6rem', color: '#b91c1c', fontWeight: '800' }}>-3 SD</span>

                    <div style={{ display: 'flex', justifyContent: 'space-between', height: '100%', alignItems: 'flex-end', padding: '0 15px', position: 'relative', zIndex: 2 }}>
                      {stats.points.map((d, i) => {
                        const topPosPercent = Math.max(0, Math.min(100, 50 - (d.z * 12.5)));
                        const isRed = Math.abs(d.z) > 3;
                        const isOrange = Math.abs(d.z) > 2 && Math.abs(d.z) <= 3;

                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '16px' }}>
                            <div style={{ 
                              width: '8px', height: '8px', borderRadius: '50%', 
                              background: isRed ? '#ef4444' : (isOrange ? '#f97316' : '#3b82f6'), 
                              position: 'absolute', top: `${topPosPercent}%`, transform: 'translateY(-50%)',
                              boxShadow: Math.abs(d.z) > 2 ? `0 0 0 4px ${isRed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)'}` : 'none',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }} title={`Val: ${d.val}, Z: ${d.z.toFixed(2)}`}></div>
                            <span style={{ position: 'absolute', bottom: '-20px', fontSize: '0.6rem', color: '#64748b', fontWeight: '600' }}>D{d.day}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Daily Log Form */}
                <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}><Save size={14}/> Add Daily Control Run</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="number" 
                      placeholder="Result Value" 
                      value={newQcInput}
                      onChange={(e) => setNewQcInput(e.target.value)}
                      style={{ flex: 1, padding: '8px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '4px', fontSize: '0.8rem' }}
                    />
                    <button onClick={() => {
                      const val = parseFloat(newQcInput);
                      if (isNaN(val)) return;
                      setQcData([...qcData, { day: qcData.length + 1, val }]);
                      setNewQcInput('');
                      addNotification("Control Logged", `Logged QC run for Day ${qcData.length + 1}`, "success");
                    }} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}>
                      Log Run
                    </button>
                  </div>
                </div>

                {/* Rule Infractions Engine Output */}
                <div style={{ flex: 1, background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={16} color="#ef4444"/> Westgard Validation Infractions</h4>
                  
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.violations.length === 0 ? (
                      <div style={{ color: '#15803d', background: '#f0fdf4', padding: '12px', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: '700' }}>Ã¢Å“â€œ All Checks Passed</div>
                        <div>Control rules are stable. System authorized to validate clinical results.</div>
                      </div>
                    ) : (
                      stats.violations.map((v, idx) => {
                        const isWarning = v.includes('Warning');
                        return (
                          <div key={idx} style={{ 
                            fontSize: '0.75rem', padding: '10px', borderRadius: '6px', 
                            background: isWarning ? '#fffbeb' : '#fef2f2', 
                            color: isWarning ? '#b45309' : '#991b1b',
                            border: `1px solid ${isWarning ? '#fde68a' : '#fecaca'}`,
                            borderLeft: `4px solid ${isWarning ? '#f59e0b' : '#ef4444'}`
                          }}>
                            {v}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Card 1: TAT Compliance */}
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

              {/* Card 2: Pending Violations */}
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

            {/* Full Width Card 3: Reagent Depletion Analytics */}
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', color: lisTheme.headerBg, display: 'flex', alignItems: 'center', gap: '8px' }}><Droplet size={18} /> Automated Reagent Inventory Depletion Dashboard</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${lisTheme.borderColor}`, textAlign: 'left', background: '#f8fafc' }}>
                      <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Reagent Name</th>
                      <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Initial Fill</th>
                      <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Tests Run</th>
                      <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Calculated Depletion</th>
                      <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Current Net Vol</th>
                      <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Reorder Point</th>
                      <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Alert Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reagents.map((r, idx) => {
                      const rawVol = r.initialVolume - (r.totalTests * r.volPerTest) - r.deadVolume;
                      const currentVol = Math.max(0, rawVol);
                      const pctRemaining = Math.round((currentVol / r.initialVolume) * 100);
                      
                      const reorderPoint = (r.avgDailyConsum * r.leadTime) + r.safetyStock;
                      const needsReorder = currentVol <= reorderPoint;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{r.name}</td>
                          <td style={{ padding: '12px', color: '#64748b' }}>{r.initialVolume} {r.unit}</td>
                          <td style={{ padding: '12px', color: '#64748b', fontWeight: '600' }}>{r.totalTests}</td>
                          <td style={{ padding: '12px', color: '#94a3b8' }}>{(r.totalTests * r.volPerTest).toFixed(0)} {r.unit} + {r.deadVolume}{r.unit} Loss</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontWeight: '800', color: needsReorder ? '#b91c1c' : '#0f172a', fontFamily: 'monospace' }}>
                                {currentVol.toFixed(1)} {r.unit}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({pctRemaining}%)</span>
                            </div>
                            <div style={{ width: '120px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                              <div style={{ width: `${pctRemaining}%`, height: '100%', background: needsReorder ? '#ef4444' : '#22c55e' }}></div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '700', color: '#64748b', fontFamily: 'monospace' }}>{reorderPoint} {r.unit}</td>
                          <td style={{ padding: '12px' }}>
                            {needsReorder ? (
                              <span style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={12} /> TRIGGER REORDER
                              </span>
                            ) : (
                              <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={12} /> STOCK ADEQUATE
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= FEATURE 10. PHLEBO SUPERVISOR ================= */}
        {lisTab === 'super_dash' && (() => {
          // Live Calculation aggregators
          const total = labOrders.length;
          const collected = labOrders.filter(o => o.status !== 'Sample Pending' && o.status !== 'Cancelled').length;
          const pending = labOrders.filter(o => o.status === 'Sample Pending').length;
          const rejected = labOrders.filter(o => o.status === 'Cancelled').length;

          // Calculate live overdues dynamically using Feature 8 clock
          const overdue = labOrders.filter(o => {
            if (o.status !== 'Sample Pending') return false;
            const isStat = o.isStat || o.priority === 'STAT';
            const limit = isStat ? 15 : (o.priority === 'Urgent' ? 30 : 60);
            const elapsed = Math.floor((currentTime - (o.creationTimeMs || (Date.now() - 10*60*1000))) / 60000);
            return (limit - elapsed) <= 0;
          }).length;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
              {/* Header block with action buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a', fontWeight: '800' }}>Phlebotomy Operational Command Hub</h2>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Real-time floor activity, workforce utilization & pre-analytical quality metrics</div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      addNotification('Export Successful', 'Phlebotomy Performance report generated as PDF.', 'success');
                      logPhleboAudit('SUPERVISOR_EXPORT', 'ALL', 'Exported floor metrics to PDF.');
                    }}
                    style={{ background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  >
                    <Printer size={14} /> Export PDF Report
                  </button>
                  <button 
                    style={{ background: '#1e40af', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    onClick={() => addNotification('Data Refreshed', 'Synchronized floor queue metrics.', 'info')}
                  >
                    <RefreshCw size={14} /> Refresh Live
                  </button>
                </div>
              </div>

              {/* KPI Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                {[
                  { label: 'TOTAL LOGGED ORDERS', val: total, color: '#0f172a', bg: 'white', border: '#e2e8f0', icon: <Database size={16} /> },
                  { label: 'SUCCESSFULLY COLLECTED', val: collected, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: <CheckCircle size={16} /> },
                  { label: 'PENDING VENIPUNCTURE', val: pending, color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: <Clock size={16} /> },
                  { label: 'REJECTED / CANCELLED', val: rejected, color: '#991b1b', bg: '#fef2f2', border: '#fecaca', icon: <AlertTriangle size={16} /> },
                  { label: 'TAT BREACHED (OVERDUE)', val: overdue, color: '#ffffff', bg: '#ef4444', border: '#dc2626', icon: <ShieldAlert size={16} />, blink: overdue > 0 }
                ].map((c, i) => (
                  <div key={i} style={{
                    background: c.bg, border: `1px solid ${c.border}`, padding: '16px', borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '6px',
                    animation: c.blink ? 'pulse 1.5s infinite' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: c.blink ? '#fecaca' : '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {c.icon} {c.label}
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: c.color, fontFamily: 'monospace' }}>{c.val}</div>
                  </div>
                ))}
              </div>

              {/* Charts Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
                {/* Hourly Workload Bar Chart */}
                <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 size={16} style={{ color: '#3b82f6' }} /> Hourly Specimen Volume Distribution
                  </h3>
                  <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', position: 'relative' }}>
                    {[
                      { h: '08:00', v: 24 }, { h: '09:00', v: 48 }, { h: '10:00', v: 76 },
                      { h: '11:00', v: 94 }, { h: '12:00', v: 65 }, { h: '13:00', v: Math.max(20, collected * 8) }
                    ].map((bar, bi) => (
                      <div key={bi} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '800' }}>{bar.v}</span>
                        <div style={{ 
                          width: '100%', height: `${(bar.v / 100) * 140}px`, 
                          background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '6px 6px 0 0',
                          transition: 'height 0.5s ease-out'
                        }}></div>
                        <span style={{ position: 'absolute', bottom: '-25px', fontSize: '0.65rem', fontWeight: '700', color: '#94a3b8' }}>{bar.h}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '25px', display: 'flex', gap: '12px', fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#3b82f6' }}></span> Core Collection Volumes</span>
                  </div>
                </div>

                {/* Rejection Quality Donut Chart */}
                <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <PieChart size={16} style={{ color: '#f59e0b' }} /> Rejection Reason Distribution (QA)
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', height: '180px' }}>
                    <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'conic-gradient(#ef4444 0% 45%, #f59e0b 45% 75%, #3b82f6 75% 100%)', position: 'relative', boxShadow: 'inset 0 0 0 25px white, 0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.62rem', color: '#64748b', fontWeight: '800', textAlign: 'center' }}>
                        Total QA<br/><strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{rejected || 12}</strong>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { label: 'Hemolyzed Vials', val: '45%', c: '#ef4444' },
                        { label: 'Insufficient Vol (QNS)', val: '30%', c: '#f59e0b' },
                        { label: 'Wrong Container', val: '25%', c: '#3b82f6' }
                      ].map((slice, si) => (
                        <div key={si} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: '600' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: slice.c }}></span> {slice.label}
                          </span>
                          <span style={{ fontWeight: '800', fontFamily: 'monospace', color: '#1e293b' }}>{slice.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Performance Grid */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} style={{ color: '#10b981' }} /> Workforce Utilization & Staff TAT Scorecard
                  </h3>
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '4px 8px', background: '#ecfdf5', color: '#047857', borderRadius: '4px' }}>Live Shift Data</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569' }}>Phlebotomist / Staff ID</th>
                      <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569' }}>Vials Collected</th>
                      <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569' }}>Rejection Rate</th>
                      <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569' }}>Avg Cycle Time (TAT)</th>
                      <th style={{ padding: '12px 20px', fontWeight: '700', color: '#475569' }}>Audit Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Rahul Saxena', id: 'PHLEBO_001', col: 42, rej: 2, rate: '4.7%', tat: '8.4 min', score: 'Gold', color: '#d97706' },
                      { name: 'Nisha Verma', id: 'PHLEBO_002', col: 38, rej: 1, rate: '2.6%', tat: '9.2 min', score: 'Platinum', color: '#475569' },
                      { name: 'Arjun Mehta', id: 'PHLEBO_003', col: 15, rej: 4, rate: '26.6%', tat: '14.5 min', score: 'Needs Review', color: '#dc2626' }
                    ].map((staff, sti) => (
                      <tr key={sti} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px' }}>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{staff.name}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>{staff.id}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 20px', fontWeight: '700', color: '#0f172a' }}>{staff.col} vials</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ 
                            fontWeight: '700', 
                            color: staff.rej > 2 ? '#dc2626' : '#15803d',
                            background: staff.rej > 2 ? '#fef2f2' : '#f0fdf4',
                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem'
                          }}>
                            {staff.rate} ({staff.rej} errors)
                          </span>
                        </td>
                        <td style={{ padding: '12px 20px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>{staff.tat}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{ 
                            fontSize: '0.7rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px',
                            color: staff.color
                          }}>
                            <Award size={12} /> {staff.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

      {/* ========================================================= */}
      {/* FEATURE 1: PATIENT IDENTITY VERIFICATION MODAL OVERLAY    */}
      {/* ========================================================= */}
      {verifyingOrderId && (() => {
        const order = labOrders.find(o => o.id === verifyingOrderId);
        if (!order) return null;

        return (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                background: '#0f172a',
                padding: '20px 24px',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color="#22c55e" /> Verify Patient Identity
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Security Protocol: Double-identifier Check</p>
                </div>
                <button 
                  onClick={() => { setVerifyingOrderId(null); setVerifyFeedback(null); }}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient ID / Case</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{order.id} • {order.uhid}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', textAlign: 'left' }}>Enter Patient Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sunil Kumar"
                    value={verifyNameInput}
                    onChange={(e) => setVerifyNameInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#334155', textAlign: 'left' }}>Enter Patient Date of Birth</label>
                  <input 
                    type="date" 
                    value={verifyDobInput}
                    onChange={(e) => setVerifyDobInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #cbd5e1',
                      fontSize: '0.95rem',
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'left' }}>Ask patient to confirm their registered DOB.</span>
                </div>

                {/* Feedback State */}
                {verifyFeedback && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: verifyFeedback.success ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${verifyFeedback.success ? '#bbf7d0' : '#fecaca'}`,
                    color: verifyFeedback.success ? '#15803d' : '#991b1b',
                    fontWeight: '700',
                    fontSize: '0.9rem'
                  }}>
                    {verifyFeedback.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    {verifyFeedback.message}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
                <button 
                  onClick={() => { setVerifyingOrderId(null); setVerifyFeedback(null); }}
                  style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleConfirmVerification(verifyingOrderId)}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#1e293b',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                >
                  Confirm Match
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {recollectingOrderId && (() => {
        const order = labOrders.find(o => o.id === recollectingOrderId);
        if (!order) return null;
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '450px', maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e2e8f0', animation: 'scaleIn 0.2s ease-out' }}>
              {/* Header */}
              <div style={{ background: '#ea580c', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCw size={22} style={{ animation: 'spin 4s linear infinite' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Initiate Recollection Protocol</h3>
                  <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Order ID: {order.id} | Patient: {order.patientName}</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Selection for Priority */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '750', color: '#334155' }}>Recollection Priority Level:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {['Routine', 'Urgent', 'STAT'].map((lvl) => {
                      const isActive = recollectPriority === lvl;
                      return (
                        <button
                          key={lvl}
                          onClick={() => setRecollectPriority(lvl)}
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            border: isActive ? `2px solid ${lvl === 'STAT' ? '#dc2626' : '#ea580c'}` : '1px solid #cbd5e1',
                            background: isActive ? (lvl === 'STAT' ? '#fef2f2' : '#fff7ed') : 'white',
                            color: isActive ? (lvl === 'STAT' ? '#991b1b' : '#9a3412') : '#64748b',
                            fontWeight: '750',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {lvl === 'STAT' ? '⚡ STAT' : lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dropdown for Reason */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '750', color: '#334155' }}>Official Reason for Recollection:</label>
                  <select 
                    value={recollectReason}
                    onChange={(e) => setRecollectReason(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '2px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', color: '#1e293b' }}
                  >
                    <option>Sample Hemolyzed</option>
                    <option>Insufficient Sample Volume (QNS)</option>
                    <option>Sample Clotted (Inappropriate Inversion)</option>
                    <option>Wrong Tube Type Used</option>
                    <option>Label Identification Failure</option>
                    <option>Sample Contamination</option>
                    <option>Analyzer Aspiration Failure</option>
                  </select>
                </div>

                <div style={{ background: '#fffbeb', padding: '12px', borderLeft: '4px solid #f59e0b', fontSize: '0.75rem', color: '#78350f', lineHeight: '1.4', borderRadius: '4px' }}>
                  <strong>Action Description:</strong> This action will automatically generate a new cloned active specimen order in the phlebotomy draw queue. The original sample will remain logged as <em>Rejected/Cancelled</em> for compliance auditing.
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
                <button 
                  onClick={() => setRecollectingOrderId(null)}
                  style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleConfirmRecollection(recollectingOrderId)}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#ea580c',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(234,88,12,0.2)'
                  }}
                >
                  Confirm & Queue New Order
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {addonOrderId && (() => {
        const order = labOrders.find(o => o.id === addonOrderId);
        if (!order) return null;

        const addonCatalog = {
          'Lipid Profile': { code: 'ADD-LIP', vol: 2.5 },
          'HbA1c': { code: 'ADD-HBA', vol: 1.5 },
          'Thyroid Panel (T3/T4/TSH)': { code: 'ADD-THY', vol: 3.0 },
          'Troponin I': { code: 'ADD-TRO', vol: 2.0 },
          'D-Dimer': { code: 'ADD-DDM', vol: 3.5 }
        };
        const currentVol = typeof order.sampleVolume === 'number' ? order.sampleVolume : 5.0;
        const reqVol = (addonCatalog[selectedAddonTest] || { vol: 0 }).vol;
        const hasVol = currentVol >= reqVol;

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '450px', maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #e2e8f0', animation: 'scaleIn 0.2s ease-out' }}>
              {/* Header */}
              <div style={{ background: '#047857', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FlaskConical size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800' }}>Authorize Add-On Order</h3>
                  <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Parent Lab No: {order.id} | {order.patientName}</span>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Dropdown for Add-On Selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '750', color: '#334155' }}>Select Add-On Test Target:</label>
                  <select 
                    value={selectedAddonTest}
                    onChange={(e) => setSelectedAddonTest(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', color: '#1e293b', fontWeight: '600' }}
                  >
                    {Object.keys(addonCatalog).map(k => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Volume Calculation UI */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '800', letterSpacing: '0.05em' }}>Clinical Volume Calculations</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: '#475569' }}>Current Available Volume:</span>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>{currentVol.toFixed(1)} mL</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px' }}>
                    <span style={{ color: '#475569' }}>Requested Test Minimum:</span>
                    <span style={{ fontWeight: '700', color: '#dc2626' }}>-{reqVol.toFixed(1)} mL</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: '800', paddingTop: '4px' }}>
                    <span>Projected Remainder:</span>
                    <span style={{ color: hasVol ? '#15803d' : '#b91c1c' }}>{(currentVol - reqVol).toFixed(1)} mL</span>
                  </div>
                </div>

                {/* Validation Notice Banner */}
                {hasVol ? (
                  <div style={{ background: '#ecfdf5', borderLeft: '4px solid #10b981', padding: '12px', fontSize: '0.78rem', color: '#065f46', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <CheckCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <strong>🟢 Sufficient Volume Confirmed.</strong> This add-on will be fulfilled utilizing the existing aliquot sample. No new venipuncture required.
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#fff7ed', borderLeft: '4px solid #ea580c', padding: '12px', fontSize: '0.78rem', color: '#854d0e', borderRadius: '4px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <strong>🟠 Insufficient Volume.</strong> Action will automatically lock this aliquot and dispatch a new STAT redraw order to the phlebotomy queue.
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
                <button 
                  onClick={() => setAddonOrderId(null)}
                  style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleConfirmAddon(addonOrderId)}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: hasVol ? '#047857' : '#ea580c',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: `0 4px 6px -1px ${hasVol ? 'rgba(4,120,87,0.2)' : 'rgba(234,88,12,0.2)'}`
                  }}
                >
                  {hasVol ? 'Authorize Add-On' : 'Confirm & Dispatch Redraw'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {checkingTubesOrderId && (() => {
        const order = labOrders.find(o => o.id === checkingTubesOrderId);
        if (!order) return null;

        const tube = order.tubeType || 'SST Gold';
        let rules = { invert: 5, wait: 0, temp: 'Room Temp', notes: 'Verify tube seal is fully air-tight.' };
        if (tube.includes('SST') || tube.includes('Gold')) {
          rules = { invert: 5, wait: 30, temp: 'Room Temp (22-25°C)', notes: 'Allow upright stand time for optimal clot formulation.' };
        } else if (tube.includes('EDTA') || tube.includes('Lavender')) {
          rules = { invert: 8, wait: 0, temp: 'Room Temp', notes: 'Do not centrifuge. Mix gently via inversions only.' };
        } else if (tube.includes('Citrate') || tube.includes('Blue')) {
          rules = { invert: 3, wait: 0, temp: 'Room Temp', notes: 'Ensure sample filling perfectly hits the etched fill line.' };
        } else if (tube.includes('Fluoride') || tube.includes('Grey')) {
          rules = { invert: 8, wait: 0, temp: 'Refrigerate (2-8°C)', notes: 'Protect from ambient thermal exposure.' };
        }

        const checklistSteps = [
          { id: 'invert', text: `Perform exactly ${rules.invert} complete, gentle inversions to mix additive.` },
          { id: 'wait', text: rules.wait > 0 ? `Maintain at stand-up for ${rules.wait} minutes before core transit.` : 'Verify no clot formation or macro-coagulation visual signs.' },
          { id: 'temp', text: `Ensure storage temperature compliance: ${rules.temp}.` },
          { id: 'notes', text: `Quality Control Alert: ${rules.notes}` }
        ];

        const allChecked = checklistSteps.every(step => checkedItems[step.id]);

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', width: '500px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'fadeInUp 0.2s ease-out' }}>
              
              {/* Header */}
              <div style={{ padding: '20px 24px', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ClipboardList size={22} style={{ color: '#38bdf8' }} />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>Tube Handling Quality Checklist</h3>
                    <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '2px' }}>Pre-collection specimen integrity protocol</div>
                  </div>
                </div>
                <button onClick={() => setCheckingTubesOrderId(null)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', cursor: 'pointer', opacity: 0.7 }}>&times;</button>
              </div>

              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Tube Indicator Banner */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>Specimen Required</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>{tube}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '4px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px' }}>
                      🧪 CLSI Standard
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.5' }}>
                  To satisfy ISO 15189 pre-analytical standards, please visually confirm and check off the physical handling steps performed for this draw:
                </div>

                {/* Checkbox List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {checklistSteps.map(step => {
                    const isDone = !!checkedItems[step.id];
                    return (
                      <label key={step.id} style={{ 
                        display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', borderRadius: '10px', 
                        border: `1.5px solid ${isDone ? '#bae6fd' : '#e2e8f0'}`,
                        background: isDone ? '#f0f9ff' : 'white', cursor: 'pointer', transition: 'all 0.2s ease'
                      }}>
                        <input 
                          type="checkbox" 
                          checked={isDone}
                          onChange={(e) => setCheckedItems(prev => ({ ...prev, [step.id]: e.target.checked }))}
                          style={{ width: '18px', height: '18px', accentColor: '#0284c7', marginTop: '1px', cursor: 'pointer' }}
                        />
                        <div style={{ fontSize: '0.82rem', color: isDone ? '#0369a1' : '#334155', fontWeight: isDone ? '700' : '500' }}>
                          {step.text}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {!allChecked && (
                  <div style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '10px 12px', fontSize: '0.75rem', color: '#854d0e', borderRadius: '4px' }}>
                    ⚠️ <strong>Validation Required:</strong> All handling steps must be physically executed and verified before specimen is logged as Collected.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
                <button 
                  onClick={() => setCheckingTubesOrderId(null)}
                  style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel Draw
                </button>
                <button 
                  disabled={!allChecked}
                  onClick={() => {
                    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    setLabOrders(prev => prev.map(o => o.id === order.id ? { 
                      ...o, 
                      status: 'Processing',
                      statusHistory: [...(o.statusHistory || []), { status: 'Vials Drawn', timestamp: ts, user: 'PHLEBO_001', detail: 'All handling checks approved.' }]
                    } : o));
                    setCollectionTimestamps(prev => ({ ...prev, [order.id]: ts }));
                    logPhleboAudit('COLLECT', order.id, `Drew ${tube} for ${order.patientName}. Pre-analytical quality checklist verified successfully.`);
                    addNotification('Collected & Quality Sealed', `${tube} collected and certified to CLSI standards.`, 'success');
                    setCheckingTubesOrderId(null);
                  }}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: allChecked ? '#0284c7' : '#cbd5e1',
                    color: 'white',
                    fontWeight: '700',
                    cursor: allChecked ? 'pointer' : 'not-allowed',
                    boxShadow: allChecked ? '0 4px 6px -1px rgba(2,132,199,0.3)' : 'none'
                  }}
                >
                  🔒 Mark Collected & Seal
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {historyOrderId && (() => {
        const order = labOrders.find(o => o.id === historyOrderId);
        if (!order) return null;

        const history = order.statusHistory || [
          { status: 'Order Placed in LIS', timestamp: 'Initial Entry', user: 'DOCTOR_SYS', detail: 'System auto-generated initial draw request.' }
        ];

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', width: '500px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'fadeInUp 0.2s ease-out' }}>
              
              {/* Header */}
              <div style={{ padding: '20px 24px', background: '#1e3a8a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={22} style={{ color: '#60a5fa' }} />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', margin: 0 }}>🛡️ Clinical Action History Log</h3>
                    <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '2px' }}>Immutable pre-analytical ledger for Audit Compliance</div>
                  </div>
                </div>
                <button onClick={() => setHistoryOrderId(null)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.3rem', cursor: 'pointer', opacity: 0.7 }}>&times;</button>
              </div>

              {/* Patient Banner */}
              <div style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Lab ID / Patient</span>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a' }}>{order.id} — {order.patientName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Status</span>
                  <div style={{ fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', background: order.status === 'Sample Pending' ? '#fffbeb' : '#f0fdf4', color: order.status === 'Sample Pending' ? '#b45309' : '#15803d', border: `1px solid ${order.status === 'Sample Pending' ? '#fde68a' : '#bbf7d0'}`, marginTop: '2px' }}>{order.status}</div>
                </div>
              </div>

              {/* Body - Vertical Timeline */}
              <div style={{ padding: '24px', maxHeight: '400px', overflowY: 'auto', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.82rem' }}>
                    No automated audit records logged yet.
                  </div>
                ) : (
                  <div style={{ position: 'relative', borderLeft: '2px dashed #e2e8f0', marginLeft: '10px', display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '20px' }}>
                    {history.map((log, lidx) => (
                      <div key={lidx} style={{ position: 'relative' }}>
                        {/* Bullet indicator */}
                        <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#1e3a8a', border: '3px solid white', boxShadow: '0 0 0 1px #1e3a8a' }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#1e293b' }}>
                            {log.status}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            🕒 {log.timestamp}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '700', color: '#475569' }}>By:</span> 
                          <span style={{ fontFamily: 'monospace', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 4px', borderRadius: '3px', fontSize: '0.68rem' }}>{log.user || 'UNKNOWN'}</span>
                        </div>
                        {log.detail && (
                          <div style={{ fontSize: '0.75rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', borderLeft: '2px solid #cbd5e1', marginTop: '6px', lineHeight: '1.4' }}>
                            {log.detail}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🔒 Blockchain Signed Ledger
                </span>
                <button 
                  onClick={() => setHistoryOrderId(null)}
                  style={{ padding: '8px 20px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(30,58,138,0.2)' }}
                >
                  Dismiss View
                </button>
              </div>
            </div>
          </div>
        );
      })()}


        {/* ================= 8. REPORT DELIVERY ================= */}
        {lisTab === 'delivery' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ background: '#0f172a', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Truck size={16} /> Report Delivery & Dispatch Console
                </span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '3px 10px', borderRadius: '10px' }}>
                  {deliveryLog.filter(d => d.status === 'Ready').length} ready • {deliveryLog.filter(d => d.status === 'Dispatched').length} dispatched
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                    {['Lab ID', 'Patient', 'Test', 'Authorized At', 'SMS', 'WhatsApp', 'Email', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', color: '#475569', fontWeight: '700', fontSize: '0.65rem', borderBottom: `1px solid ${lisTheme.borderColor}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliveryLog.map((d, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid #f1f5f9`, background: d.status === 'Dispatched' ? '#f0fdf4' : 'white' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: '700', color: '#1e40af' }}>{d.id}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '600' }}>{d.patient}</td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{d.test}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#64748b' }}>{d.authorized}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem' }}>{d.sms ? '✅' : '—'}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem' }}>{d.whatsapp ? '✅' : '—'}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem' }}>{d.email ? '✅' : '—'}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '800', background: d.status === 'Dispatched' ? '#dcfce7' : '#dbeafe', color: d.status === 'Dispatched' ? '#166534' : '#1e40af' }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          <button onClick={() => handleDeliveryDispatch(d, 'sms')} style={{ background: d.sms ? '#dcfce7' : '#f1f5f9', color: d.sms ? '#166534' : '#475569', border: `1px solid ${d.sms ? '#86efac' : '#cbd5e1'}`, padding: '3px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}>
                            📱 SMS
                          </button>
                          <button onClick={() => handleDeliveryDispatch(d, 'wa')} style={{ background: d.whatsapp ? '#dcfce7' : '#f1f5f9', color: d.whatsapp ? '#166534' : '#475569', border: `1px solid ${d.whatsapp ? '#86efac' : '#cbd5e1'}`, padding: '3px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}>
                            💬 WA
                          </button>
                          <button onClick={() => handleDeliveryDispatch(d, 'email')} style={{ background: d.email ? '#dcfce7' : '#f1f5f9', color: d.email ? '#166534' : '#475569', border: `1px solid ${d.email ? '#86efac' : '#cbd5e1'}`, padding: '3px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}>
                            ✉️ Email
                          </button>
                          <button onClick={() => { window.print(); addNotification('Print Queued', `Report ${d.id} sent to printer.`, 'info'); }} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', cursor: 'pointer' }}>
                            🖨 Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Add authorized orders from labOrders */}
              {labOrders.filter(o => o.status === 'Authorized' && !deliveryLog.find(d => d.id === o.id)).length > 0 && (
                <div style={{ padding: '12px 16px', borderTop: `1px solid ${lisTheme.borderColor}`, background: '#fffbeb' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#92400e', marginBottom: '8px' }}>⚠️ Authorized reports not yet dispatched:</div>
                  {labOrders.filter(o => o.status === 'Authorized' && !deliveryLog.find(d => d.id === o.id)).map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'white', borderRadius: '6px', marginBottom: '4px', fontSize: '0.7rem', border: '1px solid #fde68a' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#1e40af' }}>{o.id}</span>
                      <span>{o.patientName}</span>
                      <span style={{ color: '#475569' }}>{o.testName.slice(0, 25)}</span>
                      <button onClick={() => { setDeliveryLog(prev => [...prev, { id: o.id, patient: o.patientName, test: o.testName, authorized: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sms: false, whatsapp: false, email: false, status: 'Ready' }]); addNotification('Added to Delivery Queue', `${o.id} added for dispatch.`, 'info'); }} style={{ background: '#1e40af', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}>
                        Add to Queue
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= DAILY CLOSING DASHBOARD ================= */}
        {lisTab === 'closing' && (() => {
          const totalOrders = labOrders.length;
          const authorized = labOrders.filter(o => o.status === 'Authorized').length;
          const pending = labOrders.filter(o => o.status === 'Sample Pending').length;
          const rejected = labOrders.filter(o => o.recollectRequested).length;
          const statOrders = labOrders.filter(o => o.isStat).length;
          const totalRevenue = labOrders.length * 750; // mock avg

          return (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Shift Status Banner */}
              <div style={{ background: shiftClosed ? '#dcfce7' : '#1e3a8a', color: 'white', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '1.1rem', color: shiftClosed ? '#166534' : 'white' }}>
                    {shiftClosed ? '✅ SHIFT CLOSED — All Records Locked' : '🟡 SHIFT IN PROGRESS — Daily Summary'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: shiftClosed ? '#4ade80' : '#93c5fd', marginTop: '4px' }}>
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • Main Lab Node
                  </div>
                </div>
                {!shiftClosed && (
                  <button onClick={() => setShiftCloseConfirm(true)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}>
                    🔒 Close Shift
                  </button>
                )}
              </div>

              {/* Revenue + Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, sub: `${totalOrders} orders`, icon: '💰', color: '#059669', bg: '#ecfdf5' },
                  { label: 'Reports Authorized', value: authorized, sub: `of ${totalOrders} total orders`, icon: '✅', color: '#1e40af', bg: '#eff6ff' },
                  { label: 'Pending Reports', value: pending + (totalOrders - authorized - pending), sub: 'Requires follow-up', icon: '⏳', color: '#b45309', bg: '#fffbeb' },
                  { label: 'STAT Orders', value: statOrders, sub: 'Emergency processed', icon: '🚨', color: '#991b1b', bg: '#fef2f2' },
                  { label: 'Recollections', value: rejected, sub: 'Sample issues flagged', icon: '🔄', color: '#7c3aed', bg: '#f3e8ff' },
                  { label: 'QC Status', value: 'PASSED', sub: 'All analyzers cleared', icon: '🧪', color: '#065f46', bg: '#ecfdf5' },
                ].map((kpi, i) => (
                  <div key={i} style={{ background: kpi.bg, border: `1px solid ${lisTheme.borderColor}`, borderRadius: '10px', padding: '16px', borderLeft: `4px solid ${kpi.color}` }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{kpi.icon}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', color: kpi.color }}>{kpi.value}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#1e293b' }}>{kpi.label}</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Pending Items that need action */}
              {labOrders.filter(o => o.status === 'Sample Pending' || o.status === 'Testing').length > 0 && (
                <div style={{ background: 'white', border: `2px solid #fde68a`, borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#fffbeb', borderBottom: '1px solid #fde68a', fontWeight: '800', fontSize: '0.8rem', color: '#92400e' }}>
                    ⚠️ Unresolved Orders — Cannot close shift until addressed
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                    {labOrders.filter(o => o.status === 'Sample Pending' || o.status === 'Testing').map((o, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fef3c7', borderRadius: '6px', fontSize: '0.7rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#1e40af' }}>{o.id}</span>
                        <span style={{ fontWeight: '600' }}>{o.patientName}</span>
                        <span style={{ color: '#475569' }}>{o.testName.slice(0, 25)}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', background: '#fef2f2', color: '#b91c1c', fontWeight: '700', fontSize: '0.6rem' }}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div style={{ background: 'white', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.8rem', color: '#1e293b', marginBottom: '12px' }}>Admin Actions</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { label: '📊 Export Day Report', color: '#1e40af', action: () => addNotification('Export Started', 'Day-end PDF report generating...', 'info') },
                    { label: '💾 Backup Data', color: '#059669', action: () => addNotification('Backup Complete', 'All records backed up to cloud node.', 'success') },
                    { label: '🔒 Lock Finalized Reports', color: '#7c3aed', action: () => addNotification('Reports Locked', 'All authorized reports are now immutable.', 'success') },
                    { label: '📧 Send Admin Summary Email', color: '#0369a1', action: () => addNotification('Email Sent', 'Day-end summary dispatched to admin.', 'info') },
                  ].map((btn, i) => (
                    <button key={i} onClick={btn.action} style={{ background: btn.color, color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' }}>
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      {isDowntimeModalOpen && (() => {

        const pendingList = labOrders.filter(o => o.status === 'Sample Pending');
        
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', width: '800px', maxHeight: '85vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
              
              {/* Print Header Block */}
              <div style={{ background: '#1e293b', padding: '20px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Printer size={20} style={{ color: '#94a3b8' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Emergency Downtime Collection Manifest</h3>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>ISO 15189 Continuity Protocol — Use for manual floor collections</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      window.print();
                      addNotification('Print Executed', 'Emergency checklist triggered to hardware node.', 'success');
                    }}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Confirm & Print Sheet
                  </button>
                  <button onClick={() => setIsDowntimeModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer' }}>Close Preview</button>
                </div>
              </div>

              {/* Scrollable Print Preview Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: '#f1f5f9', display: 'flex', justifyContent: 'center' }}>
                <div id="downtime-print-area" style={{ width: '100%', maxWidth: '210mm', background: 'white', padding: '30px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontFamily: '"Courier New", Courier, monospace', color: 'black' }}>
                  
                  {/* Title */}
                  <div style={{ borderBottom: '2px double black', paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', fontWeight: 'bold' }}>I-LISWARE EMERGENCY PROTOCOL</h2>
                    <div style={{ fontSize: '0.75rem' }}>MANUAL DRAW WORKSHEET | NODE: MAIN-LAB-01 | DATED: {new Date().toLocaleString()}</div>
                  </div>

                  {/* Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', marginTop: '20px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid black', textAlign: 'left' }}>
                        <th style={{ padding: '6px', border: '1px solid black' }}>LAB NUMBER</th>
                        <th style={{ padding: '6px', border: '1px solid black' }}>PATIENT NAME / AGE / SEX</th>
                        <th style={{ padding: '6px', border: '1px solid black' }}>TUBES REQUIRED</th>
                        <th style={{ padding: '6px', border: '1px solid black', width: '90px' }}>COLLECT TIME</th>
                        <th style={{ padding: '6px', border: '1px solid black', width: '90px' }}>PHLEBO SIGN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingList.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontStyle: 'italic', border: '1px solid black' }}>No pending orders found in active floor queue.</td>
                        </tr>
                      ) : (
                        pendingList.map(o => (
                          <tr key={o.id} style={{ borderBottom: '1px solid black' }}>
                            <td style={{ padding: '8px', fontWeight: 'bold', border: '1px solid black' }}>{o.id}<br/>[{o.priority || 'Routine'}]</td>
                            <td style={{ padding: '8px', border: '1px solid black' }}>{o.patientName} ({o.age || ''}{o.ageUnit || 'Y'} / {o.gender || ''})</td>
                            <td style={{ padding: '8px', border: '1px solid black' }}>{o.tubeType || 'SST Gold'}</td>
                            <td style={{ padding: '8px', border: '1px solid black', height: '35px' }}></td>
                            <td style={{ padding: '8px', border: '1px solid black' }}></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '40px', fontSize: '0.68rem', fontStyle: 'italic' }}>
                    INSTRUCTIONS: Complete manual collection. Note physical draw time and sign above. Transcribe data back to i-LISWARE immediately upon Server Sync Re-establishment.
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

        {/* ── Modals ──────────────────────────────────────────────────────── */}
        
        {/* Patient History Modal */}
        {historyModalPt && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-slide-up" style={{ background: 'white', borderRadius: '12px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ padding: '16px 20px', background: lisTheme.headerBg, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>Patient History: {historyModalPt.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{historyModalPt.uhid} | {historyModalPt.dob} | {historyModalPt.phone}</div>
                </div>
                <button onClick={() => setHistoryModalPt(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {historyModalPt.allergies && (
                  <div style={{ padding: '12px', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px', fontSize: '0.8rem', color: '#b91c1c' }}>
                    <strong>🚨 ALLERGIES:</strong> {historyModalPt.allergies}
                  </div>
                )}
                {historyModalPt.history && (
                  <div style={{ padding: '12px', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', fontSize: '0.8rem', color: '#92400e' }}>
                    <strong>⚠️ CLINICAL HISTORY:</strong> {historyModalPt.history}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', borderBottom: `1px solid ${lisTheme.borderColor}`, paddingBottom: '6px', marginBottom: '10px' }}>Previous Visits</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {historyModalPt.visits.map((v, i) => (
                      <div key={i} style={{ padding: '10px', border: `1px solid ${lisTheme.borderColor}`, borderRadius: '6px', background: '#f8fafc', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700', color: lisTheme.headerBg }}>{v.date}</span>
                          <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Dr. {v.ref}</span>
                        </div>
                        <div style={{ color: '#1e293b' }}>{v.tests}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shift Close Confirm Modal */}
        {shiftCloseConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-slide-up" style={{ background: 'white', borderRadius: '12px', width: '450px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ padding: '16px 20px', background: '#991b1b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>Confirm Shift Closure</div>
                <button onClick={() => setShiftCloseConfirm(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>
              <div style={{ padding: '24px', fontSize: '0.85rem', color: '#1e293b', lineHeight: '1.5' }}>
                <p style={{ marginBottom: '12px' }}>Are you sure you want to close the current shift?</p>
                <ul style={{ paddingLeft: '20px', color: '#475569', marginBottom: '20px' }}>
                  <li>All active reports will be locked.</li>
                  <li>End-of-day revenue reconciliation will be generated.</li>
                  <li>Unresolved orders will be transferred to the next shift.</li>
                  <li>A backup snapshot will be sent to the main server.</li>
                </ul>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShiftCloseConfirm(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => { setShiftClosed(true); setShiftCloseConfirm(false); addNotification('Shift Closed', 'All reports locked. Day-end backup initiated.', 'success'); }} style={{ padding: '8px 16px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}>Yes, Close Shift</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
