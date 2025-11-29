/**
 * Variance Analysis Utilities
 * Provides comprehensive material usage analysis and insights for 3D printing
 */

/**
 * Calculate variance analysis between expected and actual material usage
 * @param {Array} expectedWeights - Array of expected weights for each filament
 * @param {Array} actualWeights - Array of actual weights used
 * @param {Object} options - Additional options for analysis
 * @returns {Object} Comprehensive variance analysis result
 */
export const calculateVarianceAnalysis = (expectedWeights, actualWeights, options = {}) => {
  const {
    tolerancePercent = 5,
    materialCosts = {},
    filamentNames = {}
  } = options

  // Input validation
  if (!Array.isArray(expectedWeights) || !Array.isArray(actualWeights)) {
    throw new Error('Expected and actual weights must be arrays')
  }

  if (expectedWeights.length !== actualWeights.length) {
    throw new Error('Expected and actual weights arrays must have the same length')
  }

  // Calculations
  const totalExpected = expectedWeights.reduce((sum, weight) => sum + (parseFloat(weight) || 0), 0)
  const totalActual = actualWeights.reduce((sum, weight) => sum + (parseFloat(weight) || 0), 0)

  // Handle zero expected weight case
  if (totalExpected === 0) {
    return {
      totalExpectedWeight: 0,
      totalActualWeight: totalActual,
      variancePercentage: 0,
      varianceWeight: totalActual,
      costImpact: calculateCostImpact(0, totalActual, materialCosts),
      analysis: 'No expected weight data available for analysis',
      quality: 'unknown',
      recommendations: totalActual > 0 ? ['Set up model requirements to enable variance analysis'] : [],
      detailedBreakdown: []
    }
  }

  const varianceWeight = totalActual - totalExpected
  const variancePercentage = (varianceWeight / totalExpected) * 100

  // Quality assessment
  const quality = assessVarianceQuality(Math.abs(variancePercentage), tolerancePercent)

  // Analysis description
  const analysis = generateAnalysisText(variancePercentage, varianceWeight)

  // Cost impact analysis
  const costImpact = calculateCostImpact(varianceWeight, varianceWeight, materialCosts)

  // Detailed breakdown with per-filament analysis
  const detailedBreakdown = expectedWeights.map((expected, index) => {
    const actual = actualWeights[index] || 0
    const filamentVarianceWeight = actual - expected
    const filamentVariancePercentage = expected > 0 ? (filamentVarianceWeight / expected) * 100 : 0

    return {
      index,
      filamentName: filamentNames[index] || `Filament ${index + 1}`,
      expectedWeight: parseFloat(expected.toFixed(2)),
      actualWeight: parseFloat(actual.toFixed(2)),
      varianceWeight: parseFloat(filamentVarianceWeight.toFixed(2)),
      variancePercentage: parseFloat(filamentVariancePercentage.toFixed(2)),
      quality: assessVarianceQuality(Math.abs(filamentVariancePercentage), tolerancePercent),
      costImpact: calculateCostImpact(filamentVarianceWeight, filamentVarianceWeight, materialCosts[index])
    }
  })

  // Generate recommendations
  const recommendations = generateRecommendations(
    variancePercentage,
    totalExpected,
    totalActual,
    quality,
    detailedBreakdown
  )

  return {
    totalExpectedWeight: parseFloat(totalExpected.toFixed(2)),
    totalActualWeight: parseFloat(totalActual.toFixed(2)),
    varianceWeight: parseFloat(varianceWeight.toFixed(2)),
    variancePercentage: parseFloat(variancePercentage.toFixed(2)),
    costImpact,
    analysis,
    quality,
    recommendations,
    detailedBreakdown,
    withinTolerance: Math.abs(variancePercentage) <= tolerancePercent
  }
}

/**
 * Assess the quality of variance based on percentage
 * @param {number} variancePercent - Absolute variance percentage
 * @param {number} tolerance - Acceptable tolerance percentage
 * @returns {string} Quality rating: 'excellent', 'good', 'fair', or 'poor'
 */
