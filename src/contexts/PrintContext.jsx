import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react'
import { generateId } from '../utils/dataUtils.js'

// Print-specific initial state
const initialState = {
  prints: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedModel: 'all',
  selectedPeriod: 'all', // 'all', 'week', 'month', 'year'
  selectedQuality: 'all', // 'all', 'excellent', 'good', 'fair', 'poor'
  sortBy: 'date' // 'date', 'model', 'quality', 'duration'
}

// Action types for Print Context
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOAD_PRINTS: 'LOAD_PRINTS',
  ADD_PRINT: 'ADD_PRINT',
  UPDATE_PRINT: 'UPDATE_PRINT',
  DELETE_PRINT: 'DELETE_PRINT',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SELECTED_MODEL: 'SET_SELECTED_MODEL',
  SET_SELECTED_PERIOD: 'SET_SELECTED_PERIOD',
  SET_SELECTED_QUALITY: 'SET_SELECTED_QUALITY',
  SET_SORT_BY: 'SET_SORT_BY'
}

// Reducer function for print state management
const printReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload }

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false }

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null }

    case ActionTypes.LOAD_PRINTS:
      return { ...state, prints: action.payload, loading: false }

    case ActionTypes.ADD_PRINT:
      const newPrint = {
        ...action.payload,
        id: action.payload.id || generateId(),
        createdAt: action.payload.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return { ...state, prints: [...state.prints, newPrint] }

    case ActionTypes.UPDATE_PRINT:
      const updatedPrint = {
        ...action.payload,
        updatedAt: new Date().toISOString()
      }
      return {
        ...state,
        prints: state.prints.map(print =>
          print.id === action.payload.id ? updatedPrint : print
        )
      }

    case ActionTypes.DELETE_PRINT:
      return {
        ...state,
        prints: state.prints.filter(print => print.id !== action.payload)
      }

    case ActionTypes.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload }

    case ActionTypes.SET_SELECTED_MODEL:
      return { ...state, selectedModel: action.payload }

    case ActionTypes.SET_SELECTED_PERIOD:
      return { ...state, selectedPeriod: action.payload }

    case ActionTypes.SET_SELECTED_QUALITY:
      return { ...state, selectedQuality: action.payload }

    case ActionTypes.SET_SORT_BY:
      return { ...state, sortBy: action.payload }

    default:
      return state
  }
}

// Utility functions
const calculateVarianceAnalysis = (expectedWeights, actualWeights) => {
  const totalExpected = expectedWeights.reduce((sum, w) => sum + w, 0)
  const totalActual = actualWeights.reduce((sum, w) => sum + w, 0)

  let variancePercentage = 0
  let analysis = ''

  if (totalExpected > 0) {
    variancePercentage = ((totalActual - totalExpected) / totalExpected) * 100

    if (Math.abs(variancePercentage) < 5) {
      analysis = 'Excellent variance - very close to expected usage'
    } else if (Math.abs(variancePercentage) < 15) {
      analysis = 'Good variance - within acceptable range'
    } else if (Math.abs(variancePercentage) < 30) {
      analysis = 'Fair variance - significant deviation from expected'
    } else {
      analysis = 'Poor variance - major difference from expected usage'
    }

    if (variancePercentage < 0) {
      analysis += ` (Used ${Math.abs(Math.round(variancePercentage))}% less than expected)`
    } else {
      analysis += ` (Used ${Math.round(variancePercentage)}% more than expected)`
    }
  } else {
    analysis = 'No expected weight data available for analysis'
  }

  return {
    totalExpectedWeight: totalExpected,
    totalActualWeight: totalActual,
    variancePercentage: variancePercentage,
    analysis: analysis
  }
}

const getPeriodStart = (period, date = new Date()) => {
  const start = new Date(date)

  switch (period) {
    case 'week':
      start.setDate(start.getDate() - 7)
      break
    case 'month':
      start.setMonth(start.getMonth() - 1)
      break
    case 'year':
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      return null
  }

  return start
}

// Create context
const PrintContext = createContext()

