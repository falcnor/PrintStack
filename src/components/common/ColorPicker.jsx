import React, { useState, useEffect } from 'react'
import styles from './ColorPicker.module.css'

const PRESET_COLORS = [
  // Standard colors
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Silver', hex: '#C0C0C0' },

  // Primary colors
  { name: 'Red', hex: '#FF0000' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'Green', hex: '#00FF00' },

  // Secondary colors
  { name: 'Orange', hex: '#FFA500' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Brown', hex: '#8B4513' },

  // Filament-specific colors
  { name: 'Dark Blue', hex: '#000080' },
  { name: 'Light Blue', hex: '#87CEEB' },
  { name: 'Dark Red', hex: '#8B0000' },
  { name: 'Neon Green', hex: '#39FF14' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Bronze', hex: '#CD7F32' },
  { name: 'Copper', hex: '#B87333' },
  { name: 'Titanium', hex: '#878681' },

  // Translucent/Clear variants
  { name: 'Clear', hex: '#F8F8F8' },
  { name: 'Translucent', hex: '#E8E8E8' }
]

const ColorPicker = ({
  value = '',
  onChange,
  placeholder = 'Select a color',
  allowCustom = true,
  showPreview = true,
  compact = false
}) => {
  const [selectedColor, setSelectedColor] = useState('')
  const [customColor, setCustomColor] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  useEffect(() => {
    setSelectedColor(value)
  }, [value])

  const handlePresetSelect = (color) => {
    setSelectedColor(color.name)
    if (onChange) {
      onChange(color.name)
    }
    setShowCustomInput(false)
  }

  const handleCustomChange = (e) => {
    const colorValue = e.target.value
    setCustomColor(colorValue)
    setSelectedColor(colorValue)
    if (onChange) {
      onChange(colorValue)
    }
  }

  const handleTextChange = (e) => {
    const textValue = e.target.value
    setSelectedColor(textValue)
    if (onChange) {
      onChange(textValue)
    }

    // Try to find matching preset
    const matchingPreset = PRESET_COLORS.find(
      color => color.name.toLowerCase() === textValue.toLowerCase()
    )
    if (matchingPreset) {
      setCustomColor(matchingPreset.hex)
    }
  }

  const getColorPreview = () => {
    if (!selectedColor) return null

    // Check if it's a preset color
    const preset = PRESET_COLORS.find(c => c.name === selectedColor)
    if (preset) {
      return preset.hex
    }

    // Check if it's a hex color
    if (selectedColor.startsWith('#')) {
      return selectedColor
    }

    // Check custom color if set
    if (customColor) {
      return customColor
    }

    // Return default
    return '#CCCCCC'
  }

  if (compact) {
    return (
      <div className={styles.compactPicker}>
        <input
          type="text"
          value={selectedColor}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={styles.compactInput}
        />
        {showPreview && selectedColor && (
          <div
            className={styles.compactPreview}
            style={{ backgroundColor: getColorPreview() }}
            title={selectedColor}
          />
        )}
      </div>
    )
  }

  return (
    <div className={styles.colorPicker}>
      <div className={styles.colorInput}>
        <input
          type="text"
          value={selectedColor}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={styles.textInput}
        />
        {showPreview && selectedColor && (
          <div
            className={styles.colorPreview}
            style={{ backgroundColor: getColorPreview() }}
            title={selectedColor}
          />
        )}
      </div>

      <div className={styles.presetColors}>
        <div className={styles.presetGrid}>
          {PRESET_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => handlePresetSelect(color)}
              className={`${styles.colorButton} ${
                selectedColor === color.name ? styles.selected : ''
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={`Select ${color.name}`}
            >
              {selectedColor === color.name && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {allowCustom && (
        <div className={styles.customSection}>
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              className={styles.customToggle}
            >
              + Custom Color
            </button>
          ) : (
            <div className={styles.customInput}>
              <div className={styles.customRow}>
                <input
                  type="color"
                  value={customColor || '#000000'}
                  onChange={handleCustomChange}
                  className={styles.colorSwatch}
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={handleCustomChange}
                  placeholder="#000000 or color name"
                  className={styles.hexInput}
                />
                <button
                  onClick={() => setShowCustomInput(false)}
                  className={styles.cancelCustom}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.quickColors}>
        <span className={styles.quickLabel}>Quick:</span>
        {['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White'].map((color) => (
          <button
            key={color}
            onClick={() => handleTextChange({ target: { value: color } })}
            className={styles.quickButton}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ColorPicker