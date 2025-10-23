import React, { useState } from 'react';
import styles from './NavBar.module.css';  // Styling will follow

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Toggle menu for mobile
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className={styles.navbar}>
      <div className={styles.profile}>
        <img className={styles.profilePic} src="profile-pic-url" alt="Admin" />
        <div className={styles.profileInfo}>
          <h3>Admin Name</h3>
          <p className={styles.status}>Available to Work</p>
        </div>
      </div>

      {/* Hamburger Menu for mobile */}
      <div className={styles.hamburger} onClick={toggleMenu}>
        ☰
      </div>
    </nav>
  );
}
