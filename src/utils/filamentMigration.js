import { generateId } from './dataUtils.js'
import { validateFilament } from './dataUtils.js'

// Migration utility for filament data from vanilla JavaScript to React
class FilamentMigration {
  constructor() {
    this.migrationLog = []
    this.errors = []
  }

  log(message, type = 'info') {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message
    }
    this.migrationLog.push(entry)
    console.log(`[FilamentMigration ${type.toUpperCase()}]`, message)
  }

  error(message, error = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      type: 'error',
      message,
      error: error ? error.toString() : null
    }
    this.errors.push(entry)
    this.migrationLog.push(entry)
    console.error(`[FilamentMigration ERROR]`, message, error)
  }

  // Migrate data from old localStorage format to new format
  migrateFromLegacy() {
    this.log('Starting filament migration from legacy data')

    try {
      // Check for old format data
      const legacyFilaments = this.getLegacyFilaments()
      const legacyModels = this.getLegacyModels()
      const legacyPrints = this.getLegacyPrints()

      const migratedData = {
        filaments: [],
        models: [],
        prints: []
      }

      // Migrate filaments
      if (legacyFilaments.length > 0) {
        this.log(`Found ${legacyFilaments.length} legacy filaments`)
        migratedData.filaments = this.migrateFilaments(legacyFilaments)
        this.log(`Successfully migrated ${migratedData.filaments.length} filaments`)
      }

      // Migrate models
      if (legacyModels.length > 0) {
        this.log(`Found ${legacyModels.length} legacy models`)
        migratedData.models = this.migrateModels(legacyModels)
        this.log(`Successfully migrated ${migratedData.models.length} models`)
      }

      // Migrate prints
      if (legacyPrints.length > 0) {
        this.log(`Found ${legacyPrints.length} legacy prints`)
        migratedData.prints = this.migratePrints(legacyPrints, migratedData.filaments, migratedData.models)
        this.log(`Successfully migrated ${migratedData.prints.length} prints`)
      }

      // Save migrated data to new format
      if (migratedData.filaments.length > 0 || migratedData.models.length > 0 || migratedData.prints.length > 0) {
        this.saveMigratedData(migratedData)
        this.backupLegacyData()
        this.log('Migration completed successfully')
      } else {
        this.log('No legacy data found to migrate')
      }

      return {
        success: this.errors.length === 0,
        migrated: migratedData,
        errors: this.errors,
        log: this.migrationLog
      }

    } catch (error) {
      this.error('Migration failed', error)
      return {
        success: false,
        migrated: { filaments: [], models: [], prints: [] },
        errors: this.errors,
        log: this.migrationLog
      }
    }
  }

  // Get legacy filament data from various possible sources
  getLegacyFilaments() {
    const sources = [
      'filaments', // New format
      'printstack_filaments', // Current format
      'filamentData', // Old format
      'printStack_filaments' // Alternative format
    ]

    for (const source of sources) {
      try {
        const data = localStorage.getItem(source)
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.log(`Found filament data in '${source}'`)
            return parsed
          }
        }
      } catch (error) {
        this.log(`Failed to read '${source}': ${error.message}`)
      }
    }

    return []
  }

  // Get legacy model data
  getLegacyModels() {
    const sources = ['models', 'printstack_models', 'modelData', 'printStack_models']

    for (const source of sources) {
      try {
        const data = localStorage.getItem(source)
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.log(`Found model data in '${source}'`)
            return parsed
          }
        }
      } catch (error) {
        this.log(`Failed to read '${source}': ${error.message}`)
      }
    }

    return []
  }

  // Get legacy print data
  getLegacyPrints() {
    const sources = ['prints', 'printstack_prints', 'printData', 'printStack_prints']

    for (const source of sources) {
      try {
        const data = localStorage.getItem(source)
        if (data) {
          const parsed = JSON.parse(data)
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.log(`Found print data in '${source}'`)
            return parsed
          }
        }
      } catch (error) {
        this.log(`Failed to read '${source}': ${error.message}`)
      }
    }

    return []
  }

  // Migrate filaments to new format
  migrateFilaments(legacyFilaments) {
    return legacyFilaments.map((legacyFilament, index) => {
      try {
        const migrated = {
          id: legacyFilament.id || generateId(),
          name: legacyFilament.name || legacyFilament.type || `Filament ${index + 1}`,
          material: this.normalizeMaterial(legacyFilament.material || legacyFilament.type || 'PLA'),
          color: legacyFilament.color || '',
          weight: this.normalizeWeight(legacyFilament.weight),
          remainingWeight: this.normalizeWeight(legacyFilament.remainingWeight || legacyFilament.remaining || legacyFilament.weight),
          cost: this.normalizeCost(legacyFilament.cost || legacyFilament.price),
          diameter: legacyFilament.diameter || '1.75',
          temperature: legacyFilament.temperature || '',
          notes: legacyFilament.notes || legacyFilament.description || '',
          createdAt: legacyFilament.createdAt || legacyFilament.addedAt || new Date().toISOString(),
          updatedAt: legacyFilament.updatedAt || legacyFilament.modifiedAt || new Date().toISOString()
        }

        // Validate migrated data
        const validation = validateFilament(migrated)
        if (!validation.isValid) {
          this.error(`Validation failed for filament "${migrated.name}": ${validation.errors.join(', ')}`)
          // Still include it but mark with issues
        }

        return migrated
      } catch (error) {
        this.error(`Failed to migrate filament at index ${index}`, error)
        return null
      }
    }).filter(Boolean) // Remove null entries
  }

  // Migrate models to new format
  migrateModels(legacyModels) {
    return legacyModels.map((legacyModel, index) => {
      try {
        return {
          id: legacyModel.id || generateId(),
          name: legacyModel.name || legacyModel.title || `Model ${index + 1}`,
          category: legacyModel.category || legacyModel.type || 'Uncategorized',
          description: legacyModel.description || '',
          fileSize: this.normalizeFileSize(legacyModel.fileSize || legacyModel.size || 0),
          printTime: this.normalizeTime(legacyModel.printTime || legacyModel.estimatedTime || 0),
          filamentRequired: this.normalizeWeight(legacyModel.filamentRequired || legacyModel.filament || 0),
          complexity: legacyModel.complexity || 'Medium',
          supports: legacyModel.supports || false,
          infill: legacyModel.infill || '20%',
          createdAt: legacyModel.createdAt || legacyModel.addedAt || new Date().toISOString(),
          updatedAt: legacyModel.updatedAt || legacyModel.modifiedAt || new Date().toISOString()
        }
      } catch (error) {
        this.error(`Failed to migrate model at index ${index}`, error)
        return null
      }
    }).filter(Boolean)
  }

  // Migrate prints to new format
  migratePrints(legacyPrints, migratedFilaments, migratedModels) {
    return legacyPrints.map((legacyPrint, index) => {
      try {
        // Map legacy IDs to new IDs if necessary
        const filamentId = this.mapFilamentId(legacyPrint.filamentId, legacyPrint.filament, migratedFilaments)
        const modelId = this.mapModelId(legacyPrint.modelId, legacyPrint.model, migratedModels)

        if (!filamentId || !modelId) {
          this.error(`Print at index ${index} has invalid filament or model reference`)
          return null
        }

        return {
          id: legacyPrint.id || generateId(),
          modelId,
          filamentId,
          status: this.normalizeStatus(legacyPrint.status),
          startTime: legacyPrint.startTime || legacyPrint.startDate,
          endTime: legacyPrint.endTime || legacyPrint.endDate,
          actualWeight: this.normalizeWeight(legacyPrint.actualWeight || legacyPrint.weightUsed),
          expectedWeight: this.normalizeWeight(legacyPrint.expectedWeight || legacyPrint.weight),
          quality: legacyPrint.quality || legacyPrint.rating || null,
          notes: legacyPrint.notes || legacyPrint.comments || '',
          createdAt: legacyPrint.createdAt || legacyPrint.addedAt || new Date().toISOString(),
          updatedAt: legacyPrint.updatedAt || legacyPrint.modifiedAt || new Date().toISOString()
        }
      } catch (error) {
        this.error(`Failed to migrate print at index ${index}`, error)
        return null
      }
    }).filter(Boolean)
  }

  // Normalize material names
  normalizeMaterial(material) {
    if (!material) return 'PLA'
    const normalized = material.toString().toLowerCase().trim()
    const materialMap = {
      'pla': 'PLA',
      'petg': 'PETG',
      'abs': 'ABS',
      'tpu': 'TPU',
      'wood': 'Wood',
      'carbon fiber': 'Carbon Fiber',
      'metal': 'Metal',
      'silk': 'Silk',
      'glow': 'Glow'
    }
    return materialMap[normalized] || material
  }

  // Normalize weight values
  normalizeWeight(weight) {
    if (!weight || weight === 0) return null
    const normalized = parseFloat(weight)
    return isNaN(normalized) ? null : normalized
  }

  // Normalize cost values
  normalizeCost(cost) {
    if (!cost || cost === 0) return null
    const normalized = parseFloat(cost)
    return isNaN(normalized) ? null : normalized
  }

  // Normalize file size
  normalizeFileSize(size) {
    if (!size || size === 0) return null
    const normalized = parseFloat(size)
    return isNaN(normalized) ? null : normalized
  }

  // Normalize time values
  normalizeTime(time) {
    if (!time || time === 0) return null
    const normalized = parseFloat(time)
    return isNaN(normalized) ? null : normalized
  }

  // Normalize status values
  normalizeStatus(status) {
    if (!status) return 'queued'
    const normalized = status.toString().toLowerCase().trim()
    const statusMap = {
      'completed': 'completed',
      'complete': 'completed',
      'success': 'completed',
      'printing': 'printing',
      'in progress': 'printing',
      'running': 'printing',
      'failed': 'failed',
      'error': 'failed',
      'cancelled': 'failed',
      'canceled': 'failed',
      'queued': 'queued',
      'pending': 'queued',
      'waiting': 'queued'
    }
    return statusMap[normalized] || 'queued'
  }

  // Map legacy filament IDs to new ones
  mapFilamentId(legacyId, legacyName, migratedFilaments) {
    if (legacyId && migratedFilaments.find(f => f.id === legacyId)) {
      return legacyId
    }
    // Try to match by name
    if (legacyName) {
      const match = migratedFilaments.find(f => f.name === legacyName)
      if (match) return match.id
    }
    // Return first filament as fallback
    return migratedFilaments[0]?.id
  }

  // Map legacy model IDs to new ones
  mapModelId(legacyId, legacyName, migratedModels) {
    if (legacyId && migratedModels.find(m => m.id === legacyId)) {
      return legacyId
    }
    // Try to match by name
    if (legacyName) {
      const match = migratedModels.find(m => m.name === legacyName)
      if (match) return match.id
    }
    // Return first model as fallback
    return migratedModels[0]?.id
  }

  // Save migrated data to localStorage
  saveMigratedData(migratedData) {
    try {
      if (migratedData.filaments.length > 0) {
        localStorage.setItem('printstack_filaments', JSON.stringify(migratedData.filaments))
      }
      if (migratedData.models.length > 0) {
        localStorage.setItem('printstack_models', JSON.stringify(migratedData.models))
      }
      if (migratedData.prints.length > 0) {
        localStorage.setItem('printstack_prints', JSON.stringify(migratedData.prints))
      }
      this.log('Migrated data saved to localStorage')
    } catch (error) {
      this.error('Failed to save migrated data', error)
    }
  }

  // Backup legacy data before migration
  backupLegacyData() {
    const backupKey = `printstack_migration_backup_${Date.now()}`
    const backup = {
      timestamp: new Date().toISOString(),
      filaments: this.getLegacyFilaments(),
      models: this.getLegacyModels(),
      prints: this.getLegacyPrints()
    }

    try {
      localStorage.setItem(backupKey, JSON.stringify(backup))
      this.log(`Legacy data backed up to '${backupKey}'`)
    } catch (error) {
      this.error('Failed to backup legacy data', error)
    }
  }

  // Check if migration is needed
  needsMigration() {
    const hasNewData = localStorage.getItem('printstack_filaments') ||
                      localStorage.getItem('printstack_models') ||
                      localStorage.getItem('printstack_prints')

    if (hasNewData) {
      this.log('New format data already exists')
      return false
    }

    const hasOldData = this.getLegacyFilaments().length > 0 ||
                      this.getLegacyModels().length > 0 ||
                      this.getLegacyPrints().length > 0

    this.log(hasOldData ? 'Legacy data found, migration needed' : 'No data found')
    return hasOldData
  }

  // Get migration report
  getMigrationReport() {
    return {
      needsMigration: this.needsMigration(),
      log: this.migrationLog,
      errors: this.errors,
      legacyDataFound: {
        filaments: this.getLegacyFilaments().length,
        models: this.getLegacyModels().length,
        prints: this.getLegacyPrints().length
      }
    }
  }
}

// Export migration function for easy use
export const migrateFilamentData = () => {
  const migration = new FilamentMigration()
  return migration.migrateFromLegacy()
}

export default FilamentMigration