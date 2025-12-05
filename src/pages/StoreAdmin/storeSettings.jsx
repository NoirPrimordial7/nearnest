// src/pages/StoreAdmin/StoreSettings.jsx
import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";
import "./storesettings.css";
import {
  Store,
  ShieldCheck,
  Bell,
  Palette,
  Clock,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Default structures
const DEFAULT_PROFILE = {
  storeName: "MediFind Pharmacy",
  legalName: "",
  ownerName: "",
  email: "",
  phone: "",
  altPhone: "",
  description: "",
};

const DEFAULT_ADDRESS = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  googleMapsUrl: "",
};

const DEFAULT_HOURS = DAYS.map((day) => ({
  day,
  open: !["Sun"].includes(day),
  from: "09:00",
  to: "21:00",
}));

const DEFAULT_COMPLIANCE = {
  licenseNumber: "",
  licenseExpiry: "",
  gstin: "",
  narcoticsAllowed: false,
  onlineConsultation: false,
};

const DEFAULT_PREFERENCES = {
  allowOnlineOrders: true,
  allowHomeDelivery: true,
  deliveryRadiusKm: 5,
  lowStockAlerts: true,
  expiringStockAlerts: true,
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: true,
};

const DEFAULT_BRANDING = {
  theme: "dark",
  primaryColor: "#3b82f6",
};

