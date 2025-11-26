// Global variables
// Updated: 2024-11-24 - Fixed form reference error, added material type management
let filaments = [];
let models = [];
let prints = [];
let editingFilamentId = null;
let editingModelId = null;
let editingPrintId = null;
let modelCategories = [];

// Dynamic Material Types Management
let materialTypes = ['PLA', 'PETG', 'ABS', 'TPU']; // Default material types

function getMaterialTypes() {
    return materialTypes;
}

function addMaterialType(type) {
    if (!type || typeof type !== 'string') {
        return false;
    }

    const trimmedType = type.trim();
    if (!trimmedType) {
        return false;
    }

    if (!materialTypes.includes(trimmedType)) {
        materialTypes.push(trimmedType);
        saveMaterialTypes();
        updateMaterialTypeDropdowns();
        return true;
    }
    return false;
}

function removeMaterialType(type) {
    if (!type || typeof type !== 'string') {
        return false;
    }

    const index = materialTypes.indexOf(type);
    if (index > -1) {
        // Check if any filament is using this type - safe check for filaments array
        const inUse = (filaments && Array.isArray(filaments)) ?
            filaments.some(f => f && f.materialType === type) : false;

        if (!inUse) {
            materialTypes.splice(index, 1);
            saveMaterialTypes();
            updateMaterialTypeDropdowns();
            return true;
        } else {
            showErrorMessage(`Cannot remove "${type}" - it is used by existing filaments`);
            return false;
        }
    }
    return false;
}

function saveMaterialTypes() {
    localStorage.setItem('printStack_materialTypes', JSON.stringify(materialTypes));
}

function loadMaterialTypes() {
    const saved = localStorage.getItem('printStack_materialTypes');
    if (saved) {
        try {
            materialTypes = JSON.parse(saved);
        } catch (e) {
        }
    }
}

function updateMaterialTypeDropdowns() {
    // Update main form dropdown
    const mainSelect = document.getElementById('filamentMaterialType');
    if (mainSelect) {
        updateMaterialTypeDropdown(mainSelect);
    }

    // Update edit form dropdown
    const editSelect = document.getElementById('editFilamentMaterialType');
    if (editSelect) {
        updateMaterialTypeDropdown(editSelect);
    }
}

function updateMaterialTypeDropdown(selectElement) {
    const currentValue = selectElement.value;

    // Clear existing options except the first one and "Other"
    const options = Array.from(selectElement.options);
    options.forEach(option => {
        if (option.value !== '' && option.value !== 'Other') {
            option.remove();
        }
    });

    // Add material types in alphabetical order
    const sortedTypes = [...materialTypes].sort();
    const otherOption = selectElement.querySelector('option[value="Other"]');

    sortedTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        selectElement.insertBefore(option, otherOption);
    });

    // Restore previous selection if it still exists
    if (currentValue && (materialTypes.includes(currentValue) || currentValue === 'Other')) {
        selectElement.value = currentValue;
    }
}

// Material Type UI Functions
function updateMaterialTypesList() {
    const container = document.getElementById('materialTypesList');
    if (!container || !materialTypes || !Array.isArray(materialTypes)) return;

    const sortedTypes = [...materialTypes].sort();

    container.innerHTML = sortedTypes.map(type => {
        // Safe check for filaments array
        const inUse = (filaments && Array.isArray(filaments)) ?
            filaments.some(f => f && f.materialType === type) : false;

        return `
            <div class="material-type-item" data-type="${type}">
                <span class="material-type-name">${type}</span>
                ${inUse ? '<span class="badge badge-info">In Use</span>' : ''}
                <button class="remove-btn" onclick="handleRemoveMaterialType('${type}')" ${inUse ? 'disabled title="Cannot remove - used by filaments"' : 'title="Remove material type"'}>Remove</button>
            </div>
        `;
    }).join('');
}

function handleAddMaterialType() {
    const input = document.getElementById('newMaterialType');
    const type = input.value.trim();

    if (!type) {
        showErrorMessage('Please enter a material type');
        return;
    }

    if (addMaterialType(type)) {
        input.value = '';
        updateMaterialTypesList();
        showSuccessMessage(`Material type "${type}" added successfully`);
    } else {
        showErrorMessage(`Material type "${type}" already exists`);
    }
}

function handleRemoveMaterialType(type) {
    if (removeMaterialType(type)) {
        updateMaterialTypesList();
        showSuccessMessage(`Material type "${type}" removed successfully`);
    }
}

function updateMaterialTypeManagementUI() {
    updateMaterialTypesList();
}

// Collapsible section functionality
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const toggle = document.getElementById(sectionId + '-toggle');

    if (!section || !toggle) return;

    if (section.style.maxHeight && section.style.maxHeight !== '0px') {
        // Close section
        section.style.maxHeight = '0px';
        section.style.overflow = 'hidden';
        toggle.textContent = '▶';
    } else {
        // Open section
        section.style.maxHeight = '2000px'; // Large enough to fit content
        section.style.overflow = 'visible';
        toggle.textContent = '▼';
    }
}

// Enhanced Data Grid System
class EnhancedDataGrid {
    constructor(tableId, data, columns) {
        this.tableId = tableId;
        this.data = data;
        this.originalData = [...data];
        this.columns = columns;
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.currentSort = { column: null, ascending: true };
        this.filterTimeout = null;
        this.visibleData = [...data];
        this.init();
    }

    init() {
        this.setupTableHeaders();
        this.renderTable();
        this.setupSearch();
        this.setupPagination();
    }

    setupTableHeaders() {
        const table = document.getElementById(this.tableId);
        if (!table) return;

        const headerRow = table.querySelector('thead tr');
        if (!headerRow) return;

        headerRow.innerHTML = this.columns.map((col, index) => `
            <th scope="col" data-sortable="${col.key}" role="columnheader" aria-sort="none" tabindex="0">
                <span class="header-content">
                    <span class="header-text">${col.label}</span>
                    <span class="sort-indicator" aria-hidden="true"></span>
                </span>
            </th>
        `).join('');

        // Add click handlers for sorting
        headerRow.querySelectorAll('th[data-sortable]').forEach(header => {
            header.addEventListener('click', () => this.sort(header));
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.sort(header);
                }
            });
        });
    }

    sort(header) {
        const column = header.dataset.sortable;
        const ascending = this.currentSort.column === column ? !this.currentSort.ascending : true;

        this.currentSort = { column, ascending };
        this.updateSortIndicators(header, ascending);

        const columnIndex = this.columns.findIndex(col => col.key === column);
        const columnConfig = this.columns[columnIndex];

        if (columnConfig.sortType === 'number') {
            this.visibleData.sort((a, b) => {
                const aVal = this.getNestedValue(a, column) || 0;
                const bVal = this.getNestedValue(b, column) || 0;
                return ascending ? aVal - bVal : bVal - aVal;
            });
        } else {
            this.visibleData.sort((a, b) => {
                const aVal = String(this.getNestedValue(a, column) || '').toLowerCase();
                const bVal = String(this.getNestedValue(b, column) || '').toLowerCase();
                const comparison = aVal.localeCompare(bVal);
                return ascending ? comparison : -comparison;
            });
        }

        this.currentPage = 1;
        this.renderTable();
        this.updateTableInfo();
    }

    getNestedValue(obj, key) {
        if (!obj || !key || typeof key !== 'string') {
            return undefined;
        }
        return key.split('.').reduce((current, prop) => current && current[prop], obj);
    }

    updateSortIndicators(activeHeader, ascending) {
        const table = document.getElementById(this.tableId);
        table.querySelectorAll('th[data-sortable]').forEach(header => {
            header.removeAttribute('aria-sort');
            const indicator = header.querySelector('.sort-indicator');
            if (indicator) indicator.textContent = '';
        });

        activeHeader.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
        const indicator = activeHeader.querySelector('.sort-indicator');
        if (indicator) indicator.textContent = ascending ? '▲' : '▼';
    }

    setupSearch() {
        // Find the search input in the data grid controls
        const searchInput = document.getElementById(`${this.tableId}Search`);
        if (!searchInput) {
                return;
        }

        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.filterTimeout);
            this.filterTimeout = setTimeout(() => {
                this.filterRows(e.target.value.toLowerCase());
            }, 300);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                this.filterRows('');
                this.updateSearchResults(this.visibleData.length, '(all)');
            }
        });
    }

    filterRows(query) {
        // Ensure data exists before filtering
        if (!this.originalData || !Array.isArray(this.originalData)) {
            this.visibleData = [];
            return;
        }

        if (query.length < 2) {
            this.visibleData = [...this.originalData];
        } else {
            this.visibleData = this.originalData.filter(item => {
                if (!item) return false;
                const searchableText = `${this.getNestedValue(item, 'brand')} ${this.getNestedValue(item, 'materialType')} ${this.getNestedValue(item, 'colorName')} ${this.getNestedValue(item, 'color')}`.toLowerCase();
                return searchableText.includes(query);
            });
        }

        this.currentPage = 1;
        this.renderTable();
        this.updatePagination();
        this.updateSearchResults(this.visibleData.length, query);
    }

    updateSearchResults(count, query) {
        // Find the correct search results info element based on table type
        let resultsInfo;
        if (this.tableId === 'filamentTable') {
            resultsInfo = document.getElementById('filamentSearchResults');
        } else if (this.tableId === 'modelTable') {
            resultsInfo = document.getElementById('modelSearchResults');
        } else {
            // Default fallback
            resultsInfo = document.getElementById(`${this.tableId}SearchResults`);
        }

        if (!resultsInfo) {
            // Don't create the element if it doesn't exist - the data grid has built-in pagination info
            return;
        }

        if (query.length < 2 || query === '(all)') {
            resultsInfo.textContent = `Showing all ${count} items`;
        } else {
            resultsInfo.textContent = `Found ${count} results for "${query}"`;
        }
    }

    renderTable() {
        const tbody = document.querySelector(`#${this.tableId} tbody`);
        if (!tbody) return;


        // Debug the DOM tree
        let parent = tbody;
        let level = 0;
        while (parent && level < 10) {
            parent = parent.parentElement;
            level++;
        }


        if (this.visibleData.length === 0) {
            // Show empty state message
            const colspan = document.querySelector(`#${this.tableId} th`)?.parentElement?.children?.length || 1;
            tbody.innerHTML = `<tr><td colspan="${colspan}" class="empty-state">No data available</td></tr>`;
            this.updateTableInfo();
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.visibleData.length);
        const pageData = this.visibleData.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(item => this.renderRow(item)).join('');
        this.updateTableInfo();
    }

    renderRow(item) {
        // This will be overridden by specific table implementations
        return '';
    }

    setupPagination() {
        const totalPages = Math.ceil(this.visibleData.length / this.itemsPerPage);

        // Update static HTML navigation buttons (filamentGridNext, modelGridNext, etc.)
        const prevButtonId = this.tableId === 'filamentTable' ? 'filamentGridPrev' : 'modelGridPrev';
        const nextButtonId = this.tableId === 'filamentTable' ? 'filamentGridNext' : 'modelGridNext';

        const prevButton = document.getElementById(prevButtonId);
        const nextButton = document.getElementById(nextButtonId);

        if (prevButton) {
            prevButton.disabled = this.currentPage === 1;
        }

        if (nextButton) {
            nextButton.disabled = this.currentPage >= totalPages || totalPages === 0;
        }

        // Add click event listeners to the static buttons
        if (prevButton) {
            prevButton.onclick = () => this.goToPage(this.currentPage - 1);
        }

        if (nextButton) {
            nextButton.onclick = () => this.goToPage(this.currentPage + 1);
        }

        const paginationContainer = document.getElementById(`${this.tableId}-pagination`);

        if (!paginationContainer) {
            const table = document.querySelector(`#${this.tableId}`);
            if (!table) {
                return;
            }

            // Try to find the wrapper (either .table-container or the grid wrapper)
            let container = table.closest('.table-container') ||
                           table.closest('.data-grid-controls')?.parentElement ||
                           table.parentElement;

            if (!container) {
                return;
            }

            const controls = document.createElement('div');
            controls.className = 'pagination-controls';
            controls.id = `${this.tableId}-pagination`;
            controls.innerHTML = this.renderPaginationControls(totalPages);

            // Insert pagination after the data-grid-controls if they exist
            const existingControls = container.querySelector('.data-grid-controls');
            if (existingControls) {
                existingControls.insertAdjacentElement('afterend', controls);
            } else {
                container.appendChild(controls);
            }
        } else {
            paginationContainer.innerHTML = this.renderPaginationControls(totalPages);
        }

        this.attachPaginationEvents();
    }

    renderPaginationControls(totalPages) {
        if (totalPages <= 1) return '';

        return `
            <div class="pagination-info">
                Page ${this.currentPage} of ${totalPages} (${this.visibleData.length} total items)
            </div>
            <div class="pagination-buttons">
                <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="dataGrids.${this.tableId}.goToPage(1)">First</button>
                <button ${this.currentPage === 1 ? 'disabled' : ''} onclick="dataGrids.${this.tableId}.goToPage(${this.currentPage - 1})">Previous</button>
                <select class="page-size" onchange="dataGrids.${this.tableId}.changePageSize(this.value)">
                    <option value="10" ${this.itemsPerPage === 10 ? 'selected' : ''}>10 per page</option>
                    <option value="25" ${this.itemsPerPage === 25 ? 'selected' : ''}>25 per page</option>
                    <option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50 per page</option>
                    <option value="100" ${this.itemsPerPage === 100 ? 'selected' : ''}>100 per page</option>
                </select>
                <button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="dataGrids.${this.tableId}.goToPage(${this.currentPage + 1})">Next</button>
                <button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="dataGrids.${this.tableId}.goToPage(${totalPages})">Last</button>
            </div>
        `;
    }

    attachPaginationEvents() {
        // Button events are handled by onclick attributes
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.updatePagination();

        // Scroll to section header with search box and add button
        let sectionId;
        if (this.tableId === 'filamentTable') {
            sectionId = 'filament-page';
        } else if (this.tableId === 'modelTable') {
            sectionId = 'models-page';
        } else {
            // Default fallback
            const table = document.getElementById(this.tableId);
            if (table) {
                table.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    changePageSize(newSize) {
        this.itemsPerPage = parseInt(newSize);
        this.currentPage = 1;
        this.renderTable();
        this.setupPagination();
    }

    updatePagination() {
        this.setupPagination();
    }

    updateTableInfo() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.visibleData.length);

        // Find the correct pagination info element based on table type
        let infoElement;
        if (this.tableId === 'filamentTable') {
            infoElement = document.getElementById('filamentGridInfo');
        } else if (this.tableId === 'modelTable') {
            infoElement = document.getElementById('modelGridInfo');
        } else {
            infoElement = document.getElementById(`${this.tableId}GridInfo`) || document.getElementById(`${this.tableId}-info`);
        }

        if (infoElement) {
            if (this.visibleData.length === 0) {
                infoElement.textContent = `0-0 of 0`;
            } else {
                infoElement.textContent = `${startIndex + 1}-${endIndex} of ${this.visibleData.length}`;
            }
        }
    }
}

