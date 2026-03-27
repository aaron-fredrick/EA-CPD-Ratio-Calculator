const COMMON_FIELDS = ["Risk Management", "Business & Management"];
const DEFAULT_FIELDS = ["Mechatronics Engineering"];
const ALL_FIELDS = [
    "Biomedical Engineering", "Chemical Engineering", "Civil Engineering", 
    "Construction Engineering", "Electrical Engineering", "Environmental Engineering",
    "Information, Telecommunications and Electronic Engineering", "Leadership & Management",
    "Mechanical Engineering", "Structural Engineering", "Aerospace Engineering",
    "Building Services Engineering", "Naval Architecture", "Pressure Equipment Design Verification",
    "Fire Safety Engineering", "Amusement Ride and Devices", "Geotechnical Engineering",
    "Systems Engineering", "Oil and Gas Pipeline Engineering", "Heritage and Conservation Engineering",
    "Petroleum Engineering", "Cost Engineering", "Risk Engineering", "Asset Management",
    "Project Management", "Subsea Engineering", "Mechatronics Engineering", "Cyber Engineering"
];

const VERSION = "v0.1.0-test5";

// Analytics Helper
function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
}

// State
let activeFields = []; // { name: string, isRequired: boolean, hours: number, mins: number }

// DOM
const activeFieldsList = document.getElementById('activeFieldsList');
const availableFieldsDropdown = document.getElementById('availableFieldsDropdown');
const addFieldBtn = document.getElementById('addFieldBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const fieldRowTemplate = document.getElementById('fieldRowTemplate');
const resultRowTemplate = document.getElementById('resultRowTemplate');
const totalDisplay = document.getElementById('totalDisplay');
const resultsList = document.getElementById('resultsList');

function init() {
    initTheme();
    loadState();
    
    // If no state, load defaults
    if (activeFields.length === 0) {
        COMMON_FIELDS.forEach(f => addFieldToState(f, true));
        DEFAULT_FIELDS.forEach(f => addFieldToState(f, false));
    }

    addFieldBtn.addEventListener('click', onAddFieldClick);
    themeToggleBtn.addEventListener('click', toggleTheme);
    populateDropdown();
    calculateAndRenderResults();
    
    document.getElementById('versionTag').textContent = VERSION;
}

function initTheme() {
    const savedTheme = localStorage.getItem('cpd-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme(prefersDark ? 'dark' : 'light');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
}

function setTheme(theme) {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    localStorage.setItem('cpd-theme', theme);
    // Update button icon
    themeToggleBtn.textContent = (theme === 'dark') ? '☀️' : '🌙';
    trackEvent('theme_changed', { theme: theme });
}

function saveState() {
    localStorage.setItem('cpd-active-fields', JSON.stringify(activeFields));
}

function loadState() {
    const saved = localStorage.getItem('cpd-active-fields');
    if (saved) {
        try {
            activeFields = JSON.parse(saved);
            renderActiveFields();
        } catch (e) {
            console.error("Failed to load state", e);
        }
    }
}

function addFieldToState(fieldName, isRequired) {
    if (!activeFields.some(f => f.name === fieldName)) {
        activeFields.push({ name: fieldName, isRequired: isRequired, hours: 0, mins: 0 });
        saveState();
        renderActiveFields();
        populateDropdown();
        calculateAndRenderResults();
        trackEvent('field_added', { field_name: fieldName });
    }
}

function removeField(fieldName) {
    activeFields = activeFields.filter(f => f.name !== fieldName || f.isRequired);
    saveState();
    renderActiveFields();
    populateDropdown();
    calculateAndRenderResults();
    trackEvent('field_removed', { field_name: fieldName });
}

function updateFieldTime(fieldName, hours, mins) {
    const field = activeFields.find(f => f.name === fieldName);
    if (field) {
        field.hours = parseInt(hours) || 0;
        field.mins = parseInt(mins) || 0;
        saveState();
        calculateAndRenderResults();
        
        // Debounced analytics for time update
        clearTimeout(field._trackTimeout);
        field._trackTimeout = setTimeout(() => {
            trackEvent('time_updated', { 
                field_name: fieldName, 
                total_mins: (field.hours * 60) + field.mins 
            });
        }, 2000);
    }
}

function EA_Calculation(totalTimeEA, ratioPct) {
    /**
     * EA appears to calculate the internal breakdown by:
     * 1. Multiplying Total Time by ratio and FLOORING to nearest integer mins.
     * 2. ROUNDING that result to the nearest 15-minute block.
     * e.g. 165 * 0.5 = 82.5 -> 82 mins -> rounded to 15m = 75 mins (1h 15m).
     */
    const intermediateMins = Math.floor(totalTimeEA * (ratioPct / 100));
    return Math.round(intermediateMins / 15) * 15;
}

function snapRatio(totalMins, actualMins) {
    const ratios = [0, 25, 50, 75, 100];
    let bestRatio = 0, minDiff = Infinity;
    ratios.forEach(r => {
        if (actualMins > 0 && r === 0) return; // Must give some credit if time was spent
        const calculated = EA_Calculation(totalMins, r);
        const diff = Math.abs(calculated - actualMins);
        if (diff < minDiff || (diff === minDiff && r > bestRatio)) { 
            minDiff = diff; 
            bestRatio = r; 
        }
    });
    return bestRatio;
}

function getLabel(snappedPct) { 
    return {0: "N/A (0%)", 25: "Some (25%)", 50: "Half (50%)", 75: "Most (75%)", 100: "All (100%)"}[snappedPct] || "Unknown"; 
}

function calculateAndRenderResults() {
    let rawTotalMins = 0;
    const targets = [];
    activeFields.forEach(f => {
        const m = (f.hours * 60) + f.mins;
        rawTotalMins += m;
        if (m > 0) targets.push({field: f, target: m});
    });

    if (rawTotalMins === 0) {
        totalDisplay.textContent = "0h 0m (0 mins)";
        resultsList.innerHTML = '<p class="text-muted" style="text-align:center;">Enter time above to get results.</p>';
        return;
    }

    // Brute force the optimal Total Time
    let bestTotal = 15;
    let minError = Infinity;
    let bestTotalDiffFromSum = Infinity;

    for (let t = 15; t <= 6000; t += 15) { // Test up to 100 hours total (Matches CLI)
        let currentError = 0;
        
        targets.forEach(tgt => {
            let r = snapRatio(t, tgt.target);
            let ea = EA_Calculation(t, r);
            currentError += Math.abs(ea - tgt.target);
        });

        let diffFromSum = Math.abs(t - rawTotalMins);
        if (currentError < minError || (currentError === minError && diffFromSum < bestTotalDiffFromSum)) {
            minError = currentError;
            bestTotalDiffFromSum = diffFromSum;
            bestTotal = t;
        }
    }

    totalDisplay.textContent = `${Math.floor(bestTotal / 60)}h ${bestTotal % 60}m (${bestTotal} mins)`;
    resultsList.innerHTML = '';
    
    // Output the optimal results using the bestTotal we found
    targets.forEach(t => {
        const r = snapRatio(bestTotal, t.target);
        const eaClaimMins = EA_Calculation(bestTotal, r);
        const resNode = resultRowTemplate.content.cloneNode(true);
        resNode.querySelector('.res-name').textContent = t.field.name;
        resNode.querySelector('.res-ratio').textContent = `${getLabel(r)} → ${Math.floor(eaClaimMins/60)}h ${eaClaimMins%60}m logged`;
        resultsList.appendChild(resNode);
    });
}

function populateDropdown() {
    availableFieldsDropdown.innerHTML = '<option value="" disabled selected>Select an engineering field to add...</option>';
    ALL_FIELDS.filter(f => !activeFields.some(af => af.name === f) && !COMMON_FIELDS.includes(f))
        .sort().forEach(f => {
            const op = document.createElement('option'); op.value = f; op.textContent = f;
            availableFieldsDropdown.appendChild(op);
        });
}

function renderActiveFields() {
    activeFieldsList.innerHTML = '';
    activeFields.forEach(field => {
        const rowNode = fieldRowTemplate.content.cloneNode(true);
        rowNode.querySelector('.field-name').textContent = field.name;
        const rmElement = rowNode.querySelector('.remove-btn');
        if (field.isRequired) rmElement.style.display = 'none'; 
        else rmElement.addEventListener('click', () => removeField(field.name));

        const hr = rowNode.querySelector('.hr-input'), mn = rowNode.querySelector('.min-input');
        hr.value = field.hours; mn.value = field.mins;
        const update = () => updateFieldTime(field.name, hr.value, mn.value);
        hr.addEventListener('input', update);
        mn.addEventListener('input', update);
        activeFieldsList.appendChild(rowNode);
    });
}

function onAddFieldClick() { if (availableFieldsDropdown.value) addFieldToState(availableFieldsDropdown.value, false); }
document.addEventListener('DOMContentLoaded', init);
