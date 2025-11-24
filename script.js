// Global variables
let filaments = [];
let models = [];
let prints = [];
let editingFilamentId = null;
let editingModelId = null;
let editingPrintId = null;

// Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(pageName + '-page').classList.add('active');
    document.querySelector(`.nav-item[data-page="${pageName}"]`).classList.add('active');
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
        if (f) filaments = JSON.parse(f);
        const m = localStorage.getItem('models');
        if (m) models = JSON.parse(m);
        const p = localStorage.getItem('prints');
        if (p) prints = JSON.parse(p);
        filaments.forEach(f => { if (f.inStock === undefined) f.inStock = true; });
    } catch (e) { console.error(e); }
    ensureFilamentIds();
    updateAllTables();
}

function saveData() {
    localStorage.setItem('filaments', JSON.stringify(filaments));
    localStorage.setItem('models', JSON.stringify(models));
    localStorage.setItem('prints', JSON.stringify(prints));
}

function exportData() {
    const data = { filaments, models, prints, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3d-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            const hasFilaments = Array.isArray(data.filaments) && data.filaments.length > 0;
            const hasModels = Array.isArray(data.models) && data.models.length > 0;
            const hasPrints = Array.isArray(data.prints) && data.prints.length > 0;
            
            if (!hasFilaments && !hasModels && !hasPrints) {
                alert('No data found in file');
                return;
            }
            
            const mode = confirm(
                `File contains:\n${hasFilaments ? '• Filaments\n' : ''}${hasModels ? '• Models\n' : ''}${hasPrints ? '• Prints\n' : ''}\n\nOK = Replace these items\nCancel = Add (keep existing)`
            ) ? 'replace' : 'add';
            
            if (hasFilaments) {
                if (mode === 'replace') filaments = data.filaments;
                else filaments.push(...data.filaments);
                ensureFilamentIds();
            }
            
            if (hasModels) {
                data.models.forEach(m => {
                    if (!m.id) m.id = Date.now() + Math.random();
                    if (m.requirements) {
                        m.requirements.forEach(req => {
                            if (!req.filamentId && req.color && req.material) {
                                req.filamentId = resolveFilamentId(req.color, req.material);
                            }
                        });
                    }
                });
                if (mode === 'replace') models = data.models;
                else data.models.forEach(m => {
                    if (!models.some(x => x.name.toLowerCase() === m.name.toLowerCase())) models.push(m);
                });
            }
            
            if (hasPrints) {
                if (mode === 'replace') prints = data.prints;
                else prints.push(...data.prints);
            }
            
            saveData();
            location.reload();
        } catch (err) {
            alert('Invalid JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Filament Functions
function addFilament() {
    const material = document.getElementById('filamentMaterial').value.trim();
    const color = document.getElementById('filamentColor').value.trim();
    const colorHex = document.getElementById('filamentColorHex').value;
    const weight = parseFloat(document.getElementById('filamentWeight').value) || 0;
    const inStock = document.getElementById('filamentInStock').value === 'true';
    
    if (!material || !color) return alert('Material and color required');
    
    filaments.push({ id: Date.now(), material, color, colorHex, weight, inStock });
    document.getElementById('filamentMaterial').value = '';
    document.getElementById('filamentColor').value = '';
    document.getElementById('filamentWeight').value = '';
    saveData();
    updateAllTables();
}

function editFilament(id) {
    const f = filaments.find(x => x.id === id);
    if (!f) return;
    
    editingFilamentId = id;
    document.getElementById('editFilamentMaterial').value = f.material;
    document.getElementById('editFilamentColor').value = f.color;
    document.getElementById('editFilamentColorHex').value = f.colorHex;
    document.getElementById('editFilamentWeight').value = f.weight;
    document.getElementById('editFilamentInStock').value = f.inStock ? 'true' : 'false';
    document.getElementById('editFilamentModal').style.display = 'block';
}

function closeEditFilamentModal() {
    document.getElementById('editFilamentModal').style.display = 'none';
    editingFilamentId = null;
}

function saveEditFilament() {
    const f = filaments.find(x => x.id === editingFilamentId);
    if (!f) return;
    
    f.material = document.getElementById('editFilamentMaterial').value.trim();
    f.color = document.getElementById('editFilamentColor').value.trim();
    f.colorHex = document.getElementById('editFilamentColorHex').value;
    f.weight = parseFloat(document.getElementById('editFilamentWeight').value) || 0;
    f.inStock = document.getElementById('editFilamentInStock').value === 'true';
    
    saveData();
    updateAllTables();
    closeEditFilamentModal();
}

function deleteFilament(id) {
    if (!confirm('Delete filament?')) return;
    
    filaments = filaments.filter(f => f.id !== id);
    models.forEach(m => { 
        if (m.requirements) m.requirements = m.requirements.filter(r => r.filamentId !== id); 
    });
    saveData();
    updateAllTables();
}

function getFilamentUsage(color) {
    return prints.filter(p => p.color.toLowerCase() === color.toLowerCase())
                 .reduce((s, p) => s + p.weight, 0);
}

function updateFilamentTable() {
    const tbody = document.getElementById('filamentTableBody');
    if (!filaments.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No filaments added yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = filaments.map(f => {
        const used = getFilamentUsage(f.color);
        const rem = f.weight - used;
        return `<tr ${!f.inStock ? 'style="opacity:0.6"' : ''}>
            <td>${f.material}</td>
            <td><span class="color-swatch" style="background:${f.colorHex}"></span>${f.color}</td>
            <td>${f.weight.toFixed(1)}</td>
            <td>${used.toFixed(1)}</td>
            <td style="color:${rem<100?'#dc2626':'#065f46'}">${rem.toFixed(1)}</td>
            <td>${f.inStock ? '<span class="badge badge-success">In Stock</span>' : '<span class="badge badge-error">Out of Stock</span>'}</td>
            <td>
                <button class="edit-btn" onclick="editFilament(${f.id})">Edit</button>
                <button class="delete-btn" onclick="deleteFilament(${f.id})">Delete</button>
            </td>
        </tr>`;
    }).join('');
}
// Filament Search Box for Models
function createFilamentSearchBox(selectedId = null, isEdit = false) {
    const div = document.createElement('div');
    div.className = 'filament-req-item';
    const fil = selectedId ? filaments.find(f => f.id === selectedId) : null;
    const displayText = fil ? `${fil.color} (${fil.material})` : '';
    const removeFn = isEdit ? 'removeEditFilamentRequirement' : 'removeFilamentRequirement';
    
    div.innerHTML = `
        <div class="search-container">
            <input type="text" class="search-input req-search" placeholder="Search filaments..." value="${displayText}" data-selected-id="${selectedId || ''}" autocomplete="off">
            <div class="search-results"></div>
        </div>
        <button type="button" class="delete-btn" onclick="${removeFn}(this)">Remove</button>
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
            (!input.value || `${f.material} ${f.color}`.toLowerCase().includes(input.value.toLowerCase())));
        
        resultsDiv.innerHTML = filtered.length ? filtered.map(f => `
            <div class="search-result-item" data-filament-id="${f.id}">
                <span class="color-swatch" style="background:${f.colorHex || '#ccc'}"></span>
                <span>${f.color} (${f.material})</span>
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
                    input.value = `${filament.color} (${filament.material})`;
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
    const name = document.getElementById('modelName').value.trim();
    const link = document.getElementById('modelLink').value.trim();
    if (!name) return alert('Model name required');
    
    const requirements = [];
    document.querySelectorAll('#requiredFilamentsContainer .req-search').forEach(inp => {
        const id = parseInt(inp.dataset.selectedId, 10);
        if (!isNaN(id) && id > 0) {
            const f = filaments.find(x => x.id === id);
            if (f) requirements.push({ filamentId: id, color: f.color, material: f.material });
        }
    });
    
    if (requirements.length === 0) return alert('Please select at least one filament from the dropdown');
    
    models.push({ id: Date.now(), name, requirements, link });
    document.getElementById('modelName').value = '';
    document.getElementById('modelLink').value = '';
    document.getElementById('requiredFilamentsContainer').innerHTML = '';
    addFilamentRequirement();
    saveData();
    updateAllTables();
}

function editModel(id) {
    const m = models.find(x => x.id === id);
    if (!m) return;
    
    editingModelId = id;
    document.getElementById('editModelName').value = m.name;
    document.getElementById('editModelLink').value = m.link || '';
    
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
    m.requirements = [];
    
    document.querySelectorAll('#editRequiredFilamentsContainer .req-search').forEach(inp => {
        const id = parseInt(inp.dataset.selectedId, 10);
        if (!isNaN(id) && id > 0) {
            const f = filaments.find(x => x.id === id);
            if (f) m.requirements.push({ filamentId: id, color: f.color, material: f.material });
        }
    });
    
    if (!m.requirements.length) return alert('At least one filament required');
    
    saveData();
    updateAllTables();
    closeEditModelModal();
}

function deleteModel(id) {
    if (confirm('Delete model?')) {
        models = models.filter(m => m.id !== id);
        saveData();
        updateAllTables();
    }
}

function canPrintModel(m) {
    if (!m.requirements || m.requirements.length === 0) {
        return { canPrint: false, missingRequirements: ['None defined'] };
    }
    
    const missing = m.requirements
        .filter(r => !filaments.some(f => f.id === r.filamentId && f.inStock))
        .map(r => `${r.color} (${r.material})`);
    
    return { canPrint: missing.length === 0, missingRequirements: missing };
}

function updateModelTable() {
    const tbody = document.getElementById('modelTableBody');
    if (!models.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No models added yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = models.map(m => {
        const { canPrint, missingRequirements } = canPrintModel(m);
        const reqs = (m.requirements || []).map(r => 
            `<span class="badge badge-success">${r.color} (${r.material})</span>`
        ).join('');
        const link = m.link ? `<a href="${m.link}" target="_blank" style="color:#667eea">View</a>` : '-';
        
        return `<tr>
            <td><strong>${m.name}</strong></td>
            <td>${reqs}</td>
            <td>${canPrint ? '<span class="status-can-print">Yes</span>' : 
                '<span class="status-cannot-print">No — ' + missingRequirements.join(', ') + '</span>'}</td>
            <td>${link}</td>
            <td>
                <button class="edit-btn" onclick="editModel(${m.id})">Edit</button>
                <button class="delete-btn" onclick="deleteModel(${m.id})">Delete</button>
            </td>
        </tr>`;
    }).join('');
}

// Print Functions
function addPrint() {
    const modelName = document.getElementById('printModel').value;
    const color = document.getElementById('printColor').value;
    const weight = parseFloat(document.getElementById('printWeight').value);
    const date = document.getElementById('printDate').value;
    
    if (!modelName || !color || !weight || !date) return alert('Fill all fields');
    
    prints.push({ id: Date.now(), modelName, color, weight, date });
    document.getElementById('printWeight').value = '';
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

function updatePrintSelects() {
    const ms = document.getElementById('printModel');
    const cs = document.getElementById('printColor');
    ms.innerHTML = '<option value="">Select Model</option>' + 
        models.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    cs.innerHTML = '<option value="">Select Color</option>' + 
        filaments.filter(f => f.inStock).map(f => `<option value="${f.color}">${f.color} (${f.material})</option>`).join('');
}

function updatePrintTable() {
    const tbody = document.getElementById('printTableBody');
    if (!prints.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No prints recorded yet</td></tr>';
        return;
    }
    
    const sorted = [...prints].sort((a, b) => b.date.localeCompare(a.date));
    tbody.innerHTML = sorted.map(p => `
        <tr>
            <td>${p.date}</td>
            <td>${p.modelName}</td>
            <td>${p.color}</td>
            <td>${p.weight.toFixed(1)}</td>
            <td>
                <button class="edit-btn" onclick="editPrint(${p.id})">Edit</button>
                <button class="delete-btn" onclick="deletePrint(${p.id})">Delete</button>
            </td>
        </tr>`).join('');
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            showPage(item.dataset.page);
        });
    });
    
    // Setup import handlers
    document.getElementById('importFile').addEventListener('change', handleImport);
    document.getElementById('importFile2').addEventListener('change', handleImport);
    
    // Set today's date
    const dateInput = document.getElementById('printDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    
    // Load data
    loadData();
    
    // Add initial filament requirement field
    if (!document.getElementById('requiredFilamentsContainer').children.length) {
        addFilamentRequirement();
    }
    
    // Modal close on outside click
    window.onclick = e => { 
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none'; 
        }
    };
});