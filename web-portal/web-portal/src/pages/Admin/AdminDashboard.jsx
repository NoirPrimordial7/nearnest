// src/pages/Admin/AdminDashboard.jsx
import React, { useState } from "react";
import NavBar from "../../components/NavBar";
import Sidebar from "../../components/Sidebar";
import MainContent from "../../components/MainContent";
import "./Dashboard.module.css";

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("dashboard");

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
