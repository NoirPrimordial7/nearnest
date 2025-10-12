// src/pages/Admin/Support/SupportTickets.jsx
import React, { useMemo, useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiCornerUpLeft,
  FiChevronDown,
} from "react-icons/fi";
import styles from "./SupportTickets.module.css";


/* ---------- Mock data ---------- */
const MOCK_TICKETS = Array.from({ length: 32 }).map((_, i) => ({
  id: `TKT-${1000 + i}`,
  from: i % 3 === 0 ? "Store #NE-30" + (i % 9) : "User",
  subject:
    ["Payment not captured", "Medicine not visible", "Unable to login", "Wrong address on order"][
      i % 4
    ],
  category: ["Payments", "Catalog", "Auth", "Orders"][i % 4],
  priority: ["Low", "Medium", "High", "Urgent"][i % 4],
  assignedTo: ["Asha", "Rohit", "Dinesh", "Kiran"][i % 4],
  status: ["Open", "In Progress", "Resolved", "Escalated"][i % 4],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  thread: [
    {
      by: i % 2 ? "Customer" : "Store",
      text: "Hi, I’m facing trouble completing the payment. It keeps failing.",
      ts: Date.now() - 3600_000 * 10,
    },
    {
      by: "Agent",
      text: "Thanks for reporting. Could you confirm the last 4 digits of the card?",
      ts: Date.now() - 3600_000 * 8,
    },
  ],
  attachments: [],
  internalNotes: ["Checked logs; gateway timeout at 14:03 IST."],
}));

/* ---------- Small UI helpers ---------- */
function Pill({ tone = "slate", children }) {
  return <span className={`${styles.pill} ${styles[`pill_${tone}`]}`}>{children}</span>;
}

function Kbd({ children }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}

