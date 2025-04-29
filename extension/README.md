Flashcard Creator Browser Extension
Overview
Flashcard Creator is a lightweight browser extension that allows users to quickly create study flashcards from any webpage.
The goal is to simplify the learning process by enabling users to save important information for later review without switching contexts.

This project focuses on building a fast and intuitive user experience, with planned future integration of backend synchronization and gesture-based review controls.

Planned Features

1.Create a flashcard by selecting text on a webpage
2.Open popup to manually edit and save flashcards
3.Save flashcards locally using browser storage
4.Automatically prefill "Front" field when selecting text
5.Provide optional fields for hints and tags
6.Connect to backend API for flashcard storage (future)
7.Implement hand gesture recognition for review sessions (future)

Project Structure (Planned)

extension/
├── manifest.json # Extension configuration
├── popup.html # Popup UI layout
├── popup.js # Popup behavior logic
├── popup.css # Popup styling
├── background.js # Background script (optional)
├── content.js # Content script to interact with webpage (optional)
├── content.css # Styling for injected elements (optional)
├── .gitignore # Files and folders to ignore in Git
└── README.md # Project documentation