// Global data grids registry
window.dataGrids = {};

// Filament Table Implementation
class FilamentTable extends EnhancedDataGrid {
    constructor() {
        super('filamentTable', [], [
            { key: 'brand', label: 'Brand', sortType: 'text' },
            { key: 'materialType', label: 'Material', sortType: 'text' },
            { key: 'color', label: 'Color', sortType: 'text' },
            { key: 'weight', label: 'Weight (g)', sortType: 'number' },
            { key: 'location', label: 'Location', sortType: 'text' },
            { key: 'inStock', label: 'Status', sortType: 'text' }
        ]);
    }

    updateData() {
        this.data = filaments || [];
        this.originalData = [...this.data];
        this.visibleData = [...this.data];
        this.currentPage = 1;

        // Check if initialization has been done
        const table = document.getElementById(this.tableId);
        if (table && !table.dataset.initialized) {
            this.init();
            table.dataset.initialized = 'true';
        } else {
            this.renderTable();
            this.setupPagination();
        }
    }

    renderRow(item) {
        const stockStatus = item.inStock ?
            '<span class="badge badge-success">In Stock</span>' :
            '<span class="badge badge-error">Out of Stock</span>';

        const colorDisplay = `
            <span class="color-swatch" style="background:${item.colorHex || '#ccc'}" data-hex="${item.colorHex || '#CCCCCC'}"></span>
            <span class="color-name">${item.colorName || item.color || 'Unknown'}</span>
        `;

        return `
            <tr data-id="${item.id}">
                <td data-sortable="brand">${item.brand || 'Unknown'}</td>
                <td data-sortable="materialType">${item.materialType || item.material || 'Unknown'}</td>
                <td data-sortable="color">${colorDisplay}</td>
                <td data-sortable="weight" data-sort-value="${item.weight || 0}">${(item.weight || 0).toFixed(1)}</td>
                <td data-sortable="location">${item.location || 'Not specified'}</td>
                <td data-sortable="inStock" class="status-cell">${stockStatus}</td>
                <td class="actions">
                    <button onclick="editFilament(${item.id})" aria-label="Edit ${item.brand || 'Unknown'} filament" class="btn-icon">✏️</button>
                    <button onclick="deleteFilament(${item.id})" aria-label="Delete ${item.brand || 'Unknown'} filament" class="btn-icon btn-danger">🗑️</button>
                </td>
            </tr>
        `;
    }

    filterRows(query) {
        if (query.length < 2) {
            this.visibleData = [...this.originalData];
        } else {
            this.visibleData = this.originalData.filter(item => {
                const searchableText = `${item.brand} ${item.materialType} ${item.material} ${item.colorName} ${item.color} ${item.location}`.toLowerCase();

                // Check for mathematical operators for weight filtering
                const weightMatch = query.match(/^(weight|weight:)([<>=]=?|=|!=)\s*(\d+(?:\.\d+)?)$/i);
                if (weightMatch) {
                    const [, field, operator, value] = weightMatch;
                    const weight = parseFloat(value);
                    const itemWeight = item.weight || 0;

                    switch (operator) {
                        case '<': return itemWeight < weight;
                        case '<=': return itemWeight <= weight;
                        case '>': return itemWeight > weight;
                        case '>=': return itemWeight >= weight;
                        case '=': case '==': return Math.abs(itemWeight - weight) < 0.01;
                        case '!=': return Math.abs(itemWeight - weight) >= 0.01;
                        default: return searchableText.includes(query);
                    }
                }

                // Check for range queries like "weight:100-500"
                const rangeMatch = query.match(/^(weight|weight:)(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/i);
                if (rangeMatch) {
                    const [, field, min, max] = rangeMatch;
                    const itemWeight = item.weight || 0;
                    return itemWeight >= parseFloat(min) && itemWeight <= parseFloat(max);
                }

                // Default text search
                return searchableText.includes(query);
            });
        }

        this.currentPage = 1;
        this.renderTable();
        this.updatePagination();
        this.updateSearchResults(this.visibleData.length, query);
    }
}

// Models Table Implementation
class ModelsTable extends EnhancedDataGrid {
    constructor() {
        super('modelTable', [], [
            { key: 'name', label: 'Model Name', sortType: 'text' },
            { key: 'category', label: 'Category', sortType: 'text' },
            { key: 'difficulty', label: 'Difficulty', sortType: 'text' },
            { key: 'requirements', label: 'Required Filaments', sortType: 'text' },
            { key: 'printTime', label: 'Est. Time', sortType: 'number' },
            { key: 'canPrint', label: 'Can Print?', sortType: 'text' },
            { key: 'link', label: 'Link/Notes', sortType: 'text' },
            { key: 'actions', label: 'Actions', sortType: 'text' }
        ]);
    }

    updateData() {
        this.data = models || [];
        this.originalData = [...this.data];
        this.visibleData = [...this.data];
        this.currentPage = 1;

        // Check if initialization has been done
        const table = document.getElementById(this.tableId);
        if (table && !table.dataset.initialized) {
            this.init();
            table.dataset.initialized = 'true';
        } else {
            this.renderTable();
            this.setupPagination();
        }
    }

    renderRow(item) {
        const requirementsDisplay = (item.requirements && item.requirements.length > 0) ?
            item.requirements.map(req => {
                const expectedWeight = req.expectedWeight ? `${req.expectedWeight}g` : 'N/A';
                const tolerance = req.tolerance ? `±${req.tolerance}%` : '±10%';
                return `
                    <div class="filament-req-enhanced">
                        <div class="req-primary">
                            <span class="req-color">${req.color} (${req.material})</span>
                            <span class="req-weight">${expectedWeight}</span>
                        </div>
                        <div class="req-secondary">
                            <span class="req-tolerance">${tolerance}</span>
                            ${req.requiredCount > 1 ? `<span class="req-quantity">×${req.requiredCount}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('') : '<span class="text-muted">No filaments specified</span>';

        const categoryDisplay = item.category ?
            `<span class="model-category">${item.category}</span>` :
            '<span class="text-muted">Unknown</span>';

        const difficultyClass = item.difficulty ? `difficulty-${item.difficulty.toLowerCase()}` : '';
        const difficultyDisplay = item.difficulty ?
            `<span class="model-difficulty ${difficultyClass}">${item.difficulty}</span>` :
            '<span class="text-muted">Unknown</span>';

        const printTimeDisplay = item.printTime ?
            `<span class="print-time">${item.printTime}m</span>` :
            '<span class="text-muted">N/A</span>';

        // Check if model can be printed based on filament availability
        const canPrint = canPrintModel(item);
        const canPrintDisplay = canPrint.canPrint ?
            `<span class="badge badge-success" title="Can print ${canPrint.canPrintCount > 1 ? `${canPrint.canPrintCount} times` : 'once'}">✓ ${canPrint.canPrintCount > 1 ? `(${canPrint.canPrintCount})` : ''}</span>` :
            '<span class="badge badge-error" title="Cannot print - insufficient filament">✗</span>';

        return `
            <tr data-id="${item.id}">
                <td data-sortable="name">${item.name || 'Unknown'}</td>
                <td data-sortable="category">${categoryDisplay}</td>
                <td data-sortable="difficulty">${difficultyDisplay}</td>
                <td data-sortable="requirements">${requirementsDisplay}</td>
                <td data-sortable="printTime">${printTimeDisplay}</td>
                <td data-sortable="canPrint">${canPrintDisplay}</td>
                <td data-sortable="link">
                    ${item.link ?
                        `<a href="${item.link}" target="_blank" rel="noopener noreferrer" title="${item.link}">
                            <span class="link-preview">🔗</span>
                        </a>` :
                        '<span class="text-muted" title="No link">—</span>'
                    }
                </td>
                <td data-sortable="actions" class="actions">
                    <button onclick="editModel(${item.id})" aria-label="Edit ${item.name || 'Unknown'} model" class="btn-icon">✏️</button>
                    <button onclick="deleteModel(${item.id})" aria-label="Delete ${item.name || 'Unknown'} model" class="btn-icon btn-danger">🗑️</button>
                </td>
            </tr>
        `;
    }

    filterRows(query) {
        if (query.length < 2) {
            this.visibleData = [...this.originalData];
        } else {
            this.visibleData = this.originalData.filter(item => {
                const searchableText = `${item.name} ${item.category || ''} ${item.difficulty || ''} ${item.requirements || ''} ${item.notes || ''} ${item.tags ? item.tags.join(' ') : ''} ${item.link || ''}`.toLowerCase();
                return searchableText.includes(query);
            });
        }

        this.currentPage = 1;
        this.renderTable();
        this.setupPagination();
        this.updateSearchResults(this.visibleData.length, query);
    }
}

// Initialize data grids
let filamentGrid, modelsGrid;

function initializeDataGrids() {
    filamentGrid = new FilamentTable();
    modelsGrid = new ModelsTable();

    window.dataGrids.filamentTable = filamentGrid;
    window.dataGrids.modelsTable = modelsGrid;
}

// Print Filament Management Functions
function addPrintFilament() {
    document.getElementById('printFilamentsContainer').appendChild(createPrintFilamentSearchBox());
}

function removePrintFilament(btn) {
    try {
        const container = btn.closest('#printFilamentsContainer');
        if (!container || !container.children || container.children.length <= 1) {
            showErrorMessage('Print must have at least one filament');
            return;
        }

        const item = btn.closest('.print-filament-item');
        if (item) {
            item.remove();
            updateTotalWeight(); // Recalculate total weight after removal
        }
    } catch (error) {
        showErrorMessage('Error removing filament');
    }
}

function createPrintFilamentSearchBox(selectedId = null, selectedWeight = null) {
    const div = document.createElement('div');
    div.className = 'print-filament-item';

    const weightDisplay = selectedWeight || '';

    // Create select options for filament dropdown
    let filamentOptions = '<option value="">Select Filament</option>';
    if (filaments && Array.isArray(filaments)) {
        filaments.forEach(fil => {
            if (fil && fil.id) {
                const displayName = `${fil.colorName || fil.color || 'Unknown'} - ${fil.materialType || fil.material || 'Unknown'} - ${fil.brand || 'Unknown'}`;
                filamentOptions += `<option value="${fil.id}" ${selectedId == fil.id ? 'selected' : ''}>${displayName}</option>`;
            }
        });
    }

    div.innerHTML = `
        <select class="print-filament-select" style="min-width: 300px;" onchange="updateTotalWeight()" title="Select filament used for this print">
            ${filamentOptions}
        </select>
        <input type="number" class="print-filament-weight" placeholder="Weight Used (g)" min="0" step="0.1" value="${weightDisplay}" style="width: 120px; margin-left: 10px;" onchange="updateTotalWeight()" oninput="updateTotalWeight()" title="Actual weight of filament used in grams">
        <button class="remove-btn" onclick="removePrintFilament(this)" title="Remove filament">✕</button>
    `;

    return div;
}

function updateTotalWeight() {
    const weightInputs = document.querySelectorAll('#printFilamentsContainer .print-filament-weight');
    let totalWeight = 0;

    weightInputs.forEach(input => {
        const weight = parseFloat(input.value) || 0;
        totalWeight += weight;
    });

    const totalWeightInput = document.getElementById('printWeight');
    if (totalWeightInput) {
        totalWeightInput.value = totalWeight.toFixed(1);
    }
}

// Enhanced Validation Framework
const ValidationRules = {
    brand: {
        required: true,
        minLength: 2,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9\s\-&.,]+$/,
        message: 'Brand must be 2-100 characters (letters, numbers, spaces, -, &, ., ,)'
    },
    materialType: {
        required: true,
        allowed: () => getMaterialTypes(),
        customAllowed: true,
        message: 'Material type is required'
    },
    colorName: {
        required: true,
        minLength: 2,
        maxLength: 50,
        message: 'Color name must be 2-50 characters'
    },
    colorHex: {
        required: true,
        pattern: /^#[0-9A-Fa-f]{6}$/,
        message: 'Color code must be valid HEX format (#RRGGBB)'
    },
    weight: {
        required: true,
        min: 0.1,
        max: 10000,
        type: 'number',
        message: 'Weight must be between 0.1g and 10,000g'
    },
    diameter: {
        required: true,
        type: 'number',
        allowed: [1.75, 2.85],
        message: 'Diameter must be 1.75mm or 2.85mm'
    },
    purchasePrice: {
        optional: true,
        min: 0,
        max: 1000,
        type: 'number',
        message: 'Price must be between $0 and $1000 per kg'
    },
    location: {
        optional: true,
        maxLength: 200,
        message: 'Location must be 200 characters or less'
    },
    temperature: {
        optional: true,
        validate: (tempObj) => {
            if (!tempObj) return true;
            const min = parseInt(tempObj.min);
            const max = parseInt(tempObj.max);
            return min >= 150 && max <= 350 && max > min;
        },
        message: 'Temperature range must be 150-350°C with max > min'
    }
};

const AccessibilityNotifications = {
    announce: function(message, priority = 'polite') {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only visually-hidden';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        setTimeout(() => document.body.removeChild(announcement), 1000);
    },

    announceError: function(fieldName, message) {
        this.announce(`Error in ${fieldName}: ${message}`, 'assertive');
    },

    announceSuccess: function(message) {
        this.announce(message, 'polite');
    }
};

function validateField(fieldName, value, options = {}) {
    const rule = ValidationRules[fieldName];
    if (!rule) return { valid: true };

    // Handle optional fields
    if (rule.optional && (!value || value === '')) {
        return { valid: true };
    }

    // Required field validation
    if (rule.required && (!value || value === '')) {
        return {
            valid: false,
            message: `${fieldName} is required`
        };
    }

    // Type validation (important - this comes BEFORE allowed values check)
    value = validateFieldType(value, rule, fieldName);
    if (typeof value === 'object' && !value.valid) {
        return value;
    }

    // Range validation
    const rangeResult = validateFieldRange(value, rule, fieldName);
    if (!rangeResult.valid) {
        return rangeResult;
    }

    // Length validation
    const lengthResult = validateFieldLength(value, rule, fieldName);
    if (!lengthResult.valid) {
        return lengthResult;
    }

    // Pattern validation
    const patternResult = validateFieldPattern(value, rule, fieldName);
    if (!patternResult.valid) {
        return patternResult;
    }

    // Allowed values validation (now AFTER type conversion)
    const allowedResult = validateFieldAllowed(value, rule, fieldName);
    if (!allowedResult.valid) {
        return allowedResult;
    }

    // Custom validation
    if (rule.validate && !rule.validate(value)) {
        return {
            valid: false,
            message: rule.message
        };
    }

    return { valid: true };
}

function validateFieldType(value, rule, fieldName) {
    if (rule.type === 'number' && value !== '') {
        const num = parseFloat(value);
        if (isNaN(num)) {
            return {
                valid: false,
                message: `${fieldName} must be a number`
            };
        }
        return num;
    }
    return value;
}

function validateFieldRange(value, rule, fieldName) {
    if (rule.min !== undefined && value < rule.min) {
        return {
            valid: false,
            message: rule.message || `${fieldName} must be at least ${rule.min}`
        };
    }

    if (rule.max !== undefined && value > rule.max) {
        return {
            valid: false,
            message: rule.message || `${fieldName} must be at most ${rule.max}`
        };
    }

    return { valid: true };
}

function validateFieldLength(value, rule, fieldName) {
    const length = typeof value === 'string' ? value.length : String(value).length;

    if (rule.minLength && length < rule.minLength) {
        return {
            valid: false,
            message: rule.message || `${fieldName} must be at least ${rule.minLength} characters`
        };
    }

    if (rule.maxLength && length > rule.maxLength) {
        return {
            valid: false,
            message: rule.message || `${fieldName} must be at most ${rule.maxLength} characters`
        };
    }

    return { valid: true };
}

function validateFieldPattern(value, rule, fieldName) {
    if (rule.pattern && !rule.pattern.test(value)) {
        return {
            valid: false,
            message: rule.message || `${fieldName} format is invalid`
        };
    }
    return { valid: true };
}

function validateFieldAllowed(value, rule, fieldName) {
    if (rule.allowed) {
        let allowedValues;
        if (typeof rule.allowed === 'function') {
            allowedValues = rule.allowed();
        } else {
            allowedValues = rule.allowed;
        }

        if (!allowedValues.includes(value)) {
            if (rule.customAllowed && value === 'Other') {
                return { valid: true };
            }
            return {
                valid: false,
                message: rule.message || `${fieldName} must be one of: ${allowedValues.join(', ')}`
            };
        }
    }
    return { valid: true };
}

function showFieldError(fieldElement, error) {
    fieldElement.classList.add('form-error');
    fieldElement.setAttribute('aria-invalid', 'true');

    let errorElement = fieldElement.parentNode.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');
        fieldElement.parentNode.appendChild(errorElement);
    }
    errorElement.textContent = error;