// Provider component
export const PrintProvider = ({ children }) => {
  const [state, dispatch] = useReducer(printReducer, initialState)

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const prints = localStorage.getItem('printstack_prints')
        if (prints) {
          const parsedPrints = JSON.parse(prints)
          dispatch({ type: ActionTypes.LOAD_PRINTS, payload: parsedPrints })
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load print data from storage' })
      }
    }

    loadData()
  }, [])

  // Save data to localStorage when state changes
  useEffect(() => {
    if (state.prints.length > 0) {
      localStorage.setItem('printstack_prints', JSON.stringify(state.prints))
    }
  }, [state.prints])

  // Filtered and sorted prints (computed values)
  const filteredAndSortedPrints = useMemo(() => {
    let filtered = state.prints

    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(print => {
        const models = JSON.parse(localStorage.getItem('printstack_models') || '[]')
        const model = models.find(m => m.id === print.modelId)
        return model?.name?.toLowerCase().includes(query) ||
               print.notes?.toLowerCase().includes(query) ||
               print.qualityRating?.toLowerCase().includes(query)
      })
    }

    // Filter by model
    if (state.selectedModel && state.selectedModel !== 'all') {
      filtered = filtered.filter(print => print.modelId === state.selectedModel)
    }

    // Filter by period
    if (state.selectedPeriod !== 'all') {
      const periodStart = getPeriodStart(state.selectedPeriod)
      if (periodStart) {
        filtered = filtered.filter(print => new Date(print.date) >= periodStart)
      }
    }

    // Filter by quality
    if (state.selectedQuality !== 'all') {
      filtered = filtered.filter(print => print.qualityRating === state.selectedQuality)
    }

    // Sort prints
    const sorted = [...filtered].sort((a, b) => {
      switch (state.sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date) // Most recent first
        case 'model':
          const models = JSON.parse(localStorage.getItem('printstack_models') || '[]')
          const modelA = models.find(m => m.id === a.modelId)
          const modelB = models.find(m => m.id === b.modelId)
          return (modelA?.name || '').localeCompare(modelB?.name || '')
        case 'quality':
          const qualityOrder = { 'excellent': 1, 'good': 2, 'fair': 3, 'poor': 4 }
          return (qualityOrder[a.qualityRating] || 5) - (qualityOrder[b.qualityRating] || 5)
        case 'duration':
          return (b.duration || 0) - (a.duration || 0)
        default:
          return 0
      }
    })

    return sorted
  }, [state.prints, state.searchQuery, state.selectedModel, state.selectedPeriod, state.selectedQuality, state.sortBy])

  // Enhance prints with model data
  const printsWithModels = useMemo(() => {
    const models = JSON.parse(localStorage.getItem('printstack_models') || '[]')
    const filaments = JSON.parse(localStorage.getItem('printstack_filaments') || '[]')

    return filteredAndSortedPrints.map(print => {
      const model = models.find(m => m.id === print.modelId)

      // Calculate variance analysis
      let varianceAnalysis = null
      if (print.filamentUsages && print.filamentUsages.length > 0) {
        const expectedWeights = print.filamentUsages.map(usage => {
          const req = model?.requirements?.find(r => r.filamentId === usage.filamentId)
          return req?.expectedWeight || 0
        })
        const actualWeights = print.filamentUsages.map(usage => usage.actualWeight || 0)

        varianceAnalysis = calculateVarianceAnalysis(expectedWeights, actualWeights)
      }

      return {
        ...print,
        model,
        filamentUsages: print.filamentUsages?.map(usage => {
          const filament = filaments.find(f => f.id === usage.filamentId)
          return {
            ...usage,
            filament
          }
        }) || [],
        varianceAnalysis
      }
    })
  }, [filteredAndSortedPrints])

  // Print validation
  const validatePrint = (print) => {
    const errors = []

    if (!print.modelId || print.modelId.trim() === '') {
      errors.push('Model is required')
    }

    if (!print.date) {
      errors.push('Print date is required')
    } else {
      const printDate = new Date(print.date)
      if (isNaN(printDate.getTime())) {
        errors.push('Invalid print date format')
      }
    }

    if (print.qualityRating && !['excellent', 'good', 'fair', 'poor'].includes(print.qualityRating)) {
      errors.push('Invalid quality rating')
    }

    if (print.duration && (isNaN(print.duration) || print.duration < 0)) {
      errors.push('Duration must be a positive number if provided')
    }

    if (!print.filamentUsages || print.filamentUsages.length === 0) {
      errors.push('At least one filament usage is required')
    } else {
      // Validate each filament usage
      print.filamentUsages.forEach((usage, index) => {
        if (!usage.filamentId || usage.filamentId.trim() === '') {
          errors.push(`Filament is required for usage ${index + 1}`)
        }
        if (usage.actualWeight && (isNaN(usage.actualWeight) || usage.actualWeight <= 0)) {
          errors.push(`Actual weight must be positive for usage ${index + 1}`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Action creators
  const actions = {
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),

    // Print actions
    addPrint: (print) => {
      const validation = validatePrint(print)
      if (!validation.isValid) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: validation.errors.join(', ') })
        return false
      }

      // Automatically calculate variance if not provided
      if (!print.varianceAnalysis && print.filamentUsages) {
        const models = JSON.parse(localStorage.getItem('printstack_models') || '[]')
        const model = models.find(m => m.id === print.modelId)

        if (model?.requirements) {
          const expectedWeights = print.filamentUsages.map(usage => {
            const req = model.requirements.find(r => r.filamentId === usage.filamentId)
            return req?.expectedWeight || 0
          })
          const actualWeights = print.filamentUsages.map(usage => usage.actualWeight || 0)

          print.varianceAnalysis = calculateVarianceAnalysis(expectedWeights, actualWeights)
        }
      }

      dispatch({ type: ActionTypes.ADD_PRINT, payload: print })
      return true
    },

    updatePrint: (print) => {
      const validation = validatePrint(print)
      if (!validation.isValid) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: validation.errors.join(', ') })
        return false
      }
      dispatch({ type: ActionTypes.UPDATE_PRINT, payload: print })
      return true
    },

    deletePrint: (id) => {
      dispatch({ type: ActionTypes.DELETE_PRINT, payload: id })
      return true
    },

    // Filter and sort actions
    setSearchQuery: (query) => dispatch({ type: ActionTypes.SET_SEARCH_QUERY, payload: query }),
    setSelectedModel: (modelId) => dispatch({ type: ActionTypes.SET_SELECTED_MODEL, payload: modelId }),
    setSelectedPeriod: (period) => dispatch({ type: ActionTypes.SET_SELECTED_PERIOD, payload: period }),
    setSelectedQuality: (quality) => dispatch({ type: ActionTypes.SET_SELECTED_QUALITY, payload: quality }),
    setSortBy: (sortBy) => dispatch({ type: ActionTypes.SET_SORT_BY, payload: sortBy })
  }

  // Statistics
  const statistics = useMemo(() => {
    const totalPrints = state.prints.length
    const qualityCounts = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    }

    let totalDuration = 0
    const qualityPrints = state.prints.filter(p => p.qualityRating)

    qualityPrints.forEach(print => {
      if (qualityCounts[print.qualityRating] !== undefined) {
        qualityCounts[print.qualityRating]++
      }
      if (print.duration) {
        totalDuration += print.duration
      }
    })

    const avgDuration = qualityPrints.length > 0 ? totalDuration / qualityPrints.length : 0

    return {
      totalPrints,
      qualityCounts,
      averageDuration: avgDuration,
      totalDuration
    }
  }, [state.prints])

  const value = {
    ...state,
    prints: printsWithModels,
    filteredAndSortedPrints,
    statistics,
    actions,
    validatePrint
  }

  return (
    <PrintContext.Provider value={value}>
      {children}
    </PrintContext.Provider>
  )
}

// Custom hook to use the Print context
export const usePrints = () => {
  const context = useContext(PrintContext)
  if (!context) {
    throw new Error('usePrints must be used within a PrintProvider')
  }
  return context
}

export { ActionTypes }