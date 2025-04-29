# Flashcards Extension with Hand Gestures

A browser extension that allows users to create flashcards by highlighting text on webpages and practice them using a spaced repetition system controlled by hand gestures via webcam.

## Table of Contents

*   [Features](#features)
*   [How it Works](#how-it-works)
*   [Technology Stack](#technology-stack)
*   [Getting Started (Installation)](#getting-started-installation)
*   [Development Setup](#development-setup)
*   [Usage](#usage)
*   [Testing](#testing)
*   [Contributing](#contributing)
*   [License](#license)

## Features

*   **Save from Webpages:** Highlight text on any webpage and click the injected "Add to Flashcards" button to quickly save content.
*   **Manual Card Creation:** Add flashcards manually through the extension popup using the toolbar icon.
*   **Spaced Repetition:** Practice saved flashcards using a modified Leitner system (cards are reviewed at intervals based on `2^bucket`).
*   **Gesture Control:** Interact during practice sessions using hand gestures recognized via webcam:
    *   👍 **Thumbs Up:** Mark card as 'Easy' (moves to next bucket).
    *   👎 **Thumbs Down:** Mark card as 'Wrong' (moves to bucket 0).
    *   ✋ **Open Palm:** Mark card as 'Hard' (moves back one bucket).
*   **Hints & Tags:** Add optional hints and tags to flashcards for better organization and recall.
*   **Progress Tracking:** View basic statistics about your learning progress (total cards, cards per bucket, success rate).
*   **Local Storage:** All flashcard data and practice history are stored locally in your browser.

## How it Works

1.  **Saving:**
    *   **Highlight:** When you select text on a webpage, a small button appears. Clicking it opens the extension popup with the selected text pre-filled as the 'Back' of the card. You fill in the 'Front' and optionally hints/tags, then save.
    *   **Toolbar:** Clicking the extension icon in the toolbar opens the popup directly for manual entry of 'Front', 'Back', hints, and tags.
2.  **Practicing:**
    *   Navigate to the dedicated Learner Page (accessible via a link, perhaps in the popup).
    *   The page determines which cards are due for practice based on the current day and their Leitner bucket.
    *   Click "Enable Camera" to open a separate, small Gesture Window.
    *   The Learner Page shows the 'Front' of a card. You can optionally view the 'Hint'.
    *   Click "Show Answer" to reveal the 'Back'.
    *   Make a gesture (👍, 👎, or ✋) in the Gesture Window and hold it for 3 seconds.
    *   The extension detects the gesture, updates the card's bucket based on the rating ('Easy', 'Wrong', 'Hard'), saves the progress, and moves to the next card.
3.  **Data:** Flashcards and history are stored using `chrome.storage.local`.

## Technology Stack

*   **Browser Extension:** Manifest V3, Chrome Extension APIs
*   **Frontend:** HTML, CSS, TypeScript
*   **Gesture Recognition:** TensorFlow.js with the HandPose Detection model (`@tensorflow-models/hand-pose-detection`)
*   **Core Logic:** Pure functions for testability
*   **Data Storage:** Browser Local Storage (`chrome.storage.local`)
*   **IDs:** `uuid` library
*   **Testing:** Mocha, Chai
*   **Bundling/Compilation:** `tsc` (TypeScript Compiler)
*   **Code Quality:** ESLint/Prettier (Recommended)

## Getting Started (Installation)

As this extension is not yet published on the Chrome Web Store (assumption), you need to load it manually:

1.  **Download/Clone:**
    *   Either download the latest built version (likely a ZIP file containing the `dist` folder contents) if provided.
    *   Or, clone this repository: `git clone https://github.com/CHAKHVA/ai-flashcards.git` and follow the [Development Setup](#development-setup) steps to build it (`npm run build`).
2.  **Open Browser Extensions:**
    *   In Chrome, navigate to `chrome://extensions`
    *   In Edge, navigate to `edge://extensions`
3.  **Enable Developer Mode:** Find the "Developer mode" toggle (usually in the top-right corner) and turn it ON.
4.  **Load Unpacked Extension:**
    *   Click the "Load unpacked" button.
    *   Navigate to and select the directory containing the built extension files (this should be the `dist` directory if you built it yourself, or the unzipped folder if you downloaded a release).
5.  The extension icon should now appear in your browser's toolbar.

## Development Setup

To set up the project for development:

1.  **Prerequisites:**
    *   Node.js (includes npm) installed.
    *   Git installed.
2.  **Clone Repository:**
    ```bash
    git clone git clone https://github.com/CHAKHVA/ai-flashcards.git
    cd ai-flashcards
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Build the Extension:** Compile TypeScript to JavaScript in the `dist` folder:
    ```bash
    npm run build
    ```
    *   For continuous building during development: `npm run build -- --watch` (or configure `tsc --watch`)
5.  **Load for Development:** Follow the steps in [Getting Started (Installation)](#getting-started-installation) to load the `dist` folder as an unpacked extension. Reload the extension in your browser after rebuilding.
6.  **Run Tests:**
    ```bash
    # Run unit tests
    npm run test

    # Run tests with coverage report
    npm run coverage
    ```

## Usage

1.  **Saving a Flashcard:**
    *   **Method 1 (Highlight):** Select text on a webpage, click the "Add to Flashcards" button that appears, fill in the 'Front' field (and optionally 'Hint'/'Tags') in the popup, and click 'Save Card'.
    *   **Method 2 (Toolbar):** Click the extension's icon in the browser toolbar, fill in 'Front', 'Back', and optionally 'Hint'/'Tags' in the popup, and click 'Save Card'.
2.  **Practicing Flashcards:**
    *   Open the Learner Page
    *   The page will show "Day X" and the first card due for practice (or a message if none are due).
    *   Click **"Enable Camera"**. Grant camera permission if prompted. A small window showing your webcam feed will open. Wait for the HandPose model to load ("Detecting..." status).
    *   Review the 'Front' text. Click **"Get Hint"** if needed.
    *   Click **"Show Answer"**. The 'Back' text appears.
    *   Evaluate your recall and make one of the following gestures in the **Gesture Window**:
        *   **👍 Thumbs Up** (for Easy)
        *   **👎 Thumbs Down** (for Wrong)
        *   ✋ **Open Palm** (for Hard)
    *   **Hold the gesture steadily for 3 seconds.** The gesture window will show a countdown.
    *   Once confirmed, the card will be graded, its review schedule updated, and the next card will appear.
    *   If no cards are left for the day, click **"Go to Next Day"** to see cards due on subsequent days.
3.  **Viewing Stats:** (If implemented) Click the "Stats" button on the Learner Page to see your progress.

## Testing

*   This project uses **Mocha** and **Chai** for unit testing.
*   Tests focus on the pure logic functions defined in `src/common/logic.ts` to ensure the core spaced repetition and data manipulation work correctly according to specifications.
*   Test suites include strategies covering valid inputs, invalid inputs, edge cases, and potential implementation errors (glass box testing).
*   Test-First Programming (TFP) principles are encouraged during development.
*   Run tests using `npm run test` and check coverage with `npm run coverage`. Test files are located in the `test/` directory.

## Contributing

Contributions are welcome! Please feel free to open an issue to report bugs or suggest features, or submit a pull request.

When contributing, please try to:

1.  Follow the existing code style and structure.
2.  Write unit tests for new logic.
3.  Ensure tests pass (`npm run test`).
4.  Update documentation (like this README) if necessary.
