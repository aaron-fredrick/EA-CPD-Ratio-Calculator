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

const VERSION = "v0.1.0-test6";

// Analytics Helper
function trackEvent(eventName, params = {}) {
    if (typeof gtag === 'function') {
        gtag('event', eventName, params);
    }
}

// Global error boundary — reports unhandled JS errors to GA4
window.addEventListener('error', (event) => {
    trackEvent('js_error', { message: event.message, source: event.filename, line: event.lineno });
});
window.addEventListener('unhandledrejection', (event) => {
    trackEvent('js_error', { message: String(event.reason) });
});

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
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const shareBtn = document.getElementById('shareBtn');
const copyTotalBtn = document.getElementById('copyTotalBtn');
const resultsSection = document.getElementById('resultsSection');

let hasStarted = false;
function markStarted() {
    if (!hasStarted) {
        hasStarted = true;
        trackEvent('calculator_start');
    }
}

function init() {
    initTheme();

    let isSharedLoad = false;
    const urlParams = new URLSearchParams(window.location.search);
    const sharedState = urlParams.get('state');

    if (sharedState) {
        try {
            const parsed = JSON.parse(atob(decodeURIComponent(sharedState)));
            if (!isValidStateShape(parsed)) throw new Error('Invalid state shape');
            activeFields = parsed;
            window.history.replaceState({}, document.title, window.location.pathname);
            renderActiveFields();
            isSharedLoad = true;
            trackEvent('calculator_start', { method: 'shared_link' });
        } catch (e) {
            console.error("Failed to parse shared state", e);
            loadState();
        }
    } else {
        loadState();
    }
    
    // If no state, load defaults
    if (activeFields.length === 0) {
        COMMON_FIELDS.forEach(f => addFieldToState(f, true, true));
        DEFAULT_FIELDS.forEach(f => addFieldToState(f, false, true));
    }

    // Remove the loading placeholder once fields are committed to the DOM
    activeFieldsList.classList.remove('fields-loading');

    addFieldBtn.addEventListener('click', onAddFieldClick);
    themeToggleBtn.addEventListener('click', toggleTheme);
    calculateBtn.addEventListener('click', onCalculateClick);
    resetBtn.addEventListener('click', onResetClick);
    shareBtn.addEventListener('click', onShareClick);
    copyTotalBtn.addEventListener('click', onCopyTotalClick);
    populateDropdown();
    
    const hasAnyTime = activeFields.some(f => (f.hours > 0 || f.mins > 0));
    if (isSharedLoad) {
        calculateAndRenderResults();
    } else if (hasAnyTime) {
        showPlaceholderResults("Click Calculate Results to process saved times.");
    } else {
        showPlaceholderResults("Click Calculate Results when ready.");
    }
    
    setTimeout(() => {
        [30, 60, 120, 300].forEach(seconds => {
            setTimeout(() => trackEvent('time_spent', { seconds }), (seconds - 30) * 1000);
        });
    }, 30000);
    
    document.getElementById('versionTag').textContent = VERSION;

    initPrivacyBanner();
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

function showPlaceholderResults(msg) {
    resultsSection.style.display = 'none';
}

function onCalculateClick() {
    calculateAndRenderResults();
}

function isValidStateShape(parsed) {
    return Array.isArray(parsed) &&
        parsed.every(f => typeof f.name === 'string' && typeof f.hours === 'number' && typeof f.mins === 'number');
}

function onResetClick(e) {
    if (e) e.preventDefault();
    trackEvent('reset');
    hasStarted = false;

    // Keep required fields (Risk Management, Business & Management) but zero their times.
    // Re-add any that may have been missing from a corrupted state.
    const preserved = activeFields
        .filter(f => f.isRequired)
        .map(f => ({ ...f, hours: 0, mins: 0 }));

    COMMON_FIELDS.forEach(name => {
        if (!preserved.some(f => f.name === name)) {
            preserved.push({ name, isRequired: true, hours: 0, mins: 0 });
        }
    });

    activeFields = preserved;
    saveState();
    renderActiveFields();
    populateDropdown();
    showPlaceholderResults("Calculator reset. Enter time and click Calculate.");
}

let isSharing = false;
function onShareClick() {
    if (isSharing) return;
    isSharing = true;
    setTimeout(() => isSharing = false, 3000);

    const stateStr = encodeURIComponent(btoa(JSON.stringify(activeFields)));
    const url = window.location.origin + window.location.pathname + '?state=' + stateStr;
    
    navigator.clipboard.writeText(url).then(() => {
        const originalText = shareBtn.textContent;
        shareBtn.textContent = 'Copied Link!';
        setTimeout(() => shareBtn.textContent = originalText, 2000);
        
        trackEvent('share_click', { 
            fields_count: activeFields.length,
            url_length: url.length 
        });
    }).catch(err => {
        console.error("Failed to copy share link", err);
        trackEvent('error', { type: 'clipboard_failure', action: 'share' });
        window.prompt('Copy this link manually:', url);
    });
}

function onCopyTotalClick() {
    const textToCopy = totalDisplay.textContent;
    if (textToCopy.includes("--")) return;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const svg = copyTotalBtn.innerHTML;
        copyTotalBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        setTimeout(() => copyTotalBtn.innerHTML = svg, 1500);
        trackEvent('copy_output', { total_value: textToCopy });
    }).catch(err => {
        console.error("Failed to copy", err);
        trackEvent('error', { type: 'clipboard_failure', action: 'copy_total' });
        window.prompt('Copy this value manually:', textToCopy);
    });
}

