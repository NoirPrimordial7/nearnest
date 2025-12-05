// src/pages/Admin/Settings.jsx
import React, { useState } from "react";
import "./Settings.css";

const Settings = () => {
  const [theme, setTheme] = useState("dark");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    alert("System Settings saved successfully!");
  };

  return (
    <div className="settings-page">
      <h1 className="settings-title">System Settings</h1>

      <div className="settings-grid">
        {/* General Settings */}
        <div className="settings-card">
          <h2>General</h2>
          <div className="settings-item">
            <label>Platform Name</label>
            <input type="text" placeholder="NearNest" />
          </div>

          <div className="settings-item">
            <label>Support Email</label>
            <input type="email" placeholder="support@nearnest.com" />
          </div>

          <div className="settings-item">
            <label>Default Language</label>
            <select>
              <option>English</option>
              <option>Hindi</option>
              <option>Marathi</option>
              <option>Spanish</option>
            </select>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="settings-card">
          <h2>Appearance</h2>
          <div className="settings-item">
            <label>Theme Mode</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="settings-item">
            <label>Accent Color</label>
            <input type="color" value="#4f46e5" />
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-card">
          <h2>Notifications</h2>

          <div className="settings-item">
            <label>Email Notifications</label>
            <div
              className={`toggle-switch ${emailNotifications ? "active" : ""}`}
              onClick={() => setEmailNotifications(!emailNotifications)}
            >
              <div className="toggle-thumb"></div>
            </div>
          </div>

          <div className="settings-item">
            <label>Push Notifications</label>
            <div
              className={`toggle-switch ${pushNotifications ? "active" : ""}`}
              onClick={() => setPushNotifications(!pushNotifications)}
            >
              <div className="toggle-thumb"></div>
            </div>
          </div>
        </div>

        {/* System Controls */}
        <div className="settings-card">
          <h2>System</h2>

          {/* Maintenance Mode Toggle */}
          <div className="settings-item">
            <label>Maintenance Mode</label>
            <div
              className={`toggle-switch ${maintenanceMode ? "active" : ""}`}
              onClick={() => setMaintenanceMode(!maintenanceMode)}
            >
              <div className="toggle-thumb"></div>
            </div>
          </div>

          <div className="settings-item">
            <label>Database Backup</label>
            <button className="backup-btn">Run Backup</button>
          </div>
        </div>
      </div>


      {/* Database Backup / Restore */}
<div className="settings-card">
  <h2>Database Backup & Restore</h2>
  <p>Manage database snapshots manually or schedule them.</p>
  <div className="btn-group">
    <button className="primary-btn" onClick={() => alert("📦 Database backup initiated successfully!")}>
      Backup Now
    </button>
    <button className="secondary-btn" onClick={() => alert("♻️ Database restoration started...")}>
      Restore Backup
    </button>
  </div>
</div>

{/* Version Info & System Health */}
<div className="settings-card">
  <h2>Version & System Health</h2>
  <div className="system-stats">
    <p><strong>Version:</strong> v2.3.1</p>
    <p><strong>Uptime:</strong> 0h 0m</p>
    <p><strong>CPU Usage:</strong> 27%</p>
    <p><strong>Memory Usage:</strong> 68%</p>
  </div>
</div>

{/* Send Announcement */}
<div className="settings-card wide-card">
  <h2>Send Announcement</h2>
  <p>Broadcast messages to users, store owners, or support teams.</p>
  <textarea
    className="announcement-input"
    rows="4"
    placeholder="Type your announcement message..."
  ></textarea>
  <div className="announcement-controls">
    <select className="audience-select">
      <option value="all">All Users</option>
      <option value="owners">Store Owners Only</option>
      <option value="support">Support Team Only</option>
    </select>
    <button className="primary-btn" onClick={() => alert("📢 Announcement sent!")}>
      Send
    </button>
  </div>
</div>


      <button className="save-btn" onClick={handleSave}>
        Save Settings
      </button>
    </div>
  );
};

export default Settings;
