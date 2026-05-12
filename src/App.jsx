import React, { useState, useEffect } from 'react';
import { 
  Activity, Users, BedDouble, Heart, DollarSign, 
  Plus, Search, Shield, Zap, Wifi, WifiOff, Bell, 
  Trash2, FileText, CheckCircle, Smartphone, Monitor,
  Layers, Package, AlertTriangle, ShieldCheck, TrendingUp, Clock,
  ShieldAlert, Store, MessageSquare, RotateCcw, Ticket,
  Save, Printer, X, CreditCard
} from 'lucide-react';

// Modular Imports for Expanded Scenarios
import OpdModule from './components/OpdModule';
import IpdModule from './components/IpdModule';
import OtModule from './components/OtModule';
import InsuranceModule from './components/InsuranceModule';
import HealthPackageModule from './components/HealthPackageModule';
import ReferralModule from './components/ReferralModule';
import LisModule from './components/LisModule';

// Custom Hooks
import { useBarcodeScanner } from './hooks/useBarcodeScanner';



// Simulated database initial data
const initialPatients = [
  { id: "UHID-9844", name: "Sunil Kumar", age: 42, gender: "Male", type: "OP", status: "In Consultation", room: "OP-Cabin 3", doctor: "Dr. Visakh" },
  { id: "UHID-2104", name: "Anjali Sharma", age: 29, gender: "Female", type: "IP", status: "Admitted", room: "Room 304 (Private)", doctor: "Dr. Geetha RMO", bed: "304-A" },
  { id: "UHID-4512", name: "Mariamma Mathew", age: 65, gender: "Female", type: "IP", status: "Admitted", room: "ICU Bed 4", doctor: "Dr. Vinod (Cardio)", bed: "ICU-04" },
  { id: "UHID-7811", name: "Deepu Akbar", age: 31, gender: "Male", type: "OB", status: "Observation", room: "OB Ward Bed 2", doctor: "Dr. Susan", bed: "OB-02" },
];
 

const initialChargeLog = [
  { id: "CHG-001", uhid: "UHID-2104", patientName: "Anjali Sharma", description: "IP Registration Fee", amount: 500, timestamp: "Today, 09:30 AM", user: "Reception_Desk" },
  { id: "CHG-002", uhid: "UHID-2104", patientName: "Anjali Sharma", description: "Room Rent - Private (Day 1)", amount: 3500, timestamp: "Today, 10:00 AM", user: "System_Auto" },
  { id: "CHG-003", uhid: "UHID-4512", patientName: "Mariamma Mathew", description: "ICU Isolation Charge", amount: 8000, timestamp: "Today, 10:15 AM", user: "System_Auto" },
  { id: "CHG-004", uhid: "UHID-9844", patientName: "Sunil Kumar", description: "Doctor Consultation - Dr. Visakh", amount: 400, timestamp: "Today, 11:00 AM", user: "OP_Desk" },
];

