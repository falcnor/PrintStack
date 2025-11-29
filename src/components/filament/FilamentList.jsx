import React, { useState, useEffect } from 'react'
import { useApp } from '../../contexts/AppContext.jsx'
import FilamentTable from './FilamentTable.jsx'
import FilamentForm from './FilamentForm.jsx'
import FilamentSearch from './FilamentSearch.jsx'
import FilamentImportExport from './FilamentImportExport.jsx'
import LoadingSpinner from '../common/LoadingSpinner.jsx'
import styles from './FilamentList.module.css'

const FilamentList = () => {
  const { filaments, loading, error, addFilament, updateFilament, deleteFilament } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingFilament, setEditingFilament] = useState(null)
  const [filteredFilaments, setFilteredFilaments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('')
  const [showImportExport, setShowImportExport] = useState(false)

  useEffect(() => {
    let filtered = filaments

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(filament =>
        filament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filament.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (filament.color && filament.color.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply material filter
    if (filterMaterial) {
      filtered = filtered.filter(filament => filament.material === filterMaterial)
    }

    setFilteredFilaments(filtered)
  }, [filaments, searchTerm, filterMaterial])

  const handleAddFilament = () => {
    setEditingFilament(null)
    setShowForm(true)
  }

  const handleEditFilament = (filament) => {
    setEditingFilament(filament)
    setShowForm(true)
  }

  const handleDeleteFilament = async (id) => {
    if (window.confirm('Are you sure you want to delete this filament?')) {
      try {
        await deleteFilament(id)
      } catch (error) {
        console.error('Failed to delete filament:', error)
      }
    }
  }

  const handleFormSubmit = async (formData) => {
    console.log('handleFormSubmit called with:', formData, 'editingFilament:', editingFilament)
    try {
      if (editingFilament) {
        console.log('Updating existing filament')
        await updateFilament({ ...formData, id: editingFilament.id })
      } else {
        console.log('Adding new filament')
        await addFilament(formData)
      }
      console.log('Filament saved successfully')
      setShowForm(false)
      setEditingFilament(null)
    } catch (error) {
      console.error('Failed to save filament:', error)
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingFilament(null)
  }

  const handleSearch = (term, material) => {
    setSearchTerm(term)
    setFilterMaterial(material)
  }

  const handleImport = async (validFilaments, invalidFilaments) => {
    try {
      // Add valid filaments
      for (const filament of validFilaments) {
        await addFilament(filament)
      }

      // Show success message
      console.log(`Imported ${validFilaments.length} filaments successfully`)
      if (invalidFilaments.length > 0) {
        console.warn(`${invalidFilaments.length} filaments had errors and were not imported`)
      }
    } catch (error) {
      console.error('Import failed:', error)
    }
  }

  const handleExport = (count) => {
    console.log(`Exported ${count} filaments`)
  }

  const getUniqueMaterials = () => {
    return [...new Set(filaments.map(f => f.material))].sort()
  }

  if (loading && filaments.length === 0) {
    return <LoadingSpinner message="Loading filaments..." />
  }

  return (
    <div className={styles.filamentList}>
      <div className={styles.header}>
        <h1>Filament Library</h1>
        <div className={styles.headerActions}>
          <button
            onClick={handleAddFilament}
            className={styles.addButton}
            aria-label="Add new filament"
          >
            + Add Filament
          </button>
          <button
            onClick={() => setShowImportExport(!showImportExport)}
            className={styles.importExportButton}
            aria-label="Toggle import/export panel"
          >
            📤 Import/Export
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          Error: {error}
        </div>
      )}

      <FilamentSearch
        onSearch={handleSearch}
        materials={getUniqueMaterials()}
        className={styles.search}
      />

      {showImportExport && (
        <FilamentImportExport
          onImport={handleImport}
          onExport={handleExport}
        />
      )}

      {showForm ? (
        <div className={styles.formContainer}>
          <FilamentForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            initialData={editingFilament}
            isEdit={!!editingFilament}
          />
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <FilamentTable
            filaments={filteredFilaments}
            onEdit={handleEditFilament}
            onDelete={handleDeleteFilament}
            loading={loading}
            pageSize={25}
          />
        </div>
      )}

      {filteredFilaments.length === 0 && !loading && !showForm && (
        <div className={styles.emptyState}>
          <h3>No filaments found</h3>
          <p>
            {searchTerm || filterMaterial
              ? 'Try adjusting your search or filters.'
              : 'Get started by adding your first filament.'}
          </p>
          {!searchTerm && !filterMaterial && (
            <button
              onClick={handleAddFilament}
              className={styles.addButton}
            >
              + Add Your First Filament
            </button>
          )}
        </div>
      )}

      <div className={styles.stats}>
        <span>
          {filteredFilaments.length} of {filaments.length} filaments shown
        </span>
      </div>
    </div>
  )
}

export default FilamentList