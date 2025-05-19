// Data Models
let medicines = [];
let healthIssues = [];
let selectedMedicineId = null;
let selectedIssueId = null;
let editingMedicineId = null;
let editingIssueId = null;
let relatedMedicines = [];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if ("Notification" in window && !localStorage.getItem('notificationPermissionRequested')) {
        Notification.requestPermission().then(permission => {
            localStorage.setItem('notificationPermissionRequested', 'true');
        });
    }
    initApp();
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});

// Initialize app
function initApp() {
    loadDataFromStorage();
    initNavigation();
    initFormHandlers();
    initSearch();
    initFilters();
    initThemeToggle();
    setupModalCloseOnOutsideClick();
    refreshAllViews();
    setupNotifications();
}

// Load data from localStorage
function loadDataFromStorage() {
    try {
        medicines = JSON.parse(localStorage.getItem('medicines')) || [];
        healthIssues = JSON.parse(localStorage.getItem('healthIssues')) || [];
    } catch (e) {
        console.error('Failed to load data:', e);
        showToast('Error loading data.', 'error');
    }
}

// Save data to localStorage
function saveDataToStorage() {
    try {
        const compressedMedicines = medicines.map(medicine => ({
            ...medicine,
            photo: medicine.photo ? compressImage(medicine.photo) : null
        }));
        const compressedIssues = healthIssues.map(issue => ({
            ...issue,
            photo: issue.photo ? compressImage(issue.photo) : null
        }));
        localStorage.setItem('medicines', JSON.stringify(compressedMedicines));
        localStorage.setItem('healthIssues', JSON.stringify(compressedIssues));
    } catch (e) {
        console.error('Failed to save data:', e);
        showToast('Error saving data.', 'error');
    }
}

// Compress image (placeholder)
function compressImage(dataUrl) {
    return dataUrl;
}

// Initialize navigation
function initNavigation() {
    document.querySelectorAll('.bottom-nav-item').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.bottom-nav-item').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.section').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.getAttribute('data-target')).classList.add('active');
        });
    });
}

