// src/components/Sidebar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Boxes, Tags, Users, BarChart2,
  Headphones, Settings, Database, Store, Megaphone
} from "lucide-react";
import "./Sidebar.module.css";

export default function Sidebar({ role = "platform", collapsed = false, onToggle = () => {} }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ========== Store Admin Menu ==========
  const STORE_ADMIN_MENU = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/store-admin/dashboard" },
    { label: "Inventory", icon: <Boxes size={18} />, path: "/store-admin/inventory" },
    { label: "Analytics / Reports", icon: <BarChart2 size={18} />, path: "/store-admin/analytics" },
    { label: "Advertisement", icon: <Megaphone size={18} />, path: "/store-admin/advertisement" },
    { label: "Store Profile / Settings", icon: <Settings size={18} />, path: "/store-admin/settings" },
    { label: "Support & Help", icon: <Headphones size={18} />, path: "/store-admin/support" },
  ];

  // ========== Platform Owner Menu ==========
  const PLATFORM_OWNER_MENU = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin/dashboard" },
    { label: "Store Management", icon: <Store size={18} />, path: "/admin/stores" },
    { label: "Document Verification", icon: <Database size={18} />, path: "/admin/verification" },
    { label: "Role & Permission", icon: <Users size={18} />, path: "/admin/roles" },
    { label: "Admin User Management", icon: <Users size={18} />, path: "/admin/admin-users" },
    { label: "Support / Tickets", icon: <Headphones size={18} />, path: "/admin/support" },
    { label: "Global Analytics / Reports", icon: <BarChart2 size={18} />, path: "/admin/analytics" },
    { label: "Settings", icon: <Settings size={18} />, path: "/admin/settings" },
    { label: "Shared Backend Schema", icon: <Database size={18} />, path: "/admin/backend-schema" },
  ];

  const menu = role === "store" ? STORE_ADMIN_MENU : PLATFORM_OWNER_MENU;

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top">
        <button className="menu-toggle-icon" onClick={onToggle} aria-label="Toggle sidebar" title="Toggle sidebar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18M3 12h18M3 18h18" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        {!collapsed && <h2 className="sidebar-logo">NearNest</h2>}
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menu.map(item => {
            const active = pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <li
                key={item.label}
                className={`nav-item ${active ? "active" : ""}`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <span className="icon">{item.icon}</span>
                {!collapsed && <span className="label">{item.label}</span>}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
