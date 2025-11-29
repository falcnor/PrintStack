import React from 'react'
import { Link } from 'react-router-dom'
import styles from './Header.module.css'

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/" className={styles.logoLink}>
            <h1>PrintStack</h1>
            <span className={styles.tagline}>3D Printing Management</span>
          </Link>
        </div>

        <nav className={styles.navigation}>
          <ul className={styles.navList}>
            <li>
              <Link to="/" className={styles.navLink}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/filaments" className={styles.navLink}>
                Filaments
              </Link>
            </li>
            <li>
              <Link to="/models" className={styles.navLink}>
                Models
              </Link>
            </li>
            <li>
              <Link to="/prints" className={styles.navLink}>
                Prints
              </Link>
            </li>
            <li>
              <Link to="/settings" className={styles.navLink}>
                Settings
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.actions}>
          <button className={styles.importBtn} aria-label="Import data">
            📥 Import
          </button>
          <button className={styles.exportBtn} aria-label="Export data">
            📤 Export
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header