    AccessibilityNotifications.announceError(fieldElement.name || fieldElement.id, error);
}

function clearFieldError(fieldElement) {
    fieldElement.classList.remove('form-error');
    fieldElement.setAttribute('aria-invalid', 'false');

    const errorElement = fieldElement.parentNode.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function validateForm(formElement, options = {}) {
    const errors = {};
    let firstErrorField = null;


    // Get all form inputs
    const inputs = formElement.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        const fieldName = input.name || input.id;
        let value = input.value;

        // Handle special cases
        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'radio') {
            return; // Skip radio buttons for now, handled separately
        }

        // Handle material type with custom value
        if (fieldName === 'materialType' && value === 'Other') {
            const isEditForm = formElement.id === 'editFilamentForm';
            const customInputId = isEditForm ? 'editFilamentMaterialTypeCustom' : 'filamentMaterialTypeCustom';
            const customInput = document.getElementById(customInputId);
            if (customInput) {
                value = customInput.value.trim();
            }
        }

        // Handle temperature range for edit form
        if (fieldName === 'tempRange' || fieldName.includes('temp')) {
            const isEditForm = formElement.id === 'editFilamentForm';
            const tempMinId = isEditForm ? 'editFilamentTempMin' : 'filamentTempMin';
            const tempMaxId = isEditForm ? 'editFilamentTempMax' : 'filamentTempMax';
            const tempMin = document.getElementById(tempMinId);
            const tempMax = document.getElementById(tempMaxId);
            value = {
                min: tempMin ? tempMin.value : '',
                max: tempMax ? tempMax.value : ''
            };
        }

        const options = {
            fieldName,
            originalValue: input.value,
            processedValue: value,
            fieldType: input.type,
            hasValidationRule: !!ValidationRules[fieldName]
        };

        const validation = validateField(fieldName, value, options);

        if (!validation.valid) {
            errors[fieldName] = validation.message;
            if (!firstErrorField) {
                firstErrorField = input;
            }
            showFieldError(input, validation.message);
        } else {
            clearFieldError(input);
        }
    });


    // Focus first error field for accessibility
    if (firstErrorField && options.focusFirstError !== false) {
        firstErrorField.focus();
        AccessibilityNotifications.announce(`Form error in ${firstErrorField.name || firstErrorField.id}: ${errors[firstErrorField.name || firstErrorField.id]}`, 'assertive');
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors: errors
    };
}

function setupRealtimeValidation() {
    // Material type dropdown handling
    const materialTypeSelect = document.getElementById('filamentMaterialType');
    const materialTypeCustom = document.getElementById('filamentMaterialTypeCustom');

    if (materialTypeSelect && materialTypeCustom) {
        materialTypeSelect.addEventListener('change', function() {
            if (this.value === 'Other') {
                materialTypeCustom.style.display = 'block';
                materialTypeCustom.required = true;
                materialTypeCustom.removeAttribute('aria-hidden');
            } else {
                materialTypeCustom.style.display = 'none';
                materialTypeCustom.required = false;
                materialTypeCustom.setAttribute('aria-hidden', 'true');
                materialTypeCustom.value = '';
            }
        });
    }

    // Color picker validation
    const colorHexInput = document.getElementById('filamentColorHex');
    if (colorHexInput) {
        colorHexInput.addEventListener('input', function() {
            const validation = validateField('colorHex', this.value);
            if (!validation.valid) {
                showFieldError(this, validation.message);
            } else {
                clearFieldError(this);
            }
        });
    }

    // Weight validation
    const weightInput = document.getElementById('filamentWeight');
    if (weightInput) {
        weightInput.addEventListener('input', function() {
            const validation = validateField('weight', this.value);
            if (!validation.valid) {
                showFieldError(this, validation.message);
            } else {
                clearFieldError(this);
            }
        });
    }

    // Temperature range validation
    function validateTemperatureRange() {
        const tempMin = document.getElementById('filamentTempMin');
        const tempMax = document.getElementById('filamentTempMax');

        if (tempMin && tempMax) {
            const minVal = parseInt(tempMin.value);
            const maxVal = parseInt(tempMax.value);

            if (minVal && maxVal && minVal >= maxVal) {
                showFieldError(tempMax, 'Maximum temperature must be greater than minimum');
                return false;
            } else {
                clearFieldError(tempMax);
                return true;
            }
        }
        return true;
    }

    const tempMin = document.getElementById('filamentTempMin');
    const tempMax = document.getElementById('filamentTempMax');

    if (tempMin) tempMin.addEventListener('input', validateTemperatureRange);
    if (tempMax) tempMax.addEventListener('input', validateTemperatureRange);
}

function showLoadingState(buttonElement, isLoading = true, customText = 'Processing...') {
    if (isLoading) {
        buttonElement.classList.add('loading');
        buttonElement.disabled = true;
        buttonElement.setAttribute('aria-busy', 'true');

        // Store original state
        if (!buttonElement.getAttribute('data-original-text')) {
            buttonElement.setAttribute('data-original-text', buttonElement.textContent);
        }
        if (!buttonElement.getAttribute('data-original-styles')) {
            buttonElement.setAttribute('data-original-styles', buttonElement.style.cssText);
        }

        buttonElement.textContent = customText;
        buttonElement.style.opacity = '0.7';
        buttonElement.style.cursor = 'wait';
    } else {
        buttonElement.classList.remove('loading');
        buttonElement.disabled = false;
        buttonElement.removeAttribute('aria-busy');

        // Restore original state
        const originalText = buttonElement.getAttribute('data-original-text');
        const originalStyles = buttonElement.getAttribute('data-original-styles');

        if (originalText) {
            buttonElement.textContent = originalText;
        }
        if (originalStyles) {
            buttonElement.style.cssText = originalStyles;
        }
    }
}

function showSuccessMessage(message, duration = 3000) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message form-success';
    successDiv.setAttribute('role', 'alert');
    successDiv.setAttribute('aria-live', 'polite');
    successDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">✅</span>
            <span>${message}</span>
        </div>
    `;

    // Position for enhanced UI
    Object.assign(successDiv.style, {
        background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
        border: '2px solid #28a745',
        color: '#155724',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(40, 167, 69, 0.2)',
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '1000',
        maxWidth: '350px',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        transform: 'translateX(0)'
    });

    document.body.appendChild(successDiv);

    // Animate in
    setTimeout(() => {
        successDiv.style.transform = 'translateX(0)';
    }, 10);

    AccessibilityNotifications.announceSuccess(message);

    // Animate out and remove
    setTimeout(() => {
        successDiv.style.transform = 'translateX(400px)';
        successDiv.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
            }
        }, 300);
    }, duration);
}

function showErrorMessage(message, duration = 5000) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">⚠️</span>
            <span>${message}</span>
            <button onclick="this.closest('.error-message').remove()" style="margin-left: auto; background: none; border: none; cursor: pointer;">✕</button>
        </div>
    `;

    // Position for enhanced UI
    Object.assign(errorDiv.style, {
        background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
        border: '2px solid #dc3545',
        color: '#721c24',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(220, 53, 69, 0.2)',
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '1000',
        maxWidth: '350px',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        transform: 'translateX(0)'
    });

    document.body.appendChild(errorDiv);

    // Animate in
    setTimeout(() => {
        errorDiv.style.transform = 'translateX(0)';
    }, 10);

    AccessibilityNotifications.announceError('System Error', message);

    // Auto-remove with animation
    setTimeout(() => {
        errorDiv.style.transform = 'translateX(400px)';
        errorDiv.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 300);
    }, duration);
}