/* ---------- Drawer (conversation) ---------- */
function TicketDrawer({ ticket, onClose, onAction }) {
  const [tab, setTab] = useState("conversation");
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");

  if (!ticket) return null;

  return (
    <>
      <button className={styles.scrim} onClick={onClose} aria-label="Close" />
      <aside className={styles.drawer} role="dialog" aria-modal="true">
        <header className={styles.drawerHead}>
          <div className={styles.headLeft}>
            <div className={styles.ticketId}>{ticket.id}</div>
            <div className={styles.ticketMeta}>
              <Pill tone="indigo">{ticket.category}</Pill>
              <Pill tone={ticket.priority === "Urgent" ? "rose" : ticket.priority === "High" ? "amber" : "mint"}>
                {ticket.priority}
              </Pill>
              <Pill tone={ticket.status === "Resolved" ? "mint" : ticket.status === "Escalated" ? "rose" : "slate"}>
                {ticket.status}
              </Pill>
            </div>
          </div>
          <div className={styles.headRight}>
            <button
              className={styles.badBtn}
              onClick={() => onAction("resolve", ticket)}
              title="Resolve"
            >
              <FiCheckCircle />
              <span>Resolve</span>
            </button>
            <button
              className={styles.badBtn}
              onClick={() => onAction("close", ticket)}
              title="Close"
            >
              <FiXCircle />
              <span>Close</span>
            </button>
            <button className={styles.iconBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>
        </header>

        <div className={styles.tabs}>
          {["conversation", "notes", "attachments"].map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "conversation" && <><FiMessageCircle /> Conversation</>}
              {t === "notes" && <>Internal Notes</>}
              {t === "attachments" && <>Attachments</>}
            </button>
          ))}
        </div>

        <div className={styles.drawerBody}>
          {tab === "conversation" && (
            <>
              <ul className={styles.thread}>
                {ticket.thread.map((m, idx) => (
                  <li key={idx} className={styles.msg}>
                    <div className={styles.msgBy}>{m.by}</div>
                    <div className={styles.msgText}>{m.text}</div>
                    <div className={styles.msgTs}>
                      {new Date(m.ts).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.replyBox}>
                <div className={styles.replyTools}>
                  <button className={styles.ghostMini} title="Canned responses">
                    <FiCornerUpLeft /> Templates
                  </button>
                  <span className={styles.hint}>
                    Send with <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>
                  </span>
                </div>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Write a reply…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      onAction("reply", { ticket, text: reply });
                      setReply("");
                    }
                  }}
                />
                <div className={styles.replyActions}>
                  <button
                    className={styles.primary}
                    onClick={() => {
                      onAction("reply", { ticket, text: reply });
                      setReply("");
                    }}
                  >
                    <FiSend /> Send
                  </button>
                  <button className={styles.ghostMini}>
                    <FiPaperclip /> Attach
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === "notes" && (
            <div className={styles.notes}>
              <ul className={styles.noteList}>
                {ticket.internalNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Add internal note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                className={styles.primary}
                onClick={() => {
                  onAction("note", { ticket, text: note });
                  setNote("");
                }}
              >
                Add Note
              </button>
            </div>
          )}

          {tab === "attachments" && (
            <div className={styles.attach}>
              <p>No attachments yet.</p>
              <button className={styles.ghostMini}><FiPaperclip /> Upload</button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ---------- Main Page ---------- */
export default function SupportTickets() {
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const data = useMemo(() => {
    let d = [...MOCK_TICKETS];
    if (status !== "All") d = d.filter((t) => t.status === status);
    if (query.trim()) {
      const q = query.toLowerCase();
      d = d.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.from.toLowerCase().includes(q)
      );
    }
    return d;
  }, [status, query]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const rows = data.slice((page - 1) * pageSize, page * pageSize);

  const onAction = (type, payload) => {
    // Wire real API later; for now just log
    console.log("Action:", type, payload);
    if (type === "resolve") setSelected(null);
    if (type === "close") setSelected(null);
  };

  return (
    <div className={styles.page}>
      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.searchIcon} />
          <input
            className={styles.search}
            placeholder="Search ticket id, subject, store/user…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <button className={styles.ghostMini}><FiFilter /> Filters</button>
        </div>

        <div className={styles.chips}>
          {["All", "Open", "In Progress", "Resolved", "Escalated"].map((s) => (
            <button
              key={s}
              className={`${styles.chip} ${status === s ? styles.chipActive : ""}`}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <section className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>From</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Assigned</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="8" className={styles.empty}>No tickets</td>
                </tr>
              )}
              {rows.map((t) => (
                <tr key={t.id} className={styles.row}>
                  <td>
                    <div className={styles.ticketCell}>
                      <div className={styles.avatar}>T</div>
                      <div>
                        <div className={styles.tid}>{t.id}</div>
                        <div className={styles.sub}>{t.subject}</div>
                      </div>
                    </div>
                  </td>
                  <td>{t.from}</td>
                  <td><Pill tone="indigo">{t.category}</Pill></td>
                  <td>
                    <Pill
                      tone={
                        t.priority === "Urgent" ? "rose" :
                        t.priority === "High" ? "amber" : "mint"
                      }
                    >
                      {t.priority}
                    </Pill>
                  </td>
                  <td>{t.assignedTo}</td>
                  <td>
                    <Pill
                      tone={
                        t.status === "Resolved" ? "mint" :
                        t.status === "Escalated" ? "rose" :
                        t.status === "In Progress" ? "amber" : "slate"
                      }
                    >
                      {t.status}
                    </Pill>
                  </td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className={styles.actions}>
                    <button className={styles.ghost} onClick={() => setSelected(t)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.pager}>
          <button
            className={styles.pgBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            ‹
          </button>
          <div className={styles.pgNum}>{page} <FiChevronDown /></div>
          <button
            className={styles.pgBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      </section>

      {/* Drawer */}
      <TicketDrawer ticket={selected} onClose={() => setSelected(null)} onAction={onAction} />
    </div>
  );
}
