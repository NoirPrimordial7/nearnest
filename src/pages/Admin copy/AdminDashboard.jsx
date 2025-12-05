import React, { useState } from "react";
import styles from "./AdminDashboard.module.css";

// Import existing features
import DocumentVerification from "./DocumentVerification";
// Import new SupportTickets feature
import SupportTickets from "./SupportTickets";

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState("overview");

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
  };

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <h2 className={styles.logo}>NearNest Admin</h2>
        <ul className={styles.menu}>
          <li
            className={activeMenu === "overview" ? styles.active : ""}
            onClick={() => handleMenuClick("overview")}
          >
            Overview
          </li>
          <li
            className={activeMenu === "businesses" ? styles.active : ""}
            onClick={() => handleMenuClick("businesses")}
          >
            Manage Businesses
          </li>
          <li
            className={activeMenu === "owners" ? styles.active : ""}
            onClick={() => handleMenuClick("owners")}
          >
            Manage Owners
          </li>
          <li
            className={
              activeMenu === "documentVerification" ? styles.active : ""
            }
            onClick={() => handleMenuClick("documentVerification")}
          >
            Document Verification
          </li>
          <li
            className={activeMenu === "supportTickets" ? styles.active : ""}
            onClick={() => handleMenuClick("supportTickets")}
          >
            Support / Tickets
          </li>
          <li
            className={activeMenu === "settings" ? styles.active : ""}
            onClick={() => handleMenuClick("settings")}
          >
            Settings
          </li>
          <li
            className={activeMenu === "notifications" ? styles.active : ""}
            onClick={() => handleMenuClick("notifications")}
          >
            Notifications
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className={styles.main}>
        {activeMenu === "overview" && (
          <div className={styles.content}>
            <h1>Overview</h1>
            <p>Welcome to the NearNest Admin Dashboard.</p>
          </div>
        )}

        {activeMenu === "businesses" && (
          <div className={styles.content}>
            <h1>Manage Businesses</h1>
            <p>Here you can view and manage all registered businesses.</p>
          </div>
        )}

        {activeMenu === "owners" && (
          <div className={styles.content}>
            <h1>Manage Owners</h1>
            <p>Here you can view and manage all shop owners.</p>
          </div>
        )}

        {activeMenu === "documentVerification" && (
          <div className={styles.content}>
            <DocumentVerification />
          </div>
        )}

        {activeMenu === "supportTickets" && (
          <div className={styles.content}>
            <SupportTickets />
          </div>
        )}

        {activeMenu === "settings" && (
          <div className={styles.content}>
            <h1>Settings</h1>
            <p>Configure platform settings here.</p>
          </div>
        )}

        {activeMenu === "notifications" && (
          <div className={styles.content}>
            <h1>Notifications</h1>
            <p>View all recent admin notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