function showWarningMessage(message, duration = 4000) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'warning-message';
    warningDiv.setAttribute('role', 'alert');
    warningDiv.setAttribute('aria-live', 'assertive');
    warningDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">⚠️</span>
            <span>${message}</span>
            <button onclick="this.closest('.warning-message').remove()" style="margin-left: auto; background: none; border: none; cursor: pointer;">✕</button>
        </div>
    `;

    Object.assign(warningDiv.style, {
        background: 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)',
        border: '2px solid #ffc107',
        color: '#856404',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(255, 193, 7, 0.2)',
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '1000',
        maxWidth: '350px',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        transform: 'translateX(0)'
    });

    document.body.appendChild(warningDiv);

    setTimeout(() => {
        warningDiv.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
        warningDiv.style.transform = 'translateX(400px)';
        warningDiv.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(warningDiv)) {
                document.body.removeChild(warningDiv);
            }
        }, 300);
    }, duration);
}

function showProgressIndicator(percentage, message = 'Processing...') {
    // Remove existing progress indicator if any
    const existing = document.querySelector('.progress-indicator');
    if (existing) {
        existing.remove();
    }

    const progressDiv = document.createElement('div');
    progressDiv.className = 'progress-indicator';
    progressDiv.setAttribute('role', 'progressbar');
    progressDiv.setAttribute('aria-valuenow', percentage);
    progressDiv.setAttribute('aria-valuemin', '0');
    progressDiv.setAttribute('aria-valuemax', '100');

    Object.assign(progressDiv.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        height: '4px',
        backgroundColor: '#e9ecef',
        zIndex: '9999',
        transition: 'width 0.3s ease'
    });

    const progressBar = document.createElement('div');
    Object.assign(progressBar.style, {
        height: '100%',
        width: `${percentage}%`,
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        transition: 'width 0.3s ease'
    });

    progressDiv.appendChild(progressBar);
    document.body.appendChild(progressDiv);

    return {
        update: function(newPercentage, newMessage) {
            progressBar.style.width = `${newPercentage}%`;
            progressDiv.setAttribute('aria-valuenow', newPercentage);
        },
        complete: function() {
            progressBar.style.width = '100%';
            progressDiv.setAttribute('aria-valuenow', '100');
            setTimeout(() => {
                if (document.body.contains(progressDiv)) {
                    document.body.removeChild(progressDiv);
                }
            }, 500);
        }
    };
}

function showFieldFeedback(fieldElement, feedbackType, message) {
    feedbackType = feedbackType.toLowerCase(); // success, error, warning, info

    // Clear existing feedback
    const existingFeedback = fieldElement.parentNode.querySelector('.field-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Create feedback element
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `field-feedback field-${feedbackType}`;
    feedbackDiv.setAttribute('role', feedbackType === 'error' ? 'alert' : 'status');
    feedbackDiv.textContent = message;

    const styles = {
        success: { color: '#155724', background: '#d4edda', border: '1px solid #c3e6cb' },
        error: { color: '#721c24', background: '#f8d7da', border: '1px solid #f5c6cb' },
        warning: { color: '#856404', background: '#fff3cd', border: '1px solid #ffeeba' },
        info: { color: '#004085', background: '#d1ecf1', border: '1px solid #bee5eb' }
    };

    Object.assign(feedbackDiv.style, {
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '4px',
        marginTop: '4px',
        ...styles[feedbackType]
    });

    fieldElement.parentNode.appendChild(feedbackDiv);

    // Auto-remove success and info messages
    if (feedbackType === 'success' || feedbackType === 'info') {
        setTimeout(() => {
            if (feedbackDiv.parentNode) {
                feedbackDiv.remove();
            }
        }, 3000);
    }
}

// Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const targetPage = document.getElementById(pageName + '-page');
    const targetNav = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
    }
    if (targetNav) {
        targetNav.classList.add('active');
    } else {
    }
}

// DOM Structure Fix
function fixPageStructure() {

    const filamentPage = document.getElementById('filament-page');
    const container = document.querySelector('.container');

    if (!filamentPage || !container) {
        return;
    }

    // Debug: Check where the Add Filament button is
    const addFilamentBtn = document.getElementById('addFilamentBtn');
    if (addFilamentBtn) {

        let parent = addFilamentBtn;
        let level = 0;
        while (parent && level < 10) {
            parent = parent.parentElement;
            level++;
        }

        // Check if button is inside the collapsible section
        const addFilamentSection = document.getElementById('addFilamentSection');
        if (addFilamentSection && !addFilamentBtn.closest('#addFilamentSection')) {

            // Find the form-actions div that contains the button
            const formActions = addFilamentBtn.closest('.form-actions');
            if (formActions) {
                addFilamentSection.appendChild(formActions);
            }
        }
    }

    // Find all elements that should be inside filament-page but are currently outside
    const misplacedElements = [];
    let current = container.firstElementChild;

    // Check all direct children of the container
    while (current) {
        const nextElement = current.nextElementSibling;

        // If this element is not a page and not already inside a page, it's misplaced
        if (!current.classList.contains('page') && !current.closest('.page')) {
            // Move elements until we hit the next page
            if (current.id === 'filament-page' ||
                current.classList.contains('section') ||
                current.id === 'filamentForm' ||
                current.querySelector('#filamentTable') ||
                current.querySelector('#filamentGridWrapper') ||
                current.querySelector('#filamentTableSearch') ||
                current.querySelector('#duplicateWarning')) {

                misplacedElements.push(current);
            }
        } else if (current.classList.contains('page') && current.id !== 'filament-page') {
            // We've reached the next page, stop looking
            break;
        }

        current = nextElement;
    }

    // Move all misplaced elements into the filament page
    if (misplacedElements.length > 0) {

        misplacedElements.forEach(element => {
            filamentPage.appendChild(element);
        });
    }

}

// Utility Functions
function ensureFilamentIds() {
    let changed = false;
    filaments.forEach(f => {
        if (!f.id || typeof f.id !== 'number' || !Number.isInteger(f.id)) {
            f.id = Math.floor(Date.now() + Math.random() * 1000000);
            changed = true;
        }
    });
    if (changed) saveData();
}

function resolveFilamentId(color, material) {
    if (!color || !material) return null;
    const c = color.toLowerCase().trim();
    const m = material.toLowerCase().trim();
    const match = filaments.find(f => 
        f.color.toLowerCase().trim() === c && 
        f.material.toLowerCase().trim() === m &&
        f.inStock
    );
    return match ? match.id : null;
}

// Data Management
function loadData() {
    try {
        const f = localStorage.getItem('filaments');
        if (f) {
            filaments = JSON.parse(f);
            // Migrate old data structure to new enhanced structure
            filaments = filaments.map(f => {
                // Handle legacy data migration
                if (!f.materialType && f.material) {
                    f.materialType = f.material;
                }
                if (!f.brand) {
                    f.brand = 'Unknown'; // Migrate missing brand
                }
                if (!f.colorHex) {
                    f.colorHex = '#cccccc'; // Default color
                }
                if (!f.diameter) {
                    f.diameter = 1.75; // Default diameter
                }
                if (f.inStock === undefined) {
                    f.inStock = true;
                }
                // Ensure backwards compatibility with print history
                if (f.material && !f.materialType) {
                    f.materialType = f.material;
                }
                return f;
            });
        }
        const m = localStorage.getItem('models');
        if (m) {
            models = JSON.parse(m);
            // Migrate models structure if needed
            models.forEach(m => {
                if (m.requirements) {
                    m.requirements.forEach(req => {
                        if (req.material && !req.materialType) {
                            req.materialType = req.material;
                        }
                    });
                }
            });
        }
        const p = localStorage.getItem('prints');
        if (p) prints = JSON.parse(p);
    ensureFilamentIds();
    updateAllTables();
    } catch (e) {
        // Fallback to basic data loading if there's an error
        const fallbackFilaments = localStorage.getItem('filaments');
        const fallbackModels = localStorage.getItem('models');
        const fallbackPrints = localStorage.getItem('prints');

        if (fallbackFilaments) filaments = JSON.parse(fallbackFilaments);
        if (fallbackModels) models = JSON.parse(fallbackModels);
        if (fallbackPrints) prints = JSON.parse(fallbackPrints);

        ensureFilamentIds();
        updateAllTables();
    }
}

function saveData() {
    try {
        // Validate data structure before saving
        if (!validateFilamentData()) {
            return false;
        }

        // Save enhanced data structure with versioning
        const dataVersion = '2.0';
        const saveData = {
            filaments,
            models,
            prints,
            version: dataVersion,
            lastSaved: new Date().toISOString()
        };

        localStorage.setItem('printstackData', JSON.stringify(saveData));

        // Maintain backward compatibility by also saving individual data sets
        localStorage.setItem('filaments', JSON.stringify(filaments));
        localStorage.setItem('models', JSON.stringify(models));
        localStorage.setItem('prints', JSON.stringify(prints));

        return true;
    } catch (error) {
        AccessibilityNotifications.announceError('Save Data', 'Failed to save data to local storage');
        return false;
    }
}

function validateFilamentData() {
    return filaments.every(f => {
        // Required fields for enhanced filament data
        if (!f.brand || typeof f.brand !== 'string' || f.brand.trim() === '') {
            return false;
        }
        if (!f.materialType || typeof f.materialType !== 'string' || f.materialType.trim() === '') {
            return false;
        }
        if (!f.color || typeof f.color !== 'string' || f.color.trim() === '') {
            return false;
        }
        if (!f.colorHex || typeof f.colorHex !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(f.colorHex)) {
            return false;
        }
        if (!f.weight || typeof f.weight !== 'number' || f.weight <= 0) {
            return false;
        }
        if (!f.diameter || ![1.75, 2.85].includes(f.diameter)) {
            return false;
        }

        // Validate optional fields
        if (f.purchasePrice && (typeof f.purchasePrice !== 'number' || f.purchasePrice < 0)) {
            return false;
        }

        if (f.temperature) {
            const temp = f.temperature;
            if (temp.min && (typeof temp.min !== 'number' || temp.min < 150 || temp.min > 350)) {
                return false;
            }
            if (temp.max && (typeof temp.max !== 'number' || temp.max < 150 || temp.max > 350)) {
                return false;
            }
            if (temp.min && temp.max && temp.min >= temp.max) {
                return false;
            }
        }

        return true;
    });
}

function preventNegativeInventory(filamentId, weightToUse) {
    const filament = filaments.find(f => f.id === filamentId);
    if (!filament) return false;

    const usedWeight = getFilamentUsage(filament.color);
    const availableWeight = filament.weight - usedWeight;

    if (availableWeight < weightToUse) {
        const shortage = weightToUse - availableWeight;
        return {
            canConsume: false,
            available: availableWeight,
            requested: weightToUse,
            shortage: shortage,
            message: `Insufficient filament. Available: ${availableWeight.toFixed(1)}g, Requested: ${weightToUse.toFixed(1)}g, Shortage: ${shortage.toFixed(1)}g`
        };
    }

    return {
        canConsume: true,
        available: availableWeight,
        requested: weightToUse,
        message: 'Sufficient filament available'
    };
}

function checkAndPreventNegativeInventory(filamentId, weightToUse, allowOverride = false) {
    const check = preventNegativeInventory(filamentId, weightToUse);

    if (!check.canConsume) {
        if (!allowOverride) {
            const filament = filaments.find(f => f.id === filamentId);
            const shouldOverride = confirm(
                `${check.message}\n\n` +
                `Filament: ${filament.brand} ${filament.materialType} (${filament.color})\n\n` +
                `Would you like to:\n\n` +
                `OK = Proceed anyway (inventory will go negative)\n` +
                `Cancel = Adjust the usage amount`
            );

            if (!shouldOverride) {
                return false;
            }
        }

        AccessibilityNotifications.announce(
            `Warning: Filament inventory will go negative by ${check.shortage.toFixed(1)}g`,
            'assertive'
        );
    }

    return true;
}

function exportData() {
    try {
        // Enhanced export with version and metadata
        const exportData = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            application: 'PrintStack Enhanced',
            data: {
                filaments,
                models,
                prints
            },
            metadata: {
                totalFilaments: filaments.length,
                totalModels: models.length,
                totalPrints: prints.length,
               FilamentTypes: [...new Set(filaments.map(f => f.materialType))],
                Brands: [...new Set(filaments.map(f => f.brand))]
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `printstack-enhanced-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showSuccessMessage('Data exported successfully');
        AccessibilityNotifications.announceSuccess('Data exported successfully');

    } catch (error) {
        AccessibilityNotifications.announceError('Export', 'Failed to export data');
    }
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const importData = JSON.parse(ev.target.result);

            // Handle both legacy and enhanced import formats
            let filamentsToImport = [];
            let modelsToImport = [];
            let printsToImport = [];

            if (importData.version && importData.data) {
                // Enhanced format (version 2.0+)
                filamentsToImport = importData.data.filaments || [];
                modelsToImport = importData.data.models || [];
                printsToImport = importData.data.prints || [];

                showSuccessMessage(`Importing enhanced data from ${importData.application || 'PrintStack Enhanced'} v${importData.version}`);
            } else {
                // Legacy format
                filamentsToImport = importData.filaments || [];
                modelsToImport = importData.models || [];
                printsToImport = importData.prints || [];

                showSuccessMessage('Importing legacy format data');
            }

            const hasFilaments = filamentsToImport.length > 0;
            const hasModels = modelsToImport.length > 0;
            const hasPrints = printsToImport.length > 0;

            if (!hasFilaments && !hasModels && !hasPrints) {
                AccessibilityNotifications.announceError('Import', 'No data found in file');
                return;
            }

            const confirmed = confirm(
                `File contains:\n${hasFilaments ? `• ${filamentsToImport.length} Filaments\n` : ''}${hasModels ? `• ${modelsToImport.length} Models\n` : ''}${hasPrints ? `• ${printsToImport.length} Print records\n` : ''}\n\nOK = Replace these items\nCancel = Add (keep existing)`
            );

            const mode = confirmed ? 'replace' : 'add';

            // Process and validate filaments
            if (hasFilaments) {
                const processedFilaments = filamentsToImport.map(f => {
                    // Ensure required fields exist
                    if (!f.brand) f.brand = 'Unknown';
                    if (!f.materialType && f.material) f.materialType = f.material;
                    if (!f.materialType) f.materialType = 'Unknown';
                    if (!f.colorHex) f.colorHex = '#cccccc';
                    if (!f.diameter) f.diameter = 1.75;
                    if (f.id === undefined) f.id = Date.now() + Math.random();
                    return f;
                });

                if (mode === 'replace') {
                    filaments = processedFilaments;
                } else {
                    filaments.push(...processedFilaments);
                }
                ensureFilamentIds();
            }

            // Process and validate models
            if (hasModels) {
                modelsToImport.forEach(m => {
                    if (!m.id) m.id = Date.now() + Math.random();
                    if (m.requirements) {
                        m.requirements.forEach(req => {
                            if (!req.filamentId && req.color && req.material) {
                                req.filamentId = resolveFilamentId(req.color, req.material);
                            }
                            // Handle migration from material to materialType
                            if (req.material && !req.materialType) {
                                req.materialType = req.material;
                            }
                        });
                    }
                });

                if (mode === 'replace') {
                    models = modelsToImport;
                } else {
                    modelsToImport.forEach(m => {
                        if (!models.some(x => x.name.toLowerCase() === m.name.toLowerCase())) {
                            models.push(m);
                        }
                    });
                }
            }

            // Process and validate prints
            if (hasPrints) {
                printsToImport.forEach(p => {
                    if (!p.id) p.id = Date.now() + Math.random();
                });

                if (mode === 'replace') {
                    prints = printsToImport;
                } else {
                    prints.push(...printsToImport);
                }
            }

            // Save with validation
            if (saveData()) {
                updateAllTables();
                showSuccessMessage(`Import completed successfully! ${hasFilaments ? `${filamentsToImport.length} filaments, ` : ''}${hasModels ? `${modelsToImport.length} models, ` : ''}${hasPrints ? `${printsToImport.length} print records` : ''} imported.`);
                AccessibilityNotifications.announceSuccess('Import completed successfully');
            } else {
                AccessibilityNotifications.announceError('Import', 'Failed to save imported data');
            }

        } catch (error) {
            AccessibilityNotifications.announceError('Import', `Invalid data format: ${error.message}`);
        }
    };

    reader.readAsText(file);
    e.target.value = '';
}

// Filament Functions
function addFilament() {
    const form = document.getElementById('filamentForm');
    const submitButton = document.getElementById('addFilamentBtn');

    // Validate form using enhanced validation
    const validation = validateForm(form);
    if (!validation.valid) {
        return false;
    }

    // Show loading state for better UX
    showLoadingState(submitButton, true);

    try {
        const filamentData = collectFilamentFormData();
        const duplicate = checkForFilamentDuplicate(filamentData);

        if (duplicate) {
            handleDuplicateFilament(duplicate, filamentData, submitButton);
        } else {
            addNewFilament(filamentData);
        }

        // Clear form
        clearFilamentForm(form);

        // Save and update UI
        saveData();
        updateAllTables();

        // Announce success for screen readers
        AccessibilityNotifications.announceSuccess(`${filamentData.brand} ${filamentData.materialType} filament added successfully`);

    } catch (error) {
        AccessibilityNotifications.announceError('Add Filament', 'An unexpected error occurred');
    } finally {
        showLoadingState(submitButton, false);
    }

    return true;
}

function collectFilamentFormData() {
    let materialType = document.getElementById('filamentMaterialType').value;

    // Handle custom material type
    if (materialType === 'Other') {
        materialType = document.getElementById('filamentMaterialTypeCustom').value.trim();
    }

    const filament = {
        id: Date.now() + Math.random(), // Ensure uniqueness
        brand: document.getElementById('filamentBrand').value.trim(),
        materialType,
        color: document.getElementById('filamentColor').value.trim(),
        colorHex: document.getElementById('filamentColorHex').value,
        diameter: parseFloat(document.getElementById('filamentDiameter').value),
        weight: parseFloat(document.getElementById('filamentWeight').value) || 0,
        location: document.getElementById('filamentLocation').value.trim() || '',
        purchasePrice: document.getElementById('filamentPurchasePrice').value ?
            parseFloat(document.getElementById('filamentPurchasePrice').value) : null,
        notes: document.getElementById('filamentNotes').value.trim() || '',
        inStock: document.getElementById('filamentInStock').checked,
        purchaseDate: new Date().toISOString() // Auto-add purchase date
    };

    // Add temperature range if provided
    const tempMin = document.getElementById('filamentTempMin').value;
    const tempMax = document.getElementById('filamentTempMax').value;

    if (tempMin || tempMax) {
        filament.temperature = {
            min: tempMin ? parseInt(tempMin) : null,
            max: tempMax ? parseInt(tempMax) : null
        };
    }

    return filament;
}

function checkForFilamentDuplicate(filamentData) {
    return filaments.find(f =>
        f.brand.toLowerCase() === filamentData.brand.toLowerCase() &&
        f.materialType.toLowerCase() === filamentData.materialType.toLowerCase() &&
        f.colorHex.toLowerCase() === filamentData.colorHex.toLowerCase()
    );
}

function handleDuplicateFilament(duplicate, filamentData, submitButton) {
    showLoadingState(submitButton, false);

    const shouldMerge = confirm(
        `Duplicate filament detected:\n${duplicate.brand} ${duplicate.materialType} in ${duplicate.color}\n\n` +
        `Would you like to merge with the existing entry?\n\n` +
        `OK = Merge quantities\nCancel = Create new entry anyway`
    );

    if (shouldMerge) {
        // Merge with existing entry
        duplicate.weight += filamentData.weight;
        duplicate.notes = duplicate.notes ?
            `${duplicate.notes}; ${filamentData.notes}` : filamentData.notes;
        showSuccessMessage(`Filament quantities merged successfully`);
    } else {
        // Add new entry anyway
        filaments.push(filamentData);
        showSuccessMessage('New filament added successfully');
    }
}

function addNewFilament(filamentData) {
    filaments.push(filamentData);
    showSuccessMessage('Filament added successfully');
}

function clearFilamentForm(form) {
    form.reset();

    // Clear custom material type field
    const customMaterialType = document.getElementById('filamentMaterialTypeCustom');
    if (customMaterialType) {
        customMaterialType.style.display = 'none';
        customMaterialType.setAttribute('aria-hidden', 'true');
    }
}

