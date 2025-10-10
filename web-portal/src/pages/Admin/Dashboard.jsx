import React from 'react';
import styles from './Dashboard.module.css';  // Importing the styles

export default function Dashboard() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Admin Dashboard</h2>

      <div className={styles.cardContainer}>
        <div className={styles.card}>
          <h3>Stores</h3>
          <p>Total Stores: 150</p>
        </div>

        <div className={styles.card}>
          <h3>Users</h3>
          <p>Total Users: 500</p>
        </div>

        <div className={styles.card}>
          <h3>Products</h3>
          <p>Total Products: 1000</p>
        </div>
      </div>

      <div className={styles.description}>
        <p>Welcome to the Admin Dashboard. Here you can manage your stores, users, and products.</p>
      </div>
    </div>
  );
}
