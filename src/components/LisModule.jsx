import React, { useState, useEffect } from 'react';
import { Database, Beaker, Activity, FileEdit, FileText, Settings, ShieldCheck, Printer, Save, Search, RefreshCw, Barcode, CheckSquare, Clock, Truck, AlertTriangle, TrendingUp, CheckCircle, BarChart2, ShieldAlert, Droplet } from 'lucide-react';
import LisResultIssuing from './LisResultIssuing';

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

    const pointsWithZ = data.map(d => ({
      ...d,
      z: sd > 0 ? (d.val - mean) / sd : 0
    }));

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

    return {
      mean: mean.toFixed(2),
      sd: sd.toFixed(2),
      cv: cv.toFixed(2),
      points: pointsWithZ,
      violations: rulesViolated
    };
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
    const isCbc = accTests.some(t => (t.name || '').toUpperCase().includes('CBC'));
    const newOrder = {
      id: newOrderId,
      uhid: `UHID-${Math.floor(1000 + Math.random() * 9000)}`,
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
      timestamp: new Date().toLocaleString(),
      status: 'Sample Pending',
      isStat: accPatient.isStat,
      analyzer: isCbc ? 'Sysmex XN-1000' : 'Roche Cobas c311',
      collectionTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      qcStatus: 'Passed'
    };
    setLabOrders(prev => [...prev, newOrder]);
    const totalAmount = accTests.reduce((sum, t) => sum + t.price, 0);
    handlePostCharge(newOrder.uhid, 'LIS Accession Billing', totalAmount, 'Lab_Desk');
    addNotification('Accession Saved', `Order ${newOrderId} successfully accessioned into LIS${accPatient.isStat ? ' â€” ⚠¡ STAT PRIORITY' : ''}.`, 'success');
    setAccPatient({ name: '', dob: '', age: '', ageUnit: 'Years', gender: 'Male', phone: '', email: '', address: '', refBy: '', isStat: false, prepStatus: 'None', clinicalNotes: '' });
    setAccDiscount({ type: 'percent', value: 0 });
    setAccPaymentMode('Cash');
    setAccPaidAmount('');
    setAccTests([]);
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

  const handlePhleboScan = (val) => {
    if (!val.trim()) return;
    const found = labOrders.find(o => o.id === val.trim() || o.uhid === val.trim());
    if (found) {
      addNotification('Barcode Scanned', `Located: ${found.id} Ã¢â‚¬â€ ${found.patientName}. Status: ${found.status}`, 'success');
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
          <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '12px', height: '100%' }}>

            {/* ── LEFT: Demographics & Clinical ── */}
            <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
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
            </div>

            {/* ── RIGHT: Test Selection + Billing ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', minHeight: 0 }}>

              {/* Test picker */}
              <div style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}`, background: '#f8fafc' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.8rem', color: lisTheme.headerBg }}>Master Test Directory</span>
                  <button onClick={handleBookTest} disabled={!ap.name || accTests.length === 0}
                    style={{ background: ap.name && accTests.length > 0 ? '#22c55e' : '#94a3b8', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', fontSize: lisTheme.fontSize, cursor: ap.name && accTests.length > 0 ? 'pointer' : 'not-allowed', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Save size={13} /> Accession Order
                  </button>
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
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {/* ================= 2. PHLEBOTOMY & BARCODE ================= */}
        {lisTab === 'collection' && (
          <div className="animate-slide-up" style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Global Controls Bar Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div style={{ background: lisTheme.headerBg, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Auto-focused scanner input */}
              <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
                <Barcode size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Scan Barcode or UHID Ã¢â‚¬â€ mouse-free input active"
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
              CLINICAL ORDER OF DRAW: Blood Culture (Yellow) Ã¢â€ â€™ Citrate/Blue Ã¢â€ â€™ SST/Gold Ã¢â€ â€™ EDTA/Lavender Ã¢â€ â€™ Fluoride/Grey Ã¢â‚¬â€ Non-compliance causes cross-contamination.
            </div>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Main Grid Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: lisTheme.fontSize }}>
                <thead style={{ background: '#f1f5f9', textAlign: 'left', position: 'sticky', top: 0, zIndex: 5 }}>
                  <tr style={{ color: '#475569', fontSize: '0.72rem', fontWeight: '700' }}>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}` }}>Priority & Lab No</th>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}` }}>Patient Demographics</th>
                    <th style={{ padding: '10px 14px', borderBottom: `1px solid ${lisTheme.borderColor}`, width: '38%' }}>Required Tubes Ã¢â‚¬â€ Clinical Order of Draw</th>
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
                    const isRunnerOut = runnerDispatched[order.id];
                    const isUpdated = parseInt(order.id) % 8 === 0 && order.status === 'Sample Pending';

                    // Demographic mismatch check
                    const nameLower = (order.patientName || '').toLowerCase();
                    const genderStored = (order.gender || 'Male');
                    const femaleNames = ['anjali', 'priya', 'sunita', 'pooja', 'kavya', 'meera', 'ritu', 'nisha', 'divya', 'lakshmi'];
                    const maleNames = ['sunil', 'raj', 'amit', 'vikram', 'arjun', 'rahul', 'nihal'];
                    const isMismatch = (femaleNames.some(n => nameLower.includes(n)) && genderStored === 'Male') ||
                                       (maleNames.some(n => nameLower.includes(n)) && genderStored === 'Female');

                    const waitTime = Math.max(1, Math.floor((new Date() - (order.timestamp ? new Date(order.timestamp) : new Date())) / 60000) % 90);

                    return (
                      <tr key={order.id} style={{
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
                            {isStat && !isCollected && !isCancelled && (
                              <span style={{ fontSize: '0.62rem', color: '#b91c1c', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={9} /> {waitTime}m waiting
                              </span>
                            )}
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
                          <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Ã°Å¸â€œÅ¾ {order.phone || 'Ã¢â‚¬â€'} | Ref: {order.refBy || 'Self'}</div>
                          {isMismatch && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px', fontSize: '0.58rem', color: '#dc2626', background: '#fee2e2', padding: '2px 5px', border: '1px solid #fca5a5', borderRadius: '3px', fontWeight: '800' }}>
                              <AlertTriangle size={9} /> DEMOG MISMATCH Ã¢â‚¬â€ VERIFY IDENTITY
                            </div>
                          )}
                          {isUpdated && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '4px', fontSize: '0.58rem', color: '#92400e', background: '#fef3c7', padding: '2px 5px', border: '1px solid #fcd34d', borderRadius: '3px', fontWeight: '800' }}>
                              Ã¢Å¡Â¡ ADD-ON ORDER UPDATED
                            </div>
                          )}
                          {prepFlags.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '5px' }}>
                              {prepFlags.map((f, fi) => (
                                <span key={fi} style={{ fontSize: '0.58rem', color: f.color, background: f.bg, border: `1px solid ${f.border}`, padding: '2px 5px', borderRadius: '3px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  Ã¢Å¡Â  {f.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Tubes Ã¢â‚¬â€ Order of Draw */}
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
                                    {tube.specimen} Ã‚· <strong>{tube.volume}</strong>
                                  </div>
                                  <div style={{ fontSize: '0.58rem', color: '#0d9488', fontWeight: '600', marginTop: '1px' }}>
                                    Ã°Å¸â€œÂ {tube.route}
                                  </div>
                                </div>
                                {isCollected && !isCancelled && (
                                  <button onClick={() => addNotification('Reprint', `Reprint job sent for ${tube.name} Ã¢â‚¬â€ ${order.id}.`, 'info')}
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

                        {/* Collection Status Ã¢â‚¬â€ State Machine */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'center' }}>
                          {(() => {
                            let label, bg, color, border;
                            if (isCancelled) { label = 'CANCELLED'; bg = '#fee2e2'; color = '#991b1b'; border = '#fecaca'; }
                            else if (isRunnerOut) { label = 'IN TRANSIT'; bg = '#ede9fe'; color = '#5b21b6'; border = '#ddd6fe'; }
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
                              Ã°Å¸Å¡Â« {order.cancelReason}
                            </div>
                          )}
                        </td>

                        {/* Operational Console */}
                        <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>

                            {/* Ã¢â€â‚¬Ã¢â€â‚¬ PENDING: Draw + Reject Ã¢â€â‚¬Ã¢â€â‚¬ */}
                            {order.status === 'Sample Pending' && (
                              <>
                                <button onClick={() => {
                                  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                  setLabOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Processing' } : o));
                                  setCollectionTimestamps(prev => ({ ...prev, [order.id]: ts }));
                                  logPhleboAudit('COLLECT', order.id, `Drew ${tubes.length} vials for ${order.patientName} at ${ts}`);
                                  addNotification('Collected', `${tubes.length} vials drawn for ${order.patientName}. TAT clock started.`, 'success');
                                }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.69rem', cursor: 'pointer', fontWeight: '700' }}>
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
                                        setLabOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled', cancelReason: rejectReason } : o));
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

                            {/* Ã¢â€â‚¬Ã¢â€â‚¬ COLLECTED: Aliquot + Runner Ã¢â€â‚¬Ã¢â€â‚¬ */}
                            {isCollected && !isCancelled && (
                              <>
                                <button onClick={() => {
                                  const code = order.id;
                                  const current = aliquotedOrders[code] || [];
                                  const subCode = `${code}-${String.fromCharCode(65 + current.length)}`;
                                  setAliquotedOrders(prev => ({ ...prev, [code]: [...current, subCode] }));
                                  logPhleboAudit('ALIQUOT', code, `Sub-vial ${subCode} created`);
                                  addNotification('Aliquot Created', `Label ${subCode} generated for centrifuge routing.`, 'info');
                                }} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <RefreshCw size={9} /> Generate Aliquot (Split)
                                </button>

                                <button onClick={() => {
                                  setRunnerDispatched(prev => ({ ...prev, [order.id]: !prev[order.id] }));
                                  logPhleboAudit(isRunnerOut ? 'RUNNER_RECALL' : 'RUNNER_DISPATCH', order.id, `Runner status toggled`);
                                  addNotification(isRunnerOut ? 'Runner Recalled' : 'Runner Dispatched', `Order ${order.id} tube transit ${isRunnerOut ? 'recalled' : 'confirmed to core lab'}.`, isRunnerOut ? 'warning' : 'success');
                                }} style={{
                                  background: isRunnerOut ? '#ede9fe' : '#0f172a', color: isRunnerOut ? '#5b21b6' : 'white',
                                  border: isRunnerOut ? '1px solid #ddd6fe' : 'none', padding: '5px 10px', borderRadius: '6px',
                                  fontSize: '0.65rem', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                  <Truck size={9} /> {isRunnerOut ? 'Runner: In Transit Ã¢Å“â€œ' : 'Dispatch Runner'}
                                </button>
                              </>
                            )}

                            {/* Ã¢â€â‚¬Ã¢â€â‚¬ CANCELLED: Restore Ã¢â€â‚¬Ã¢â€â‚¬ */}
                            {isCancelled && (
                              <button onClick={() => {
                                setLabOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Sample Pending', cancelReason: null } : o));
                                logPhleboAudit('RESTORE', order.id, 'Re-queued from cancelled state');
                                addNotification('Restored', `Order ${order.id} returned to active queue.`, 'info');
                              }} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '5px 10px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: '600' }}>
                                Restore to Queue
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Immutable Audit Trail Footer Ã¢â€â‚¬Ã¢â€â‚¬ */}
            {phleboAuditLog.length > 0 && (
              <div style={{ borderTop: `1px solid ${lisTheme.borderColor}`, background: '#f8fafc', padding: '8px 16px', maxHeight: '90px', overflowY: 'auto' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: '800', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Ã°Å¸â€â€™ Phlebotomy Audit Trail (Immutable)
                </div>
                {[...phleboAuditLog].reverse().map((log, li) => (
                  <div key={li} style={{ fontSize: '0.6rem', color: '#475569', fontFamily: 'monospace', lineHeight: '1.6' }}>
                    [{log.time}] [{log.user}] {log.action} Ã¢â‚¬â€ {log.orderId}: {log.detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ================= 3. MACHINE WORKLIST (BIDIRECTIONAL) ================= */}
        {lisTab === 'worklist' && (
          <div className="animate-slide-up" style={{ background: 'white', borderRadius: '8px', border: `1px solid ${lisTheme.borderColor}`, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            {/* Header Panel */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', fontWeight: '700', borderBottom: `1px solid ${lisTheme.borderColor}`, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: lisTheme.headerBg, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} /> Analyzer TCP/IP Bidirectional Interface Gateway
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span> LISTENING ON PORT 5000
                </span>
                <button onClick={() => addNotification("Interface Polled", "Polled LIS Bridge: 0 new analyzer buffers received.", "info")} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: lisTheme.fontSize, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <RefreshCw size={14} /> Poll Port Bridge
                </button>
              </div>
            </div>

            {/* Advanced Filters Toolbar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '10px 16px', background: '#f8fafc', borderBottom: `1px solid ${lisTheme.borderColor}`, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  placeholder="Search Barcode / Patient / Control ID..." 
                  value={analyzerSearch}
                  onChange={e => { setAnalyzerSearch(e.target.value); setAnalyzerPage(1); }}
                  style={{ border: `1px solid ${lisTheme.borderColor}`, borderRadius: '6px', padding: '6px 12px 6px 30px', fontSize: '0.75rem', width: '100%', maxWidth: '320px' }} 
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#64748b' }}>Stream Filters:</label>
                <select 
                  value={analyzerFilter} 
                  onChange={e => { setAnalyzerFilter(e.target.value); setAnalyzerPage(1); }}
                  style={{ border: `1px solid ${lisTheme.borderColor}`, padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem', background: 'white', outline: 'none' }}
                >
                  <option value="All">All Telemetry Packages</option>
                  <option value="Patient">Patient Material Samples</option>
                  <option value="QC">Quality Controls (QC Runs)</option>
                  <option value="Error">Hardware Warnings / Partials</option>
                </select>
              </div>
            </div>

            {/* Interactive Packet Log */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: lisTheme.fontSize }}>
                <thead style={{ background: '#f1f5f9', textAlign: 'left', position: 'sticky', top: 0, zIndex: 5 }}>
                  <tr style={{ color: '#475569' }}>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, fontWeight: '600' }}>Barcode / Sample ID</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, fontWeight: '600' }}>Sample Category</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, fontWeight: '600' }}>Target Analyzer (TCP/IP)</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, fontWeight: '600', textAlign: 'center' }}>Payload Metrics</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, fontWeight: '600', textAlign: 'center' }}>Hardware Alert</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, fontWeight: '600' }}>Machine Status</th>
                    <th style={{ padding: '12px 16px', borderBottom: `1px solid ${lisTheme.borderColor}`, fontWeight: '600' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const items = getAnalyzerWorklist();
                    const perPage = 6;
                    const paginated = items.slice((analyzerPage - 1) * perPage, analyzerPage * perPage);

                    if (paginated.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                            No TCP/IP communication packets found matching current filters.
                          </td>
                        </tr>
                      );
                    }

                    return paginated.map((item, index) => {
                      const isQC = item.category.includes('Control');
                      const isPartial = item.paramsRcvd < item.paramsTotal;
                      const hasAlarm = item.hardwareAlert !== 'OK';

                      return (
                        <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', background: isQC ? '#faf5ff' : '#ffffff' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '800', fontFamily: 'monospace', fontSize: '0.8rem', color: lisTheme.headerBg }}>|| {item.id}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>{item.patientName}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ 
                              padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700',
                              background: isQC ? '#f3e8ff' : '#e0f2fe',
                              color: isQC ? '#6b21a8' : '#0369a1',
                              border: isQC ? '1px solid #e9d5ff' : '1px solid #bae6fd',
                              display: 'inline-block'
                            }}>
                              {item.category.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#334155', fontSize: '0.75rem' }}>{item.analyzer}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '1px' }}>Ã°Å¸â€â€” IP: {item.ip}</div>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ 
                              fontSize: '0.65rem', fontWeight: '800', display: 'inline-flex', gap: '4px', alignItems: 'center',
                              color: isPartial ? '#b91c1c' : '#166534',
                              background: isPartial ? '#fee2e2' : '#dcfce3',
                              padding: '2px 6px', borderRadius: '4px'
                            }}>
                              {item.paramsRcvd}/{item.paramsTotal} {isPartial ? 'PARTIAL' : 'COMPLETED'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '3px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800',
                              background: hasAlarm ? '#fff1f2' : '#f8fafc',
                              color: hasAlarm ? '#e11d48' : '#64748b',
                              border: hasAlarm ? '1px solid #fecdd3' : '1px solid #e2e8f0'
                            }}>
                              {hasAlarm ? `Ã¢Å¡Â  ${item.hardwareAlert.toUpperCase()}` : 'Ã¢Å“â€œ OK'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ 
                              padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700',
                              background: item.status === 'Processing' ? '#fff7ed' : '#ecfdf5',
                              color: item.status === 'Processing' ? '#c2410c' : '#16a34a',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}>
                              {item.status === 'Processing' ? <><RefreshCw size={10} className="animate-spin" /> In Device Buffer</> : <><CheckCircle size={10} /> Synced Successfully</>}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {item.status === 'Processing' && !isQC ? (
                              <button onClick={() => {
                                setLabOrders(prev => prev.map(o => o.id === item.rawOrder.id ? { ...o, status: 'Tech Entry' } : o));
                                addNotification("ASTM Direct Sync", `Pushed results for ${item.patientName} directly into analytic queue.`, "success");
                              }} style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700', boxShadow: '0 1px 2px rgba(124,58,237,0.2)' }}>
                                Fetch & Map
                              </button>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><ShieldCheck size={12} style={{ color: '#cbd5e1' }} /> Database Logged</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Advanced Pagination Footer */}
            {(() => {
              const items = getAnalyzerWorklist();
              const perPage = 6;
              const totalPages = Math.ceil(items.length / perPage);
              if (totalPages <= 1) return null;
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#f8fafc', borderTop: `1px solid ${lisTheme.borderColor}`, fontSize: '0.7rem' }}>
                  <div style={{ color: '#64748b', fontWeight: '500' }}>
                    Displaying package <strong>{(analyzerPage - 1) * perPage + 1} - {Math.min(analyzerPage * perPage, items.length)}</strong> of <strong>{items.length}</strong> raw log packages
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      disabled={analyzerPage === 1} 
                      onClick={() => setAnalyzerPage(p => Math.max(1, p - 1))}
                      style={{ padding: '4px 10px', border: `1px solid ${lisTheme.borderColor}`, background: 'white', borderRadius: '4px', fontSize: '0.7rem', cursor: analyzerPage === 1 ? 'not-allowed' : 'pointer', opacity: analyzerPage === 1 ? 0.5 : 1, fontWeight: '600' }}
                    >
                      Prev
                    </button>
                    <button 
                      disabled={analyzerPage === totalPages} 
                      onClick={() => setAnalyzerPage(p => Math.min(totalPages, p + 1))}
                      style={{ padding: '4px 10px', border: `1px solid ${lisTheme.borderColor}`, background: 'white', borderRadius: '4px', fontSize: '0.7rem', cursor: analyzerPage === totalPages ? 'not-allowed' : 'pointer', opacity: analyzerPage === totalPages ? 0.5 : 1, fontWeight: '600' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              );
            })()}
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
                      {order.status === 'Pending Auth' ? 'Ã¢Å“â€œ Submitted for Auth' : 'Ã¢Å¡Â  Action Required'}
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
                        <span style={{ opacity: 0.4 }}>Ã¢â‚¬Â¢</span>
                        <span>{order.patientName}</span>
                      </div>
                      
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '6px' }}>
                        {order.age || '32'}Y / {order.gender === 'Female' ? 'F' : 'M'} Ã¢â‚¬Â¢ {order.testName}
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
                                    {parseFloat(delta) > 15 ? 'Ã¢Å¡Â  ' : ''}{delta}% shift
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

      </div>
    </div>
  );
}
