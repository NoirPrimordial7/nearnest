import { useState } from "react";
import "./allTickets.css";

// Default opening hours (used for each store)
const DEFAULT_DAILY_HOURS = [
  { dayKey: "Mon", label: "Mon", isOpen: true, open: "09:00 AM", close: "09:00 PM" },
  { dayKey: "Tue", label: "Tue", isOpen: true, open: "09:00 AM", close: "09:00 PM" },
  { dayKey: "Wed", label: "Wed", isOpen: true, open: "09:00 AM", close: "09:00 PM" },
  { dayKey: "Thu", label: "Thu", isOpen: true, open: "09:00 AM", close: "09:00 PM" },
  { dayKey: "Fri", label: "Fri", isOpen: true, open: "09:00 AM", close: "09:00 PM" },
  { dayKey: "Sat", label: "Sat", isOpen: true, open: "09:00 AM", close: "09:00 PM" },
  { dayKey: "Sun", label: "Sun", isOpen: false, open: "09:00 AM", close: "09:00 PM" },
];

const MOCK_TICKETS = [
  {
    id: "#MF-1024",
    createdAt: "2025-11-01 10:12",
    priority: "High",
    status: "Open",
    storeId: "STORE-342",
    storeName: "WellCare Pharmacy",
    legalBusinessName: "WellCare Healthcare Pvt. Ltd.",
    ownerName: "Rahul Sharma",
    contactEmail: "support@wellcare.in",
    ownerEmail: "rahul.sharma@wellcare.in",
    primaryPhone: "+91 98765 43210",
    alternatePhone: "+91 90210 00012",
    city: "Pune",
    addressLine1: "Shop 12, Sunrise Complex",
    addressLine2: "Magarpatta Road",
    pin: "411028",
    landmark: "Near Seasons Mall",
    googleMapsUrl: "https://maps.google.com/?q=Sunrise+Complex+Magarpatta",
    description:
      "Mid-size pharmacy serving residential and corporate customers with 24x7 support.",
    query:
      "Payment failures reported for COD-to-prepaid switch. Users not receiving confirmation but amount debited.",
  },
  {
    id: "#MF-1021",
    createdAt: "2025-10-30 16:40",
    priority: "Medium",
    status: "In Progress",
    storeId: "STORE-221",
    storeName: "CityMed Plus",
    legalBusinessName: "CityMed Plus Retail",
    ownerName: "Sneha Patil",
    contactEmail: "help@citymedplus.in",
    ownerEmail: "sneha.patil@citymedplus.in",
    primaryPhone: "+91 99880 11223",
    alternatePhone: "",
    city: "Mumbai",
    addressLine1: "G-4, Orbit Plaza",
    addressLine2: "Andheri West",
    pin: "400053",
    landmark: "Opp. Metro Station",
    googleMapsUrl: "",
    description:
      "High-volume urban pharmacy with online and offline prescription services.",
    query:
      "Prescription upload preview not visible for some chronic patients. Need verification from our side.",
  },
  {
    id: "#MF-1019",
    createdAt: "2025-10-28 11:05",
    priority: "High",
    status: "Escalated",
    storeId: "STORE-198",
    storeName: "GreenLeaf Pharmacy",
    legalBusinessName: "GreenLeaf Wellness Store",
    ownerName: "Amit Verma",
    contactEmail: "care@greenleaf.in",
    ownerEmail: "amit.verma@greenleaf.in",
    primaryPhone: "+91 90040 66778",
    alternatePhone: "+91 90040 66779",
    city: "Delhi",
    addressLine1: "21, Central Market",
    addressLine2: "Lajpat Nagar",
    pin: "110024",
    landmark: "Near Central Parking",
    googleMapsUrl: "",
    description:
      "Pharmacy focused on chronic care & wellness products with PAN-Delhi delivery.",
    query:
      "Store documents flagged for mismatch. Owner needs clarity and wants live verification assistance.",
  },
  {
    id: "#MF-1013",
    createdAt: "2025-10-20 09:22",
    priority: "Low",
    status: "Resolved",
    storeId: "STORE-145",
    storeName: "MediPoint 24x7",
    legalBusinessName: "MediPoint Health Services",
    ownerName: "Karan Mehta",
    contactEmail: "info@medipoint.in",
    ownerEmail: "karan.mehta@medipoint.in",
    primaryPhone: "+91 90909 44556",
    alternatePhone: "",
    city: "Nashik",
    addressLine1: "Near City Hospital",
    addressLine2: "College Road",
    pin: "422005",
    landmark: "Opp. Parking Gate",
    googleMapsUrl: "https://maps.google.com/?q=MediPoint+24x7+Nashik",
    description:
      "Round-the-clock store integrated with in-house hospital pharmacy.",
    query:
      "Delay in order status sync between MediFind panel and in-store POS. Resolved after cache refresh.",
  },
];

