import { Outlet, NavLink } from "react-router-dom";
import styles from "./AdminLayout.module.css";

export default function AdminLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>nearnest</div>

        <nav className={styles.nav}>
          <NavLink to="/admin" end className={({isActive}) => isActive ? styles.active : ""}>
            <span>Dashboard</span>
          </NavLink>
          {/* Add more sections later */}
          {/* <NavLink to="/admin/stores">Stores</NavLink> */}
          {/* <NavLink to="/admin/users">Users</NavLink> */}
          {/* <NavLink to="/admin/settings">Settings</NavLink> */}
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>Admin</h1>
          <div className={styles.actions}>
            <input className={styles.search} placeholder="Search…" />
            <div className={styles.avatar} title="Profile" />
          </div>
        </header>

        <section className={styles.content}>
          <Outlet />
        </section>
      </main>
    </div>
  );
}
