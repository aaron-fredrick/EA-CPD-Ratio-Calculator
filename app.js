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

// State
let activeFields = []; // { name: string, isRequired: boolean, hours: number, mins: number }

// DOM
const activeFieldsList = document.getElementById('activeFieldsList');
const availableFieldsDropdown = document.getElementById('availableFieldsDropdown');
const addFieldBtn = document.getElementById('addFieldBtn');
const fieldRowTemplate = document.getElementById('fieldRowTemplate');
const resultRowTemplate = document.getElementById('resultRowTemplate');
const totalDisplay = document.getElementById('totalDisplay');
const resultsList = document.getElementById('resultsList');

function init() {
    COMMON_FIELDS.forEach(f => addFieldToState(f, true));
    DEFAULT_FIELDS.forEach(f => addFieldToState(f, false));
    addFieldBtn.addEventListener('click', onAddFieldClick);
    populateDropdown();
    calculateAndRenderResults();
}

function addFieldToState(fieldName, isRequired) {
    if (!activeFields.some(f => f.name === fieldName)) {
        activeFields.push({ name: fieldName, isRequired: isRequired, hours: 0, mins: 0 });
        renderActiveFields();
        populateDropdown();
        calculateAndRenderResults();
    }
}

function removeField(fieldName) {
    activeFields = activeFields.filter(f => f.name !== fieldName || f.isRequired);
    renderActiveFields();
    populateDropdown();
    calculateAndRenderResults();
}

function updateFieldTime(fieldName, hours, mins) {
    const field = activeFields.find(f => f.name === fieldName);
    if (field) {
        field.hours = parseInt(hours) || 0;
        field.mins = parseInt(mins) || 0;
        calculateAndRenderResults();
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
        const calculated = EA_Calculation(totalMins, r);
        const diff = Math.abs(calculated - actualMins);
        if (diff < minDiff) { minDiff = diff; bestRatio = r; }
    });
    return (actualMins > 0 && bestRatio === 0) ? 25 : bestRatio;
}

function getLabel(snappedPct) { 
    return {0: "N/A (0%)", 25: "Some (25%)", 50: "Half (50%)", 75: "Most (75%)", 100: "All (100%)"}[snappedPct] || "Unknown"; 
}

function calculateAndRenderResults() {
    let rawTotalMins = 0;
    activeFields.forEach(f => rawTotalMins += (f.hours * 60) + f.mins);
    if (rawTotalMins === 0) {
        totalDisplay.textContent = "0h 0m (0 mins)";
        resultsList.innerHTML = '<p class="text-muted" style="text-align:center;">Enter time above to get results.</p>';
        return;
    }
    const totalTimeEA = Math.ceil(rawTotalMins / 15) * 15;
    totalDisplay.textContent = `${Math.floor(totalTimeEA / 60)}h ${totalTimeEA % 60}m (${totalTimeEA} mins)`;
    resultsList.innerHTML = '';
    activeFields.forEach(field => {
        const fieldMins = (field.hours * 60) + field.mins;
        if (fieldMins === 0) return;
        const snappedPct = snapRatio(totalTimeEA, fieldMins);
        const eaClaimMins = EA_Calculation(totalTimeEA, snappedPct);
        const resNode = resultRowTemplate.content.cloneNode(true);
        resNode.querySelector('.res-name').textContent = field.name;
        resNode.querySelector('.res-ratio').textContent = `${getLabel(snappedPct)} → ${Math.floor(eaClaimMins/60)}h ${eaClaimMins%60}m logged`;
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