function buildTicket(t) {
  const dailyHours =
    t.dailyHours && t.dailyHours.length === 7
      ? t.dailyHours
      : DEFAULT_DAILY_HOURS.map((row) => ({ ...row }));

  const store = {
    storeId: t.storeId || "",
    storeName: t.storeName || "",
    legalBusinessName: t.legalBusinessName || "",
    ownerName: t.ownerName || "",
    contactEmail: t.contactEmail || t.ownerEmail || "",
    ownerEmail: t.ownerEmail || "",
    primaryPhone: t.primaryPhone || "",
    alternatePhone: t.alternatePhone || "",
    description: t.description || "",
    city: t.city || "",
    addressLine1: t.addressLine1 || "",
    addressLine2: t.addressLine2 || "",
    pin: t.pin || "",
    landmark: t.landmark || "",
    googleMapsUrl: t.googleMapsUrl || "",
    dailyHours,
    licenseNumber: t.licenseNo || "",
    gstNumber: t.gstNumber || "",
    complianceNotes: t.complianceNotes || "",
    notificationEmail: t.notificationEmail || t.contactEmail || t.ownerEmail || "",
    notificationSmsNumber: t.notificationSmsNumber || t.primaryPhone || "",
    brandingName: t.brandingName || t.storeName || "",
    brandingColor: t.brandingColor || "#111827",
    brandingNotes: t.brandingNotes || "",
  };

  const chats = [
    { from: "owner", text: t.query },
    {
      from: "support",
      text:
        "Thank you for sharing this. We have received your query and will keep you updated here.",
    },
  ];

  return {
    id: t.id,
    createdAt: t.createdAt,
    priority: t.priority || "Medium",
    status: t.status || "Open",
    query: t.query,
    store,
    chats,
    savedStatus: t.status || "Open",
    savedChats: chats,
    savedStore: { ...store, dailyHours: store.dailyHours.map((r) => ({ ...r })) },
  };
}

function TicketRow({ ticket, active, onClick }) {
  return (
    <div
      className={
        "at-ticket-row" +
        (active ? " at-ticket-row-active" : "") +
        (ticket.priority === "High" ? " at-ticket-high" : "")
      }
      onClick={onClick}
    >
      <div className="at-ticket-id">{ticket.id}</div>
      <div className="at-ticket-main">
        <div className="at-ticket-store">{ticket.store.storeName}</div>
        <div className="at-ticket-owner">{ticket.store.ownerName}</div>
      </div>
      <div className="at-ticket-meta">
        <span className={`at-pill at-pill-${ticket.priority.toLowerCase()}`}>
          {ticket.priority}
        </span>
        <span className="at-status-label">{ticket.status}</span>
        <span className="at-created">{ticket.createdAt}</span>
      </div>
    </div>
  );
}

function ChatMessage({ from, text }) {
  return (
    <div
      className={
        "at-chat-msg " +
        (from === "support" ? "at-chat-support" : "at-chat-owner")
      }
    >
      <div className="at-chat-from">
        {from === "support" ? "Support" : "Store Owner"}
      </div>
      <div className="at-chat-text">{text}</div>
    </div>
  );
}

