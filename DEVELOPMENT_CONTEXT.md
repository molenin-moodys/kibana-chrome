# Kibana JSON Formatter - Development Context

## Overview
This Chrome extension improves the readability of JSON-formatted logs within the Kibana Discover interface. It automatically detects JSON strings in the `message` field (and potentially others), parses them, and presents a structured view.

**Repository:** `git@github.com:molenin-moodys/kibana-chrome.git`

## Features Implemented
1.  **Automatic Detection**: Scans the DOM for elements containing JSON strings using a `MutationObserver`.
2.  **Dual-View Presentation**:
    *   **Summary View**: Configurable summary using either a list of fields OR a custom template.
    *   **Details View**: A collapsible "Show Full JSON" section containing the pretty-printed JSON.
3.  **In-Page Controls**:
    *   **Floating Panel**: A draggable control panel injected directly into the page (top-right default).
    *   **Draggable**: The panel position is persisted in `chrome.storage.sync` so it stays where the user leaves it.
    *   **Toggle**: Instantly enable/disable the JSON formatting view.
    *   **Settings**: A gear icon opens a modal to configure fields and templates.
4.  **Custom Templating**:
    *   Supports a subset of Painless/Groovy syntax to allow copy-pasting existing scripts.
    *   **Syntax**: `getValue(doc['path'])`, `doc['path']`, `doc['path'].value`, and string concatenation.
    *   **Clean Output**: Missing fields are ignored (no "undefined" or errors).
    *   **Nested Keys**: Supports both true nested JSON (`obj.key`) and flattened dotted keys (`"obj.key": "value"`).

## File Structure
*   `manifest.json`: Extension entry point. Permissions: `storage`, `activeTab`, `scripting`. Version: 1.3.
*   `content.js`: The core logic.
    *   **Injection**: Injects controls into `document.documentElement` to be robust against React/Kibana re-renders. Includes a keep-alive interval (2s) to re-inject if removed.
    *   **Observer**: Watches for DOM changes to process new log rows.
    *   **Template Engine**: `renderTemplate()` parses the custom template string.
    *   **Data Access**: `getByPath()` handles complex key lookup (dotted vs nested).
    *   **Drag & Drop**: `makeDraggable()` handles the UI movement logic.
*   `styles.css`: Styling.
    *   `kibana-json-floating-controls`: The draggable container.
    *   `kibana-json-summary`: The formatted output.
    *   Native font stack (`SFMono-Regular`, etc.) and Dark Mode support.

## Technical Decisions
*   **Controls vs Popup**: We moved from a browser action popup to in-page controls to provide better visibility and persistent access without clicking the toolbar.
*   **Template Parsing**: Instead of `eval` (unsafe), we use a regex-based parser to identify tokens (`doc['...']`, literals) and reconstruct the string. This is safer and supports the specific "Painless" syntax quirks (like `getValue` wrappers) that users might copy from Kibana Scripted Fields.
*   **Data Access Strategy**: The `getByPath` function prioritizes direct property access (e.g., `json["log.level"]`) before trying nested access (`json["log"]["level"]`). This handles the inconsistency in how Elasticsearch flattens fields.
*   **Performance**: Elements are marked with `dataset.kibanaJsonFormatterProcessed` to ensure they are parsed only once.

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
