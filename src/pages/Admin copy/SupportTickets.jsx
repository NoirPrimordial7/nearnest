import React, { useState, useRef } from "react";
import {
  FaSearch,
  FaPaperclip,
  FaReply,
  FaTimes,
  FaExchangeAlt,
  FaUserCircle,
  FaComments,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./SupportTickets.module.css";

export default function SupportTickets() {
  // ---------- sample tickets (type: 'user' | 'internal') ----------
  const initialTickets = [
    {
      id: "TCK-1001",
      type: "user",
      from: "Health Plus Pharma",
      submitter: "rahul@example.com",
      category: "Registration",
      priority: "High",
      assignedTo: "Unassigned",
      status: "Open",
      createdAt: "2025-10-01 10:12",
      thread: [
        { who: "owner", name: "Rahul Sharma", time: "2025-10-01 10:12", text: "I can't upload documents, keeps failing." },
        { who: "admin", name: "Support A", time: "2025-10-01 10:45", text: "We're checking — can you share a screenshot?" },
      ],
      notes: [{ by: "Support A", time: "2025-10-01 11:00", text: "Possible file size issue — ask owner to try jpg." }],
      attachments: [{ name: "error.png", url: "https://via.placeholder.com/300" }],
    },
    {
      id: "TCK-1002",
      type: "user",
      from: "CareMed Clinic",
      submitter: "priya@example.com",
      category: "Payments",
      priority: "Medium",
      assignedTo: "Support A",
      status: "In Progress",
      createdAt: "2025-10-02 09:30",
      thread: [{ who: "owner", name: "Priya Verma", time: "2025-10-02 09:30", text: "Payment not reflecting for boost plan." }],
      notes: [],
      attachments: [],
    },
    {
      id: "TCK-1003",
      type: "user",
      from: "MediQuick",
      submitter: "amit@example.com",
      category: "Account",
      priority: "Low",
      assignedTo: "Support B",
      status: "Resolved",
      createdAt: "2025-09-28 16:05",
      thread: [
        { who: "owner", name: "Amit Joshi", time: "2025-09-28 16:05", text: "Password reset not sending email." },
        { who: "admin", name: "Support B", time: "2025-09-28 16:45", text: "Fixed — email server misconfiguration corrected." },
      ],
      notes: [{ by: "Support B", time: "2025-09-28 16:50", text: "Resolved by restarting mail service." }],
      attachments: [],
    },
    {
      id: "ITK-2001",
      type: "internal",
      from: "System",
      submitter: "system@nearnest",
      category: "Database Alert",
      priority: "Critical",
      assignedTo: "DevOps",
      status: "Open",
      createdAt: "2025-10-03 02:20",
      thread: [{ who: "system", name: "System", time: "2025-10-03 02:20", text: "High DB CPU detected." }],
      notes: [],
      attachments: [],
    },
    {
      id: "ITK-2002",
      type: "internal",
      from: "Admin",
      submitter: "admin@nearnest",
      category: "UI Bug",
      priority: "Medium",
      assignedTo: "Frontend",
      status: "In Progress",
      createdAt: "2025-10-02 12:10",
      thread: [{ who: "admin", name: "Admin", time: "2025-10-02 12:10", text: "Header misalignment on mobile." }],
      notes: [{ by: "Admin", time: "2025-10-02 12:30", text: "Assigned to front-end team." }],
      attachments: [],
    },
    {
      id: "ITK-2002",
      type: "internal",
      from: "Support Team",
      submitter: "admin@nearnest",
      category: "Notifications Bug",
      priority: "low",
      assignedTo: "Frontend",
      status: "In Progress",
      createdAt: "2025-10-02 12:10",
      thread: [{ who: "admin", name: "Admin", time: "2025-10-02 12:10", text: "No notifications recived." }],
      notes: [{ by: "Admin", time: "2025-10-02 12:30", text: "Assigned to front-end team." }],
      attachments: [],
    },
    {
      id: "ITK-2002",
      type: "internal",
      from: "Support Team",
      submitter: "admin@nearnest",
      category: "Payment Bug",
      priority: "low",
      assignedTo: "Frontend",
      status: "In Progress",
      createdAt: "2025-10-02 12:10",
      thread: [{ who: "admin", name: "Admin", time: "2025-10-02 12:10", text: "Payment Bug." }],
      notes: [{ by: "Admin", time: "2025-10-02 12:30", text: "Assigned to front-end team." }],
      attachments: [],
    },
  ];

  const [tickets, setTickets] = useState(initialTickets);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("conversation");
  const [replyText, setReplyText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [activeTopTab, setActiveTopTab] = useState("dashboard"); // dashboard | userQueries | internalQueries
  const [selectedInternalTicketForNote, setSelectedInternalTicketForNote] = useState("");
  const fileInputRef = useRef(null);

  // ---------- derived analytics (small helpers for dashboard) ----------
  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const barData = [
    { name: "Open", count: statusCounts["Open"] || 0 },
    { name: "In Progress", count: statusCounts["In Progress"] || 0 },
    { name: "Resolved", count: statusCounts["Resolved"] || 0 },
    { name: "Escalated", count: statusCounts["Escalated"] || 0 },
  ];
  // tickets-by-day (simple createdAt day-of-week sample)
  const lineDataSample = [
    { day: "Mon", tickets: 5 },
    { day: "Tue", tickets: 7 },
    { day: "Wed", tickets: 4 },
    { day: "Thu", tickets: 9 },
    { day: "Fri", tickets: 6 },
  ];
  const pieData = (() => {
    const map = {};
    tickets.forEach((t) => (map[t.priority] = (map[t.priority] || 0) + 1));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();



  // ---------- filtering helpers ----------
  const matchesSearch = (t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.id.toLowerCase().includes(q) ||
      (t.from && t.from.toLowerCase().includes(q)) ||
      (t.submitter && t.submitter.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    );
  };

  const openTicketDrawer = (ticketId) => {
    const t = tickets.find((x) => x.id === ticketId);
    setSelectedTicket(t ? { ...t } : null);
    setDrawerTab("conversation");
    setReplyText("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedTicket(null);
  };

  // ---------- ticket operations (mock — update local state) ----------
  const updateTicket = (id, patchFn) => {
    setTickets((prev) => {
      const copy = prev.map((t) => {
        if (t.id !== id) return t;
        const clone = { ...t, thread: [...(t.thread || [])], notes: [...(t.notes || [])], attachments: [...(t.attachments || [])] };
        patchFn(clone);
        return clone;
      });
      // if the selectedTicket is open, keep it in sync
      if (selectedTicket && selectedTicket.id === id) {
        const updated = copy.find((c) => c.id === id);
        setSelectedTicket({ ...updated });
      }
      return copy;
    });
  };

  const handleReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    const now = new Date().toLocaleString();
    updateTicket(selectedTicket.id, (t) => t.thread.push({ who: "admin", name: "You", time: now, text: replyText }));
    setReplyText("");
    alert("Reply sent (mock).");
  };

  const handleCloseTicket = (id) => {
    updateTicket(id, (t) => (t.status = "Resolved"));
    if (selectedTicket && selectedTicket.id === id) closeDrawer();
    alert(`${id} marked Resolved (mock).`);
  };

  const handleReassign = (id) => {
    const assignee = prompt("Enter assignee name (mock):");
    if (assignee === null) return;
    updateTicket(id, (t) => (t.assignedTo = assignee || "Unassigned"));
    alert(`${id} reassigned to ${assignee || "Unassigned"} (mock).`);
  };

  const handleAddInternalNote = () => {
    if (!selectedInternalTicketForNote || !internalNote.trim()) {
      alert("Choose an internal ticket and write a note.");
      return;
    }
    const now = new Date().toLocaleString();
    updateTicket(selectedInternalTicketForNote, (t) => t.notes.push({ by: "You", time: now, text: internalNote }));
    setInternalNote("");
    alert("Internal note added (mock).");
  };

  const handleAttach = (e) => {
    if (!selectedTicket) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateTicket(selectedTicket.id, (t) => t.attachments.push({ name: file.name, url }));
    e.target.value = "";
    alert(`Attached ${file.name} (mock).`);
  };

  // ---------- filtered lists for tabs ----------
  const filteredUserTickets = tickets.filter((t) => t.type === "user" && (filterStatus ? t.status === filterStatus : true) && matchesSearch(t));
  const filteredInternalTickets = tickets.filter((t) => t.type === "internal" && (filterStatus ? t.status === filterStatus : true) && matchesSearch(t));

  return (
    <div className={styles.container}>
      {/* header row (search + chips) */}
      <div className={styles.headerRow}>
        <h2>Support / Tickets</h2>

        <div className={styles.headerActions}>
          <div className={styles.searchWrap}>
            <FaSearch className={styles.iconSmall} />
            <input
              placeholder="Search Ticket Id, Store, Submitter, Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.filterChips}>
            {["", "Open", "In Progress", "Resolved", "Escalated"].map((s) => (
              <button
                key={s || "all"}
                className={`${styles.chip} ${filterStatus === s ? styles.chipActive : ""}`}
                onClick={() => setFilterStatus(s)}
                title={s || "Show All"}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- TOP TABS (below search bar) ---------- */}
      <div className={styles.topTabs}>
        <button
          className={`${styles.topTabBtn} ${activeTopTab === "dashboard" ? styles.topTabActive : ""}`}
          onClick={() => setActiveTopTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`${styles.topTabBtn} ${activeTopTab === "userQueries" ? styles.topTabActive : ""}`}
          onClick={() => setActiveTopTab("userQueries")}
        >
          User Queries
        </button>
        <button
          className={`${styles.topTabBtn} ${activeTopTab === "internalQueries" ? styles.topTabActive : ""}`}
          onClick={() => setActiveTopTab("internalQueries")}
        >
          Internal Queries
        </button>
      </div>

      {/* ---------- TAB CONTENT ---------- */}
      <div className={styles.tabContent}>
        {/* DASHBOARD */}
        {activeTopTab === "dashboard" && (
          <div className={styles.dashboardGrid}>
            <div className={styles.chartCard}>
              <h4>Status Distribution</h4>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#4e73df" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
              <h4>Tickets Over Time</h4>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={lineDataSample}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tickets" stroke="#1cc88a" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
              <h4>Priority Breakdown</h4>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} fill="#e74a3b" label />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* USER QUERIES */}
        {activeTopTab === "userQueries" && (
          <div className={styles.tableWrap}>
            <h3 className={styles.sectionTitle}>User Queries</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>From</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUserTickets.length ? (
                  filteredUserTickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className={styles.ticketId}>{t.id}</div>
                        <div className={styles.createdAt}>{t.createdAt}</div>
                      </td>
                      <td>
                        <div className={styles.fromName}>{t.from}</div>
                        <div className={styles.submitter}>{t.submitter}</div>
                      </td>
                      <td>{t.category}</td>
                      <td>
                        <span className={`${styles.priority} ${styles["prio-" + (t.priority || "").replace(/\s/g, "").toLowerCase()]}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>{t.assignedTo}</td>
                      <td>
                        <span className={`${styles.status} ${styles["status-" + (t.status || "").replace(/\s/g, "").toLowerCase()]}`}>{t.status}</span>
                      </td>
                      <td className={styles.rowActions}>
                        <button className={styles.iconBtn} onClick={() => openTicketDrawer(t.id)} title="View Conversation"><FaComments /></button>
                        <button className={styles.smallBtn} onClick={() => handleReassign(t.id)}>Reassign</button>
                        <button className={styles.smallBtnOutline} onClick={() => handleCloseTicket(t.id)}>Close</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className={styles.noData}>No user queries found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* INTERNAL QUERIES */}
        {activeTopTab === "internalQueries" && (
          <div className={styles.tableWrap}>
            <h3 className={styles.sectionTitle}>Internal Queries</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>From</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInternalTickets.length ? (
                  filteredInternalTickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className={styles.ticketId}>{t.id}</div>
                        <div className={styles.createdAt}>{t.createdAt}</div>
                      </td>
                      <td>
                        <div className={styles.fromName}>{t.from}</div>
                        <div className={styles.submitter}>{t.submitter}</div>
                      </td>
                      <td>{t.category}</td>
                      <td>
                        <span className={`${styles.priority} ${styles["prio-" + (t.priority || "").replace(/\s/g, "").toLowerCase()]}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>{t.assignedTo}</td>
                      <td>
                        <span className={`${styles.status} ${styles["status-" + (t.status || "").replace(/\s/g, "").toLowerCase()]}`}>{t.status}</span>
                      </td>
                      <td className={styles.rowActions}>
                        <button className={styles.iconBtn} onClick={() => openTicketDrawer(t.id)} title="View Conversation"><FaComments /></button>
                        <button className={styles.smallBtn} onClick={() => handleReassign(t.id)}>Reassign</button>
                        <button className={styles.smallBtnOutline} onClick={() => handleCloseTicket(t.id)}>Close</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className={styles.noData}>No internal queries found</td></tr>
                )}
              </tbody>
            </table>

            {/* Add Internal Notes area */}
            <div className={styles.internalNoteWrap}>
              <label className={styles.label}>Select Internal Ticket</label>
              <select value={selectedInternalTicketForNote} onChange={(e) => setSelectedInternalTicketForNote(e.target.value)} className={styles.select}>
                <option value="">-- Select internal ticket --</option>
                {tickets.filter(t => t.type === "internal").map((t) => (
                  <option key={t.id} value={t.id}>{t.id} — {t.category}</option>
                ))}
              </select>

              <textarea placeholder="Write internal note..." className={styles.textarea} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />

              <div style={{ marginTop: 10 }}>
                <button className={styles.replyBtn} onClick={handleAddInternalNote}><FaReply /> Add Note</button>
                <button className={styles.smallBtnOutline} style={{ marginLeft: 10 }} onClick={() => { setInternalNote(""); setSelectedInternalTicketForNote(""); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------- DRAWER (used for viewing ticket conversation / notes / attachments) ---------- */}
      <div className={`${styles.drawer} ${drawerOpen ? styles.open : ""}`}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.ticketTopRow}>
              <div className={styles.ticketIdLarge}>{selectedTicket?.id}</div>
              <div className={styles.statusBadge}>
                <span className={`${styles.status} ${styles["status-" + (selectedTicket?.status || "").replace(/\s/g, "").toLowerCase()]}`}>{selectedTicket?.status}</span>
              </div>
            </div>
            <div className={styles.ticketMeta}>
              <div className={styles.metaItem}><FaUserCircle className={styles.iconUser} /> {selectedTicket?.from}</div>
              <div className={styles.metaItem}>Submitted: {selectedTicket?.createdAt}</div>
              <div className={styles.metaItem}>Category: {selectedTicket?.category}</div>
            </div>
          </div>

          <div className={styles.drawerControls}>
            <button className={styles.iconBtn} onClick={() => fileInputRef.current?.click()} title="Attach file"><FaPaperclip /></button>
            <input ref={fileInputRef} type="file" className={styles.hiddenFile} onChange={handleAttach} />
            <button className={styles.closeDrawer} onClick={closeDrawer}><FaTimes /></button>
          </div>
        </div>

        {/* Drawer tabs (conversation / notes / attachments) */}
        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${drawerTab === "conversation" ? styles.activeTab : ""}`} onClick={() => setDrawerTab("conversation")}>Conversation</button>
          <button className={`${styles.tabBtn} ${drawerTab === "notes" ? styles.activeTab : ""}`} onClick={() => setDrawerTab("notes")}>Internal Notes</button>
          <button className={`${styles.tabBtn} ${drawerTab === "attachments" ? styles.activeTab : ""}`} onClick={() => setDrawerTab("attachments")}>Attachments</button>
        </div>

        <div className={styles.tabContent}>
          {drawerTab === "conversation" && selectedTicket && (
            <>
              <div className={styles.thread}>
                {selectedTicket.thread.map((m, idx) => (
                  <div key={idx} className={`${styles.message} ${m.who === "admin" ? styles.msgAdmin : styles.msgOwner}`}>
                    <div className={styles.msgHeader}>
                      <strong>{m.name}</strong>
                      <span className={styles.msgTime}>{m.time}</span>
                    </div>
                    <div className={styles.msgBody}>{m.text}</div>
                  </div>
                ))}
              </div>

              <div className={styles.replyBox}>
                <textarea placeholder="Type your reply..." className={styles.textarea} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                <div className={styles.replyActions}>
                  <button className={styles.replyBtn} onClick={handleReply}><FaReply /> Reply</button>
                  <button className={styles.smallBtn} onClick={() => handleReassign(selectedTicket.id)}><FaExchangeAlt /> Reassign</button>
                  <button className={styles.smallBtnOutline} onClick={() => handleCloseTicket(selectedTicket.id)}><FaTimes /> Close</button>
                </div>
              </div>
            </>
          )}

          {drawerTab === "notes" && selectedTicket && (
            <>
              <div className={styles.notes}>
                {selectedTicket.notes.length ? selectedTicket.notes.map((n, i) => (
                  <div key={i} className={styles.note}>
                    <div className={styles.noteMeta}><strong>{n.by}</strong> • {n.time}</div>
                    <div className={styles.noteText}>{n.text}</div>
                  </div>
                )) : <div className={styles.noData}>No internal notes yet</div>}
              </div>

              <div className={styles.addNote}>
                <textarea placeholder="Add internal note..." className={styles.textarea} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button className={styles.replyBtn} onClick={() => {
                    if (!selectedTicket) return;
                    const now = new Date().toLocaleString();
                    updateTicket(selectedTicket.id, (t) => t.notes.push({ by: "You", time: now, text: internalNote }));
                    setInternalNote("");
                    alert("Internal note added (mock).");
                  }}><FaReply /> Add Note</button>
                  <button className={styles.smallBtnOutline} onClick={() => setInternalNote("")}>Cancel</button>
                </div>
              </div>
            </>
          )}

          {drawerTab === "attachments" && selectedTicket && (
            <div className={styles.attachments}>
              {selectedTicket.attachments.length ? selectedTicket.attachments.map((a, i) => (
                <div key={i} className={styles.attachmentCard}>
                  <img src={a.url} alt={a.name} />
                  <div className={styles.attachmentMeta}>
                    <div className={styles.attachmentName}>{a.name}</div>
                    <div>
                      <button className={styles.smallBtn} onClick={() => window.open(a.url, "_blank")}>View</button>
                    </div>
                  </div>
                </div>
              )) : <div className={styles.noData}>No attachments</div>}
            </div>
          )}
        </div>
      </div>

      {/* overlay */}
      {drawerOpen && <div className={styles.overlay} onClick={closeDrawer}></div>}
    </div>
  );
}
