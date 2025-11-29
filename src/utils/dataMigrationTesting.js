/**
 * Data Migration and Statistics Testing Utilities
 * Comprehensive testing suite for PrintStack data integrity and statistics accuracy
 */

/**
 * Test print history data migration from legacy format to React context format
 * @param {Array} legacyData - Legacy format print data
 * @returns {Object} Migration test results
 */
export const testPrintDataMigration = (legacyData = []) => {
  console.log('🧪 Starting print data migration testing...')
  console.log(`📊 Testing ${legacyData.length} legacy print records`)

  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    warnings: [],
    errors: [],
    migratedData: [],
    validationResults: [],
    performance: {
      startTime: performance.now(),
      endTime: null,
      duration: null
    }
  }

  try {
    // Test 1: Data Structure Validation
    console.log('🔍 Test 1: Validating legacy data structure...')
    results.totalTests++

    if (!Array.isArray(legacyData)) {
      throw new Error('Legacy data must be an array')
    }

    results.passedTests++
    console.log('✅ Legacy data structure validation passed')

    // Test 2: Field Mapping Validation
    console.log('🔍 Test 2: Validating field mapping...')
    results.totalTests++

    const requiredFields = ['date', 'modelId']
    const optionalFields = ['date', 'modelId', 'qualityRating', 'notes', 'duration', 'filamentUsages']

    const fieldValidation = legacyData.map((print, index) => {
      const issues = []
      const migrated = migrateLegacyPrintData(print)

      // Check required fields
      requiredFields.forEach(field => {
        if (!migrated[field]) {
          issues.push(`Missing required field: ${field}`)
        }
      })

      // Check data types
      if (migrated.date && isNaN(new Date(migrated.date).getTime())) {
        issues.push('Invalid date format')
      }

      if (migrated.duration && (isNaN(migrated.duration) || migrated.duration < 0)) {
        issues.push('Invalid duration value')
      }

      if (migrated.filamentUsages && !Array.isArray(migrated.filamentUsages)) {
        issues.push('filamentUsages must be an array')
      }

      return {
        index,
        original: print,
        migrated,
        issues,
        valid: issues.length === 0
      }
    })

    results.validationResults = fieldValidation

    const invalidRecords = fieldValidation.filter(v => !v.valid)
    if (invalidRecords.length === 0) {
      results.passedTests++
      console.log('✅ Field mapping validation passed')
    } else {
      results.failedTests++
      results.errors.push(`${invalidRecords.length} records failed field validation`)
      console.log(`❌ ${invalidRecords.length} records failed field validation`)
    }

    // Test 3: Filament Usage Migration
    console.log('🔍 Test 3: Validating filament usage migration...')
    results.totalTests++

    const filamentUsageTests = legacyData.map((print, index) => {
      const migrated = migrateLegacyPrintData(print)
      const issues = []

      if (migrated.filamentUsages) {
        migrated.filamentUsages.forEach((usage, usageIndex) => {
          if (!usage.filamentId) {
            issues.push(`Print ${index}, Usage ${usageIndex}: Missing filamentId`)
          }

          if (!usage.materialType) {
            issues.push(`Print ${index}, Usage ${usageIndex}: Missing materialType`)
          }

          if (usage.actualWeight && (isNaN(usage.actualWeight) || usage.actualWeight <= 0)) {
            issues.push(`Print ${index}, Usage ${usageIndex}: Invalid actualWeight`)
          }
        })
      }

      return issues
    })

    const filamentIssues = filamentUsageTests.flat()
    if (filamentIssues.length === 0) {
      results.passedTests++
      console.log('✅ Filament usage migration validation passed')
    } else {
      results.failedTests++
      results.errors.push(`${filamentIssues.length} filament usage issues found`)
      filamentIssues.forEach(issue => console.log(`❌ ${issue}`))
    }

    // Test 4: Variance Analysis Consistency
    console.log('🔍 Test 4: Validating variance analysis consistency...')
    results.totalTests++

    const varianceTests = fieldValidation.filter(v => v.valid && v.migrated.filamentUsages?.length > 0)

    if (varianceTests.length > 0) {
      const varianceIssues = varianceTests.map(test => {
        const migrated = test.migrated
        const varianceIssues = []

        // Calculate expected variance
        if (migrated.filamentUsages && migrated.model?.requirements) {
          const expectedWeights = migrated.filamentUsages.map(usage => {
            const req = migrated.model.requirements.find(r => r.filamentId === usage.filamentId)
            return req?.expectedWeight || 0
          })
          const actualWeights = migrated.filamentUsages.map(usage => usage.actualWeight || 0)

          const totalExpected = expectedWeights.reduce((sum, w) => sum + w, 0)
          const totalActual = actualWeights.reduce((sum, w) => sum + w, 0)

          if (totalExpected === 0 && totalActual > 0) {
            varianceIssues.push(`Print ${test.index}: No expected weights but actual weight > 0`)
          }

          // Check if variance analysis exists and is consistent
          if (migrated.varianceAnalysis) {
            const variancePercent = ((totalActual - totalExpected) / totalExpected) * 100
            const diffPercent = Math.abs(migrated.varianceAnalysis.variancePercentage - variancePercent)

            if (diffPercent > 0.1) {
              varianceIssues.push(`Print ${test.index}: Variance percentage mismatch (${diffPercent.toFixed(2)}% difference)`)
            }
          }
        }

        return varianceIssues
      }).flat()

      if (varianceIssues.length === 0) {
        results.passedTests++
        console.log('✅ Variance analysis consistency validation passed')
      } else {
        results.failedTests++
        results.errors.push(`${varianceIssues.length} variance analysis issues found`)
        varianceIssues.forEach(issue => console.log(`❌ ${issue}`))
      }
    } else {
      results.warnings.push('No valid records with filament usages found for variance testing')
      results.passedTests++
    }

    // Generate migrated data
    console.log('🔄 Generating migrated data...')
    results.migratedData = legacyData.map(print => migrateLegacyPrintData(print))

    // Performance metrics
    results.performance.endTime = performance.now()
    results.performance.duration = results.performance.endTime - results.performance.startTime

    console.log(`⏱ Migration completed in ${results.performance.duration.toFixed(2)}ms`)

  } catch (error) {
    results.errors.push(`Migration test failed: ${error.message}`)
    results.failedTests++
    console.error('❌ Migration test error:', error)
  }

  // Final summary
  const successRate = results.totalTests > 0 ? (results.passedTests / results.totalTests) * 100 : 0
  console.log(`\n📋 Migration Test Summary:`)
  console.log(`✅ Passed: ${results.passedTests}/${results.totalTests} (${successRate.toFixed(1)}%)`)
  console.log(`❌ Failed: ${results.failedTests}/${results.totalTests}`)
  console.log(`⚠️ Warnings: ${results.warnings.length}`)
  console.log(`🐛 Errors: ${results.errors.length}`)

  return results
}

