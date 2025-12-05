import React, { useState } from "react";
import { FaSearch, FaFilter, FaEye, FaCheck, FaTimes, FaFlag, FaArrowRight } from "react-icons/fa";
import styles from "./DocumentVerification.module.css";

export default function DocumentVerification() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState("owner");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const documents = [
    { id: 1, storeName: "Health Plus Pharma", ownerName: "Rahul Sharma", contact: "9876543210", email: "rahul@example.com", storeType: "Pharmacy", uploadDate: "2025-01-10", documentUrl: "https://via.placeholder.com/400", status: "Pending" },
    { id: 2, storeName: "CareMed Clinic", ownerName: "Priya Verma", contact: "9876501234", email: "priya@example.com", storeType: "Clinic + Medicals", uploadDate: "2025-01-15", documentUrl: "https://via.placeholder.com/400", status: "Accepted" },
    { id: 3, storeName: "MediQuick", ownerName: "Amit Joshi", contact: "9876549870", email: "amit@example.com", storeType: "Pharmacy", uploadDate: "2025-02-05", documentUrl: "https://via.placeholder.com/400", status: "Rejected" },
    { id: 4, storeName: "WellCare Pharmacy", ownerName: "Sneha Patil", contact: "9876504321", email: "sneha@example.com", storeType: "Pharmacy", uploadDate: "2025-02-18", documentUrl: "https://via.placeholder.com/400", status: "Pending" },
    { id: 5, storeName: "HealWell Pharma", ownerName: "Vikram Singh", contact: "9876512345", email: "vikram@example.com", storeType: "Ayurvedic Medicals", uploadDate: "2025-03-02", documentUrl: "https://via.placeholder.com/400", status: "Accepted" },
    { id: 6, storeName: "MediTrust", ownerName: "Anjali Rao", contact: "9876540001", email: "anjali@example.com", storeType: "Clinic + Medicals", uploadDate: "2025-03-20", documentUrl: "https://via.placeholder.com/400", status: "Flagged" },
    { id: 7, storeName: "LifeCare Pharmacy", ownerName: "Rohan Mehta", contact: "9876541111", email: "rohan@example.com", storeType: "Pharmacy", uploadDate: "2025-04-08", documentUrl: "https://via.placeholder.com/400", status: "Pending" },
    { id: 8, storeName: "PharmaHub", ownerName: "Kavita Desai", contact: "9876542222", email: "kavita@example.com", storeType: "Clinic + Medicals", uploadDate: "2025-04-25", documentUrl: "https://via.placeholder.com/400", status: "Accepted" },
    { id: 9, storeName: "QuickMeds", ownerName: "Saurabh Jain", contact: "9876543333", email: "saurabh@example.com", storeType: "Pharmacy", uploadDate: "2025-05-11", documentUrl: "https://via.placeholder.com/400", status: "Rejected" },
    { id: 10, storeName: "TotalCare Pharma", ownerName: "Neha Kapoor", contact: "9876544444", email: "neha@example.com", storeType: "Ayurvedic Medicals", uploadDate: "2025-05-30", documentUrl: "https://via.placeholder.com/400", status: "Pending" },
  ];

  const handleView = (doc) => {
    setSelectedDoc(doc);
    setActiveTab("owner");
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
    setSelectedDoc(null);
  };

  const handleAction = (docId, action) => {
    alert(`Document ${action} successfully!`);
  };

  const filteredDocs = documents.filter((doc) => {
    const month = new Date(doc.uploadDate).toLocaleString("default", { month: "short" });
    const matchesSearch =
      doc.storeName.toLowerCase().includes(search.toLowerCase()) ||
      doc.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      doc.status.toLowerCase().includes(search.toLowerCase()) ||
      doc.uploadDate.includes(search);
    const matchesStatus = statusFilter ? doc.status === statusFilter : true;
    const matchesMonth = monthFilter ? month === monthFilter : true;
    return matchesSearch && matchesStatus && matchesMonth;
  });

  return (
    <div className={styles.container}>
      <h2>Document Verification - Medicals</h2>

      {/* Search + Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by store, owner, status or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchBar}
          />
        </div>

        <div className={styles.filterWrapper}>
          <FaFilter className={styles.filterIcon} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Flagged">Flagged</option>
          </select>
        </div>

        <div className={styles.filterWrapper}>
          <FaFilter className={styles.filterIcon} />
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            <option value="">All Months</option>
            <option value="Jan">Jan</option>
            <option value="Feb">Feb</option>
            <option value="Mar">Mar</option>
            <option value="Apr">Apr</option>
            <option value="May">May</option>
            <option value="Jun">Jun</option>
            <option value="Jul">Jul</option>
            <option value="Aug">Aug</option>
            <option value="Sep">Sep</option>
            <option value="Oct">Oct</option>
            <option value="Nov">Nov</option>
            <option value="Dec">Dec</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Store Name</th>
            <th>Owner Name</th>
            <th>Store Type</th>
            <th>Upload Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDocs.length > 0 ? filteredDocs.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.storeName}</td>
              <td>{doc.ownerName}</td>
              <td>{doc.storeType}</td>
              <td>{doc.uploadDate}</td>
              <td>{doc.status}</td>
              <td className={styles.actionButtons}>
                <button className={styles.viewBtn} onClick={() => handleView(doc)} title="View Document"><FaEye /></button>
                <button className={styles.approveBtn} onClick={() => handleAction(doc.id, "Approved")} title="Approve"><FaCheck /></button>
                <button className={styles.rejectBtn} onClick={() => handleAction(doc.id, "Rejected")} title="Reject"><FaTimes /></button>
                <button className={styles.flagBtn} onClick={() => handleAction(doc.id, "Flagged")} title="Flag"><FaFlag /></button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="6" style={{ textAlign: "center" }}>No matching records found</td></tr>
          )}
        </tbody>
      </table>

      {/* Drawer */}
      <div className={`${styles.drawer} ${showDrawer ? styles.open : ""}`}>
        <div className={styles.drawerHeader}>
          <h3>Store Details</h3>
          <button className={styles.closeDrawerBtn} onClick={handleCloseDrawer}><FaArrowRight /></button>
        </div>
        {selectedDoc && (
          <>
            {/* Tabs */}
            <div className={styles.drawerTabs}>
              <button
                className={`${styles.tabBtn} ${activeTab === "owner" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("owner")}
              >
                Owner Info
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === "store" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("store")}
              >
                Store Info
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === "document" ? styles.activeTab : ""}`}
                onClick={() => setActiveTab("document")}
              >
                Document
              </button>
            </div>

            {/* Tab Content */}
            <div className={styles.tabContent}>
              {activeTab === "owner" && (
                <>
                  <p><strong>Name:</strong> {selectedDoc.ownerName}</p>
                  <p><strong>Contact:</strong> {selectedDoc.contact}</p>
                  <p><strong>Email:</strong> {selectedDoc.email}</p>
                  <div className={styles.actionButtonsDrawer}>
                    <button className={styles.approveBtnDrawer} onClick={() => handleAction(selectedDoc.id, "Approved")}><FaCheck /> Approve</button>
                    <button className={styles.rejectBtnDrawer} onClick={() => handleAction(selectedDoc.id, "Rejected")}><FaTimes /> Reject</button>
                  </div>
                </>
              )}
              {activeTab === "store" && (
                <>
                  <p><strong>Store Name:</strong> {selectedDoc.storeName}</p>
                  <p><strong>Address:</strong> 123 Medical Street</p>
                  <p><strong>City:</strong> Pune</p>
                  <p><strong>Pincode:</strong> 411001</p>
                  <p><strong>Category:</strong> {selectedDoc.storeType}</p>
                  <p><strong>GSTIN:</strong> 27ABCDE1234F1Z5</p>
                  <p><strong>Drug License:</strong> MED123456</p>
                  <p><strong>Operating Hours:</strong> 9:00 AM - 9:00 PM</p>
                  <div className={styles.actionButtonsDrawer}>
                    <button className={styles.approveBtnDrawer} onClick={() => handleAction(selectedDoc.id, "Approved")}><FaCheck /> Approve</button>
                    <button className={styles.rejectBtnDrawer} onClick={() => handleAction(selectedDoc.id, "Rejected")}><FaTimes /> Reject</button>
                  </div>
                </>
              )}
              {activeTab === "document" && (
                <>
                  <img src={selectedDoc.documentUrl} alt="Document" className={styles.drawerDoc} />
                  <div className={styles.actionButtonsDrawer}>
                    <button className={styles.approveBtnDrawer} onClick={() => handleAction(selectedDoc.id, "Approved")}><FaCheck /> Approve</button>
                    <button className={styles.rejectBtnDrawer} onClick={() => handleAction(selectedDoc.id, "Rejected")}><FaTimes /> Reject</button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {showDrawer && <div className={styles.overlay} onClick={handleCloseDrawer}></div>}
    </div>
  );
}
