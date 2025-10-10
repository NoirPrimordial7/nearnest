import styles from "./Dashboard.module.css";

function StatCard({ label, value, delta }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.cardLabel}>{label}</span>
        {delta !== undefined && (
          <span className={delta >= 0 ? styles.deltaUp : styles.deltaDown}>
            {delta >= 0 ? `▲ ${delta}%` : `▼ ${Math.abs(delta)}%`}
          </span>
        )}
      </div>
      <div className={styles.cardValue}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className={styles.wrap}>
      {/* Top stats */}
      <div className={styles.grid4}>
        <StatCard label="Total Stores" value="128" delta={6} />
        <StatCard label="Pending Approvals" value="14" delta={-3} />
        <StatCard label="Active Users" value="1,942" delta={4} />
        <StatCard label="Monthly Revenue" value="₹3.8L" delta={8} />
      </div>

      {/* Two columns: activity + table */}
      <div className={styles.cols2}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Recent Activity</div>
          <ul className={styles.timeline}>
            <li><b>Store #NE-402</b> submitted KYC · 2m ago</li>
            <li><b>Admin</b> approved payout for <b>Store #NE-118</b> · 12m</li>
            <li><b>3 new users</b> signed up · 32m</li>
            <li><b>Extension</b> upgraded successfully · 1h</li>
          </ul>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Newest Stores</div>
          <div className={styles.table}>
            <div className={styles.tr + " " + styles.th}>
              <div>ID</div><div>Name</div><div>Status</div><div>City</div>
            </div>
            {[
              ["NE-402","Dinesh Mart","KYC Pending","Pune"],
              ["NE-401","Green Basket","Active","Nashik"],
              ["NE-400","Sai Provision","Review","Mumbai"],
              ["NE-399","Daily Needs","Active","Thane"],
            ].map((r, i) => (
              <div className={styles.tr} key={i}>
                <div>{r[0]}</div><div>{r[1]}</div><div>{r[2]}</div><div>{r[3]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