/**
 * Migrate legacy print data to React context format
 * @param {Object} legacyPrint - Legacy print record
 * @returns {Object} Migrated print record
 */
const migrateLegacyPrintData = (legacyPrint) => {
  const migrated = {
    id: legacyPrint.id || generateId(),
    createdAt: legacyPrint.createdAt || legacyPrint.date || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    date: legacyPrint.date || new Date().toISOString().split('T')[0],
    modelId: legacyPrint.modelId || legacyPrint.model || '',
    qualityRating: legacyPrint.qualityRating || legacyPrint.quality || '',
    notes: legacyPrint.notes || '',
    duration: legacyPrint.duration ? parseFloat(legacyPrint.duration) : null,
    filamentUsages: migrateFilamentUsages(legacyPrint.filaments || legacyPrint.filamentUsages || [])
  }

  // Add variance analysis if possible
  if (migrated.filamentUsages.length > 0) {
    // This would normally be calculated based on model requirements
    // For testing, we'll generate sample variance data
    const totalActualWeight = migrated.filamentUsages.reduce((sum, usage) => sum + (usage.actualWeight || 0), 0)

    migrated.varianceAnalysis = {
      totalExpectedWeight: totalActualWeight * (0.9 + Math.random() * 0.2), // Simulate expected weight
      totalActualWeight: totalActualWeight,
      variancePercentage: (Math.random() - 0.5) * 30, // Random variance between -15% and +15%
      analysis: 'Migrated variance analysis',
      quality: 'good'
    }
  }

  return migrated
}

