# Kibana JSON Formatter - Development Context

## Overview
This Chrome extension was developed to improve the readability of JSON-formatted logs within the Kibana Discover interface. It automatically detects JSON strings in the `message` field (and potentially others), parses them, and presents a structured view.

## Features Implemented
1.  **Automatic Detection**: Scans the DOM for elements containing JSON strings, specifically targeting Kibana's data tables and document detail views.
2.  **Dual-View Presentation**:
    *   **Summary View**: key-value pairs of important fields (configurable) are shown inline for quick scanning.
    *   **Details View**: A collapsible "Show Full JSON" section containing the pretty-printed JSON.
3.  **Clean UI**:
    *   Replaces the raw, messy JSON string with the structured view.
    *   Uses Kibana's native monospace font stack (`SFMono-Regular`, `Consolas`, etc.) to blend in seamlessly.
    *   Supports **Dark Mode** automatically via CSS `@media (prefers-color-scheme: dark)`.
4.  **Configuration**:
    *   A popup menu (accessible via the extension icon) allows users to define which fields appear in the Summary View.
    *   Settings are persisted using `chrome.storage.sync`.
    *   Updates trigger a page reload to apply changes immediately.

## File Structure
*   `manifest.json`: Extension entry point. Defines permissions (`storage`, `activeTab`, `scripting`), content scripts, and the popup action.
*   `content.js`: The core logic.
    *   Uses a `MutationObserver` to handle Kibana's dynamic content loading (infinite scroll, expanding rows).
    *   `scanForJsonFields()` targets specific DOM elements (`dt`/`dd` pairs, table cells).
    *   `processElement()` parses the text, clears the innerHTML, and injects the formatted DOM elements.
    *   Listens for configuration updates from the popup.
*   `styles.css`: Styling for the injected elements.
    *   Defines `.kibana-json-summary`, `.kibana-json-parsed`, etc.
    *   Handles font matching and dark mode colors.
*   `popup.html` & `popup.js`: The settings interface.
    *   Provides a textarea for users to input a comma-separated list of fields.
    *   Saves to Chrome storage and sends a message to the active tab to trigger a refresh.

## Technical Decisions
*   **Performance**: `MutationObserver` is used instead of periodic polling to efficiently react to DOM changes. `processElement` marks elements with `dataset.kibanaJsonFormatterProcessed` to avoid infinite loops or re-processing.
*   **Error Handling**: If `JSON.parse` fails, the extension silently ignores the element, leaving the original text intent.
*   **DOM Manipulation**: The extension explicitly clears `element.innerHTML = ''` to remove the original duplicate text before appending the new structure.

## Installation & Usage
1.  Load the `kibana` folder as an Unpacked Extension in Chrome (`chrome://extensions`).
2.  Navigate to a Kibana Discover page.
3.  JSON logs in the `message` field will automatically formatting.
4.  Click the extension icon to add or remove summary fields (e.g., add `requestId` or `user_id`).