export default function AllTickets() {
  const [openTickets, setOpenTickets] = useState(() =>
    MOCK_TICKETS.filter((t) => t.status !== "Closed").map(buildTicket)
  );
  const [closedTickets, setClosedTickets] = useState(() =>
    MOCK_TICKETS.filter((t) => t.status === "Closed").map(buildTicket)
  );

  const [viewClosed, setViewClosed] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(
    (MOCK_TICKETS[0] && MOCK_TICKETS[0].id) || null
  );
  const [activeStoreTab, setActiveStoreTab] = useState("profile");

  const [searchTerm, setSearchTerm] = useState("");
  const [querySaveMessage, setQuerySaveMessage] = useState("");
  const [storeSaveMessage, setStoreSaveMessage] = useState("");

  const sourceTickets = viewClosed ? closedTickets : openTickets;

  const norm = searchTerm.trim().toLowerCase();
  const filteredTickets = sourceTickets.filter((t) => {
    if (!norm) return true;
    const text = [
      t.id,
      t.status,
      t.priority,
      t.store.storeId,
      t.store.storeName,
      t.store.legalBusinessName,
      t.store.ownerName,
      t.store.contactEmail,
      t.store.ownerEmail,
      t.store.primaryPhone,
      t.store.alternatePhone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(norm);
  });

  const selectedTicket =
    filteredTickets.find((t) => t.id === selectedTicketId) ||
    filteredTickets[0] ||
    null;

  const storeForm = selectedTicket ? selectedTicket.store : null;

  const updateCurrentTicket = (updater) => {
    setOpenTickets((prev) =>
      prev.map((t) => (t.id === selectedTicketId ? updater(t) : t))
    );
    setClosedTickets((prev) =>
      prev.map((t) => (t.id === selectedTicketId ? updater(t) : t))
    );
  };

  function handleStatusChange(e) {
    const value = e.target.value;
    updateCurrentTicket((ticket) => ({
      ...ticket,
      status: value,
    }));
  }

  function updateStoreField(field, value) {
    updateCurrentTicket((ticket) => ({
      ...ticket,
      store: {
        ...ticket.store,
        [field]: value,
      },
    }));
  }

  // Update a single day's hours
  function updateDailyHour(index, field, value) {
    updateCurrentTicket((ticket) => {
      const dailyHours = ticket.store.dailyHours.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      );
      return {
        ...ticket,
        store: {
          ...ticket.store,
          dailyHours,
        },
      };
    });
  }

  function handleSaveStoreDetails() {
    updateCurrentTicket((ticket) => ({
      ...ticket,
      savedStore: {
        ...ticket.store,
        dailyHours: ticket.store.dailyHours.map((r) => ({ ...r })),
      },
    }));
    setStoreSaveMessage("Store details saved.");
    setTimeout(() => setStoreSaveMessage(""), 2600);
  }

  function handleSendMessage(e) {
    e.preventDefault();
    if (!selectedTicket) return;
    const text = e.target.message?.value?.trim() || "";
    if (!text) return;

    const id = selectedTicket.id;

    setOpenTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, chats: [...t.chats, { from: "support", text }] }
          : t
      )
    );
    setClosedTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, chats: [...t.chats, { from: "support", text }] }
          : t
      )
    );

    e.target.reset();
  }

  function handleResetStore() {
    updateCurrentTicket((ticket) => {
      const saved = ticket.savedStore || ticket.store;
      return {
        ...ticket,
        store: {
          ...saved,
          dailyHours: (saved.dailyHours || DEFAULT_DAILY_HOURS).map((r) => ({
            ...r,
          })),
        },
      };
    });
  }

  // Save Query Changes:
  // - Always snapshot status + chats.
  // - If status Closed: move ticket to closed list (and hide from open).
  function handleSaveQueryChanges() {
    if (!selectedTicket) return;
    const id = selectedTicket.id;

    let movedToClosed = false;

    setOpenTickets((prevOpen) => {
      const idx = prevOpen.findIndex((t) => t.id === id);
      if (idx === -1) return prevOpen;

      const ticket = prevOpen[idx];
      const ticketWithSaved = {
        ...ticket,
        savedStatus: ticket.status,
        savedChats: [...ticket.chats],
      };

      if (ticket.status === "Closed") {
        movedToClosed = true;
        const remaining = prevOpen.filter((t) => t.id !== id);

        setClosedTickets((prevClosed) => {
          const existingIndex = prevClosed.findIndex((t) => t.id === id);
          if (existingIndex >= 0) {
            const copy = [...prevClosed];
            copy[existingIndex] = ticketWithSaved;
            return copy;
          }
          return [...prevClosed, ticketWithSaved];
        });

        setSelectedTicketId((current) => {
          if (current !== id) return current;
          if (!viewClosed) {
            const next = remaining[0];
            return next ? next.id : null;
          }
          return id;
        });

        return remaining;
      }

      const updated = [...prevOpen];
      updated[idx] = ticketWithSaved;
      return updated;
    });

    setClosedTickets((prevClosed) => {
      const idx = prevClosed.findIndex((t) => t.id === id);
      if (idx === -1) return prevClosed;
      const ticket = prevClosed[idx];
      const updated = [...prevClosed];
      updated[idx] = {
        ...ticket,
        savedStatus: ticket.status,
        savedChats: [...ticket.chats],
      };
      return updated;
    });

    if (selectedTicket.status === "Closed" || movedToClosed) {
      setQuerySaveMessage("Query changes saved. Ticket moved to Closed.");
    } else {
      setQuerySaveMessage("Query changes saved.");
    }
    setTimeout(() => setQuerySaveMessage(""), 2600);
  }

  function handleToggleView(isClosed) {
    setViewClosed(isClosed);
    setQuerySaveMessage("");
    setStoreSaveMessage("");

    const list = isClosed ? closedTickets : openTickets;

    if (list.length === 0) {
      setSelectedTicketId(null);
    } else if (!list.find((t) => t.id === selectedTicketId)) {
      setSelectedTicketId(list[0].id);
    }
  }

  const listToShow = filteredTickets;

  return (
    <div className="at-wrapper">
      {/* LEFT: filters + list */}
      <aside className="at-left">
        <div className="at-left-header">
          <h2>All Tickets</h2>
          <p>Smart view of open and closed support queries.</p>
        </div>

        <div className="at-toggle-row">
          <button
            className={
              "at-toggle-btn" + (!viewClosed ? " at-toggle-active" : "")
            }
            onClick={() => handleToggleView(false)}
          >
            Open Tickets
          </button>
          <button
            className={
              "at-toggle-btn" + (viewClosed ? " at-toggle-active" : "")
            }
            onClick={() => handleToggleView(true)}
          >
            Closed Tickets
          </button>
        </div>

        <div className="at-search-wrap">
          <input
            type="text"
            className="at-search-input"
            placeholder="Search by ID, store, owner, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="at-ticket-list">
          {listToShow.length === 0 ? (
            <div className="at-empty">
              {searchTerm
                ? "No tickets match your search."
                : viewClosed
                ? "No closed tickets yet."
                : "No open tickets."}
            </div>
          ) : (
            listToShow.map((t) => (
              <TicketRow
                key={t.id}
                ticket={t}
                active={selectedTicketId === t.id}
                onClick={() => {
                  setSelectedTicketId(t.id);
                  setActiveStoreTab("profile");
                  setQuerySaveMessage("");
                  setStoreSaveMessage("");
                }}
              />
            ))
          )}
        </div>
      </aside>

      {/* RIGHT: detail view */}
      <section className="at-right">
        {!selectedTicket ? (
          <div className="at-card at-no-selection">
            <div className="at-section-header">
              <h2>No ticket selected</h2>
              <p>Select a ticket on the left to view full details.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Top summary */}
            <div className="at-card at-top-overview">
              <div className="at-top-left">
                <div className="at-top-label">Selected Ticket</div>
                <div className="at-top-id">{selectedTicket.id}</div>
                <div className="at-top-store">
                  {storeForm.storeName} ({storeForm.storeId})
                </div>
                <div className="at-top-meta">
                  <span
                    className={`at-pill at-pill-${selectedTicket.priority.toLowerCase()}`}
                  >
                    {selectedTicket.priority} Priority
                  </span>
                  <span className="at-label">
                    Created: {selectedTicket.createdAt}
                  </span>
                  {viewClosed && (
                    <span className="at-label at-label-closed">
                      Closed Ticket
                    </span>
                  )}
                </div>
              </div>
              <div className="at-top-right">
                <div className="at-label">Status</div>
                <select
                  className="at-status-select"
                  value={selectedTicket.status}
                  onChange={handleStatusChange}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Escalated">Escalated</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="at-grid">
              {/* LEFT: Query + chat + save query */}
              <div className="at-col">
                {/* Query details */}
                <div className="at-card">
                  <div className="at-section-header">
                    <h2>Query Details</h2>
                    <p>Snapshot of what the store reported.</p>
                  </div>
                  <div className="at-query-text">
                    {selectedTicket.query || "No description available."}
                  </div>

                  <div className="at-owner-mini">
                    <div>
                      <div className="at-owner-label">Store Owner</div>
                      <div className="at-owner-name">
                        {storeForm.ownerName || "Not set"}
                      </div>
                    </div>
                    <div className="at-owner-contact">
                      <div>{storeForm.primaryPhone || "No contact"}</div>
                      <div>
                        {storeForm.ownerEmail || storeForm.contactEmail || ""}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat + Save Query Changes */}
                <div className="at-card at-chat-card">
                  <div className="at-section-header">
                    <h2>Chat with Store Owner</h2>
                    <p>Keep the conversation clear, simple and logged.</p>
                  </div>
                  <div className="at-chat-window">
                    {selectedTicket.chats.map((msg, i) => (
                      <ChatMessage key={i} from={msg.from} text={msg.text} />
                    ))}
                  </div>
                  <form
                    className="at-chat-input-row"
                    onSubmit={handleSendMessage}
                  >
                    <input
                      type="text"
                      name="message"
                      className="at-chat-input"
                      placeholder="Type a reply..."
                    />
                    <button type="submit" className="at-chat-send">
                      Send
                    </button>
                  </form>

                  <div className="at-query-actions">
                    <button
                      type="button"
                      className="at-btn-primary at-btn-save-query"
                      onClick={handleSaveQueryChanges}
                    >
                      Save Query Changes
                    </button>
                    {querySaveMessage && (
                      <div className="at-save-msg">{querySaveMessage}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: Store details with tabs */}
              <div className="at-col">
                <div className="at-card">
                  <div className="at-store-header">
                    <h2>Your Store Details</h2>
                    <p>
                      Last saved version of this store&apos;s settings. Edit
                      only after proper verification.
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="at-tabs">
                    <button
                      className={
                        "at-tab" +
                        (activeStoreTab === "profile"
                          ? " at-tab-active"
                          : "")
                      }
                      onClick={() => setActiveStoreTab("profile")}
                    >
                      Store Profile
                    </button>
                    <button
                      className={
                        "at-tab" +
                        (activeStoreTab === "operations"
                          ? " at-tab-active"
                          : "")
                      }
                      onClick={() => setActiveStoreTab("operations")}
                    >
                      Operations &amp; Hours
                    </button>
                    <button
                      className={
                        "at-tab" +
                        (activeStoreTab === "compliance"
                          ? " at-tab-active"
                          : "")
                      }
                      onClick={() => setActiveStoreTab("compliance")}
                    >
                      Compliance
                    </button>
                    <button
                      className={
                        "at-tab" +
                        (activeStoreTab === "notifications"
                          ? " at-tab-active"
                          : "")
                      }
                      onClick={() => setActiveStoreTab("notifications")}
                    >
                      Notifications
                    </button>
                    <button
                      className={
                        "at-tab" +
                        (activeStoreTab === "branding"
                          ? " at-tab-active"
                          : "")
                      }
                      onClick={() => setActiveStoreTab("branding")}
                    >
                      Branding
                    </button>
                  </div>

                  {/* --- TAB CONTENTS --- */}

                  {activeStoreTab === "profile" && storeForm && (
                    <>
                      <div className="at-form-block">
                        <div className="at-form-title">
                          Basic Information
                        </div>
                        <div className="at-form-grid">
                          <div className="at-field">
                            <label>Store Name</label>
                            <input
                              type="text"
                              value={storeForm.storeName}
                              onChange={(e) =>
                                updateStoreField(
                                  "storeName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="at-field">
                            <label>Legal Business Name</label>
                            <input
                              type="text"
                              value={storeForm.legalBusinessName}
                              onChange={(e) =>
                                updateStoreField(
                                  "legalBusinessName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="at-field">
                            <label>Owner / Manager</label>
                            <input
                              type="text"
                              value={storeForm.ownerName}
                              onChange={(e) =>
                                updateStoreField(
                                  "ownerName",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="at-field">
                            <label>Contact Email</label>
                            <input
                              type="email"
                              value={storeForm.contactEmail}
                              onChange={(e) =>
                                updateStoreField(
                                  "contactEmail",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="at-field">
                            <label>Primary Phone</label>
                            <input
                              type="text"
                              value={storeForm.primaryPhone}
                              onChange={(e) =>
                                updateStoreField(
                                  "primaryPhone",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="at-field">
                            <label>Alternate Phone</label>
                            <input
                              type="text"
                              value={storeForm.alternatePhone}
                              onChange={(e) =>
                                updateStoreField(
                                  "alternatePhone",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="at-field at-field-full">
                            <label>Description</label>
                            <input
                              type="text"
                              value={storeForm.description}
                              onChange={(e) =>
                                updateStoreField(
                                  "description",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="at-form-block">
                        <div className="at-form-title">
                          Location &amp; Address
                        </div>
                        <div className="at-form-grid">
                          <div className="at-field at-field-full">
                            <label>Address</label>
                            <input
                              type="text"
                              value={storeForm.addressLine1}
                              onChange={(e) =>
                                updateStoreField(
                                  "addressLine1",
                                  e.target.value
                                )
                              }
                              placeholder="Flat / Building / Street"
                            />
                          </div>
                          <div className="at-field at-field-full">
                            <label>Address Line 2</label>
                            <input
                              type="text"
                              value={storeForm.addressLine2}
                              onChange={(e) =>
                                updateStoreField(
                                  "addressLine2",
                                  e.target.value
                                )
                              }
                              placeholder="Area / Locality"
                            />
                          </div>
                          <div className="at-field">
                            <label>City</label>
                            <input
                              type="text"
                              value={storeForm.city}
                              onChange={(e) =>
                                updateStoreField(
                                  "city",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="at-field">
                            <label>PIN Code</label>
                            <input
                              type="text"
                              value={storeForm.pin}
                              onChange={(e) =>
                                updateStoreField(
                                  "pin",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="at-field">
                            <label>Landmark</label>
                            <input
                              type="text"
                              value={storeForm.landmark}
                              onChange={(e) =>
                                updateStoreField(
                                  "landmark",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="at-field">
                            <label>Google Maps URL</label>
                            <input
                              type="text"
                              value={storeForm.googleMapsUrl}
                              onChange={(e) =>
                                updateStoreField(
                                  "googleMapsUrl",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="at-location-preview">
                          <div className="at-location-label">
                            Location Preview (Saved)
                          </div>
                          <div className="at-location-text">
                            Use this with your Maps integration
                            to show a live preview.
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeStoreTab === "operations" && storeForm && (
                    <div className="at-form-block at-oh-block">
                      <div className="at-oh-header">
                        <div>
                          <div className="at-form-title">
                            Opening Hours
                          </div>
                        </div>
                        <div className="at-oh-pill">
                          Displayed on store profile
                        </div>
                      </div>

                      <div className="at-oh-table">
                        <div className="at-oh-row at-oh-head">
                          <div className="at-oh-col-day">Day</div>
                          <div className="at-oh-col-status">Status</div>
                          <div className="at-oh-col-time">Opens</div>
                          <div className="at-oh-col-time">Closes</div>
                        </div>

                        {storeForm.dailyHours.map((row, idx) => (
                          <div className="at-oh-row" key={row.dayKey}>
                            <div className="at-oh-col-day">
                              <span className="at-oh-day">
                                {row.label}
                              </span>
                            </div>
                            <div className="at-oh-col-status">
                              <label className="at-switch">
                                <input
                                  type="checkbox"
                                  checked={row.isOpen}
                                  onChange={(e) =>
                                    updateDailyHour(
                                      idx,
                                      "isOpen",
                                      e.target.checked
                                    )
                                  }
                                />
                                <span className="at-switch-slider" />
                              </label>
                              <span className="at-oh-status-label">
                                {row.isOpen ? "Open" : "Closed"}
                              </span>
                            </div>
                            <div className="at-oh-col-time">
                              <input
                                type="text"
                                className="at-oh-time-input"
                                value={row.open}
                                onChange={(e) =>
                                  updateDailyHour(
                                    idx,
                                    "open",
                                    e.target.value
                                  )
                                }
                                disabled={!row.isOpen}
                              />
                            </div>
                            <div className="at-oh-col-time">
                              <input
                                type="text"
                                className="at-oh-time-input"
                                value={row.close}
                                onChange={(e) =>
                                  updateDailyHour(
                                    idx,
                                    "close",
                                    e.target.value
                                  )
                                }
                                disabled={!row.isOpen}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeStoreTab === "compliance" && storeForm && (
                    <div className="at-form-block">
                      <div className="at-form-title">
                        Compliance
                      </div>
                      <div className="at-form-grid">
                        <div className="at-field">
                          <label>License Number</label>
                          <input
                            type="text"
                            value={storeForm.licenseNumber}
                            onChange={(e) =>
                              updateStoreField(
                                "licenseNumber",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="at-field">
                          <label>GST Number</label>
                          <input
                            type="text"
                            value={storeForm.gstNumber}
                            onChange={(e) =>
                              updateStoreField(
                                "gstNumber",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="at-field at-field-full">
                          <label>Compliance Notes</label>
                          <input
                            type="text"
                            value={storeForm.complianceNotes}
                            onChange={(e) =>
                              updateStoreField(
                                "complianceNotes",
                                e.target.value
                              )
                            }
                            placeholder="Internal remarks for this store."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStoreTab === "notifications" && storeForm && (
                    <div className="at-form-block">
                      <div className="at-form-title">
                        Notifications
                      </div>
                      <div className="at-form-grid">
                        <div className="at-field at-field-full">
                          <label>Notification Email</label>
                          <input
                            type="email"
                            value={storeForm.notificationEmail}
                            onChange={(e) =>
                              updateStoreField(
                                "notificationEmail",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="at-field at-field-full">
                          <label>
                            Notification Phone (SMS / WhatsApp)
                          </label>
                          <input
                            type="text"
                            value={storeForm.notificationSmsNumber}
                            onChange={(e) =>
                              updateStoreField(
                                "notificationSmsNumber",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                      <div className="at-notes">
                        These contacts are used when your
                        notification service is connected.
                      </div>
                    </div>
                  )}

                  {activeStoreTab === "branding" && storeForm && (
                    <div className="at-form-block">
                      <div className="at-form-title">
                        Branding
                      </div>
                      <div className="at-form-grid">
                        <div className="at-field at-field-full">
                          <label>
                            Display Name on MediFind
                          </label>
                          <input
                            type="text"
                            value={storeForm.brandingName}
                            onChange={(e) =>
                              updateStoreField(
                                "brandingName",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="at-field">
                          <label>
                            Primary Brand Color
                          </label>
                          <input
                            type="text"
                            value={storeForm.brandingColor}
                            onChange={(e) =>
                              updateStoreField(
                                "brandingColor",
                                e.target.value
                              )
                            }
                            placeholder="#111827"
                          />
                        </div>
                        <div className="at-field at-field-full">
                          <label>Branding Notes</label>
                          <input
                            type="text"
                            value={storeForm.brandingNotes}
                            onChange={(e) =>
                              updateStoreField(
                                "brandingNotes",
                                e.target.value
                              )
                            }
                            placeholder="Logo, badges, tags, etc."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Store actions */}
                  <div className="at-form-actions">
                    <button
                      type="button"
                      className="at-btn-outline"
                      onClick={handleResetStore}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="at-btn-primary"
                      onClick={handleSaveStoreDetails}
                    >
                      Save Changes
                    </button>
                  </div>
                  {storeSaveMessage && (
                    <div className="at-save-store-msg">
                      {storeSaveMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