function editFilament(id) {
    const f = filaments.find(x => x.id === id);
    if (!f) return;

    editingFilamentId = id;

    // Map to enhanced edit modal fields
    document.getElementById('editFilamentBrand').value = f.brand || '';
    document.getElementById('editFilamentMaterialType').value = f.materialType || f.material || '';
    document.getElementById('editFilamentColor').value = f.color || '';
    document.getElementById('editFilamentColorHex').value = f.colorHex || '#cccccc';
    document.getElementById('editFilamentWeight').value = f.weight || 0;
    document.getElementById('editFilamentDiameter').value = f.diameter || 1.75;
    document.getElementById('editFilamentLocation').value = f.location || '';
    document.getElementById('editFilamentPurchasePrice').value = f.purchasePrice || '';
    document.getElementById('editFilamentInStock').checked = f.inStock;
    document.getElementById('editFilamentNotes').value = f.notes || '';

    // Handle temperature range
    if (f.temperature) {
        document.getElementById('editFilamentTempMin').value = f.temperature.min || '';
        document.getElementById('editFilamentTempMax').value = f.temperature.max || '';
    } else {
        document.getElementById('editFilamentTempMin').value = '';
        document.getElementById('editFilamentTempMax').value = '';
    }

    document.getElementById('editFilamentModal').style.display = 'block';
    showFieldFeedback(document.getElementById('editFilamentBrand'), 'info', `Editing: ${f.brand} ${f.materialType}`);
}

function closeEditFilamentModal() {
    document.getElementById('editFilamentModal').style.display = 'none';
    editingFilamentId = null;
}

function saveEditFilament() {
    const f = filaments.find(x => x.id === editingFilamentId);
    if (!f) return;

    // Get the actual edit form element
    const editForm = document.getElementById('editFilamentForm');
    if (!editForm) {
        showErrorMessage('Edit form not found');
        return false;
    }

    // Validate the actual form
    const validation = validateForm(editForm);
    if (!validation.valid) {
        showErrorMessage(`Validation failed: ${Object.values(validation.errors).join(', ')}`);

        // Clear any existing field errors
        editForm.querySelectorAll('.form-error').forEach(el => {
            el.classList.remove('form-error');
            el.setAttribute('aria-invalid', 'false');
        });
        editForm.querySelectorAll('.error-message').forEach(el => el.remove());

        // Show specific validation errors
        Object.entries(validation.errors).forEach(([fieldName, message]) => {
            const field = editForm.querySelector(`[name="${fieldName}"]`);
            if (field) {
                showFieldError(field, message);
            } else {
            }
        });

        // Focus the first error field
        const firstErrorField = editForm.querySelector('.form-error');
        if (firstErrorField) {
            firstErrorField.focus();
        }

        return false;
    }

    try {
        // Update filament with enhanced fields
        f.brand = document.getElementById('editFilamentBrand').value.trim();
        f.materialType = document.getElementById('editFilamentMaterialType').value.trim();
        f.color = document.getElementById('editFilamentColor').value.trim();
        f.colorHex = document.getElementById('editFilamentColorHex').value;
        f.weight = parseFloat(document.getElementById('editFilamentWeight').value) || 0;
        f.diameter = parseFloat(document.getElementById('editFilamentDiameter').value) || 1.75;
        f.location = document.getElementById('editFilamentLocation').value.trim() || '';
        f.purchasePrice = document.getElementById('editFilamentPurchasePrice').value ?
            parseFloat(document.getElementById('editFilamentPurchasePrice').value) : null;
        f.inStock = document.getElementById('editFilamentInStock').checked;
        f.notes = document.getElementById('editFilamentNotes').value.trim() || '';

        // Handle temperature range
        const tempMin = document.getElementById('editFilamentTempMin').value;
        const tempMax = document.getElementById('editFilamentTempMax').value;

        if (tempMin || tempMax) {
            f.temperature = {
                min: tempMin ? parseInt(tempMin) : null,
                max: tempMax ? parseInt(tempMax) : null
            };
        } else {
            delete f.temperature;
        }

        // Update last modified timestamp
        f.lastModified = new Date().toISOString();

        saveData();
        updateAllTables();
        closeEditFilamentModal();

        showSuccessMessage(`${f.brand} ${f.materialType} filament updated successfully`);
        AccessibilityNotifications.announceSuccess('Filament updated successfully');

    } catch (error) {
        showErrorMessage('Failed to save filament changes');
        return false;
    }

    return true;
}

function deleteFilament(id) {
    const filament = filaments.find(f => f.id === id);
    if (!filament) return;

    // Check for references in models (Task T029: Filament deletion prevention)
    const modelReferences = [];
    models.forEach(m => {
        if (m.requirements) {
            const refs = m.requirements.filter(r => r.filamentId === id);
            if (refs.length > 0) {
                modelReferences.push({
                    modelName: m.name,
                    count: refs.length
                });
            }
        }
    });

    // Check for references in print history
    const printReferences = prints.filter(p =>
        p.filamentId === id ||
        (p.color === filament.color && (!p.material || p.material === filament.materialType))
    );

    // Build warning message if references exist
    let warningMessage = `Delete ${filament.brand} ${filament.materialType} (${filament.color})?`;
    let canDelete = true;

    if (modelReferences.length > 0 || printReferences.length > 0) {
        canDelete = false;
        warningMessage = `\u26a0\ufe0f Cannot delete - filament is referenced:\n\n`;

        if (modelReferences.length > 0) {
            warningMessage += ` MODELS (${modelReferences.length}):\n`;
            modelReferences.forEach(ref => {
                warningMessage += `  \u2022 ${ref.modelName} (${ref.count} reference${ref.count > 1 ? 's' : ''})\n`;
            });
        }

        if (printReferences.length > 0) {
            warningMessage += `\n PRINT HISTORY (${printReferences.length} records)\n`;
        }

        warningMessage += `\nTo delete this filament:\n`;
        warningMessage += `1. Remove it from all models first\n`;
        warningMessage += `2. Consider keeping it for print history\n`;
        warningMessage += `3. OR mark as "Out of Stock" instead`;

        showWarningMessage('Cannot delete filament - it is referenced by models or print history', 8000);
    }

    if (!canDelete) {
        const confirmed = confirm(warningMessage + '\n\nClick OK to mark as "Out of Stock" instead\nClick Cancel to keep as is');
        if (confirmed) {
            // Mark as out of stock instead of deleting
            filament.inStock = false;
            filament.deletionBlocked = true;
            saveData();
            updateAllTables();
            showSuccessMessage('Filament marked as Out of Stock instead of deletion');
            AccessibilityNotifications.announceSuccess('Filament marked as Out of Stock');
        }
        return;
    }

    // Standard deletion confirmation for unused filaments
    const confirmed = confirm(`Delete ${filament.brand} ${filament.materialType} (${filament.color})? 🗑️`);
    if (confirmed) {
        filaments = filaments.filter(f => f.id !== id);
        saveData();
        updateAllTables();
        showSuccessMessage('Filament deleted successfully');
        AccessibilityNotifications.announceSuccess('Filament deleted');
    }
}

function getFilamentUsage(color) {
    return prints.filter(p => p.color.toLowerCase() === color.toLowerCase())
                 .reduce((s, p) => s + p.weight, 0);
}

function updateFilamentTable() {
    // Initialize enhanced data grid if not already done
    if (!window.dataGrids) {
        window.dataGrids = {};
    }

    if (!window.dataGrids.filamentTable) {
        window.dataGrids.filamentTable = new FilamentTable();
    }

    // Set global filaments data and refresh the grid
    window.filaments = filaments;
    window.dataGrids.filamentTable.updateData();
}

function setupFilamentSearch() {
    // Search functionality is now handled by the enhanced data grid
    // This function is kept for compatibility but no longer needed
}
// Filament Search Box for Models
function createFilamentSearchBox(selectedId = null, isEdit = false) {
    const div = document.createElement('div');
    div.className = 'filament-req-item';
    const fil = selectedId ? filaments.find(f => f.id === selectedId) : null;
    let displayText = '';

    if (fil) {
        displayText = `${fil.colorName || fil.color} (${fil.materialType || fil.material})`;
    } else if (selectedId) {
        // Find the model requirement that references this filament to show what was expected
        let req = null;
        for (const model of models) {
            if (model.requirements) {
                req = model.requirements.find(r => r.filamentId === selectedId);
                if (req) break;
            }
        }

        if (req) {
            const color = req.color || req.colorName || 'Unknown';
            const material = req.material || req.materialType || 'Unknown';
            displayText = `[MISSING] ${color} (${material})`;
        } else {
            displayText = `[MISSING] Unknown filament (ID: ${selectedId})`;
        }
    } else {
        displayText = '';
    }

    const removeFn = isEdit ? 'removeEditFilamentRequirement' : 'removeFilamentRequirement';
    
    // Get requirement data if this is an edit or creating with existing data
    let reqData = null;
    if (selectedId && isEdit) {
        // This is edit mode, find the requirement data
        for (const model of models) {
            if (model.requirements) {
                reqData = model.requirements.find(r => r.filamentId === selectedId);
                if (reqData) break;
            }
        }
    }

    div.innerHTML = `
        <div class="search-container">
            <input type="text" class="search-input req-search" placeholder="Search filaments..." value="${displayText}" data-selected-id="${selectedId || ''}" autocomplete="off" title="Search for filaments by name, color, or material type">
            <div class="search-results"></div>
        </div>
        <div class="usage-fields">
            <input type="number" class="expected-weight" placeholder="Expected weight (g)" min="0" step="0.1" value="${reqData?.expectedWeight || ''}" aria-label="Expected filament weight in grams" title="Expected filament weight in grams for this model">
            <input type="number" class="tolerance" placeholder="Tolerance %" min="0" max="100" step="1" value="${reqData?.tolerance || ''}" aria-label="Usage tolerance percentage" title="Tolerance percentage for weight variance (e.g., 5 for ±5%)">
            <input type="number" class="required-count" placeholder="Qty" min="1" value="${reqData?.requiredCount || 1}" aria-label="Number of items required" title="Number of times this filament is needed for the model">
        </div>
        <button type="button" class="delete-btn" onclick="${removeFn}(this)" title="Remove this filament requirement">Remove</button>
    `;
    
    const input = div.querySelector('.req-search');
    const resultsDiv = div.querySelector('.search-results');
    let selecting = false;
    
    const updateResults = () => {
        const container = input.closest('#requiredFilamentsContainer, #editRequiredFilamentsContainer');
        const selectedIds = Array.from(container.querySelectorAll('.req-search'))
            .map(i => parseInt(i.dataset.selectedId))
            .filter(id => !isNaN(id) && id !== parseInt(input.dataset.selectedId));
        
        const filtered = filaments.filter(f => !selectedIds.includes(f.id) &&
            (!input.value || `${(f.materialType || f.material)} ${(f.colorName || f.color)}`.toLowerCase().includes(input.value.toLowerCase())));
        
        resultsDiv.innerHTML = filtered.length ? filtered.map(f => `
            <div class="search-result-item" data-filament-id="${f.id}">
                <span class="color-swatch" style="background:${f.colorHex || '#ccc'}" data-hex="${f.colorHex || '#CCCCCC'}"></span>
                <span>${f.colorName || f.color} (${f.materialType || f.material})</span>
                ${!f.inStock ? '<span class="badge badge-error">Out of Stock</span>' : ''}
            </div>`).join('') : '<div class="no-results">No filaments found</div>';
        
        resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
            item.onmouseenter = () => selecting = true;
            item.onmouseleave = () => selecting = false;
            item.onclick = e => {
                e.stopPropagation();
                const fid = parseInt(item.dataset.filamentId, 10);
                const filament = filaments.find(f => f.id === fid);
                if (filament) {
                    input.value = `${filament.colorName || filament.color} (${filament.materialType || filament.material})`;
                    input.dataset.selectedId = fid;
                    resultsDiv.style.display = 'none';
                }
            };
        });
        resultsDiv.style.display = 'block';
    };
    
    input.onfocus = input.oninput = () => { input.dataset.selectedId = ''; updateResults(); };
    input.onblur = () => { if (!selecting) setTimeout(() => resultsDiv.style.display = 'none', 200); };
    
    return div;
}

function addFilamentRequirement() {
    document.getElementById('requiredFilamentsContainer').appendChild(createFilamentSearchBox());
}

function removeFilamentRequirement(btn) {
    const container = btn.closest('#requiredFilamentsContainer, #editRequiredFilamentsContainer');
    if (container.children.length <= 1) return alert('Model must have at least one filament');
    btn.closest('.filament-req-item').remove();
}

function addEditFilamentRequirement() {
    document.getElementById('editRequiredFilamentsContainer').appendChild(createFilamentSearchBox(null, true));
}

function removeEditFilamentRequirement(btn) { 
    removeFilamentRequirement(btn); 
}

// Model Functions
function addModel() {
    // Enhanced model validation and creation
    const name = document.getElementById('modelName').value.trim();
    const link = document.getElementById('modelLink').value.trim();
    const category = document.getElementById('modelCategory').value;
    const difficulty = document.getElementById('modelDifficulty').value;
    const printTime = parseFloat(document.getElementById('modelPrintTime').value) || null;
    const layerHeight = parseFloat(document.getElementById('modelLayerHeight').value) || null;
    const infill = parseInt(document.getElementById('modelInfill').value) || null;
    const supportsRequired = document.getElementById('modelSupports').value === 'true';
    const notes = document.getElementById('modelNotes').value.trim();

    // Validation for enhanced fields
    if (!name) {
        alert('Model name is required');
        return;
    }

    if (!category) {
        alert('Please select a category');
        return;
    }

    if (!difficulty) {
        alert('Please select a difficulty level');
        return;
    }

    // Validate print time if provided
    if (printTime !== null && (printTime < 0 || printTime > 1440)) {
        alert('Print time must be between 0 and 1440 minutes (24 hours)');
        return;
    }

    // Validate layer height if provided
    if (layerHeight !== null && (layerHeight < 0.05 || layerHeight > 1.0)) {
        alert('Layer height must be between 0.05mm and 1.0mm');
        return;
    }

    // Validate infill if provided
    if (infill !== null && (infill < 0 || infill > 100)) {
        alert('Infill must be between 0% and 100%');
        return;
    }

    // Get filament requirements with enhanced usage data
    const requirements = [];
    let hasValidationError = false;
    document.querySelectorAll('#requiredFilamentsContainer .filament-req-item').forEach(item => {
        const searchInput = item.querySelector('.req-search');
        const expectedWeightInput = item.querySelector('.expected-weight');
        const toleranceInput = item.querySelector('.tolerance');
        const requiredCountInput = item.querySelector('.required-count');

        const id = parseInt(searchInput.dataset.selectedId, 10);
        if (!isNaN(id) && id > 0) {
            const f = filaments.find(x => x.id === id);
            if (f) {
                // Validate expected weight is provided
                const expectedWeight = parseFloat(expectedWeightInput.value);
                if (isNaN(expectedWeight) || expectedWeight <= 0) {
                    alert('Please provide a valid expected weight for each filament');
                    hasValidationError = true;
                    return;
                }

                // Validate tolerance if provided
                const tolerance = parseFloat(toleranceInput.value);
                if (toleranceInput.value && !isNaN(tolerance) && (tolerance < 0 || tolerance > 100)) {
                    alert(`Tolerance for ${f.colorName || f.color} must be between 0% and 100%`);
                    hasValidationError = true;
                    return;
                }

                // Validate required count if provided
                const requiredCount = parseInt(requiredCountInput.value);
                if (requiredCountInput.value && (isNaN(requiredCount) || requiredCount < 1 || requiredCount > 100)) {
                    alert(`Quantity for ${f.colorName || f.color} must be between 1 and 100`);
                    hasValidationError = true;
                    return;
                }

                requirements.push({
                    filamentId: id,
                    brand: f.brand,
                    material: f.materialType || f.material,
                    color: f.colorName || f.color,
                    expectedWeight: expectedWeight,
                    tolerance: !isNaN(tolerance) ? tolerance : 10, // Default 10% tolerance
                    requiredCount: !isNaN(requiredCount) ? requiredCount : 1
                });
            }
        }
    });

    if (hasValidationError) {
        return;
    }

    if (requirements.length === 0) {
        alert('Please select at least one filament from the dropdown');
        return;
    }

    // Create enhanced model object
    const newModel = {
        id: Date.now(),
        name,
        requirements,
        link,
        category,
        difficulty,
        printTime,
        layerHeight,
        infill,
        supportsRequired,
        notes,
        addedDate: new Date().toISOString().split('T')[0],
        tags: extractTagsFromNotes(notes)
    };

    models.push(newModel);

    // Clear form
    document.getElementById('modelName').value = '';
    document.getElementById('modelLink').value = '';
    document.getElementById('modelCategory').value = '';
    document.getElementById('modelDifficulty').value = '';
    document.getElementById('modelPrintTime').value = '';
    document.getElementById('modelLayerHeight').value = '';
    document.getElementById('modelInfill').value = '';
    document.getElementById('modelSupports').value = 'false';
    document.getElementById('modelNotes').value = '';
    document.getElementById('requiredFilamentsContainer').innerHTML = '';
    addFilamentRequirement();

    saveData();
    updateAllTables();

    // Show success message
    showSuccessMessage(`Model "${name}" added successfully!`);
}

