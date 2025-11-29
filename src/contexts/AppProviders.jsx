import React from 'react'
import { AppProvider } from './AppContext'

// Combined providers wrapper for easy context management
export const AppProviders = ({ children }) => {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  )
}

export default AppProviders