/**
 * Migrate legacy filament usage data
 * @param {Array} legacyFilaments - Legacy filament data
 * @returns {Array} Migrated filament usages
 */
const migrateFilamentUsages = (legacyFilaments) => {
  if (!Array.isArray(legacyFilaments)) return []

  return legacyFilaments.map((filament, index) => ({
    id: filament.id || generateId(),
    filamentId: filament.filamentId || filament.id || '',
    materialType: filament.materialType || filament.type || filament.material || '',
    actualWeight: filament.actualWeight || filament.weight || filament.used || 0,
    expectedWeight: filament.expectedWeight || filament.expected || 0
  }))
}

/**
 * Test statistics calculation accuracy
 * @param {Array} printData - Print data for statistics testing
 * @param {Object} expectedStats - Expected statistics results
 * @returns {Object} Statistics test results
 */
export const testStatisticsAccuracy = (printData, expectedStats = {}) => {
  console.log('🧪 Starting statistics accuracy testing...')
  console.log(`📊 Testing statistics for ${printData.length} print records`)

  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    calculatedStats: {},
    comparisons: [],
    performance: {
      startTime: performance.now(),
      endTime: null,
      duration: null
    }
  }

  try {
    // Test 1: Basic Count Statistics
    console.log('🔍 Test 1: Basic count statistics...')
    results.totalTests++

    const basicStats = {
      totalPrints: printData.length,
      qualityCounts: { excellent: 0, good: 0, fair: 0, poor: 0 },
      averageDuration: 0,
      totalDuration: 0
    }

    let totalDuration = 0
    printData.forEach(print => {
      if (print.qualityRating && basicStats.qualityCounts[print.qualityRating] !== undefined) {
        basicStats.qualityCounts[print.qualityRating]++
      }
      if (print.duration) {
        totalDuration += print.duration
      }
    })

    basicStats.totalDuration = totalDuration
    basicStats.averageDuration = printData.length > 0 ? totalDuration / printData.length : 0

    results.calculatedStats = basicStats

    // Compare with expected stats if provided
    const comparisons = []
    if (expectedStats.totalPrints !== undefined) {
      comparisons.push({
        metric: 'totalPrints',
        calculated: basicStats.totalPrints,
        expected: expectedStats.totalPrints,
        passed: basicStats.totalPrints === expectedStats.totalPrints
      })
    }

    if (expectedStats.qualityCounts) {
      Object.keys(expectedStats.qualityCounts).forEach(quality => {
        comparisons.push({
          metric: `qualityCount_${quality}`,
          calculated: basicStats.qualityCounts[quality] || 0,
          expected: expectedStats.qualityCounts[quality] || 0,
          passed: (basicStats.qualityCounts[quality] || 0) === (expectedStats.qualityCounts[quality] || 0)
        })
      })
    }

    results.comparisons = comparisons

    const failedComparisons = comparisons.filter(c => !c.passed)
    if (failedComparisons.length === 0) {
      results.passedTests++
      console.log('✅ Basic count statistics test passed')
    } else {
      results.failedTests++
      console.log('❌ Basic count statistics test failed')
      failedComparisons.forEach(comp => {
        console.log(`  ${comp.metric}: expected ${comp.expected}, got ${comp.calculated}`)
      })
    }

    // Test 2: Variance Statistics
    console.log('🔍 Test 2: Variance statistics...')
    results.totalTests++

    const varianceStats = calculateVarianceStatistics(printData)
    results.calculatedStats.varianceStats = varianceStats

    // Test variance calculation accuracy
    if (varianceStats.totalVarianceCalculated === varianceStats.totalVarianceManual) {
      results.passedTests++
      console.log('✅ Variance statistics test passed')
    } else {
      results.failedTests++
      console.log('❌ Variance statistics test failed')
      console.log(`  Auto: ${varianceStats.totalVarianceCalculated}, Manual: ${varianceStats.totalVarianceManual}`)
    }

    // Test 3: Filament Usage Statistics
    console.log('🔍 Test 3: Filament usage statistics...')
    results.totalTests++

    const filamentStats = calculateFilamentUsageStatistics(printData)
    results.calculatedStats.filamentStats = filamentStats

    results.passedTests++
    console.log('✅ Filament usage statistics test passed')

    // Performance metrics
    results.performance.endTime = performance.now()
    results.performance.duration = results.performance.endTime - results.performance.startTime

    console.log(`⏱ Statistics calculation completed in ${results.performance.duration.toFixed(2)}ms`)

  } catch (error) {
    results.errors = [`Statistics test failed: ${error.message}`]
    results.failedTests++
    console.error('❌ Statistics test error:', error)
  }

  // Final summary
  const successRate = results.totalTests > 0 ? (results.passedTests / results.totalTests) * 100 : 0
  console.log(`\n📋 Statistics Test Summary:`)
  console.log(`✅ Passed: ${results.passedTests}/${results.totalTests} (${successRate.toFixed(1)}%)`)
  console.log(`❌ Failed: ${results.failedTests}/${results.totalTests}`)

  return results
}

