import React from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext.jsx'
import { calculateStats, formatCurrency, formatWeight } from '../../utils/dataUtils.js'
import styles from './Dashboard.module.css'

const Dashboard = () => {
  const { filaments, models, prints } = useApp()
  const stats = calculateStats(filaments, models, prints)

  const quickActions = [
    {
      title: 'Add Filament',
      description: 'Add a new filament to your inventory',
      link: '/filaments',
      icon: '🧵',
      color: 'var(--primary-color)'
    },
    {
      title: 'Add Model',
      description: 'Add a new 3D model to your library',
      link: '/models',
      icon: '📦',
      color: 'var(--accent-color)'
    },
    {
      title: 'Record Print',
      description: 'Record a new print job',
      link: '/prints',
      icon: '🖨️',
      color: 'var(--warning-color)'
    },
    {
      title: 'View Statistics',
      description: 'See detailed usage analytics',
      link: '/settings',
      icon: '📊',
      color: 'var(--success-color)'
    }
  ]

  const recentFilaments = filaments
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)

  const recentPrints = prints
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Welcome back! Here's an overview of your 3D printing setup.</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🧵</div>
          <div className={styles.statInfo}>
            <h3>{stats.totalFilaments}</h3>
            <p>Total Filaments</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statInfo}>
            <h3>{stats.totalModels}</h3>
            <p>3D Models</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🖨️</div>
          <div className={styles.statInfo}>
            <h3>{stats.totalPrints}</h3>
            <p>Print Jobs</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <h3>{stats.successRate}%</h3>
            <p>Success Rate</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <Link key={index} to={action.link} className={styles.actionCard}>
              <div
                className={styles.actionIcon}
                style={{ backgroundColor: action.color }}
              >
                {action.icon}
              </div>
              <h3>{action.title}</h3>
              <p>{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Recent Filaments */}
        <div className={styles.contentCard}>
          <div className={styles.contentHeader}>
            <h2>Recent Filaments</h2>
            <Link to="/filaments" className={styles.viewAll}>
              View All →
            </Link>
          </div>
          <div className={styles.contentList}>
            {recentFilaments.length > 0 ? (
              recentFilaments.map(filament => (
                <div key={filament.id} className={styles.listItem}>
                  <div className={styles.itemIcon}>🧵</div>
                  <div className={styles.itemInfo}>
                    <h4>{filament.name}</h4>
                    <p>{filament.material} • {filament.color || 'No color'}</p>
                  </div>
                  <div className={styles.itemDetails}>
                    {filament.cost && (
                      <span>{formatCurrency(filament.cost)}</span>
                    )}
                    {filament.remainingWeight && filament.weight && (
                      <span className={styles.percentage}>
                        {Math.round((filament.remainingWeight / filament.weight) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>
                <p>No filaments added yet</p>
                <Link to="/filaments" className={styles.addFirst}>
                  Add your first filament
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Prints */}
        <div className={styles.contentCard}>
          <div className={styles.contentHeader}>
            <h2>Recent Prints</h2>
            <Link to="/prints" className={styles.viewAll}>
              View All →
            </Link>
          </div>
          <div className={styles.contentList}>
            {recentPrints.length > 0 ? (
              recentPrints.map(print => {
                const filament = filaments.find(f => f.id === print.filamentId)
                const model = models.find(m => m.id === print.modelId)

                return (
                  <div key={print.id} className={styles.listItem}>
                    <div className={styles.itemIcon}>🖨️</div>
                    <div className={styles.itemInfo}>
                      <h4>{model?.name || 'Unknown Model'}</h4>
                      <p>{filament?.name || 'Unknown Filament'}</p>
                    </div>
                    <div className={styles.itemDetails}>
                      <span className={`${styles.status} ${styles[print.status]}`}>
                        {print.status}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className={styles.empty}>
                <p>No print jobs recorded yet</p>
                <Link to="/prints" className={styles.addFirst}>
                  Record your first print
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className={styles.section}>
        <h2>Inventory Summary</h2>
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <h3>Total Investment</h3>
            <p className={styles.value}>{formatCurrency(stats.totalFilamentCost)}</p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Total Material</h3>
            <p className={styles.value}>{formatWeight(stats.totalFilamentWeight)}</p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Completed Prints</h3>
            <p className={styles.value}>{stats.completedPrints}</p>
          </div>
          <div className={styles.summaryCard}>
            <h3>Failed Prints</h3>
            <p className={styles.value}>{stats.failedPrints}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard