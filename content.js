// Default configuration
const DEFAULT_CONFIG = {
    summaryFields: ['message', 'msg', 'level', 'error'],
    enabled: true
};

// Current configuration
let config = { ...DEFAULT_CONFIG };

// Flag to track initialization
let initialized = false;

// Debug logger
function log(msg) {
    console.log(`[Kibana JSON Formatter] ${msg}`);
}

// Helper to safely create text nodes
function createTextElement(tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
}

function processElement(element) {
    // Avoid re-processing
    if (element.dataset.kibanaJsonFormatterProcessed) return;
    
    const text = element.innerText.trim();
    
    // Quick check if it looks like JSON
    if (!text.startsWith('{') && !text.startsWith('[')) return;
    
    try {
        const jsonObj = JSON.parse(text);
        
        // Mark as processed immediately
        element.dataset.kibanaJsonFormatterProcessed = 'true';
        
        // Store original text
        const originalText = element.innerText; // Keep formatting if any, or just innerText
        
        // Clear the existing raw JSON text
        element.innerHTML = '';
        
        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'kibana-json-formatter-wrapper';
        
        // 1. Raw View (Hidden by default via CSS when enabled)
        const rawView = document.createElement('div');
        rawView.className = 'kibana-json-raw';
        rawView.textContent = originalText;
        wrapper.appendChild(rawView);
        
        // 2. Formatted View (Visible by default via CSS when enabled)
        const formattedView = document.createElement('div');
        formattedView.className = 'kibana-json-formatted';
        
        // Summary Section
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'kibana-json-summary';
        
        let foundSummary = false;
        config.summaryFields.forEach(key => {
            if (jsonObj.hasOwnProperty(key)) {
                foundSummary = true;
                const row = document.createElement('div');
                row.className = 'kibana-json-summary-row';
                
                const keySpan = createTextElement('span', key + ':', 'kibana-json-key');
                const valSpan = createTextElement('span', String(jsonObj[key]), 'kibana-json-value');
                
                row.appendChild(keySpan);
                row.appendChild(valSpan);
                summaryContainer.appendChild(row);
            }
        });

        if (!foundSummary) {
            const row = document.createElement('div');
            row.className = 'kibana-json-summary-row';
            row.appendChild(createTextElement('span', 'JSON Object', 'kibana-json-key'));
            summaryContainer.appendChild(row);
        }
        
        formattedView.appendChild(summaryContainer);

        // Details Section
        const detailsContainer = document.createElement('div');
        detailsContainer.className = 'kibana-json-details';
        
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'kibana-json-toggle';
        toggleBtn.textContent = '▶ Show Full JSON';
        
        const pre = document.createElement('pre');
        pre.className = 'kibana-json-parsed';
        pre.textContent = JSON.stringify(jsonObj, null, 2);
        
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            if (detailsContainer.classList.contains('expanded')) {
                detailsContainer.classList.remove('expanded');
                toggleBtn.textContent = '▶ Show Full JSON';
            } else {
                detailsContainer.classList.add('expanded');
                toggleBtn.textContent = '▼ Hide Full JSON';
            }
        };
        
        detailsContainer.appendChild(toggleBtn);
        detailsContainer.appendChild(pre);
        formattedView.appendChild(detailsContainer);
        
        wrapper.appendChild(formattedView);
        element.appendChild(wrapper);
        
    } catch (e) {
        // Parse error: ignore
    }
}

function scanForJsonFields() {
    // 1. Expanded Document View
    const dtElements = document.querySelectorAll('dt');
    dtElements.forEach(dt => {
        if (dt.innerText.trim() === 'message') {
            const dd = dt.nextElementSibling;
            if (dd && dd.tagName === 'DD') {
                const contentContainer = dd.querySelector('.doc-viewer-value') || dd;
                processElement(contentContainer);
            }
        }
    });

    // 2. Discover Table Cells
    const tableCells = document.querySelectorAll('td .kbnDocTableCell__dataField, [data-test-subj="docTableField"]');
    tableCells.forEach(cell => {
        processElement(cell);
    });
    
    // 3. Generic fallback
    const potentialSpans = document.querySelectorAll('span.kbnDocViewer__value');
    potentialSpans.forEach(span => {
        processElement(span);
    });
}

// Observer
const observer = new MutationObserver((mutations) => {
    scanForJsonFields();
});

function init() {
    if (initialized) return;
    initialized = true;
    
    log('Initializing...');
    
    // Inject controls immediately
    injectControls();
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initial scan
    setTimeout(scanForJsonFields, 1000);
    
    // Load config from storage
    try {
        chrome.storage.sync.get(['summaryFields', 'enabled'], (result) => {
            log('Config loaded');
            if (result.summaryFields) config.summaryFields = result.summaryFields;
            if (result.enabled !== undefined) config.enabled = result.enabled;
            
            // Update UI state
            updateGlobalState();
            updateControlsState();
        });
    } catch (e) {
        log('Error loading storage: ' + e);
    }
}

// --- Controls UI ---

function injectControls() {
    if (document.getElementById('kibana-json-formatter-controls')) return;

    const container = document.createElement('div');
    container.id = 'kibana-json-formatter-controls';
    container.className = 'kibana-json-floating-controls';
    
    // Toggle Switch
    const label = document.createElement('label');
    label.className = 'kibana-json-control-label';
    label.title = 'Toggle JSON Formatting';
    
    const switchDiv = document.createElement('div');
    switchDiv.className = 'kibana-json-switch';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = 'kibana-json-formatter-toggle-input';
    input.checked = config.enabled;
    input.onchange = (e) => {
        config.enabled = e.target.checked;
        chrome.storage.sync.set({ enabled: config.enabled });
        updateGlobalState();
    };
    
    const slider = document.createElement('span');
    slider.className = 'kibana-json-slider';
    
    switchDiv.appendChild(input);
    switchDiv.appendChild(slider);
    
    const textLabel = document.createElement('span');
    textLabel.textContent = 'JSON View';
    
    label.appendChild(switchDiv);
    label.appendChild(textLabel);
    
    // Settings Button
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'kibana-json-settings-btn';
    settingsBtn.innerHTML = '⚙️'; // Gear icon
    settingsBtn.title = 'Configure Fields';
    settingsBtn.onclick = showSettingsModal;
    
    container.appendChild(label);
    container.appendChild(settingsBtn);
    
    document.body.appendChild(container);
    log('Controls injected');
}

function updateGlobalState() {
    if (config.enabled) {
        document.body.classList.remove('kibana-json-formatter-disabled');
    } else {
        document.body.classList.add('kibana-json-formatter-disabled');
    }
}

function updateControlsState() {
    const input = document.getElementById('kibana-json-formatter-toggle-input');
    if (input) {
        input.checked = config.enabled;
    }
}

// --- Settings Modal ---

function showSettingsModal() {
    if (document.getElementById('kibana-json-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'kibana-json-modal-overlay';
    overlay.className = 'kibana-json-modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'kibana-json-modal';
    
    const title = document.createElement('h2');
    title.textContent = 'JSON Formatter Settings';
    
    const fieldLabel = document.createElement('label');
    fieldLabel.textContent = 'Summary Fields (comma separated):';
    fieldLabel.style.display = 'block';
    fieldLabel.style.marginBottom = '5px';
    fieldLabel.style.fontWeight = '500';
    
    const textarea = document.createElement('textarea');
    textarea.value = config.summaryFields.join(', ');
    
    const actions = document.createElement('div');
    actions.className = 'kibana-json-modal-actions';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'kibana-json-btn kibana-json-btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'kibana-json-btn kibana-json-btn-primary';
    saveBtn.textContent = 'Save & Reload';
    saveBtn.onclick = () => {
        const rawValue = textarea.value;
        const fields = rawValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
        
        config.summaryFields = fields;
        chrome.storage.sync.set({ summaryFields: fields }, () => {
            document.body.removeChild(overlay);
            location.reload(); 
        });
    };
    
    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    
    modal.appendChild(title);
    modal.appendChild(fieldLabel);
    modal.appendChild(textarea);
    modal.appendChild(actions);
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
