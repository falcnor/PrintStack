import { useState, useEffect } from 'react'

// Custom hook for localStorage operations with error handling
export const useLocalStorage = (key, initialValue) => {
  // Get stored value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Function to set value in localStorage and state
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      setStoredValue(valueToStore)

      // Save to localStorage
      if (valueToStore === null || valueToStore === undefined) {
        window.localStorage.removeItem(key)
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Function to remove item from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }

  // Listen for changes to localStorage from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue, removeValue]
}

// Hook for managing application data in localStorage with validation
export const useAppData = (key, validator) => {
  const [data, setData, removeData] = useLocalStorage(key, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addItem = async (item) => {
    setLoading(true)
    setError(null)

    try {
      if (validator) {
        const validation = validator(item)
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '))
        }
      }

      const newItem = {
        ...item,
        id: item.id || Date.now().toString(36) + Math.random().toString(36).substr(2),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setData(prevData => [...prevData, newItem])
      return newItem
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (id, updates) => {
    setLoading(true)
    setError(null)

    try {
      const updatedItem = {
        ...updates,
        id,
        updatedAt: new Date().toISOString()
      }

      if (validator) {
        const validation = validator(updatedItem)
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '))
        }
      }

      setData(prevData =>
        prevData.map(item =>
          item.id === id ? { ...item, ...updatedItem } : item
        )
      )
      return updatedItem
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (id) => {
    setLoading(true)
    setError(null)

    try {
      setData(prevData => prevData.filter(item => item.id !== id))
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getItem = (id) => {
    return data.find(item => item.id === id)
  }

  const clearAll = async () => {
    setLoading(true)
    setError(null)

    try {
      setData([])
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    getItem,
    clearAll,
    setError
  }
}

// Hook for managing settings with defaults
export const useSettings = (defaultSettings = {}) => {
  const [settings, setSettings, removeSettings] = useLocalStorage('printstack_settings', {
    theme: 'light',
    currency: 'USD',
    units: 'metric',
    language: 'en',
    autoSave: true,
    notifications: true,
    ...defaultSettings
  })

  const updateSettings = (newSettings) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }))
  }

  const resetSettings = () => {
    setSettings({
      theme: 'light',
      currency: 'USD',
      units: 'metric',
      language: 'en',
      autoSave: true,
      notifications: true,
      ...defaultSettings
    })
  }

  return {
    settings,
    updateSettings,
    resetSettings,
    removeSettings
  }
}