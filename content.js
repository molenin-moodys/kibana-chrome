// Default configuration
const DEFAULT_CONFIG = {
    summaryFields: ['message', 'msg', 'level', 'error']
};

// Current configuration
let config = { ...DEFAULT_CONFIG };

// Load config from storage
chrome.storage.sync.get(['summaryFields'], (result) => {
    if (result.summaryFields) {
        config.summaryFields = result.summaryFields;
    }
});

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
        
        // Clear the existing raw JSON text
        element.innerHTML = '';
        
        // 1. Create Summary Section
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

        // Fallback if no summary fields exist
        if (!foundSummary) {
            const row = document.createElement('div');
            row.className = 'kibana-json-summary-row';
            row.appendChild(createTextElement('span', 'JSON Object', 'kibana-json-key'));
            summaryContainer.appendChild(row);
        }
        
        element.appendChild(summaryContainer);

        // 2. Create Details Section
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
        
        // Add Settings Button to the first processed element (or inject a global one somewhere else)
        // For simplicity, we'll append a small settings icon to the details container of every item for now,
        // or we could rely on the browser action (popup). Let's do a popup for better UX.
        
        detailsContainer.appendChild(toggleBtn);
        detailsContainer.appendChild(pre);
        element.appendChild(detailsContainer);
        
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

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Listen for config changes from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateConfig') {
        config.summaryFields = request.summaryFields;
        // Ideally we would re-process everything here, but that requires
        // removing the 'processed' flag and restoring innerHTML which is hard.
        // Simple way: reload page. Better way: just acknowledge and user refreshes.
        sendResponse({status: 'ok'});
        location.reload(); 
    }
});

setTimeout(scanForJsonFields, 1000);