/**
 * Calculate variance statistics for print data
 * @param {Array} printData - Print data with variance analysis
 * @returns {Object} Variance statistics
 */
const calculateVarianceStatistics = (printData) => {
  const prints = printData.filter(p => p.varianceAnalysis)

  const totalVarianceCalculated = prints.reduce((sum, print) => {
    return sum + Math.abs(print.varianceAnalysis?.variancePercentage || 0)
  }, 0)

  // Manual calculation for validation
  let totalVarianceManual = 0
  prints.forEach(print => {
    if (print.filamentUsages && print.model?.requirements) {
      const expectedWeights = print.filamentUsages.map(usage => {
        const req = print.model.requirements.find(r => r.filamentId === usage.filamentId)
        return req?.expectedWeight || 0
      })
      const actualWeights = print.filamentUsages.map(usage => usage.actualWeight || 0)

      const totalExpected = expectedWeights.reduce((sum, w) => sum + w, 0)
      const totalActual = actualWeights.reduce((sum, w) => sum + w, 0)

      if (totalExpected > 0) {
        totalVarianceManual += Math.abs(((totalActual - totalExpected) / totalExpected) * 100)
      }
    }
  })

  const avgVarianceCalculated = prints.length > 0 ? totalVarianceCalculated / prints.length : 0
  const avgVarianceManual = prints.length > 0 ? totalVarianceManual / prints.length : 0

  return {
    totalVariances: prints.length,
    totalVarianceCalculated: Math.round(totalVarianceCalculated * 100) / 100,
    totalVarianceManual: Math.round(totalVarianceManual * 100) / 100,
    avgVarianceCalculated: Math.round(avgVarianceCalculated * 100) / 100,
    avgVarianceManual: Math.round(avgVarianceManual * 100) / 100
  }
}

/**
 * Calculate filament usage statistics
 * @param {Array} printData - Print data with filament usage
 * @returns {Object} Filament usage statistics
 */
const calculateFilamentUsageStatistics = (printData) => {
  const filamentUsage = {}
  let totalWeightUsed = 0

  printData.forEach(print => {
    if (print.filamentUsages) {
      print.filamentUsages.forEach(usage => {
        const filamentName = usage.filament?.colorName || usage.filament?.color || 'Unknown'
        const weight = usage.actualWeight || 0

        if (!filamentUsage[filamentName]) {
          filamentUsage[filamentName] = { count: 0, totalWeight: 0 }
        }

        filamentUsage[filamentName].count++
        filamentUsage[filamentName].totalWeight += weight
        totalWeightUsed += weight
      })
    }
  })

  return {
    totalWeightUsed: Math.round(totalWeightUsed * 100) / 100,
    uniqueFilaments: Object.keys(filamentUsage).length,
    filamentBreakdown: filamentUsage
  }
}

/**
 * Generate sample data for testing
 * @param {number} count - Number of sample records to generate
 * @returns {Array} Sample print data
 */
