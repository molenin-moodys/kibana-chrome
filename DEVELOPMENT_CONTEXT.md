# Kibana JSON Formatter - Development Context

## Overview
This Chrome extension improves the readability of JSON-formatted logs within the Kibana Discover interface. It automatically detects JSON strings in the `message` field (and potentially others), parses them, and presents a structured view.

**Repository:** `git@github.com:molenin-moodys/kibana-chrome.git`

## Features Implemented
1.  **Automatic Detection**: Scans the DOM for elements containing JSON strings using a `MutationObserver`.
2.  **Dual-View Presentation**:
    *   **Summary View**: Configurable summary using a custom template with Painless-like syntax.
    *   **Details View**: A collapsible "Show Full JSON" section containing the pretty-printed JSON.
3.  **In-Page Controls**:
    *   **Floating Panel**: A draggable control panel injected directly into the page (top-right default).
    *   **Draggable**: The panel position is persisted in `chrome.storage.sync` so it stays where the user leaves it.
    *   **Toggle**: Instantly enable/disable the JSON formatting view.
    *   **Settings**: A gear icon opens a modal to configure the custom template.
4.  **Custom Templating**:
    *   Supports a Painless-like syntax for flexible log formatting.
    *   **Syntax**: 
        *   `wrap['path']` - If field exists, outputs `[VALUE]`
        *   `doc['path']` - Outputs raw VALUE if field exists
        *   `error['path']` - Outputs VALUE with red error styling if field exists
        *   Supports `\n` for newlines and string concatenation with `+`
    *   **Clean Output**: Missing fields produce empty strings (trimmed from output).
    *   **Complex Path Resolution**: Supports nested structures AND dotted keys at any level (e.g., `labels["Formatted.Memory"]` where the key literally contains a dot).
    *   **Case Insensitivity**: Fallback mechanism to find keys even if case differs (e.g., `formatted` vs `Formatted`).
    *   **Default Template**: 
        ```
        '' +
        wrap['labels.ElapsedTime'] + ' ' +
        wrap['log.level'] + ' ' +
        wrap['metadata.Cpu'] + ' ' +
        wrap['labels.Formatted.Memory'] + ' ' +
        wrap['labels.WorkflowId'] + ' ' +
        wrap['http.request.id'] + '\n' +
        doc['message'] + ' ' +
        wrap['log.logger'] + ' \n' +
        error['error.message'] + ' \n' +
        error['error.stack_trace']
        ```
5.  **Scoped Injection**: Extension only loads on Kibana Discover pages (`https://*/app/discover*`).

## File Structure
*   `manifest.json`: Extension entry point. 
    *   **Permissions**: `storage`, `activeTab`, `scripting`
    *   **Version**: 1.3
    *   **Content Scripts**: Only injects on `https://*/app/discover*` (Kibana Discover pages)
*   `content.js`: The core logic.
    *   **Injection**: Injects controls into `document.documentElement` to be robust against React/Kibana re-renders. Includes a keep-alive interval (2s) to re-inject if removed.
    *   **Observer**: Watches for DOM changes to process new log rows.
    *   **Template Engine**: `renderTemplate()` parses the custom template string, supporting `wrap['...']`, `doc['...']`, and `error['...']` syntax.
    *   **Data Access**: `getByPath()` handles complex key lookup with recursive `tryPath` helper:
        *   Attempts direct property access first (for dotted keys)
        *   Falls back to nested traversal
        *   Includes case-insensitive matching
    *   **Security**: `escapeHtml()` prevents XSS in template output
    *   **Drag & Drop**: `makeDraggable()` handles the UI movement logic with position persistence.
*   `styles.css`: Styling.
    *   `kibana-json-floating-controls`: The draggable container (fixed position, high z-index).
    *   `kibana-json-summary`: The formatted output.
    *   `kibana-json-template-error`: Red styling for error fields.
    *   Native font stack (`SFMono-Regular`, etc.) and Dark Mode support.

## Technical Decisions
*   **Controls vs Popup**: We moved from a browser action popup to in-page controls to provide better visibility and persistent access without clicking the toolbar.
*   **Template Parsing**: Instead of `eval` (unsafe), we use a regex-based parser to identify tokens (`wrap['...']`, `doc['...']`, `error['...']`) and reconstruct the string with appropriate formatting. This is safer and supports a Painless-like syntax.
*   **Data Access Strategy**: The `getByPath` function uses a recursive `tryPath` helper that:
    1. First attempts direct property access at each level (handles dotted keys like `"Formatted.Memory"`)
    2. Falls back to splitting and recursing into nested objects
    3. Includes case-insensitive matching as a final fallback
    This handles the inconsistency in how Elasticsearch flattens fields and supports keys that literally contain dots.
*   **XSS Prevention**: All template output is HTML-escaped using `escapeHtml()` to prevent injection attacks.
*   **Performance**: Elements are marked with `dataset.kibanaJsonFormatterProcessed` to ensure they are parsed only once.
*   **Domain Restriction**: The extension uses manifest `matches` pattern `https://*/app/discover*` to only inject on Kibana Discover pages, avoiding unnecessary processing on other sites.

## Installation & Restore
1.  **Clone**: `git clone git@github.com:molenin-moodys/kibana-chrome.git`
2.  **Chrome**: Go to `chrome://extensions`, enable **Developer Mode**.
3.  **Load**: Click **Load Unpacked** and select this directory.
4.  **Update**: After code changes, click the "Refresh" (circular arrow) on the extension card and refresh the Kibana page.

## Future Context
If you are restoring this session:
*   The project is a Git repo. Ensure you pull the latest changes.
*   The main logic is in `content.js`.
*   The UI is purely DOM-injected (no React/Vue), keeping it lightweight and dependency-free.
*   **Critical**: When modifying `styles.css`, remember to check Dark Mode media queries at the bottom.
*   **Path Resolution**: The `getByPath` function in `content.js` handles complex cases where keys contain dots. It uses a recursive approach with direct property access before nested traversal.
*   **Template Syntax**: Three types supported - `wrap['field']` (bracketed), `doc['field']` (raw), `error['field']` (red styled).
*   **Scope**: Extension only runs on Kibana Discover pages via manifest matches pattern.
