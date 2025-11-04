// src/pages/Admin/AdminDashboard.jsx
import React, { useState } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import MainContent from "../../components/MainContent";
import "./Dashboard.module.css";
import { useAuth } from "../../context/AuthContext.jsx";

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const { user, roles } = useAuth();
  return (
    <div className="dashboard-container">
      <NavBar />
      <div className="dashboard-body">
        <Sidebar onLinkClick={setActivePage} />
        <MainContent activePage={activePage} />
      </div>
    </div>
  );
}