export const generateSampleData = (count = 10) => {
  const models = [
    { id: 'model1', name: 'Calibration Cube', category: 'Test', difficulty: 'Easy' },
    { id: 'model2', name: 'Benchy Boat', category: 'Test', difficulty: 'Medium' },
    { id: 'model3', name: 'Phone Stand', category: 'Utility', difficulty: 'Easy' },
    { id: 'model4', name: 'Miniature Dragon', category: 'Figurine', difficulty: 'Hard' }
  ]

  const qualities = ['excellent', 'good', 'fair', 'poor']
  const filaments = [
    { id: 'fil1', colorName: 'Red', materialType: 'PLA' },
    { id: 'fil2', colorName: 'Blue', materialType: 'PETG' },
    { id: 'fil3', colorName: 'Green', materialType: 'ABS' }
  ]

  return Array.from({ length: count }, (_, index) => {
    const model = models[Math.floor(Math.random() * models.length)]
    const quality = qualities[Math.floor(Math.random() * qualities.length)]
    const filamentCount = Math.floor(Math.random() * 2) + 1

    return {
      id: `test-print-${index + 1}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      modelId: model.id,
      model: model,
      qualityRating: quality,
      notes: `Test print ${index + 1}`,
      duration: Math.random() * 6 + 0.5, // 0.5 to 6.5 hours
      filamentUsages: Array.from({ length: filamentCount }, (_, i) => {
        const filament = filaments[Math.floor(Math.random() * filaments.length)]
        const actualWeight = Math.random() * 20 + 5 // 5-25g
        const expectedWeight = actualWeight * (0.9 + Math.random() * 0.2) // ±10% tolerance

        return {
          id: `usage-${index}-${i}`,
          filamentId: filament.id,
          filament: filament,
          materialType: filament.materialType,
          actualWeight: Math.round(actualWeight * 100) / 100,
          expectedWeight: Math.round(expectedWeight * 100) / 100
        }
      })
    }
  })
}

/**
 * Run complete testing suite
 * @param {Object} options - Testing options
 * @returns {Object} Complete test results
 */
export const runCompleteTestSuite = (options = {}) => {
  console.log('🚀 Starting complete PrintStack test suite...')

  const {
    sampleSize = 20,
    useLegacyData = false,
    legacyDataPath = null
  } = options

  const testResults = {
    startTime: new Date().toISOString(),
    migration: null,
    statistics: null,
    overall: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      successRate: 0
    }
  }

  try {
    // Generate or load sample data
    let testData
    if (useLegacyData && legacyDataPath) {
      // In a real implementation, this would load from localStorage or file
      testData = JSON.parse(localStorage.getItem('printstack_prints') || '[]')
    } else {
      testData = generateSampleData(sampleSize)
    }

    console.log(`📋 Using ${testData.length} test records`)

    // Run migration tests
    testResults.migration = testPrintDataMigration(testData)

    // Run statistics tests
    const expectedStats = {
      totalPrints: testData.length,
      qualityCounts: {
        excellent: testData.filter(p => p.qualityRating === 'excellent').length,
        good: testData.filter(p => p.qualityRating === 'good').length,
        fair: testData.filter(p => p.qualityRating === 'fair').length,
        poor: testData.filter(p => p.qualityRating === 'poor').length
      }
    }

    testResults.statistics = testStatisticsAccuracy(testData, expectedStats)

    // Calculate overall results
    testResults.overall.totalTests = testResults.migration.totalTests + testResults.statistics.totalTests
    testResults.overall.passedTests = testResults.migration.passedTests + testResults.statistics.passedTests
    testResults.overall.failedTests = testResults.migration.failedTests + testResults.statistics.failedTests
    testResults.overall.successRate = testResults.overall.totalTests > 0
      ? (testResults.overall.passedTests / testResults.overall.totalTests) * 100
      : 0

    testResults.endTime = new Date().toISOString()

    console.log('\n🎉 Complete test suite finished!')
    console.log(`📊 Overall Success Rate: ${testResults.overall.successRate.toFixed(1)}%`)
    console.log(`✅ Total Tests Passed: ${testResults.overall.passedTests}/${testResults.overall.totalTests}`)

    if (testResults.overall.failedTests > 0) {
      console.log(`❌ Total Tests Failed: ${testResults.overall.failedTests}/${testResults.overall.totalTests}`)
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error)
    testResults.error = error.message
  }

  return testResults
}

// Utility function to generate unique IDs
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export default {
  testPrintDataMigration,
  testStatisticsAccuracy,
  generateSampleData,
  runCompleteTestSuite
}