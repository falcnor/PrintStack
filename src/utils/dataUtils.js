// Utility functions for data management and validation

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Format weight (grams to kilograms)
export const formatWeight = (grams, units = 'metric') => {
  if (units === 'imperial') {
    const oz = grams * 0.035274
    return `${oz.toFixed(1)} oz`
  }
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} kg`
  }
  return `${grams} g`
}

// Calculate filament remaining percentage
export const calculateFilamentPercentage = (remaining, total) => {
  if (!total || total === 0) return 0
  return Math.round((remaining / total) * 100)
}

// Calculate filament cost per gram
export const calculateCostPerGram = (cost, weight) => {
  if (!weight || weight === 0) return 0
  return cost / weight
}

// Calculate total print time
export const calculatePrintTime = (startTime, endTime) => {
  if (!startTime || !endTime) return null
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end - start

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return { hours, minutes, totalMinutes: Math.floor(diffMs / (1000 * 60)) }
}

// Format print duration
export const formatPrintDuration = (startTime, endTime) => {
  const time = calculatePrintTime(startTime, endTime)
  if (!time) return 'Unknown'

  if (time.hours > 0) {
    return `${time.hours}h ${time.minutes}m`
  }
  return `${time.minutes}m`
}

// Validate filament data
export const validateFilament = (filament) => {
  const errors = []

  if (!filament.name || filament.name.trim() === '') {
    errors.push('Name is required')
  }

  if (!filament.material || filament.material.trim() === '') {
    errors.push('Material is required')
  }

  if (filament.weight && (isNaN(filament.weight) || filament.weight <= 0)) {
    errors.push('Weight must be a positive number')
  }

  if (filament.cost && (isNaN(filament.cost) || filament.cost < 0)) {
    errors.push('Cost must be a positive number')
  }

  if (filament.remainingWeight && (isNaN(filament.remainingWeight) || filament.remainingWeight < 0)) {
    errors.push('Remaining weight must be a positive number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate model data
export const validateModel = (model) => {
  const errors = []

  if (!model.name || model.name.trim() === '') {
    errors.push('Name is required')
  }

  if (!model.fileSize || isNaN(model.fileSize) || model.fileSize <= 0) {
    errors.push('File size must be a positive number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate print data
export const validatePrint = (print) => {
  const errors = []

  if (!print.modelId || print.modelId.trim() === '') {
    errors.push('Model is required')
  }

  if (!print.filamentId || print.filamentId.trim() === '') {
    errors.push('Filament is required')
  }

  if (!print.status || !['queued', 'printing', 'completed', 'failed'].includes(print.status)) {
    errors.push('Status must be valid')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Calculate statistics
export const calculateStats = (filaments, models, prints) => {
  const totalFilaments = filaments.length
  const totalModels = models.length
  const totalPrints = prints.length

  const completedPrints = prints.filter(print => print.status === 'completed')
  const failedPrints = prints.filter(print => print.status === 'failed')

  const totalFilamentCost = filaments.reduce((sum, filament) => sum + (filament.cost || 0), 0)
  const totalFilamentWeight = filaments.reduce((sum, filament) => sum + (filament.weight || 0), 0)

  const avgPrintSuccessRate = totalPrints > 0 ? (completedPrints.length / totalPrints) * 100 : 0

  return {
    totalFilaments,
    totalModels,
    totalPrints,
    completedPrints: completedPrints.length,
    failedPrints: failedPrints.length,
    successRate: Math.round(avgPrintSuccessRate),
    totalFilamentCost,
    totalFilamentWeight
  }
}

// Export data to JSON
export const exportToJSON = (data, filename) => {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

// Import data from JSON
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}