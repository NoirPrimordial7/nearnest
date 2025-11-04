// src/pages/RegisterStore/ConfirmStart.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function ConfirmStart() {
  const [ok, setOk] = useState(false);
  const nav = useNavigate();

  return (
    <div style={{maxWidth:620, margin:"40px auto", padding:"20px"}}>
      <h1 style={{fontWeight:800, marginBottom:6}}>Register a store</h1>
      <p style={{color:"#64748b"}}>Three steps: Register → Upload Docs → Review & Approval.</p>

      <label style={{display:"flex", gap:10, marginTop:16}}>
        <input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)} />
        I confirm I’ll submit authentic documents and accept verification terms.
      </label>

      <div style={{marginTop:16, display:"flex", gap:10}}>
        <button
          disabled={!ok}
          onClick={()=>nav("/register-store")}
          style={{
            opacity: ok?1:.6, cursor: ok?"pointer":"not-allowed",
            background:"#111", color:"#fff", border:"0", padding:"10px 16px", borderRadius:10, fontWeight:800
          }}
        >
          Continue
        </button>
        <Link to="/home" style={{padding:"10px 14px"}}>Cancel</Link>
      </div>
    </div>
  );
}
