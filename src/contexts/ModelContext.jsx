import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react'
import { generateId } from '../utils/dataUtils.js'

// Model-specific initial state
const initialState = {
  models: [],
  categories: [],
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: 'all',
  sortBy: 'name' // 'name', 'category', 'difficulty', 'printTime'
}

// Action types for Model Context
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOAD_MODELS: 'LOAD_MODELS',
  ADD_MODEL: 'ADD_MODEL',
  UPDATE_MODEL: 'UPDATE_MODEL',
  DELETE_MODEL: 'DELETE_MODEL',
  LOAD_CATEGORIES: 'LOAD_CATEGORIES',
  ADD_CATEGORY: 'ADD_CATEGORY',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  SET_SORT_BY: 'SET_SORT_BY'
}

// Reducer function for model state management
const modelReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload }

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false }

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null }

    case ActionTypes.LOAD_MODELS:
      return { ...state, models: action.payload, loading: false }

    case ActionTypes.ADD_MODEL:
      const newModel = {
        ...action.payload,
        id: action.payload.id || generateId(),
        createdAt: action.payload.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return { ...state, models: [...state.models, newModel] }

    case ActionTypes.UPDATE_MODEL:
      const updatedModel = {
        ...action.payload,
        updatedAt: new Date().toISOString()
      }
      return {
        ...state,
        models: state.models.map(model =>
          model.id === action.payload.id ? updatedModel : model
        )
      }

    case ActionTypes.DELETE_MODEL:
      return {
        ...state,
        models: state.models.filter(model => model.id !== action.payload)
      }

    case ActionTypes.LOAD_CATEGORIES:
      return { ...state, categories: action.payload }

    case ActionTypes.ADD_CATEGORY:
      const newCategory = {
        id: action.payload.id || generateId(),
        name: action.payload.name.trim(),
        createdAt: new Date().toISOString()
      }

      // Check for duplicates
      if (state.categories.some(cat => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
        return { ...state, error: 'Category already exists' }
      }

      return { ...state, categories: [...state.categories, newCategory] }

    case ActionTypes.UPDATE_CATEGORY:
      const updatedCategory = {
        ...action.payload,
        name: action.payload.name.trim()
      }

      // Check for duplicates (excluding current category)
      if (state.categories.some(cat =>
        cat.id !== action.payload.id &&
        cat.name.toLowerCase() === updatedCategory.name.toLowerCase()
      )) {
        return { ...state, error: 'Category name already exists' }
      }

      return {
        ...state,
        categories: state.categories.map(category =>
          category.id === action.payload.id ? updatedCategory : category
        )
      }

    case ActionTypes.DELETE_CATEGORY:
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload)
      }

    case ActionTypes.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload }

    case ActionTypes.SET_SELECTED_CATEGORY:
      return { ...state, selectedCategory: action.payload }

    case ActionTypes.SET_SORT_BY:
      return { ...state, sortBy: action.payload }

    default:
      return state
  }
}

// Create context
const ModelContext = createContext()

