# Specification: Enhanced Flashcard Application with Browser Extension and Hand Gestures

## 1. Overview

This project enhances an existing web-based flashcard application (based on PS1). It adds two primary features:

1.  A browser extension allowing users to create flashcards quickly from selected text on webpages.
2.  Hand gesture recognition via webcam to control the flashcard review process (marking cards as Wrong, Hard, or Easy).
    The project emphasizes software engineering best practices: specification, design, testing, and maintainability using TypeScript.

## 2. Functional Requirements

### 2.1. Core Flashcard Application (Based on PS1)

    - Must retain the core functionality of managing decks and flashcards.
    - Must implement a spaced repetition algorithm (similar to PS1) for scheduling reviews.
    - Must provide an interface for reviewing due flashcards.
    - Must load/save flashcard data (initially from local storage, potentially backend later).

### 2.2. Browser Extension: Card Creation

    - The extension must provide a popup interface, accessible via an extension icon.
    - When text is selected on a webpage *before* opening the popup, the selected text should pre-fill the 'Front' field of the flashcard in the popup.
    - The popup must contain:
        - A field displaying/editing the 'Front' text.
        - A text area for the user to input the 'Back' text.
        - A 'Save' button.
        - (Optional) A dropdown or field to select/assign the card to a specific deck. Defaults to a default deck if not specified.
    - Clicking 'Save' stores the new flashcard (Front, Back, initial review state) into browser local storage, accessible by the main application.
    - Must handle cases where no text is selected.

### 2.3. Hand Gesture Control: Card Review

    - During flashcard review in the main application, the user should be able to use hand gestures instead of clicking buttons.
    - The application must request access to the user's webcam.
    - It must use TensorFlow.js Hand Pose Detection (or a similar library) to analyze the webcam feed.
    - The following gestures must be recognized:
        - Thumbs Down: Mark card as "Wrong".
        - Flat Hand (palm facing camera): Mark card as "Hard".
        - Thumbs Up: Mark card as "Easy".
    - Recognition of a valid gesture should trigger the corresponding action in the flashcard review logic (updating card metadata, showing next card).
    - Provide visual feedback to the user:
        - Display the webcam feed (optional, but recommended).
        - Indicate which gesture (or corresponding action) was detected.

## 3. Non-Functional Requirements

### 3.1. Technology Stack

    - Frontend: HTML, CSS, TypeScript
    - Gesture Recognition: TensorFlow.js (Hand Pose Detection model)
    - Storage: Browser Local Storage (initially). (Optional: PostgreSQL backend)
    - Testing: Jest, Vitest, or similar JavaScript/TypeScript testing framework.
    - Version Control: Git

### 3.2. Engineering Process & Quality

    - **Specification First:** Develop clear specifications before implementation.
    - **Test-Driven Development:** Write tests before or alongside implementation.
    - **Safe From Bugs (SFB):**
        - Use clear Abstract Functions (AF) and Representation Invariants (RI) for ADTs.
        - Implement `checkRep()` methods for ADTs.
        - Write comprehensive unit and integration tests.
        - Handle potential errors gracefully (e.g., webcam permission denied, model load failure, storage errors).
    - **Easy to Understand (ETU):**
        - Write clean, well-commented code.
        - Use meaningful variable and function names.
        - Maintain clear documentation (specs, AF/RI).
    - **Ready for Change (RFC):**
        - Design modular components (e.g., separate modules for gesture detection, storage, UI).
        - Aim for loose coupling between components.
    - **Version Control:** Use Git with frequent, small, descriptive commits.
    - **Code Time:** Use the Code Time plugin (optional, for demonstrating effort).

### 3.3. User Experience

    - The browser extension popup should be simple and intuitive.
    - Gesture detection should be reasonably responsive.
    - Clear feedback should be provided during gesture interaction.

## 4. Architecture Outline (Initial)

- **Core Logic (Shared/Adapted from PS1):** TypeScript ADTs for `Flashcard`, `Deck`, `SpacedRepetitionScheduler`. Handles card management and review logic.
- **Main Frontend:** HTML/CSS/TypeScript page for displaying decks, reviewing cards. Integrates Core Logic. Includes the Gesture Control module.
- **Browser Extension:**
  - `manifest.json`: Defines the extension, permissions (activeTab, storage, scripting), popup.
  - `popup.html/css/ts`: UI for creating cards. Interacts with Content Script and Storage.
  - `content_script.js` (Optional/If needed): To inject logic into pages for text selection capture if direct `window.getSelection()` in popup is insufficient.
  - `background.js` (Optional/If needed): For more complex event handling or state management if required.
- **Gesture Control Module (Part of Main Frontend):**
  - Handles webcam access (`getUserMedia`).
  - Loads and runs TensorFlow.js Hand Pose model.
  - Interprets model output to detect specific gestures.
  - Communicates detected gestures to the Core Logic/Review UI.
- **Storage Module:** Abstracted interface for saving/loading cards/decks. Initially implements using `localStorage`.

## 5. Data Handling & Storage

- Flashcards stored as objects/records containing: `id` (unique identifier), `front` (string), `back` (string), `dueDate` (Date/timestamp), `interval` (number), `easeFactor` (number), `deckId` (optional string/id).
- Data initially stored in browser `localStorage` as JSON strings (e.g., one key for all decks/cards, or separate keys). Needs careful key naming to avoid conflicts.
- The extension and the main app must read/write to the same `localStorage` key(s).

## 6. Error Handling

- **Extension:** Handle no text selected, storage write errors.
- **Gesture Control:** Handle webcam permission denial, webcam stream errors, TF.js model loading failure, low-confidence gesture detection.
- **Storage:** Handle `localStorage` quota exceeded, parsing errors for corrupted data.
- Provide user-friendly error messages where appropriate.

## 7. Testing Plan

- **Unit Tests:**
  - Test ADTs (`Flashcard`, `Deck`, `SpacedRepetitionScheduler`) thoroughly, including `checkRep()`.
  - Test individual functions (e.g., gesture interpretation logic, storage module functions).
- **Integration Tests:**
  - Test interaction between extension popup, content script (if any), and storage.
  - Test interaction between Gesture Control module and the flashcard review logic.
  - Test loading/saving cycle with `localStorage`.
- **Manual Tests:**
  - Test the extension flow on various websites.
  - Test gesture recognition accuracy and responsiveness under different lighting conditions/backgrounds.
  - Test the end-to-end user flow.