export const assessVarianceQuality = (variancePercent, tolerance = 5) => {
  if (variancePercent <= tolerance) return 'excellent'
  if (variancePercent <= tolerance * 2) return 'good'
  if (variancePercent <= tolerance * 4) return 'fair'
  return 'poor'
}

/**
 * Calculate cost impact of material variance
 * @param {number} varianceWeight - Weight variance in grams
 * @param {number} totalWeight - Total weight for calculation
 * @param {Object|number} materialCosts - Cost per gram or cost object
 * @returns {Object} Cost impact analysis
 */
export const calculateCostImpact = (varianceWeight, totalWeight, materialCosts = 0) => {
  let costPerGram = 0

  if (typeof materialCosts === 'number') {
    costPerGram = materialCosts
  } else if (typeof materialCosts === 'object' && materialCosts !== null) {
    // Calculate average cost if multiple materials
    const costs = Object.values(materialCosts).filter(cost => typeof cost === 'number')
    if (costs.length > 0) {
      costPerGram = costs.reduce((sum, cost) => sum + cost, 0) / costs.length
    }
  }

  const costImpact = (varianceWeight / 1000) * costPerGram // Convert to kg

  return {
    costPerGram: parseFloat(costPerGram.toFixed(4)),
    costImpact: parseFloat(costImpact.toFixed(2)),
    currency: '$',
    positive: costImpact >= 0
  }
}

/**
 * Generate human-readable analysis text
 * @param {number} variancePercent - Variance percentage
 * @param {number} varianceWeight - Variance weight in grams
 * @returns {string} Analysis description
 */
export const generateAnalysisText = (variancePercent, varianceWeight) => {
  const absPercent = Math.abs(variancePercent)
  const direction = variancePercent < 0 ? 'less' : 'more'
  const verb = variancePercent < 0 ? 'saved' : 'excess'

  let quality描述 = ''
  if (absPercent < 5) {
    quality描述 = 'Excellent variance - very close to expected usage'
  } else if (absPercent < 15) {
    quality描述 = 'Good variance - within acceptable range'
  } else if (absPercent < 30) {
    quality描述 = 'Fair variance - significant deviation from expected'
  } else {
    quality描述 = 'Poor variance - major difference from expected usage'
  }

  return `${quality描述} (${verb} ${Math.abs(varianceWeight.toFixed(1))}g, ${Math.abs(Math.round(variancePercent))}% ${direction} than expected)`
}

/**
 * Generate actionable recommendations based on variance analysis
 * @param {number} variancePercent - Overall variance percentage
 * @param {number} totalExpected - Total expected weight
 * @param {number} totalActual - Total actual weight
 * @param {string} quality - Quality assessment
 * @param {Array} detailedBreakdown - Per-filament breakdown
 * @returns {Array} Array of recommendation strings
 */
export const generateRecommendations = (variancePercent, totalExpected, totalActual, quality, detailedBreakdown) => {
  const recommendations = []

  if (quality === 'excellent') {
    recommendations.push('Material usage is optimal - continue current settings')
  } else if (quality === 'good') {
    recommendations.push('Material usage is acceptable - minor adjustments may improve efficiency')
  } else if (quality === 'fair') {
    recommendations.push('Consider reviewing print settings to reduce material waste')
    recommendations.push('Update model requirements to better match actual usage')
  } else {
    recommendations.push('Significant material variance detected - review print settings immediately')
    recommendations.push('Check filament diameter and flow rate calibration')
    recommendations.push('Consider updating infill settings for better material efficiency')
  }

  // Specific recommendations based on over/under usage
  if (variancePercent > 20) {
    recommendations.push('Excessive material usage - reduce infill or optimize support structures')
  } else if (variancePercent < -20) {
    recommendations.push('Unexpected material savings - verify print quality integrity')
  }

  // Check individual filaments for outliers
  const outliers = detailedBreakdown.filter(item => Math.abs(item.variancePercentage) > 30)
  if (outliers.length > 0) {
    recommendations.push(`${outliers.length} filament(s) with significant variance detected`)
    outliers.forEach(item => {
      if (item.variancePercent > 30) {
        recommendations.push(`Review ${item.filamentName} usage - using ${item.variancePercent.toFixed(1)}% more than expected`)
      } else if (item.variancePercent < -30) {
        recommendations.push(`Review ${item.filamentName} usage - using ${Math.abs(item.variancePercent).toFixed(1)}% less than expected`)
      }
    })
  }

  return recommendations
}

