import React from 'react';
import { TrendingUp, CheckCircle, Activity, Zap } from 'lucide-react';

export default function HealthPackageModule({
  healthPackages,
  pkgBookings,
  setPkgBookings,
  pkgSubTab,
  setPkgSubTab,
  pkgPatientName,
  setPkgPatientName,
  pkgPatientAge,
  setPkgPatientAge,
  selectedPkg,
  setSelectedPkg,
  addNotification,
  handlePostCharge
}) {

  const handleBookPackage = (e) => {
    e.preventDefault();
    const bookingId = 'PKG-BK-' + Math.floor(100 + Math.random() * 900);
    const pkg = healthPackages.find(p => p.pkgId === selectedPkg);
    
    const newBooking = {
      bookingId,
      patientName: pkgPatientName,
      pkgName: pkg.name,
      price: pkg.price,
      status: 'Booked',
      date: new Date().toLocaleDateString()
    };

    setPkgBookings(prev => [...prev, newBooking]);
    
    const tempUhid = 'UHID-' + Math.floor(1000 + Math.random() * 9000);
    handlePostCharge(tempUhid, `Health Package Booking: ${pkg.name}`, pkg.price, "Packages_Desk");
    
    addNotification("Package Booked", `${pkg.name} finalized for ${pkgPatientName}. Routing created.`, "success");
    
    setPkgPatientName('');
    setPkgPatientAge('');
    setPkgSubTab('active');
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '12px', display: 'flex', gap: '12px', borderRadius: 'var(--radius-md)' }}>
        <button onClick={() => setPkgSubTab('catalog')} className={`btn ${pkgSubTab === 'catalog' ? 'btn-cyan' : 'btn-glass'}`} style={{ flex: 1 }}>📦 Package Catalog</button>
        <button onClick={() => setPkgSubTab('active')} className={`btn ${pkgSubTab === 'active' ? 'btn-emerald' : 'btn-glass'}`} style={{ flex: 1 }}>✅ Booking Register ({pkgBookings.length})</button>
      </div>

      {pkgSubTab === 'catalog' && (
        <div className="animate-slide-up">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {healthPackages.map(pkg => (
              <div key={pkg.pkgId} className="glass-panel animate-hover" style={{ padding: '24px', display: 'flex', flexDirection: 'column', borderTop: pkg.pkgId === 'PKG-COMP' ? '4px solid var(--accent-purple)' : '1px solid var(--border-color)' }}>
                <h4 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '8px' }}>{pkg.name}</h4>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-cyan)', marginBottom: '16px' }}>₹{pkg.price}</div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  {pkg.tests.slice(0, 5).map((t, i) => (
                    <div key={i} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <CheckCircle size={12} color="var(--accent-emerald)"/> {t}
                    </div>
                  ))}
                  {pkg.tests.length > 5 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>+ {pkg.tests.length - 5} more parameters</span>}
                </div>

                <button 
                  onClick={() => { setSelectedPkg(pkg.pkgId); document.getElementById('book-form')?.scrollIntoView({ behavior: 'smooth'}); }}
                  className={`btn ${selectedPkg === pkg.pkgId ? 'btn-emerald' : 'btn-glass'}`}
                  style={{ width: '100%', fontWeight: '800' }}
                >
                  {selectedPkg === pkg.pkgId ? 'SELECTED' : 'CHOOSE'}
                </button>
              </div>
            ))}
          </div>

          <div id="book-form" className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent-cyan)' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>Enroll Patient in Selected Package</h3>
             <form onSubmit={handleBookPackage} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'flex-end' }}>
                <div>
                  <label className="form-label">Patient Name</label>
                  <input type="text" className="form-control" required value={pkgPatientName} onChange={e => setPkgPatientName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Age</label>
                  <input type="number" className="form-control" required value={pkgPatientAge} onChange={e => setPkgPatientAge(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-cyan" style={{ height: '42px', padding: '0 32px', fontWeight: '800' }}>
                  CONFIRM BOOKING
                </button>
             </form>
          </div>
        </div>
      )}

      {pkgSubTab === 'active' && (
        <div className="glass-panel animate-slide-up" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>Recent Package Sales Ledger</h3>
          {pkgBookings.length === 0 ? <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No recent package bookings found.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '12px' }}>BOOKING</th><th style={{ padding: '12px' }}>PATIENT</th><th style={{ padding: '12px' }}>PACKAGE</th><th style={{ padding: '12px' }}>AMT</th><th style={{ padding: '12px' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {pkgBookings.map(bk => (
                  <tr key={bk.bookingId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '12px' }}>{bk.bookingId}</td>
                    <td style={{ padding: '12px', fontWeight: '700' }}>{bk.patientName}</td>
                    <td style={{ padding: '12px' }}>{bk.pkgName}</td>
                    <td style={{ padding: '12px', fontWeight: '700', color: 'var(--accent-cyan)' }}>₹{bk.price}</td>
                    <td style={{ padding: '12px' }}><span className="badge badge-emerald">Booked</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
