// Load current settings
chrome.storage.sync.get(['summaryFields'], (result) => {
    if (result.summaryFields) {
        document.getElementById('fields').value = result.summaryFields.join(', ');
    } else {
        // Default
        document.getElementById('fields').value = 'message, msg, level, error';
    }
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
    const rawValue = document.getElementById('fields').value;
    const fields = rawValue.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    chrome.storage.sync.set({ summaryFields: fields }, () => {
        // Show status
        const status = document.getElementById('status');
        status.style.display = 'block';
        
        // Notify active tab
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateConfig',
                    summaryFields: fields
                });
            }
        });
        
        setTimeout(() => {
            window.close();
        }, 1000);
    });
});