/**
 * Analyze multiple prints and generate statistics
 * @param {Array} prints - Array of print objects with variance data
 * @param {Object} options - Analysis options
 * @returns {Object} Comprehensive statistical analysis
 */
export const analyzePrintTrends = (prints, options = {}) => {
  const {
    period = 'all', // 'week', 'month', 'year', 'all'
    modelFilter = null,
    qualityFilter = null
  } = options

  let filteredPrints = prints.filter(print => print.varianceAnalysis)

  // Apply filters
  if (modelFilter) {
    filteredPrints = filteredPrints.filter(print => print.modelId === modelFilter)
  }

  if (qualityFilter) {
    filteredPrints = filteredPrints.filter(print => print.qualityRating === qualityFilter)
  }

  // Time period filtering
  if (period !== 'all') {
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    filteredPrints = filteredPrints.filter(print =>
      new Date(print.date) >= startDate
    )
  }

  // Calculate statistics
  const totalPrints = filteredPrints.length
  const qualityDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 }
  let totalVariancePercent = 0
  let totalWeightExpected = 0
  let totalWeightActual = 0

  filteredPrints.forEach(print => {
    const variance = print.varianceAnalysis
    qualityDistribution[variance.quality] = (qualityDistribution[variance.quality] || 0) + 1
    totalVariancePercent += Math.abs(variance.variancePercentage)
    totalWeightExpected += variance.totalExpectedWeight
    totalWeightActual += variance.totalActualWeight
  })

  const averageVariancePercent = totalPrints > 0 ? totalVariancePercent / totalPrints : 0
  const overallVariancePercent = totalWeightExpected > 0
    ? ((totalWeightActual - totalWeightExpected) / totalWeightExpected) * 100
    : 0

  // Identify trends
  const sortedPrints = [...filteredPrints].sort((a, b) => new Date(a.date) - new Date(b.date))
  const recentPrints = sortedPrints.slice(-10) // Last 10 prints
  const recentAvgVariance = recentPrints.length > 0
    ? recentPrints.reduce((sum, print) => sum + Math.abs(print.varianceAnalysis.variancePercentage), 0) / recentPrints.length
    : 0

  const trendImproving = recentAvgVariance < averageVariancePercent
  const trendStatus = totalPrints < 3 ? 'insufficient-data' : trendImproving ? 'improving' : 'declining'

  return {
    summary: {
      totalPrints,
      period,
      averageVariancePercent: parseFloat(averageVariancePercent.toFixed(2)),
      overallVariancePercent: parseFloat(overallVariancePercent.toFixed(2)),
      totalWeightExpected: parseFloat(totalWeightExpected.toFixed(2)),
      totalWeightActual: parseFloat(totalWeightActual.toFixed(2)),
      trendStatus
    },
    qualityDistribution,
    insights: generateInsights(qualityDistribution, averageVariancePercent, trendStatus),
    recommendations: generateTrendRecommendations(qualityDistribution, averageVariancePercent, trendStatus),
    rawData: filteredPrints
  }
}

/**
 * Generate insights from statistical analysis
 * @param {Object} qualityDistribution - Distribution of quality ratings
 * @param {number} averageVariance - Average variance percentage
 * @param {string} trendStatus - Trend status
 * @returns {Array} Array of insight objects
 */