// Provider component
export const ModelProvider = ({ children }) => {
  const [state, dispatch] = useReducer(modelReducer, initialState)

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const models = localStorage.getItem('printstack_models')
        const categories = localStorage.getItem('printstack_categories')

        if (models) {
          const parsedModels = JSON.parse(models)
          dispatch({ type: ActionTypes.LOAD_MODELS, payload: parsedModels })
        }

        if (categories) {
          const parsedCategories = JSON.parse(categories)
          dispatch({ type: ActionTypes.LOAD_CATEGORIES, payload: parsedCategories })
        } else {
          // Initialize with default categories if none exist
          const defaultCategories = [
            { id: generateId(), name: 'Functional', createdAt: new Date().toISOString() },
            { id: generateId(), name: 'Artistic', createdAt: new Date().toISOString() },
            { id: generateId(), name: 'Educational', createdAt: new Date().toISOString() },
            { id: generateId(), name: 'Prototype', createdAt: new Date().toISOString() },
            { id: generateId(), name: 'Replacement Part', createdAt: new Date().toISOString() },
            { id: generateId(), name: 'Toy/Gift', createdAt: new Date().toISOString() }
          ]
          dispatch({ type: ActionTypes.LOAD_CATEGORIES, payload: defaultCategories })
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Failed to load model data from storage' })
      }
    }

    loadData()
  }, [])

  // Save data to localStorage when state changes
  useEffect(() => {
    if (state.models.length > 0) {
      localStorage.setItem('printstack_models', JSON.stringify(state.models))
    }
  }, [state.models])

  useEffect(() => {
    if (state.categories.length > 0) {
      localStorage.setItem('printstack_categories', JSON.stringify(state.categories))
    }
  }, [state.categories])

  // Filtered and sorted models (computed values)
  const filteredAndSortedModels = useMemo(() => {
    let filtered = state.models

    // Filter by search query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(model =>
        model.name?.toLowerCase().includes(query) ||
        model.category?.toLowerCase().includes(query) ||
        model.notes?.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (state.selectedCategory && state.selectedCategory !== 'all') {
      filtered = filtered.filter(model => model.category === state.selectedCategory)
    }

    // Sort models
    const sorted = [...filtered].sort((a, b) => {
      switch (state.sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        case 'difficulty':
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 }
          return (difficultyOrder[a.difficulty] || 999) - (difficultyOrder[b.difficulty] || 999)
        case 'printTime':
          return (a.printTime || 0) - (b.printTime || 0)
        default:
          return 0
      }
    })

    return sorted
  }, [state.models, state.searchQuery, state.selectedCategory, state.sortBy])

  // Calculate printable status for models
  const modelsWithPrintableStatus = useMemo(() => {
    const filaments = JSON.parse(localStorage.getItem('printstack_filaments') || '[]')
    const filamentMap = new Map(filaments.map(f => [f.id, f]))

    return filteredAndSortedModels.map(model => {
      const canPrint = model.requirements?.every(requirement => {
        const filament = filamentMap.get(requirement.filamentId)
        return filament && filament.inStock
      }) || false

      const missingFilaments = model.requirements?.filter(requirement => {
        const filament = filamentMap.get(requirement.filamentId)
        return !filament || !filament.inStock
      }) || []

      return {
        ...model,
        canPrint,
        missingFilaments
      }
    })
  }, [filteredAndSortedModels])

  // Model validation
  const validateModel = (model) => {
    const errors = []

    if (!model.name || model.name.trim() === '') {
      errors.push('Model name is required')
    }

    if (!model.category || model.category.trim() === '') {
      errors.push('Category is required')
    }

    if (!model.difficulty || !['Easy', 'Medium', 'Hard'].includes(model.difficulty)) {
      errors.push('Valid difficulty level is required')
    }

    if (model.printTime && (isNaN(model.printTime) || model.printTime < 0 || model.printTime > 1440)) {
      errors.push('Print time must be between 0 and 1440 minutes')
    }

    if (model.layerHeight && (isNaN(model.layerHeight) || model.layerHeight < 0.05 || model.layerHeight > 1.0)) {
      errors.push('Layer height must be between 0.05 and 1.0 mm')
    }

    if (model.infill && (isNaN(model.infill) || model.infill < 0 || model.infill > 100)) {
      errors.push('Infill must be between 0 and 100 percent')
    }

    if (!model.requirements || model.requirements.length === 0) {
      errors.push('At least one filament requirement is required')
    } else {
      // Validate each requirement
      model.requirements.forEach((req, index) => {
        if (!req.filamentId) {
          errors.push(`Filament is required for requirement ${index + 1}`)
        }
        if (!req.materialType || req.materialType.trim() === '') {
          errors.push(`Material type is required for requirement ${index + 1}`)
        }
        if (req.expectedWeight && (isNaN(req.expectedWeight) || req.expectedWeight <= 0)) {
          errors.push(`Expected weight must be positive for requirement ${index + 1}`)
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

    // Model actions
    addModel: (model) => {
      const validation = validateModel(model)
      if (!validation.isValid) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: validation.errors.join(', ') })
        return false
      }
      dispatch({ type: ActionTypes.ADD_MODEL, payload: model })
      return true
    },

    updateModel: (model) => {
      const validation = validateModel(model)
      if (!validation.isValid) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: validation.errors.join(', ') })
        return false
      }
      dispatch({ type: ActionTypes.UPDATE_MODEL, payload: model })
      return true
    },

    deleteModel: (id) => {
      // Check if model has prints associated (would need prints context)
      const prints = JSON.parse(localStorage.getItem('printstack_prints') || '[]')
      const hasPrints = prints.some(print => print.modelId === id)

      if (hasPrints) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Cannot delete model with associated print history' })
        return false
      }

      dispatch({ type: ActionTypes.DELETE_MODEL, payload: id })
      return true
    },

    // Category actions
    addCategory: (name) => {
      if (!name || name.trim() === '') {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Category name is required' })
        return false
      }
      dispatch({ type: ActionTypes.ADD_CATEGORY, payload: { name } })
      return true
    },

    updateCategory: (id, name) => {
      if (!name || name.trim() === '') {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Category name is required' })
        return false
      }
      dispatch({ type: ActionTypes.UPDATE_CATEGORY, payload: { id, name } })
      return true
    },

    deleteCategory: (id) => {
      const modelsUsingCategory = state.models.some(model => model.category === id)
      if (modelsUsingCategory) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Cannot delete category that is being used by models' })
        return false
      }

      dispatch({ type: ActionTypes.DELETE_CATEGORY, payload: id })
      return true
    },

    // Filter and sort actions
    setSearchQuery: (query) => dispatch({ type: ActionTypes.SET_SEARCH_QUERY, payload: query }),
    setSelectedCategory: (category) => dispatch({ type: ActionTypes.SET_SELECTED_CATEGORY, payload: category }),
    setSortBy: (sortBy) => dispatch({ type: ActionTypes.SET_SORT_BY, payload: sortBy })
  }

  const value = {
    ...state,
    models: modelsWithPrintableStatus,
    filteredAndSortedModels,
    actions,
    validateModel
  }

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  )
}

// Custom hook to use the Model context
export const useModels = () => {
  const context = useContext(ModelContext)
  if (!context) {
    throw new Error('useModels must be used within a ModelProvider')
  }
  return context
}

export { ActionTypes }