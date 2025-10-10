import styles from "./Dashboard.module.css";

export default function AdminDashboard() {
  // placeholder cells (replace with real modules later)
  const cells = new Array(8).fill(0);
  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {cells.map((_, i) => (
          <div key={i} className={styles.cell}/>
        ))}
      </div>
    </div>
  );
}
