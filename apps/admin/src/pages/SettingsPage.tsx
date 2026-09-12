import React, { useState } from 'react';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'notifications' | 'integrations' | 'security'>('general');
  const [settings, setSettings] = useState({
    general: {
      companyName: 'TrustLink Logistics',
      supportEmail: 'support@trustlink.com',
      supportPhone: '+234 800 123 4567',
      address: 'Plot 123, Ahmadu Bello Way, Abuja',
      timezone: 'Africa/Lagos',
      currency: 'NGN',
      language: 'en',
    },
    pricing: {
      baseFare: 500,
      perKmRate: 150,
      perKgRate: 100,
      minimumFare: 1000,
      weightTiers: [
        { maxWeight: 1, multiplier: 1.0 },
        { maxWeight: 5, multiplier: 1.5 },
        { maxWeight: 10, multiplier: 2.0 },
        { maxWeight: 25, multiplier: 3.0 },
        { maxWeight: 50, multiplier: 4.5 },
      ],
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      deliveryUpdates: true,
      paymentAlerts: true,
      riderAlerts: true,
      weeklyReports: true,
    },
    integrations: {
      paystack: { enabled: true, publicKey: 'pk_test_...', secretKey: 'sk_test_...' },
      flutterwave: { enabled: false, publicKey: '', secretKey: '' },
      googleMaps: { enabled: true, apiKey: 'AIza...' },
      termii: { enabled: true, apiKey: 'TL...', senderId: 'TrustLink' },
      verifyme: { enabled: true, apiKey: 'VM...' },
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireSpecialChars: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
    },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'pricing', label: 'Pricing', icon: 'dollar' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'integrations', label: 'Integrations', icon: 'plug' },
    { id: 'security', label: 'Security', icon: 'shield' },
  ];

  const handleSave = (section: string) => {
    console.log(`Saving ${section} settings:`, settings[section as keyof typeof settings]);
    alert(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!`);
  };

  const renderGeneral = () => (
    <div className="settings-section">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Company Information</h2>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" value={settings.general.companyName} onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, companyName: e.target.value } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Support Email</label>
              <input type="email" className="form-input" value={settings.general.supportEmail} onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, supportEmail: e.target.value } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Support Phone</label>
              <input type="tel" className="form-input" value={settings.general.supportPhone} onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, supportPhone: e.target.value } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-input" rows={3} value={settings.general.address} onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, address: e.target.value } }))} />
            </div>
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => handleSave('general')}>Save Changes</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <h2 className="card-title">Regional Settings</h2>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Timezone</label>
              <select className="form-select" value={settings.general.timezone} onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, timezone: e.target.value } }))}>
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-select" value={settings.general.currency} onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, currency: e.target.value } }))}>
                <option value="NGN">Nigerian Naira (₦)</option>
                <option value="USD">US Dollar ($)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-select" value={settings.general.language} onChange={e => setSettings(prev => ({ ...prev, general: { ...prev.general, language: e.target.value } }))}>
                <option value="en">English</option>
                <option value="ha">Hausa</option>
                <option value="yo">Yoruba</option>
                <option value="ig">Igbo</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => handleSave('general')}>Save Changes</button>
        </div>
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="settings-section">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Base Pricing</h2>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Base Fare (₦)</label>
              <input type="number" className="form-input" value={settings.pricing.baseFare} onChange={e => setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, baseFare: Number(e.target.value) } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Per KM Rate (₦)</label>
              <input type="number" className="form-input" value={settings.pricing.perKmRate} onChange={e => setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, perKmRate: Number(e.target.value) } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Per KG Rate (₦)</label>
              <input type="number" className="form-input" value={settings.pricing.perKgRate} onChange={e => setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, perKgRate: Number(e.target.value) } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Minimum Fare (₦)</label>
              <input type="number" className="form-input" value={settings.pricing.minimumFare} onChange={e => setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, minimumFare: Number(e.target.value) } }))} />
            </div>
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => handleSave('pricing')}>Save Changes</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <h2 className="card-title">Weight Tiers</h2>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Max Weight (kg)</th>
                  <th>Multiplier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {settings.pricing.weightTiers.map((tier, index) => (
                  <tr key={index}>
                    <td><input type="number" className="form-input" style={{ width: '100px' }} value={tier.maxWeight} onChange={e => { const newTiers = [...settings.pricing.weightTiers]; newTiers[index].maxWeight = Number(e.target.value); setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, weightTiers: newTiers } })); }} /></td>
                    <td><input type="number" step="0.1" className="form-input" style={{ width: '100px' }} value={tier.multiplier} onChange={e => { const newTiers = [...settings.pricing.weightTiers]; newTiers[index].multiplier = Number(e.target.value); setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, weightTiers: newTiers } })); }} /></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => { const newTiers = settings.pricing.weightTiers.filter((_, i) => i !== index); setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, weightTiers: newTiers } })); }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-outline" style={{ marginTop: 'var(--spacing-md)' }} onClick={() => { const newTiers = [...settings.pricing.weightTiers, { maxWeight: 100, multiplier: 5.0 }]; setSettings(prev => ({ ...prev, pricing: { ...prev.pricing, weightTiers: newTiers } })); }}>Add Tier</button>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => handleSave('pricing')}>Save Changes</button>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="settings-section">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Notification Channels</h2>
        </div>
        <div className="card-body">
          <div className="toggle-group">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <label key={key} className="toggle-label">
                <span className="toggle-text">
                  <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</strong>
                  <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', marginLeft: 'var(--spacing-sm)' }}>Enable {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                </span>
                <div className="toggle-switch">
                  <input type="checkbox" checked={value} onChange={e => setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: e.target.checked } }))} />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => handleSave('notifications')}>Save Changes</button>
        </div>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div className="settings-section">
      {Object.entries(settings.integrations).map(([key, config]) => (
        <div key={key} className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="card-header">
            <div className="integration-header">
              <div>
                <h2 className="card-title">{key.charAt(0).toUpperCase() + key.slice(1)}</h2>
                <span className={`badge ${config.enabled ? 'badge-success' : 'badge-gray'}`}>{config.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={config.enabled} onChange={e => {
                  const newConfig = { ...config, enabled: e.target.checked };
                  setSettings(prev => ({ ...prev, integrations: { ...prev.integrations, [key]: newConfig } }));
                }} />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div className="card-body" style={{ display: config.enabled ? 'block' : 'none' }}>
            <div className="form-grid">
              {Object.entries(config).filter(([k]) => k !== 'enabled').map(([field, value]) => (
                <div key={field} className="form-group">
                  <label className="form-label">{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                  <input type="password" className="form-input" value={String(value)} onChange={e => {
                  const newConfig = { ...config, [field]: e.target.value };
                  setSettings(prev => ({ ...prev, integrations: { ...prev.integrations, [key]: newConfig } }));
                }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSecurity = () => (
    <div className="settings-section">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Authentication</h2>
        </div>
        <div className="card-body">
          <div className="toggle-group">
            <label className="toggle-label">
              <span className="toggle-text">
                <strong>Two-Factor Authentication</strong>
                <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>Require 2FA for admin accounts</span>
              </span>
              <div className="toggle-switch">
                <input type="checkbox" checked={settings.security.twoFactorAuth} onChange={e => setSettings(prev => ({ ...prev, security: { ...prev.security, twoFactorAuth: e.target.checked } }))} />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => handleSave('security')}>Save Changes</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
        <div className="card-header">
          <h2 className="card-title">Session & Password Policy</h2>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Session Timeout (minutes)</label>
              <input type="number" className="form-input" value={settings.security.sessionTimeout} onChange={e => setSettings(prev => ({ ...prev, security: { ...prev.security, sessionTimeout: Number(e.target.value) } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Min Password Length</label>
              <input type="number" className="form-input" value={settings.security.passwordMinLength} onChange={e => setSettings(prev => ({ ...prev, security: { ...prev.security, passwordMinLength: Number(e.target.value) } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Login Attempts</label>
              <input type="number" className="form-input" value={settings.security.maxLoginAttempts} onChange={e => setSettings(prev => ({ ...prev, security: { ...prev.security, maxLoginAttempts: Number(e.target.value) } }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Lockout Duration (minutes)</label>
              <input type="number" className="form-input" value={settings.security.lockoutDuration} onChange={e => setSettings(prev => ({ ...prev, security: { ...prev.security, lockoutDuration: Number(e.target.value) } }))} />
            </div>
          </div>
          <div className="toggle-group" style={{ marginTop: 'var(--spacing-lg)' }}>
            <label className="toggle-label">
              <span className="toggle-text">
                <strong>Require Special Characters</strong>
                <span className="text-secondary" style={{ fontSize: 'var(--font-size-xs)' }}>Enforce special characters in passwords</span>
              </span>
              <div className="toggle-switch">
                <input type="checkbox" checked={settings.security.requireSpecialChars} onChange={e => setSettings(prev => ({ ...prev, security: { ...prev.security, requireSpecialChars: e.target.checked } }))} />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => handleSave('security')}>Save Changes</button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneral();
      case 'pricing': return renderPricing();
      case 'notifications': return renderNotifications();
      case 'integrations': return renderIntegrations();
      case 'security': return renderSecurity();
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your TrustLink Logistics platform</p>
      </div>

      <div className="settings-layout">
        <nav className="settings-sidebar">
          <ul>
            {tabs.map(tab => (
              <li key={tab.id}>
                <button
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <Icon name={tab.icon} />
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="settings-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
    plug: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.4 4.1a1 1 0 0 1 0 1.4l-5.4 5.4a4 4 0 0 0 0 5.6l5.4 5.4a1 1 0 0 1 0 1.4l-1.4 1.4a1 1 0 0 1-1.4 0l-5.4-5.4a4 4 0 0 0 0-5.6l5.4-5.4a1 1 0 0 1 0-1.4l1.4-1.4a1 1 0 0 1 1.4 0z"></path></svg>,
    shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  };
  return icons[name] || icons.settings;
}