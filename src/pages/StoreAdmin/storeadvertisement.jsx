import React, { useMemo, useRef, useState } from "react";
import "./storeadvertisement.css";
import {
  UploadCloud,
  Trash2,
  Link as LinkIcon,
  CalendarDays,
  Clock,
  Target,
  Image as ImageIcon,
  Video as VideoIcon,
  File as FileIcon,
  CheckCircle2,
  Megaphone,
  Info,
  AlertCircle,
} from "lucide-react";

/* ============ helpers ============ */
const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(3, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const PLACEMENTS = [
  { value: "home_banner", label: "Home Banner (Top)", hint: "Best for offers; 16:9 or 4:3." },
  { value: "in_feed", label: "In-Feed Card", hint: "Medium impact; 1:1 or 4:5." },
  { value: "interstitial", label: "Fullscreen Interstitial", hint: "High impact; 9:16." },
];

const OBJECTIVES = [
  { value: "awareness", label: "Brand Awareness" },
  { value: "promotion", label: "Promotion / Offer" },
  { value: "product_launch", label: "Product Launch" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ============ component ============ */
export default function StoreAdvertisement() {
  // basics
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("promotion");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [destination, setDestination] = useState("");

  // placement & tags
  const [placement, setPlacement] = useState("home_banner");
  const [tags, setTags] = useState(["Pharmacy", "Offer"]);

  // geo targeting
  const [geoTarget, setGeoTarget] = useState("all"); // all | nearby
  const [radiusKm, setRadiusKm] = useState(5);

  // schedule
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeFrom, setTimeFrom] = useState("08:00");
  const [timeTo, setTimeTo] = useState("22:00");
  const [activeDays, setActiveDays] = useState(new Set(DAYS));
  const [freqCap, setFreqCap] = useState(3);

  // files
  const [files, setFiles] = useState([]); // { file,url,kind,name,size }
  const dropRef = useRef(null);
  const inputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  // live ads list (stateful + append on submit)
  const [liveAds, setLiveAds] = useState([
    {
      id: "AD-001",
      title: "Monsoon Flat 15% Off",
      placement: "Home Banner (Top)",
      status: "Live",
      dateFrom: "2025-06-01",
      dateTo: "2025-06-15",
      objective: "Promotion / Offer",
      tags: ["Offer", "Monsoon"],
    },
    {
      id: "AD-002",
      title: "Ayurveda Wellness Week",
      placement: "In-Feed Card",
      status: "Scheduled",
      dateFrom: "2025-06-20",
      dateTo: "2025-06-27",
      objective: "Brand Awareness",
      tags: ["Ayurveda", "Wellness"],
    },
  ]);

  /* derived */
  const dayCount = useMemo(() => {
    if (!dateFrom || !dateTo) return 0;
    const a = new Date(dateFrom);
    const b = new Date(dateTo);
    const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, diff);
  }, [dateFrom, dateTo]);

  const heroCreative = files[0]; // simple preview pick

  /* events */
  const onDayToggle = (d) => {
    const next = new Set(activeDays);
    next.has(d) ? next.delete(d) : next.add(d);
    setActiveDays(next);
  };

  const onOpenPicker = () => inputRef.current?.click();

  const onFiles = (list) => {
    if (!list?.length) return;
    const accepted = Array.from(list).map((f) => {
      const ext = (f.name || "").toLowerCase();
      const isImg = f.type.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif)$/.test(ext);
      const isVideo = f.type.startsWith("video/") || /\.(mp4|mov|webm)$/.test(ext);
      let kind = "file";
      if (isImg) kind = "image";
      else if (isVideo) kind = "video";
      const url = URL.createObjectURL(f);
      return { file: f, url, kind, name: f.name, size: f.size };
    });
    setFiles((prev) => [...prev, ...accepted]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt?.files?.length) onFiles(dt.files);
    dropRef.current?.classList.remove("dragging");
  };

  const onDragOver = (e) => {
    e.preventDefault();
    dropRef.current?.classList.add("dragging");
  };

  const onDragLeave = () => dropRef.current?.classList.remove("dragging");

  const removeFile = (idx) => {
    setFiles((prev) => {
      const cp = [...prev];
      const [rm] = cp.splice(idx, 1);
      if (rm?.url) URL.revokeObjectURL(rm.url);
      return cp;
    });
  };

  const resetForm = () => {
    files.forEach((f) => {
      if (f?.url) URL.revokeObjectURL(f.url);
    });
    setTitle("");
    setObjective("promotion");
    setCtaText("Shop Now");
    setDestination("");
    setPlacement("home_banner");
    setTags(["Pharmacy", "Offer"]);
    setGeoTarget("all");
    setRadiusKm(5);
    setDateFrom("");
    setDateTo("");
    setTimeFrom("08:00");
    setTimeTo("22:00");
    setActiveDays(new Set(DAYS));
    setFreqCap(3);
    setFiles([]);
  };

  /* validation */
  const errors = [];
  if (!title.trim()) errors.push("Title is required.");
  if (!files.length) errors.push("Add at least one creative (image/video/pdf/zip).");
  if (!placement) errors.push("Select a placement.");
  if (!dateFrom || !dateTo) errors.push("Select campaign start and end dates.");
  if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo))
    errors.push("Start date cannot be after end date.");
  if (destination && !/^https?:\/\/.+/i.test(destination))
    errors.push("CTA URL must start with http:// or https://");

  const payload = {
    title,
    objective,
    ctaText,
    destination,
    placement,
    tags,
    geo: geoTarget === "nearby" ? { mode: "nearby", radiusKm } : { mode: "all" },
    schedule: {
      dateFrom,
      dateTo,
      timeFrom,
      timeTo,
      activeDays: Array.from(activeDays),
      freqCap,
    },
    files: files.map((f) => ({ name: f.name, size: f.size, kind: f.kind })),
    createdAt: new Date().toISOString(),
  };

  const onSubmit = async () => {
    if (errors.length) {
      setToast(errors[0]);
      setTimeout(() => setToast(""), 2200);
      return;
    }

    const alreadyExists = liveAds.some(
      (ad) =>
        ad.title.trim().toLowerCase() === title.trim().toLowerCase() &&
        ad.dateFrom === dateFrom &&
        ad.dateTo === dateTo
    );

    if (alreadyExists) {
      setToast("Advertisement already exists");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    setSubmitting(true);
    try {
      console.log("ADVERTISEMENT_SUBMIT", payload);

      setLiveAds((prev) => {
        const nextIndex = prev.length + 1;
        const id = `AD-${String(nextIndex).padStart(3, "0")}`;

        const placementLabel =
          PLACEMENTS.find((p) => p.value === placement)?.label || placement;

        const objectiveLabel =
          OBJECTIVES.find((o) => o.value === objective)?.label || objective;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = dateFrom ? new Date(dateFrom) : null;
        let status = "Live";
        if (start && start > today) status = "Scheduled";

        const newAd = {
          id,
          title: title || "Untitled Campaign",
          placement: placementLabel,
          status,
          dateFrom: dateFrom || "-",
          dateTo: dateTo || "-",
          objective: objectiveLabel,
          tags: tags && tags.length ? [...tags] : [],
        };

        return [...prev, newAd];
      });

      resetForm();
      setToast("Advertisement submitted successfully");
      setTimeout(() => setToast(""), 2400);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adv-root">
      <div className="adv-container">
        {/* Header */}
        <header className="adv-head">
          <div className="title-wrap">
            <h1>
              <Megaphone size={18} />
              <span>Create Advertisement</span>
            </h1>
            <p>
              Upload creatives, configure targeting, and schedule your store’s campaigns
              for the NearNest platform.
            </p>
          </div>
          <div className="pill">
            <CheckCircle2 size={16} />
            <span>{dayCount ? `${dayCount} day(s) selected` : "No schedule configured"}</span>
          </div>
        </header>

        {/* Main Grid */}
        <section className="adv-grid">
          {/* LEFT COLUMN */}
          <div className="left-col">
            {/* Basics */}
            <div className="card">
              <div className="card-head">
                <h3>Campaign Basics</h3>
                <p className="card-subtitle">
                  Define how this advertisement appears for your customers.
                </p>
              </div>
              <div className="card-body form-grid">
                <label className="form-field">
                  <span className="label">Title *</span>
                  <input
                    className="input"
                    placeholder="Monsoon Mega Offer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span className="label">Objective</span>
                  <select
                    className="select"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                  >
                    {OBJECTIVES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="label">CTA Text</span>
                  <input
                    className="input"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Shop Now, Learn More"
                  />
                </label>

                <label className="form-field">
                  <span className="label">CTA URL</span>
                  <div className="input icon-left">
                    <LinkIcon size={16} />
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="https://example.com/offer"
                    />
                  </div>
                  <small className="hint">Optional. Must start with http:// or https://</small>
                </label>
              </div>
            </div>

            {/* Placement & Targeting */}
            <div className="card">
              <div className="card-head">
                <h3>Placement & Targeting</h3>
                <p className="card-subtitle">
                  Choose where your campaign appears and who should see it.
                </p>
              </div>
              <div className="card-body form-grid">
                <label className="form-field">
                  <span className="label">Placement *</span>
                  <select
                    className="select"
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <small className="hint">
                    {PLACEMENTS.find((p) => p.value === placement)?.hint}
                  </small>
                </label>

                <label className="form-field">
                  <span className="label">Tags</span>
                  <div className="chips">
                    {tags.map((t, i) => (
                      <span key={`${t}-${i}`} className="chip">
                        {t}
                        <button
                          onClick={() => setTags(tags.filter((_, x) => x !== i))}
                          aria-label="remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      className="chip-input"
                      placeholder="Add tag and press Enter"
                      onKeyDown={(e) => {
                        const v = e.currentTarget.value.trim();
                        if (e.key === "Enter" && v) {
                          setTags([...tags, v]);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </label>

                <div className="form-field">
                  <span className="label">Geo Target</span>
                  <div className="row">
                    <label className={`radio ${geoTarget === "all" ? "active" : ""}`}>
                      <input
                        type="radio"
                        checked={geoTarget === "all"}
                        onChange={() => setGeoTarget("all")}
                      />
                      <Target size={14} />
                      <span>All users</span>
                    </label>
                    <label className={`radio ${geoTarget === "nearby" ? "active" : ""}`}>
                      <input
                        type="radio"
                        checked={geoTarget === "nearby"}
                        onChange={() => setGeoTarget("nearby")}
                      />
                      <Target size={14} />
                      <span>Nearby</span>
                    </label>
                    {geoTarget === "nearby" && (
                      <input
                        type="number"
                        className="input small"
                        min={1}
                        value={radiusKm}
                        onChange={(e) => setRadiusKm(Number(e.target.value))}
                        placeholder="Radius (km)"
                        style={{ maxWidth: 120, marginLeft: 8 }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="card">
              <div className="card-head">
                <h3>Schedule & Frequency</h3>
                <p className="card-subtitle">
                  Control when this campaign is active and how often it appears.
                </p>
              </div>
              <div className="card-body form-grid">
                <label className="form-field">
                  <span className="label">Start Date *</span>
                  <div className="input icon-left">
                    <CalendarDays size={16} />
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span className="label">End Date *</span>
                  <div className="input icon-left">
                    <CalendarDays size={16} />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span className="label">Active From</span>
                  <div className="input icon-left">
                    <Clock size={16} />
                    <input
                      type="time"
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span className="label">Active Until</span>
                  <div className="input icon-left">
                    <Clock size={16} />
                    <input
                      type="time"
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                    />
                  </div>
                </label>

                <div className="form-field">
                  <span className="label">Active Days</span>
                  <div className="days">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`day ${activeDays.has(d) ? "on" : ""}`}
                        onClick={() => onDayToggle(d)}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="form-field">
                  <span className="label">Frequency Cap (per user / day)</span>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={freqCap}
                    onChange={(e) => setFreqCap(Number(e.target.value))}
                    placeholder="3"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-col">
            {/* Creatives */}
            <div className="card">
              <div className="card-head">
                <h3>Creatives</h3>
                <p className="card-subtitle">
                  Upload the assets that will be used in this campaign.
                </p>
              </div>
              <div className="card-body">
                <div
                  ref={dropRef}
                  className="dropzone"
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={onOpenPicker}
                >
                  <UploadCloud size={22} />
                  <div>
                    <strong>Drag &amp; drop</strong> files here or{" "}
                    <span className="link">browse</span>
                    <div className="muted">
                      PNG, JPG, WEBP, MP4, MOV, PDF, ZIP • up to 20 MB each
                    </div>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.zip"
                    onChange={(e) => onFiles(e.target.files)}
                    hidden
                  />
                </div>

                {!!files.length && (
                  <div className="file-grid">
                    {files.map((f, i) => (
                      <div key={i} className="file-item">
                        <div className="thumb">
                          {f.kind === "image" ? (
                            <img src={f.url} alt={f.name} />
                          ) : f.kind === "video" ? (
                            <video src={f.url} muted />
                          ) : (
                            <div className="file-icon">
                              <FileIcon size={22} />
                            </div>
                          )}
                        </div>
                        <div className="meta">
                          <div className="name" title={f.name}>
                            {f.name}
                          </div>
                          <div className="sub">
                            {f.kind === "image" && (
                              <>
                                <ImageIcon size={14} /> Image
                              </>
                            )}
                            {f.kind === "video" && (
                              <>
                                <VideoIcon size={14} /> Video
                              </>
                            )}
                            {f.kind === "file" && (
                              <>
                                <FileIcon size={14} /> File
                              </>
                            )}
                            <span>• {formatBytes(f.size)}</span>
                          </div>
                        </div>
                        <button
                          className="icon-btn danger"
                          onClick={() => removeFile(i)}
                          aria-label="Remove file"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!files.length && (
                  <div className="tip">
                    <Info size={16} />
                    <span>
                      For Home Banner use 16:9. For Interstitial placements, 9:16 works best.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview */}
            <div className="card">
              <div className="card-head">
                <h3>Preview</h3>
                <p className="card-subtitle">
                  A quick visual of how your advertisement will look.
                </p>
              </div>
              <div className="card-body">
                <div className="preview">
                  <div className="preview-hero">
                    {heroCreative ? (
                      heroCreative.kind === "image" ? (
                        <img src={heroCreative.url} alt={heroCreative.name} />
                      ) : heroCreative.kind === "video" ? (
                        <video src={heroCreative.url} autoPlay muted loop />
                      ) : (
                        <div className="file-fallback">
                          <FileIcon size={24} />
                          <span>{heroCreative.name}</span>
                        </div>
                      )
                    ) : (
                      <div className="placeholder">
                        <Megaphone size={28} />
                        <span>No creative selected yet</span>
                      </div>
                    )}
                  </div>
                  <div className="preview-body">
                    <h4>{title || "Untitled Campaign"}</h4>
                    <p className="hint">
                      {PLACEMENTS.find((p) => p.value === placement)?.label ||
                        "Placement not set"}
                    </p>
                    {ctaText ? (
                      <button className="cta">{ctaText}</button>
                    ) : (
                      <button className="cta disabled" disabled>
                        CTA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky footer actions */}
        <footer className="adv-actions">
          <div className="errors">
            {errors.map((e, i) => (
              <div key={i} className="error">
                <AlertCircle size={14} />
                <span>{e}</span>
              </div>
            ))}
          </div>
          <div className="right">
            <button className="btn ghost" onClick={() => window.history.back()}>
              Cancel
            </button>
            <button className="btn primary" onClick={onSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Advertisement"}
            </button>
          </div>
        </footer>

        {/* Live advertisements table */}
        <section className="adv-live">
          <div className="card">
            <div className="card-head">
              <h3>Current Campaigns</h3>
              <p className="card-subtitle">
                Monitor existing advertisements and their statuses.
              </p>
            </div>
            <div className="card-body">
              {liveAds.length === 0 ? (
                <div className="empty-live">
                  <span>
                    You don’t have any campaigns yet. Create an advertisement above to get started.
                  </span>
                </div>
              ) : (
                <div className="live-table-wrap">
                  <table className="live-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Placement</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Objective</th>
                        <th>Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveAds.map((ad) => (
                        <tr key={ad.id}>
                          <td>{ad.id}</td>
                          <td className="strong">{ad.title}</td>
                          <td>{ad.placement}</td>
                          <td>
                            <span className={`status-pill ${ad.status.toLowerCase()}`}>
                              {ad.status}
                            </span>
                          </td>
                          <td>
                            {ad.dateFrom} → {ad.dateTo}
                          </td>
                          <td>{ad.objective}</td>
                          <td>
                            <div className="live-tags">
                              {ad.tags.map((t, i) => (
                                <span key={i}>{t}</span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