export default function App() {
  // Administrative Privilege RBAC States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [userRole, setUserRole] = useState(null); // 'SUPER_ADMIN', 'ER_STAFF', 'LAB_STAFF', 'RAD_STAFF', 'PHARM_STAFF', 'MMS_STAFF'
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    
    const credentials = [
      { user: 'superadmin', pass: 'admin', role: 'SUPER_ADMIN', defaultTab: 'dashboard' },
      { user: 'admin', pass: 'admin', role: 'SUPER_ADMIN', defaultTab: 'dashboard' },
      { user: 'op_clerk', pass: 'op', role: 'OP_STAFF', defaultTab: 'op' },
      { user: 'er_doc', pass: 'er', role: 'ER_STAFF', defaultTab: 'er' },
      { user: 'lab_tech', pass: 'lab', role: 'LAB_STAFF', defaultTab: 'lab' },
      { user: 'rad_tech', pass: 'radiology', role: 'RAD_STAFF', defaultTab: 'radiology' },
      { user: 'pharmacist', pass: 'pharmacy', role: 'PHARM_STAFF', defaultTab: 'pharmacy' },
      { user: 'mms_admin', pass: 'inventory', role: 'MMS_STAFF', defaultTab: 'inventory' }
    ];

    const matched = credentials.find(c => c.user === loginUser.toLowerCase() && c.pass === loginPass);
    if (matched) {
      setIsLoggedIn(true);
      setUserRole(matched.role);
      setActiveTab(matched.defaultTab);
      addNotification("Secure Login", `Logged in successfully as ${matched.role}.`, "success");
      setLoginUser('');
      setLoginPass('');
    } else {
      setLoginError('Invalid administrative credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setActiveTab('dashboard');
    addNotification("Logged Out", "Secure session terminated.", "info");
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [patients, setPatients] = useState(initialPatients);
  const [chargeLog, setChargeLog] = useState(initialChargeLog);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "System Initialized", message: "All local hospital modules are running smoothly.", type: "system", time: "Just now" }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // OP Pathway state
  const [opPatientName, setOpPatientName] = useState('');
  const [opAge, setOpAge] = useState('');
  const [opGender, setOpGender] = useState('Male');
  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Visakh');
  const [selectedService, setSelectedService] = useState('Lab Tests');
  const [dressingSize, setDressingSize] = useState('M'); // S/M/L

  // IP Pathway state
  const [selectedIpPatient, setSelectedIpPatient] = useState('UHID-2104');
  const [customIpChargeDesc, setCustomIpChargeDesc] = useState('');
  const [customIpChargeAmount, setCustomIpChargeAmount] = useState('');

  // Interconnected Department Queues (Pub/Sub Event Simulation)
  const [labSubTab, setLabSubTab] = useState('booking'); // 'queue' | 'booking'
  const [labBookingPatient, setLabBookingPatient] = useState({ 
    caseId: '2026-0044', patientId: 'UHID-2026-0044', date: '2026-05-11', 
    gender: 'Male', mobile: '', name: '', ageYear: '', ageMonth: '', ageDays: '', 
    refBy: 'Dr. Visakh', email: '', address: '' 
  });
  const [labBookingTests, setLabBookingTests] = useState([
    { id: '12', name: 'BLOOD COMPLETE TEST PROFILE', price: 300, discountPercent: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0 },
    { id: '5', name: 'BIO CHEMISTRY TEST PROFILE', price: 500, discountPercent: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0 },
    { id: '11', name: 'COMPLETE URINE TEST PROFILE', price: 100, discountPercent: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0 }
  ]);
  const labMasterTests = [
    { id: '12', name: 'BLOOD COMPLETE TEST PROFILE', price: 300 },
    { id: '5', name: 'BIO CHEMISTRY TEST PROFILE', price: 500 },
    { id: '11', name: 'COMPLETE URINE TEST PROFILE', price: 100 },
    { id: '78', name: 'Test', price: 2000 },
    { id: '30', name: 'SPECIAL CHEMISTRY REPORT', price: 0 },
    { id: '38', name: 'RENAL FUNCTION TEST PROFILE', price: 450 },
    { id: '14', name: 'MISCELLINIOUS TEST PROFILE', price: 400 },
    { id: '15', name: 'CARDIAC TEST PROFILE', price: 100 },
    { id: '16', name: 'LIVER FUNCTION TEST PROFILE', price: 100 }
  ];
  const [labBookingPaid, setLabBookingPaid] = useState(0);
  const [labBookingGlobalDiscount, setLabBookingGlobalDiscount] = useState(0);

  const [labOrders, setLabOrders] = useState([
    { id: "LAB-101", uhid: "UHID-9844", patientName: "Sunil Kumar", testName: "Complete Blood Count (CBC)", status: "Pending", timestamp: "Today, 11:15 AM" },
    { id: "LAB-102", uhid: "UHID-2104", patientName: "Anjali Sharma", testName: "Liver Function Test (LFT)", status: "Pending", timestamp: "Today, 11:30 AM" }
  ]);
  const [pharmacyOrders, setPharmacyOrders] = useState([
    { id: "RX-810", uhid: "UHID-2087", patientName: "Kiran", medicines: "Pantocid D 40mg x5, Paracetamol 650mg x10", status: "Pending", timestamp: "Today, 09:05 PM" },
    { id: "RX-201", uhid: "UHID-2104", patientName: "Anjali Sharma", medicines: "Paracetamol 650mg x10, Amoxicillin 500mg x6", status: "Pending", timestamp: "Today, 11:05 AM" }
  ]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("RX-810");

  const [pharmacySearch, setPharmacySearch] = useState('');
  const [pharmacyFilter, setPharmacyFilter] = useState('all'); // 'all', 'Pending', 'Dispensed'
  const [isAddingPrescription, setIsAddingPrescription] = useState(false);

  // Form states for creating a new prescription indent
  const [newRxPatientName, setNewRxPatientName] = useState('');
  const [newRxUhid, setNewRxUhid] = useState('');
  const [newRxMedicines, setNewRxMedicines] = useState('');
  const [pharmacyStockSearch, setPharmacyStockSearch] = useState('');
  const [pharmacySubTab, setPharmacySubTab] = useState('dispensation'); // 'dispensation', 'stock'

  // Expanded Departmental State Queues
  const [erQueue, setErQueue] = useState([
    { id: "ER-301", name: "Vinod Pillai", triagePriority: "Red", status: "In Trauma Bay 1", timestamp: "Today, 11:40 AM" },
    { id: "ER-302", name: "Sarah Thomas", triagePriority: "Yellow", status: "Triage Evaluation", timestamp: "Today, 11:55 AM" }
  ]);
  const [radiologyOrders, setRadiologyOrders] = useState([
    { id: "RAD-401", uhid: "UHID-2104", patientName: "Anjali Sharma", scanType: "USG Abdomen Scan", status: "Pending", timestamp: "Today, 11:10 AM" }
  ]);
  const [inventoryStock, setInventoryStock] = useState({
    paracetamolVials: 120,
    syringes: 450,
    sterileDressings: 85,
    bloodBags: 24,
    ctReagents: 40
  });

  const [inventoryList, setInventoryList] = useState([
    { id: "MED-001", barcode: "89001001", name: "Pantocid D 40mg", generic: "Pantoprazole + Domperidone", stock: 120, minThreshold: 50, location: "Aisle 3-A", tempSensitive: false, batch: "B-PAN402", expiry: "2027-12", type: "Tablet" },
    { id: "MED-002", barcode: "89001002", name: "Paracetamol 650mg", generic: "Acetaminophen", stock: 8, minThreshold: 100, location: "Aisle 1-B", tempSensitive: false, batch: "B-PARA901", expiry: "2026-06", type: "Tablet" },
    { id: "MED-003", barcode: "89001003", name: "Amoxicillin 500mg", generic: "Penicillin Antibiotic", stock: 15, minThreshold: 40, location: "Aisle 2-C", tempSensitive: false, batch: "B-AMX105", expiry: "2026-05", type: "Capsule" },
    { id: "MED-004", barcode: "89001004", name: "Insulin Glargine 100 IU", generic: "Long-acting Insulin Vials", stock: 45, minThreshold: 15, location: "Cold-Fridge B", tempSensitive: true, tempCelsius: 3.8, batch: "B-INS002", expiry: "2026-08", type: "Vial" },
    { id: "MED-005", barcode: "89001005", name: "Sterile Dressings (M)", generic: "Wound Dressing Kit", stock: 85, minThreshold: 20, location: "Cabinet 5", tempSensitive: false, batch: "B-DRS881", expiry: "2029-01", type: "Consumable" },
    { id: "MED-006", barcode: "89001006", name: "O-Negative Blood Bag", generic: "Whole Blood STAT Bags", stock: 24, minThreshold: 8, location: "Blood-Fridge A", tempSensitive: true, tempCelsius: 4.1, batch: "B-BLD904", expiry: "2026-05", type: "Consumable" }
  ]);

  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all'); // 'all', 'low', 'expiring', 'cold'
  const [isAddingMedicine, setIsAddingMedicine] = useState(false);

  // Form states for creating a new medicine
  const [newMedName, setNewMedName] = useState('');
  const [newMedGeneric, setNewMedGeneric] = useState('');
  const [newMedType, setNewMedType] = useState('Tablet');
  const [newMedBatch, setNewMedBatch] = useState('');
  const [newMedLocation, setNewMedLocation] = useState('');
  const [newMedStock, setNewMedStock] = useState(100);
  const [newMedThreshold, setNewMedThreshold] = useState(30);
  const [newMedExpiry, setNewMedExpiry] = useState('2027-12');
  const [newMedTempSensitive, setNewMedTempSensitive] = useState(false);
  const [newMedTempCelsius, setNewMedTempCelsius] = useState(4.0);

  // Ecosystem expansion states for added departments
  const [billingSubTab, setBillingSubTab] = useState('ledger');
  const [inventorySubTab, setInventorySubTab] = useState('overview');
  const [bulkSmsMsg, setBulkSmsMsg] = useState('');

  const [adminSubTab, setAdminSubTab] = useState('analytics'); // 'analytics' | 'masters' | 'discharge' | 'feedback' | 'compliance'
  const [feedbackList, setFeedbackList] = useState([
    { id: 'FB-001', name: 'Sunil Kumar', patientId: 'UHID-9844', mobile: '9876543210', date: '2026-05-10', rating: 5, details: 'Excellent doctors and fast lab process.' },
    { id: 'FB-002', name: 'Rekha Nair', patientId: 'UHID-5501', mobile: '9988776655', date: '2026-05-09', rating: 3, details: 'Long wait time at the pharmacy.' }
  ]);
  const [auditLogs, setAuditLogs] = useState([
    { id: 'AUD-991', time: '10:42 AM', user: 'Dr. Visakh (OP_STAFF)', action: 'Edited Prescription for UHID-9844', ip: '192.168.1.104', type: 'Clinical' },
    { id: 'AUD-992', time: '11:05 AM', user: 'System (Automated)', action: 'Dispatched CODE RED alerts for Trauma ER', ip: 'internal_worker', type: 'System' }
  ]);
  const [dischargeClearance, setDischargeClearance] = useState({ pharmacy: false, billing: false, nursing: false });
  const [activeDischargePatient, setActiveDischargePatient] = useState('UHID-2104');

  // ==========================================
  // 🏥 SPRINT 1: OPD QUEUE ENGINE
  // ==========================================
  const [opQueue, setOpQueue] = useState([
    { tokenNo: 'OP-001', uhid: 'UHID-9844', name: 'Sunil Kumar', age: 42, gender: 'Male', doctor: 'Dr. Visakh', status: 'In Consultation', time: '11:00 AM', isFollowUp: false },
    { tokenNo: 'OP-002', uhid: 'UHID-5501', name: 'Rekha Nair', age: 35, gender: 'Female', doctor: 'Dr. Susan', status: 'Waiting', time: '11:20 AM', isFollowUp: true },
    { tokenNo: 'OP-003', uhid: 'UHID-5502', name: 'Jomon Philip', age: 58, gender: 'Male', doctor: 'Dr. Vinod', status: 'Waiting', time: '11:45 AM', isFollowUp: false },
  ]);
  const [tokenCounter, setTokenCounter] = useState(4);
  const [opQueueSubTab, setOpQueueSubTab] = useState('queue'); // 'queue' | 'register' | 'consult'
  const [selectedConsultToken, setSelectedConsultToken] = useState(null);
  const [consultChiefComplaint, setConsultChiefComplaint] = useState('');
  const [consultDiagnosis, setConsultDiagnosis] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [consultOrderedServices, setConsultOrderedServices] = useState([]);
  const [consultPrescription, setConsultPrescription] = useState('');

  // ==========================================
  // 🛏️ SPRINT 2: IPD ADMISSION MODULE
  // ==========================================
  const [ipAdmissions, setIpAdmissions] = useState([
    { admId: 'ADM-001', uhid: 'UHID-2104', name: 'Anjali Sharma', ward: 'Private', bed: '304-A', admDate: '2026-05-09', doctor: 'Dr. Geetha RMO', diagnosis: 'Viral Fever', deposit: 5000, status: 'Active', notes: [] },
    { admId: 'ADM-002', uhid: 'UHID-4512', name: 'Mariamma Mathew', ward: 'ICU', bed: 'ICU-04', admDate: '2026-05-08', doctor: 'Dr. Vinod', diagnosis: 'Cardiac Arrest (Post-resuscitation)', deposit: 20000, status: 'Active', notes: [] },
  ]);
  const [ipAdmSubTab, setIpAdmSubTab] = useState('list'); // 'list' | 'admit' | 'ward_round' | 'discharge'
  const [newAdmName, setNewAdmName] = useState('');
  const [newAdmAge, setNewAdmAge] = useState('');
  const [newAdmGender, setNewAdmGender] = useState('Male');
  const [newAdmWard, setNewAdmWard] = useState('General');
  const [newAdmBed, setNewAdmBed] = useState('');
  const [newAdmDoctor, setNewAdmDoctor] = useState('Dr. Visakh');
  const [newAdmDiagnosis, setNewAdmDiagnosis] = useState('');
  const [newAdmDeposit, setNewAdmDeposit] = useState('');
  const [newAdmReferFrom, setNewAdmReferFrom] = useState('');
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [wardRoundNote, setWardRoundNote] = useState('');
  const [dischargeSummaryText, setDischargeSummaryText] = useState('');
  const [dischargeRx, setDischargeRx] = useState('');

  // ==========================================
  // 🔪 SPRINT 3: OT / SURGERY MODULE
  // ==========================================
  const [otSchedule, setOtSchedule] = useState([
    { otId: 'OT-001', uhid: 'UHID-4512', name: 'Mariamma Mathew', surgery: 'Coronary Angioplasty', surgeon: 'Dr. Vinod', anaesthetist: 'Dr. Rajan', otDate: '2026-05-11', otTime: '08:00', status: 'Scheduled', preOpDone: false, consent: true },
  ]);
  const [otSubTab, setOtSubTab] = useState('board'); // 'board' | 'schedule'
  const [newOtPatient, setNewOtPatient] = useState('');
  const [newOtSurgery, setNewOtSurgery] = useState('');
  const [newOtSurgeon, setNewOtSurgeon] = useState('Dr. Vinod');
  const [newOtDate, setNewOtDate] = useState('');
  const [newOtTime, setNewOtTime] = useState('08:00');

  // ==========================================
  // 📋 SPRINT 3: INTERNAL REFERRAL SYSTEM
  // ==========================================
  const [referralSlips, setReferralSlips] = useState([
    { refId: 'REF-001', fromDept: 'General Medicine', toDept: 'Cardiology', uhid: 'UHID-9844', patientName: 'Sunil Kumar', reason: 'Chest pain, ECG abnormality', doctor: 'Dr. Visakh', status: 'Pending', time: '11:30 AM' },
  ]);
  const [refFromDept, setRefFromDept] = useState('General Medicine');
  const [refToDept, setRefToDept] = useState('Cardiology');
  const [refReason, setRefReason] = useState('');
  const [refPatientUhid, setRefPatientUhid] = useState('');
  const [refPatientName, setRefPatientName] = useState('');

  // ==========================================
  // 💳 SPRINT 4: INSURANCE / TPA DESK
  // ==========================================
  const [insuranceClaims, setInsuranceClaims] = useState([
    { claimId: 'CLM-001', uhid: 'UHID-2104', patientName: 'Anjali Sharma', tpaName: 'Star Health', policyNo: 'SH-20240091', validity: '2027-03', preAuthStatus: 'Approved', preAuthAmt: 45000, copay: 2000, claimStatus: 'Open' },
  ]);
  const [insSubTab, setInsSubTab] = useState('list'); // 'list' | 'new'
  const [newClaimUhid, setNewClaimUhid] = useState('');
  const [newClaimPatient, setNewClaimPatient] = useState('');
  const [newClaimTpa, setNewClaimTpa] = useState('Star Health');
  const [newClaimPolicy, setNewClaimPolicy] = useState('');
  const [newClaimValidity, setNewClaimValidity] = useState('');
  const [newClaimAmt, setNewClaimAmt] = useState('');
  const [newClaimCopay, setNewClaimCopay] = useState('');

  // ==========================================
  // 🏷️ BARCODE & SCANNER GLOBAL HANDLER
  // ==========================================
  const handleGlobalScan = (scannedCode) => {
    addNotification("Barcode Detected", `Read code: ${scannedCode}`, "info");

    // Try finding it in the inventory list
    const matchedItem = inventoryList.find(item => item.barcode === scannedCode);
    
    if (matchedItem) {
      // Focus navigation to Inventory Context to show user the hit
      setActiveTab('inventory');
      setInventorySearch(matchedItem.name); 
      addNotification("Product Identified", `Matched ${matchedItem.name}. Loading Ledger...`, "success");
    } else {
      // Open creation wizards
      addNotification("New Barcode", "Registry entry not found. Open registration wizard?", "warning");
      setActiveTab('inventory');
      setIsAddingMedicine(true);
      setNewMedName(`Pending Name (${scannedCode})`); // Hint what barcode it was
      setNewMedBatch(scannedCode); // Autopopulate batch/reference field with scan
    }
  };

  // Register the listener
  useBarcodeScanner(handleGlobalScan);


  // ==========================================
  // 🏋️ SPRINT 4: HEALTH PACKAGE MODULE
  // ==========================================
  const [healthPackages] = useState([
    { pkgId: 'PKG-BASIC', name: 'Basic Health Screen', price: 999, tests: ['CBC', 'Urine Routine', 'Blood Sugar (F)', 'BP Check', 'BMI Assessment'] },
    { pkgId: 'PKG-EXEC', name: 'Executive Health Package', price: 2499, tests: ['CBC', 'LFT', 'RFT', 'Lipid Profile', 'Thyroid (TSH)', 'Blood Sugar (F&PP)', 'ECG', 'Chest X-Ray', 'USG Abdomen', 'Ophthalmology Screen', 'Physician Consultation'] },
    { pkgId: 'PKG-COMP', name: 'Comprehensive Wellness', price: 4999, tests: ['Full CBC + ESR', 'LFT', 'RFT', 'Lipid Profile', 'Thyroid Panel (T3/T4/TSH)', 'HbA1c', 'Vitamin D & B12', 'ECG', 'Echo', 'Chest X-Ray', 'USG Abdomen & Pelvis', 'Treadmill Test (TMT)', 'Ophthalmology', 'Dental Screen', 'Pulmonology (PFT)', 'Physician Consultation'] },
  ]);
  const [pkgBookings, setPkgBookings] = useState([]);
  const [pkgSubTab, setPkgSubTab] = useState('catalog'); // 'catalog' | 'active'
  const [pkgPatientName, setPkgPatientName] = useState('');
  const [pkgPatientAge, setPkgPatientAge] = useState('');
  const [selectedPkg, setSelectedPkg] = useState('PKG-EXEC');

  // ==========================================
  // 🚨 EXTREME SCENARIO & CRISIS PROTOCOLS STATE
  // ==========================================
  const [isCrisisMode, setIsCrisisMode] = useState(false);
  const [quarantinedBatches, setQuarantinedBatches] = useState([]); // Stores batch numbers banned globally
  const [crisisLogs, setCrisisLogs] = useState([]);

  // ==========================================
  // 📡 GLOBAL DEPARTMENTAL DISPATCH STATE
  // ==========================================
  const [dispatchQueue, setDispatchQueue] = useState([
    { id: 1, sender: 'RECEPTION', target: 'LAB', type: 'STAT', msg: 'UHID-9844 Routine Vitals Sent', time: '09:15 AM' },
    { id: 2, sender: 'PHARMACY', target: 'MMS', type: 'ROUTINE', msg: 'Calpol 650 stock crossing 20% threshold', time: '10:30 AM' }
  ]);
  const [activeEmergencyOverlay, setActiveEmergencyOverlay] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  const [erPatientName, setErPatientName] = useState('');
  const [triagePriority, setTriagePriority] = useState('Red');
  
  // Bedside/OB Tablet state
  const [bedsidePatient, setBedsidePatient] = useState('UHID-7811');
  const [bedsideVitals, setBedsideVitals] = useState({ bp: "120/80", pulse: "78", temp: "98.4", spo2: "99" });

  // Custom alert state
  const [alerts, setAlerts] = useState([]);

  // Optimistic save simulation with non-blocking feedback
  const [isSaving, setIsSaving] = useState(false);

  // Add standard notification
  const addNotification = (title, message, type = "system") => {
    setNotifications(prev => [
      { id: Date.now(), title, message, type, time: "Just now" },
      ...prev
    ]);
  };

  // Rule 2: Offline-First queue synchronization simulation
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      addNotification("Offline Queue Synced", `Successfully uploaded ${offlineQueue.length} pending hospital records.`, "success");
      
      // Post all offline items to active charge logs
      setChargeLog(prev => [...prev, ...offlineQueue.map(item => ({
        ...item,
        timestamp: "Synced Just Now",
        id: "CHG-SYNC-" + Math.floor(Math.random() * 1000)
      }))]);
      
      setOfflineQueue([]);
    }
  }, [isOnline]);

  // Handle posting a charge (Rule 3: Charge Log immutable sum approach)
  const handlePostCharge = (uhid, desc, amount, user = "Desk_User") => {
    const patient = patients.find(p => p.id === uhid) || { name: "Unknown Patient" };
    const newCharge = {
      uhid,
      patientName: patient.name,
      description: desc,
      amount: parseInt(amount) || 0,
      user
    };

    if (!isOnline) {
      // Offline mode (Rule 2)
      setOfflineQueue(prev => [...prev, newCharge]);
      addNotification("Offline Record Saved", `Stored "${desc}" locally. Will auto-sync when online.`, "warning");
    } else {
      // Direct post with non-blocking background effect (Rule 1: Asynchronous non-blocking save)
      setIsSaving(true);
      setTimeout(() => {
        setChargeLog(prev => [
          ...prev,
          {
            ...newCharge,
            id: "CHG-" + Math.floor(Math.random() * 10000),
            timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsSaving(false);
        addNotification("Charge Posted", `Successfully posted "${desc}" for ${patient.name}.`, "success");
      }, 150); // Small, ultra-fast async mock
    }
  };

  // Rule 4: Anticipatory discharge trigger
  const triggerAnticipatedDischarge = (uhid) => {
    const patient = patients.find(p => p.id === uhid);
    if (!patient) return;

    setPatients(prev => prev.map(p => p.id === uhid ? { ...p, status: "Anticipated Discharge" } : p));
    
    addNotification("Discharge Anticipated", `Doctor flagged ${patient.name} for discharge in 2 hours.`, "info");
    
    // Automatically post pharmacy packaging and billing drafts
    setTimeout(() => {
      handlePostCharge(uhid, "Discharge Meds Pre-pack (Pharmacy Indent)", 1250, "Pharmacy_Auto");
      setAlerts(prev => [
        ...prev,
        { id: uhid, name: patient.name, type: "Discharge Preparation", msg: "Pharmacy pre-packing meds. Billing desk pre-generating draft bill." }
      ]);
    }, 400);
  };

  // OPD Patient Registration & auto-billing
  const handleOpRegister = (e) => {
    e.preventDefault();
    if (!opPatientName || !opAge) return;

    const newUhid = "UHID-" + Math.floor(1000 + Math.random() * 9000);
    const newPat = {
      id: newUhid,
      name: opPatientName,
      age: parseInt(opAge),
      gender: opGender,
      type: "OP",
      status: "In Consultation",
      room: "OP-Cabin " + Math.floor(1 + Math.random() * 5),
      doctor: selectedDoctor,
      service: selectedService
    };

    setPatients(prev => [...prev, newPat]);
    handlePostCharge(newUhid, `OP Consulting - ${selectedDoctor}`, 400, "OP_Desk");
    
    // Auto-order service if selected (Real-time Pub/Sub Department Integration)
    if (selectedService !== 'None') {
      let fee = 250;
      let desc = `${selectedService} Ordered`;
      
      if (selectedService === 'Lab Tests') { 
        fee = 600; 
        desc = "Lab Panel (CBC & Liver Profile)";
        // Dispatch to Laboratory Terminal Queue (Zero-Bottleneck Event Bus)
        setLabOrders(prev => [
          ...prev,
          { 
            id: "LAB-" + Math.floor(100 + Math.random() * 900), 
            uhid: newUhid, 
            patientName: opPatientName, 
            testName: "CBC & Liver Profile Scan", 
            status: "Pending", 
            timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
        addNotification("Lab Dispatch", `Dispatched CBC order for ${opPatientName} to Lab Terminal channel.`, "info");
      }
      
      if (selectedService === 'Scanning') { 
        fee = 1500; 
        desc = "USG Abdomen Scan"; 
        // Dispatch to Radiology Terminal (Zero-Bottleneck Event Bus)
        setRadiologyOrders(prev => [
          ...prev,
          { 
            id: "RAD-" + Math.floor(100 + Math.random() * 900), 
            uhid: newUhid, 
            patientName: opPatientName, 
            scanType: "USG Abdomen Scan", 
            status: "Pending", 
            timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          }
        ]);
        addNotification("Radiology Dispatch", `Dispatched FAST USG order for ${opPatientName} to Radiology PACS channel.`, "info");
      }
      
      if (selectedService === 'Injections') { fee = 150; desc = "IV Injection administration"; }
      if (selectedService === 'Cannulation') { fee = 200; desc = "IV Cannulation procedure"; }
      if (selectedService === 'Dressing') { 
        fee = dressingSize === 'S' ? 100 : dressingSize === 'M' ? 250 : 450; 
        desc = `Wound Dressing (${dressingSize})`;
        // Decoupled inventory stock decrement
        setInventoryStock(prev => ({ ...prev, sterileDressings: Math.max(0, prev.sterileDressings - 1) }));
      }

      // Simultaneously dispatch standard medications to the Pharmacy pre-pack queue
      setPharmacyOrders(prev => [
        ...prev,
        {
          id: "RX-" + Math.floor(100 + Math.random() * 900),
          uhid: newUhid,
          patientName: opPatientName,
          medicines: "Pantocid D 40mg x5, Paracetamol 650mg x10",
          status: "Pending",
          timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      addNotification("Pharmacy Dispatch", `Pre-packed prescriptions dispatched for ${opPatientName}.`, "info");

      // Pharmacy dispensation decrements stocks
      setInventoryStock(prev => ({
        ...prev,
        paracetamolVials: Math.max(0, prev.paracetamolVials - 10),
        syringes: Math.max(0, prev.syringes - 2)
      }));

      setTimeout(() => {
        handlePostCharge(newUhid, desc, fee, "Clinical_Desk");
      }, 200);
    }

    setOpPatientName('');
    setOpAge('');
    addNotification("Patient Registered", `${opPatientName} assigned ${newUhid}`, "success");
  };

  // ER Triage registration and multi-department auto-dispatching
  const handleErAdmit = (e) => {
    e.preventDefault();
    if (!erPatientName) return;

    const newUhid = "UHID-" + Math.floor(1000 + Math.random() * 9000);
    const newErPatient = {
      id: "ER-" + Math.floor(100 + Math.random() * 900),
      name: erPatientName,
      triagePriority: triagePriority,
      status: triagePriority === 'Red' ? "In Trauma Bay 1" : "Triage Evaluation",
      timestamp: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setErQueue(prev => [...prev, newErPatient]);
    setPatients(prev => [...prev, {
      id: newUhid,
      name: erPatientName,
      age: 38,
      gender: "Male",
      type: "ER",
      status: "Admitted",
      room: "Trauma Bay",
      doctor: "Dr. Visakh"
    }]);

    // Fast-track auto billing
    handlePostCharge(newUhid, `ER Emergency Triage Assessment (${triagePriority})`, triagePriority === 'Red' ? 1200 : 600, "ER_Triage");

    // Asynchronous inventory decrement simulation
    setInventoryStock(prev => ({
      ...prev,
      syringes: Math.max(0, prev.syringes - 3),
      bloodBags: triagePriority === 'Red' ? Math.max(0, prev.bloodBags - 2) : prev.bloodBags
    }));

    // Pub/Sub real-time dispatching depending on priority
    if (triagePriority === 'Red') {
      // 1. Dispatch lab order
      setLabOrders(prev => [
        ...prev,
        { id: "LAB-" + Math.floor(100 + Math.random() * 900), uhid: newUhid, patientName: erPatientName, testName: "STAT Trauma Screen & Cross-match", status: "Pending", timestamp: "STAT, Just now" }
      ]);
      // 2. Dispatch pharmacy order
      setPharmacyOrders(prev => [
        ...prev,
        { id: "RX-" + Math.floor(100 + Math.random() * 900), uhid: newUhid, patientName: erPatientName, medicines: "STAT Epinephrine, Normal Saline 1L, Tranexamic Acid", status: "Pending", timestamp: "STAT, Just now" }
      ]);
      // 3. Dispatch radiology scan
      setRadiologyOrders(prev => [
        ...prev,
        { id: "RAD-" + Math.floor(100 + Math.random() * 900), uhid: newUhid, patientName: erPatientName, scanType: "FAST Ultrasound & Chest X-Ray", status: "Pending", timestamp: "STAT, Just now" }
      ]);

      addNotification("Code Red Trauma Alert", `High priority dispatches sent to LAB, RX, and RAD for ${erPatientName}.`, "warning");
    } else {
      addNotification("ER Admission", `Registered ${erPatientName} under triage level ${triagePriority}.`, "success");
    }

    setErPatientName('');
  };

  // Bedside-optimized vitals tap logger (Rule 5)
  const handleVitalsSave = () => {
    const patient = patients.find(p => p.id === bedsidePatient);
    if (!patient) return;

    addNotification("Bedside Vitals Saved", `Vitals for ${patient.name} recorded live at bedside.`, "success");
    handlePostCharge(bedsidePatient, "Nursing Vitals Monitoring", 100, "Nursing_Tablet");
  };

  // Global dispatch handler
  const sendDispatch = (target, msg, priority) => {
    const newDispatch = {
      id: Date.now(),
      sender: activeTab.toUpperCase(),
      target: target.toUpperCase(),
      type: priority,
      msg: msg,
      time: new Date().toLocaleTimeString()
    };
    
    setDispatchQueue(prev => [newDispatch, ...prev]);
    addNotification(`Dispatch Sent`, `Transmission to ${target} successful.`, "info");

    if(priority === 'STAT' || priority === 'CODE_BLUE') {
      setActiveEmergencyOverlay(newDispatch);
      // Log emergency cascade in crisis logs if present
      setCrisisLogs(prev => [`[${new Date().toLocaleTimeString()}] EMERGENCY BROADCAST: From ${activeTab.toUpperCase()} -> ${target}. Body: ${msg}`, ...prev]);
    }
    setIsDispatchModalOpen(false);
  };

  // Simulated total revenue
  const totalRevenue = chargeLog.reduce((sum, item) => sum + item.amount, 0) + offlineQueue.reduce((sum, item) => sum + item.amount, 0);

  // Filter patients based on search
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90vh', width: '100%', padding: '24px' }}>
        <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '480px', padding: '40px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div className="icon-container animate-pulse-glow" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'var(--accent-cyan)', width: '64px', height: '64px' }}>
              <ShieldAlert style={{ color: 'var(--accent-cyan)' }} size={32} />
            </div>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px', fontFamily: 'var(--font-heading)', margin: '0 0 4px' }}>HEALIX AUTH GATE</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '32px' }}>Administrative Privilege Authentication</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <div>
              <label className="form-label" style={{ fontWeight: '600' }}>Administrative User ID</label>
              <input 
                type="text" 
                placeholder="e.g. admin, lab_tech, pharmacist" 
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="form-input" 
                required 
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: '600' }}>Privilege Passcode</label>
              <input 
                type="password" 
                placeholder="Password" 
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="form-input" 
                required 
              />
            </div>

            {loginError && (
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: '600', textAlign: 'center', margin: 0 }}>
                {loginError}
              </p>
            )}

            <button type="submit" className="btn btn-cyan" style={{ width: '100%', height: '48px', fontSize: '0.95rem', fontWeight: '700', marginTop: '8px' }}>
              Authenticate Administrative Session
            </button>
          </form>

          {/* HELP HINTS TO DEMONSTRATE THE MULTIPLE INDEPENDENT PLATFORMS */}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '32px', paddingTop: '20px', textAlign: 'left' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pre-configured Privileges:</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div onClick={() => { setLoginUser('superadmin'); setLoginPass('admin'); }} style={{ cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <strong>Super Admin</strong><br/>user: `superadmin` | pass: `admin`
              </div>
              <div onClick={() => { setLoginUser('op_clerk'); setLoginPass('op'); }} style={{ cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <strong>OP Desk Clerk</strong><br/>user: `op_clerk` | pass: `op`
              </div>
              <div onClick={() => { setLoginUser('er_doc'); setLoginPass('er'); }} style={{ cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <strong>ER Commander</strong><br/>user: `er_doc` | pass: `er`
              </div>
              <div onClick={() => { setLoginUser('lab_tech'); setLoginPass('lab'); }} style={{ cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <strong>Lab Tech</strong><br/>user: `lab_tech` | pass: `lab`
              </div>
              <div onClick={() => { setLoginUser('rad_tech'); setLoginPass('radiology'); }} style={{ cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <strong>Radiology Tech</strong><br/>user: `rad_tech` | pass: `radiology`
              </div>
              <div onClick={() => { setLoginUser('pharmacist'); setLoginPass('pharmacy'); }} style={{ cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <strong>Pharmacist</strong><br/>user: `pharmacist` | pass: `pharmacy`
              </div>
              <div onClick={() => { setLoginUser('mms_admin'); setLoginPass('inventory'); }} style={{ cursor: 'pointer', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <strong>Stock MMS</strong><br/>user: `mms_admin` | pass: `inventory`
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', gap: '20px' }}>
      
      {/* ================= TOP BAR ================= */}
      <header className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="icon-container" style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: 'var(--accent-cyan)' }}>
            <Activity className="animate-pulse-glow" style={{ color: 'var(--accent-cyan)' }} size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0, fontFamily: 'var(--font-heading)' }}>HEALIX</h1>
            <p className="mediq-subtitle">Multispeciality Hospital HIMS</p>
          </div>
        </div>

        {/* CONNECTION TOGGLE (Rule 2 simulation) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => setIsDispatchModalOpen(true)}
              className="btn btn-glass"
              style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', 
                borderColor: 'rgba(59,130,246,0.5)', color: 'var(--accent-blue)'
              }}
            >
              <Zap size={14} fill="currentColor" /> DISPATCH
            </button>
            
            <button 
              onClick={() => setIsInboxOpen(!isInboxOpen)}
              className="btn btn-glass"
              style={{ 
                position: 'relative', padding: '8px 12px',
                borderColor: isInboxOpen ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.1)'
              }}
            >
              <Bell size={16} color={isInboxOpen ? 'var(--accent-emerald)' : '#fff'} />
              <span style={{ 
                position: 'absolute', top: '-4px', right: '-4px', 
                background: 'var(--accent-rose)', color: 'white', 
                fontSize: '0.6rem', fontWeight: '800', 
                width: '16px', height: '16px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #090e13'
              }}>
                {dispatchQueue.length}
              </span>
            </button>
          </div>

          <div className="glass-panel animate-slide-up" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
            <Zap style={{ color: 'var(--accent-cyan)' }} size={16} className="animate-pulse" />
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Scanner Active
            </span>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 14px', borderRadius: 'var(--radius-sm)' }}>
            {isOnline ? (
              <>
                <Wifi style={{ color: 'var(--accent-emerald)' }} size={18} />
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-emerald)' }}>SERVER ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="animate-pulse-glow" style={{ color: 'var(--accent-rose)' }} size={18} />
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-rose)' }}>OFFLINE MODE</span>
              </>
            )}
            <button 
              onClick={() => setIsOnline(!isOnline)} 
              className="btn btn-glass" 
              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', marginLeft: '6px' }}
            >
              Simulate {isOnline ? 'Cut' : 'Restore'}
            </button>
          </div>

          {/* ASYNC NON-BLOCKING SAVING INDICATOR (Rule 1) */}
          {isSaving && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>
              <Clock className="animate-pulse-glow" size={14} />
              <span>Auto-Saving (Non-Blocking)...</span>
            </div>
          )}

          {/* Revenue display */}
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-sm)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
            <DollarSign style={{ color: 'var(--accent-emerald)' }} size={16} />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>₹{totalRevenue.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* ================= ALERTS BAR ================= */}
      {alerts.length > 0 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map(alert => (
            <div key={alert.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderRadius: 'var(--radius-md)', borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle style={{ color: 'var(--accent-amber)' }} size={18} />
                <div>
                  <span className="badge badge-amber" style={{ marginRight: '8px' }}>{alert.type}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Patient: <strong>{alert.name}</strong> — {alert.msg}</span>
                </div>
              </div>
              <button 
                onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} 
                className="btn btn-glass" 
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ================= OFFLINE QUEUE STATUS ================= */}
      {offlineQueue.length > 0 && (
        <div className="glass-panel animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderRadius: 'var(--radius-md)', borderColor: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <WifiOff style={{ color: 'var(--accent-rose)' }} size={18} />
            <div>
              <span className="badge badge-rose" style={{ marginRight: '8px' }}>Queue Pending</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                There are <strong>{offlineQueue.length}</strong> items waiting in local queue. Restore network simulation to auto-sync.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CONTENT LAYOUT ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* SIDE NAV MENU */}
        <aside className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ padding: '4px 8px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
            <span className="mediq-subtitle" style={{ color: 'var(--accent-cyan)' }}>ACTIVE PRIVILEGE</span>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '4px', fontFamily: 'var(--font-sans)', fontWeight: '700' }}>
              {userRole === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 
               userRole === 'OP_STAFF' ? 'OP DESK CLERK' : 
               userRole === 'ER_STAFF' ? 'ER COMMANDER' :
               userRole === 'LAB_STAFF' ? 'LAB ANALYZER' :
               userRole === 'RAD_STAFF' ? 'RADIOLOGY PACS' :
               userRole === 'PHARM_STAFF' ? 'PHARMACY DISPENSER' :
               userRole === 'MMS_STAFF' ? 'STOCK MMS' : 'STAFF'}
            </strong>
          </div>

          {(userRole === 'SUPER_ADMIN') && (
            <>
              <p className="mediq-subtitle" style={{ padding: '4px 8px' }}>Primary Modules</p>
              
              <button onClick={() => setActiveTab('dashboard')} className={`btn btn-glass ${activeTab === 'dashboard' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <Layers size={18} /> Dashboard
              </button>
              
              <button onClick={() => setActiveTab('admin_hub')} className={`btn btn-glass ${activeTab === 'admin_hub' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <TrendingUp size={18} /> Admin & Analytics
              </button>
              
              <button onClick={() => setActiveTab('ip')} className={`btn btn-glass ${activeTab === 'ip' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <BedDouble size={18} /> Inpatient (IP) Desk
              </button>
              
              <button onClick={() => setActiveTab('ob')} className={`btn btn-glass ${activeTab === 'ob' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <Heart size={18} /> OB / Bedside Tablet
              </button>

              <button 
                onClick={() => setActiveTab('crisis')} 
                className={`btn btn-glass ${activeTab === 'crisis' ? 'active' : ''}`} 
                style={{ 
                  justifyContent: 'flex-start', width: '100%', 
                  color: isCrisisMode ? 'var(--accent-rose)' : 'inherit',
                  borderColor: isCrisisMode ? 'rgba(244,63,94,0.5)' : 'transparent',
                  background: isCrisisMode ? 'rgba(244,63,94,0.1)' : 'transparent'
                }}
              >
                <ShieldAlert size={18} /> Crisis Protocols {isCrisisMode && <span className="badge badge-rose" style={{fontSize:'0.6rem', padding:'1px 4px'}}>ACTIVE</span>}
              </button>
            </>
          )}

          <p className="mediq-subtitle" style={{ padding: '12px 8px 4px' }}>Interconnected platforms</p>

          {(userRole === 'SUPER_ADMIN' || userRole === 'OP_STAFF') && (
            <button onClick={() => setActiveTab('op')} className={`btn btn-glass ${activeTab === 'op' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Users size={18} /> Outpatient (OP) Desk
            </button>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'OP_STAFF') && (
            <button onClick={() => setActiveTab('opqueue')} className={`btn btn-glass ${activeTab === 'opqueue' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Ticket size={18} /> OP Queue & Consult
            </button>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'OP_STAFF') && (
            <button onClick={() => setActiveTab('referrals')} className={`btn btn-glass ${activeTab === 'referrals' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <FileText size={18} /> Internal Referrals
            </button>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'ER_STAFF') && (
            <button onClick={() => setActiveTab('er')} className={`btn btn-glass ${activeTab === 'er' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <ShieldAlert size={18} /> Emergency & Triage
            </button>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'LAB_STAFF') && (
            <button onClick={() => setActiveTab('lab')} className={`btn btn-glass ${activeTab === 'lab' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Activity size={18} /> Laboratory Terminal
            </button>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'RAD_STAFF') && (
            <button onClick={() => setActiveTab('radiology')} className={`btn btn-glass ${activeTab === 'radiology' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Layers size={18} /> Radiology (PACS) Desk
            </button>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'PHARM_STAFF') && (
            <button onClick={() => setActiveTab('pharmacy')} className={`btn btn-glass ${activeTab === 'pharmacy' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Package size={18} /> Pharmacy Terminal
            </button>
          )}

          {(userRole === 'SUPER_ADMIN' || userRole === 'MMS_STAFF') && (
            <button onClick={() => setActiveTab('inventory')} className={`btn btn-glass ${activeTab === 'inventory' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
              <Store size={18} /> Central Stock (MMS)
            </button>
          )}

          {(userRole === 'SUPER_ADMIN') && (
            <>
              <p className="mediq-subtitle" style={{ padding: '12px 8px 4px' }}>Specialty Modules</p>

              <button onClick={() => setActiveTab('ot')} className={`btn btn-glass ${activeTab === 'ot' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <ShieldCheck size={18} /> OT / Surgery Board
              </button>

              <button onClick={() => setActiveTab('insurance')} className={`btn btn-glass ${activeTab === 'insurance' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <Shield size={18} /> Insurance / TPA Desk
              </button>

              <button onClick={() => setActiveTab('packages')} className={`btn btn-glass ${activeTab === 'packages' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <TrendingUp size={18} /> Health Packages
              </button>

              <p className="mediq-subtitle" style={{ padding: '12px 8px 4px' }}>Institution Wide</p>
              
              <button onClick={() => setActiveTab('marketing')} className={`btn btn-glass ${activeTab === 'marketing' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <MessageSquare size={18} /> Marketing & CRM Hub
              </button>

              <p className="mediq-subtitle" style={{ padding: '12px 8px 4px' }}>Finance & Accounts</p>
              
              <button onClick={() => setActiveTab('billing')} className={`btn btn-glass ${activeTab === 'billing' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <DollarSign size={18} /> Central Billing & RCM
              </button>

              <button onClick={() => setActiveTab('ipnew')} className={`btn btn-glass ${activeTab === 'ipnew' ? 'active' : ''}`} style={{ justifyContent: 'flex-start', width: '100%' }}>
                <BedDouble size={18} /> IPD Admission Desk
              </button>
            </>
          )}

          <button 
            onClick={handleLogout} 
            className="btn btn-glass" 
            style={{ 
              justifyContent: 'center', 
              width: '100%', 
              marginTop: '16px', 
              borderColor: 'rgba(244, 63, 94, 0.2)', 
              color: 'var(--accent-rose)', 
              fontWeight: '600' 
            }}
          >
            🔒 Terminate Session
          </button>

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>Total Active Patients</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>{patients.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>Beds Occupied</span>
              <span style={{ fontWeight: '700', color: 'var(--accent-amber)' }}>{patients.filter(p => p.type === 'IP').length} / 12</span>
            </div>
          </div>
        </aside>

        {/* WORKSPACE VIEWPORT */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SEARCH & FILTERS FOR WORKSPACE */}
          <div className="glass-panel" style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderRadius: 'var(--radius-md)', alignItems: 'center' }}>
            <Search style={{ color: 'var(--text-muted)' }} size={18} />
            <input 
              type="text" 
              placeholder="Search patients by name or UHID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input" 
              style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
            />
          </div>

          {/* ================= TAB CONTENT 0: CRISIS PROTOCOLS ================= */}
          {activeTab === 'crisis' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* DYNAMIC EMERGENCY ALERT BANNER */}
              <div style={{ 
                padding: '24px', 
                borderRadius: 'var(--radius-md)', 
                background: isCrisisMode ? 'linear-gradient(135deg, #f43f5e 0%, #9f1239 100%)' : 'linear-gradient(135deg, rgba(244,63,94,0.05) 0%, rgba(244,63,94,0.1) 100%)',
                border: `2px solid ${isCrisisMode ? 'var(--accent-rose)' : 'rgba(244,63,94,0.2)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: isCrisisMode ? '0 10px 30px -10px rgba(244,63,94,0.5)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <ShieldAlert size={32} color={isCrisisMode ? '#fff' : 'var(--accent-rose)'} style={{ animation: isCrisisMode ? 'pulse 1.5s infinite' : 'none' }} />
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: isCrisisMode ? '#fff' : 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                      CRISIS COMMAND & CONTROL
                    </h2>
                  </div>
                  <p style={{ color: isCrisisMode ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500', maxWidth: '600px' }}>
                    Authoritative system-wide override mechanism for Extreme Contingency Scenarios. Activating these protocols suspends normal operational gates in favor of immediate life-preservation.
                  </p>
                </div>
                
                <button 
                  onClick={() => {
                    setIsCrisisMode(!isCrisisMode);
                    addNotification(isCrisisMode ? "Protocol Suspended" : "CRITICAL EMERGENCY ACTIVE", isCrisisMode ? "Normal hospital safeguards reinstated." : "Mass Casualty protocols engaged! Global verification disabled.", isCrisisMode ? "info" : "error");
                    setCrisisLogs(prev => [`[${new Date().toLocaleTimeString()}] Protocol ${isCrisisMode ? 'DEACTIVATED' : 'ACTIVATED'} by SuperAdmin.`, ...prev]);
                  }}
                  className={`btn ${isCrisisMode ? 'btn-glass' : 'btn-rose'}`}
                  style={{ 
                    height: '56px', padding: '0 32px', fontSize: '1rem', fontWeight: '800', letterSpacing: '1px',
                    background: isCrisisMode ? '#fff' : undefined, color: isCrisisMode ? 'var(--accent-rose)' : undefined,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {isCrisisMode ? "🔴 TERMINATE CRISIS OVERRIDE" : "⚠️ INITIATE MASS CASUALTY PROTOCOL"}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                
                {/* LEFT COLUMN: ACTIVE CONTINGENCY SUB-SYSTEMS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* TOOL 1: ANONYMOUS OVERFLOW REGISTRY */}
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                      <Users size={20} color="var(--accent-cyan)" />
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Trauma-Burst Anonymous Generation</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Generate sequential placeholder slots for mass incoming unidentified casualties.</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px' }}>INCIDENT NAME / DESIGNATOR</label>
                        <input 
                          type="text" 
                          placeholder="e.g. HIGHWAY-COLLISION-MCI" 
                          className="form-input" 
                          style={{ background: 'rgba(255,255,255,0.03)' }}
                          id="mciDesignator"
                        />
                      </div>
                      <div style={{ width: '140px' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '6px' }}>VICTIM COUNT</label>
                        <select className="form-input" style={{ background: 'rgba(255,255,255,0.03)' }} id="mciCount">
                          <option value="5">5 Patients</option>
                          <option value="10">10 Patients</option>
                          <option value="25">25 Patients</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button 
                          onClick={() => {
                            const desig = document.getElementById('mciDesignator').value || "UNIDENTIFIED";
                            const count = parseInt(document.getElementById('mciCount').value);
                            let newPat = [];
                            for(let i=1; i<=count; i++) {
                              newPat.push({
                                id: `T-DOE-${Math.floor(Math.random()*10000)}`,
                                name: `[EMERGENCY] ${desig} Victim #${i}`,
                                age: "??",
                                gender: "Unknown",
                                type: "ER",
                                status: "Critical Triage",
                                room: "ER - OVERFLOW",
                                doctor: "EMERGENCY TEAM"
                              });
                            }
                            setPatients(prev => [...newPat, ...prev]);
                            setCrisisLogs(prev => [`[${new Date().toLocaleTimeString()}] Spawned ${count} Sequential Emergency Slots for incident: ${desig}.`, ...prev]);
                            addNotification("Mass Creation", `${count} patient shells instantiated in global stack!`, "warning");
                          }}
                          className="btn btn-cyan" 
                          style={{ height: '42px', fontWeight: '700', padding: '0 20px' }}
                        >
                          ⚡ SPAWN SLOTS
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TOOL 2: BATCH QUARANTINE MONITOR */}
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={20} color="var(--accent-rose)" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Global Bio-Lock Audit</h3>
                      </div>
                      <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>{quarantinedBatches.length} Active Lockdowns</span>
                    </div>
                    
                    {quarantinedBatches.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <ShieldCheck size={40} color="var(--accent-emerald)" style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No restricted medication batches found in active lockdown.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {quarantinedBatches.map((batch, i) => {
                          const med = inventoryList.find(inv => inv.batch === batch);
                          return (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '8px' }}>
                              <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-rose)' }}>BATCH ID: {batch}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Affected Product: {med ? med.name : "Unknown/Retired SKU"}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setQuarantinedBatches(prev => prev.filter(b => b !== batch));
                                  addNotification("Manual Unlock", `SuperAdmin override forced release on ${batch}`, "info");
                                }}
                                className="btn btn-glass" style={{ borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)', fontSize: '0.75rem' }}>
                                RELEASE LOCK
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* RIGHT COLUMN: LOGS & OVERVIEW */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-md)', flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                      System Audit Trail: Protocol Activations
                    </h3>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                      {crisisLogs.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Awaiting input log events...</p>
                      ) : (
                        crisisLogs.map((log, i) => (
                          <div key={i} style={{ fontSize: '0.75rem', fontFamily: 'monospace', padding: '8px', background: 'rgba(0,0,0,0.2)', borderLeft: `3px solid ${log.includes('ACTIVATED') ? 'var(--accent-rose)' : 'var(--accent-cyan)'}`, borderRadius: '4px', color: 'rgba(255,255,255,0.7)' }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ================= TAB CONTENT 1: DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* STATS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Consolidated Revenue</p>
                  <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-emerald)', marginTop: '8px', fontFamily: 'var(--font-heading)' }}>₹{totalRevenue.toLocaleString()}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '6px' }}>
                    <TrendingUp size={12} />
                    <span>Real-time billing tally</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Active Wards</p>
                  <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-blue)', marginTop: '8px', fontFamily: 'var(--font-heading)' }}>{patients.filter(p => p.type === 'IP').length} Patients</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <BedDouble size={12} />
                    <span>Bed Occupancy: {Math.round((patients.filter(p => p.type === 'IP').length / 12) * 100)}%</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Offline Sync State</p>
                  <h2 style={{ fontSize: '2rem', fontWeight: '700', color: offlineQueue.length > 0 ? 'var(--accent-rose)' : 'var(--accent-cyan)', marginTop: '8px', fontFamily: 'var(--font-heading)' }}>
                    {offlineQueue.length} Queue
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <ShieldCheck size={12} />
                    <span>{offlineQueue.length > 0 ? 'Pending auto-upload' : 'Database synchronized'}</span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Today's OP Consults</p>
                  <h2 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-purple)', marginTop: '8px', fontFamily: 'var(--font-heading)' }}>
                    {patients.filter(p => p.type === 'OP').length} Walk-ins
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <Activity size={12} />
                    <span>Average consult: 12m</span>
                  </div>
                </div>
              </div>

              {/* ============================================ */}
              {/* ROW 2: RECENT DISPATCHES & ANALYTICS OVERVIEW */}
              {/* ============================================ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                {/* LIVE CHART */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Today's Revenue Throughput</h3>
                  <div style={{ height: '180px', borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 10px' }}>
                    {[30, 45, 25, 60, 80, 55, 90].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: `${h}%`, background: 'linear-gradient(to top, var(--accent-emerald), transparent)', opacity: 0.4, borderRadius: '4px 4px 0 0' }}></div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>09:00</span><span>11:00</span><span>13:00</span><span>15:00</span><span>17:00</span>
                  </div>
                </div>

                {/* RECENT LOGS (Normal Scenarios) */}
                <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Activity Feed</h3>
                    <span className="badge badge-glass" style={{ fontSize: '0.6rem' }}>ROUTINE LOGS</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dispatchQueue.slice(0, 4).map(d => (
                      <div key={d.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: `3px solid ${d.type === 'STAT' || d.type === 'CODE_BLUE' ? 'var(--accent-rose)' : 'var(--accent-cyan)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                          <strong style={{ color: '#fff' }}>{d.sender} ➡️ {d.target}</strong>
                          <span style={{ color: 'var(--text-muted)' }}>{d.time}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CORE PATIENT FLOW VIEW */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>Live Patient Directory</h3>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <th style={{ padding: '12px 8px' }}>UHID / PATIENT</th>
                      <th style={{ padding: '12px 8px' }}>AGE / GENDER</th>
                      <th style={{ padding: '12px 8px' }}>DEPT PATHWAY</th>
                      <th style={{ padding: '12px 8px' }}>LOCATION / ROOM</th>
                      <th style={{ padding: '12px 8px' }}>ASSIGNED STAFF</th>
                      <th style={{ padding: '12px 8px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '16px 8px', fontWeight: '600' }}>
                          <span style={{ display: 'block', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontFamily: 'var(--font-heading)' }}>{p.id}</span>
                          {p.name}
                        </td>
                        <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{p.age} yrs / {p.gender}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <span className={`badge ${p.type === 'OP' ? 'badge-cyan' : p.type === 'IP' ? 'badge-amber' : 'badge-purple'}`}>
                            {p.type === 'OP' ? 'Outpatient' : p.type === 'IP' ? 'Inpatient' : 'OB/OT Ward'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{p.room}</td>
                        <td style={{ padding: '16px 8px', color: 'var(--text-secondary)' }}>{p.doctor}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <span className={`badge ${p.status === 'Anticipated Discharge' ? 'badge-rose animate-pulse-glow' : 'badge-emerald'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* NOTIFICATION FEED */}
              <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={16} /> Real-time WebSocket Alert Feed
                  </h4>
                  <button onClick={() => setNotifications([])} className="btn btn-glass" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Clear Feed</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{ display: 'flex', gap: '10px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--accent-cyan)', borderRadius: '4px', fontSize: '0.8rem' }}>
                      <CheckCircle size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)', display: 'block' }}>{n.title}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{n.message}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB CONTENT 2: OP PATHWAY ================= */}
          {activeTab === 'op' && (
            <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* REGISTRATION FORM */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus style={{ color: 'var(--accent-cyan)' }} /> OP Registration & Services
                </h3>
                
                <form onSubmit={handleOpRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Patient Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Subhash" 
                      value={opPatientName}
                      onChange={(e) => setOpPatientName(e.target.value)}
                      className="form-input" 
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label className="form-label">Age (Years)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 31" 
                        value={opAge}
                        onChange={(e) => setOpAge(e.target.value)}
                        className="form-input" 
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Gender</label>
                      <select value={opGender} onChange={(e) => setOpGender(e.target.value)} className="form-select">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Consulting Specialty Doctor</label>
                    <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} className="form-select">
                      <option value="Dr. Visakh">Dr. Visakh (General Medicine)</option>
                      <option value="Dr. Susan">Dr. Susan (Gynecology)</option>
                      <option value="Dr. Vinod">Dr. Vinod (Cardiology)</option>
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <label className="form-label">Immediate Service Order</label>
                    <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="form-select">
                      <option value="None">Consultation Only (No Service)</option>
                      <option value="Lab Tests">Lab Panel (CBC, LFT) - ₹600</option>
                      <option value="Scanning">Ultrasonography Scan - ₹1500</option>
                      <option value="Injections">IV / IM Injection - ₹150</option>
                      <option value="Cannulation">IV Cannulation - ₹200</option>
                      <option value="Dressing">Dressing Wound - Tiered Price</option>
                    </select>
                  </div>

                  {selectedService === 'Dressing' && (
                    <div className="animate-slide-up">
                      <label className="form-label">Dressing Charge Tier</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {['S', 'M', 'L'].map(size => (
                          <button 
                            key={size}
                            type="button"
                            onClick={() => setDressingSize(size)}
                            className={`btn btn-glass ${dressingSize === size ? 'active' : ''}`}
                            style={{ flex: 1 }}
                          >
                            {size === 'S' ? 'Small (₹100)' : size === 'M' ? 'Medium (₹250)' : 'Large (₹450)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-cyan" style={{ width: '100%', marginTop: '10px' }}>
                    Register & Dispatch Bills
                  </button>
                </form>
              </div>

              {/* SERVICE PRICE REFERENCE LIST */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>OP Services Price Index</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Charges are dispatched in real-time to the central immutable charge ledger upon submission.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Standard Doctor Consultation</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>₹400</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Standard Lab Package (CBC)</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>₹600</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Scanning / Ultrasonography</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>₹1500</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Cannulation Procedure Fee</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>₹200</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Wound Dressing (Small/Medium/Large)</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>₹100 / ₹250 / ₹450</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB CONTENT 3: IP PATHWAY ================= */}
          {activeTab === 'ip' && (
            <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* ROOMS & BEDS ALLOCATION */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Ward Charge Accumulation</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Select Active Admitted Patient</label>
                    <select 
                      value={selectedIpPatient} 
                      onChange={(e) => setSelectedIpPatient(e.target.value)} 
                      className="form-select"
                    >
                      {patients.filter(p => p.type === 'IP').map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id}) - {p.room}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <label className="form-label">Add Daily IP Service Charges</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                      <button type="button" onClick={() => handlePostCharge(selectedIpPatient, "Room Rent - Private Ward", 3500, "Inpatient_Desk")} className="btn btn-glass" style={{ fontSize: '0.8rem' }}>
                        Room Rent (₹3500)
                      </button>
                      <button type="button" onClick={() => handlePostCharge(selectedIpPatient, "Nursing Care Charges", 600, "Inpatient_Desk")} className="btn btn-glass" style={{ fontSize: '0.8rem' }}>
                        Nursing Care (₹600)
                      </button>
                      <button type="button" onClick={() => handlePostCharge(selectedIpPatient, "Doctor Round Visit Charge - Dr. Vinod", 500, "Inpatient_Desk")} className="btn btn-glass" style={{ fontSize: '0.8rem' }}>
                        Dr Visit (₹500)
                      </button>
                      <button type="button" onClick={() => handlePostCharge(selectedIpPatient, "RMO Consultation Charge", 300, "Inpatient_Desk")} className="btn btn-glass" style={{ fontSize: '0.8rem' }}>
                        RMO Service (₹300)
                      </button>
                    </div>
                  </div>

                  {/* CUSTOM SERVICE ENTRY */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <label className="form-label">Custom Service Entry</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        placeholder="Description" 
                        value={customIpChargeDesc}
                        onChange={(e) => setCustomIpChargeDesc(e.target.value)}
                        className="form-input" 
                        style={{ flex: 2 }}
                      />
                      <input 
                        type="number" 
                        placeholder="Amount" 
                        value={customIpChargeAmount}
                        onChange={(e) => setCustomIpChargeAmount(e.target.value)}
                        className="form-input" 
                        style={{ flex: 1 }}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!customIpChargeDesc || !customIpChargeAmount) return;
                        handlePostCharge(selectedIpPatient, customIpChargeDesc, customIpChargeAmount, "Inpatient_Desk");
                        setCustomIpChargeDesc('');
                        setCustomIpChargeAmount('');
                      }}
                      className="btn btn-cyan" 
                      style={{ width: '100%', marginTop: '12px' }}
                    >
                      Post Custom Charge
                    </button>
                  </div>
                </div>
              </div>

              {/* DISCHARGE PLANNING MODULE (Rule 4) */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', fontFamily: 'var(--font-heading)', color: 'var(--accent-rose)' }}>
                  Rule 4: Anticipatory Discharge Control
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Doctors can flag anticipated discharge 2 hours early. Pharmacy will immediately pre-pack meds and billing desks pre-generate drafts to completely avoid exit bottlenecks.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {patients.filter(p => p.type === 'IP').map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', display: 'block' }}>{p.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: <strong>{p.status}</strong></span>
                      </div>
                      
                      {p.status !== "Anticipated Discharge" ? (
                        <button 
                          onClick={() => triggerAnticipatedDischarge(p.id)} 
                          className="btn btn-rose" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          Trigger Anticipated Discharge
                        </button>
                      ) : (
                        <span className="badge badge-rose animate-pulse-glow">Discharging (Meds pre-packing)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB CONTENT 4: OB & BEDSIDE TABLET ================= */}
          {activeTab === 'ob' && (
            <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* BEDSIDE VITALS MODULE (Rule 5) */}
              <div className="glass-panel animate-pulse-glow" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Smartphone style={{ color: 'var(--accent-cyan)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>
                    Rule 5: Bedside Tablet Interface
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Bedside interface designed for rapid single-tap logging on tablets during active rounds. No paper double-entry.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label className="form-label">Selected Ward Patient</label>
                    <select 
                      value={bedsidePatient} 
                      onChange={(e) => setBedsidePatient(e.target.value)} 
                      className="form-select"
                    >
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.room})</option>
                      ))}
                    </select>
                  </div>

                  {/* Bedside vitals logging */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label className="form-label">Blood Pressure (BP)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {["120/80", "130/85", "140/90"].map(v => (
                          <button 
                            key={v}
                            type="button" 
                            onClick={() => setBedsideVitals(prev => ({ ...prev, bp: v }))} 
                            className={`btn btn-glass ${bedsideVitals.bp === v ? 'active' : ''}`}
                            style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Oxygen SpO2 (%)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {["99", "98", "95"].map(v => (
                          <button 
                            key={v}
                            type="button" 
                            onClick={() => setBedsideVitals(prev => ({ ...prev, spo2: v }))} 
                            className={`btn btn-glass ${bedsideVitals.spo2 === v ? 'active' : ''}`}
                            style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                          >
                            {v}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label className="form-label">Pulse (bpm)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {["72", "80", "95"].map(v => (
                          <button 
                            key={v}
                            type="button" 
                            onClick={() => setBedsideVitals(prev => ({ ...prev, pulse: v }))} 
                            className={`btn btn-glass ${bedsideVitals.pulse === v ? 'active' : ''}`}
                            style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Temperature (°F)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {["98.4", "99.2", "100.5"].map(v => (
                          <button 
                            key={v}
                            type="button" 
                            onClick={() => setBedsideVitals(prev => ({ ...prev, temp: v }))} 
                            className={`btn btn-glass ${bedsideVitals.temp === v ? 'active' : ''}`}
                            style={{ flex: 1, padding: '6px', fontSize: '0.75rem' }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleVitalsSave}
                    className="btn btn-cyan" 
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    Log Vitals Live (Coupled with Billing)
                  </button>
                </div>
              </div>

              {/* OBSTETRICS WORKFLOW OVERVIEW */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>OB Observation & Delivery</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Specific obstetric monitoring flow tracking postpartum care and infant vitals without any inter-department manual bottlenecks.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>Fetal Monitoring (CTG)</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Continuous trace graph</span>
                    </div>
                    <button onClick={() => handlePostCharge("UHID-7811", "Fetal CTG Monitoring Service", 500, "OB_Ward")} className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Bill ₹500</button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>Labor Delivery Suite Care</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Maternity wing service charge</span>
                    </div>
                    <button onClick={() => handlePostCharge("UHID-7811", "Maternity Suite Charge (Normal Delivery)", 15000, "OB_Ward")} className="btn btn-glass" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Bill ₹15000</button>
                  </div>
                </div>
              </div>

            </div>
          )}
          {/* ================= TAB CONTENT: LABORATORY TERMINAL ================= */}
          {activeTab === 'lab' && (
            <div className="animate-slide-up" style={{ height: 'calc(100vh - 120px)' }}>
              <LisModule 
                labOrders={labOrders} 
                setLabOrders={setLabOrders}
                handlePostCharge={handlePostCharge}
                addNotification={addNotification}
                labMasterTests={labMasterTests}
              />
            </div>
          )}

          {/* ================= TAB CONTENT: PHARMACY TERMINAL ================= */}
          {activeTab === 'pharmacy' && (() => {
            const activeOrder = pharmacyOrders.find(o => o.id === selectedPharmacyId) || pharmacyOrders[0];

            // Filter pharmacy queue based on search query and active tab filter
            const filteredPharmacyList = pharmacyOrders.filter(order => {
              const matchesSearch = order.patientName.toLowerCase().includes(pharmacySearch.toLowerCase()) || 
                                    order.uhid.toLowerCase().includes(pharmacySearch.toLowerCase()) || 
                                    order.id.toLowerCase().includes(pharmacySearch.toLowerCase());
              
              if (!matchesSearch) return false;
              
              if (pharmacyFilter !== 'all') {
                return order.status === pharmacyFilter;
              }
              return true;
            });

            // Helper function to update prescription medicine quantities live
            const handleUpdateMedicineQty = (orderId, medBaseName, newQty) => {
              setPharmacyOrders(prev => prev.map(order => {
                if (order.id !== orderId) return order;
                
                const medParts = order.medicines.split(', ');
                const updatedParts = medParts.map(part => {
                  if (part.toLowerCase().includes(medBaseName.toLowerCase())) {
                    return `${medBaseName} x${newQty}`;
                  }
                  return part;
                });
                
                return { ...order, medicines: updatedParts.join(', ') };
              }));
            };

            return (
              <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* INTERACTIVE FORM TO REGISTER NEW PRESCRIPTION INDENT */}
                {isAddingPrescription && (
                  <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16, 185, 129, 0.35)', background: 'rgba(16, 185, 129, 0.02)' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-emerald)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      📝 Generate Electronic Prescription Indent
                    </h4>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newRxPatientName || !newRxMedicines) {
                          addNotification("Validation Error", "Please fill in patient name and prescribed medicines.", "error");
                          return;
                        }
                        
                        const nextRxId = `RX-${pharmacyOrders.length + 811}`;
                        const newRx = {
                          id: nextRxId,
                          uhid: newRxUhid || `UHID-${Math.floor(1000 + Math.random() * 9000)}`,
                          patientName: newRxPatientName,
                          medicines: newRxMedicines,
                          status: "Pending",
                          timestamp: "Today, Just Now"
                        };

                        setPharmacyOrders(prev => [...prev, newRx]);
                        setSelectedPharmacyId(nextRxId);
                        addNotification("Prescription Indent Created", `Successfully generated clinical indent ${nextRxId} for ${newRxPatientName}.`, "success");
                        
                        setNewRxPatientName('');
                        setNewRxUhid('');
                        setNewRxMedicines('');
                        setIsAddingPrescription(false);
                      }}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Patient Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Subhash K P" 
                          value={newRxPatientName} 
                          onChange={(e) => setNewRxPatientName(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Patient UHID (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. UHID-4022 (leave blank to auto-generate)" 
                          value={newRxUhid} 
                          onChange={(e) => setNewRxUhid(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Prescribed Medicines (Format: Name xQuantity, Name2 xQuantity2)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Paracetamol 650mg x10, Amoxicillin 500mg x6, Pantocid D 40mg x5" 
                          value={newRxMedicines} 
                          onChange={(e) => setNewRxMedicines(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingPrescription(false)}
                          className="btn btn-glass"
                          style={{ fontWeight: '700' }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-emerald"
                          style={{ fontWeight: '700' }}
                        >
                          💾 Transmit Prescription to Pharmacy
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* SUB-SECTION SELECTOR PILLS */}
                <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <button 
                    onClick={() => setPharmacySubTab('dispensation')}
                    className="btn"
                    style={{
                      background: pharmacySubTab === 'dispensation' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: pharmacySubTab === 'dispensation' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                      borderColor: pharmacySubTab === 'dispensation' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)',
                      borderStyle: 'solid',
                      borderWidth: '1px',
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Clinical Dispensation Desk
                  </button>
                  <button 
                    onClick={() => setPharmacySubTab('stock')}
                    className="btn"
                    style={{
                      background: pharmacySubTab === 'stock' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: pharmacySubTab === 'stock' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      borderColor: pharmacySubTab === 'stock' ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-color)',
                      borderStyle: 'solid',
                      borderWidth: '1px',
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    📦 Department Stock & Procurement
                  </button>
                </div>

                {pharmacySubTab === 'dispensation' && (
                  <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'start' }}>
                  
                  {/* LEFT PANE: PRESCRIPTION QUEUE */}
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', margin: 0 }}>
                          💊 E-Prescription Queue
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Pharmacists receive doctor electronic indents instantly upon checkout.
                        </p>
                      </div>
                      <button 
                        onClick={() => setIsAddingPrescription(!isAddingPrescription)}
                        className="btn btn-emerald"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700' }}
                      >
                        <Plus size={14} /> {isAddingPrescription ? "Close Form" : "Create Indent"}
                      </button>
                    </div>

                    {/* SEARCH & FILTERS TOOLBAR */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="🔍 Search patient name, UHID, or indent ID..." 
                        value={pharmacySearch}
                        onChange={(e) => setPharmacySearch(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', height: '36px', fontSize: '0.8rem' }}
                      />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => setPharmacyFilter('all')}
                          className={`badge ${pharmacyFilter === 'all' ? 'badge-cyan' : 'badge-glass'}`}
                          style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: '0.65rem', fontWeight: '700' }}
                        >
                          All Queue ({pharmacyOrders.length})
                        </button>
                        <button 
                          onClick={() => setPharmacyFilter('Pending')}
                          className={`badge ${pharmacyFilter === 'Pending' ? 'badge-amber animate-pulse-glow' : 'badge-glass'}`}
                          style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: '0.65rem', fontWeight: '700' }}
                        >
                          Pending ({pharmacyOrders.filter(o => o.status === 'Pending').length})
                        </button>
                        <button 
                          onClick={() => setPharmacyFilter('Dispensed')}
                          className={`badge ${pharmacyFilter === 'Dispensed' ? 'badge-emerald' : 'badge-glass'}`}
                          style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', fontSize: '0.65rem', fontWeight: '700' }}
                        >
                          Dispensed ({pharmacyOrders.filter(o => o.status === 'Dispensed').length})
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
                      {filteredPharmacyList.length === 0 ? (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No matching indents.</p>
                      ) : (
                        filteredPharmacyList.map(order => {
                          const isSelected = order.id === selectedPharmacyId;
                          return (
                            <div 
                              key={order.id} 
                              onClick={() => setSelectedPharmacyId(order.id)}
                              className="glass-panel" 
                              style={{ 
                                padding: '16px', 
                                borderRadius: 'var(--radius-md)', 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderLeft: isSelected ? '4px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                                background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                                borderColor: isSelected ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)',
                                position: 'relative'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.85rem', color: isSelected ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>{order.id}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '20px' }}>{order.timestamp}</span>
                              </div>
                              <div style={{ marginTop: '6px' }}>
                                <strong style={{ fontSize: '0.9rem', display: 'block' }}>{order.patientName}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>UHID: {order.uhid}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <span className={`badge ${order.status === 'Dispensed' ? 'badge-emerald' : 'badge-amber animate-pulse-glow'}`}>
                                  {order.status}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>Click to Inspect</span>
                              </div>

                              {/* DELETE/CANCEL PRESCRIPTION INDENT */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPharmacyOrders(prev => prev.filter(o => o.id !== order.id));
                                  addNotification("Indent Cancelled", `Electronic prescription ${order.id} has been deleted and archived.`, "warning");
                                }}
                                className="btn btn-rose"
                                style={{ position: 'absolute', top: '14px', right: '14px', padding: '4px 8px', fontSize: '0.65rem', height: '24px' }}
                                title="Cancel Indent"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* MIDDLE PANE: CLINICAL DISPENSATION WORKSTATION */}
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {activeOrder ? (
                      <>
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>ACTIVE DISPENSATION DESK</span>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                              Inspect Prescription: <strong style={{ color: 'var(--accent-cyan)' }}>{activeOrder.id}</strong>
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              Patient: <strong>{activeOrder.patientName}</strong> (UHID: {activeOrder.uhid}) | Assigned Consult Doctor: <strong>Dr. Visakh</strong>
                            </p>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Received: {activeOrder.timestamp}</span>
                        </div>

                        {/* CLINICAL METADATA TABLES */}
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🧬 E-Prescription Dosage & Stock Breakdown
                          </h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                <th style={{ padding: '8px' }}>MEDICINE NAME</th>
                                <th style={{ padding: '8px' }}>LOCATION</th>
                                <th style={{ padding: '8px' }}>BATCH / EXP</th>
                                <th style={{ padding: '8px' }}>DOSAGE SCHEMA</th>
                                <th style={{ padding: '8px' }}>STOCK</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>ACTION</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeOrder.medicines.split(', ').map((medStr, idx) => {
                                const qtyMatch = medStr.match(/x(\d+)/);
                                const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
                                const baseName = medStr.replace(/ x\d+/, '');
                                
                                // Find matching medicine in our inventoryList
                                const matchingInv = inventoryList.find(inv => inv.name.toLowerCase().includes(baseName.toLowerCase()));
                                const isLowStock = matchingInv ? matchingInv.stock < qty : false;
                                const isQuarantined = matchingInv && quarantinedBatches.includes(matchingInv.batch);
                                
                                return (
                                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', fontSize: '0.8rem', opacity: isQuarantined ? 0.6 : 1, background: isQuarantined ? 'rgba(244, 63, 94, 0.05)' : 'transparent' }}>
                                    <td style={{ padding: '12px 8px', fontWeight: '600' }}>
                                      <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{matchingInv ? matchingInv.generic : 'Generic formulation'}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <span>{baseName}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <button 
                                            onClick={() => handleUpdateMedicineQty(activeOrder.id, baseName, Math.max(1, qty - 1))}
                                            className="badge badge-glass" 
                                            style={{ padding: '1px 6px', fontSize: '0.7rem', cursor: 'pointer', border: 'none' }}
                                          >
                                            -
                                          </button>
                                          <span style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '0.85rem' }}>x{qty}</span>
                                          <button 
                                            onClick={() => handleUpdateMedicineQty(activeOrder.id, baseName, qty + 1)}
                                            className="badge badge-glass" 
                                            style={{ padding: '1px 6px', fontSize: '0.7rem', cursor: 'pointer', border: 'none' }}
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                      <span className="badge badge-glass" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
                                        {matchingInv ? matchingInv.location : 'Aisle 1-A'}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                      {matchingInv ? matchingInv.batch : 'B-GEN021'}
                                      <br />
                                      <strong style={{ color: matchingInv && matchingInv.expiry.startsWith('2026') ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                                        EXP: {matchingInv ? matchingInv.expiry : '2027-12'}
                                      </strong>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="badge badge-glass" style={{ fontSize: '0.7rem', fontWeight: '700' }}>
                                          {baseName.includes('Pantocid') ? '1 - 0 - 0' : '1 - 0 - 1'}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                          {baseName.includes('Pantocid') ? 'Before Food' : 'After Food'}
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                      {matchingInv ? (
                                        <span className={`badge ${isLowStock ? 'badge-rose animate-pulse-glow' : 'badge-emerald'}`} style={{ fontSize: '0.7rem' }}>
                                          {isLowStock ? `Low (${matchingInv.stock} left)` : `OK (${matchingInv.stock} left)`}
                                        </span>
                                      ) : (
                                        <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>OK (Active)</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                      {isQuarantined ? (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                          🚫 BATCH QUARANTINE
                                        </span>
                                      ) : isLowStock ? (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: '600' }}>
                                          💡 Substitute with Calpol 650
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>
                                          ✓ Ready to Dispense
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* CLINICAL SAFETY AUDITOR */}
                        <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)', borderColor: 'rgba(6, 182, 212, 0.25)', background: 'rgba(6, 182, 212, 0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={14} /> HEALIX DRUG CONTRAINDICATION AUDITOR
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--accent-emerald)' }}>✓</span> Overlapping duplicates audited
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--accent-emerald)' }}>✓</span> Renal / liver safety thresholds matched
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--accent-emerald)' }}>✓</span> Patient age limits verified
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--accent-emerald)' }}>✓</span> No negative chemical drug interactions
                            </div>
                          </div>
                        </div>

                        {/* ACTION PANEL */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                          <button 
                            onClick={() => {
                              addNotification("Dosage Label Generated", `Print job dispatched successfully for Patient: ${activeOrder.patientName}. Label includes custom dosage instructions and an offline QR intake schema.`, "success");
                            }}
                            className="btn btn-glass" 
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', height: '40px' }}
                          >
                            🖨️ Print Custom QR Dosage Label
                          </button>

                          {activeOrder.status === 'Pending' ? (
                            <button 
                              disabled={activeOrder.medicines.split(', ').some(m => {
                                const b = inventoryList.find(i => m.toLowerCase().includes(i.name.toLowerCase()));
                                return b && quarantinedBatches.includes(b.batch);
                              })}
                              onClick={() => {
                                // Check total blocking quarantine again on click
                                const block = activeOrder.medicines.split(', ').some(m => {
                                  const b = inventoryList.find(i => m.toLowerCase().includes(i.name.toLowerCase()));
                                  return b && quarantinedBatches.includes(b.batch);
                                });
                                if(block && !isCrisisMode) {
                                  addNotification("Safety Blockade", "Dispense operation terminated. Contaminated batch found in basket.", "error");
                                  return;
                                }
                                
                                // Decrement from advanced inventoryList state safely
                                const medicinesToDispense = activeOrder.medicines.split(', ');
                                setInventoryList(prev => prev.map(inv => {
                                  const matchingDispense = medicinesToDispense.find(m => m.toLowerCase().includes(inv.name.toLowerCase()));
                                  if (matchingDispense) {
                                    const qtyMatch = matchingDispense.match(/x(\d+)/);
                                    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;
                                    return { ...inv, stock: Math.max(0, inv.stock - qty) };
                                  }
                                  return inv;
                                }));

                                setPharmacyOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, status: 'Dispensed' } : o));
                                handlePostCharge(activeOrder.uhid, `Rx Dispensed: Clinical Formula`, isCrisisMode ? 0 : 350, "Pharmacy_Desk");
                                addNotification("Meds Dispensed", isCrisisMode ? "EMERGENCY PROTOCOL: Bypassed financial verification." : `Prescription package for ${activeOrder.patientName} physically handed over. Stocks auto-decremented.`, "success");
                              }}
                              className="btn btn-emerald" 
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', height: '40px', padding: '0 20px',
                                opacity: activeOrder.medicines.split(', ').some(m => {
                                  const b = inventoryList.find(i => m.toLowerCase().includes(i.name.toLowerCase()));
                                  return b && quarantinedBatches.includes(b.batch);
                                }) ? 0.4 : 1
                              }}
                            >
                              {isCrisisMode ? "🚨 FORCED EMERGENCY DISPENSE" : "💊 Pre-pack & Dispense (Bill ₹350)"}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              ✓ Prescription Dispensed, Stocks Decremented & Billed
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '48px' }}>Please select an indent from the left queue to inspect.</p>
                    )}
                  </div>

                  </div>
                )}

                {pharmacySubTab === 'stock' && (
                  <div className="glass-panel animate-slide-up" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', margin: 0 }}>
                          📦 Central Pharmacy Stock Ledger & Procurement
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                          Monitor all active departmental stock levels, execute batch refills, and perform emergency item procurement.
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>LOW STOCK ITEMS</span>
                          <strong style={{ fontSize: '1.25rem', color: 'var(--accent-rose)' }}>{inventoryList.filter(i => i.stock <= i.minThreshold).length} CRITICAL</strong>
                        </div>
                      </div>
                    </div>

                    {/* DEDICATED WIDE SEARCH */}
                    <div style={{ position: 'relative' }}>
                      <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                      <input 
                        type="text" 
                        placeholder="Search medicine ledger by brand name, generic formulation, or batch..." 
                        value={pharmacyStockSearch}
                        onChange={(e) => setPharmacyStockSearch(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', height: '48px', fontSize: '1rem', paddingLeft: '48px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}
                      />
                    </div>

                    {/* REDESIGNED WIDE GRID SYSTEM FOR INVENTORY */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
                      {inventoryList.filter(inv => 
                        inv.name.toLowerCase().includes(pharmacyStockSearch.toLowerCase()) || 
                        inv.generic.toLowerCase().includes(pharmacyStockSearch.toLowerCase()) ||
                        inv.batch.toLowerCase().includes(pharmacyStockSearch.toLowerCase())
                      ).map(item => {
                        // Correct reference to `minThreshold` from state
                        const isLow = item.stock <= item.minThreshold;
                        const percentage = Math.min(100, (item.stock / (item.minThreshold * 2)) * 100);
                        
                        return (
                          <div 
                            key={item.id} 
                            className="glass-panel"
                            style={{ 
                              padding: '20px', 
                              borderRadius: 'var(--radius-md)', 
                              border: '1px solid var(--border-color)', 
                              background: isLow ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                              borderColor: isLow ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-color)',
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: '12px',
                              transition: 'transform 0.2s ease'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <span className="badge badge-glass" style={{ fontSize: '0.65rem', marginBottom: '6px', letterSpacing: '0.5px' }}>{item.type} • {item.batch}</span>
                                <strong style={{ fontSize: '1.1rem', display: 'block', letterSpacing: '-0.2px' }}>{item.name}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>{item.generic}</span>
                              </div>
                              {item.tempSensitive && (
                                <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '3px 6px' }}>❄️ {item.tempCelsius}°C</span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                              <span style={{ fontSize: '1.75rem', fontWeight: '700', color: isLow ? 'var(--accent-rose)' : 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{item.stock}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>in stock</span>
                            </div>

                            {/* VISUAL CAPACITY METER */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                <span style={{ color: isLow ? 'var(--accent-rose)' : 'var(--text-muted)', fontWeight: isLow ? '700' : '400' }}>
                                  {isLow ? '⚠️ BELOW MINIMUM' : 'Safe Volume'}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>Min: {item.minThreshold}</span>
                              </div>
                              <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.05)', overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    width: `${percentage}%`, 
                                    height: '100%', 
                                    background: isLow ? 'linear-gradient(90deg, #f43f5e, #ec4899)' : 'linear-gradient(90deg, #10b981, #34d399)',
                                    transition: 'width 0.4s ease'
                                  }} 
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                              <button 
                                onClick={() => {
                                  setInventoryList(prev => prev.map(inv => inv.id === item.id ? { ...inv, stock: inv.stock + 50 } : inv));
                                  addNotification("Procurement Successful", `Added 50 units to ${item.name} batch ledger.`, "success");
                                }}
                                className="btn btn-glass"
                                style={{ fontSize: '0.75rem', height: '36px', fontWeight: '700' }}
                              >
                                ➕ RESTOCK (+50)
                              </button>
                              <button 
                                onClick={() => {
                                  const isCurrentlyQuarantined = quarantinedBatches.includes(item.batch);
                                  if(isCurrentlyQuarantined) {
                                    setQuarantinedBatches(prev => prev.filter(b => b !== item.batch));
                                    addNotification("Lockdown Lifted", `Batch ${item.batch} unlocked globally.`, "info");
                                  } else {
                                    setQuarantinedBatches(prev => [...prev, item.batch]);
                                    addNotification("GLOBAL BATCH QUARANTINE", `Lockdown enacted on ${item.batch} instantly!`, "error");
                                  }
                                }}
                                className={`btn ${quarantinedBatches.includes(item.batch) ? 'btn-emerald' : 'btn-rose'}`}
                                style={{ fontSize: '0.75rem', height: '36px', fontWeight: '700' }}
                              >
                                ⚠️ {quarantinedBatches.includes(item.batch) ? "RELEASE LOCK" : "FREEZE BATCH"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ================= TAB CONTENT: EMERGENCY ROOM & TRIAGE ================= */}
          {activeTab === 'er' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* TRIAGE FORM */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
                  🚨 Trauma Triage & STAT Admission
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Register emergency arrivals. Assigning **Code Red** instantly sends high-priority requests to Lab (STAT labs), Pharmacy (emergency kits), and Radiology (fast-track FAST CT/USG scans) synchronously.
                </p>

                <form onSubmit={handleErAdmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Emergency Patient Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ramesh Nair" 
                      value={erPatientName}
                      onChange={(e) => setErPatientName(e.target.value)}
                      className="form-input" 
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Triage Priority Level</label>
                    <select 
                      value={triagePriority} 
                      onChange={(e) => setTriagePriority(e.target.value)}
                      className="form-select"
                    >
                      <option value="Red">🔴 Code Red (STAT Resuscitation)</option>
                      <option value="Yellow">🟡 Code Yellow (Urgent Evaluation)</option>
                      <option value="Green">🟢 Code Green (Minor/Ambulatory)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-cyan" style={{ height: '42px', padding: '0 24px' }}>
                    Admit to ER Bay
                  </button>
                </form>
              </div>

              {/* ER QUEUE */}
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>Active ER Triage Queue</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {erQueue.map(item => (
                    <div 
                      key={item.id} 
                      className="glass-panel animate-pulse-glow" 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '16px 20px', 
                        borderRadius: 'var(--radius-md)', 
                        borderColor: item.triagePriority === 'Red' ? 'rgba(244, 63, 94, 0.35)' : item.triagePriority === 'Yellow' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className={`badge ${item.triagePriority === 'Red' ? 'badge-rose animate-pulse' : item.triagePriority === 'Yellow' ? 'badge-amber' : 'badge-emerald'}`}>
                          {item.triagePriority === 'Red' ? 'STAT RED' : item.triagePriority === 'Yellow' ? 'URGENT' : 'STABLE'}
                        </span>
                        <div>
                          <strong style={{ fontSize: '0.95rem', display: 'block' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: <strong>{item.status}</strong> — Entered {item.timestamp}</span>
                        </div>
                      </div>
                      <span className="badge badge-glass" style={{ fontSize: '0.75rem' }}>{item.id}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB CONTENT: RADIOLOGY PACS TERMINAL ================= */}
          {activeTab === 'radiology' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
                  📡 Radiology & PACS Imaging Desk
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  PACS DICOM Imaging queue linked with doctor scans. Uploading reviewed scans auto-bills the service asynchronously.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {radiologyOrders.length === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No active radiological scans queued.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <th style={{ padding: '10px' }}>SCAN ID</th>
                          <th style={{ padding: '10px' }}>UHID / PATIENT NAME</th>
                          <th style={{ padding: '10px' }}>PROCEDURE TYPE</th>
                          <th style={{ padding: '10px' }}>TIMESTAMP</th>
                          <th style={{ padding: '10px' }}>STATUS</th>
                          <th style={{ padding: '10px', textAlign: 'right' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {radiologyOrders.map(order => (
                          <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                            <td style={{ padding: '12px 10px', fontWeight: '600' }}>{order.id}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', display: 'block' }}>{order.uhid}</span>
                              <strong>{order.patientName}</strong>
                            </td>
                            <td style={{ padding: '12px 10px' }}>
                              <span className="badge badge-purple">{order.scanType}</span>
                            </td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{order.timestamp}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <span className={`badge ${order.status === 'Completed' ? 'badge-emerald' : 'badge-amber'}`}>
                                {order.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                              {order.status === 'Pending' ? (
                                <button 
                                  onClick={() => {
                                    setRadiologyOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Completed' } : o));
                                    handlePostCharge(order.uhid, `PACS Computed Scan: ${order.scanType}`, 1500, "Radiology_PACS");
                                    addNotification("Scan Completed", `Diagnostic report for ${order.patientName} saved to PACS archive.`, "success");
                                  }}
                                  className="btn btn-emerald" 
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  Upload Reviewed Scan (Bill ₹1500)
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: '600' }}>✓ Logged to PACS</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB CONTENT: CENTRAL STOCK INVENTORY ================= */}
          {activeTab === 'inventory' && (() => {
            const lowStockCount = inventoryList.filter(item => item.stock <= item.minThreshold).length;
            const expiringSoonCount = inventoryList.filter(item => item.expiry.startsWith('2026')).length;
            
            // Filter list based on search and selected filter pills
            const filteredList = inventoryList.filter(item => {
              const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                                    item.generic.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                                    item.id.toLowerCase().includes(inventorySearch.toLowerCase());
              
              if (!matchesSearch) return false;
              
              if (inventoryFilter === 'low') {
                return item.stock <= item.minThreshold;
              }
              if (inventoryFilter === 'expiring') {
                return item.expiry.startsWith('2026');
              }
              if (inventoryFilter === 'cold') {
                return item.tempSensitive;
              }
              return true;
            });

            return (
              <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* MMS MULTI-MODULE SUB-TAB NAV */}
                <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <button 
                    onClick={() => setInventorySubTab('overview')} 
                    className={`badge ${inventorySubTab === 'overview' ? 'badge-cyan' : 'badge-glass'}`}
                    style={{ padding: '8px 16px', cursor: 'pointer', border: 'none', fontWeight: '700' }}
                  >
                    📦 Central Inventory Ledger
                  </button>
                  <button 
                    onClick={() => setInventorySubTab('suppliers')} 
                    className={`badge ${inventorySubTab === 'suppliers' ? 'badge-purple' : 'badge-glass'}`}
                    style={{ padding: '8px 16px', cursor: 'pointer', border: 'none', fontWeight: '700' }}
                  >
                    🤝 Supplier Ledger & B2B POs
                  </button>
                </div>

                {inventorySubTab === 'overview' ? (
                  <>
                {/* INVENTORY HEADER */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', margin: 0 }}>
                        🏥 Central Stock & Materials Management Suite (MMS)
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Track and manage pharmaceutical consumables, multi-batch expiry dates, cold-chain refrigeration networks, and automate B2B procurement pipelines.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => setIsAddingMedicine(!isAddingMedicine)} 
                        className="btn btn-emerald"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px', fontWeight: '700' }}
                      >
                        <Plus size={16} /> {isAddingMedicine ? "Close Form" : "Add Medicine Formula"}
                      </button>
                      <button 
                        onClick={() => {
                          setInventoryList(prev => prev.map(item => ({
                            ...item,
                            stock: Math.max(item.stock, item.minThreshold * 2 + 30)
                          })));
                          setInventoryStock({ paracetamolVials: 120, syringes: 450, sterileDressings: 85, bloodBags: 24, ctReagents: 40 });
                          addNotification("Inventory Replenished", "All clinical consumables and cold-chain stocks restored to maximum safe operational capacities.", "success");
                        }} 
                        className="btn btn-cyan"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', fontWeight: '700' }}
                      >
                        🔄 Global Bulk Restock All Consumables
                      </button>
                    </div>
                  </div>

                  {/* HIGH-END METRIC OVERLAY */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
                    
                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: 'var(--radius-md)' }}>
                      <div className="icon-container" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.25)' }}>
                        <Package style={{ color: 'var(--accent-cyan)' }} size={20} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Active Formulas</span>
                        <strong style={{ display: 'block', fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>{inventoryList.length} Unique</strong>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: 'var(--radius-md)', borderColor: lowStockCount > 0 ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-color)' }}>
                      <div className="icon-container" style={{ background: lowStockCount > 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderColor: lowStockCount > 0 ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)' }}>
                        <AlertTriangle style={{ color: lowStockCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }} size={20} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Low-Stock Triggers</span>
                        <strong style={{ display: 'block', fontSize: '1.5rem', fontWeight: '700', color: lowStockCount > 0 ? 'var(--accent-rose)' : 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                          {lowStockCount} Items Below Min
                        </strong>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: 'var(--radius-md)' }}>
                      <div className="icon-container" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                        <Activity style={{ color: 'var(--accent-emerald)' }} size={20} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Refrigeration Safety</span>
                        <strong style={{ display: 'block', fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>
                          🟢 3.8°C Safe Cold
                        </strong>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: 'var(--radius-md)', borderColor: expiringSoonCount > 0 ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)' }}>
                      <div className="icon-container" style={{ background: expiringSoonCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderColor: expiringSoonCount > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)' }}>
                        <Clock style={{ color: expiringSoonCount > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }} size={20} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Expiring &lt; 60 Days</span>
                        <strong style={{ display: 'block', fontSize: '1.5rem', fontWeight: '700', color: expiringSoonCount > 0 ? 'var(--accent-amber)' : 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                          {expiringSoonCount} Batches Flagged
                        </strong>
                      </div>
                    </div>

                  </div>
                </div>

                {/* SLIDING FORM: REGISTER NEW MEDICINE FORMULA */}
                {isAddingMedicine && (
                  <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16, 185, 129, 0.35)', background: 'rgba(16, 185, 129, 0.02)' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-emerald)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      💊 Register New Medicine Formula into Global Database
                    </h4>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newMedName || !newMedGeneric || !newMedBatch || !newMedLocation) {
                          addNotification("Validation Error", "Please fill in all formula parameters.", "error");
                          return;
                        }
                        
                        const nextId = `MED-0${inventoryList.length + 1}`;
                        const newMed = {
                          id: nextId,
                          name: newMedName,
                          generic: newMedGeneric,
                          type: newMedType,
                          batch: newMedBatch,
                          location: newMedLocation,
                          stock: parseInt(newMedStock),
                          minThreshold: parseInt(newMedThreshold),
                          expiry: newMedExpiry,
                          tempSensitive: newMedTempSensitive,
                          tempCelsius: newMedTempSensitive ? parseFloat(newMedTempCelsius) : undefined
                        };

                        setInventoryList(prev => [...prev, newMed]);
                        addNotification("Formula Registered", `Successfully registered ${newMedName} (${nextId}) with batch ${newMedBatch} at ${newMedLocation}.`, "success");
                        
                        // Clear inputs
                        setNewMedName('');
                        setNewMedGeneric('');
                        setNewMedBatch('');
                        setNewMedLocation('');
                        setIsAddingMedicine(false);
                      }}
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Medicine Brand Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Paracetamol 650mg" 
                          value={newMedName} 
                          onChange={(e) => setNewMedName(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Active Generic Composition</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Acetaminophen" 
                          value={newMedGeneric} 
                          onChange={(e) => setNewMedGeneric(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Dosage Form/Type</label>
                        <select 
                          value={newMedType} 
                          onChange={(e) => setNewMedType(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        >
                          <option value="Tablet">Tablet</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Vial">Vial / Injection</option>
                          <option value="Consumable">Consumable / Kit</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Manufacturer Batch ID</label>
                        <input 
                          type="text" 
                          placeholder="e.g. B-PARA901" 
                          value={newMedBatch} 
                          onChange={(e) => setNewMedBatch(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Warehouse Location (Aisle/Bin)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Aisle 1-B" 
                          value={newMedLocation} 
                          onChange={(e) => setNewMedLocation(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Expiry Date (YYYY-MM)</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 2027-12" 
                          value={newMedExpiry} 
                          onChange={(e) => setNewMedExpiry(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Initial Physical Stock Count</label>
                        <input 
                          type="number" 
                          value={newMedStock} 
                          onChange={(e) => setNewMedStock(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Min Threshold Alert Trigger</label>
                        <input 
                          type="number" 
                          value={newMedThreshold} 
                          onChange={(e) => setNewMedThreshold(e.target.value)}
                          className="form-control"
                          style={{ fontSize: '0.85rem', padding: '8px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            id="newMedTempSensitive" 
                            checked={newMedTempSensitive} 
                            onChange={(e) => setNewMedTempSensitive(e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          <label htmlFor="newMedTempSensitive" style={{ fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>Thermosensitive Cold-Chain Required</label>
                        </div>
                        {newMedTempSensitive && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Safety Limit:</span>
                            <input 
                              type="number" 
                              step="0.1" 
                              value={newMedTempCelsius} 
                              onChange={(e) => setNewMedTempCelsius(e.target.value)}
                              className="form-control" 
                              style={{ width: '80px', padding: '4px', fontSize: '0.8rem' }} 
                            />
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>°C</span>
                          </div>
                        )}
                      </div>

                      <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button 
                          type="submit" 
                          className="btn btn-emerald"
                          style={{ fontWeight: '700', padding: '10px 24px' }}
                        >
                          💾 Register & Commit Formula to Database
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* DETAILED LEDGER GRID & FILTER PANELS */}
                <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* REAL-TIME SEARCH & FILTER TOOLBAR */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                    
                    {/* SEARCH INPUT */}
                    <div style={{ position: 'relative', flex: '1' }}>
                      <input 
                        type="text" 
                        placeholder="🔍 Search medicine brand, active ingredients, or formula ID..." 
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', paddingLeft: '40px', height: '42px', fontSize: '0.85rem' }}
                      />
                    </div>

                    {/* FILTER PILLS */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => setInventoryFilter('all')} 
                        className={`badge ${inventoryFilter === 'all' ? 'badge-cyan' : 'badge-glass'}`}
                        style={{ cursor: 'pointer', padding: '8px 14px', border: 'none', fontSize: '0.75rem', fontWeight: '700' }}
                      >
                        All Formula Assets ({inventoryList.length})
                      </button>
                      <button 
                        onClick={() => setInventoryFilter('low')} 
                        className={`badge ${inventoryFilter === 'low' ? 'badge-rose animate-pulse-glow' : 'badge-glass'}`}
                        style={{ cursor: 'pointer', padding: '8px 14px', border: 'none', fontSize: '0.75rem', fontWeight: '700' }}
                      >
                        🔴 Low Stock Alerts ({inventoryList.filter(item => item.stock <= item.minThreshold).length})
                      </button>
                      <button 
                        onClick={() => setInventoryFilter('expiring')} 
                        className={`badge ${inventoryFilter === 'expiring' ? 'badge-amber animate-pulse-glow' : 'badge-glass'}`}
                        style={{ cursor: 'pointer', padding: '8px 14px', border: 'none', fontSize: '0.75rem', fontWeight: '700' }}
                      >
                        📅 Expiring &lt; 60d ({inventoryList.filter(item => item.expiry.startsWith('2026')).length})
                      </button>
                      <button 
                        onClick={() => setInventoryFilter('cold')} 
                        className={`badge ${inventoryFilter === 'cold' ? 'badge-emerald' : 'badge-glass'}`}
                        style={{ cursor: 'pointer', padding: '8px 14px', border: 'none', fontSize: '0.75rem', fontWeight: '700' }}
                      >
                        ❄️ Cold-Chain Only ({inventoryList.filter(item => item.tempSensitive).length})
                      </button>
                    </div>

                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: '0', fontFamily: 'var(--font-heading)' }}>
                    📦 Real-Time Asset & Formula Ledger
                  </h4>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <th style={{ padding: '10px' }}>FORMULA ID</th>
                        <th style={{ padding: '10px' }}>MEDICINE NAME & GENERIC FORMULATION</th>
                        <th style={{ padding: '10px' }}>BATCH ID</th>
                        <th style={{ padding: '10px' }}>WAREHOUSE LOCATION</th>
                        <th style={{ padding: '10px' }}>EXPIRY LOG</th>
                        <th style={{ padding: '10px' }}>STOCK QUANTITY & FILL RATIO</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No active formula matches found for search query or filter.
                          </td>
                        </tr>
                      ) : (
                        filteredList.map(item => {
                          const isLowStock = item.stock <= item.minThreshold;
                          const isExpiringSoon = item.expiry.startsWith('2026');
                          const fillPercent = Math.min(100, Math.round((item.stock / 200) * 100));
                          
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                              <td style={{ padding: '14px 10px', fontWeight: '600', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.id}</td>
                              <td style={{ padding: '14px 10px' }}>
                                <span className={`badge ${item.type === 'Tablet' ? 'badge-cyan' : item.type === 'Capsule' ? 'badge-purple' : item.type === 'Consumable' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem', marginBottom: '4px' }}>
                                  {item.type}
                                </span>
                                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{item.name}</strong>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{item.generic}</span>
                              </td>
                              <td style={{ padding: '14px 10px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{item.batch}</td>
                              <td style={{ padding: '14px 10px' }}>
                                <strong style={{ display: 'block', fontSize: '0.8rem' }}>{item.location}</strong>
                                {item.tempSensitive && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    ❄️ Cold Temp: <strong>{item.tempCelsius}°C</strong> (Live)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '14px 10px' }}>
                                <span className={`badge ${isExpiringSoon ? 'badge-amber animate-pulse-glow' : 'badge-glass'}`} style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                                  📅 {item.expiry} {isExpiringSoon && ' (Expiring Soon)'}
                                </span>
                              </td>
                              <td style={{ padding: '14px 10px', width: '260px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button 
                                      onClick={() => {
                                        setInventoryList(prev => prev.map(inv => inv.id === item.id ? { ...inv, stock: Math.max(0, inv.stock - 5) } : inv));
                                      }}
                                      className="badge badge-glass" 
                                      style={{ padding: '1px 6px', fontSize: '0.75rem', cursor: 'pointer', border: 'none' }}
                                    >
                                      -
                                    </button>
                                    <strong style={{ color: isLowStock ? 'var(--accent-rose)' : 'var(--accent-emerald)', minWidth: '60px', textAlign: 'center' }}>
                                      {item.stock} Units
                                    </strong>
                                    <button 
                                      onClick={() => {
                                        setInventoryList(prev => prev.map(inv => inv.id === item.id ? { ...inv, stock: inv.stock + 5 } : inv));
                                      }}
                                      className="badge badge-glass" 
                                      style={{ padding: '1px 6px', fontSize: '0.75rem', cursor: 'pointer', border: 'none' }}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setInventoryList(prev => prev.map(inv => inv.id === item.id ? { ...inv, stock: item.minThreshold } : inv));
                                      addNotification("Stock Reset", `Reset ${item.name} stock to minimum threshold (${item.minThreshold}).`, "info");
                                    }}
                                    style={{ background: 'transparent', border: 'none', fontSize: '0.65rem', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                                  >
                                    Reset to Min
                                  </button>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div 
                                    style={{ 
                                      width: `${fillPercent}%`, 
                                      height: '100%', 
                                      background: isLowStock ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                                      borderRadius: '3px',
                                      transition: 'width 0.4s ease'
                                    }} 
                                  />
                                </div>
                              </td>
                              <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <button 
                                    onClick={() => {
                                      setInventoryList(prev => prev.map(inv => inv.id === item.id ? { ...inv, stock: inv.stock + 100 } : inv));
                                      addNotification("B2B Invoice Generated", `Automated purchase order dispatched. Procured 100 units of ${item.name} Batch: ${item.batch}. Stock updated live.`, "success");
                                    }}
                                    className={`btn ${isLowStock ? 'btn-cyan animate-pulse-glow' : 'btn-glass'}`}
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: '700' }}
                                  >
                                    {isLowStock ? '⚡ Auto-Procure' : 'Procure 100'}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setInventoryList(prev => prev.filter(inv => inv.id !== item.id));
                                      addNotification("Formula Decommissioned", `Decommissioned and deleted formula ${item.name} (${item.id}) from registry.`, "warning");
                                    }}
                                    className="btn btn-rose"
                                    style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                    title="Decommission Batch"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                  </>
                ) : (
                  <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)', margin: 0 }}>
                          📑 Centralized Supplier Ledger (MMS)
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Audit external vendor networks, evaluate reliability scoring, and trigger digitized B2B purchase orders.</p>
                      </div>
                      <button onClick={() => addNotification("Form Opened", "Ready to onboarding new bulk medical distributor.", "info")} className="btn btn-purple" style={{ fontWeight: '700' }}>+ Register Vendor</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid var(--accent-emerald)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>Apollo Medical Wholesale Ltd.</strong>
                          <span className="badge badge-emerald">A+ RATED</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0' }}>Category: Major Pharmaceutics, Lifesaving Intravenous.</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem' }}>2 Open POs Pending</span>
                          <button onClick={() => addNotification("PO Placed", "Order #PO-882 dispatched to vendor gateway.", "success")} className="btn btn-glass" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Create Restock PO</button>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid var(--accent-cyan)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>Global Cold-Chain Biotech</strong>
                          <span className="badge badge-cyan">VACCINE SPL</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0' }}>Category: Insulins, Blood, Biological Agents.</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem' }}>1 Active Dispatch</span>
                          <button className="btn btn-glass" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>Create Restock PO</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* ================= TAB CONTENT: MARKETING & CRM HUB ================= */}
          {activeTab === 'marketing' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', background: 'radial-gradient(circle at top left, rgba(6, 182, 212, 0.05), transparent)' }}>
                
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)' }}>
                    <MessageSquare size={28} /> Healix Patient Engagement & CRM Hub
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Oversee global retention strategies, high-impact health camp broadcasts, and transactional patient notification channels.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                  
                  {/* CAMPAIGN CENTER */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.01)' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Smartphone size={18} className="text-cyan" /> Trigger Multi-Channel Patient Broadcast
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Draft notification logic targeting all registered active patient profiles via automated SMS engine.</p>
                      
                      <textarea 
                        placeholder="Write automated promotional or critical notification text..."
                        value={bulkSmsMsg}
                        onChange={(e) => setBulkSmsMsg(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', minHeight: '100px', padding: '12px', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: '#fff', marginBottom: '12px' }}
                      />

                      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <button onClick={() => setBulkSmsMsg("📢 Healix Alert: Specialized Cardiac Camp this Sunday. Avail free diagnostics checkups for you and family.")} className="badge badge-glass" style={{ border: 'none', cursor: 'pointer', padding: '6px 12px' }}>+ Load Health Camp Template</button>
                        <button onClick={() => setBulkSmsMsg("⚕️ Prescriptive Care: Hello, it seems your recurring medical stock may require replenishment. Tap to auto-order.")} className="badge badge-glass" style={{ border: 'none', cursor: 'pointer', padding: '6px 12px' }}>+ Load Pharmacy Refill Alert</button>
                      </div>

                      <button 
                        disabled={!bulkSmsMsg}
                        onClick={() => {
                          addNotification("Campaign Live", "Bulk SMS successfully dispatched to gateway queue.", "success");
                          setBulkSmsMsg('');
                        }}
                        className="btn btn-cyan" 
                        style={{ width: '100%', height: '44px', fontWeight: '700', opacity: bulkSmsMsg ? 1 : 0.5 }}
                      >
                        🚀 Launch Immediate Mass Broadcast
                      </button>
                    </div>
                  </div>

                  {/* LOYALTY & RETENTION */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '24px', background: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-purple)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Ticket size={18} /> Loyalty Program Controls
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Points per ₹100 Spend</span>
                          <strong style={{ color: 'var(--accent-purple)' }}>1.0 Pts</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Auto-Redemption Floor</span>
                          <strong style={{ color: 'var(--accent-purple)' }}>500 Pts</strong>
                        </div>
                        
                        <hr style={{ border: '0', borderTop: '1px solid rgba(139, 92, 246, 0.2)', margin: '8px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.8rem' }}>Silver Membership</strong>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>120 Members Enrolled</span>
                          </div>
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Active</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.8rem' }}>Platinum Tier</strong>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>14 Enterprise Accounts</span>
                          </div>
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Active</span>
                        </div>
                        
                        <button className="btn btn-glass" style={{ width: '100%', fontSize: '0.8rem', marginTop: '10px', borderColor: 'rgba(139, 92, 246, 0.3)' }}>Edit Global Policies</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ================= TAB CONTENT: UPGRADED CENTRAL BILLING & RCM ================= */}
          {activeTab === 'billing' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* REVENUE CYCLE MANAGEMENT NAV */}
              <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.01)' }}>
                <button 
                  onClick={() => setBillingSubTab('ledger')} 
                  className={`btn ${billingSubTab === 'ledger' ? 'btn-emerald' : 'btn-glass'}`} 
                  style={{ flex: 1, fontWeight: '700', fontSize: '0.8rem' }}
                >
                  📜 Immutable Ledger
                </button>
                <button 
                  onClick={() => setBillingSubTab('schemes')} 
                  className={`btn ${billingSubTab === 'schemes' ? 'btn-cyan' : 'btn-glass'}`} 
                  style={{ flex: 1, fontWeight: '700', fontSize: '0.8rem' }}
                >
                  🔖 Credit / Returns / Schemes
                </button>
                <button 
                  onClick={() => setBillingSubTab('finance')} 
                  className={`btn ${billingSubTab === 'finance' ? 'btn-rose' : 'btn-glass'}`} 
                  style={{ flex: 1, fontWeight: '700', fontSize: '0.8rem' }}
                >
                  🏛️ Institutional Finance & Tax
                </button>
              </div>

              {billingSubTab === 'ledger' && (
                <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck /> Institutional Unified Revenue Ledger
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Standard transactional source-of-truth. Every clinical charge mapped in absolute sequence.
                      </p>
                    </div>
                    <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>EOD Aggregation: </span>
                      <strong style={{ color: 'var(--accent-emerald)', fontSize: '1rem' }}>₹{totalRevenue.toLocaleString()}</strong>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <th style={{ padding: '12px 8px' }}>TRX ID</th>
                        <th style={{ padding: '12px 8px' }}>PATIENT DETAILS</th>
                        <th style={{ padding: '12px 8px' }}>INVOICE DESC</th>
                        <th style={{ padding: '12px 8px' }}>SOURCE DEP</th>
                        <th style={{ padding: '12px 8px', textAlign: 'right' }}>NET AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargeLog.slice().reverse().map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', fontSize: '0.85rem' }}>
                          <td style={{ padding: '14px 8px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.id}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <strong style={{ display: 'block' }}>{item.patientName}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.uhid}</span>
                          </td>
                          <td style={{ padding: '14px 8px' }}>{item.description}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <span className="badge badge-glass" style={{ fontSize: '0.65rem' }}>{item.user}</span>
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: '700', color: item.amount < 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                            ₹{item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {billingSubTab === 'schemes' && (
                <div className="animate-slide-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
                  {/* REFUNDS CONTROL */}
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-rose)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RotateCcw size={18} /> Execute Patient Refund / Return
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Issuing a validated return creates a contra-entry deduction in the immutable ledger instantly.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locate Open Ledger Account</label>
                      <select className="form-control" style={{ height: '42px', fontSize: '0.85rem' }}>
                        <option value="">Select Patient Ledger...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                      </select>

                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Refund Quantifiable Amount (₹)</label>
                      <input type="number" placeholder="e.g. 500" className="form-control" style={{ height: '42px', fontSize: '0.85rem' }} />

                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Return Authorization Reason</label>
                      <select className="form-control" style={{ height: '42px', fontSize: '0.85rem' }}>
                        <option>Unused Pharmacy Meds Return</option>
                        <option>Cancelled Diagnostic Procedure</option>
                        <option>Doctor Waiver/Discount</option>
                      </select>

                      <button 
                        onClick={() => addNotification("Refund Counter Entry Created", "Immutable credit note injected into master ledger.", "warning")}
                        className="btn btn-rose" 
                        style={{ marginTop: '12px', height: '42px', fontWeight: '700' }}
                      >
                        Post Credit Return Entry
                      </button>
                    </div>
                  </div>

                  {/* SCHEMES CONTROL */}
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '16px' }}>🔖 Active Subsidy & Insurance Schemes</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent-emerald)' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem', display: 'block' }}>ECHS Senior Citizens Scheme</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status: ACTIVE | Type: Flat 15% OP Waiver</span>
                        </div>
                        <div className="form-switch" style={{ background: 'var(--accent-emerald)', width: '32px', height: '16px', borderRadius: '8px' }}></div>
                      </div>
                      
                      <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent-cyan)' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem', display: 'block' }}>Star Health Insurance Direct TPA</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status: ACTIVE | Type: Credit Approved Direct</span>
                        </div>
                        <div className="form-switch" style={{ background: 'var(--accent-emerald)', width: '32px', height: '16px', borderRadius: '8px' }}></div>
                      </div>

                      <button className="btn btn-glass" style={{ marginTop: '8px', width: '100%' }}>+ Enroll New Corporate Discount Policy</button>
                    </div>
                  </div>
                </div>
              )}

              {billingSubTab === 'finance' && (
                <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-rose)', marginBottom: '8px' }}>🏛️ End of Period Institutional Closing</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Perform centralized GSTR calculation and trigger automatic department profit-share payouts.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
                    <div className="glass-panel" style={{ padding: '24px', background: 'rgba(255,255,255,0.01)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtotal Base Revenue</span>
                      <strong style={{ display: 'block', fontSize: '1.75rem', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>₹{(totalRevenue * 0.85).toLocaleString(undefined, {maximumFractionDigits:0})}</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '24px', background: 'rgba(244, 63, 94, 0.05)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Calculated Tax / GST Payable</span>
                      <strong style={{ display: 'block', fontSize: '1.75rem', marginTop: '4px', fontFamily: 'var(--font-heading)', color: 'var(--accent-rose)' }}>₹{(totalRevenue * 0.15).toLocaleString(undefined, {maximumFractionDigits:0})}</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.05)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Consultant Commission Pool</span>
                      <strong style={{ display: 'block', fontSize: '1.75rem', marginTop: '4px', fontFamily: 'var(--font-heading)', color: 'var(--accent-emerald)' }}>₹{(totalRevenue * 0.25).toLocaleString(undefined, {maximumFractionDigits:0})}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <button 
                      onClick={() => addNotification("Report Downloaded", "Detailed GSTR-1 Tax Reconciliation PDF is ready.", "success")}
                      className="btn btn-glass" 
                      style={{ flex: 1, height: '48px', fontWeight: '700' }}
                    >
                      💾 Export Tally / GSTR Report
                    </button>
                    <button className="btn btn-rose" style={{ flex: 1, height: '48px', fontWeight: '700' }}>
                      🔒 Freeze Account Ledger & Terminate Period
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ===================================================== */}
          {/* 🏥 DYNAMIC CONTENT INJECTION FOR EXPANDED SCENARIOS */}
          {/* ===================================================== */}
          
          {activeTab === 'opqueue' && (
            <OpdModule 
              opQueue={opQueue} setOpQueue={setOpQueue}
              tokenCounter={tokenCounter} setTokenCounter={setTokenCounter}
              opQueueSubTab={opQueueSubTab} setOpQueueSubTab={setOpQueueSubTab}
              selectedConsultToken={selectedConsultToken} setSelectedConsultToken={setSelectedConsultToken}
              consultChiefComplaint={consultChiefComplaint} setConsultChiefComplaint={setConsultChiefComplaint}
              consultDiagnosis={consultDiagnosis} setConsultDiagnosis={setConsultDiagnosis}
              consultNotes={consultNotes} setConsultNotes={setConsultNotes}
              consultOrderedServices={consultOrderedServices} setConsultOrderedServices={setConsultOrderedServices}
              consultPrescription={consultPrescription} setConsultPrescription={setConsultPrescription}
              addNotification={addNotification} handlePostCharge={handlePostCharge}
              setLabOrders={setLabOrders} setRadiologyOrders={setRadiologyOrders} setPharmacyOrders={setPharmacyOrders}
            />
          )}

          {activeTab === 'ipnew' && (
            <IpdModule 
              ipAdmissions={ipAdmissions} setIpAdmissions={setIpAdmissions}
              ipAdmSubTab={ipAdmSubTab} setIpAdmSubTab={setIpAdmSubTab}
              newAdmName={newAdmName} setNewAdmName={setNewAdmName}
              newAdmAge={newAdmAge} setNewAdmAge={setNewAdmAge}
              newAdmGender={newAdmGender} setNewAdmGender={setNewAdmGender}
              newAdmWard={newAdmWard} setNewAdmWard={setNewAdmWard}
              newAdmBed={newAdmBed} setNewAdmBed={setNewAdmBed}
              newAdmDoctor={newAdmDoctor} setNewAdmDoctor={setNewAdmDoctor}
              newAdmDiagnosis={newAdmDiagnosis} setNewAdmDiagnosis={setNewAdmDiagnosis}
              newAdmDeposit={newAdmDeposit} setNewAdmDeposit={setNewAdmDeposit}
              newAdmReferFrom={newAdmReferFrom} setNewAdmReferFrom={setNewAdmReferFrom}
              selectedAdmission={selectedAdmission} setSelectedAdmission={setSelectedAdmission}
              wardRoundNote={wardRoundNote} setWardRoundNote={setWardRoundNote}
              dischargeSummaryText={dischargeSummaryText} setDischargeSummaryText={setDischargeSummaryText}
              dischargeRx={dischargeRx} setDischargeRx={setDischargeRx}
              addNotification={addNotification} handlePostCharge={handlePostCharge}
              setPatients={setPatients}
            />
          )}

          {activeTab === 'ot' && (
            <OtModule 
              otSchedule={otSchedule} setOtSchedule={setOtSchedule}
              otSubTab={otSubTab} setOtSubTab={setOtSubTab}
              newOtPatient={newOtPatient} setNewOtPatient={setNewOtPatient}
              newOtSurgery={newOtSurgery} setNewOtSurgery={setNewOtSurgery}
              newOtSurgeon={newOtSurgeon} setNewOtSurgeon={setNewOtSurgeon}
              newOtDate={newOtDate} setNewOtDate={setNewOtDate}
              newOtTime={newOtTime} setNewOtTime={setNewOtTime}
              addNotification={addNotification}
            />
          )}

          {activeTab === 'insurance' && (
            <InsuranceModule 
              insuranceClaims={insuranceClaims} setInsuranceClaims={setInsuranceClaims}
              insSubTab={insSubTab} setInsSubTab={setInsSubTab}
              newClaimUhid={newClaimUhid} setNewClaimUhid={setNewClaimUhid}
              newClaimPatient={newClaimPatient} setNewClaimPatient={setNewClaimPatient}
              newClaimTpa={newClaimTpa} setNewClaimTpa={setNewClaimTpa}
              newClaimPolicy={newClaimPolicy} setNewClaimPolicy={setNewClaimPolicy}
              newClaimValidity={newClaimValidity} setNewClaimValidity={setNewClaimValidity}
              newClaimAmt={newClaimAmt} setNewClaimAmt={setNewClaimAmt}
              newClaimCopay={newClaimCopay} setNewClaimCopay={setNewClaimCopay}
              addNotification={addNotification}
            />
          )}

          {activeTab === 'packages' && (
            <HealthPackageModule 
              healthPackages={healthPackages}
              pkgBookings={pkgBookings} setPkgBookings={setPkgBookings}
              pkgSubTab={pkgSubTab} setPkgSubTab={setPkgSubTab}
              pkgPatientName={pkgPatientName} setPkgPatientName={setPkgPatientName}
              pkgPatientAge={pkgPatientAge} setPkgPatientAge={setPkgPatientAge}
              selectedPkg={selectedPkg} setSelectedPkg={setSelectedPkg}
              addNotification={addNotification} handlePostCharge={handlePostCharge}
            />
          )}

          {activeTab === 'referrals' && (
            <ReferralModule 
              referralSlips={referralSlips} setReferralSlips={setReferralSlips}
              refFromDept={refFromDept} setRefFromDept={setRefFromDept}
              refToDept={refToDept} setRefToDept={setRefToDept}
              refReason={refReason} setRefReason={setRefReason}
              refPatientUhid={refPatientUhid} setRefPatientUhid={setRefPatientUhid}
              refPatientName={refPatientName} setRefPatientName={setRefPatientName}
              addNotification={addNotification} handlePostCharge={handlePostCharge}
            />
          )}

          {activeTab === 'admin_hub' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <button onClick={() => setAdminSubTab('analytics')} className={`btn ${adminSubTab === 'analytics' ? 'btn-emerald' : 'btn-glass'}`}><TrendingUp size={16} /> Analytics Hub</button>
                <button onClick={() => setAdminSubTab('masters')} className={`btn ${adminSubTab === 'masters' ? 'btn-cyan' : 'btn-glass'}`}><Layers size={16} /> Masters Configuration</button>
                <button onClick={() => setAdminSubTab('discharge')} className={`btn ${adminSubTab === 'discharge' ? 'btn-blue' : 'btn-glass'}`}><ShieldCheck size={16} /> Discharge Clearance</button>
                <button onClick={() => setAdminSubTab('feedback')} className={`btn ${adminSubTab === 'feedback' ? 'btn-purple' : 'btn-glass'}`}><MessageSquare size={16} /> Patient Feedback</button>
                <button onClick={() => setAdminSubTab('compliance')} className={`btn ${adminSubTab === 'compliance' ? 'btn-rose' : 'btn-glass'}`}><ShieldAlert size={16} /> Audit Logs</button>
              </div>

              {adminSubTab === 'analytics' && (
                <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
                    📊 Consolidated Analytics Hub
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-secondary)' }}>Monthly Patient Progression (OP vs IP)</h4>
                      <div style={{ height: '240px', borderBottom: '2px solid var(--border-color)', borderLeft: '2px solid var(--border-color)', display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '0 20px' }}>
                        {[40, 60, 45, 80, 50, 90, 70].map((h, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', gap: '4px', height: '100%', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1, height: `${h}%`, background: 'var(--accent-cyan)', borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                            <div style={{ flex: 1, height: `${h * 0.4}%`, background: 'var(--accent-amber)', borderRadius: '4px 4px 0 0', opacity: 0.8 }}></div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: 'var(--accent-cyan)', borderRadius: '2px' }}></div> OP Consults</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: 'var(--accent-amber)', borderRadius: '2px' }}></div> IP Admissions</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Revenue Today</h4>
                        <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>₹{totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Appointments</h4>
                        <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-blue)', fontFamily: 'var(--font-heading)' }}>{patients.length}</p>
                      </div>
                      <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bed Occupancy</h4>
                        <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-purple)', fontFamily: 'var(--font-heading)' }}>34%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'masters' && (
                <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                    ⚙️ Masters Configuration
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Dynamically configure system dictionaries, templates, and billing schemas without engineering support.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {['Investigation Master', 'Doctor Master', 'Service Master', 'Billing Master', 'Casesheet Master', 'Template Master', 'Store Master', 'Ward Master'].map((master, i) => (
                      <div key={i} className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center', cursor: 'pointer', transition: '0.2s', border: '1px solid var(--border-color)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-cyan)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                        <Layers size={24} style={{ color: 'var(--accent-cyan)', margin: '0 auto 10px' }} />
                        <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{master}</h4>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '32px', padding: '20px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>Quick Edit: Casesheet/Prescription Master</h4>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">Template Name</label>
                        <input type="text" className="form-input" placeholder="e.g. Standard Cardiology Advice" />
                      </div>
                      <div style={{ flex: 2 }}>
                        <label className="form-label">Default Advice Details</label>
                        <input type="text" className="form-input" placeholder="Enter default notes..." />
                      </div>
                      <button className="btn btn-emerald" onClick={() => addNotification('Master Updated', 'Template master saved successfully.', 'success')}><Save size={16} /> Save</button>
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'discharge' && (
                <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'rgba(59, 130, 246, 0.02)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
                    🛏️ Manage Discharge & Clearance
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Multi-departmental checklist required before generating the final discharge summary and patient exit.</p>
                  
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Inpatients</h4>
                      {patients.filter(p => p.type === 'IP').map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => setActiveDischargePatient(p.id)}
                          style={{ padding: '12px', background: activeDischargePatient === p.id ? 'var(--accent-blue)' : 'var(--bg-secondary)', color: activeDischargePatient === p.id ? 'white' : 'var(--text-primary)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                        >
                          <span style={{ fontSize: '0.7rem', display: 'block', opacity: 0.8 }}>{p.id}</span>
                          <strong style={{ fontSize: '0.9rem' }}>{p.name}</strong>
                          <span style={{ fontSize: '0.7rem', display: 'block', marginTop: '4px' }}>{p.room}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="glass-panel" style={{ flex: 1, padding: '24px', borderRadius: 'var(--radius-md)' }}>
                      {(() => {
                        const activePatient = patients.find(p => p.id === activeDischargePatient);
                        if (!activePatient) return <p>Select a patient.</p>;
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                              <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{activePatient.name}</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{activePatient.id} • {activePatient.age} yrs • {activePatient.room} • {activePatient.doctor}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span className="badge badge-amber">{activePatient.status}</span>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Admitted: 2026-05-09</p>
                              </div>
                            </div>

                            <div>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '16px' }}>Departmental Clearance Status</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: `2px solid ${dischargeClearance.nursing ? 'var(--accent-emerald)' : 'var(--accent-rose)'}` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.85rem' }}>Nursing Desk</strong>
                                    <input type="checkbox" checked={dischargeClearance.nursing} onChange={(e) => setDischargeClearance({...dischargeClearance, nursing: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                                  </div>
                                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Vitals stopped, cannula removed.</p>
                                </div>
                                <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: `2px solid ${dischargeClearance.pharmacy ? 'var(--accent-emerald)' : 'var(--accent-rose)'}` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.85rem' }}>Pharmacy</strong>
                                    <input type="checkbox" checked={dischargeClearance.pharmacy} onChange={(e) => setDischargeClearance({...dischargeClearance, pharmacy: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                                  </div>
                                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Discharge meds dispensed & billed.</p>
                                </div>
                                <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: `2px solid ${dischargeClearance.billing ? 'var(--accent-emerald)' : 'var(--accent-rose)'}` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.85rem' }}>Billing Desk</strong>
                                    <input type="checkbox" checked={dischargeClearance.billing} onChange={(e) => setDischargeClearance({...dischargeClearance, billing: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                                  </div>
                                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Final settlement completed.</p>
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                              <button 
                                className={`btn ${dischargeClearance.nursing && dischargeClearance.pharmacy && dischargeClearance.billing ? 'btn-emerald' : 'btn-disabled'}`}
                                onClick={() => {
                                  if(dischargeClearance.nursing && dischargeClearance.pharmacy && dischargeClearance.billing) {
                                    setPatients(patients.map(p => p.id === activeDischargePatient ? {...p, status: 'Discharged'} : p));
                                    addNotification('Patient Discharged', `${activePatient.name} has been formally discharged.`, 'success');
                                    setDischargeClearance({ pharmacy: false, billing: false, nursing: false });
                                  }
                                }}
                              >
                                <CheckCircle size={16} /> Execute Final Discharge
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {adminSubTab === 'feedback' && (
                <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)' }}>
                    ⭐ Manage Patient Feedback
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Automated collection of patient satisfaction scores post-visit or post-discharge.</p>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                      <tr>
                        <th style={{ padding: '12px' }}>Patient Name</th>
                        <th style={{ padding: '12px' }}>Patient ID</th>
                        <th style={{ padding: '12px' }}>Mobile</th>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Rating</th>
                        <th style={{ padding: '12px' }}>Feedback Details</th>
                        <th style={{ padding: '12px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackList.map((fb, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: '600' }}>{fb.name}</td>
                          <td style={{ padding: '12px', color: 'var(--accent-cyan)' }}>{fb.patientId}</td>
                          <td style={{ padding: '12px' }}>{fb.mobile}</td>
                          <td style={{ padding: '12px' }}>{fb.date}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ color: fb.rating >= 4 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: '800', letterSpacing: '2px' }}>
                              {'★'.repeat(fb.rating)}{'☆'.repeat(5-fb.rating)}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)', maxWidth: '250px' }}>{fb.details}</td>
                          <td style={{ padding: '12px' }}><button className="btn btn-glass" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>View / Reply</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {adminSubTab === 'compliance' && (
                <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
                    🛡️ Effortless Compliance & Audit Logs
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Immutable activity logs ensuring regulatory compliance and accreditation standards.</p>
                  
                  <div style={{ background: '#1e293b', borderRadius: 'var(--radius-md)', padding: '4px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', color: '#e2e8f0' }}>
                      <thead style={{ background: '#0f172a' }}>
                        <tr>
                          <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>Log ID</th>
                          <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>Timestamp</th>
                          <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>User / Role</th>
                          <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>Category</th>
                          <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>Action Description</th>
                          <th style={{ padding: '12px', borderBottom: '1px solid #334155' }}>IP / Node</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '12px', color: '#94a3b8' }}>{log.id}</td>
                            <td style={{ padding: '12px', color: '#cbd5e1' }}>{log.time}</td>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#38bdf8' }}>{log.user}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.7rem' }}>{log.type}</span>
                            </td>
                            <td style={{ padding: '12px' }}>{log.action}</td>
                            <td style={{ padding: '12px', fontFamily: 'monospace', color: '#94a3b8' }}>{log.ip}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ============================================= */}
      {/* 🔥 EMERGENCY INTERCEPT OVERLAY (GLOBAL)        */}
      {/* ============================================= */}
      {activeEmergencyOverlay && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulseOpacity 1.5s infinite'
        }}>
          <div style={{
            width: '500px', padding: '40px', textAlign: 'center', borderRadius: '16px',
            background: activeEmergencyOverlay.type === 'CODE_BLUE' ? '#1e3a8a' : '#9f1239',
            border: '4px solid #fff', boxShadow: '0 0 100px rgba(255,0,0,0.5)'
          }}>
            <ShieldAlert size={64} color="#fff" style={{ marginBottom: '20px', display: 'inline-block' }} />
            <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '900', marginBottom: '10px' }}>
              {activeEmergencyOverlay.type === 'CODE_BLUE' ? "🚨 CODE BLUE" : "⚠️ STAT ALERT"}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: '600', marginBottom: '30px' }}>
              FROM: {activeEmergencyOverlay.sender}<br/>
              TARGET: {activeEmergencyOverlay.target}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
              <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '700', fontStyle: 'italic' }}>"{activeEmergencyOverlay.msg}"</p>
            </div>
            <button 
              onClick={() => setActiveEmergencyOverlay(null)}
              style={{ 
                background: '#fff', color: '#000', border: 'none', padding: '16px 40px',
                fontSize: '1.1rem', fontWeight: '800', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              ACKNOWLEDGE & RESPOND
            </button>
          </div>
          <style>{`
            @keyframes pulseOpacity {
              0% { background: rgba(159,18,57,0.4); }
              50% { background: rgba(159,18,57,0.7); }
              100% { background: rgba(159,18,57,0.4); }
            }
          `}</style>
        </div>
      )}

      {/* ============================================= */}
      {/* 📤 DISPATCH CREATOR MODAL                      */}
      {/* ============================================= */}
      {isDispatchModalOpen && (
        <div className="modal-overlay animate-fade-in" style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 
        }}>
          <div className="glass-panel animate-scale-up" style={{ width: '420px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="var(--accent-amber)" /> Inter-Dept Dispatch
              </h2>
              <button onClick={() => setIsDispatchModalOpen(false)} className="btn btn-glass" style={{ padding: '4px 8px' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>RECEIVING DEPARTMENT</label>
                <select id="dispatchTarget" className="form-control" style={{ width: '100%', background: '#111', color: '#fff', height: '40px' }}>
                  <option value="PHARMACY">Pharmacy Desk</option>
                  <option value="LAB">Laboratory Terminal</option>
                  <option value="RAD">Radiology PACS</option>
                  <option value="MMS">Central Supplies (MMS)</option>
                  <option value="ER">Emergency Room</option>
                  <option value="GLOBAL">Global Broadcast</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>PRIORITY CLASSIFICATION</label>
                <select id="dispatchPriority" className="form-control" style={{ width: '100%', background: '#111', color: '#fff', height: '40px' }}>
                  <option value="ROUTINE">Routine Operation</option>
                  <option value="STAT">⚠️ STAT (Immediate Action)</option>
                  <option value="CODE_BLUE">🚨 CODE BLUE (CRITICAL)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>DATA PAYLOAD / INSTRUCTION</label>
                <textarea id="dispatchMsg" rows={3} className="form-control" style={{ resize: 'none', width: '100%', padding: '10px', background: '#111', color: '#fff' }} placeholder="e.g. Patient ID 4512 requires STAT Blood Gas Kit..."></textarea>
              </div>
              <button 
                onClick={() => {
                  const t = document.getElementById('dispatchTarget').value;
                  const p = document.getElementById('dispatchPriority').value;
                  const m = document.getElementById('dispatchMsg').value;
                  if(!m) return;
                  sendDispatch(t, m, p);
                }}
                className="btn btn-emerald" style={{ height: '46px', fontWeight: '800', marginTop: '10px' }}>
                INITIATE TRANSMISSION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* 📥 GLOBAL INBOX DRAWER (NORMAL SCENARIOS)      */}
      {/* ============================================= */}
      {isInboxOpen && (
        <div 
          className="animate-slide-left"
          style={{
            position: 'fixed', top: '70px', right: '20px', width: '360px', bottom: '20px', zIndex: 8000,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(24px)',
            borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}
        >
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--accent-cyan)" /> Institutional Inbox
              </h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Routine & Stat event cascade</p>
            </div>
            <button onClick={() => setIsInboxOpen(false)} className="btn btn-glass" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dispatchQueue.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '40px' }}>Inbox is empty.</p>
            ) : (
              dispatchQueue.map((d) => (
                <div key={d.id} style={{ 
                  padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: `4px solid ${d.type === 'STAT' || d.type === 'CODE_BLUE' ? 'var(--accent-rose)' : 'var(--accent-cyan)'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div className="badge badge-glass" style={{ fontSize: '0.6rem', fontWeight: '700' }}>
                      {d.sender} ➡️ {d.target}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.time}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{d.msg}</p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: d.type === 'STAT' || d.type === 'CODE_BLUE' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      ● {d.type === 'ROUTINE' ? 'ROUTINE PAYLOAD' : 'PRIORITY ALERT'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