// Helper function to extract tags from notes (simple implementation)
function extractTagsFromNotes(notes) {
    if (!notes) return [];

    // Look for hashtags in notes
    const tags = notes.match(/#\w+/g) || [];
    return tags.map(tag => tag.substring(1)); // Remove # symbol
}

function editModel(id) {
    const m = models.find(x => x.id === id);
    if (!m) return;

    editingModelId = id;
    document.getElementById('editModelName').value = m.name;
    document.getElementById('editModelLink').value = m.link || '';
    document.getElementById('editModelCategory').value = m.category || '';
    document.getElementById('editModelDifficulty').value = m.difficulty || '';
    document.getElementById('editModelPrintTime').value = m.printTime || '';
    document.getElementById('editModelLayerHeight').value = m.layerHeight || '';
    document.getElementById('editModelInfill').value = m.infill || '';
    document.getElementById('editModelSupports').value = m.supportsRequired ? 'true' : 'false';
    document.getElementById('editModelNotes').value = m.notes || '';

    const container = document.getElementById('editRequiredFilamentsContainer');
    container.innerHTML = '';
    (m.requirements || []).forEach(req => {
        container.appendChild(createFilamentSearchBox(req.filamentId, true));
    });

    document.getElementById('editModelModal').style.display = 'block';
}

function closeEditModelModal() {
    document.getElementById('editModelModal').style.display = 'none';
    editingModelId = null;
}

function saveEditModel() {
    const m = models.find(x => x.id === editingModelId);
    if (!m) return;

    m.name = document.getElementById('editModelName').value.trim();
    m.link = document.getElementById('editModelLink').value.trim();
    m.category = document.getElementById('editModelCategory').value;
    m.difficulty = document.getElementById('editModelDifficulty').value;
    m.printTime = parseFloat(document.getElementById('editModelPrintTime').value) || '';
    m.layerHeight = parseFloat(document.getElementById('editModelLayerHeight').value) || '';
    m.infill = parseInt(document.getElementById('editModelInfill').value) || '';
    m.supportsRequired = document.getElementById('editModelSupports').value === 'true';
    m.notes = document.getElementById('editModelNotes').value.trim();
    m.tags = extractTagsFromNotes(m.notes);
    // Get updated requirements with enhanced usage data
    const requirements = [];
    let hasValidationError = false;
    document.querySelectorAll('#editRequiredFilamentsContainer .filament-req-item').forEach(item => {
        const searchInput = item.querySelector('.req-search');
        const expectedWeightInput = item.querySelector('.expected-weight');
        const toleranceInput = item.querySelector('.tolerance');
        const requiredCountInput = item.querySelector('.required-count');

        const id = parseInt(searchInput.dataset.selectedId, 10);
        if (!isNaN(id) && id > 0) {
            const f = filaments.find(x => x.id === id);
            if (f) {
                // Validate expected weight is provided
                const expectedWeight = parseFloat(expectedWeightInput.value);
                if (isNaN(expectedWeight) || expectedWeight <= 0) {
                    alert('Please provide a valid expected weight for each filament');
                    hasValidationError = true;
                    return;
                }

                // Validate tolerance if provided
                const tolerance = parseFloat(toleranceInput.value);
                if (toleranceInput.value && !isNaN(tolerance) && (tolerance < 0 || tolerance > 100)) {
                    alert(`Tolerance for ${f.colorName || f.color} must be between 0% and 100%`);
                    hasValidationError = true;
                    return;
                }

                // Validate required count if provided
                const requiredCount = parseInt(requiredCountInput.value);
                if (requiredCountInput.value && (isNaN(requiredCount) || requiredCount < 1 || requiredCount > 100)) {
                    alert(`Quantity for ${f.colorName || f.color} must be between 1 and 100`);
                    hasValidationError = true;
                    return;
                }

                requirements.push({
                    filamentId: id,
                    brand: f.brand,
                    material: f.materialType || f.material,
                    color: f.colorName || f.color,
                    expectedWeight: expectedWeight,
                    tolerance: !isNaN(tolerance) ? tolerance : 10, // Default 10% tolerance
                    requiredCount: !isNaN(requiredCount) ? requiredCount : 1
                });
            }
        }
    });

    if (hasValidationError) {
        return;
    }

    m.requirements = requirements;

    if (!m.requirements.length) return alert('At least one filament required');

    saveData();
    updateAllTables();
    closeEditModelModal();
}

function deleteModel(id) {
    const model = models.find(m => m.id === id);
    if (!model) return;

    // Check if model has print history
    const modelPrints = prints.filter(p => p.modelId === id);

    let confirmMessage = `Delete model "${model.name}"?`;
    let relationshipWarnings = [];

    if (modelPrints.length > 0) {
        relationshipWarnings.push(`• Has ${modelPrints.length} print record${modelPrints.length !== 1 ? 's' : ''} (${modelPrints.map(p => new Date(p.date).toLocaleDateString()).join(', ')})`);
    }

    // Check if model is the only one using certain filaments
    const uniqueFilaments = [];
    model.requirements?.forEach(req => {
        const otherModels = models.filter(m => m.id !== id && m.requirements?.some(r => r.filamentId === req.filamentId));
        if (otherModels.length === 0) {
            const filament = filaments.find(f => f.id === req.filamentId);
            if (filament) {
                uniqueFilaments.push(`• ${filament.colorName || filament.color} (${filament.materialType || filament.material})`);
            }
        }
    });

    if (uniqueFilaments.length > 0) {
        relationshipWarnings.push(`• Only model using these filaments:\n${uniqueFilaments.join('\n')}`);
    }

    if (relationshipWarnings.length > 0) {
        confirmMessage += '\n\n⚠️ Related data will be preserved:\n' + relationshipWarnings.join('\n') + '\n\nContinue with deletion?';
    }

    if (confirm(confirmMessage)) {
        models = models.filter(m => m.id !== id);

        // Print history is preserved but will show "Model not found" in display
        saveData();
        updateAllTables();

        // Show success message with additional info if there were relationships
        if (relationshipWarnings.length > 0) {
        }
    }
}

/**
 * Determines if a model can be printed based on available filament inventory
 * @param {Object} m - The model to check for printability
 * @returns {Object} Printability status with details and count
 */
function canPrintModel(m) {
    // Early return for models with no filament requirements
    if (!m.requirements || m.requirements.length === 0) {
        return {
            canPrint: false,
            missingRequirements: ['None defined'],
            availableFilaments: [],
            canPrintCount: 0
        };
    }

    const missing = [];              // Required filaments that are missing or out of stock
    const availableFilaments = [];   // Available filaments that meet requirements
    let maxCanPrintCount = Infinity; // Maximum prints possible based最 limited filament

    // Check each filament requirement against available inventory
    m.requirements.forEach(req => {
        const filament = filaments.find(f => f.id === req.filamentId);
        if (!filament || !filament.inStock) {
            // Track missing or out-of-stock filaments with descriptive messages
            missing.push(`${req.color} (${req.material}) - ${filament ? 'Out of Stock' : 'Missing'}`);
            maxCanPrintCount = 0; // Cannot print if any requirement is unavailable
        } else {
            // Store available filament information for reference
            availableFilaments.push({
                filament: filament,
                requirement: req,
                weightPerPrint: req.expectedWeight || 0,
                tolerance: req.tolerance || 10
            });

            // Calculate maximum prints possible for this specific filament
            if (req.expectedWeight && req.expectedWeight > 0) {
                const canPrintCount = Math.floor(filament.weight / req.expectedWeight);
                // Account for quantity required per print (e.g., 2 identical parts)
                const actualCount = Math.floor(canPrintCount / (req.requiredCount || 1));
                // Overall print count limited by most constrained filament
                maxCanPrintCount = Math.min(maxCanPrintCount, actualCount);
            }
        }
    });

    // Handle edge case: if no expected weights defined, assume printable if all in stock
    if (maxCanPrintCount === Infinity) {
        maxCanPrintCount = missing.length === 0 ? 1 : 0;
    }

    return {
        canPrint: missing.length === 0,
        missingRequirements: missing,
        availableFilaments: availableFilaments,
        canPrintCount: Math.max(0, maxCanPrintCount)
    };
}

// Model usage calculation functions

/**
 * Calculates the total expected filament usage for a model
 * @param {Object} model - The model with filament requirements
 * @returns {number} Total expected filament weight in grams
 */
function calculateTotalExpectedUsage(model) {
    // Return zero for models with no filament requirements
    if (!model.requirements || model.requirements.length === 0) {
        return 0;
    }

    // Sum up expected weight for each requirement, accounting for quantity
    return model.requirements.reduce((total, req) => {
        const expectedWeight = req.expectedWeight || 0; // Default to 0 if not specified
        const requiredCount = req.requiredCount || 1;  // Default to 1 item if not specified
        return total + (expectedWeight * requiredCount); // Total weight for this requirement
    }, 0);
}

/**
 * Calculates the estimated material cost for printing a model
 * @param {Object} model - The model with filament requirements and pricing info
 * @returns {number} Total estimated cost in currency units
 */
function calculateModelCost(model) {
    // Return zero for models with no filament requirements
    if (!model.requirements || model.requirements.length === 0) {
        return 0;
    }

    let totalCost = 0;

    // Calculate cost for each filament requirement
    model.requirements.forEach(req => {
        const filament = filaments.find(f => f.id === req.filamentId);
        if (filament && filament.purchasePrice) {
            // Convert price per kg to price per gram
            const pricePerGram = filament.purchasePrice / 1000;
            const expectedWeight = req.expectedWeight || 0;
            const requiredCount = req.requiredCount || 1;
            // Add cost: weight × quantity × price per gram
            totalCost += pricePerGram * expectedWeight * requiredCount;
        }
    });

    return totalCost;
}

function getModelUsageStatistics(modelId) {
    const model = models.find(m => m.id === modelId);
    if (!model) {
        return null;
    }

    const modelPrints = prints.filter(p => p.modelId === modelId);
    return {
        totalPrints: modelPrints.length,
        expectedWeight: calculateTotalExpectedUsage(model),
        actualWeightUsed: modelPrints.reduce((total, print) => {
            // Handle both legacy and new print formats
            if (print.filaments && print.filaments.length > 0) {
                return total + print.filaments.reduce((filTotal, fil) => filTotal + (fil.actualWeight || 0), 0);
            } else {
                return total + (print.weight || 0);
            }
        }, 0),
        averageVariance: calculateAverageUsageVariance(modelId),
        lastPrinted: modelPrints.length > 0 ? Math.max(...modelPrints.map(p => new Date(p.date))) : null
    };
}

function calculateAverageUsageVariance(modelId) {
    const model = models.find(m => m.id === modelId);
    if (!model || !model.requirements) {
        return 0;
    }

    const modelPrints = prints.filter(p => p.modelId === modelId);
    if (modelPrints.length === 0) {
        return 0;
    }

    const variances = modelPrints.map(print => {
        let totalExpectedWeight = 0;
        let totalActualWeight = 0;

        model.requirements.forEach(req => {
            totalExpectedWeight += (req.expectedWeight || 0) * (req.requiredCount || 1);
        });

        // Get actual weight from print
        if (print.filaments && print.filaments.length > 0) {
            totalActualWeight = print.filaments.reduce((total, fil) => total + (fil.actualWeight || 0), 0);
        } else {
            totalActualWeight = print.weight || 0;
        }

        if (totalExpectedWeight === 0) return 0;
        return ((totalActualWeight - totalExpectedWeight) / totalExpectedWeight) * 100;
    });

    return variances.reduce((sum, variance, _, arr) => sum + variance / arr.length, 0);
}

function updateModelTable() {
    // Initialize enhanced data grid if not already done
    if (!window.dataGrids) {
        window.dataGrids = {};
    }

    if (!window.dataGrids.modelTable) {
        window.dataGrids.modelTable = new ModelsTable();
    }

    // Set global models data and refresh the grid
    window.models = models;
    window.dataGrids.modelTable.updateData();
}

// Model data migration functions
function migrateModelData() {
    let migrationCount = 0;
    const migrationWarnings = [];

    models.forEach(model => {
        let needsMigration = false;

        // Migrate requirements to enhanced schema
        if (model.requirements) {
            model.requirements.forEach(req => {
                if (!req.expectedWeight) {
                    req.expectedWeight = 20; // Default 20g per print
                    migrationWarnings.push(`Model "${model.name}": Set default expected weight (20g) for ${req.color || 'unknown filament'}`);
                    needsMigration = true;
                }

                if (!req.tolerance) {
                    req.tolerance = 10; // Default 10% tolerance
                    needsMigration = true;
                }

                if (!req.requiredCount) {
                    req.requiredCount = 1; // Default 1 quantity
                    needsMigration = true;
                }
            });
        }

        // Set default values for new enhanced fields
        if (!model.category) {
            model.category = 'Other';
            needsMigration = true;
        }

        if (!model.difficulty) {
            model.difficulty = 'Medium';
            needsMigration = true;
        }

        if (!model.addedDate) {
            model.addedDate = new Date().toISOString().split('T')[0];
            needsMigration = true;
        }

        if (needsMigration) {
            migrationCount++;
        }
    });

    if (migrationCount > 0) {
        saveData();
    }

    return { migratedCount, warnings: migrationWarnings };
}

function validateModelFilamentRelationships() {
    const issues = [];

    models.forEach(model => {
        if (!model.requirements || model.requirements.length === 0) {
            issues.push({
                type: 'missing_requirements',
                modelId: model.id,
                modelName: model.name,
                message: 'Model has no filament requirements defined'
            });
            return;
        }

        model.requirements.forEach(req => {
            const filament = filaments.find(f => f.id === req.filamentId);
            if (!filament) {
                issues.push({
                    type: 'missing_filament',
                    modelId: model.id,
                    modelName: model.name,
                    filamentId: req.filamentId,
                    message: `Required filament (ID: ${req.filamentId}) not found in inventory`
                });
            }
        });
    });

    return issues;
}

// Run migration on data load if needed
if (models.length > 0) {
    migrateModelData();
}

// Print Functions
function addPrint() {
    const modelName = document.getElementById('printModel').value;
    const totalWeight = parseFloat(document.getElementById('printWeight').value);
    const date = document.getElementById('printDate').value;

    if (!modelName || !totalWeight || !date) return alert('Fill model, weight, and date fields');

    // Collect selected filaments
    const printFilaments = [];
    document.querySelectorAll('#printFilamentsContainer .print-filament-item').forEach(item => {
        const selectInput = item.querySelector('.print-filament-select');
        const weightInput = item.querySelector('.print-filament-weight');
        const filamentId = parseInt(selectInput.value);
        const weight = parseFloat(weightInput.value) || 0;

        if (!isNaN(filamentId) && filamentId > 0 && weight > 0) {
            const filament = filaments.find(f => f.id === filamentId);
            if (filament) {
                printFilaments.push({
                    filamentId: filamentId,
                    color: filament.colorName || filament.color,
                    material: filament.materialType || filament.material,
                    weight: weight,
                    colorHex: filament.colorHex
                });
            }
        }
    });

    if (printFilaments.length === 0) return alert('Please select at least one filament and specify weights');

    // Create print record with new multi-filament structure
    const print = {
        id: Date.now(),
        modelName: modelName,
        weight: totalWeight,
        date: date,
        filaments: printFilaments,
        // For backwards compatibility
        color: printFilaments.length === 1 ? printFilaments[0].color : `${printFilaments.length}-color print`
    };

    prints.push(print);

    // Clear form
    document.getElementById('printModel').value = '';
    document.getElementById('printModel').removeAttribute('data-selected-model');
    document.querySelector('.model-search-results').style.display = 'none';
    document.getElementById('printWeight').value = '';
    document.getElementById('printDate').value = '';
    const container = document.getElementById('printFilamentsContainer');
    container.innerHTML = '';
    addPrintFilament(); // Add back one empty filament field

    saveData();
    updateAllTables();
}

function editPrint(id) {
    const p = prints.find(x => x.id === id);
    if (!p) return;
    
    editingPrintId = id;
    document.getElementById('editPrintModel').value = p.modelName;
    document.getElementById('editPrintColor').value = p.color;
    document.getElementById('editPrintWeight').value = p.weight;
    document.getElementById('editPrintDate').value = p.date;
    document.getElementById('editPrintModal').style.display = 'block';
}

function closeEditPrintModal() {
    document.getElementById('editPrintModal').style.display = 'none';
    editingPrintId = null;
}

function saveEditPrint() {
    const p = prints.find(x => x.id === editingPrintId);
    if (!p) return;
    
    p.modelName = document.getElementById('editPrintModel').value.trim();
    p.color = document.getElementById('editPrintColor').value.trim();
    p.weight = parseFloat(document.getElementById('editPrintWeight').value) || 0;
    p.date = document.getElementById('editPrintDate').value;
    
    saveData();
    updateAllTables();
    closeEditPrintModal();
}

function deletePrint(id) {
    if (confirm('Delete print record?')) {
        prints = prints.filter(p => p.id !== id);
        saveData();
        updateAllTables();
    }
}

// Model Search for Print Recording
function setupPrintModelSearch() {
    const searchInput = document.getElementById('printModel');
    const resultsDiv = document.querySelector('.model-search-results');

    if (!searchInput || !resultsDiv) return;

    let selectedIndex = -1;
    let filteredModels = [];
    let selecting = false;

    // Setup search functionality
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        selectedIndex = -1;

        if (query.length < 1) {
            resultsDiv.style.display = 'none';
            searchInput.removeAttribute('data-selected-model');
            clearPrintFilaments();
            return;
        }

        // Filter models based on search query
        filteredModels = models.filter(model => {
            return model.name.toLowerCase().includes(query) ||
                   (model.category && model.category.toLowerCase().includes(query)) ||
                   (model.difficulty && model.difficulty.toLowerCase().includes(query)) ||
                   (model.notes && model.notes.toLowerCase().includes(query));
        });

        // Display results
        displayModelSearchResults(filteredModels, query);
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        const items = resultsDiv.querySelectorAll('.model-search-result-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateModelSelection(items, selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateModelSelection(items, selectedIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && items[selectedIndex]) {
                selectModel(filteredModels[selectedIndex]);
            } else if (filteredModels.length === 1) {
                selectModel(filteredModels[0]);
            }
        } else if (e.key === 'Escape') {
            resultsDiv.style.display = 'none';
        }
    });

    // Click outside to close
    searchInput.addEventListener('blur', () => {
        if (!selecting) setTimeout(() => resultsDiv.style.display = 'none', 200);
    });

    function displayModelSearchResults(modelList, query) {
        if (modelList.length === 0) {
            resultsDiv.innerHTML = '<div class="model-search-result-no-results">No models found</div>';
        } else {
            resultsDiv.innerHTML = modelList.map(model => {
                const details = [];
                if (model.category) details.push(model.category);
                if (model.difficulty) details.push(model.difficulty);
                if (model.requirements && model.requirements.length > 0) {
                    details.push(`${model.requirements.length} filament${model.requirements.length > 1 ? 's' : ''}`);
                }

                return `
                    <div class="model-search-result-item" data-model-id="${model.id}">
                        <div class="model-search-result-name">${highlightSearchMatch(model.name, query)}</div>
                        ${details.length > 0 ? `<div class="model-search-result-details">${details.join(' • ')}</div>` : ''}
                    </div>
                `;
            }).join('');

            // Add click handlers
            resultsDiv.querySelectorAll('.model-search-result-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    selecting = true;
                    selectModel(modelList[index]);
                    setTimeout(() => selecting = false, 100);
                });
            });
        }
        resultsDiv.style.display = 'block';
    }

    function updateModelSelection(items, index) {
        items.forEach((item, i) => {
            if (i === index) {
                item.classList.add('highlight');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('highlight');
            }
        });
    }

    function selectModel(model) {
        searchInput.value = model.name;
        searchInput.setAttribute('data-selected-model', model.id);
        resultsDiv.style.display = 'none';
        populatePrintFilamentsFromModel(model.name);
    }

    function highlightSearchMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
}

