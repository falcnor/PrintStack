// Test data for PrintStack React migration
// Run this in browser console to test data migration

const testFilaments = [
  {
    id: 'test-filament-1',
    name: 'Blue PLA Silk',
    material: 'PLA',
    color: 'Blue',
    weight: 1000,
    remainingWeight: 850,
    cost: 24.99,
    diameter: '1.75',
    temperature: 210,
    notes: 'Beautiful silk filament for artistic prints',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z'
  },
  {
    id: 'test-filament-2',
    name: 'Black PETG',
    material: 'PETG',
    color: 'Black',
    weight: 1000,
    remainingWeight: 1000,
    cost: 22.50,
    diameter: '1.75',
    temperature: 240,
    notes: 'Strong and durable filament',
    createdAt: '2024-01-10T14:30:00.000Z',
    updatedAt: '2024-01-10T14:30:00.000Z'
  },
  {
    id: 'test-filament-3',
    name: 'Red TPU Flexible',
    material: 'TPU',
    color: 'Red',
    weight: 500,
    remainingWeight: 300,
    cost: 35.00,
    diameter: '1.75',
    temperature: 220,
    notes: 'Flexible filament for phone cases and flexible parts',
    createdAt: '2024-01-05T09:15:00.000Z',
    updatedAt: '2024-01-05T09:15:00.000Z'
  }
]

const testModels = [
  {
    id: 'test-model-1',
    name: 'Calibration Cube',
    category: 'Calibration',
    fileSize: 1500000,
    printTime: 45,
    filamentRequired: 15,
    complexity: 'Easy',
    description: 'Standard calibration cube for printer tuning',
    createdAt: '2024-01-12T11:00:00.000Z',
    updatedAt: '2024-01-12T11:00:00.000Z'
  },
  {
    id: 'test-model-2',
    name: 'Phone Stand',
    category: 'Accessories',
    fileSize: 3200000,
    printTime: 180,
    filamentRequired: 25,
    complexity: 'Medium',
    description: 'Adjustable phone stand for desk use',
    createdAt: '2024-01-08T16:20:00.000Z',
    updatedAt: '2024-01-08T16:20:00.000Z'
  }
]

const testPrints = [
  {
    id: 'test-print-1',
    modelId: 'test-model-1',
    filamentId: 'test-filament-1',
    status: 'completed',
    startTime: '2024-01-20T10:00:00.000Z',
    endTime: '2024-01-20T10:45:00.000Z',
    actualWeight: 14.5,
    expectedWeight: 15,
    quality: 5,
    notes: 'Perfect print, great surface finish',
    createdAt: '2024-01-20T10:00:00.000Z',
    updatedAt: '2024-01-20T10:45:00.000Z'
  },
  {
    id: 'test-print-2',
    modelId: 'test-model-2',
    filamentId: 'test-filament-2',
    status: 'printing',
    startTime: '2024-01-21T14:00:00.000Z',
    actualWeight: null,
    expectedWeight: 25,
    quality: null,
    notes: 'Currently in progress',
    createdAt: '2024-01-21T14:00:00.000Z',
    updatedAt: '2024-01-21T14:00:00.000Z'
  }
]

const testSettings = {
  theme: 'light',
  currency: 'USD',
  units: 'metric',
  language: 'en',
  autoSave: true,
  notifications: true
}

// Save test data to localStorage
localStorage.setItem('printstack_filaments', JSON.stringify(testFilaments))
localStorage.setItem('printstack_models', JSON.stringify(testModels))
localStorage.setItem('printstack_prints', JSON.stringify(testPrints))
localStorage.setItem('printstack_settings', JSON.stringify(testSettings))

console.log('Test data loaded!')
console.log(`${testFilaments.length} filaments, ${testModels.length} models, ${testPrints.length} prints added`)
console.log('Refresh the React app to see migrated data')

// Export functions to browser console for testing
window.PrintStackTestData = {
  filaments: testFilaments,
  models: testModels,
  prints: testPrints,
  settings: testSettings,
  clear: () => {
    localStorage.removeItem('printstack_filaments')
    localStorage.removeItem('printstack_models')
    localStorage.removeItem('printstack_prints')
    localStorage.removeItem('printstack_settings')
    console.log('Test data cleared')
  }
}