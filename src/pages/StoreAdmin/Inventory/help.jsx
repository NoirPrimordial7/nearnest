// src/pages/StoreAdmin/help.jsx
import React, { useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import "./help.css";
import {
  LifeBuoy,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Send,
  PlusCircle,
  Search,
  FileText,
  Tag,
} from "lucide-react";

const INITIAL_TICKETS = [
  {
    id: "TCK-1023",
    subject: "Unable to verify pharmacy license",
    category: "Account & Verification",
    priority: "High",
    status: "Open",
    createdAt: "2025-06-01 11:20",
    updatedAt: "2025-06-01 11:45",
    messages: [
      {
        from: "support",
        role: "Support",
        text: "Hi, we see a mismatch between the license number and the name. Please upload a clearer scan or share the correct details.",
        at: "2025-06-01 11:22",
      },
      {
        from: "you",
        role: "You",
        text: "I’ve uploaded a new scan. Please check again.",
        at: "2025-06-01 11:40",
      },
    ],
  },
  {
    id: "TCK-1018",
    subject: "Analytics report not loading for last month",
    category: "Analytics & Reporting",
    priority: "Medium",
    status: "Pending",
    createdAt: "2025-05-28 16:05",
    updatedAt: "2025-05-28 16:10",
    messages: [
      {
        from: "you",
        role: "You",
        text: "The analytics page is not loading data for May. Other months are fine.",
        at: "2025-05-28 16:05",
      },
      {
        from: "support",
        role: "Support",
        text: "We’re looking into this and will update you shortly.",
        at: "2025-05-28 16:10",
      },
    ],
  },
  {
    id: "TCK-1002",
    subject: "How to configure delivery radius?",
    category: "Store Settings",
    priority: "Low",
    status: "Resolved",
    createdAt: "2025-05-20 10:15",
    updatedAt: "2025-05-20 10:32",
    messages: [
      {
        from: "you",
        role: "You",
        text: "Where can I configure my home delivery radius?",
        at: "2025-05-20 10:15",
      },
      {
        from: "support",
        role: "Support",
        text: "Go to Store Settings → Operations & Hours → Delivery radius. You can set the value in kilometers.",
        at: "2025-05-20 10:25",
      },
      {
        from: "you",
        role: "You",
        text: "Got it, thank you!",
        at: "2025-05-20 10:32",
      },
    ],
  },
];

const CATEGORIES = [
  "Account & Verification",
  "Store Profile / Settings",
  "Inventory & Products",
  "Orders & Delivery",
  "Analytics & Reporting",
  "Billing & Subscription",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High"];

export default function StoreSupportHelp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Tickets & selection
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState(
    INITIAL_TICKETS.length ? INITIAL_TICKETS[0].id : null
  );

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // New ticket form
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDescription, setNewDescription] = useState("");
  const [newOrderId, setNewOrderId] = useState("");

  // Reply box
  const [replyText, setReplyText] = useState("");

  const [toast, setToast] = useState("");
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState(false);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    });
  }, [tickets, statusFilter, search]);

  const selectedTicket =
    tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;

  const openCount = tickets.filter((t) => t.status === "Open").length;
  const pendingCount = tickets.filter((t) => t.status === "Pending").length;
  const resolvedCount = tickets.filter((t) => t.status === "Resolved").length;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const createTicket = () => {
    if (!newSubject.trim()) {
      showToast("Please enter a subject for your query.");
      return;
    }
    if (!newDescription.trim()) {
      showToast("Please provide some details about your query.");
      return;
    }

    setCreating(true);
    try {
      const now = new Date();
      const ts = now.toLocaleString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const nextIndex = tickets.length + 1;
      const id = `TCK-${(1000 + nextIndex).toString()}`;

      const initialMessageText = newOrderId
        ? `${newDescription}\n\nOrder / Reference ID: ${newOrderId}`
        : newDescription;

      const newTicket = {
        id,
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        status: "Open",
        createdAt: ts,
        updatedAt: ts,
        messages: [
          {
            from: "you",
            role: "You",
            text: initialMessageText,
            at: ts,
          },
        ],
      };

      setTickets((prev) => [newTicket, ...prev]);
      setSelectedTicketId(id);

      // reset form
      setNewSubject("");
      setNewCategory(CATEGORIES[0]);
      setNewPriority("Medium");
      setNewDescription("");
      setNewOrderId("");

      showToast("✅ Support ticket created successfully.");
    } finally {
      setCreating(false);
    }
  };

  const sendReply = () => {
    if (!selectedTicket) {
      showToast("Please select a ticket first.");
      return;
    }
    if (!replyText.trim()) {
      showToast("Reply message cannot be empty.");
      return;
    }

    setReplying(true);
    try {
      const now = new Date();
      const ts = now.toLocaleString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      setTickets((prev) =>
        prev.map((t) => {
          if (t.id !== selectedTicket.id) return t;
          return {
            ...t,
            status: t.status === "Resolved" ? "Open" : t.status,
            updatedAt: ts,
            messages: [
              ...t.messages,
              {
                from: "you",
                role: "You",
                text: replyText.trim(),
                at: ts,
              },
            ],
          };
        })
      );

      setReplyText("");
    } finally {
      setReplying(false);
    }
  };

  const markResolved = () => {
    if (!selectedTicket) return;
    if (selectedTicket.status === "Resolved") {
      showToast("This ticket is already resolved.");
      return;
    }
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id ? { ...t, status: "Resolved" } : t
      )
    );
    showToast("✅ Ticket marked as resolved.");
  };

  const reopenTicket = () => {
    if (!selectedTicket) return;
    if (selectedTicket.status !== "Resolved") {
      showToast("Ticket is not resolved yet.");
      return;
    }
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id ? { ...t, status: "Open" } : t
      )
    );
    showToast("Ticket reopened.");
  };

  const statusBadgeClass = (status) => {
    if (status === "Open") return "status-pill open";
    if (status === "Pending") return "status-pill pending";
    if (status === "Resolved") return "status-pill resolved";
    return "status-pill";
  };

  const priorityBadgeClass = (p) => {
    if (p === "High") return "priority-pill high";
    if (p === "Medium") return "priority-pill medium";
    return "priority-pill low";
  };

  return (
    <div className="support-root dark">
      <div className="sa-shell">
        {/* Sidebar */}
        <aside className={`sa-left ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sa-left-inner">
            <Sidebar
              role="store"
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        </aside>

        {/* Main content */}
        <main className={`sa-right ${sidebarCollapsed ? "shifted" : ""}`}>
          <div className="support-container">
            {/* Header */}
            <header className="support-head">
              <div className="head-left">
                <h1>
                  <LifeBuoy size={20} />
                  Support & Help
                </h1>
                <p>
                  Raise queries, track responses, and chat with the MediFind
                  support team whenever you need help.
                </p>
              </div>
              <div className="head-right">
                <div className="metric">
                  <span className="metric-label">Open</span>
                  <span className="metric-value">{openCount}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Pending</span>
                  <span className="metric-value">{pendingCount}</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Resolved</span>
                  <span className="metric-value">{resolvedCount}</span>
                </div>
              </div>
            </header>

            <section className="support-grid">
              {/* LEFT: New ticket + tips */}
              <div className="support-left">
                <div className="card">
                  <div className="card-head">
                    <div className="title-row">
                      <h3>
                        <PlusCircle size={16} />
                        Raise a new query
                      </h3>
                      <span className="badge-soft">Store Admin</span>
                    </div>
                    <p className="card-subtitle">
                      Create a ticket for technical issues, account queries, or
                      product-related questions.
                    </p>
                  </div>
                  <div className="card-body form-grid">
                    <label className="form-field full">
                      <span className="label">Subject *</span>
                      <input
                        className="input"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="e.g., Unable to update my store profile"
                      />
                    </label>

                    <label className="form-field">
                      <span className="label">Category</span>
                      <div className="input-select">
                        <Tag size={14} />
                        <select
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </label>

                    <div className="form-field">
                      <span className="label">Priority</span>
                      <div className="priority-row">
                        {PRIORITIES.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`priority-chip ${
                              newPriority === p ? "active" : ""
                            }`}
                            onClick={() => setNewPriority(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="form-field full">
                      <span className="label">Describe your issue *</span>
                      <textarea
                        className="textarea"
                        rows={4}
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Please explain the issue in detail. If possible, mention steps to reproduce the problem."
                      />
                    </label>

                    <label className="form-field full">
                      <span className="label">
                        <FileText size={14} /> Order / Reference ID (optional)
                      </span>
                      <input
                        className="input"
                        value={newOrderId}
                        onChange={(e) => setNewOrderId(e.target.value)}
                        placeholder="e.g., ORDER-2025-00123"
                      />
                    </label>

                    <div className="form-footer">
                      <div className="hint-inline">
                        <AlertCircle size={14} />
                        <span>
                          Our support team typically responds within{" "}
                          <strong>2–4 business hours</strong>.
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn primary"
                        onClick={createTicket}
                        disabled={creating}
                      >
                        {creating ? "Creating..." : "Submit Ticket"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card secondary">
                  <div className="card-head small">
                    <h3>Quick tips</h3>
                  </div>
                  <div className="card-body tips">
                    <ul>
                      <li>
                        Include <strong>screenshots</strong> and exact error
                        messages in your description.
                      </li>
                      <li>
                        For order-related issues, always share an{" "}
                        <strong>Order / Reference ID</strong>.
                      </li>
                      <li>
                        Mark tickets as <strong>Resolved</strong> once your
                        issue is fully fixed.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* RIGHT: Ticket list + chat */}
              <div className="support-right">
                {/* Filters + list */}
                <div className="ticket-panel">
                  <div className="ticket-toolbar">
                    <div className="search-box">
                      <Search size={14} />
                      <input
                        placeholder="Search by ticket ID, subject, or category"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="status-filters">
                      <button
                        type="button"
                        className={`filter-chip ${
                          statusFilter === "all" ? "active" : ""
                        }`}
                        onClick={() => setStatusFilter("all")}
                      >
                        <Filter size={12} />
                        All
                      </button>
                      <button
                        type="button"
                        className={`filter-chip ${
                          statusFilter === "Open" ? "active" : ""
                        }`}
                        onClick={() => setStatusFilter("Open")}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className={`filter-chip ${
                          statusFilter === "Pending" ? "active" : ""
                        }`}
                        onClick={() => setStatusFilter("Pending")}
                      >
                        Pending
                      </button>
                      <button
                        type="button"
                        className={`filter-chip ${
                          statusFilter === "Resolved" ? "active" : ""
                        }`}
                        onClick={() => setStatusFilter("Resolved")}
                      >
                        Resolved
                      </button>
                    </div>
                  </div>

                  <div className="ticket-list">
                    {filteredTickets.length === 0 ? (
                      <div className="empty-state">
                        <MessageCircle size={18} />
                        <p>No tickets found. Try adjusting filters or create a new query.</p>
                      </div>
                    ) : (
                      filteredTickets.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`ticket-item ${
                            selectedTicket && selectedTicket.id === t.id
                              ? "active"
                              : ""
                          }`}
                          onClick={() => setSelectedTicketId(t.id)}
                        >
                          <div className="ticket-main">
                            <div className="ticket-top-row">
                              <span className="ticket-id">{t.id}</span>
                              <span className={priorityBadgeClass(t.priority)}>
                                {t.priority}
                              </span>
                            </div>
                            <div className="ticket-subject">{t.subject}</div>
                            <div className="ticket-meta">
                              <span className="ticket-category">
                                {t.category}
                              </span>
                              <span className={statusBadgeClass(t.status)}>
                                {t.status}
                              </span>
                            </div>
                          </div>
                          <div className="ticket-time">
                            <Clock size={12} />
                            <span>{t.updatedAt}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat panel */}
                <div className="chat-panel">
                  {!selectedTicket ? (
                    <div className="empty-chat">
                      <MessageCircle size={22} />
                      <p>Select a ticket on the left to view the conversation.</p>
                    </div>
                  ) : (
                    <>
                      <div className="chat-header">
                        <div>
                          <h3>{selectedTicket.subject}</h3>
                          <div className="chat-subtitle">
                            <span className="ticket-id">{selectedTicket.id}</span>
                            <span className="dot" />
                            <span>{selectedTicket.category}</span>
                            <span className="dot" />
                            <span className={priorityBadgeClass(selectedTicket.priority)}>
                              {selectedTicket.priority} priority
                            </span>
                          </div>
                        </div>
                        <div className="chat-actions">
                          {selectedTicket.status === "Resolved" ? (
                            <button
                              type="button"
                              className="btn ghost small"
                              onClick={reopenTicket}
                            >
                              Reopen
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn subtle small"
                              onClick={markResolved}
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="chat-body">
                        {selectedTicket.messages.map((m, index) => (
                          <div
                            key={index}
                            className={`message-row ${
                              m.from === "you" ? "outgoing" : "incoming"
                            }`}
                          >
                            <div className="message-bubble">
                              <div className="message-meta">
                                <span className="message-role">{m.role}</span>
                                <span className="message-time">{m.at}</span>
                              </div>
                              <div className="message-text">
                                {m.text.split("\n").map((line, i) => (
                                  <p key={i}>{line}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="chat-footer">
                        <textarea
                          className="textarea"
                          rows={2}
                          placeholder="Type your reply to MediFind Support…"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="chat-footer-actions">
                          <span className="hint-inline">
                            <MessageCircle size={14} />
                            <span>Support replies will also be emailed to you.</span>
                          </span>
                          <button
                            type="button"
                            className="btn primary"
                            onClick={sendReply}
                            disabled={replying}
                          >
                            {replying ? "Sending…" : "Send Reply"}
                            <Send size={14} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {toast && (
              <div className="support-toast">
                {toast.startsWith("✅") ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{toast}</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
