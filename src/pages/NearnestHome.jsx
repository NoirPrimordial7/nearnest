import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NearnestHome.module.css';

const stats = [
  { value: '593+', label: 'medicines indexed' },
  { value: '4', label: 'verified demo pharmacies' },
  { value: '223+', label: 'availability checks' },
  { value: '100%', label: 'in-app route previews' },
];

const steps = [
  {
    title: 'Search a medicine',
    body: 'Customers search by medicine, brand, or composition in the Medifind app.',
  },
  {
    title: 'Compare nearby stores',
    body: 'Verified pharmacies appear with availability, distance, freshness, and public contact details.',
  },
  {
    title: 'Call or route inside app',
    body: 'Customers can call the store or preview a route without leaving Medifind.',
  },
];

const ownerBenefits = [
  'Register your pharmacy profile',
  'Upload verification documents',
  'Manage public inventory freshness',
  'Help nearby customers discover your store',
];

export default function NearnestHome() {
  const navigate = useNavigate();
  const androidUrl = import.meta.env.VITE_MEDIFIND_ANDROID_URL;
  const iosUrl = import.meta.env.VITE_MEDIFIND_IOS_URL;

  return (
    <main className={styles.root}>
      <nav className={styles.navbar} aria-label="Primary">
        <button className={styles.brand} onClick={() => navigate('/')} type="button">
          <span className={styles.logoMark}>N</span>
          <span>
            <span className={styles.brandName}>NearNest</span>
            <span className={styles.brandSub}>Medifind discovery network</span>
          </span>
        </button>

        <div className={styles.navActions}>
          <button className={styles.navLink} onClick={() => navigate('/signin')} type="button">
            Sign in
          </button>
          <button className={styles.navCta} onClick={() => navigate('/signup')} type="button">
            Get Started
          </button>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Verified pharmacy discovery</p>
          <h1>Find medicines nearby. Help pharmacies get discovered.</h1>
          <p className={styles.heroText}>
            NearNest powers Medifind, a customer app for finding medicine availability at verified
            nearby pharmacies, calling the store, and previewing an in-app route before travelling.
          </p>

          <div className={styles.ctaRow}>
            <button className={styles.primaryCta} onClick={() => navigate('/signup')} type="button">
              Get Started
            </button>
            <DownloadLink label="Download Android App" url={androidUrl} />
            <DownloadLink label="iOS coming soon" url={iosUrl} comingSoonLabel="iOS coming soon" />
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Medifind app preview">
          <div className={styles.phoneShell}>
            <div className={styles.phoneTop}>
              <span>Medifind</span>
              <strong>18 min</strong>
            </div>
            <div className={styles.searchPill}>Dolo 650</div>
            <div className={styles.mapPanel}>
              <span className={styles.routeDotStart}>You</span>
              <span className={styles.routeLine}></span>
              <span className={styles.routeDotEnd}>Store</span>
            </div>
            <div className={styles.storeCard}>
              <span className={styles.verifiedPill}>Verified pharmacy</span>
              <strong>Greenleaf Medical</strong>
              <p>1.8 km away · Open now · In stock</p>
            </div>
          </div>
          <div className={styles.floatingCard}>
            <span>Live availability</span>
            <strong>Call or route inside Medifind</strong>
          </div>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="NearNest stats">
        {stats.map((stat) => (
          <div className={styles.statCard} key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>How it works</p>
          <h2>Discovery first. No cart, no checkout, no confusion.</h2>
        </div>
        <div className={styles.cardGrid}>
          {steps.map((step, index) => (
            <article className={styles.infoCard} key={step.title}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.ownerSection}>
        <div>
          <p className={styles.eyebrow}>For pharmacy owners</p>
          <h2>Bring your verified store into nearby medicine search.</h2>
          <p>
            NearNest gives pharmacy teams a simple web portal to register stores, upload documents,
            manage inventory, and become discoverable to customers using Medifind.
          </p>
          <button className={styles.primaryCta} onClick={() => navigate('/register-store')} type="button">
            Register a Store
          </button>
        </div>
        <div className={styles.ownerList}>
          {ownerBenefits.map((benefit) => (
            <div className={styles.ownerItem} key={benefit}>
              <span className={styles.checkMark}>✓</span>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.downloadSection}>
        <div>
          <p className={styles.eyebrow}>Medifind mobile</p>
          <h2>Download the Android app for customer discovery.</h2>
          <p>
            Search medicines, compare verified pharmacies, call public store numbers, and keep route
            previews inside Medifind.
          </p>
        </div>
        <div className={styles.downloadActions}>
          <DownloadLink label="Download Android APK" url={androidUrl} />
          <DownloadLink label="iOS coming soon" url={iosUrl} comingSoonLabel="iOS coming soon" />
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} NearNest · Medifind</span>
        <div>
          <a href="mailto:support@nearnest.local">Support</a>
          <a href="/privacy" aria-label="Privacy placeholder">Privacy</a>
        </div>
      </footer>
    </main>
  );
}

function DownloadLink({ label, url, comingSoonLabel = 'Coming soon' }) {
  if (!url) {
    return (
      <button className={styles.disabledCta} disabled type="button">
        {comingSoonLabel}
      </button>
    );
  }

  return (
    <a className={styles.secondaryCta} href={url} rel="noreferrer" target="_blank">
      {label}
    </a>
  );
}
