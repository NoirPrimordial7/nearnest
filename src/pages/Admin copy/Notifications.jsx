import React, { useState, useEffect, useRef } from "react";
import "./notifications.css";

const sampleNotifications = [
{
id: 1,
sender: "John Doe",
role: "User",
subject: "Issue with business listing",
message:
"Hello Admin, I am facing an issue with editing my business listing. Please check.",
date: "2025-10-28 14:35",
},
{
id: 2,
sender: "Support Team",
role: "Support",
subject: "Query Resolved - Ticket #1023",
message:
"The issue reported yesterday regarding payment verification has been resolved successfully.",
date: "2025-10-28 12:10",
},
{
id: 3,
sender: "System",
role: "System",
subject: "Scheduled Maintenance Notice",
message:
"The NearNest platform will undergo maintenance on October 30th from 2:00 AM to 4:00 AM IST.",
date: "2025-10-27 18:45",
},
{
id: 4,
sender: "User",
role: "User",
subject: "Want to post the Advertisemnt of my Store on the Dashboard!",
message:
"Help me to post the Advertisemnt of my Store on the Application Dashboard",
date: "2025-10-26 18:45",
},
];

const Notifications = () => {
const [notifications, setNotifications] = useState([]);
const [selected, setSelected] = useState(null);
const [search, setSearch] = useState("");
const [filter, setFilter] = useState("all");
const [selectedIds, setSelectedIds] = useState([]);
const [menuOpen, setMenuOpen] = useState(null);
const menuRef = useRef();

useEffect(() => {
setNotifications(
sampleNotifications.map((n) => ({ ...n, read: false, flagged: false }))
);
}, []);

useEffect(() => {
const handleClickOutside = (e) => {
if (menuRef.current && !menuRef.current.contains(e.target)) {
setMenuOpen(null);
}
};
document.addEventListener("mousedown", handleClickOutside);
return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// ✅ When a notification is opened, mark it as read automatically
const handleSelect = (note) => {
setNotifications((prev) =>
prev.map((n) =>
n.id === note.id ? { ...n, read: true } : n
)
);
setSelected({ ...note, read: true });
};

const handleMenuAction = (id, action) => {
setNotifications((prev) =>
prev
.map((note) => {
if (note.id === id) {
if (action === "delete") return null;
if (action === "flag") return { ...note, flagged: true };
if (action === "unflag") return { ...note, flagged: false };
if (action === "markRead") return { ...note, read: true };
if (action === "markUnread") return { ...note, read: false };
}
return note;
})
.filter(Boolean)
);
setMenuOpen(null);
setSelectedIds([]);
};

// ✅ “Mark all as read” now affects all notifications instantly
const handleBulkAction = (action) => {
setNotifications((prev) =>
prev
.map((note) => {
if (action === "markRead") return { ...note, read: true };
if (selectedIds.includes(note.id)) {
if (action === "delete") return null;
if (action === "markUnread") return { ...note, read: false };
if (action === "flag") return { ...note, flagged: true };
if (action === "unflag") return { ...note, flagged: false };
}
return note;
})
.filter(Boolean)
);
setSelectedIds([]);
};

const handleSelectToggle = (id) => {
setSelectedIds((prev) =>
prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
);
};

const handleSelectAll = (e) => {
if (e.target.checked) {
setSelectedIds(filteredNotifications.map((n) => n.id));
} else {
setSelectedIds([]);
}
};

const filteredNotifications = notifications.filter((note) => {
const matchSearch =
note.subject.toLowerCase().includes(search.toLowerCase()) ||
note.message.toLowerCase().includes(search.toLowerCase());
const matchFilter =
filter === "all"
? true
: filter === "flagged"
? note.flagged
: filter === "unread"
? !note.read
: note.read;
return matchSearch && matchFilter;
});

return (
<div className="notifications-container dark">
<header className="notifications-header">
<h2>Notifications</h2>

    <div className="header-controls">
      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="unread">Unread</option>
        <option value="read">Read</option>
        <option value="flagged">Flagged</option>
      </select>
      <button onClick={() => handleBulkAction("markRead")}>
        Mark all as read
      </button>
    </div>
  </header>

  <div className="bulk-actions">
    <label>
      <input
        type="checkbox"
        onChange={handleSelectAll}
        checked={
          selectedIds.length > 0 &&
          selectedIds.length === filteredNotifications.length
        }
      />{" "}
      Select All
    </label>
    {selectedIds.length > 0 && (
      <div className="bulk-buttons">
        <button onClick={() => handleBulkAction("delete")}>Delete</button>
        <button onClick={() => handleBulkAction("markRead")}>
          Mark Read
        </button>
        <button onClick={() => handleBulkAction("markUnread")}>
          Mark Unread
        </button>
        <button onClick={() => handleBulkAction("flag")}>Flag</button>
        <button onClick={() => handleBulkAction("unflag")}>Unflag</button>
      </div>
    )}
  </div>

  <div className="notifications-body">
    {/* Sidebar - Notification List */}
    <div className="notifications-list">
      {filteredNotifications.map((note) => (
        <div
          key={note.id}
          className={`notification-item ${
            selected && selected.id === note.id ? "active" : ""
          } ${note.read ? "read" : "unread"}`}
          onClick={() => handleSelect(note)}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(note.id)}
            onChange={(e) => {
              e.stopPropagation();
              handleSelectToggle(note.id);
            }}
          />
          <div className="notification-content">
            <div className="notification-header">
              <span className="sender-name">
                {note.sender}
                {!note.read && <span className="unread-dot"></span>}
              </span>
              <span className={`sender-role ${note.role.toLowerCase()}`}>
                {note.role}
              </span>
              <span className="notification-date">
                {new Date(note.date).toLocaleString()}
              </span>
            </div>
            <div className="notification-subject">
              {note.flagged && <span className="flag-icon">⚑</span>}{" "}
              {note.subject}
            </div>
            <div className="notification-preview">
              {note.message.slice(0, 60)}...
            </div>
          </div>
          <div
            className="menu-icon"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(menuOpen === note.id ? null : note.id);
            }}
          >
            ⋮
          </div>

          {menuOpen === note.id && (
            <div className="context-menu" ref={menuRef}>
              <div onClick={() => handleMenuAction(note.id, "delete")}>
                Delete
              </div>
              <div
                onClick={() =>
                  handleMenuAction(
                    note.id,
                    note.flagged ? "unflag" : "flag"
                  )
                }
              >
                {note.flagged ? "Unflag" : "Flag"}
              </div>
              <div
                onClick={() =>
                  handleMenuAction(
                    note.id,
                    note.read ? "markUnread" : "markRead"
                  )
                }
              >
                {note.read ? "Mark Unread" : "Mark Read"}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Right Pane - Selected Message */}
    <div className="notification-detail">
      {selected ? (
        <>
          <div className="detail-header">
            <h3>{selected.subject}</h3>
            <div className="detail-meta">
              <span className="sender-detail">
                From: {selected.sender} ({selected.role})
              </span>
              <span className="date-detail">
                {new Date(selected.date).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="detail-message">
            <p>{selected.message}</p>
          </div>
        </>
      ) : (
        <div className="no-selection">Select a notification to view</div>
      )}
    </div>
  </div>
</div>


);
};

export default Notifications;