export default function StoreSettings() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // ===== Saved state (for preview only) =====
  const [savedProfile, setSavedProfile] = useState(DEFAULT_PROFILE);
  const [savedAddress, setSavedAddress] = useState(DEFAULT_ADDRESS);
  const [savedHours, setSavedHours] = useState(DEFAULT_HOURS);
  const [savedCompliance, setSavedCompliance] = useState(DEFAULT_COMPLIANCE);
  const [savedPreferences, setSavedPreferences] =
    useState(DEFAULT_PREFERENCES);
  const [savedBranding, setSavedBranding] = useState(DEFAULT_BRANDING);
  const [savedLogoPreview, setSavedLogoPreview] = useState(null);

  // ===== Draft state (editable form) =====
  const [draftProfile, setDraftProfile] = useState(DEFAULT_PROFILE);
  const [draftAddress, setDraftAddress] = useState(DEFAULT_ADDRESS);
  const [draftHours, setDraftHours] = useState(DEFAULT_HOURS);
  const [draftCompliance, setDraftCompliance] =
    useState(DEFAULT_COMPLIANCE);
  const [draftPreferences, setDraftPreferences] =
    useState(DEFAULT_PREFERENCES);
  const [draftBranding, setDraftBranding] = useState(DEFAULT_BRANDING);
  const [logoFile, setLogoFile] = useState(null);
  const [draftLogoPreview, setDraftLogoPreview] = useState(null);

  /* ========= Handlers for DRAFT (form) ========= */
  const handleProfileChange = (field, value) => {
    setDraftProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setDraftAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleComplianceChange = (field, value) => {
    setDraftCompliance((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferencesChange = (field, value) => {
    setDraftPreferences((prev) => ({ ...prev, [field]: value }));
  };

  const handleBrandingChange = (field, value) => {
    setDraftBranding((prev) => ({ ...prev, [field]: value }));
  };

  const handleHourToggle = (index) => {
    setDraftHours((prev) =>
      prev.map((h, i) =>
        i === index
          ? {
              ...h,
              open: !h.open,
            }
          : h
      )
    );
  };

  const handleHourTimeChange = (index, field, value) => {
    setDraftHours((prev) =>
      prev.map((h, i) =>
        i === index
          ? {
              ...h,
              [field]: value,
            }
          : h
      )
    );
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (draftLogoPreview) URL.revokeObjectURL(draftLogoPreview);
    const url = URL.createObjectURL(file);
    setLogoFile(file);
    setDraftLogoPreview(url); // only draft; preview uses savedLogoPreview when saved
  };

  /* ---------- Google Maps embed helper ---------- */
  const getEmbedUrl = (raw) => {
    if (!raw) return "";
    const value = raw.trim();

    // 1) Full iframe HTML: <iframe src="..."></iframe>
    if (value.toLowerCase().startsWith("<iframe")) {
      const match = value.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        return match[1];
      }
    }

    // 2) Already an embed URL
    if (value.includes("/maps/embed") || value.includes("output=embed")) {
      return value;
    }

    // 3) Short links
    if (value.includes("maps.app.goo.gl") || value.includes("goo.gl/maps")) {
      return `https://www.google.com/maps?q=${encodeURIComponent(
        value
      )}&output=embed`;
    }

    // 4) Other google.com/maps links
    if (value.includes("google.com/maps")) {
      return `https://www.google.com/maps?q=${encodeURIComponent(
        value
      )}&output=embed`;
    }

    // 5) Fallback: treat as plain address text
    return `https://www.google.com/maps?q=${encodeURIComponent(
      value
    )}&output=embed`;
  };

  /* ========= Validation (on DRAFT) ========= */
  const errors = [];
  if (!draftProfile.storeName.trim()) errors.push("Store name is required.");
  if (!draftProfile.phone.trim()) errors.push("Primary phone number is required.");
  if (!draftProfile.email.trim()) errors.push("Contact email is required.");
  if (!draftCompliance.licenseNumber.trim())
    errors.push("Pharmacy license number is required.");

  /* ========= Save: copy draft -> saved, update preview ========= */
  const handleSave = async () => {
    if (errors.length) {
      setToast(errors[0]);
      setTimeout(() => setToast(""), 2500);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        profile: draftProfile,
        address: draftAddress,
        hours: draftHours,
        compliance: draftCompliance,
        preferences: draftPreferences,
        branding: draftBranding,
        hasLogo: !!logoFile,
        updatedAt: new Date().toISOString(),
      };

      console.log("STORE_SETTINGS_SAVE (no localStorage yet)", payload);

      // Update SAVED states (used by preview)
      setSavedProfile(draftProfile);
      setSavedAddress(draftAddress);
      setSavedHours(draftHours);
      setSavedCompliance(draftCompliance);
      setSavedPreferences(draftPreferences);
      setSavedBranding(draftBranding);
      setSavedLogoPreview(draftLogoPreview || null);

      // 🔜 Later, when you hook Firebase:
      // await setDoc(doc(db, "stores", user.uid), payload, { merge: true });

      setToast("✅ Store settings saved successfully");
      setTimeout(() => setToast(""), 2600);
    } finally {
      setSaving(false);
    }
  };

  const formatBool = (val) => (val ? "Enabled" : "Disabled");
  const formatYesNo = (val) => (val ? "Yes" : "No");

  return (
    <div className="settings-root dark">
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
          <div className="settings-container">
            {/* Header */}
            <header className="settings-head">
              <div className="title-block">
                <h1>
                  <Store size={20} />
                  Store Profile & Settings
                </h1>
                <p>
                  Manage how your pharmacy appears to customers and how it
                  operates on the platform.
                </p>
              </div>
              <div className="store-meta">
                <span className="meta-pill">Store ID: MF-001</span>
                <span className="meta-pill subtle">Status: Live</span>
              </div>
            </header>

            {/* Tabs for EDITABLE form */}
            <nav className="settings-tabs">
              <button
                className={`settings-tab ${
                  activeTab === "profile" ? "active" : ""
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <Store size={16} />
                <span>Store Profile</span>
              </button>
              <button
                className={`settings-tab ${
                  activeTab === "operations" ? "active" : ""
                }`}
                onClick={() => setActiveTab("operations")}
              >
                <Clock size={16} />
                <span>Operations & Hours</span>
              </button>
              <button
                className={`settings-tab ${
                  activeTab === "compliance" ? "active" : ""
                }`}
                onClick={() => setActiveTab("compliance")}
              >
                <ShieldCheck size={16} />
                <span>Compliance</span>
              </button>
              <button
                className={`settings-tab ${
                  activeTab === "notifications" ? "active" : ""
                }`}
                onClick={() => setActiveTab("notifications")}
              >
                <Bell size={16} />
                <span>Notifications</span>
              </button>
              <button
                className={`settings-tab ${
                  activeTab === "branding" ? "active" : ""
                }`}
                onClick={() => setActiveTab("branding")}
              >
                <Palette size={16} />
                <span>Branding</span>
              </button>
            </nav>

            {/* ================== EDITABLE TABS (DRAFT) ================== */}
            {activeTab === "profile" && (
              <section className="settings-grid">
                {/* Basic Profile */}
                <div className="settings-card">
                  <div className="card-head">
                    <h3>Basic Information</h3>
                    <span className="badge-soft">Required</span>
                  </div>
                  <div className="card-body form-grid">
                    <label className="form-field">
                      <span className="label">Store Name *</span>
                      <input
                        className="input"
                        value={draftProfile.storeName}
                        onChange={(e) =>
                          handleProfileChange("storeName", e.target.value)
                        }
                        placeholder="Enter public store name"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">Legal Business Name</span>
                      <input
                        className="input"
                        value={draftProfile.legalName}
                        onChange={(e) =>
                          handleProfileChange("legalName", e.target.value)
                        }
                        placeholder="Registered legal name"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">Owner / Manager Name</span>
                      <input
                        className="input"
                        value={draftProfile.ownerName}
                        onChange={(e) =>
                          handleProfileChange("ownerName", e.target.value)
                        }
                        placeholder="Primary contact person"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">
                        <Mail size={14} /> Contact Email *
                      </span>
                      <input
                        className="input"
                        value={draftProfile.email}
                        onChange={(e) =>
                          handleProfileChange("email", e.target.value)
                        }
                        placeholder="owner@medifindpharmacy.com"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">
                        <Phone size={14} /> Primary Phone *
                      </span>
                      <input
                        className="input"
                        value={draftProfile.phone}
                        onChange={(e) =>
                          handleProfileChange("phone", e.target.value)
                        }
                        placeholder="+91 98765 43210"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">Alternate Phone</span>
                      <input
                        className="input"
                        value={draftProfile.altPhone}
                        onChange={(e) =>
                          handleProfileChange("altPhone", e.target.value)
                        }
                        placeholder="Secondary contact number"
                      />
                    </label>
                    <label className="form-field full">
                      <span className="label">Short Description</span>
                      <textarea
                        className="textarea"
                        rows={3}
                        value={draftProfile.description}
                        onChange={(e) =>
                          handleProfileChange("description", e.target.value)
                        }
                        placeholder="Describe your pharmacy, specialties (e.g., chronic care, pediatrics, ayurveda)…"
                      />
                    </label>
                  </div>
                </div>

                {/* Address */}
                <div className="settings-card">
                  <div className="card-head">
                    <h3>Location & Address</h3>
                    <span className="badge-soft">
                      <MapPin size={12} /> Visible to customers
                    </span>
                  </div>
                  <div className="card-body form-grid">
                    <label className="form-field full">
                      <span className="label">Address Line 1</span>
                      <input
                        className="input"
                        value={draftAddress.line1}
                        onChange={(e) =>
                          handleAddressChange("line1", e.target.value)
                        }
                        placeholder="Shop number, building, street"
                      />
                    </label>
                    <label className="form-field full">
                      <span className="label">Address Line 2</span>
                      <input
                        className="input"
                        value={draftAddress.line2}
                        onChange={(e) =>
                          handleAddressChange("line2", e.target.value)
                        }
                        placeholder="Area, locality"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">City</span>
                      <input
                        className="input"
                        value={draftAddress.city}
                        onChange={(e) =>
                          handleAddressChange("city", e.target.value)
                        }
                        placeholder="City"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">State</span>
                      <input
                        className="input"
                        value={draftAddress.state}
                        onChange={(e) =>
                          handleAddressChange("state", e.target.value)
                        }
                        placeholder="State"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">Pincode</span>
                      <input
                        className="input"
                        value={draftAddress.pincode}
                        onChange={(e) =>
                          handleAddressChange("pincode", e.target.value)
                        }
                        placeholder="Pincode"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">Landmark</span>
                      <input
                        className="input"
                        value={draftAddress.landmark}
                        onChange={(e) =>
                          handleAddressChange("landmark", e.target.value)
                        }
                        placeholder="Nearby hospital, junction, etc."
                      />
                    </label>

                    <label className="form-field full">
                      <span className="label">
                        <MapPin size={14} /> Google Maps Location URL
                      </span>
                      <input
                        className="input"
                        value={draftAddress.googleMapsUrl}
                        onChange={(e) =>
                          handleAddressChange(
                            "googleMapsUrl",
                            e.target.value
                          )
                        }
                        placeholder="Paste Google Maps share link, embed link, or plain address"
                      />
                      <p className="hint">
                        Paste any Google Maps link or address. We’ll convert it
                        into an embeddable map automatically.
                      </p>
                    </label>

                    <div className="map-placeholder">
                      <div className="map-header">
                        <MapPin size={14} />
                        <span>Location Preview (Draft)</span>
                      </div>

                      {draftAddress.googleMapsUrl ? (
                        <>
                          <p className="hint">
                            Embedded map based on your draft URL:
                          </p>
                          <div className="map-embed-wrapper">
                            <iframe
                              src={getEmbedUrl(
                                draftAddress.googleMapsUrl
                              )}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              allowFullScreen
                              title="Store location draft"
                            />
                          </div>
                        </>
                      ) : (
                        <p>
                          Add a Google Maps URL or address above to preview your
                          draft location here.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "operations" && (
              <section className="settings-grid">
                {/* Opening hours */}
                <div className="settings-card full-width">
                  <div className="card-head">
                    <h3>Opening Hours</h3>
                    <span className="badge-soft">
                      <Clock size={12} /> Displayed on store profile
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="hours-table">
                      <div className="hours-header">
                        <span>Day</span>
                        <span>Status</span>
                        <span>Opens</span>
                        <span>Closes</span>
                      </div>
                      {draftHours.map((h, i) => (
                        <div key={h.day} className="hours-row">
                          <span className="day">{h.day}</span>
                          <span>
                            <label className="toggle">
                              <input
                                type="checkbox"
                                checked={h.open}
                                onChange={() => handleHourToggle(i)}
                              />
                              <span className="slider" />
                              <span className="toggle-label">
                                {h.open ? "Open" : "Closed"}
                              </span>
                            </label>
                          </span>
                          <span>
                            <input
                              type="time"
                              className="input time-input"
                              disabled={!h.open}
                              value={h.from}
                              onChange={(e) =>
                                handleHourTimeChange(
                                  i,
                                  "from",
                                  e.target.value
                                )
                              }
                            />
                          </span>
                          <span>
                            <input
                              type="time"
                              className="input time-input"
                              disabled={!h.open}
                              value={h.to}
                              onChange={(e) =>
                                handleHourTimeChange(
                                  i,
                                  "to",
                                  e.target.value
                                )
                              }
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Orders & delivery */}
                <div className="settings-card">
                  <div className="card-head">
                    <h3>Order & Delivery Settings</h3>
                  </div>
                  <div className="card-body form-grid">
                    <div className="form-field full">
                      <label className="toggle large">
                        <input
                          type="checkbox"
                          checked={draftPreferences.allowOnlineOrders}
                          onChange={(e) =>
                            handlePreferencesChange(
                              "allowOnlineOrders",
                              e.target.checked
                            )
                          }
                        />
                        <span className="slider" />
                        <span className="toggle-label">
                          Enable online orders
                        </span>
                      </label>
                      <p className="hint">
                        Allow customers to place medicine orders from the mobile
                        app.
                      </p>
                    </div>

                    <div className="form-field full">
                      <label className="toggle large">
                        <input
                          type="checkbox"
                          checked={draftPreferences.allowHomeDelivery}
                          onChange={(e) =>
                            handlePreferencesChange(
                              "allowHomeDelivery",
                              e.target.checked
                            )
                          }
                        />
                        <span className="slider" />
                        <span className="toggle-label">
                          Enable home delivery
                        </span>
                      </label>
                    </div>

                    {draftPreferences.allowHomeDelivery && (
                      <label className="form-field">
                        <span className="label">Delivery radius (km)</span>
                        <input
                          type="number"
                          min={1}
                          className="input"
                          value={draftPreferences.deliveryRadiusKm}
                          onChange={(e) =>
                            handlePreferencesChange(
                              "deliveryRadiusKm",
                              Number(e.target.value)
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "compliance" && (
              <section className="settings-grid">
                <div className="settings-card">
                  <div className="card-head">
                    <h3>Pharmacy Compliance</h3>
                    <span className="badge-soft critical">
                      <ShieldCheck size={12} /> Required for verification
                    </span>
                  </div>
                  <div className="card-body form-grid">
                    <label className="form-field">
                      <span className="label">
                        Pharmacy License Number *
                      </span>
                      <input
                        className="input"
                        value={draftCompliance.licenseNumber}
                        onChange={(e) =>
                          handleComplianceChange(
                            "licenseNumber",
                            e.target.value
                          )
                        }
                        placeholder="License number as per authority"
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">License Expiry Date</span>
                      <input
                        type="date"
                        className="input"
                        value={draftCompliance.licenseExpiry}
                        onChange={(e) =>
                          handleComplianceChange(
                            "licenseExpiry",
                            e.target.value
                          )
                        }
                      />
                    </label>
                    <label className="form-field">
                      <span className="label">GSTIN</span>
                      <input
                        className="input"
                        value={draftCompliance.gstin}
                        onChange={(e) =>
                          handleComplianceChange("gstin", e.target.value)
                        }
                        placeholder="Optional GST number"
                      />
                    </label>
                    <div className="form-field full">
                      <label className="toggle large">
                        <input
                          type="checkbox"
                          checked={draftCompliance.narcoticsAllowed}
                          onChange={(e) =>
                            handleComplianceChange(
                              "narcoticsAllowed",
                              e.target.checked
                            )
                          }
                        />
                        <span className="slider" />
                        <span className="toggle-label">
                          Store dispenses controlled / narcotic medicines
                        </span>
                      </label>
                      <p className="hint">
                        If enabled, additional verification may be required as
                        per regulation.
                      </p>
                    </div>
                    <div className="form-field full">
                      <label className="toggle large">
                        <input
                          type="checkbox"
                          checked={draftCompliance.onlineConsultation}
                          onChange={(e) =>
                            handleComplianceChange(
                              "onlineConsultation",
                              e.target.checked
                            )
                          }
                        />
                        <span className="slider" />
                        <span className="toggle-label">
                          Offers online doctor consultation in partnership
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "notifications" && (
              <section className="settings-grid">
                <div className="settings-card">
                  <div className="card-head">
                    <h3>Inventory Alerts</h3>
                  </div>
                  <div className="card-body form-grid">
                    <div className="form-field full">
                      <label className="toggle large">
                        <input
                          type="checkbox"
                          checked={draftPreferences.lowStockAlerts}
                          onChange={(e) =>
                            handlePreferencesChange(
                              "lowStockAlerts",
                              e.target.checked
                            )
                          }
                        />
                        <span className="slider" />
                        <span className="toggle-label">
                          Low stock alerts
                        </span>
                      </label>
                      <p className="hint">
                        Get notified when quantity falls below your configured
                        threshold.
                      </p>
                    </div>
                    <div className="form-field full">
                      <label className="toggle large">
                        <input
                          type="checkbox"
                          checked={draftPreferences.expiringStockAlerts}
                          onChange={(e) =>
                            handlePreferencesChange(
                              "expiringStockAlerts",
                              e.target.checked
                            )
                          }
                        />
                        <span className="slider" />
                        <span className="toggle-label">
                          Expiring stock alerts
                        </span>
                      </label>
                      <p className="hint">
                        Get alerts for batches that are nearing expiry so you
                        can act early.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="card-head">
                    <h3>Notification Channels</h3>
                  </div>
                  <div className="card-body form-grid">
                    <div className="form-field full">
                      <label className="toggle large">
                        <input
                          type="checkbox"
                          checked={draftPreferences.emailNotifications}
                          onChange={(e) =>
                            handlePreferencesChange(
                              "emailNotifications",
                              e.target.checked
                            )
                          }
                        />
                        <span className="slider" />
                        <span className="toggle-label">
                          Email notifications
                        </span>
                      </label>
                    </div>
                    <div className="form-field full">
                      <label className="toggle large">
                        <input
                          type="checkbox"
                          checked={draftPreferences.smsNotifications}
                          onChange={(e) =>
                            handlePreferencesChange(
                              "smsNotifications",
                              e.target.checked
                            )
                          }
                        />
                        <span className="slider" />
                        <span className="toggle-label">
                          SMS notifications
                        </span>
                      </label>
                    </div>
                    <div className="form-field full">
                      <label className="toggle large">
                        <input
                          type="checkbox"
                          checked={draftPreferences.whatsappNotifications}
                          onChange={(e) =>
                            handlePreferencesChange(
                              "whatsappNotifications",
                              e.target.checked
                            )
                          }
                        />
                        <span className="slider" />
                        <span className="toggle-label">
                          WhatsApp alerts
                        </span>
                      </label>
                      <p className="hint">
                        Ensure your WhatsApp number is the same as the primary
                        phone above.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "branding" && (
              <section className="settings-grid">
                <div className="settings-card">
                  <div className="card-head">
                    <h3>Store Branding</h3>
                  </div>
                  <div className="card-body form-grid">
                    {/* Logo (draft) */}
                    <div className="form-field full">
                      <span className="label">Store Logo (Draft)</span>
                      <div className="logo-row">
                        <div className="logo-preview">
                          {draftLogoPreview ? (
                            <img src={draftLogoPreview} alt="Store logo draft" />
                          ) : (
                            <div className="logo-placeholder">
                              <ImageIcon size={18} />
                              <span>Upload logo</span>
                            </div>
                          )}
                        </div>
                        <label className="btn secondary">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleLogoChange}
                          />
                        </label>
                      </div>
                      <p className="hint">
                        Recommended: square logo, 512×512px, PNG with
                        transparent background.
                      </p>
                    </div>

                    {/* Theme */}
                    <div className="form-field">
                      <span className="label">Theme</span>
                      <div className="theme-options">
                        <label
                          className={`theme-chip ${
                            draftBranding.theme === "dark" ? "active" : ""
                          }`}
                          onClick={() =>
                            handleBrandingChange("theme", "dark")
                          }
                        >
                          <span className="dot dark" />
                          Dark
                        </label>
                        <label
                          className={`theme-chip ${
                            draftBranding.theme === "light" ? "active" : ""
                          }`}
                          onClick={() =>
                            handleBrandingChange("theme", "light")
                          }
                        >
                          <span className="dot light" />
                          Light
                        </label>
                      </div>
                    </div>

                    {/* Color */}
                    <div className="form-field">
                      <span className="label">Primary Accent Color</span>
                      <span className="label">Sorry, This feature is currently unavailable.</span>
                      <div className="color-row">
                        <input
                          type="color"
                          className="color-input"
                          value={draftBranding.primaryColor}
                          onChange={(e) =>
                            handleBrandingChange(
                              "primaryColor",
                              e.target.value
                            )
                          }
                        />
                        <input
                          className="input"
                          value={draftBranding.primaryColor}
                          onChange={(e) =>
                            handleBrandingChange(
                              "primaryColor",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <p className="hint">
                        Used for buttons and highlights in your store admin
                        experience.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ================== READ-ONLY PREVIEW (SAVED) ================== */}
            <section className="settings-preview">
              <header className="preview-head">
                <div>
                  <h2>Your Store Details</h2>
                  <p>
                    This shows the last <strong>saved</strong> version of your
                    settings. Edit above and click <b>Save Changes</b> to
                    update this preview.
                  </p>
                </div>
              </header>

              {/* Tabs for preview (same activeTab) */}
              <nav className="settings-tabs preview-tabs">
                <button
                  className={`settings-tab ${
                    activeTab === "profile" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("profile")}
                >
                  <Store size={16} />
                  <span>Store Profile</span>
                </button>
                <button
                  className={`settings-tab ${
                    activeTab === "operations" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("operations")}
                >
                  <Clock size={16} />
                  <span>Operations & Hours</span>
                </button>
                <button
                  className={`settings-tab ${
                    activeTab === "compliance" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("compliance")}
                >
                  <ShieldCheck size={16} />
                  <span>Compliance</span>
                </button>
                <button
                  className={`settings-tab ${
                    activeTab === "notifications" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell size={16} />
                  <span>Notifications</span>
                </button>
                <button
                  className={`settings-tab ${
                    activeTab === "branding" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("branding")}
                >
                  <Palette size={16} />
                  <span>Branding</span>
                </button>
              </nav>

              {/* PREVIEW CONTENT BY TAB (uses SAVED state) */}
              {activeTab === "profile" && (
                <section className="settings-grid preview-grid">
                  <div className="settings-card">
                    <div className="card-head">
                      <h3>Basic Information</h3>
                    </div>
                    <div className="card-body preview-body">
                      <div className="preview-field">
                        <span className="label">Store Name</span>
                        <p className="value">
                          {savedProfile.storeName || "Not set"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">Legal Business Name</span>
                        <p className="value">
                          {savedProfile.legalName || "Not set"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">Owner / Manager</span>
                        <p className="value">
                          {savedProfile.ownerName || "Not set"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">Contact Email</span>
                        <p className="value">
                          {savedProfile.email || "Not set"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">Primary Phone</span>
                        <p className="value">
                          {savedProfile.phone || "Not set"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">Alternate Phone</span>
                        <p className="value">
                          {savedProfile.altPhone || "Not provided"}
                        </p>
                      </div>
                      <div className="preview-field full">
                        <span className="label">Description</span>
                        <p className="value multiline">
                          {savedProfile.description ||
                            "No description added yet."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="card-head">
                      <h3>Location & Address</h3>
                    </div>
                    <div className="card-body preview-body">
                      <div className="preview-field full">
                        <span className="label">Address</span>
                        <p className="value multiline">
                          {[
                            savedAddress.line1,
                            savedAddress.line2,
                            savedAddress.city,
                            savedAddress.state,
                            savedAddress.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Not set"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">Landmark</span>
                        <p className="value">
                          {savedAddress.landmark || "Not provided"}
                        </p>
                      </div>
                      <div className="preview-field full">
                        <span className="label">Google Maps URL</span>
                        <p className="value small">
                          {savedAddress.googleMapsUrl || "Not added"}
                        </p>
                      </div>

                      <div className="map-placeholder compact">
                        <div className="map-header">
                          <MapPin size={14} />
                          <span>Location Preview (Saved)</span>
                        </div>
                        {savedAddress.googleMapsUrl ? (
                          <div className="map-embed-wrapper small">
                            <iframe
                              src={getEmbedUrl(savedAddress.googleMapsUrl)}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              allowFullScreen
                              title="Store location preview"
                            />
                          </div>
                        ) : (
                          <p className="hint">
                            Save a Google Maps URL in the form above to see a
                            mini preview here.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "operations" && (
                <section className="settings-grid preview-grid">
                  <div className="settings-card full-width">
                    <div className="card-head">
                      <h3>Opening Hours</h3>
                    </div>
                    <div className="card-body">
                      <div className="hours-table preview-hours">
                        <div className="hours-header">
                          <span>Day</span>
                          <span>Status</span>
                          <span>Opens</span>
                          <span>Closes</span>
                        </div>
                        {savedHours.map((h) => (
                          <div key={h.day} className="hours-row">
                            <span className="day">{h.day}</span>
                            <span>
                              <span
                                className={`status-pill tiny ${
                                  h.open ? "success" : "muted"
                                }`}
                              >
                                {h.open ? "Open" : "Closed"}
                              </span>
                            </span>
                            <span>{h.open ? h.from : "—"}</span>
                            <span>{h.open ? h.to : "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="card-head">
                      <h3>Orders & Delivery</h3>
                    </div>
                    <div className="card-body preview-body">
                      <div className="preview-field">
                        <span className="label">Online Orders</span>
                        <p className="value">
                          {formatBool(savedPreferences.allowOnlineOrders)}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">Home Delivery</span>
                        <p className="value">
                          {formatBool(savedPreferences.allowHomeDelivery)}
                        </p>
                      </div>
                      {savedPreferences.allowHomeDelivery && (
                        <div className="preview-field">
                          <span className="label">Delivery Radius</span>
                          <p className="value">
                            {savedPreferences.deliveryRadiusKm || 0} km
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "compliance" && (
                <section className="settings-grid preview-grid">
                  <div className="settings-card">
                    <div className="card-head">
                      <h3>Compliance Summary</h3>
                    </div>
                    <div className="card-body preview-body">
                      <div className="preview-field">
                        <span className="label">License Number</span>
                        <p className="value">
                          {savedCompliance.licenseNumber || "Not set"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">License Expiry</span>
                        <p className="value">
                          {savedCompliance.licenseExpiry || "Not set"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">GSTIN</span>
                        <p className="value">
                          {savedCompliance.gstin || "Not provided"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">
                          Dispenses Controlled Medicines
                        </span>
                        <p className="value">
                          {formatYesNo(savedCompliance.narcoticsAllowed)}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">
                          Offers Online Consultation
                        </span>
                        <p className="value">
                          {formatYesNo(savedCompliance.onlineConsultation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "notifications" && (
                <section className="settings-grid preview-grid">
                  <div className="settings-card">
                    <div className="card-head">
                      <h3>Alert Settings</h3>
                    </div>
                    <div className="card-body preview-body">
                      <div className="preview-field">
                        <span className="label">Low Stock Alerts</span>
                        <p className="value">
                          {formatBool(savedPreferences.lowStockAlerts)}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">Expiring Stock Alerts</span>
                        <p className="value">
                          {formatBool(savedPreferences.expiringStockAlerts)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="settings-card">
                    <div className="card-head">
                      <h3>Notification Channels</h3>
                    </div>
                    <div className="card-body preview-body">
                      <div className="preview-field">
                        <span className="label">Email</span>
                        <p className="value">
                          {formatBool(savedPreferences.emailNotifications)}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">SMS</span>
                        <p className="value">
                          {formatBool(savedPreferences.smsNotifications)}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">WhatsApp</span>
                        <p className="value">
                          {formatBool(savedPreferences.whatsappNotifications)}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "branding" && (
                <section className="settings-grid preview-grid">
                  <div className="settings-card">
                    <div className="card-head">
                      <h3>Branding Preview</h3>
                    </div>
                    <div className="card-body preview-body branding-preview">
                      <div className="preview-field full">
                        <span className="label">Logo</span>
                        <div className="logo-preview static">
                          {savedLogoPreview ? (
                            <img src={savedLogoPreview} alt="Store logo" />
                          ) : (
                            <div className="logo-placeholder">
                              <ImageIcon size={18} />
                              <span>No logo uploaded (saved)</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="preview-field">
                        <span className="label">Theme</span>
                        <p className="value">
                          {savedBranding.theme === "dark" ? "Dark" : "Light"}
                        </p>
                      </div>
                      <div className="preview-field">
                        <span className="label">Primary Color</span>
                        <div className="color-chip">
                          <span
                            className="color-dot"
                            style={{ background: savedBranding.primaryColor }}
                          />
                          <span className="value">
                            {savedBranding.primaryColor}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </section>

            {/* Sticky footer actions */}
            <footer className="settings-actions">
              <div className="errors">
                {errors.map((e, i) => (
                  <div key={i} className="error">
                    <AlertCircle size={14} /> <span>{e}</span>
                  </div>
                ))}
              </div>
              <div className="right">
                <button
                  className="btn ghost"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </button>
                <button
                  className="btn primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </footer>

            {toast && (
              <div className="settings-toast">
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
