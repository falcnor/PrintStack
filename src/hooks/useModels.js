import { useContext } from 'react'
import { ModelContext } from '../contexts/ModelContext.js'
import { generateId } from '../utils/dataUtils.js'

// Custom hook for model operations with additional business logic
export const useModels = () => {
  const context = useContext(ModelContext)
  if (!context) {
    throw new Error('useModels must be used within a ModelProvider')
  }

  // Enhanced model operations with additional validation and business logic
  const enhancedActions = {
    ...context.actions,

    // Enhanced create with automatic validation
    createModel: async (modelData) => {
      try {
        // Add default values and validation
        const processedData = {
          ...modelData,
          id: modelData.id || generateId(),
          createdAt: modelData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Ensure requirements are properly formatted
          requirements: Array.isArray(modelData.requirements)
            ? modelData.requirements.map(req => ({
                id: req.id || generateId(),
                filamentId: req.filamentId,
                materialType: req.materialType,
                expectedWeight: parseFloat(req.expectedWeight) || 0
              }))
            : []
        }

        // Validate filament requirements exist
        if (processedData.requirements.length > 0) {
          const filaments = JSON.parse(localStorage.getItem('printstack_filaments') || '[]')
          for (const req of processedData.requirements) {
            const filament = filaments.find(f => f.id === req.filamentId)
            if (!filament) {
              throw new Error(`Filament with ID ${req.filamentId} not found`)
            }
          }
        }

        const success = context.actions.addModel(processedData)
        if (!success) {
          throw new Error('Failed to create model')
        }

        return processedData
      } catch (error) {
        context.actions.setError(`Failed to create model: ${error.message}`)
        throw error
      }
    },

    // Enhanced update with dependency checks
    updateModel: async (modelData) => {
      try {
        // Get current model data for validation
        const existingModel = context.models.find(m => m.id === modelData.id)
        if (!existingModel) {
          throw new Error('Model not found')
        }

        const processedData = {
          ...existingModel,
          ...modelData,
          updatedAt: new Date().toISOString(),
          // Ensure requirements are properly formatted
          requirements: Array.isArray(modelData.requirements)
            ? modelData.requirements.map(req => ({
                id: req.id || generateId(),
                filamentId: req.filamentId,
                materialType: req.materialType,
                expectedWeight: parseFloat(req.expectedWeight) || 0
              }))
            : existingModel.requirements
        }

        // Validate filament requirements exist
        if (processedData.requirements.length > 0) {
          const filaments = JSON.parse(localStorage.getItem('printstack_filaments') || '[]')
          for (const req of processedData.requirements) {
            const filament = filaments.find(f => f.id === req.filamentId)
            if (!filament) {
              throw new Error(`Filament with ID ${req.filamentId} not found`)
            }
          }
        }

        const success = context.actions.updateModel(processedData)
        if (!success) {
          throw new Error('Failed to update model')
        }

        return processedData
      } catch (error) {
        context.actions.setError(`Failed to update model: ${error.message}`)
        throw error
      }
    },

    // Enhanced delete with cascade validation
    deleteModel: async (modelId) => {
      try {
        // Check for associated prints
        const prints = JSON.parse(localStorage.getItem('printstack_prints') || '[]')
        const associatedPrints = prints.filter(print => print.modelId === modelId)

        if (associatedPrints.length > 0) {
          throw new Error(`Cannot delete model with ${associatedPrints.length} associated print(s). Please delete the prints first.`)
        }

        const success = context.actions.deleteModel(modelId)
        if (!success) {
          throw new Error('Failed to delete model')
        }

        return { success: true, deletedId: modelId }
      } catch (error) {
        context.actions.setError(`Failed to delete model: ${error.message}`)
        throw error
      }
    },

    // Batch operations
    createMultipleModels: async (modelsArray) => {
      const results = []
      const errors = []

      for (const modelData of modelsArray) {
        try {
          const result = await enhancedActions.createModel(modelData)
          results.push(result)
        } catch (error) {
          errors.push({ model: modelData.name || 'Unknown', error: error.message })
        }
      }

      return { results, errors }
    },

    // Search and filtering helpers
    searchModels: (query, options = {}) => {
      const {
        category = null,
        difficulty = null,
        canPrint = null,
        sortBy = 'name'
      } = options

      let filtered = context.models

      // Text search
      if (query) {
        const lowerQuery = query.toLowerCase()
        filtered = filtered.filter(model =>
          model.name.toLowerCase().includes(lowerQuery) ||
          model.category.toLowerCase().includes(lowerQuery) ||
          model.notes?.toLowerCase().includes(lowerQuery)
        )
      }

      // Category filter
      if (category) {
        filtered = filtered.filter(model => model.category === category)
      }

      // Difficulty filter
      if (difficulty) {
        filtered = filtered.filter(model => model.difficulty === difficulty)
      }

      // Printable filter
      if (canPrint !== null) {
        filtered = filtered.filter(model => model.canPrint === canPrint)
      }

      // Sort
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'category':
            return a.category.localeCompare(b.category)
          case 'difficulty':
            const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 }
            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
          case 'printTime':
            return (a.printTime || 0) - (b.printTime || 0)
          case 'created':
            return new Date(b.createdAt) - new Date(a.createdAt)
          default:
            return 0
        }
      })

      return filtered
    },

    // Analytics and statistics
    getModelStatistics: () => {
      const stats = {
        total: context.models.length,
        byCategory: {},
        byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
        printable: 0,
        cannotPrint: 0,
        averageDifficulty: 0,
        totalEstimatedTime: 0
      }

      context.models.forEach(model => {
        // Category stats
        stats.byCategory[model.category] = (stats.byCategory[model.category] || 0) + 1

        // Difficulty stats
        if (model.difficulty) {
          stats.byDifficulty[model.difficulty]++
        }

        // Printable stats
        if (model.canPrint) {
          stats.printable++
        } else {
          stats.cannotPrint++
        }

        // Time stats
        stats.totalEstimatedTime += model.printTime || 0
      })

      // Average difficulty (numeric weight)
      const difficultyWeight = { Easy: 1, Medium: 2, Hard: 3 }
      if (context.models.length > 0) {
        const totalDifficulty = context.models.reduce((sum, model) => {
          return sum + (difficultyWeight[model.difficulty] || 0)
        }, 0)
        stats.averageDifficulty = totalDifficulty / context.models.length
      }

      return stats
    },

    // Recommendation system
    getRecommendedModels: (filamentStock, limit = 5) => {
      const filaments = JSON.parse(localStorage.getItem('printstack_filaments') || '[]')
      const availableFilamentIds = filaments
        .filter(f => f.inStock && (filamentStock ? f.weight >= filamentStock : true))
        .map(f => f.id)

      const recommended = context.models
        .filter(model => {
          return model.requirements?.some(req =>
            availableFilamentIds.includes(req.filamentId)
          )
        })
        .map(model => {
          // Calculate a recommendation score
          const matchScore = model.requirements?.filter(req =>
            availableFilamentIds.includes(req.filamentId)
          ).length || 0

          const totalRequirements = model.requirements?.length || 1
          const completionPercentage = (matchScore / totalRequirements) * 100

          return {
            ...model,
            recommendationScore: completionPercentage,
            availableRequirements: matchScore
          }
        })
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, limit)

      return recommended
    }
  }

  return {
    ...context,
    actions: enhancedActions
  }
}

export default useModels