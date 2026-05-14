import React, { useState, useEffect } from 'react';
import { Printer, MessageCircle, Save, X, CheckSquare, Search, FileText } from 'lucide-react';

export default function LisResultIssuing({
  labOrder = null,
  labOrders = [],
  addNotification,
  setLabOrders,
  setActiveIssuingOrder
}) {
  const [labNo, setLabNo] = useState('');
  const [name, setName] = useState('');
  const [ageGender, setAgeGender] = useState('');
  const [corporateName, setCorporateName] = useState('AHALIA AYURVEDA MEDICAL COLLEGE');
  const [refBy, setRefBy] = useState('KUNHAHAMAD C M');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [balance, setBalance] = useState('0');
  const [branch, setBranch] = useState('Ahalia Central Laboratory');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ipOp, setIpOp] = useState('');
  const [webCode, setWebCode] = useState('');
  const [emailedOn, setEmailedOn] = useState('');
  const [regDate, setRegDate] = useState('');
  const [rPromiseTime, setRPromiseTime] = useState('');
  const [compiledTime, setCompiledTime] = useState('');
  const [regBy, setRegBy] = useState('silsa');
  const [reportStatus, setReportStatus] = useState('Finished');

  const [tests, setTests] = useState([]);

  useEffect(() => {
    if (labOrder) {
      setLabNo(labOrder.id || '');
      setName(labOrder.patientName || '');
      setAgeGender(labOrder.age ? `${labOrder.age} Years / ${labOrder.gender || 'M'}` : '35 Years / M');
      setIpOp(labOrder.uhid || 'OP');
      setRegDate(labOrder.timestamp || new Date().toLocaleString());
      setCompiledTime(new Date().toLocaleString());
      
      if (labOrder.tests && labOrder.tests.length > 0) {
        const mappedTests = labOrder.tests.map((t, idx) => ({
          slNo: idx + 1,
          isIssued: true,
          testName: t.param,
          testType: t.isDerived ? 'Derived Parameter' : 'Analytic Result',
          print: true,
          printStatus: 'Approved',
          department: 'BIOCHEMISTRY',
          authUserInfo: 'MD_PATHOLOGIST',
          observedValue: t.result,
          unit: t.unit,
          refRange: `${t.min} - ${t.max}`,
          flag: t.flag,
          isAbnormal: !!t.flag
        }));
        setTests(mappedTests);
      } else {
        // Default mock parameters if tests array is missing
        setTests([
          { slNo: 1, isIssued: true, testName: labOrder.testName || 'General Wellness', testType: 'General Test', print: true, printStatus: 'Approved', department: 'PATHOLOGY', authUserInfo: 'MD_PATHOLOGIST', observedValue: 'Normal', unit: '', refRange: 'Stable', flag: '', isAbnormal: false }
        ]);
      }
    } else {
      // Clear fields for authentic blank layout
      setLabNo('');
      setName('');
      setAgeGender('');
      setIpOp('');
      setRegDate('');
      setCompiledTime('');
      setTests([]);
    }
  }, [labOrder]);

  const [reportingModes, setReportingModes] = useState({
    personally: true, whatsapp: false, email: false, sms: false, courier: false, telephone: false, selectAll: false, printWithLetterHead: false
  });

  const [regNote, setRegNote] = useState('');
  const [resultNote, setResultNote] = useState('');
  const [reportingModeNote, setReportingModeNote] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const toggleTestPrint = (slNo) => {
    setTests(tests.map(t => t.slNo === slNo ? { ...t, print: !t.print } : t));
  };

  const handleWhatsApp = () => {
    if (addNotification) addNotification("WhatsApp Dispatched", `Report PDF sent to ${name} via WhatsApp.`, "success");
  };

  const handlePrint = () => {
    if (addNotification) addNotification("Printing Report", `Sent ${tests.filter(t => t.print).length} tests to printer.`, "info");
    setTests(tests.map(t => t.print ? { ...t, printStatus: 'Printed' } : t));
    setShowPrintPreview(true);
  };

  const handleFinished = () => {
    if (setLabOrders && labOrder) {
      setLabOrders(prev => prev.map(o => o.id === labOrder.id ? { ...o, status: 'Issued' } : o));
      if (addNotification) addNotification("Report Issued", `Order ${labOrder.id} report issued successfully.`, "success");
      if (setActiveIssuingOrder) setActiveIssuingOrder(null);
    }
  };

  const handleExit = () => {
    if (setActiveIssuingOrder) setActiveIssuingOrder(null);
  };

  const handleNew = () => {
    if (setActiveIssuingOrder) setActiveIssuingOrder(null);
  };

  const handleBill = () => {
    if (!labOrder) return;
    if (addNotification) {
      addNotification("Billing Receipt Issued", `Patient payment cleared. Balance: INR 0.00`, "success");
    }
  };

  const handlePrevious = () => {
    const authOrders = labOrders.filter(o => o.status === 'Authorized');
    if (authOrders.length === 0) return;
    const currentIndex = authOrders.findIndex(o => o.id === labOrder?.id);
    if (currentIndex > 0) {
      setActiveIssuingOrder(authOrders[currentIndex - 1]);
    } else {
      setActiveIssuingOrder(authOrders[authOrders.length - 1]);
    }
  };

  const handleNext = () => {
    const authOrders = labOrders.filter(o => o.status === 'Authorized');
    if (authOrders.length === 0) return;
    const currentIndex = authOrders.findIndex(o => o.id === labOrder?.id);
    if (currentIndex !== -1 && currentIndex < authOrders.length - 1) {
      setActiveIssuingOrder(authOrders[currentIndex + 1]);
    } else {
      setActiveIssuingOrder(authOrders[0]);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const found = labOrders.find(o => o.id === labNo && o.status === 'Authorized');
      if (found) {
        setActiveIssuingOrder(found);
        if (addNotification) addNotification("Order Loaded", `Lab No ${labNo} successfully retrieved.`, "success");
      } else {
        const existing = labOrders.find(o => o.id === labNo);
        if (existing) {
          if (addNotification) addNotification("Access Restricted", `Order ${labNo} is at: '${existing.status}'. Wait for Pathologist authorization.`, "error");
        } else {
          if (addNotification) addNotification("Query Failed", `Lab No ${labNo} could not be located in local directory.`, "error");
        }
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '0', borderRadius: '4px', border: '1px solid #99aab5', background: '#f0f4f8', fontFamily: 'Arial, sans-serif', color: '#333' }}>
      
      {/* Header Bar */}
      <div style={{ background: '#2c3e50', color: 'white', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
          <FileText size={16} /> Result Issuing
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
          i-LISWARE 5.0 Interface Clone
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '12px' }}>
        
        {/* URL Bar Simulation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '60px' }}>Lab No</label>
          <input 
            type="text" 
            value={labNo} 
            onChange={(e) => setLabNo(e.target.value)} 
            onKeyDown={handleSearch}
            placeholder="Enter ID + Enter"
            style={{ padding: '4px', border: '1px solid #bdc3c7', width: '150px' }} 
          />
          <input type="text" readOnly value={`http://localhost:2002/TestPDFView/ResultPDF?lno=${labNo}`} style={{ padding: '4px', border: '1px solid #bdc3c7', flex: 1, background: '#e9ecef', color: '#666', fontSize: '0.75rem' }} />
          <button 
            onClick={handleFinished} 
            style={{ background: '#34495e', color: 'white', padding: '4px 20px', fontWeight: 'bold', fontSize: '0.9rem', border: 'none', cursor: 'pointer' }}
          >
            Result Issuing
          </button>
        </div>

        {/* Demographics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px', fontSize: '0.75rem' }}>
          
          {/* Column 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex' }}><span style={{ width: '100px' }}>Name</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
            <div style={{ display: 'flex' }}><span style={{ width: '100px' }}>Corporate Name</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={corporateName} onChange={e => setCorporateName(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', flex: 1 }}><span style={{ width: '100px' }}>Payment Status</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
              <div style={{ display: 'flex', width: '80px' }}><span style={{ marginRight: '4px' }}>Bal.</span><input type="text" value={balance} onChange={e => setBalance(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
            </div>
            <div style={{ display: 'flex' }}><span style={{ width: '100px' }}>Branch</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={branch} onChange={e => setBranch(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ display: 'flex', flex: 1 }}><span style={{ width: '100px' }}>Web Code</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={webCode} onChange={e => setWebCode(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
              <div style={{ display: 'flex', width: '120px' }}><span style={{ marginRight: '4px' }}>IP/OP</span><input type="text" value={ipOp} onChange={e => setIpOp(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
            </div>
          </div>

          {/* Column 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Age & Gender</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={ageGender} onChange={e => setAgeGender(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Ref. By</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={refBy} onChange={e => setRefBy(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Phone</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Email Id</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>Emailed On</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={emailedOn} onChange={e => setEmailedOn(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px', background: '#e9ecef' }} readOnly /></div>
          </div>

          {/* Column 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>Reg. Date</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={regDate} onChange={e => setRegDate(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px', background: '#e9ecef' }} readOnly /></div>
            <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>R. Promise Time</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={rPromiseTime} onChange={e => setRPromiseTime(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px', background: '#e9ecef' }} readOnly /></div>
            <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>Compiled Time</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={compiledTime} onChange={e => setCompiledTime(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px', background: '#e9ecef' }} readOnly /></div>
            <div style={{ display: 'flex' }}><span style={{ width: '90px' }}>Reg By</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={regBy} onChange={e => setRegBy(e.target.value)} style={{ flex: 1, border: '1px solid #bdc3c7', padding: '2px 4px', background: '#e9ecef' }} readOnly /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flex: 1 }}><span style={{ width: '90px' }}>Report Status</span><span style={{ margin: '0 4px' }}>:</span><input type="text" value={reportStatus} onChange={e => setReportStatus(e.target.value)} style={{ width: '80px', border: '1px solid #bdc3c7', padding: '2px 4px' }} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>Auth</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#e74c3c', fontWeight: 'bold' }}><input type="checkbox" checked readOnly /> 1st LEVEL</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#27ae60', fontWeight: 'bold' }}><input type="checkbox" checked readOnly /> 2nd LEVEL</label>
              </div>
            </div>
          </div>
        </div>

        {/* Tests Table */}
        <div style={{ border: '1px solid #bdc3c7', height: '200px', overflowY: 'auto', background: 'white', marginBottom: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead style={{ background: '#3498db', color: 'white', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '6px', borderRight: '1px solid #bdc3c7', width: '30px' }}>SlNo</th>
                <th style={{ padding: '6px', borderRight: '1px solid #bdc3c7', width: '60px' }}>Is Issued</th>
                <th style={{ padding: '6px', borderRight: '1px solid #bdc3c7', textAlign: 'left' }}>Test Name</th>
                <th style={{ padding: '6px', borderRight: '1px solid #bdc3c7', width: '100px' }}>Test Type</th>
                <th style={{ padding: '6px', borderRight: '1px solid #bdc3c7', width: '60px' }}>Print(Y/N)</th>
                <th style={{ padding: '6px', borderRight: '1px solid #bdc3c7', width: '80px' }}>Print Status</th>
                <th style={{ padding: '6px', borderRight: '1px solid #bdc3c7', width: '120px' }}>Department</th>
                <th style={{ padding: '6px', width: '150px' }}>Auth UserInfo</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee', background: index % 2 === 0 ? '#fdfdfd' : '#f4f6f7' }}>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #eee', textAlign: 'center' }}>{test.slNo}</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #eee', textAlign: 'center' }}><input type="checkbox" checked={test.isIssued} readOnly /></td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #eee' }}>{test.testName}</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #eee' }}>{test.testType}</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #eee', textAlign: 'center' }}><input type="checkbox" checked={test.print} onChange={() => toggleTestPrint(test.slNo)} /></td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #eee', textAlign: 'center', color: '#27ae60', fontWeight: 'bold' }}>{test.printStatus}</td>
                  <td style={{ padding: '4px 6px', borderRight: '1px solid #eee' }}>{test.department}</td>
                  <td style={{ padding: '4px 6px', fontSize: '0.7rem' }}>{test.authUserInfo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#ecf0f1', padding: '4px 8px', border: '1px solid #bdc3c7', borderBottom: 'none' }}>Registration Note</div>
            <textarea value={regNote} onChange={e => setRegNote(e.target.value)} style={{ width: '100%', height: '60px', border: '1px solid #bdc3c7', resize: 'none' }}></textarea>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#ecf0f1', padding: '4px 8px', border: '1px solid #bdc3c7', borderBottom: 'none' }}>Result Note</div>
            <textarea value={resultNote} onChange={e => setResultNote(e.target.value)} style={{ width: '100%', height: '60px', border: '1px solid #bdc3c7', resize: 'none' }}></textarea>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#ecf0f1', padding: '4px 8px', border: '1px solid #bdc3c7', borderBottom: 'none' }}>Reporting Mode</div>
            <div style={{ width: '100%', height: '60px', border: '1px solid #bdc3c7', background: 'white', position: 'relative' }}>
              <button 
                onClick={handleWhatsApp}
                style={{ position: 'absolute', bottom: '4px', right: '4px', background: '#25D366', color: 'white', border: 'none', padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '4px' }}
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold' }}>Reporting Mode</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#27ae60' }}><input type="checkbox" checked={reportingModes.personally} onChange={() => setReportingModes({...reportingModes, personally: !reportingModes.personally})} /> Personally</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#e74c3c' }}><input type="checkbox" checked={reportingModes.whatsapp} onChange={() => setReportingModes({...reportingModes, whatsapp: !reportingModes.whatsapp})} /> WhatsApp</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#8e44ad' }}><input type="checkbox" checked={reportingModes.email} onChange={() => setReportingModes({...reportingModes, email: !reportingModes.email})} /> Email</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#e67e22' }}><input type="checkbox" checked={reportingModes.sms} onChange={() => setReportingModes({...reportingModes, sms: !reportingModes.sms})} /> SMS</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#34495e' }}><input type="checkbox" checked={reportingModes.courier} onChange={() => setReportingModes({...reportingModes, courier: !reportingModes.courier})} /> Courier</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#c0392b' }}><input type="checkbox" checked={reportingModes.telephone} onChange={() => setReportingModes({...reportingModes, telephone: !reportingModes.telephone})} /> Telephone</label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={reportingModes.selectAll} onChange={() => setReportingModes({...reportingModes, selectAll: !reportingModes.selectAll})} /> Select All</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><input type="checkbox" checked={reportingModes.printWithLetterHead} onChange={() => setReportingModes({...reportingModes, printWithLetterHead: !reportingModes.printWithLetterHead})} /> Print With Letter Head</label>
            <div style={{ padding: '2px 8px', background: '#d1d8e0', border: '1px solid #bdc3c7' }}>Printed : 1</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>User</span>
            <input type="text" value="SHAHSEENA 27-04-2026 03:08 Work Satation:AOHLAB-BALAN" readOnly style={{ width: '400px', padding: '4px', border: 'none', background: 'transparent', fontSize: '0.8rem', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['New', 'Bill', 'Previous', 'Next', 'Print', 'Finished', 'Exit'].map(btn => (
              <button 
                key={btn}
                onClick={
                  btn === 'New' ? handleNew :
                  btn === 'Bill' ? handleBill :
                  btn === 'Previous' ? handlePrevious :
                  btn === 'Next' ? handleNext :
                  btn === 'Print' ? handlePrint : 
                  btn === 'Finished' ? handleFinished : 
                  btn === 'Exit' ? handleExit : undefined
                }
                style={{ 
                  background: 'linear-gradient(to bottom, #a0c4ff, #73a5ff)', 
                  border: '1px solid #5a8dec', 
                  color: 'white', 
                  padding: '6px 16px', 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  borderRadius: '2px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

      </div>

      {showPrintPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
          <div style={{ background: 'white', width: '210mm', height: '297mm', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Controls */}
            <div style={{ position: 'sticky', top: 0, background: '#f8f9fa', padding: '10px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}><Printer size={16} style={{ display: 'inline', marginRight: '8px' }}/> Print Preview (A4 Letterhead)</div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowPrintPreview(false)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Print</button>
                <button onClick={() => setShowPrintPreview(false)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>

            {/* A4 Content Area */}
            <div style={{ padding: '40px', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white', color: 'black' }}>
              
              {/* Header Letterhead */}
              <div style={{ borderBottom: '2px solid #2c3e50', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>AHALIA AYURVEDA MEDICAL COLLEGE</h1>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>Ahalia Health Heritage & Knowledge Village, Palakkad, Kerala - 678557</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>Ph: +91 4923 226666 | Email: info@ahalia.edu.in</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ margin: 0, color: '#e74c3c', fontSize: '18px' }}>LABORATORY REPORT</h2>
                </div>
              </div>

              {/* Patient Info Box */}
              <div style={{ border: '1px solid #34495e', padding: '12px', marginBottom: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div><strong style={{ width: '100px', display: 'inline-block' }}>Patient Name:</strong> {name}</div>
                <div><strong style={{ width: '100px', display: 'inline-block' }}>Lab Number:</strong> {labNo}</div>
                <div><strong style={{ width: '100px', display: 'inline-block' }}>Age / Gender:</strong> {ageGender}</div>
                <div><strong style={{ width: '100px', display: 'inline-block' }}>Reg Date:</strong> {regDate}</div>
                <div><strong style={{ width: '100px', display: 'inline-block' }}>Referred By:</strong> Dr. {refBy}</div>
                <div><strong style={{ width: '100px', display: 'inline-block' }}>Reported On:</strong> {compiledTime}</div>
              </div>

              {/* Tests Table */}
              <div style={{ flex: 1 }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', marginBottom: '16px', textDecoration: 'underline' }}>BIOCHEMISTRY & IMMUNOASSAY</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #bdc3c7', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Test Parameter</th>
                      <th style={{ padding: '8px' }}>Observed Value</th>
                      <th style={{ padding: '8px' }}>Unit</th>
                      <th style={{ padding: '8px' }}>Biological Ref. Interval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.filter(t => t.print).map((t, idx) => {
                      const result = t.observedValue || 'Normal';
                      const unit = t.unit || '';
                      const refRange = t.refRange || '-';
                      const isAbnormal = t.isAbnormal;
                      const flag = t.flag;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#2c3e50' }}>{t.testName}</td>
                          <td style={{ padding: '10px 8px', fontWeight: isAbnormal ? 'bold' : 'normal' }}>
                            {result} {isAbnormal && <span style={{ color: '#e74c3c', fontWeight: 'bold' }}> ({flag === 'CRITICAL' ? 'CRITICAL' : flag})</span>}
                          </td>
                          <td style={{ padding: '10px 8px', color: '#7f8c8d' }}>{unit}</td>
                          <td style={{ padding: '10px 8px' }}>{refRange}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bdc3c7', paddingTop: '20px', fontSize: '13px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '40px' }}>(Electronically Verified)</div>
                  <strong>SHAHSEENA</strong><br/>
                  Technologist
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '40px' }}>(Electronically Verified)</div>
                  <strong>Dr. PATHOLOGIST</strong><br/>
                  Consultant Pathologist<br/>
                  Reg No: TCMC 12345
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#95a5a6', marginTop: '20px' }}>
                *** End Of Report ***<br/>
                This is an electronically generated report. Signatures are digitally verified.
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
