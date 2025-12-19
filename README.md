# Kibana JSON Formatter Chrome Extension

This Chrome extension automatically detects JSON strings in the `message` field of Kibana logs and provides a formatted, readable view.

## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:molenin-moodys/kibana-chrome.git
   ```

2. Open Google Chrome and navigate to `chrome://extensions`.

3. Enable **Developer mode** in the top right corner.

4. Click **Load unpacked**.

5. Select the `kibana-chrome` directory you just cloned.

## Features

- Detects JSON in Kibana Discover table cells and expanded document views.
- Adds a `[Show Formatted JSON]` toggle next to the raw JSON.
- Configurable summary fields via popup settings.
- Syntax highlights (basic) via CSS.
- Handles dark mode.
