import { useContext } from 'react'
import { PrintContext } from '../contexts/PrintContext.js'
import { generateId } from '../utils/dataUtils.js'

// Custom hook for print operations with additional business logic
export const usePrints = () => {
  const context = useContext(PrintContext)
  if (!context) {
    throw new Error('usePrints must be used within a PrintProvider')
  }

  // Enhanced print operations with additional validation and business logic
  const enhancedActions = {
    ...context.actions,

    // Enhanced create with automatic validation and variance calculation
    createPrint: async (printData) => {
      try {
        // Add default values and validation
        const processedData = {
          ...printData,
          id: printData.id || generateId(),
          createdAt: printData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Ensure filamentUsages are properly formatted
          filamentUsages: Array.isArray(printData.filamentUsages)
            ? printData.filamentUsages.map(usage => ({
                id: usage.id || generateId(),
                filamentId: usage.filamentId,
                materialType: usage.materialType,
                actualWeight: parseFloat(usage.actualWeight) || 0
              }))
            : []
        }

        // Enhanced validation
        if (!processedData.modelId) {
          throw new Error('Model ID is required')
        }

        if (!processedData.date) {
          throw new Error('Print date is required')
        }

        if (processedData.filamentUsages.length === 0) {
          throw new Error('At least one filament usage is required')
        }

        // Validate filament usages exist
        const filaments = JSON.parse(localStorage.getItem('printstack_filaments') || '[]')
        for (const usage of processedData.filamentUsages) {
          const filament = filaments.find(f => f.id === usage.filamentId)
          if (!filament) {
            throw new Error(`Filament with ID ${usage.filamentId} not found`)
          }

          if (!filament.inStock) {
            console.warn(`Warning: Filament ${filament.colorName || filament.color} is out of stock`)
          }
        }

        // Validate model exists
        const models = JSON.parse(localStorage.getItem('printstack_models') || '[]')
        const model = models.find(m => m.id === processedData.modelId)
        if (!model) {
          throw new Error(`Model with ID ${processedData.modelId} not found`)
        }

        // Calculate variance analysis automatically
        if (model.requirements) {
          const expectedWeights = processedData.filamentUsages.map(usage => {
            const req = model.requirements.find(r => r.filamentId === usage.filamentId)
            return req?.expectedWeight || 0
          })
          const actualWeights = processedData.filamentUsages.map(usage => usage.actualWeight || 0)

          processedData.varianceAnalysis = calculateVarianceAnalysis(expectedWeights, actualWeights)
        }

        const success = context.actions.addPrint(processedData)
        if (!success) {
          throw new Error('Failed to create print')
        }

        return processedData
      } catch (error) {
        context.actions.setError(`Failed to create print: ${error.message}`)
        throw error
      }
    },

    // Enhanced update with variance recalculation
    updatePrint: async (printData) => {
      try {
        // Get current print data for validation
        const existingPrint = context.prints.find(p => p.id === printData.id)
        if (!existingPrint) {
          throw new Error('Print not found')
        }

        const processedData = {
          ...existingPrint,
          ...printData,
          updatedAt: new Date().toISOString(),
          // Ensure filamentUsages are properly formatted
          filamentUsages: Array.isArray(printData.filamentUsages)
            ? printData.filamentUsages.map(usage => ({
                id: usage.id || generateId(),
                filamentId: usage.filamentId,
                materialType: usage.materialType,
                actualWeight: parseFloat(usage.actualWeight) || 0
              }))
            : existingPrint.filamentUsages
        }

        // Validate filament usages exist
        const filaments = JSON.parse(localStorage.getItem('printstack_filaments') || '[]')
        for (const usage of processedData.filamentUsages) {
          const filament = filaments.find(f => f.id === usage.filamentId)
          if (!filament) {
            throw new Error(`Filament with ID ${usage.filamentId} not found`)
          }
        }

        // Recalculate variance analysis if model exists
        const models = JSON.parse(localStorage.getItem('printstack_models') || '[]')
        const model = models.find(m => m.id === processedData.modelId)
        if (model?.requirements) {
          const expectedWeights = processedData.filamentUsages.map(usage => {
            const req = model.requirements.find(r => r.filamentId === usage.filamentId)
            return req?.expectedWeight || 0
          })
          const actualWeights = processedData.filamentUsages.map(usage => usage.actualWeight || 0)

          processedData.varianceAnalysis = calculateVarianceAnalysis(expectedWeights, actualWeights)
        }

        const success = context.actions.updatePrint(processedData)
        if (!success) {
          throw new Error('Failed to update print')
        }

        return processedData
      } catch (error) {
        context.actions.setError(`Failed to update print: ${error.message}`)
        throw error
      }
    },

    // Enhanced delete with validation
    deletePrint: async (printId) => {
      try {
        const print = context.prints.find(p => p.id === printId)
        if (!print) {
          throw new Error('Print not found')
        }

        const success = context.actions.deletePrint(printId)
        if (!success) {
          throw new Error('Failed to delete print')
        }

        return { success: true, deletedId: printId }
      } catch (error) {
        context.actions.setError(`Failed to delete print: ${error.message}`)
        throw error
      }
    },

    // Batch operations
    createMultiplePrints: async (printsArray) => {
      const results = []
      const errors = []

      for (const printData of printsArray) {
        try {
          const result = await enhancedActions.createPrint(printData)
          results.push(result)
        } catch (error) {
          errors.push({ print: printData.date || 'Unknown', error: error.message })
        }
      }

      return { results, errors }
    },

    // Advanced search and filtering
    searchPrints: (query, options = {}) => {
      const {
        modelId = null,
        qualityRating = null,
        dateRange = null,
        minDuration = null,
        maxDuration = null,
        varianceRange = null,
        sortBy = 'date'
      } = options

      let filtered = context.prints

      // Text search
      if (query) {
        const lowerQuery = query.toLowerCase()
        filtered = filtered.filter(print =>
          print.model?.name?.toLowerCase().includes(lowerQuery) ||
          print.notes?.toLowerCase().includes(lowerQuery) ||
          print.qualityRating?.toLowerCase().includes(lowerQuery)
        )
      }

      // Model filter
      if (modelId) {
        filtered = filtered.filter(print => print.modelId === modelId)
      }

      // Quality rating filter
      if (qualityRating) {
        filtered = filtered.filter(print => print.qualityRating === qualityRating)
      }

      // Date range filter
      if (dateRange && dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start)
        const end = new Date(dateRange.end)
        filtered = filtered.filter(print => {
          const printDate = new Date(print.date)
          return printDate >= start && printDate <= end
        })
      }

      // Duration range filter
      if (minDuration !== null) {
        filtered = filtered.filter(print => (print.duration || 0) >= minDuration)
      }
      if (maxDuration !== null) {
        filtered = filtered.filter(print => (print.duration || 0) <= maxDuration)
      }

      // Variance range filter
      if (varianceRange && varianceRange.min !== null && varianceRange.max !== null) {
        filtered = filtered.filter(print => {
          if (!print.varianceAnalysis) return false
          const variance = Math.abs(print.varianceAnalysis.variancePercentage)
          return variance >= varianceRange.min && variance <= varianceRange.max
        })
      }

      // Sort
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.date) - new Date(a.date)
          case 'model':
            return (a.model?.name || '').localeCompare(b.model?.name || '')
          case 'quality':
            const qualityOrder = { 'excellent': 1, 'good': 2, 'fair': 3, 'poor': 4 }
            return (qualityOrder[a.qualityRating] || 5) - (qualityOrder[b.qualityRating] || 5)
          case 'duration':
            return (b.duration || 0) - (a.duration || 0)
          case 'variance':
            const varianceA = Math.abs(a.varianceAnalysis?.variancePercentage || 0)
            const varianceB = Math.abs(b.varianceAnalysis?.variancePercentage || 0)
            return varianceB - varianceA
          default:
            return 0
        }
      })

      return filtered
    },

    // Analytics and statistics
    getPrintStatistics: (filters = {}) => {
      let prints = context.prints

      // Apply filters if provided
      if (filters.modelId) {
        prints = prints.filter(print => print.modelId === filters.modelId)
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate)
        prints = prints.filter(print => new Date(print.date) >= start)
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate)
        prints = prints.filter(print => new Date(print.date) <= end)
      }

      const stats = {
        total: prints.length,
        byQuality: { excellent: 0, good: 0, fair: 0, poor: 0 },
        byModel: {},
        byMonth: {},
        averageDuration: 0,
        totalDuration: 0,
        averageVariance: 0,
        varianceDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
        filamentUsage: {}
      }

      let totalDuration = 0
      let totalVariance = 0
      let varianceCount = 0

      prints.forEach(print => {
        // Quality stats
        if (print.qualityRating && stats.byQuality[print.qualityRating] !== undefined) {
          stats.byQuality[print.qualityRating]++
        }

        // Model stats
        const modelName = print.model?.name || 'Unknown'
        stats.byModel[modelName] = (stats.byModel[modelName] || 0) + 1

        // Monthly stats
        const month = print.date.substring(0, 7) // YYYY-MM
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1

        // Duration stats
        if (print.duration) {
          totalDuration += print.duration
        }

        // Variance stats
        if (print.varianceAnalysis) {
          const variance = Math.abs(print.varianceAnalysis.variancePercentage)
          totalVariance += variance
          varianceCount++

          // Categorize variance quality
          if (variance < 5) {
            stats.varianceDistribution.excellent++
          } else if (variance < 15) {
            stats.varianceDistribution.good++
          } else if (variance < 30) {
            stats.varianceDistribution.fair++
          } else {
            stats.varianceDistribution.poor++
          }
        }

        // Filament usage stats
        print.filamentUsages?.forEach(usage => {
          const filamentName = usage.filament?.colorName || usage.filament?.color || 'Unknown'
          if (!stats.filamentUsage[filamentName]) {
            stats.filamentUsage[filamentName] = { count: 0, totalWeight: 0 }
          }
          stats.filamentUsage[filamentName].count++
          stats.filamentUsage[filamentName].totalWeight += usage.actualWeight || 0
        })
      })

      stats.averageDuration = prints.length > 0 ? totalDuration / prints.length : 0
      stats.totalDuration = totalDuration
      stats.averageVariance = varianceCount > 0 ? totalVariance / varianceCount : 0

      return stats
    },

    // Print efficiency analysis
    getPrintEfficiency: (modelId = null) => {
      const prints = modelId
        ? context.prints.filter(print => print.modelId === modelId)
        : context.prints

      const efficiency = {
        totalPrints: prints.length,
        avgVariance: 0,
        successRate: 0,
        avgDuration: 0,
        qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
        filamentEfficiency: {}
      }

      let totalVariance = 0
      let validPrints = 0
      let totalDuration = 0

      prints.forEach(print => {
        if (print.varianceAnalysis) {
          totalVariance += Math.abs(print.varianceAnalysis.variancePercentage)
          validPrints++
        }

        if (print.duration) {
          totalDuration += print.duration
        }

        if (print.qualityRating && efficiency.qualityDistribution[print.qualityRating] !== undefined) {
          efficiency.qualityDistribution[print.qualityRating]++
        }
      })

      efficiency.avgVariance = validPrints > 0 ? totalVariance / validPrints : 0
      efficiency.successRate = ((efficiency.qualityDistribution.excellent || 0) + (efficiency.qualityDistribution.good || 0)) / prints.length
      efficiency.avgDuration = prints.length > 0 ? totalDuration / prints.length : 0

      return efficiency
    },

    // Recommendations and insights
    getPrintRecommendations: () => {
      const recommendations = []
      const stats = enhancedActions.getPrintStatistics()

      // Recommend models with high success rates
      const modelEfficiency = {}
      context.prints.forEach(print => {
        if (!modelEfficiency[print.modelId]) {
          modelEfficiency[print.modelId] = { name: print.model?.name, total: 0, success: 0 }
        }
        modelEfficiency[print.modelId].total++
        if (['excellent', 'good'].includes(print.qualityRating)) {
          modelEfficiency[print.modelId].success++
        }
      })

      const successfulModels = Object.entries(modelEfficiency)
        .filter(([_, data]) => data.total >= 3 && data.success / data.total > 0.8)
        .map(([id, data]) => ({ id, name: data.name, successRate: data.success / data.total }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5)

      if (successfulModels.length > 0) {
        recommendations.push({
          type: 'models',
          title: 'High Success Rate Models',
          items: successfulModels
        })
      }

      // Recommend quality improvements
      if (stats.byQuality.poor > stats.byQuality.excellent) {
        recommendations.push({
          type: 'quality',
          title: 'Quality Improvement Needed',
          message: 'Consider reviewing print settings for better results'
        })
      }

      // Recommend variance analysis
      if (stats.averageVariance > 20) {
        recommendations.push({
          type: 'variance',
          title: 'High Material Variance Detected',
          message: 'Consider updating model requirements to match actual usage'
        })
      }

      return recommendations
    },

    // Data export functionality
    exportPrintData: (format = 'json', filters = {}) => {
      const prints = enhancedActions.searchPrints('', filters)
      const stats = enhancedActions.getPrintStatistics(filters)

      const exportData = {
        exportDate: new Date().toISOString(),
        filters: filters,
        summary: stats,
        prints: prints.map(print => ({
          id: print.id,
          model: print.model?.name,
          date: print.date,
          qualityRating: print.qualityRating,
          duration: print.duration,
          totalWeight: print.filamentUsages?.reduce((sum, usage) => sum + (usage.actualWeight || 0), 0),
          variancePercentage: print.varianceAnalysis?.variancePercentage,
          notes: print.notes
        }))
      }

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2)
      } else if (format === 'csv') {
        const headers = ['ID', 'Model', 'Date', 'Quality', 'Duration (h)', 'Weight (g)', 'Variance (%)', 'Notes']
        const rows = exportData.prints.map(print => [
          print.id,
          print.model || '',
          print.date,
          print.qualityRating || '',
          print.duration || '',
          print.totalWeight || '',
          print.variancePercentage || '',
          print.notes || ''
        ])

        return [headers, ...rows].map(row => row.join(',')).join('\n')
      }

      return exportData
    }
  }

  // Utility function for variance calculation
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

  return {
    ...context,
    actions: enhancedActions
  }
}

export default usePrints