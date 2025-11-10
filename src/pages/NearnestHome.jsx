import React from "react";
import { useNavigate } from "react-router-dom";
import s from "./NearnestHome.module.css";

export default function NearnestHome() {
  const navigate = useNavigate();

  const goToAuth = () => {
    navigate("/signin");
  };

  return (
    <div className={s.shell}>
      <div className={s.frame}>
        {/* header */}
        <header className={s.header}>
          <div className={s.brand}>
            <div className={s.logoMark}>N</div>
            <span className={s.logoText}>NearNest</span>
          </div>

          <button className={s.menuBtn} aria-label="Open menu">
            <span />
            <span />
          </button>
        </header>

        {/* main */}
        <main className={s.main}>
          <div className={s.mainCenter}>
            <div className={s.badge}>
              <span className={s.badgeDot} />
              <span>Available to work with pharmacies</span>
            </div>

            <section className={s.hero}>
              {/* floating analytics card */}
              <div className={s.analyticsCard}>
                <div className={s.analyticsHeader}>
                  <span className={s.analyticsTitle}>Daily orders</span>
                  <span className={s.analyticsValue}>+42%</span>
                </div>
                <div className={s.analyticsGraph}>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>

              {/* main hero text */}
              <div className={s.heroWords}>
                <div className={s.row}>
                  <span className={`${s.word} ${s.wordBold}`}>Stores</span>
                  <span className={`${s.word} ${s.wordSoft}`}>Grow</span>
                </div>
                <div className={s.row}>
                  <span className={`${s.word} ${s.wordMuted}`}>Faster</span>
                  <span className={`${s.word} ${s.wordBold}`}>
                    with NearNest
                  </span>
                </div>
              </div>

              {/* central dark badge */}
              <div className={s.centerChip}>
                <div className={s.chipIcon}>Rx</div>
                <div className={s.chipText}>
                  <span>Built for</span>
                  <strong>Pharmacies</strong>
                </div>
              </div>
            </section>

            {/* sub copy */}
            <p className={s.subtitle}>
              We help neighborhood pharmacies go online — fast, reliable, and
              easy to manage, with smart tools that feel as clean as a modern
              design studio.
            </p>

            {/* main CTA */}
            <button className={s.primaryCta} onClick={goToAuth}>
              <span>Sign up or Sign in</span>
              <span className={s.primaryArrow}>→</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