export const generateInsights = (qualityDistribution, averageVariance, trendStatus) => {
  const insights = []
  const total = Object.values(qualityDistribution).reduce((sum, count) => sum + count, 0)

  if (total === 0) return insights

  // Quality distribution insights
  const excellentRate = (qualityDistribution.excellent / total) * 100
  const goodRate = (qualityDistribution.good / total) * 100
  const poorRate = (qualityDistribution.poor / total) * 100

  if (excellentRate > 70) {
    insights.push({
      type: 'positive',
      title: 'Excellent Material Efficiency',
      description: `${excellentRate.toFixed(1)}% of prints have excellent material usage accuracy`
    })
  }

  if (poorRate > 20) {
    insights.push({
      type: 'warning',
      title: 'High Variance Rate',
      description: `${poorRate.toFixed(1)}% of prints show poor material efficiency`
    })
  }

  if (averageVariance < 5) {
    insights.push({
      type: 'positive',
      title: 'Consistent Material Usage',
      description: `Average variance of ${averageVariance.toFixed(1)}% indicates excellent control`
    })
  } else if (averageVariance > 25) {
    insights.push({
      type: 'warning',
      title: 'Inconsistent Material Usage',
      description: `Average variance of ${averageVariance.toFixed(1)}% suggests calibration needed`
    })
  }

  // Trend insights
  if (trendStatus === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Improving Trend',
      description: 'Recent prints show better material efficiency than historical average'
    })
  } else if (trendStatus === 'declining') {
    insights.push({
      type: 'warning',
      title: 'Declining Trend',
      description: 'Recent prints show worse material efficiency - maintenance may be needed'
    })
  }

  return insights
}

/**
 * Generate trend-based recommendations
 * @param {Object} qualityDistribution - Distribution of quality ratings
 * @param {number} averageVariance - Average variance percentage
 * @param {string} trendStatus - Trend status
 * @returns {Array} Array of recommendation strings
 */
export const generateTrendRecommendations = (qualityDistribution, averageVariance, trendStatus) => {
  const recommendations = []
  const total = Object.values(qualityDistribution).reduce((sum, count) => sum + count, 0)

  if (total === 0) return recommendations

  const poorRate = (qualityDistribution.poor / total) * 100

  if (poorRate > 20) {
    recommendations.push('Review printer calibration and maintenance schedule')
    recommendations.push('Consider updating filament profiles based on actual usage data')
  }

  if (averageVariance > 15) {
    recommendations.push('Implement regular material usage tracking and analysis')
    recommendations.push('Train operators on optimal print settings for material efficiency')
  }

  if (trendStatus === 'declining') {
    recommendations.push('Investigate recent changes in print settings or filament quality')
    recommendations.push('Schedule preventive maintenance for printer components')
  }

  if (trendStatus === 'improving') {
    recommendations.push('Continue current maintenance and calibration practices')
    recommendations.push('Consider standardizing successful settings across similar prints')
  }

  return recommendations
}

/**
 * Calculate material efficiency score
 * @param {Object} varianceAnalysis - Variance analysis result
 * @returns {number} Efficiency score from 0 to 100
 */
export const calculateEfficiencyScore = (varianceAnalysis) => {
  if (!varianceAnalysis || varianceAnalysis.quality === 'unknown') {
    return 0
  }

  const variance = Math.abs(varianceAnalysis.variancePercent)

  // Score calculation based on variance percentage
  let score = 100

  if (variance > 5) score -= (variance - 5) * 2
  if (variance > 15) score -= (variance - 15) * 3
  if (variance > 30) score -= (variance - 30) * 4

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Export variance analysis data to CSV format
 * @param {Array} varianceData - Array of variance analysis results
 * @returns {string} CSV string
 */
export const exportToCsv = (varianceData) => {
  const headers = [
    'Print ID',
    'Date',
    'Model',
    'Expected Weight (g)',
    'Actual Weight (g)',
    'Variance Weight (g)',
    'Variance (%)',
    'Quality',
    'Cost Impact',
    'Within Tolerance'
  ]

  const rows = varianceData.map(variance => [
    variance.printId || '',
    variance.date || '',
    variance.modelName || '',
    variance.totalExpectedWeight || 0,
    variance.totalActualWeight || 0,
    variance.varianceWeight || 0,
    variance.variancePercentage || 0,
    variance.quality || '',
    variance.costImpact?.costImpact || 0,
    variance.withinTolerance || false
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export default {
  calculateVarianceAnalysis,
  assessVarianceQuality,
  calculateCostImpact,
  generateAnalysisText,
  generateRecommendations,
  analyzePrintTrends,
  calculateEfficiencyScore,
  exportToCsv
}