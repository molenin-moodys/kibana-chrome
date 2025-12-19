# Kibana JSON Formatter Chrome Extension

This Chrome extension automatically detects JSON strings in the `message` field of Kibana logs and provides a formatted, readable view.

## Installation

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select this `kibana` directory.

## Features

- Detects JSON in Kibana Discover table cells and expanded document views.
- Adds a `[Show Formatted JSON]` toggle next to the raw JSON.
- Syntax highlights (basic) via CSS.
- Handles dark mode.
# kibana-chrome
