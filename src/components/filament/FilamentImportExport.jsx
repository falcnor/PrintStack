import React, { useState, useRef } from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import { exportToJSON, importFromJSON, validateFilament } from '../../utils/dataUtils.js'
import styles from './FilamentImportExport.module.css'

const FilamentImportExport = ({ onImport, onExport }) => {
  const { filaments } = useApp()
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef(null)

  const handleExportFilaments = async () => {
    setIsExporting(true)
    try {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          filaments: filaments.map(filament => ({
            name: filament.name,
            material: filament.material,
            color: filament.color,
            weight: filament.weight,
            remainingWeight: filament.remainingWeight,
            cost: filament.cost,
            diameter: filament.diameter,
            temperature: filament.temperature,
            notes: filament.notes
          }))
        },
        statistics: {
          count: filaments.length,
          totalCost: filaments.reduce((sum, f) => sum + (f.cost || 0), 0),
          totalWeight: filaments.reduce((sum, f) => sum + (f.weight || 0), 0)
        }
      }

      const filename = `printstack-filaments-${new Date().toISOString().split('T')[0]}.json`
      exportToJSON(exportData, filename)

      if (onExport) {
        onExport(filaments.length)
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: `Export failed: ${error.message}`,
        details: error
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportFilaments = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const data = await importFromJSON(file)

      // Handle different import formats
      let filamentsToImport = []
      let format = 'unknown'

      if (data.filaments && Array.isArray(data.filaments)) {
        // PrintStack format
        filamentsToImport = data.filaments
        format = 'printstack'
      } else if (data.data && data.data.filaments) {
        // Legacy export format
        filamentsToImport = data.data.filaments
        format = 'legacy'
      } else if (Array.isArray(data)) {
        // Direct array format
        filamentsToImport = data
        format = 'array'
      } else {
        throw new Error('Invalid file format. Expected filaments array or PrintStack export.')
      }

      // Validate and prepare filaments for import
      const validFilaments = []
      const invalidFilaments = []

      filamentsToImport.forEach((filament, index) => {
        try {
          // Ensure required fields have defaults
          const normalizedFilament = {
            name: filament.name || `Imported Filament ${index + 1}`,
            material: filament.material || 'PLA',
            color: filament.color || '',
            weight: filament.weight || null,
            remainingWeight: filament.remainingWeight || filament.weight || null,
            cost: filament.cost || null,
            diameter: filament.diameter || '1.75',
            temperature: filament.temperature || '',
            notes: filament.notes || filament.description || ''
          }

          const validation = validateFilament(normalizedFilament)
          if (validation.isValid) {
            validFilaments.push(normalizedFilament)
          } else {
            invalidFilaments.push({
              filament: normalizedFilament,
              errors: validation.errors
            })
          }
        } catch (error) {
          invalidFilaments.push({
            filament,
            errors: [`Failed to process filament: ${error.message}`]
          })
        }
      })

      // Call the import handler
      if (onImport) {
        await onImport(validFilaments, invalidFilaments)
      }

      setImportResult({
        success: true,
        format,
        message: `Successfully processed ${validFilaments.length} filaments${invalidFilaments.length > 0 ? ` with ${invalidFilaments.length} errors` : ''}`,
        imported: validFilaments.length,
        errors: invalidFilaments.length,
        invalidItems: invalidFilaments
      })

    } catch (error) {
      setImportResult({
        success: false,
        message: `Import failed: ${error.message}`,
        details: error
      })
    } finally {
      setIsImporting(false)
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExportCSV = () => {
    setIsExporting(true)
    try {
      const headers = ['Name', 'Material', 'Color', 'Weight (g)', 'Remaining (g)', 'Cost ($)', 'Diameter (mm)', 'Temperature (°C)', 'Notes']
      const csvContent = [
        headers.join(','),
        ...filaments.map(filament => [
          `"${filament.name}"`,
          filament.material,
          filament.color || '',
          filament.weight || '',
          filament.remainingWeight || '',
          filament.cost || '',
          filament.diameter || '',
          filament.temperature || '',
          `"${(filament.notes || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `printstack-filaments-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      if (onExport) {
        onExport(filaments.length)
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: `CSV export failed: ${error.message}`
      })
    } finally {
      setIsExporting(false)
    }
  }

  const clearResults = () => {
    setImportResult(null)
  }

  return (
    <div className={styles.importExport}>
      <h3>Import/Export Filaments</h3>

      <div className={styles.actions}>
        <div className={styles.exportSection}>
          <h4>Export Current Filaments ({filaments.length})</h4>
          <div className={styles.exportButtons}>
            <button
              onClick={handleExportFilaments}
              disabled={isExporting || filaments.length === 0}
              className={styles.exportButton}
            >
              {isExporting ? 'Exporting...' : '📤 Export as JSON'}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isExporting || filaments.length === 0}
              className={styles.exportButton}
            >
              {isExporting ? 'Exporting...' : '📊 Export as CSV'}
            </button>
          </div>
        </div>

        <div className={styles.importSection}>
          <h4>Import Filaments</h4>
          <div className={styles.importArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleImportFilaments}
              disabled={isImporting}
              className={styles.fileInput}
              id="filament-import"
            />
            <label htmlFor="filament-import" className={styles.fileLabel}>
              {isImporting ? 'Importing...' : '📥 Choose File or Drop Here'}
            </label>
            <p className={styles.fileInfo}>
              Supports JSON (PrintStack format) and CSV files
            </p>
          </div>
        </div>
      </div>

      {importResult && (
        <div className={`${styles.result} ${importResult.success ? styles.success : styles.error}`}>
          <div className={styles.resultHeader}>
            <span className={styles.resultIcon}>
              {importResult.success ? '✅' : '❌'}
            </span>
            <span className={styles.resultTitle}>
              {importResult.success ? 'Import Completed' : 'Import Failed'}
            </span>
            <button
              onClick={clearResults}
              className={styles.clearResult}
              aria-label="Clear result"
            >
              ×
            </button>
          </div>

          <div className={styles.resultMessage}>
            {importResult.message}
          </div>

          {importResult.success && importResult.format && (
            <div className={styles.resultDetails}>
              <small>Format detected: {importResult.format}</small>
            </div>
          )}

          {importResult.invalidItems && importResult.invalidItems.length > 0 && (
            <div className={styles.errorList}>
              <h5>Items with errors ({importResult.invalidItems.length}):</h5>
              {importResult.invalidItems.map((item, index) => (
                <div key={index} className={styles.errorItem}>
                  <strong>{item.filament.name || 'Unnamed item'}:</strong>
                  <ul>
                    {item.errors.map((error, errorIndex) => (
                      <li key={errorIndex}>{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={styles.instructions}>
        <h4>Instructions:</h4>
        <ul>
          <li><strong>JSON Export:</strong> Saves all filament data in full detail, ideal for backup</li>
          <li><strong>CSV Export:</strong> Saves basic filament data for spreadsheet use</li>
          <li><strong>Import:</strong> Supports both JSON and CSV formats. Duplicate names will be handled by the system</li>
          <li><strong>Data Validation:</strong> All imported data is validated before being added</li>
        </ul>
      </div>
    </div>
  )
}

export default FilamentImportExport