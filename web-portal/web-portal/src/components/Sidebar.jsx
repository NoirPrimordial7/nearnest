import React, { useState } from "react";
import styles from "./Sidebar.module.css";

export default function Sidebar({ onLinkClick }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.toggleButton} onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? "►" : "◄"}
      </div>

      <ul className={styles.menu}>
        <li onClick={() => onLinkClick("dashboard")}>Dashboard</li>
        <li onClick={() => onLinkClick("store-management")}>Store Management</li>
        <li onClick={() => onLinkClick("document-verification")}>Document Verification</li>
        <li onClick={() => onLinkClick("role-permission")}>Role & Permission Management</li>
        <li onClick={() => onLinkClick("admin-user")}>Admin User Management</li>
        <li onClick={() => onLinkClick("support-tickets")}>Support/Tickets Panel</li>
        <li onClick={() => onLinkClick("analytics")}>Global Analytics / Reports</li>
        <li onClick={() => onLinkClick("audit-logs")}>Audit Logs / System Settings</li>
        <li onClick={() => onLinkClick("backend-schema")}>Shared Backend Schema</li>
      </ul>
    </div>
  );
}