// Initialize form handlers
function initFormHandlers() {
    // Medicine form
    document.getElementById('addMedicineBtn').addEventListener('click', openAddMedicineModal);
    document.getElementById('addMedicineListBtn').addEventListener('click', openAddMedicineModal);
    document.getElementById('medicineForm').addEventListener('submit', e => {
        e.preventDefault();
        saveMedicine();
    });
    document.getElementById('saveMedicineBtn').addEventListener('click', () => {
        document.getElementById('medicineForm').dispatchEvent(new Event('submit'));
    });
    document.getElementById('closeMedicineModal').addEventListener('click', closeAddMedicineModal);
    document.getElementById('cancelMedicineBtn').addEventListener('click', closeAddMedicineModal);
    document.getElementById('medicinePhoto').addEventListener('change', e => handleImageUpload(e, 'medicinePhotoPreview'));

    // When Needed checkbox logic
    document.getElementById('whenNeeded').addEventListener('change', function() {
        const scheduleInputs = document.querySelectorAll('input[name="schedule"]');
        scheduleInputs.forEach(input => {
            input.disabled = this.checked;
            input.parentElement.style.opacity = this.checked ? 0.5 : 1;
        });
        document.getElementById('whenNeededHint').style.display = this.checked ? 'block' : 'none';
    });

    // Health issue form
    document.getElementById('addIssueBtn').addEventListener('click', openAddIssueModal);
    document.getElementById('addIssueListBtn').addEventListener('click', openAddIssueModal);
    document.getElementById('issueForm').addEventListener('submit', e => {
        e.preventDefault();
        saveIssue();
    });
    document.getElementById('saveIssueBtn').addEventListener('click', () => {
        document.getElementById('issueForm').dispatchEvent(new Event('submit'));
    });
    document.getElementById('closeIssueModal').addEventListener('click', closeAddIssueModal);
    document.getElementById('cancelIssueBtn').addEventListener('click', closeAddIssueModal);
    document.getElementById('issuePhoto').addEventListener('change', e => handleImageUpload(e, 'issuePhotoPreview'));
    document.getElementById('isCompleted').addEventListener('change', toggleCompletionNoteField);

    // View Medicine Modal
    document.getElementById('closeViewMedicineModal').addEventListener('click', closeViewMedicineModal);
    document.getElementById('closeViewMedicineBtn').addEventListener('click', closeViewMedicineModal);
    document.getElementById('deleteMedicineBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this medicine?')) deleteMedicine(selectedMedicineId);
    });
    document.getElementById('editMedicineBtn').addEventListener('click', () => editMedicine(selectedMedicineId));

    // View Issue Modal
    document.getElementById('closeViewIssueModal').addEventListener('click', closeViewIssueModal);
    document.getElementById('closeViewIssueBtn').addEventListener('click', closeViewIssueModal);
    document.getElementById('deleteIssueBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this health issue?')) deleteIssue(selectedIssueId);
    });
    document.getElementById('editIssueBtn').addEventListener('click', () => editIssue(selectedIssueId));
    document.getElementById('toggleCompletionBtn').addEventListener('click', () => {
        const issue = healthIssues.find(s => s.id === selectedIssueId);
        if (issue) {
            if (issue.isCompleted) {
                issue.isCompleted = false;
                issue.completionNote = "";
                issue.endDate = "";
                saveDataToStorage();
                refreshAllViews();
                closeViewIssueModal();
                showToast('Issue marked as active', 'success');
            } else {
                openCompleteIssueModal(selectedIssueId);
            }
        }
    });

    // Complete Issue Modal
    document.getElementById('closeCompleteIssueModal').addEventListener('click', closeCompleteIssueModal);
    document.getElementById('cancelCompletionBtn').addEventListener('click', closeCompleteIssueModal);
    document.getElementById('confirmCompletionBtn').addEventListener('click', () => completeIssue(selectedIssueId));

    // Related Medicines
    document.getElementById('relatedMedicinesSelect').addEventListener('change', function() {
        const medicineId = this.value;
        if (medicineId && !relatedMedicines.includes(medicineId)) {
            relatedMedicines.push(medicineId);
            updateRelatedMedicinePills();
            this.value = '';
        }
    });
}

// Initialize search
function initSearch() {
    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };

    document.getElementById('medicineSearch').addEventListener('input', debounce(() => {
        filterMedicines(document.getElementById('medicineSearch').value.toLowerCase());
    }, 300));

    document.getElementById('issueSearch').addEventListener('input', debounce(() => {
        filterIssues(document.getElementById('issueSearch').value.toLowerCase());
    }, 300));
}

// Initialize filters
function initFilters() {
    document.querySelectorAll('#filterOptions .filter-btn').forEach(pill => {
        pill.addEventListener('click', function() {
            document.querySelectorAll('#filterOptions .filter-btn').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            filterMedicinesBySchedule(this.getAttribute('data-filter'));
        });
    });

    document.querySelectorAll('#issueFilterOptions .filter-btn').forEach(pill => {
        pill.addEventListener('click', function() {
            document.querySelectorAll('#issueFilterOptions .filter-btn').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            filterIssuesByStatus(this.getAttribute('data-filter'));
        });
    });
}

// Initialize theme toggle
function initThemeToggle() {
    document.getElementById('themeToggle').addEventListener('click', () => {
        const body = document.body;
        const isLight = body.getAttribute('data-theme') === 'light';
        body.setAttribute('data-theme', isLight ? 'dark' : 'light');
        document.getElementById('themeToggle').innerHTML = `<i class="fas ${isLight ? 'fa-sun' : 'fa-moon'}"></i> Toggle Theme`;
    });
}

// Modal handlers
function openAddMedicineModal() {
    document.getElementById('medicineForm').reset();
    document.getElementById('medicinePhotoPreview').innerHTML = '<span>No image selected</span>';
    document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('addMedicineModal').classList.add('active');
    editingMedicineId = null;
}

function closeAddMedicineModal() {
    document.getElementById('addMedicineModal').classList.remove('active');
    editingMedicineId = null;
}

