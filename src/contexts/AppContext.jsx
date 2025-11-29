import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { generateId } from '../utils/dataUtils.js'

// Initial state for the application
const initialState = {
  filaments: [],
  models: [],
  prints: [],
  settings: {
    theme: 'light',
    currency: 'USD',
    units: 'metric'
  },
  loading: false,
  error: null
}

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOAD_FILAMENTS: 'LOAD_FILAMENTS',
  ADD_FILAMENT: 'ADD_FILAMENT',
  UPDATE_FILAMENT: 'UPDATE_FILAMENT',
  DELETE_FILAMENT: 'DELETE_FILAMENT',
  LOAD_MODELS: 'LOAD_MODELS',
  ADD_MODEL: 'ADD_MODEL',
  UPDATE_MODEL: 'UPDATE_MODEL',
  DELETE_MODEL: 'DELETE_MODEL',
  LOAD_PRINTS: 'LOAD_PRINTS',
  ADD_PRINT: 'ADD_PRINT',
  UPDATE_PRINT: 'UPDATE_PRINT',
  DELETE_PRINT: 'DELETE_PRINT',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS'
}

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload }

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false }

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null }

    case ActionTypes.LOAD_FILAMENTS:
      return { ...state, filaments: action.payload, loading: false }

    case ActionTypes.ADD_FILAMENT:
      return { ...state, filaments: [...state.filaments, action.payload] }

    case ActionTypes.UPDATE_FILAMENT:
      return {
        ...state,
        filaments: state.filaments.map(filament =>
          filament.id === action.payload.id ? action.payload : filament
        )
      }

    case ActionTypes.DELETE_FILAMENT:
      return {
        ...state,
        filaments: state.filaments.filter(filament => filament.id !== action.payload)
      }

    case ActionTypes.LOAD_MODELS:
      return { ...state, models: action.payload, loading: false }

    case ActionTypes.ADD_MODEL:
      return { ...state, models: [...state.models, action.payload] }

    case ActionTypes.UPDATE_MODEL:
      return {
        ...state,
        models: state.models.map(model =>
          model.id === action.payload.id ? action.payload : model
        )
      }

    case ActionTypes.DELETE_MODEL:
      return {
        ...state,
        models: state.models.filter(model => model.id !== action.payload)
      }

    case ActionTypes.LOAD_PRINTS:
      return { ...state, prints: action.payload, loading: false }

    case ActionTypes.ADD_PRINT:
      return { ...state, prints: [...state.prints, action.payload] }

    case ActionTypes.UPDATE_PRINT:
      return {
        ...state,
        prints: state.prints.map(print =>
          print.id === action.payload.id ? action.payload : print
        )
      }

    case ActionTypes.DELETE_PRINT:
      return {
        ...state,
        prints: state.prints.filter(print => print.id !== action.payload)
      }

    case ActionTypes.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } }

    default:
      return state
  }
}

// Create context
const AppContext = createContext()

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const filaments = localStorage.getItem('printstack_filaments')
        const models = localStorage.getItem('printstack_models')
        const prints = localStorage.getItem('printstack_prints')
        const settings = localStorage.getItem('printstack_settings')

        if (filaments) {
          dispatch({ type: ActionTypes.LOAD_FILAMENTS, payload: JSON.parse(filaments) })
        }
        if (models) {
          dispatch({ type: ActionTypes.LOAD_MODELS, payload: JSON.parse(models) })
        }
        if (prints) {
          dispatch({ type: ActionTypes.LOAD_PRINTS, payload: JSON.parse(prints) })
        }
        if (settings) {
          dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: JSON.parse(settings) })
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load data from storage' })
      }
    }

    loadData()
  }, [])

  // Save data to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('printstack_filaments', JSON.stringify(state.filaments))
  }, [state.filaments])

  useEffect(() => {
    localStorage.setItem('printstack_models', JSON.stringify(state.models))
  }, [state.models])

  useEffect(() => {
    localStorage.setItem('printstack_prints', JSON.stringify(state.prints))
  }, [state.prints])

  useEffect(() => {
    localStorage.setItem('printstack_settings', JSON.stringify(state.settings))
  }, [state.settings])

  // Action creators
  const actions = {
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),

    // Filament actions
    addFilament: (filament) => {
      console.log('addFilament called with:', filament)
      const filamentWithMeta = {
        ...filament,
        id: filament.id || generateId(),
        createdAt: filament.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      console.log('addFilament processed data:', filamentWithMeta)
      return dispatch({ type: ActionTypes.ADD_FILAMENT, payload: filamentWithMeta })
    },
    updateFilament: (filament) => {
      const filamentWithUpdate = {
        ...filament,
        updatedAt: new Date().toISOString()
      }
      return dispatch({ type: ActionTypes.UPDATE_FILAMENT, payload: filamentWithUpdate })
    },
    deleteFilament: (id) => dispatch({ type: ActionTypes.DELETE_FILAMENT, payload: id }),

    // Model actions
    addModel: (model) => dispatch({ type: ActionTypes.ADD_MODEL, payload: model }),
    updateModel: (model) => dispatch({ type: ActionTypes.UPDATE_MODEL, payload: model }),
    deleteModel: (id) => dispatch({ type: ActionTypes.DELETE_MODEL, payload: id }),

    // Print actions
    addPrint: (print) => dispatch({ type: ActionTypes.ADD_PRINT, payload: print }),
    updatePrint: (print) => dispatch({ type: ActionTypes.UPDATE_PRINT, payload: print }),
    deletePrint: (id) => dispatch({ type: ActionTypes.DELETE_PRINT, payload: id }),

    // Settings actions
    updateSettings: (settings) => dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settings })
  }

  const value = {
    ...state,
    ...actions
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export { ActionTypes }