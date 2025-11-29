import React from 'react'
import styles from './Footer.module.css'

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>
          © 2025 PrintStack - 3D Printing Management System
        </p>
        <div className={styles.links}>
          <a href="#" className={styles.link}>Help</a>
          <a href="#" className={styles.link}>About</a>
          <a href="#" className={styles.link}>GitHub</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer