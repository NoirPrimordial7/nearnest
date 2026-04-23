// src/pages/Admin/Support/SupportTickets.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaSearch, FaPaperclip, FaReply, FaTimes, FaExchangeAlt, FaUserCircle, FaComments } from "react-icons/fa";
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import styles from "./SupportTickets.module.css";
import {
  db, collection, getDocs, doc, getDoc, addDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp,
} from "../../Auth/firebase";
import { useAuth } from "../../Auth/AuthContext";

function tsToStr(ts) {
  if (!ts) return "—";
  let d;
  if (ts?.toMillis) d = new Date(ts.toMillis());
  else if (ts?.seconds) d = new Date(ts.seconds * 1000);
  else d = new Date(ts);
  if (isNaN(d)) return "—";
  return d.toLocaleString();
}

function normalizeTicket(docSnap) {
  const d = docSnap.data() || {};
  return {
    id: docSnap.id,
    displayId: d.ticketId || docSnap.id,
    type: d.type || "user",
    from: d.storeName || d.from || d.submitterName || "—",
    submitter: d.submitterEmail || d.email || "—",
    category: d.category || "General",
    priority: d.priority || "Medium",
    assignedTo: d.assignedTo || "Unassigned",
    status: d.status || "Open",
    createdAt: tsToStr(d.createdAt),
    createdAtRaw: d.createdAt,
    thread: Array.isArray(d.thread) ? d.thread : [],
    notes: Array.isArray(d.notes) ? d.notes : [],
    attachments: Array.isArray(d.attachments) ? d.attachments : [],
    storeId: d.storeId || null,
    subject: d.subject || d.message || "",
  };
}

