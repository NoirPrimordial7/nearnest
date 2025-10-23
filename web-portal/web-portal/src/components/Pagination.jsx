import styles from "./Pagination.module.css";

/** Build page list with ellipses: [1, '…', 4, 5, 6, '…', 20] */
function buildRange(current, total, siblingCount = 1) {
  const totalNumbers = siblingCount * 2 + 5; // first,last,current, 2*siblings
  if (total <= totalNumbers) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(current - siblingCount, 1);
  const right = Math.min(current + siblingCount, total);

  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  const out = [];
  if (!showLeftDots && showRightDots) {
    const rangeEnd = 1 + 2 * siblingCount + 2;
    for (let i = 1; i <= rangeEnd; i++) out.push(i);
    out.push("…", total);
  } else if (showLeftDots && !showRightDots) {
    out.push(1, "…");
    const start = total - (2 * siblingCount + 2);
    for (let i = start; i <= total; i++) out.push(i);
  } else {
    out.push(1, "…");
    for (let i = left; i <= right; i++) out.push(i);
    out.push("…", total);
  }
  return out;
}

export default function Pagination({
  current,
  total,           // total pages
  onChange,
  siblingCount = 1,
  className = "",
}) {
  const range = buildRange(current, total, siblingCount);
  const go = (p) => p !== current && p >= 1 && p <= total && onChange?.(p);

  return (
    <nav className={`${styles.pager} ${className}`} role="navigation" aria-label="Pagination">
      <button
        className={styles.ctrl}
        onClick={() => go(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {range.map((it, i) =>
        it === "…" ? (
          <span key={`dots-${i}`} className={styles.dots} aria-hidden>…</span>
        ) : (
          <button
            key={it}
            className={`${styles.page} ${it === current ? styles.active : ""}`}
            onClick={() => go(it)}
            aria-current={it === current ? "page" : undefined}
          >
            {it}
          </button>
        )
      )}

      <button
        className={styles.ctrl}
        onClick={() => go(current + 1)}
        disabled={current === total}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