function openAddIssueModal() {
    document.getElementById('issueForm').reset();
    document.getElementById('issuePhotoPreview').innerHTML = '<span>No image selected</span>';
    document.getElementById('issueStartDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('addIssueModal').classList.add('active');
    relatedMedicines = [];
    updateRelatedMedicinePills();
    editingIssueId = null;
    loadMedicinesForIssue();
    toggleCompletionNoteField();
}

function closeAddIssueModal() {
    document.getElementById('addIssueModal').classList.remove('active');
}

function openViewMedicineModal(medicineId) {
    selectedMedicineId = medicineId;
    const medicine = medicines.find(m => m.id === medicineId);
    if (!medicine) return;

    document.getElementById('viewMedicineTitle').textContent = medicine.name;
    let html = `
        ${medicine.photo ? `<div class="image-preview"><img src="${medicine.photo}" alt="${medicine.name}"></div>` : 
            `<div class="no-image-placeholder">No image</div>`}
        <div class="form-group">
            <label>Dosage Instructions</label>
            <p>${medicine.dosage}</p>
        </div>
        <div class="form-group">
            <label>Schedule</label>
            <p>${medicine.schedule.map(s => `<span class="tag ${s}">${s}</span>`).join(' ')}</p>
        </div>
        <div class="form-group">
            <label>Duration</label>
            <p>${formatDate(medicine.startDate)} to ${formatDate(medicine.endDate)}</p>
        </div>
        ${medicine.whenNeeded ? `
            <div class="form-group">
                <label>Special Instruction</label>
                <p><span class="tag">Take when necessary</span></p>
            </div>` : ''}
        ${medicine.price ? `
            <div class="form-group">
                <label>Price</label>
                <p>$${medicine.price.toFixed(2)}</p>
            </div>` : ''}
    `;
    document.getElementById('viewMedicineBody').innerHTML = html;
    document.getElementById('viewMedicineModal').classList.add('active');
}

function closeViewMedicineModal() {
    document.getElementById('viewMedicineModal').classList.remove('active');
    selectedMedicineId = null;
}

function openViewIssueModal(issueId) {
    selectedIssueId = issueId;
    const issue = healthIssues.find(s => s.id === issueId);
    if (!issue) return;

    document.getElementById('viewIssueTitle').textContent = issue.title;
    let html = `
        ${issue.photo ? `<div class="image-preview"><img src="${issue.photo}" alt="${issue.title}"></div>` : 
            `<div class="no-image-placeholder">No image</div>`}
        <div class="form-group">
            <label>Status</label>
            <p><span class="status-badge ${issue.isCompleted ? 'completed' : 'active'}">
                ${issue.isCompleted ? 'Completed' : 'Active'}</span></p>
        </div>
        <div class="form-group">
            <label>Date</label>
            <p>${formatDate(issue.startDate)}${issue.endDate ? ' to ' + formatDate(issue.endDate) : ''}</p>
        </div>
        <div class="form-group">
            <label>Symptom Description</label>
            <p>${issue.symptoms}</p>
        </div>
        ${issue.medicines.length ? `
            <div class="form-group">
                <label>Related Medicines</label>
                <p>${issue.medicines.map(id => {
                    const m = medicines.find(m => m.id === id);
                    return m ? `<span class="tag">${m.name}</span>` : '';
                }).join(' ')}</p>
            </div>` : ''}
        ${issue.isCompleted && issue.completionNote ? `
            <div class="form-group">
                <label>Completion Note</label>
                <p>${issue.completionNote}</p>
            </div>` : ''}
    `;
    document.getElementById('viewIssueBody').innerHTML = html;
    document.getElementById('viewIssueModal').classList.add('active');
    document.getElementById('toggleCompletionBtn').textContent = issue.isCompleted ? 'Mark as Active' : 'Mark as Completed';
}

function closeViewIssueModal() {
    document.getElementById('viewIssueModal').classList.remove('active');
    selectedIssueId = null;
}

function openCompleteIssueModal(issueId) {
    selectedIssueId = issueId;
    document.getElementById('completeIssueForm').reset();
    document.getElementById('endDateModal').value = new Date().toISOString().split('T')[0];
    document.getElementById('completeIssueModal').classList.add('active');
}

function closeCompleteIssueModal() {
    document.getElementById('completeIssueModal').classList.remove('active');
    selectedIssueId = null;
}

// Image upload handler
function handleImageUpload(event, previewId) {
    const file = event.target.files[0];
    const preview = document.getElementById(previewId);
    if (file) {
        const reader = new FileReader();
        reader.onload = e => preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '<span>No image selected</span>';
    }
}

// Toggle completion note
function toggleCompletionNoteField() {
    document.getElementById('completionNoteGroup').style.display = 
        document.getElementById('isCompleted').checked ? 'block' : 'none';
}

// Save medicine
function saveMedicine() {
    const name = document.getElementById('medicineName').value.trim();
    const dosage = document.getElementById('dosageInstructions').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const photoInput = document.getElementById('medicinePhoto');
    const schedule = Array.from(document.querySelectorAll('input[name="schedule"]:checked')).map(input => input.value);
    const price = document.getElementById('medicinePrice').value;
    const whenNeeded = document.getElementById('whenNeeded').checked;
    const customTimes = {
        morning: document.getElementById('morningTime').value,
        afternoon: document.getElementById('afternoonTime').value,
        night: document.getElementById('nightTime').value
    };

    if (!name || !dosage || !startDate || !endDate || (!schedule.length && !whenNeeded)) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    const medicine = {
        id: editingMedicineId || Date.now().toString(),
        name,
        dosage,
        startDate,
        endDate,
        schedule,
        price: price ? parseFloat(price) : null,
        whenNeeded,
        customTimes
    };

    if (photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            medicine.photo = e.target.result;
            saveMedicineToStorage(medicine);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        saveMedicineToStorage(medicine);
    }
}

function saveMedicineToStorage(medicine) {
    if (editingMedicineId) {
        const index = medicines.findIndex(m => m.id === editingMedicineId);
        if (index !== -1) {
            medicines[index] = medicine;
        }
    } else {
        medicines.push(medicine);
    }
    saveDataToStorage();
    closeAddMedicineModal();
    refreshAllViews();
    showToast(editingMedicineId ? 'Medicine updated' : 'Medicine added', 'success');
}

// Save health issue
function saveIssue() {
    const title = document.getElementById('issueTitle').value.trim();
    const startDate = document.getElementById('issueStartDate').value;
    const endDate = document.getElementById('issueEndDate').value;
    const symptoms = document.getElementById('symptomDescription').value.trim();
    const isCompleted = document.getElementById('isCompleted').checked;
    const completionNote = document.getElementById('completionNote').value.trim();
    const photoInput = document.getElementById('issuePhoto');

    if (!title || !startDate || !symptoms) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    const issue = {
        id: editingIssueId || Date.now().toString(),
        title,
        startDate,
        endDate,
        symptoms,
        medicines: [...relatedMedicines],
        isCompleted,
        completionNote: isCompleted ? completionNote : ''
    };

    if (photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            issue.photo = e.target.result;
            saveIssueToStorage(issue);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else {
        saveIssueToStorage(issue);
    }
}

function saveIssueToStorage(issue) {
    if (editingIssueId) {
        const index = healthIssues.findIndex(s => s.id === editingIssueId);
        if (index !== -1) {
            healthIssues[index] = issue;
        }
    } else {
        healthIssues.push(issue);
    }
    saveDataToStorage();
    closeAddIssueModal();
    refreshAllViews();
    showToast(editingIssueId ? 'Issue updated' : 'Issue added', 'success');
}

// Complete issue
function completeIssue(issueId) {
    const issue = healthIssues.find(s => s.id === issueId);
    if (issue) {
        issue.isCompleted = true;
        issue.completionNote = document.getElementById('completionNoteModal').value.trim();
        issue.endDate = document.getElementById('endDateModal').value;
        saveDataToStorage();
        closeCompleteIssueModal();
        closeViewIssueModal();
        refreshAllViews();
        showToast('Issue marked as completed', 'success');
    }
}

// Delete medicine
function deleteMedicine(medicineId) {
    medicines = medicines.filter(m => m.id !== medicineId);
    healthIssues.forEach(s => {
        s.medicines = s.medicines.filter(id => id !== medicineId);
    });
    saveDataToStorage();
    closeViewMedicineModal();
    refreshAllViews();
    showToast('Medicine deleted', 'success');
}

// Delete issue
function deleteIssue(issueId) {
    healthIssues = healthIssues.filter(s => s.id !== issueId);
    saveDataToStorage();
    closeViewIssueModal();
    refreshAllViews();
    showToast('Issue deleted', 'success');
}

// Edit medicine
function editMedicine(medicineId) {
    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine) {
        editingMedicineId = medicineId;
        openAddMedicineModal();
        document.getElementById('medicineName').value = medicine.name;
        document.getElementById('dosageInstructions').value = medicine.dosage;
        document.getElementById('startDate').value = medicine.startDate;
        document.getElementById('endDate').value = medicine.endDate;
        document.getElementById('medicinePrice').value = medicine.price || '';
        document.getElementById('whenNeeded').checked = medicine.whenNeeded;
        ['morning', 'afternoon', 'night'].forEach(time => {
            document.getElementById(`schedule${time.charAt(0).toUpperCase() + time.slice(1)}`).checked = 
                medicine.schedule.includes(time);
            document.getElementById(`${time}Time`).value = medicine.customTimes?.[time] || '';
        });
        if (medicine.photo) {
            document.getElementById('medicinePhotoPreview').innerHTML = `<img src="${medicine.photo}" alt="Preview">`;
        }
    }
}

// Edit issue
function editIssue(issueId) {
    const issue = healthIssues.find(s => s.id === issueId);
    if (issue) {
        editingIssueId = issueId;
        openAddIssueModal();
        document.getElementById('issueTitle').value = issue.title;
        document.getElementById('issueStartDate').value = issue.startDate;
        document.getElementById('issueEndDate').value = issue.endDate || '';
        document.getElementById('symptomDescription').value = issue.symptoms;
        document.getElementById('isCompleted').checked = issue.isCompleted;
        document.getElementById('completionNote').value = issue.completionNote || '';
        relatedMedicines = [...issue.medicines];
        updateRelatedMedicinePills();
        if (issue.photo) {
            document.getElementById('issuePhotoPreview').innerHTML = `<img src="${issue.photo}" alt="Preview">`;
        }
        toggleCompletionNoteField();
    }
}

// Load medicines for issue
function loadMedicinesForIssue() {
    const select = document.getElementById('relatedMedicinesSelect');
    select.innerHTML = '<option value="">Select a medicine</option>';
    medicines.forEach(medicine => {
        const option = document.createElement('option');
        option.value = medicine.id;
        option.textContent = medicine.name;
        select.appendChild(option);
    });
}

// Update related medicine pills
function updateRelatedMedicinePills() {
    const container = document.getElementById('relatedMedicinePills');
    container.innerHTML = '';
    relatedMedicines.forEach(medicineId => {
        const medicine = medicines.find(m => m.id === medicineId);
        if (medicine) {
            const pill = document.createElement('div');
            pill.className = 'pill';
            pill.innerHTML = `
                ${medicine.name}
                <span class="remove-pill" data-id="${medicineId}">×</span>
            `;
            container.appendChild(pill);
            pill.querySelector('.remove-pill').addEventListener('click', () => {
                relatedMedicines = relatedMedicines.filter(id => id !== medicineId);
                updateRelatedMedicinePills();
            });
        }
    });
}

// Filter medicines
function filterMedicines(searchTerm) {
    const filter = document.querySelector('#filterOptions .filter-btn.active').getAttribute('data-filter');
    const list = document.getElementById('medicinesList');
    list.innerHTML = '';
    let filtered = medicines.filter(m => 
        m.name.toLowerCase().includes(searchTerm) ||
        m.dosage.toLowerCase().includes(searchTerm)
    );
    if (filter !== 'all') {
        filtered = filtered.filter(m => 
            filter === 'when-needed' ? m.whenNeeded : m.schedule.includes(filter)
        );
    }
    document.getElementById('noMedicinesMsg').classList.toggle('hidden', filtered.length > 0);
    filtered.forEach(m => list.appendChild(createMedicineCard(m)));
}

// Filter medicines by schedule
function filterMedicinesBySchedule(filter) {
    filterMedicines(document.getElementById('medicineSearch').value.toLowerCase());
}

// Filter issues
function filterIssues(searchTerm) {
    const filter = document.querySelector('#issueFilterOptions .filter-btn.active').getAttribute('data-filter');
    const list = document.getElementById('issuesList');
    list.innerHTML = '';
    let filtered = healthIssues.filter(s => 
        s.title.toLowerCase().includes(searchTerm) ||
        s.symptoms.toLowerCase().includes(searchTerm)
    );
    if (filter !== 'all') {
        filtered = filtered.filter(s => filter === 'active' ? !s.isCompleted : s.isCompleted);
    }
    document.getElementById('noIssuesMsg').classList.toggle('hidden', filtered.length > 0);
    filtered.forEach(s => list.appendChild(createIssueCard(s)));
}

// Filter issues by status
function filterIssuesByStatus(filter) {
    filterIssues(document.getElementById('issueSearch').value.toLowerCase());
}

// Create medicine card
function createMedicineCard(medicine) {
    if (!medicine) return document.createElement('div');
    const card = document.createElement('div');
    card.className = 'card medicine-card';
    card.innerHTML = `
        <div class="medicine-card-content">
            ${medicine.photo ? 
                `<img src="${medicine.photo}" alt="${medicine.name}" class="medicine-image">` : 
                `<div class="no-image-placeholder">No image</div>`}
            <h3>${medicine.name}</h3>
            <p>${medicine.dosage}</p>
            <p>${formatDate(medicine.startDate)} to ${formatDate(medicine.endDate)}</p>
            <div>
                ${medicine.schedule.map(s => `<span class="tag ${s}">${s}</span>`).join(' ')}
                ${medicine.whenNeeded ? '<span class="tag">When Needed</span>' : ''}
            </div>
            ${medicine.price ? `<p>Price: $${medicine.price.toFixed(2)}</p>` : ''}
        </div>
        <div class="medicine-actions">
            <button class="btn btn-sm btn-primary" onclick="openViewMedicineModal('${medicine.id}')">View</button>
        </div>
    `;
    return card;
}

// Create issue card
function createIssueCard(issue) {
    if (!issue) return document.createElement('div');
    const card = document.createElement('div');
    card.className = 'card section-card';
    card.innerHTML = `
        <div class="section-card-content">
            ${issue.photo ? 
                `<img src="${issue.photo}" alt="${issue.title}" class="section-image">` : 
                `<div class="no-image-placeholder">No image</div>`}
            <h3>${issue.title}</h3>
            <p>${issue.symptoms.substring(0, 100)}${issue.symptoms.length > 100 ? '...' : ''}</p>
            <p><span class="status-badge ${issue.isCompleted ? 'completed' : 'active'}">
                ${issue.isCompleted ? 'Completed' : 'Active'}</span></p>
            <p>Date: ${formatDate(issue.startDate)}${issue.endDate ? ' to ' + formatDate(issue.endDate) : ''}</p>
        </div>
        <div class="section-actions">
            <button class="btn btn-sm btn-primary" onclick="openViewIssueModal('${issue.id}')">View</button>
        </div>
    `;
    return card;
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Refresh all views
function refreshAllViews() {
    updateDashboard();
    filterMedicines(document.getElementById('medicineSearch').value.toLowerCase());
    filterIssues(document.getElementById('issueSearch').value.toLowerCase());
    updateTimeline();
    updateCounts();
}

// Update dashboard
function updateDashboard() {
    const activeIssuesList = document.getElementById('activeIssuesList');
    const todaysMedicinesList = document.getElementById('todaysMedicinesList');
    activeIssuesList.innerHTML = '';
    todaysMedicinesList.innerHTML = '';

    const activeIssues = healthIssues.filter(s => !s.isCompleted);
    const today = new Date();
    const todaysMedicines = medicines.filter(m => {
        const start = new Date(m.startDate);
        const end = new Date(m.endDate);
        return !m.whenNeeded && start <= today && today <= end;
    });

    document.getElementById('noActiveIssuesMsg').classList.toggle('hidden', activeIssues.length > 0);
    document.getElementById('noMedicinesTodayMsg').classList.toggle('hidden', todaysMedicines.length > 0);

    activeIssues.forEach(issue => {
        activeIssuesList.appendChild(createIssueCard(issue));
    });

    todaysMedicines.forEach(medicine => {
        todaysMedicinesList.appendChild(createMedicineCard(medicine));
    });
}

// Update timeline
function updateTimeline() {
    const timeline = document.getElementById('healthTimeline');
    timeline.innerHTML = '';
    const items = [];

    healthIssues.forEach(issue => {
        items.push({
            date: issue.startDate,
            content: `<strong>${issue.title}</strong><p>Health issue started: ${issue.symptoms.substring(0, 50)}${issue.symptoms.length > 50 ? '...' : ''}</p>`
        });
        if (issue.endDate && issue.isCompleted) {
            items.push({
                date: issue.endDate,
                content: `<strong>${issue.title}</strong><p>Health issue completed: ${issue.completionNote || 'Resolved'}</p>`
            });
        }
    });

    medicines.forEach(medicine => {
        items.push({
            date: medicine.startDate,
            content: `<strong>${medicine.name}</strong><p>Started medicine: ${medicine.dosage}</p>`
        });
        if (medicine.endDate) {
            items.push({
                date: medicine.endDate,
                content: `<strong>${medicine.name}</strong><p>Ended medicine</p>`
            });
        }
    });

    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    document.getElementById('noTimelineMsg').classList.toggle('hidden', items.length > 0);

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-date">${formatDate(item.date)}</div>
            <div class="timeline-content">${item.content}</div>
        `;
        timeline.appendChild(div);
    });
}

// Update counts
function updateCounts() {
    document.getElementById('activeIssuesCount').textContent = healthIssues.filter(s => !s.isCompleted).length;
    document.getElementById('totalMedicinesCount').textContent = medicines.length;
    document.getElementById('completedIssuesCount').textContent = healthIssues.filter(s => s.isCompleted).length;
}

// Export data
function exportData() {
    const data = {
        medicines,
        healthIssues
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_tracker_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
}

// Import data
function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.medicines) medicines.push(...data.medicines);
            if (data.healthIssues) healthIssues.push(...data.healthIssues);
            saveDataToStorage();
            refreshAllViews();
            showToast('Data imported successfully', 'success');
            fileInput.value = '';
        } catch (err) {
            showToast('Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toastContainer');
    toast.textContent = message;
    toast.className = `toast ${type === 'success' ? 'toast-success' : 'toast-error'} active`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Setup notifications
function setupNotifications() {
    if (!("Notification" in window) || Notification.permission !== 'granted') return;

    const today = new Date();
    medicines.forEach(medicine => {
        if (medicine.whenNeeded) return;
        const start = new Date(medicine.startDate);
        const end = new Date(medicine.endDate);
        if (today < start || today > end) return;

        ['morning', 'afternoon', 'night'].forEach(time => {
            if (medicine.schedule.includes(time) && medicine.customTimes?.[time]) {
                const [hours, minutes] = medicine.customTimes[time].split(':');
                const now = new Date();
                const notificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                if (notificationTime > now) {
                    setTimeout(() => {
                        new Notification(`Time to take ${medicine.name}`, {
                            body: `Dosage: ${medicine.dosage}`,
                            icon: medicine.photo || null
                        });
                    }, notificationTime - now);
                }
            }
        });
    });
}

// Close modals on outside click
function setupModalCloseOnOutsideClick() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.classList.remove('active');
                selectedMedicineId = null;
                selectedIssueId = null;
                editingMedicineId = null;
                editingIssueId = null;
            }
        });
    });
}