function addFieldToState(fieldName, isRequired, isSystemInit = false) {
    if (!activeFields.some(f => f.name === fieldName)) {
        if (!isSystemInit) markStarted();
        activeFields.push({ name: fieldName, isRequired: isRequired, hours: 0, mins: 0 });
        saveState();
        renderActiveFields();
        populateDropdown();
        showPlaceholderResults("Fields updated. Click Calculate Results when ready.");
        if (!isSystemInit) trackEvent('input_change', { field_name: fieldName, action: 'add' });
    }
}

function removeField(fieldName) {
    markStarted();
    activeFields = activeFields.filter(f => f.name !== fieldName || f.isRequired);
    saveState();
    renderActiveFields();
    populateDropdown();
    showPlaceholderResults("Fields updated. Click Calculate Results when ready.");
    trackEvent('input_change', { field_name: fieldName, action: 'remove' });
}

function updateFieldTime(fieldName, hours, mins) {
    const field = activeFields.find(f => f.name === fieldName);
    if (field) {
        markStarted();
        field.hours = parseInt(hours) || 0;
        field.mins = parseInt(mins) || 0;
        saveState();
        showPlaceholderResults("Inputs changed. Click Calculate Results when ready.");
        
        // Debounced analytics for time update
        clearTimeout(field._trackTimeout);
        field._trackTimeout = setTimeout(() => {
            trackEvent('input_change', { 
                field_name: fieldName, 
                total_mins: (field.hours * 60) + field.mins,
                action: 'time_edit'
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
        resultsSection.style.display = 'none';
        trackEvent('error', { type: 'invalid_input', message: 'Calculated with 0 total time' });
        return;
    }

    resultsSection.style.display = 'block';

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
    
    const resultsDataOutput = [];
    const inputParamsOutput = [];

    // Output the optimal results using the bestTotal we found
    targets.forEach(t => {
        const r = snapRatio(bestTotal, t.target);
        const eaClaimMins = EA_Calculation(bestTotal, r);
        const resNode = resultRowTemplate.content.cloneNode(true);
        resNode.querySelector('.res-name').textContent = t.field.name;
        resNode.querySelector('.res-ratio').textContent = `${getLabel(r)} → ${Math.floor(eaClaimMins/60)}h ${eaClaimMins%60}m logged`;
        resultsList.appendChild(resNode);
        
        resultsDataOutput.push({ field: t.field.name, ratio: r, ea_mins: eaClaimMins });
    });
    
    activeFields.forEach(f => {
        inputParamsOutput.push({ field: f.name, mins: (f.hours*60 + f.mins) });
    });

    trackEvent('calculator_complete', {
        calculated_total_mins: bestTotal,
        raw_total_mins: rawTotalMins,
        error_margin: minError,
        inputs: JSON.stringify(inputParamsOutput),
        outputs: JSON.stringify(resultsDataOutput)
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

function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function renderActiveFields() {
    activeFieldsList.innerHTML = '';
    activeFields.forEach(field => {
        const rowNode = fieldRowTemplate.content.cloneNode(true);
        rowNode.querySelector('.field-name').textContent = field.name;

        const rmElement = rowNode.querySelector('.remove-btn');
        rmElement.setAttribute('aria-label', `Remove ${field.name}`);
        if (field.isRequired) rmElement.style.display = 'none';
        else rmElement.addEventListener('click', () => removeField(field.name));

        // Wire unique label–input associations for accessibility (Lighthouse label audit)
        const slug = slugify(field.name);
        const hr_id = `hr-${slug}`;
        const mn_id = `mn-${slug}`;

        const hr = rowNode.querySelector('.hr-input');
        const mn = rowNode.querySelector('.min-input');
        const hrLabel = rowNode.querySelector('.hr-label');
        const mnLabel = rowNode.querySelector('.min-label');

        hr.id = hr_id;
        mn.id = mn_id;
        hrLabel.htmlFor = hr_id;
        mnLabel.htmlFor = mn_id;

        hr.value = field.hours;
        mn.value = field.mins;

        const update = () => updateFieldTime(field.name, hr.value, mn.value);
        hr.addEventListener('input', update);
        mn.addEventListener('input', update);
        activeFieldsList.appendChild(rowNode);
    });
}

function onAddFieldClick() { if (availableFieldsDropdown.value) addFieldToState(availableFieldsDropdown.value, false); }

function initPrivacyBanner() {
    if (localStorage.getItem('cpd-privacy-accepted')) return;

    const banner = document.getElementById('privacyBanner');
    const acceptBtn = document.getElementById('privacyAcceptBtn');
    const detailsBtn = document.getElementById('privacyDetailsBtn');
    const details = document.getElementById('privacyDetails');

    // Delay so the banner doesn't compete with initial content render
    setTimeout(() => {
        banner.classList.add('visible');
        banner.removeAttribute('aria-hidden');
    }, 1500);

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cpd-privacy-accepted', '1');
        banner.classList.remove('visible');
        trackEvent('privacy_consent_accepted');
    });

    detailsBtn.addEventListener('click', () => {
        const isOpen = !details.hidden;
        details.hidden = isOpen;
        detailsBtn.textContent = isOpen ? 'Details ›' : 'Details ‹';
    });
}

// Script is placed at the end of <body>, so the DOM is fully available here.
// Calling init() directly avoids waiting for the DOMContentLoaded event-loop
// tick, narrowing the window between the empty-state first paint and populated
// content — reducing Cumulative Layout Shift (CLS).
init();
