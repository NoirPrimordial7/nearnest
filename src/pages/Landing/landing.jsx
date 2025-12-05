import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./landing.css";

export default function Landing() {
  const nav = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "What is MediFind Pharmacy Locator?",
      a: "It’s a platform to discover verified pharmacies near you, compare availability, and contact stores instantly. Verified stores get an admin portal to manage inventory and documents."
    },
    {
      q: "How do stores get verified?",
      a: "Store owners register, upload mandatory documents, and submit for review. Our team verifies and then grants access to the Store Admin Portal."
    },
    {
      q: "Is there a fee to register a store?",
      a: "Basic listing during the early access phase is free. Advanced analytics and priority placement may be offered as paid add-ons later."
    },
    {
      q: "Which locations are supported?",
      a: "We’re rolling out city by city. You can still register your store now—approval and discovery will follow as your region launches."
    }
  ];

  return (
    <div className="nlx-root">
      {/* Topbar */}
      <header className="nlx-topbar">
        <div className="nlx-topbar__inner">
          <div className="nlx-logo" onClick={() => nav("/")}>
            <span className="nlx-logo__mark" />
            <span className="nlx-logo__text">MediFind</span>
          </div>

          <nav className="nlx-nav">
            <Link to="/about" className="nlx-link">About us</Link>
            <Link to="/contact" className="nlx-link">Contact us</Link>
            <button className="nlx-btn nlx-btn--ghost" onClick={() => nav("/signin")}>
              Sign in
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="nlx-hero">
        <div className="nlx-hero__shade" />
        <div className="nlx-hero__content">
          <h1 className="nlx-hero__title">MediFind - List your pharmacy in seconds.</h1>
          <p className="nlx-hero__tag">Real-time availability, trusted stores, and a smooth experience built for care.</p>
          <div className="nlx-cta">
            {/* Redirect to SignIn on click */}
            <button className="nlx-btn nlx-btn--primary" onClick={() => nav("/signin")}>
              Register your store
            </button>
            
          </div>
        </div>
        <div className="nlx-hero__stripes" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>

      {/* Feature rows */}
      <section className="nlx-feature">
        <div className="nlx-feature__row">
          <div className="nlx-feature__text">
            <h2>Instant discovery</h2>
            <p>Search nearby pharmacies and see status at a glance. Save favorites and pick what’s open now.</p>
          </div>
          <div className="nlx-feature__media">
            <div className="nlx-tv">
              <div className="nlx-tv__screen">
                <div className="nlx-pulse-card">
                  <div className="nlx-dot" />
                  <div className="nlx-lines" />
                </div>
              </div>
              <div className="nlx-tv__stand" />
            </div>
          </div>
        </div>

        <div className="nlx-feature__row nlx-feature__row--rev">
          <div className="nlx-feature__text">
            <h2>Verified stores only</h2>
            <p>We vet documents before a store goes live. Look for the verified badge for peace of mind.</p>
          </div>
          <div className="nlx-feature__media">
            <div className="nlx-badge">
              <span className="nlx-badge__tick">✓</span>
              <span className="nlx-badge__label">Verified</span>
            </div>
          </div>
        </div>

        <div className="nlx-feature__row">
          <div className="nlx-feature__text">
            <h2>Pro tools for store owners</h2>
            <p>Once approved, manage inventory, documents, and analytics from a clean Store Admin Portal.</p>
          </div>
          <div className="nlx-feature__media">
            <div className="nlx-card-grid">
              <div className="nlx-card">
                <h3>Inventory</h3>
                <p>Track stock and expiry—stay ahead.</p>
              </div>
              <div className="nlx-card">
                <h3>Docs</h3>
                <p>Upload, review, re-verify in clicks.</p>
              </div>
              <div className="nlx-card">
                <h3>Insights</h3>
                <p>View trends and demand heat.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="nlx-services" id="services">
        <h2>Our Services</h2>
        <p className="nlx-services__sub">Built for trust, speed, and clarity.</p>
        <div className="nlx-services__grid">
          <div className="nlx-service">
            <div className="nlx-service__icon" />
            <h3>Pharmacy Locator</h3>
            <p>Find nearby verified pharmacies with operating hours and contact info.</p>
          </div>
          <div className="nlx-service">
            <div className="nlx-service__icon" />
            <h3>Store Verification</h3>
            <p>End-to-end KYC for stores: license, ID, and paperwork checks.</p>
          </div>
          <div className="nlx-service">
            <div className="nlx-service__icon" />
            <h3>Admin Portal</h3>
            <p>Manage products, staff roles, and documents from one dashboard.</p>
          </div>
          <div className="nlx-service">
            <div className="nlx-service__icon" />
            <h3>Analytics</h3>
            <p>Understand demand, low stock alerts, and category performance.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="nlx-faq" id="faq">
        <h2>Frequently Asked Questions</h2>
        <div className="nlx-faq__list">
          {faqs.map((f, i) => (
            <div key={i} className={`nlx-faq__item ${openFaq === i ? "is-open" : ""}`}>
              <button className="nlx-faq__q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                <span className="nlx-faq__icon">{openFaq === i ? "−" : "+"}</span>
              </button>
              <div className="nlx-faq__a">
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="nlx-footer">
        <div className="nlx-footer__grid">
          <div className="nlx-footer__col">
            <div className="nlx-logo nlx-logo--footer">
              <span className="nlx-logo__mark" />
              <span className="nlx-logo__text">MediFind</span>
            </div>
            <p className="nlx-footer__tag">Care, verified.</p>
          </div>
          <div className="nlx-footer__col">
            <p><Link to="/about" className="nlx-link">About us</Link></p>
            <p><Link to="/contact" className="nlx-link">Contact us</Link></p>
            <p><Link to="/signin" className="nlx-link">Sign in</Link></p>
          </div>
          <div className="nlx-footer__col">
            <p><a className="nlx-link" href="#services">Services</a></p>
            <p><a className="nlx-link" href="#faq">FAQ</a></p>
            <p><button className="nlx-link nlx-link--btn" onClick={() => nav("/signin")}>Register store</button></p>
          </div>
        </div>
        <div className="nlx-footer__fine">
          <span>© {new Date().getFullYear()} MediFind. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