function updatePrintSelects() {
    // Setup the model search functionality
    setupPrintModelSearch();
}

function populatePrintFilamentsFromModel(modelName) {
    // Find the selected model
    const model = models.find(m => m.name === modelName);
    if (!model || !model.requirements || model.requirements.length === 0) {
        clearPrintFilaments();
        return;
    }

    // Clear existing filaments
    const container = document.getElementById('printFilamentsContainer');
    container.innerHTML = '';

    // Add filament inputs for each required filament
    model.requirements.forEach((requirement, index) => {
        const filamentItem = createPrintFilamentSearchBox();

        // Set the initial weight (can be edited by user)
        const weightInput = filamentItem.querySelector('.print-filament-weight');
        if (weightInput) {
            weightInput.value = requirement.weight || '';
            weightInput.placeholder = 'Weight Used (g)';
        }

        // Find matching filament and set it if available
        const selectInput = filamentItem.querySelector('.print-filament-select');
        if (selectInput) {
            // Use the stored filamentId to find the exact filament
            if (requirement.filamentId) {
                const matchingFilament = filaments.find(f => f.id === requirement.filamentId);
                if (matchingFilament) {
                    // Immediately set the value since the options are already populated in createPrintFilamentSearchBox
                    selectInput.value = matchingFilament.id;
                } else {
                }
            } else {
            }
        }

        container.appendChild(filamentItem);
    });

    // Update total weight after all filaments are added
    setTimeout(() => {
        updateTotalWeight();
    }, 200);

    // Show success message
    showSuccessMessage(`Populated ${model.requirements.length} required filament${model.requirements.length !== 1 ? 's' : ''} for ${modelName}`);
}

function clearPrintFilaments() {
    const container = document.getElementById('printFilamentsContainer');
    container.innerHTML = '';

    // Add one empty filament item
    addPrintFilament();

    // Reset total weight
    updateTotalWeight();
}

