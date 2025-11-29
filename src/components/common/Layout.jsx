import React from 'react'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import styles from './Layout.module.css'

const Layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout