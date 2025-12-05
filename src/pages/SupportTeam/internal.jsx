import React, { useState } from "react";
import "./internal.css";

/**
 * FUTURE HOOK:
 * - Plug into Firebase/Firestore or your backend.
 * - Use `target` field to route messages:
 *   - "all"    -> visible to all
 *   - "admin"  -> admin-only view
 *   - "support"-> support-only view
 * - Current implementation: local state mock for UI.
 */

// Initial messages in the single "General" channel
const initialMessages = [
  {
    id: 1,
    from: "Admin",
    role: "Admin",
    target: "all",
    text: "Reminder: keep all escalated ticket IDs documented in this channel.",
    time: "09:05",
    mine: false,
  },
  {
    id: 2,
    from: "Support Team A",
    role: "Support",
    target: "admin",
    text: "Shared list of stores with repeated payment issues in the shared sheet.",
    time: "09:12",
    mine: false,
  },
  {
    id: 3,
    from: "Support Team B",
    role: "Support",
    target: "all",
    text: "Queue stable. All high priority calls picked within SLA.",
    time: "09:30",
    mine: false,
  },
];

const currentUser = {
  name: "You",
  role: "Support",
};

const TARGET_OPTIONS = [
  { key: "all", label: "All Members" },
  { key: "admin", label: "Only Admin" },
  { key: "support", label: "Only Support Team" },
];

function MessageBubble({ msg }) {
  const targetLabel =
    msg.target === "all"
      ? "All Members"
      : msg.target === "admin"
      ? "Admin Only"
      : "Support Team Only";

  return (
    <div
      className={
        "int-msg-wrap" + (msg.mine ? " int-msg-right" : " int-msg-left")
      }
    >
      <div className="int-msg-meta">
        <span className="int-msg-from">
          {msg.mine ? "You" : msg.from}
        </span>
        <span className="int-msg-role">{msg.role}</span>
        <span className="int-msg-target">{targetLabel}</span>
        <span className="int-msg-time">{msg.time}</span>
      </div>
      <div
        className={
          "int-msg-bubble" +
          (msg.mine ? " int-msg-bubble-mine" : " int-msg-bubble-peer")
        }
      >
        {msg.text}
      </div>
    </div>
  );
}

export default function Internal() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [target, setTarget] = useState("all");

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg = {
      id: Date.now(),
      from: currentUser.name,
      role: currentUser.role,
      text,
      time,
      mine: true,
      target,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="int-wrapper">
      {/* LEFT: General channel info */}
      <aside className="int-sidebar">
        <div className="int-sidebar-header">
          <h2>Internal Discussions</h2>
          <p>
            One shared channel for Admin and Support team to stay aligned.
          </p>
        </div>

        <div className="int-general-pill">
          <div className="int-general-title"># General</div>
          <div className="int-general-sub">
            Central space for internal updates, escalations and notes.
          </div>
        </div>

        <div className="int-sidebar-label">Usage</div>
        <div className="int-sidebar-note">
          <ul>
            <li>Use clear, short updates.</li>
            <li>Mention ticket IDs for any case.</li>
            <li>No customer-facing language here.</li>
            <li>Use the target option to notify Admin or Support only.</li>
          </ul>
        </div>
      </aside>

      {/* CENTER: Chat for #General */}
      <section className="int-main">
        <div className="int-main-header">
          <div>
            <div className="int-room-title"># General</div>
            <div className="int-room-subtitle">
              Shared internal channel for all support operations.
            </div>
          </div>
          <div className="int-current-user">
            <div className="int-user-label">You</div>
            <div className="int-user-role">
              {currentUser.role} Team
            </div>
          </div>
        </div>

        <div className="int-messages">
          {messages.length === 0 ? (
            <div className="int-empty">
              No messages yet. Start the first internal update.
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))
          )}
        </div>

        <div className="int-input-toolbar">
          <div className="int-target-label">Send to</div>
          <div className="int-target-options">
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={
                  "int-target-btn" +
                  (target === opt.key
                    ? " int-target-btn-active"
                    : "")
                }
                onClick={() => setTarget(opt.key)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="int-input-wrap">
          <textarea
            className="int-input"
            placeholder="Write an update for Admin / Support team..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="int-send-btn"
            type="button"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </section>

      {/* RIGHT: Team Presence */}
      <aside className="int-rightbar">
        <div className="int-right-header">
          <div className="int-right-title">Team Presence</div>
          <div className="int-right-pill">Internal Only</div>
        </div>

        <div className="int-member">
          <div className="int-avatar int-avatar-online">A</div>
          <div>
            <div className="int-member-name">Support Team A</div>
            <div className="int-member-role">Online</div>
          </div>
        </div>

        <div className="int-member">
          <div className="int-avatar int-avatar-online">B</div>
          <div>
            <div className="int-member-name">Support Team B</div>
            <div className="int-member-role">Online</div>
          </div>
        </div>

        <div className="int-member">
          <div className="int-avatar">C</div>
          <div>
            <div className="int-member-name">Support Team C</div>
            <div className="int-member-role">Away</div>
          </div>
        </div>

        <div className="int-member">
          <div className="int-avatar">A</div>
          <div>
            <div className="int-member-name">Admin</div>
            <div className="int-member-role">Available</div>
          </div>
        </div>

        <div className="int-divider" />

        <div className="int-guidelines">
          <div className="int-guidelines-title">Notes</div>
          <ul>
            <li>Use “Only Admin” for approvals or escalations.</li>
            <li>
              Use “Only Support Team” for coordination without
              admin noise.
            </li>
            <li>Use “All Members” for key updates.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