function updatePrintTable() {
    const tbody = document.getElementById('printTableBody');
    if (!prints.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No prints recorded yet</td></tr>';
        return;
    }
    
    const sorted = [...prints].sort((a, b) => b.date.localeCompare(a.date));
    tbody.innerHTML = sorted.map(p => {
        // Handle both legacy (single color) and new (multiple filaments) formats
        let filamentDisplay;
        if (p.filaments && p.filaments.length > 0) {
            // New multi-filament format
            filamentDisplay = p.filaments.map(f => `
                <div class="print-filament">
                    <span class="color-swatch" style="background:${f.colorHex || '#ccc'}; width:12px; height:12px; display:inline-block; border-radius:2px; margin-right:4px; vertical-align:middle;"></span>
                    <span class="filament-info">${f.color} (${f.material}, ${f.weight.toFixed(1)}g)</span>
                </div>
            `).join('');
        } else {
            // Legacy single color format
            const filament = filaments.find(f => f.color === p.color);
            const hex = filament ? filament.colorHex : '#ccc';
            filamentDisplay = `
                <div class="print-filament">
                    <span class="color-swatch" style="background:${hex}; width:12px; height:12px; display:inline-block; border-radius:2px; margin-right:4px; vertical-align:middle;"></span>
                    <span class="filament-info">${p.color}</span>
                </div>
            `;
        }

        return `
            <tr>
                <td>${p.date}</td>
                <td>${p.modelName}</td>
                <td>${filamentDisplay}</td>
                <td>${p.weight.toFixed(1)}</td>
                <td>
                    <button class="edit-btn" onclick="editPrint(${p.id})">Edit</button>
                    <button class="delete-btn" onclick="deletePrint(${p.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Statistics Functions
function updateUsageStats() {
    const el = document.getElementById('usageStats');
    if (!prints.length) {
        el.innerHTML = '<div class="empty-state">No prints recorded yet</div>';
        return;
    }
    
    const byColor = {};
    prints.forEach(p => byColor[p.color] = (byColor[p.color] || 0) + p.weight);
    
    const byModel = {};
    prints.forEach(p => byModel[p.modelName] = (byModel[p.modelName] || 0) + p.weight);
    
    const total = prints.reduce((s, p) => s + p.weight, 0);
    
    el.innerHTML = `
        <div class="stats-grid">
            <div class="stats-card">
                <h3>By Color</h3>
                <table>
                    ${Object.entries(byColor).sort((a,b)=>b[1]-a[1])
                        .map(([c,w])=>`<tr><td>${c}</td><td>${w.toFixed(1)}g</td><td>${(w/total*100).toFixed(1)}%</td></tr>`)
                        .join('')}
                </table>
            </div>
            <div class="stats-card">
                <h3>By Model</h3>
                <table>
                    ${Object.entries(byModel).sort((a,b)=>b[1]-a[1])
                        .map(([m,w])=>{
                            const cnt=prints.filter(p=>p.modelName===m).length;
                            return`<tr><td>${m}</td><td>${w.toFixed(1)}g</td><td>${cnt} print${cnt>1?'s':''}</td></tr>`;
                        }).join('')}
                </table>
            </div>
        </div>
        <div class="total-banner">Total used: ${total.toFixed(1)}g over ${prints.length} prints</div>
    `;
}

function updatePrintableModels() {
    const el = document.getElementById('printableModels');
    const ok = models.filter(m => canPrintModel(m).canPrint);
    
    if (!ok.length) {
        el.innerHTML = '<div class="empty-state">No printable models right now</div>';
        return;
    }
    
    el.innerHTML = `
        <table>
            <thead><tr><th>Model</th><th>Filaments</th><th>Link</th></tr></thead>
            <tbody>
                ${ok.map(m=>{
                    const reqs = (m.requirements||[]).map(r=>
                        `<span class="badge badge-success">${r.color} (${r.material})</span>`
                    ).join('');
                    const link = m.link ? `<a href="${m.link}" target="_blank" style="color:#667eea">View</a>` : '-';
                    return `<tr><td><strong>${m.name}</strong></td><td>${reqs}</td><td>${link}</td></tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
}

function updateAllTables() {
    updateFilamentTable();
    updateModelTable();
    updatePrintTable();
    updatePrintSelects();
    updateUsageStats();
    updatePrintableModels();
}

// Progressive Enhancement Setup
function setupProgressiveEnhancement() {
    // Feature detection
    const features = {
        localStorage: testLocalStorage(),
        json: testJSONSupport(),
        formValidation: testFormValidation(),
        es6: testES6Support(),
        colorPicker: testColorPicker()
    };

    // Apply fallbacks for missing features
    applyFeatureFallbacks(features);

    // Mark enhancement level in data attribute for CSS targeting
    document.body.setAttribute('data-enhancement-level', calculateEnhancementLevel(features));

    return features;
}

function testLocalStorage() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function testJSONSupport() {
    try {
        JSON.parse('{}');
        JSON.stringify({});
        return true;
    } catch (e) {
        return false;
    }
}

function testFormValidation() {
    const input = document.createElement('input');
    return 'validity' in input && 'setCustomValidity' in input;
}

function testES6Support() {
    try {
        // Test basic ES6 features we use
        new Function('(a = 0) => a');
        new Function('const x = 1; let y = 2');
        return true;
    } catch (e) {
        return false;
    }
}

function testColorPicker() {
    const input = document.createElement('input');
    input.type = 'color';
    return input.type === 'color';
}

function applyFeatureFallbacks(features) {
    // LocalStorage fallback
    if (!features.localStorage) {
        // Implement cookie-based storage fallback
        window.enhancedStorage = {
            setItem: function(key, value) {
                document.cookie = `${key}=${encodeURIComponent(value)}; max-age=31536000; path=/`;
            },
            getItem: function(key) {
                const match = document.cookie.match(`(?:^|; )${key}=([^;]*)`);
                return match ? decodeURIComponent(match[1]) : null;
            },
            removeItem: function(key) {
                document.cookie = `${key}=; max-age=0; path=/`;
            }
        };
    }

    // JSON fallback
    if (!features.json) {
        // Implement basic JSON parsing for simple objects
        window.safeJSON = {
            parse: function(str) {
                try {
                    return eval('(' + str + ')');
                } catch (e) {
                    return null;
                }
            },
            stringify: function(obj) {
                try {
                    return JSON.stringify(obj);
                } catch (e) {
                    // Fallback to string representation
                    return '"' + obj.toString() + '"';
                }
            }
        };
    }

    // Form validation fallback
    if (!features.formValidation) {
        // Our custom validation will handle this
    }

    // Color picker fallback
    if (!features.colorPicker) {
        const colorInputs = document.querySelectorAll('input[type="color"]');
        colorInputs.forEach(input => {
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.value = input.value;
            textInput.placeholder = '#RRGGBB';
            textInput.pattern = '^#[0-9A-Fa-f]{6}$';
            textInput.id = input.id;
            textInput.name = input.name;
            textInput.title = 'Hex color code (e.g., #FF5733)';

            // Copy event listeners and attributes
            Array.from(input.attributes).forEach(attr => {
                if (!['type', 'id', 'name'].includes(attr.name)) {
                    textInput.setAttribute(attr.name, attr.value);
                }
            });

            input.parentNode.replaceChild(textInput, input);
        });
    }

    // ES6 fallback for older browsers
    if (!features.es6) {
        // Basic polyfills for arrow functions and let/const would go here
        // But since we're using a modern codebase, we'll warn the user
        showWarningMessage('Your browser is outdated. Some features may not work correctly. Please upgrade to a modern browser for the best experience.', 10000);
    }
}

function calculateEnhancementLevel(features) {
    let score = 0;
    let max = Object.keys(features).length;

    if (features.localStorage) score++;
    if (features.json) score++;
    if (features.formValidation) score++;
    if (features.es6) score++;
    if (features.colorPicker) score++;

    if (score === max) return 'full';
    if (score >= max * 0.8) return 'high';
    if (score >= max * 0.5) return 'medium';
    return 'basic';
}

function addNoScriptFallbacks() {
    // Create noscript fallback message
    const noScriptMessage = document.createElement('div');
    noScriptMessage.className = 'noscript-warning';
    noScriptMessage.innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 15px; margin: 20px; border: 2px solid #dc3545; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0;">⚠️ JavaScript Required</h3>
            <p style="margin: 0 0 10px 0;">PrintStack requires JavaScript to function properly. Please enable JavaScript in your browser settings and reload the page.</p>
            <p style="margin: 0; font-size: 14px;">Alternatively, you can use a simplified version with <a href="#" onclick="this.closest('.noscript-warning').style.display='none'; document.getElementById('fallback-form').style.display='block'; return false;">basic functionality</a>.</p>
        </div>
        <form id="fallback-form" style="display:none; background: white; padding: 20px; margin: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3>Basic Filament Entry (Limited Functionality)</h3>
            <p>This form allows basic data entry but lacks advanced features like validation, storage, and calculations.</p>
            <div style="margin-bottom: 10px;">
                <label>Material: <input type="text" name="material" required title="Enter filament material type (e.g., PLA, PETG)"></label>
            </div>
            <div style="margin-bottom: 10px;">
                <label>Color: <input type="text" name="color" required title="Enter filament color description"></label>
            </div>
            <div style="margin-bottom: 10px;">
                <label>Weight (g): <input type="number" name="weight" required title="Enter filament weight in grams"></label>
            </div>
            <button type="submit">Add Filament</button>
        </form>
    `;

    // Insert at the top of the main content
    const mainContent = document.querySelector('.main-content .container');
    if (mainContent) {
        mainContent.insertBefore(noScriptMessage, mainContent.firstChild);
    }
}

function setupAccessibilityEnhancements() {
    // Add skip links for keyboard navigation
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #667eea;
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    // Mark main content section
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.id = 'main-content';
    }

    // Add landmark roles
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.setAttribute('role', 'navigation');
        sidebar.setAttribute('aria-label', 'Main navigation');
    }

    const main = document.querySelector('.main-content');
    if (main) {
        main.setAttribute('role', 'main');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Setup progressive enhancements first
    const features = setupProgressiveEnhancement();

    // Load material types from storage
    loadMaterialTypes();

    // Setup accessibility enhancements
    setupAccessibilityEnhancements();

    // Set default print date to today
    const printDateInput = document.getElementById('printDate');
    if (printDateInput) {
        printDateInput.value = new Date().toISOString().split('T')[0];
    }

    // Only setup enhanced features if basic requirements are met
    if (features.localStorage && features.json) {
        // Setup navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                showPage(item.dataset.page);
            });
        });

        // Setup form validation
        const filamentForm = document.getElementById('filamentForm');
        if (filamentForm) {
            filamentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                addFilament();
            });
        }

        // Setup model form submission
        const modelForm = document.getElementById('modelForm');
        if (modelForm) {
            modelForm.addEventListener('submit', (e) => {
                e.preventDefault();
                addModel();
            });
        }

        // Setup real-time validation
        setupRealtimeValidation();

        // Setup filament search
        setupFilamentSearch();

        // Setup import handlers
        const importFile1 = document.getElementById('importFile');
        const importFile2 = document.getElementById('importFile2');
        if (importFile1) importFile1.addEventListener('change', handleImport);
        if (importFile2) importFile2.addEventListener('change', handleImport);

        // Set today's date
        const dateInput = document.getElementById('printDate');
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

        // Load data (using enhanced storage if needed)
        const storage = window.enhancedStorage || localStorage;
        if (storage) {
            loadData();

            // Fix DOM structure: ensure filament content is within its page container
            fixPageStructure();
        }


        // Update material type dropdowns with loaded types
        updateMaterialTypeDropdowns();

        // Update material type management UI
        updateMaterialTypeManagementUI();

        // Add initial filament requirement field
        const container = document.getElementById('requiredFilamentsContainer');
        if (container && container.children.length === 0) {
            addFilamentRequirement();
        }

        // Add initial print filament field
        const printContainer = document.getElementById('printFilamentsContainer');
        if (printContainer && printContainer.children.length === 0) {
            addPrintFilament();
        }
    } else {
        // Show enhanced warning for basic functionality
        showWarningMessage('Limited functionality available due to browser limitations. Some features may not work correctly.', 8000);
    }

    // Modal close on outside click (basic interaction that should work)
    window.onclick = e => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    };

    // NoScript warnings are handled by HTML <noscript> tags - no need for duplicate warnings

    // Initialize collapsible sections
    // "Add New Model" section should be collapsed by default
    const addModelSection = document.getElementById('addModelSection');
    if (addModelSection) {
        addModelSection.style.maxHeight = '0px';
        const toggleIcon = addModelSection.previousElementSibling?.querySelector('.toggle-icon');
        if (toggleIcon) {
            toggleIcon.textContent = '▶';
        }
    }
});// ============================
// Category Management Functions
// ============================

// Initialize categories if not already present
function initializeCategories() {
    if (!modelCategories) {
        modelCategories = [
            'Functional',
            'Decoration',
            'Tools',
            'Art',
            'Toys',
            'Replacement Parts',
            'Prototypes',
            'Other'
        ];
        saveCategories();
    }
}

// Save categories to localStorage
function saveCategories() {
    localStorage.setItem('modelCategories', JSON.stringify(modelCategories));
}

// Load categories from localStorage
function loadCategories() {
    const saved = localStorage.getItem('modelCategories');
    if (saved) {
        modelCategories = JSON.parse(saved);
    } else {
        initializeCategories();
    }
}

// Render category chips in the models section
function renderCategoryChips() {
    const container = document.getElementById('modelCategoryChips');
    if (!container) return;

    // Add "All" option
    let html = '<div class="category-chip" onclick="filterByCategory(null)" data-category="all">All</div>';

    // Add each category with count
    modelCategories.forEach(category => {
        const count = models.filter(model => model.category === category).length;
        html += `
            <div class="category-chip" onclick="filterByCategory('${category}')" data-category="${category}">
                ${category}
                ${count > 0 ? `<span class="category-chip-count">${count}</span>` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

// Filter models by category
function filterByCategory(category) {
    // Update active chip styling
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
    });

    const activeChip = category ?
        document.querySelector(`[data-category="${category}"]`) :
        document.querySelector('[data-category="all"]');
    if (activeChip) activeChip.classList.add('active');

    // Filter the models table
    if (window.dataGrids && window.dataGrids.modelTable) {
        if (category) {
            window.dataGrids.modelTable.visibleData = window.dataGrids.modelTable.originalData.filter(model =>
                model.category === category
            );
        } else {
            window.dataGrids.modelTable.visibleData = [...window.dataGrids.modelTable.originalData];
        }
        window.dataGrids.modelTable.currentPage = 1;
        window.dataGrids.modelTable.renderTable();
        window.dataGrids.modelTable.updatePagination();
    }
}

// Open category management modal
function openCategoryModal() {
    renderCategoryList();
    document.getElementById('categoryManagementModal').style.display = 'block';
}

// Close category management modal
function closeCategoryModal() {
    document.getElementById('categoryManagementModal').style.display = 'none';
    renderCategoryChips(); // Refresh chips in case categories were changed
}

// Render category list in management modal
function renderCategoryList() {
    const container = document.getElementById('categoryList');
    if (!container) return;

    let html = '';
    modelCategories.forEach(category => {
        const count = models.filter(model => model.category === category).length;
        html += `
            <div class="category-item" class="category-item-${category.replace(/\s+/g, '-')}">
                <div class="category-item-info">
                    <span class="category-item-name">${category}</span>
                    <span class="category-item-count">${count} model${count !== 1 ? 's' : ''}</span>
                </div>
                <div class="category-item-actions">
                    <button class="category-edit-btn" onclick="editCategory('${category}')">Edit</button>
                    <button class="category-delete-btn" onclick="deleteCategory('${category}')">Delete</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html || '<p style="text-align: center; color: #6c757d;">No categories found</p>';
}

// Add new category
function addCategory() {
    const input = document.getElementById('newCategoryName');
    const categoryName = input.value.trim();

    if (!categoryName) {
        alert('Please enter a category name');
        return;
    }

    if (modelCategories.includes(categoryName)) {
        alert('Category already exists');
        return;
    }

    if (modelCategories.length >= 20) {
        alert('Maximum 20 categories allowed');
        return;
    }

    modelCategories.push(categoryName);
    modelCategories.sort(); // Sort alphabetically
    saveCategories();
    renderCategoryList();
    renderCategoryChips();
    populateCategoryDropdown();

    input.value = '';
}

// Edit category
function editCategory(oldName) {
    const item = document.querySelector(`.category-item-${oldName.replace(/\s+/g, '-')}`);
    if (!item) return;

    const nameSpan = item.querySelector('.category-item-name');
    const currentName = nameSpan.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'category-edit-input';
    input.title = 'Enter category name';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'category-edit-btn';
    saveBtn.onclick = () => {
        const newName = input.value.trim();
        if (!newName) {
            alert('Category name cannot be empty');
            return;
        }
        if (newName !== oldName && modelCategories.includes(newName)) {
            alert('Category already exists');
            return;
        }

        // Update category in list
        const index = modelCategories.indexOf(oldName);
        if (index !== -1) {
            modelCategories[index] = newName;

            // Update all models with this category
            models.forEach(model => {
                if (model.category === oldName) {
                    model.category = newName;
                }
            });

            modelCategories.sort();
            saveCategories();
            saveData();
            renderCategoryList();
            renderCategoryChips();
            populateCategoryDropdown();
        }
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'category-edit-btn';
    cancelBtn.onclick = () => {
        renderCategoryList();
    };

    const actionsDiv = item.querySelector('.category-item-actions');
    actionsDiv.innerHTML = '';
    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);

    nameSpan.textContent = '';
    nameSpan.appendChild(input);
    input.focus();
    input.select();
}

// Delete category
function deleteCategory(categoryName) {
    const count = models.filter(model => model.category === categoryName).length;
    const message = count > 0 ?
        'Are you sure you want to delete "' + categoryName + '"? This will affect ' + count + ' model' + (count !== 1 ? 's' : '') + '. These models will be set to "Other".' :
        'Are you sure you want to delete "' + categoryName + '"?';

    if (confirm(message)) {
        // Update models with this category to "Other"
        models.forEach(model => {
            if (model.category === categoryName) {
                model.category = 'Other';
            }
        });

        if (!modelCategories.includes('Other')) {
            modelCategories.push('Other');
        }

        // Remove from categories list
        const index = modelCategories.indexOf(categoryName);
        if (index !== -1) {
            modelCategories.splice(index, 1);
        }

        modelCategories.sort();
        saveCategories();
        saveData();
        renderCategoryList();
        renderCategoryChips();
        populateCategoryDropdown();
    }
}

// Event listener for manage categories button
document.addEventListener('DOMContentLoaded', function() {
    const manageBtn = document.getElementById('manageCategoriesBtn');
    if (manageBtn) {
        manageBtn.addEventListener('click', openCategoryModal);
    }

    // Load and initialize categories
    loadCategories();
    populateCategoryDropdown();
    initializeColorEnhancements();
});

// Enhanced Color Input Functionality
function initializeColorEnhancements() {
    const colorInput = document.getElementById('editFilamentColorHex');
    const colorSwatch = document.getElementById('editFilamentColorSwatch');
    const colorPickerBtn = document.getElementById('editFilamentColorPickerBtn');

    if (colorInput && colorSwatch && colorPickerBtn) {
        // Sync color input with swatch
        colorInput.addEventListener('input', function() {
            const hex = this.value.trim();
            if (isValidHexColor(hex)) {
                updateColorSwatch(hex, colorSwatch);
            }
        });

        // Color picker functionality
        colorPickerBtn.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = colorInput.value || '#000000';

            input.addEventListener('change', function() {
                const hex = this.value.toUpperCase();
                colorInput.value = hex;
                updateColorSwatch(hex, colorSwatch);
            });

            input.click();
        });

        // Initialize with current value
        if (colorInput.value) {
            updateColorSwatch(colorInput.value, colorSwatch);
        }
    }
}

function updateColorSwatch(hex, swatchElement) {
    if (!swatchElement) return;

    const upperHex = hex.toUpperCase();
    swatchElement.style.background = upperHex;
    swatchElement.setAttribute('data-hex', upperHex);

    // Adjust text color based on background brightness
    const brightness = getColorBrightness(upperHex);
    const textColor = brightness > 128 ? '#000000' : '#FFFFFF';
    swatchElement.style.color = textColor;
}

function getColorBrightness(hex) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate perceived brightness
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// Populate category dropdowns in both add and edit model forms
function populateCategoryDropdown() {
    const dropdowns = ['modelCategory', 'editModelCategory'];

    dropdowns.forEach(dropdownId => {
        const select = document.getElementById(dropdownId);
        if (!select) return;

        // Clear existing options except the first one
        select.innerHTML = '<option value="">Select Category...</option>';

        // Add categories from modelCategories array
        modelCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    });
}

function isValidHexColor(hex) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}