export default function SupportTickets() {
  const { user } = useAuth() || {};
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState("conversation");
  const [replyText, setReplyText] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [activeTopTab, setActiveTopTab] = useState("dashboard");
  const [selectedInternalTicketForNote, setSelectedInternalTicketForNote] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "supportTickets"), orderBy("createdAt", "desc"), limit(200))
      );
      setTickets(snap.docs.map(normalizeTicket));
    } catch (err) {
      console.error("[SupportTickets] fetch error:", err);
      // If collection doesn't exist yet, just set empty
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Analytics derived from live data
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
  const pieData = (() => {
    const map = {};
    tickets.forEach((t) => (map[t.priority] = (map[t.priority] || 0) + 1));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  // Weekly ticket volume (last 7 days from data)
  const lineDataSample = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map = {};
    tickets.forEach(t => {
      if (t.createdAtRaw) {
        let d;
        if (t.createdAtRaw?.toMillis) d = new Date(t.createdAtRaw.toMillis());
        else if (t.createdAtRaw?.seconds) d = new Date(t.createdAtRaw.seconds * 1000);
        if (d) map[days[d.getDay()]] = (map[days[d.getDay()]] || 0) + 1;
      }
    });
    return days.map(day => ({ day, tickets: map[day] || 0 }));
  })();

  const matchesSearch = (t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.displayId.toLowerCase().includes(q) ||
      (t.from && t.from.toLowerCase().includes(q)) ||
      (t.submitter && t.submitter.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.subject && t.subject.toLowerCase().includes(q))
    );
  };

  const filteredUserTickets = tickets.filter(t =>
    t.type !== "internal" && (filterStatus ? t.status === filterStatus : true) && matchesSearch(t)
  );
  const filteredInternalTickets = tickets.filter(t =>
    t.type === "internal" && (filterStatus ? t.status === filterStatus : true) && matchesSearch(t)
  );

  const openTicketDrawer = (ticketId) => {
    const t = tickets.find(x => x.id === ticketId);
    setSelectedTicket(t ? { ...t } : null);
    setDrawerTab("conversation");
    setReplyText("");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedTicket(null);
  };

  const patchLocalTicket = (id, patchFn) => {
    setTickets(prev => {
      const copy = prev.map(t => {
        if (t.id !== id) return t;
        const clone = {
          ...t,
          thread: [...(t.thread || [])],
          notes: [...(t.notes || [])],
          attachments: [...(t.attachments || [])],
        };
        patchFn(clone);
        return clone;
      });
      if (selectedTicket?.id === id) {
        const updated = copy.find(c => c.id === id);
        setSelectedTicket({ ...updated });
      }
      return copy;
    });
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSaving(true);
    const msg = {
      who: "admin",
      name: user?.displayName || user?.email || "Admin",
      time: new Date().toLocaleString(),
      text: replyText,
    };
    const newThread = [...(selectedTicket.thread || []), msg];
    try {
      await updateDoc(doc(db, "supportTickets", selectedTicket.id), {
        thread: newThread,
        updatedAt: serverTimestamp(),
      });
      patchLocalTicket(selectedTicket.id, t => t.thread.push(msg));
      setReplyText("");
    } catch (err) {
      console.error("[SupportTickets] reply error:", err);
      alert("Failed to send reply. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseTicket = async (id) => {
    try {
      await updateDoc(doc(db, "supportTickets", id), {
        status: "Resolved",
        resolvedAt: serverTimestamp(),
      });
      patchLocalTicket(id, t => (t.status = "Resolved"));
      if (selectedTicket?.id === id) closeDrawer();
    } catch (err) {
      console.error("[SupportTickets] close ticket error:", err);
      alert("Failed to close ticket.");
    }
  };

  const handleReassign = async (id) => {
    const assignee = prompt("Enter assignee name:");
    if (assignee === null) return;
    try {
      await updateDoc(doc(db, "supportTickets", id), {
        assignedTo: assignee || "Unassigned",
        updatedAt: serverTimestamp(),
      });
      patchLocalTicket(id, t => (t.assignedTo = assignee || "Unassigned"));
    } catch (err) {
      console.error("[SupportTickets] reassign error:", err);
      alert("Failed to reassign.");
    }
  };

  const handleAddInternalNote = async (ticketId, noteText) => {
    const id = ticketId || selectedInternalTicketForNote;
    const text = noteText || internalNote;
    if (!id || !text.trim()) {
      alert("Choose a ticket and write a note.");
      return;
    }
    setSaving(true);
    const note = {
      by: user?.displayName || user?.email || "Admin",
      time: new Date().toLocaleString(),
      text,
    };
    try {
      const snap = await getDoc(doc(db, "supportTickets", id));
      const existing = snap.data()?.notes || [];
      await updateDoc(doc(db, "supportTickets", id), {
        notes: [...existing, note],
        updatedAt: serverTimestamp(),
      });
      patchLocalTicket(id, t => t.notes.push(note));
      setInternalNote("");
      setSelectedInternalTicketForNote("");
    } catch (err) {
      console.error("[SupportTickets] add note error:", err);
      alert("Failed to add note.");
    } finally {
      setSaving(false);
    }
  };

  const handleAttach = (e) => {
    if (!selectedTicket) return;
    const file = e.target.files?.[0];
    if (!file) return;
    // Attachment upload would require Firebase Storage; for now attach local preview
    const url = URL.createObjectURL(file);
    patchLocalTicket(selectedTicket.id, t => t.attachments.push({ name: file.name, url }));
    e.target.value = "";
    alert(`"${file.name}" attached locally. To persist, integrate Firebase Storage upload.`);
  };

  return (
    <div className={styles.container}>
      {/* Header row */}
      <div className={styles.headerRow}>
        <h2>Support / Tickets</h2>
        <div className={styles.headerActions}>
          <div className={styles.searchWrap}>
            <FaSearch className={styles.iconSmall} />
            <input
              placeholder="Search Ticket ID, Store, Category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.filterChips}>
            {["", "Open", "In Progress", "Resolved", "Escalated"].map(s => (
              <button key={s || "all"}
                className={`${styles.chip} ${filterStatus === s ? styles.chipActive : ""}`}
                onClick={() => setFilterStatus(s)}>
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top tabs */}
      <div className={styles.topTabs}>
        {["dashboard", "userQueries", "internalQueries"].map(tab => (
          <button key={tab}
            className={`${styles.topTabBtn} ${activeTopTab === tab ? styles.topTabActive : ""}`}
            onClick={() => setActiveTopTab(tab)}>
            {tab === "dashboard" ? "Dashboard" : tab === "userQueries" ? "User Queries" : "Internal Queries"}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {/* DASHBOARD TAB */}
        {activeTopTab === "dashboard" && (
          <div className={styles.dashboardGrid}>
            {loading ? (
              <div style={{ gridColumn: "1/-1", padding: 32, textAlign: "center", color: "#888" }}>
                Loading ticket analytics…
              </div>
            ) : (
              <>
                <div className={styles.chartCard}>
                  <h4>Tickets by Status</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData}>
                      <CartesianGrid vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4e73df" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={styles.chartCard}>
                  <h4>Weekly Volume (by day opened)</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={lineDataSample}>
                      <CartesianGrid vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="tickets" stroke="#1cc88a" strokeWidth={2.4}
                        dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className={styles.chartCard}>
                  <h4>Tickets by Priority</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        outerRadius={80} fill="#e74a3b" label />
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary cards */}
                <div className={styles.chartCard} style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                  {[
                    { label: "Total", count: tickets.length, color: "#4e73df" },
                    { label: "Open", count: statusCounts["Open"] || 0, color: "#e74a3b" },
                    { label: "In Progress", count: statusCounts["In Progress"] || 0, color: "#f6c23e" },
                    { label: "Resolved", count: statusCounts["Resolved"] || 0, color: "#1cc88a" },
                  ].map(({ label, count, color }) => (
                    <div key={label} style={{
                      flex: 1, minWidth: 80, padding: "12px 16px", background: color + "15",
                      borderRadius: 10, textAlign: "center"
                    }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* USER QUERIES */}
        {activeTopTab === "userQueries" && (
          <div className={styles.tableWrap}>
            <h3 className={styles.sectionTitle}>User Queries</h3>
            {loading ? <div className={styles.noData}>Loading…</div> : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ticket ID</th><th>From</th><th>Category</th>
                    <th>Priority</th><th>Assigned To</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserTickets.length ? (
                    filteredUserTickets.map(t => (
                      <tr key={t.id} className={styles.row} onClick={() => openTicketDrawer(t.id)}>
                        <td>
                          <div className={styles.ticketId}>{t.displayId}</div>
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
                          <span className={`${styles.status} ${styles["status-" + (t.status || "").replace(/\s/g, "").toLowerCase()]}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className={styles.rowActions} onClick={e => e.stopPropagation()}>
                          <button className={styles.iconBtn} onClick={() => openTicketDrawer(t.id)} title="View Conversation">
                            <FaComments />
                          </button>
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
            )}
          </div>
        )}

        {/* INTERNAL QUERIES */}
        {activeTopTab === "internalQueries" && (
          <div className={styles.tableWrap}>
            <h3 className={styles.sectionTitle}>Internal Queries</h3>
            {loading ? <div className={styles.noData}>Loading…</div> : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ticket ID</th><th>From</th><th>Category</th>
                    <th>Priority</th><th>Assigned To</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInternalTickets.length ? (
                    filteredInternalTickets.map(t => (
                      <tr key={t.id} className={styles.row} onClick={() => openTicketDrawer(t.id)}>
                        <td>
                          <div className={styles.ticketId}>{t.displayId}</div>
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
                          <span className={`${styles.status} ${styles["status-" + (t.status || "").replace(/\s/g, "").toLowerCase()]}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className={styles.rowActions} onClick={e => e.stopPropagation()}>
                          <button className={styles.iconBtn} onClick={() => openTicketDrawer(t.id)} title="View Conversation">
                            <FaComments />
                          </button>
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
            )}

            {/* Add Internal Note section */}
            <div className={styles.internalNoteWrap}>
              <label className={styles.label}>Select Internal Ticket</label>
              <select value={selectedInternalTicketForNote}
                onChange={e => setSelectedInternalTicketForNote(e.target.value)}
                className={styles.select}>
                <option value="">-- Select internal ticket --</option>
                {tickets.filter(t => t.type === "internal").map(t => (
                  <option key={t.id} value={t.id}>{t.displayId} — {t.category}</option>
                ))}
              </select>
              <textarea placeholder="Write internal note..." className={styles.textarea}
                value={internalNote} onChange={e => setInternalNote(e.target.value)} />
              <div style={{ marginTop: 10 }}>
                <button className={styles.replyBtn} disabled={saving}
                  onClick={() => handleAddInternalNote(selectedInternalTicketForNote, internalNote)}>
                  <FaReply /> {saving ? "Saving…" : "Add Note"}
                </button>
                <button className={styles.smallBtnOutline} style={{ marginLeft: 10 }}
                  onClick={() => { setInternalNote(""); setSelectedInternalTicketForNote(""); }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DRAWER */}
      <div className={`${styles.drawer} ${drawerOpen ? styles.open : ""}`}>
        <div className={styles.drawerHeader}>
          <div>
            <div className={styles.ticketTopRow}>
              <div className={styles.ticketIdLarge}>{selectedTicket?.displayId}</div>
              <span className={`${styles.status} ${styles["status-" + (selectedTicket?.status || "").replace(/\s/g, "").toLowerCase()]}`}>
                {selectedTicket?.status}
              </span>
            </div>
            <div className={styles.ticketMeta}>
              <div className={styles.metaItem}><FaUserCircle className={styles.iconUser} /> {selectedTicket?.from}</div>
              <div className={styles.metaItem}>Submitted: {selectedTicket?.createdAt}</div>
              <div className={styles.metaItem}>Category: {selectedTicket?.category}</div>
              {selectedTicket?.subject && (
                <div className={styles.metaItem} style={{ fontStyle: "italic" }}>{selectedTicket.subject}</div>
              )}
            </div>
          </div>
          <div className={styles.drawerControls}>
            <button className={styles.iconBtn} onClick={() => fileInputRef.current?.click()} title="Attach file">
              <FaPaperclip />
            </button>
            <input ref={fileInputRef} type="file" className={styles.hiddenFile} onChange={handleAttach} />
            <button className={styles.closeDrawer} onClick={closeDrawer}><FaTimes /></button>
          </div>
        </div>

        <div className={styles.tabs}>
          {["conversation", "notes", "attachments"].map(tab => (
            <button key={tab}
              className={`${styles.tabBtn} ${drawerTab === tab ? styles.activeTab : ""}`}
              onClick={() => setDrawerTab(tab)}>
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.tabContent}>
          {drawerTab === "conversation" && selectedTicket && (
            <>
              <div className={styles.thread}>
                {selectedTicket.thread.length > 0 ? selectedTicket.thread.map((m, idx) => (
                  <div key={idx} className={`${styles.message} ${m.who === "admin" ? styles.msgAdmin : styles.msgOwner}`}>
                    <div className={styles.msgHeader}>
                      <strong>{m.name}</strong>
                      <span className={styles.msgTime}>{m.time}</span>
                    </div>
                    <div className={styles.msgBody}>{m.text}</div>
                  </div>
                )) : (
                  <div className={styles.noData}>No messages yet.</div>
                )}
              </div>
              <div className={styles.replyBox}>
                <textarea placeholder="Type your reply..." className={styles.textarea}
                  value={replyText} onChange={e => setReplyText(e.target.value)} />
                <div className={styles.replyActions}>
                  <button className={styles.replyBtn} onClick={handleReply} disabled={saving}>
                    <FaReply /> {saving ? "Sending…" : "Reply"}
                  </button>
                  <button className={styles.smallBtn} onClick={() => handleReassign(selectedTicket.id)}>
                    <FaExchangeAlt /> Reassign
                  </button>
                  <button className={styles.smallBtnOutline} onClick={() => handleCloseTicket(selectedTicket.id)}>
                    <FaTimes /> Close
                  </button>
                </div>
              </div>
            </>
          )}

          {drawerTab === "notes" && selectedTicket && (
            <>
              <div className={styles.notes}>
                {selectedTicket.notes.length > 0 ? selectedTicket.notes.map((n, i) => (
                  <div key={i} className={styles.note}>
                    <div className={styles.noteMeta}><strong>{n.by}</strong> • {n.time}</div>
                    <div className={styles.noteText}>{n.text}</div>
                  </div>
                )) : <div className={styles.noData}>No internal notes yet.</div>}
              </div>
              <div>
                <textarea placeholder="Add internal note..." className={styles.textarea}
                  value={internalNote} onChange={e => setInternalNote(e.target.value)} />
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button className={styles.replyBtn} disabled={saving}
                    onClick={() => handleAddInternalNote(selectedTicket.id, internalNote)}>
                    <FaReply /> {saving ? "Saving…" : "Add Note"}
                  </button>
                  <button className={styles.smallBtnOutline} onClick={() => setInternalNote("")}>Cancel</button>
                </div>
              </div>
            </>
          )}

          {drawerTab === "attachments" && selectedTicket && (
            <div className={styles.attachments}>
              {selectedTicket.attachments.length > 0 ? selectedTicket.attachments.map((a, i) => (
                <div key={i} className={styles.attachmentCard}>
                  {a.url && <img src={a.url} alt={a.name} />}
                  <div className={styles.attachmentMeta}>
                    <div className={styles.attachmentName}>{a.name}</div>
                    {a.url && (
                      <button className={styles.smallBtn} onClick={() => window.open(a.url, "_blank")}>View</button>
                    )}
                  </div>
                </div>
              )) : <div className={styles.noData}>No attachments.</div>}
            </div>
          )}
        </div>
      </div>

      {drawerOpen && <div className={styles.overlay} onClick={closeDrawer} />}
    </div>
  );
}
