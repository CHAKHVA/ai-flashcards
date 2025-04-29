Okay, let's break this down into a detailed blueprint and then into iterative, LLM-ready prompts.

## Project Blueprint

This blueprint outlines the logical build order, focusing on establishing core functionality before integrating complex features like gesture recognition.

1.  **Foundation & Core Logic (No Browser APIs yet):**
    *   Set up project structure (folders for `extension`, `learner-app`, `shared-logic`, `tests`).
    *   Define TypeScript types (`Flashcard`, `PracticeRecord`, `ProgressStats`).
    *   Implement *pure* core logic functions (`saveCard`, `practice`, `getHint`, `update`, `addHistoryRecord`, `computeProgress`) based on the spec.
    *   Write comprehensive unit tests (Mocha/Chai) for these pure functions, achieving high coverage. Define AF/RI and add `checkRep` stubs/concepts.

2.  **Local Storage Interaction:**
    *   Create a dedicated module (`storage.ts`) to handle reading/writing `flashcards` and `practiceHistory` arrays from/to `chrome.storage.local`.
    *   Include functions like `loadFlashcards`, `saveFlashcards`, `loadHistory`, `saveHistory`.
    *   Integrate `checkRep` calls after loading data.
    *   Write tests for this module (may require mocking `chrome.storage` API or testing within an extension environment).

3.  **Extension Popup - Card Saving:**
    *   Create the basic extension manifest (`manifest.json` v3) defining the popup action and necessary permissions (storage, scripting).
    *   Build the popup UI (`popup.html`, `popup.css` - using Tailwind).
    *   Implement `popup.js`:
        *   Event listeners for 'Save Card' and 'Clear'.
        *   Input validation (Front/Back non-empty).
        *   On save:
            *   Call `loadFlashcards`.
            *   Use the pure `saveCard` function to get the new card list.
            *   Call `saveFlashcards` to persist.
            *   Display success message & auto-close.
    *   Manual testing: Load extension, add cards via popup, verify in Local Storage.

4.  **Content Script - Highlight & Trigger:**
    *   Create `content.js`.
    *   Implement text selection detection (`mouseup`, `window.getSelection`).
    *   Inject the "Add to Flashcards" button near the selection.
    *   Implement communication: Button click sends a message (`HIGHLIGHT_ADD`) with the selected text to a background service worker (or potentially directly trigger the popup if simpler, though background is more robust).
    *   Update `popup.js` to listen for the `HIGHLIGHT_ADD` message and pre-fill the 'Back' field if the popup is opened via this message.
    *   Manual testing: Highlight text on pages, click button, verify popup opens with pre-filled text.

5.  **Learner Page - Basic Setup & Display (NextJS):**
    *   Initialize NextJS app within `learner-app`.
    *   Set up TailwindCSS for the NextJS app.
    *   Create the main Learner Page component (`pages/index.tsx`).
    *   Implement logic (e.g., in `useEffect`) to:
        *   Load `flashcards` using the `storage` module.
        *   Initialize `currentDay` state (in-memory, starting at 1).
        *   Call the pure `practice` function to get cards for `currentDay`.
        *   Display `currentDay`, progress ("Card X of Y"), and the 'Front' of the first card (or "No cards" message).
        *   Add basic placeholder buttons: 'Get Hint', 'Show Answer', 'Enable Camera', 'Go to Next Day'.
    *   Manual testing: Ensure the page loads, displays the correct day/card front based on saved data.

6.  **Learner Page - Core Practice Flow (No Gestures Yet):**
    *   Implement 'Show Answer' button: Reveal the 'Back' text, hide 'Show Answer'/'Get Hint', show placeholders for grading buttons (e.g., text buttons "Easy", "Hard", "Wrong").
    *   Implement 'Get Hint' button: Use the pure `getHint` function, display hint, disable if no hint exists.
    *   Implement basic grading button logic:
        *   When a grading button is clicked:
            *   Record the `currentBucket`.
            *   Call the pure `update` function to get the updated card list.
            *   Call the pure `addHistoryRecord` function to get the updated history.
            *   Call `saveFlashcards` and `saveHistory`.
            *   Update component state (`allCards`, `practiceHistory`).
            *   Advance to the next card in the day's queue or show "End of Day".
    *   Implement 'Go to Next Day' button: Increment `currentDay` state, re-calculate cards using `practice`, update UI.
    *   Manual testing: Practice cards using buttons, verify state updates, bucket changes, history logs, and day progression.

7.  **Gesture Window - Setup & Camera Feed:**
    *   Create `gesture.html`, `gesture.css`, `gesture.js`.
    *   Implement functionality in `gesture.js` to request camera permission and display the video stream.
    *   In the Learner Page (`index.tsx`), implement the 'Enable Camera' button to open `gesture.html` as a separate, small window (`window.open` or `chrome.windows.create`).

8.  **Gesture Window - TF.js & Model Loading:**
    *   In `gesture.js`, add dependencies for `@tensorflow/tfjs` and `@tensorflow-models/hand-pose-detection`.
    *   Implement logic to load the HandPose model (MediaPipeHands) and display loading/ready status.

9.  **Gesture Window - Detection & Hold Logic:**
    *   Implement the main detection loop in `gesture.js`:
        *   Get predictions from the HandPose model.
        *   Analyze landmarks to detect 👍 (Thumb_Up), 👎 (Thumb_Down - may need custom logic), ✋ (Palm_Open/Five). *Initial focus on Thumb_Up and Palm_Open might be simpler.*
        *   Implement the 3-second hold timer: If a target gesture is detected, start/continue a timer. Display feedback (icon, countdown). If held consistently, proceed. Reset if gesture changes/lost.

10. **Gesture Communication (Gesture -> Learner):**
    *   When a gesture is confirmed (3s hold) in `gesture.js`, use `chrome.runtime.sendMessage` to send a message like `{ type: 'GESTURE_RESULT', payload: 'Easy' }` (mapping detected gestures to 'Easy', 'Hard', 'Wrong').

11. **Learner Page - Gesture Integration:**
    *   Modify the Learner Page (`index.tsx`):
        *   Add a `chrome.runtime.onMessage.addListener` within `useEffect`.
        *   When 'Show Answer' is clicked, *instead* of showing grading buttons, display gesture instructions ("👍 Easy, 👎 Wrong, ✋ Hard") and enter a "waiting for gesture" state.
        *   When a `GESTURE_RESULT` message is received:
            *   Process the `payload` ('Easy', 'Hard', 'Wrong').
            *   Call the same card update/history logic as in Step 6 (using `update`, `addHistoryRecord`, saving).
            *   Advance to the next card or end the day.
    *   Manual testing: Practice cards using hand gestures, verify state updates and flow.

12. **Progress Tracking Display:**
    *   Add a 'Stats' button/modal to the Learner Page.
    *   When activated, call the pure `computeProgress` function with current `allCards` and `practiceHistory`.
    *   Display the returned `ProgressStats` object in the modal.

13. **Final Polish & Packaging:**
    *   Refine UI/UX across all components.
    *   Add robust error handling (camera permissions, storage errors, model loading failures).
    *   Ensure `checkRep` calls are in place.
    *   Review code quality (SFB, ETU, RFC).
    *   Final testing.
    *   Build the NextJS app (`npm run build`, `npm run export` if needed for static files).
    *   Ensure the build output is correctly referenced in the extension manifest.
    *   Package the extension (`extension` folder contents + NextJS build output).

## LLM Prompts (Iterative Steps)

Here are the prompts designed to be fed sequentially to a code-generation LLM.

---

**Prompt 1: Project Setup and Core Types**

```text
Goal: Set up the basic project structure and define the core data types using TypeScript.

1.  Create the following directory structure:
    ```
    flashcards-extension/
    ├── extension/
    │   └── icons/ (optional: add placeholder 16, 48, 128px icons later)
    ├── learner-app/
    ├── shared-logic/
    │   └── tests/
    ├── package.json
    └── tsconfig.json
    ```
2.  Initialize npm: `npm init -y` in the root `flashcards-extension` directory.
3.  Install necessary base dependencies: `npm install --save-dev typescript @types/node @types/uuid` and `npm install uuid`.
4.  Create a `tsconfig.json` file in the root directory configured for modern JavaScript output (e.g., ES2020), module resolution (`node`), strict type checking, and potentially declaration files. Include paths for `shared-logic/*`.
5.  Create `shared-logic/types.ts`. Define and export the following TypeScript interfaces/types based on the spec:
    *   `Flashcard` (id: string, front: string, back: string, hint: string | null | undefined, tags: string[], bucket: number)
    *   `PracticeRecord` (cardId: string, timestamp: number, difficulty: 'Easy' | 'Hard' | 'Wrong', previousBucket: number, newBucket: number)
    *   `ProgressStats` (totalCards: number, cardsByBucket: Record<number, number>, totalPracticeEvents: number, successRate: number, averageMovesPerCard: number)
    *   `Rating` (type alias for `'Easy' | 'Hard' | 'Wrong'`)
6.  Create placeholder files for the next steps: `shared-logic/flashcardLogic.ts`, `shared-logic/storage.ts`.
```

---

**Prompt 2: Implement Pure Core Logic Functions**

```text
Goal: Implement the pure functions for flashcard manipulation and progress calculation as defined in the spec, along with basic Representation Invariant checks.

1.  Install testing dependencies: `npm install --save-dev mocha chai @types/mocha @types/chai`
2.  Configure `package.json` with a test script: `"test": "mocha shared-logic/tests/**/*.test.ts"` (adjust path/glob as needed, may need `ts-node` or pre-compilation).
3.  In `shared-logic/types.ts`, add simple `checkRep` function signatures for `Flashcard` and arrays, e.g.:
    ```typescript
    export function checkRepFlashcard(card: Flashcard): void;
    export function checkRepFlashcardArray(cards: Flashcard[]): void;
    export function checkRepPracticeRecordArray(history: PracticeRecord[]): void;
    ```
4.  In `shared-logic/flashcardLogic.ts`:
    *   Import necessary types (`Flashcard`, `PracticeRecord`, `ProgressStats`, `Rating`) and the `v4 as uuidv4` function from `uuid`.
    *   Import the `checkRep` function signatures.
    *   Implement the `checkRep` functions from step 3. They should throw `TypeError` if invariants are violated (e.g., non-string ID, empty front/back, negative bucket, non-array tags for `Flashcard`; check array elements for array checks).
    *   Implement the function `saveCard(front: string, back: string, hint: string | null | undefined, tags: string[], allCards: Readonly<Flashcard[]>): Flashcard[]`. Ensure it validates inputs, generates a UUID, sets bucket 0, returns a *new* array, and calls `checkRepFlashcardArray` on input `allCards`. Add `checkRepFlashcard` on the created card.
    *   Implement the function `practice(dayNumber: number, allCards: Readonly<Flashcard[]>): Flashcard[]`. Ensure it validates inputs (`dayNumber > 0`), filters cards based on the `dayNumber % (2 ** card.bucket) === 0` rule, and returns a new array. Call `checkRepFlashcardArray` on `allCards`.
    *   Implement the function `getHint(card: Readonly<Flashcard>): string`. Validate input using `checkRepFlashcard`. Return the hint or "No hint available.".
    *   Implement the function `update(cardId: string, rating: Rating, allCards: Readonly<Flashcard[]>): Flashcard[]`. Validate inputs, find the card, calculate the new bucket (Wrong -> 0, Hard -> max(0, current-1), Easy -> current+1), return a *new* array with the updated card. Throw an error if `cardId` not found or not unique. Call `checkRepFlashcardArray` on `allCards`.
    *   Implement the function `addHistoryRecord(cardId: string, rating: Rating, previousBucket: number, newBucket: number, currentHistory: Readonly<PracticeRecord[]>): PracticeRecord[]`. Validate inputs, create a new record with `Date.now()` timestamp, return a *new* array. Call `checkRepPracticeRecordArray` on `currentHistory`.
    *   Implement the function `computeProgress(allCards: Readonly<Flashcard[]>, history: Readonly<PracticeRecord[]>): ProgressStats`. Validate inputs using `checkRep` functions. Calculate all metrics as specified (total cards, cards by bucket, total events, success rate, avg moves per card). Handle division by zero for rates/averages. Ensure `cardsByBucket` includes entries for all buckets from 0 up to the maximum bucket found, even if the count is 0.
5.  Create `shared-logic/tests/flashcardLogic.test.ts`. Write comprehensive Mocha/Chai unit tests for *all* functions in `flashcardLogic.ts`. Cover:
    *   Correct inputs and expected outputs.
    *   Edge cases (empty lists, day 1, bucket 0, max bucket changes).
    *   Invalid inputs (triggering `TypeError` or `Error`).
    *   Purity (ensure input arrays are not modified).
    *   Test the `checkRep` functions directly with valid and invalid objects.
    *   Include a testing strategy comment at the top of the file.
6.  Run tests using `npm test`.
```

---

**Prompt 3: Implement Local Storage Module**

```text
Goal: Create a module to handle interactions with `chrome.storage.local` for storing and retrieving flashcards and history.

1.  Install Chrome types: `npm install --save-dev @types/chrome`. Ensure your `tsconfig.json` includes "chrome" in the `types` array under `compilerOptions`.
2.  In `shared-logic/storage.ts`:
    *   Import `Flashcard`, `PracticeRecord`, `checkRepFlashcardArray`, `checkRepPracticeRecordArray` from `./types` and `./flashcardLogic`.
    *   Define constants for storage keys: `const FLASHCARDS_KEY = 'flashcards';` and `const HISTORY_KEY = 'practiceHistory';`.
    *   Implement `async function loadFlashcards(): Promise<Flashcard[]>`:
        *   Use `chrome.storage.local.get([FLASHCARDS_KEY])`.
        *   Handle cases where the key doesn't exist (return empty array).
        *   Parse the stored JSON string.
        *   If parsing fails or data is invalid, log an error and return an empty array (or throw, TBD - let's start with returning empty).
        *   Call `checkRepFlashcardArray` on the loaded data before returning. If it throws, catch, log, and return empty array.
    *   Implement `async function saveFlashcards(cards: Flashcard[]): Promise<void>`:
        *   Call `checkRepFlashcardArray` on the input `cards`. If it throws, log error and return early.
        *   Use `JSON.stringify` to convert the array to a string.
        *   Use `chrome.storage.local.set({ [FLASHCARDS_KEY]: jsonString })`.
        *   Add basic error handling for the `set` operation (e.g., check `chrome.runtime.lastError`).
    *   Implement `async function loadHistory(): Promise<PracticeRecord[]>`: Similar structure to `loadFlashcards`, using `HISTORY_KEY` and `checkRepPracticeRecordArray`.
    *   Implement `async function saveHistory(history: PracticeRecord[]): Promise<void>`: Similar structure to `saveFlashcards`, using `HISTORY_KEY` and `checkRepPracticeRecordArray`.
3.  (Testing Note) Explain that testing these functions requires either mocking the `chrome.storage.local` API (e.g., using `sinon-chrome` or similar) or running tests within a browser extension context. For now, focus on the implementation logic. We will test manually later.
```

---

**Prompt 4: Basic Extension Manifest and Popup UI**

```text
Goal: Set up the basic browser extension manifest file and create the HTML/CSS for the popup window using Tailwind CSS.

1.  Create `extension/manifest.json`:
    ```json
    {
      "manifest_version": 3,
      "name": "Flashcards with Gestures",
      "version": "0.1.0",
      "description": "Create and practice flashcards using spaced repetition and hand gestures.",
      "permissions": [
        "storage",      // For chrome.storage.local
        "scripting",    // To inject content scripts
        "activeTab"     // Often needed with scripting
      ],
      "host_permissions": [
        "<all_urls>"    // Required for content script injection on any page
      ],
      "action": {
        "default_popup": "popup.html",
        "default_icon": {
          "16": "icons/icon16.png", // Add placeholder icons later
          "48": "icons/icon48.png",
          "128": "icons/icon128.png"
        }
      },
       "background": {
         "service_worker": "background.js" // Add even if empty for now, good practice
       },
      "content_scripts": [
        {
          "matches": ["<all_urls>"],
          "js": ["content.js"],
          "run_at": "document_idle"
        }
      ],
      "web_accessible_resources": [ // Needed if any extension page needs to be loaded by web pages, TBD
        // {
        //   "resources": ["learner.html"], // Example if using a plain HTML learner page
        //   "matches": ["<all_urls>"]
        // }
      ],
      "icons": { // Add placeholder icons later
         "16": "icons/icon16.png",
         "48": "icons/icon48.png",
         "128": "icons/icon128.png"
       }
    }
    ```
2.  Create `extension/popup.html`:
    *   Basic HTML structure (`<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`).
    *   Link to a CSS file: `popup.css`.
    *   Include a script tag for `popup.js`.
    *   Set up basic layout using `div`s. Make the popup have a fixed width (e.g., `w-80` or `w-96` in Tailwind).
    *   Add form elements based on spec 2.1.UI:
        *   Label and `input type="text"` for 'Front' (id: `front-input`).
        *   Label and `textarea` for 'Back' (id: `back-textarea`). Rows = 4 approx.
        *   Label and `input type="text"` for 'Hint (optional)' (id: `hint-input`).
        *   Label and `input type="text"` for 'Tags (comma-separated)' (id: `tags-input`).
        *   Button 'Save Card' (id: `save-button`).
        *   Button 'Clear' (id: `clear-button`).
        *   A `div` for feedback messages (id: `feedback-area`), initially hidden.
3.  Create `extension/popup.css`: Include TailwindCSS directives (`@tailwind base; @tailwind components; @tailwind utilities;`). You'll need to set up Tailwind processing (e.g., using `tailwindcss` CLI or PostCSS) to generate the actual `popup.css` file from your HTML class usage. For now, just include the directives.
4.  Create empty placeholder files: `extension/background.js`, `extension/content.js`.
5.  Create the `extension/icons` folder and add placeholder PNG icons (16x16, 48x48, 128x128). If you don't have them, leave the manifest entries but note they are missing.
```
**(Self-Correction Note:** Added `background.js` early, even if empty, as it's often needed for messaging. Added `content_scripts` definition pointing to the future `content.js`. Added `web_accessible_resources` as a comment, as it might be needed later for the NextJS page access).

---

**Prompt 5: Popup Save Logic**

```text
Goal: Implement the JavaScript logic for the extension popup to handle user input, validation, saving flashcards using the shared logic, and providing feedback.

1.  Assume Tailwind CSS processing is set up to generate `extension/popup.css` from `extension/popup.html` classes.
2.  Create `extension/popup.js`:
    *   Import necessary functions from `shared-logic/storage.ts` (`loadFlashcards`, `saveFlashcards`) and `shared-logic/flashcardLogic.ts` (`saveCard`). Note: Direct imports might require bundling (like Webpack/Rollup) or using dynamic imports if types='module' is feasible in the manifest/popup context. *Initially, let's assume a bundler will handle this, or we might need to adjust later.*
    *   Add event listeners for `DOMContentLoaded`.
    *   Inside the listener, get references to all UI elements (inputs, buttons, feedback area).
    *   Implement the 'Clear' button listener: Clear all input/textarea fields.
    *   Implement the 'Save Card' button listener:
        *   Get values from 'Front', 'Back', 'Hint', 'Tags' inputs.
        *   **Validation:** Check if 'Front' and 'Back' are non-empty. If not, display an error message in the feedback area (e.g., "Front and Back cannot be empty") and return. Clear the error message after a few seconds or on next input change.
        *   Parse tags: Split the tags string by comma, trim whitespace from each tag, filter out empty strings.
        *   Use an `async` function for the saving logic:
            *   Try/Catch block for error handling during storage operations.
            *   `const currentCards = await loadFlashcards();`
            *   `const newCards = saveCard(frontValue, backValue, hintValue || null, tagsArray, currentCards);` // Use pure function
            *   `await saveFlashcards(newCards);`
            *   Clear input fields.
            *   Display "Card saved successfully!" in the feedback area.
            *   Use `setTimeout` to close the popup window (`window.close()`) after ~1.5 seconds.
            *   If an error occurs during save, display an error message in the feedback area.
3.  **(Bundling Consideration)** Add a note: To use ES Modules (`import`/`export`) across `shared-logic` and `extension` scripts, a bundler like Webpack or Rollup is typically required to process these into formats the browser/extension environment can understand directly. The setup for this is outside this prompt but necessary for the imports to work. An alternative for simpler cases is to manually include compiled JS files or use dynamic imports if the environment supports it. For now, write the code assuming imports work via bundling.
```

---

**Prompt 6: Content Script - Highlight Detection and Button Injection**

```text
Goal: Implement the content script to detect text selection on any webpage and inject an "Add to Flashcards" button nearby.

1.  In `extension/content.js`:
    *   Define a function `injectAddButton(x, y, selectedText)`:
        *   Create a button element (`document.createElement('button')`).
        *   Set button text: "Add to Flashcards".
        *   Style the button: Use CSS to make it visible, position it absolutely near coordinates (x, y), give it a distinct appearance (background, border, padding, z-index), and maybe add a small icon. Use a unique ID or class (e.g., `flashcard-adder-button`).
        *   Store the `selectedText` associated with the button (e.g., using a data attribute: `button.dataset.selectedText = selectedText`).
        *   Add an event listener to the button (details in next prompt).
        *   Append the button to the `document.body`.
    *   Define a function `removeExistingButton()`:
        *   Find any existing button with the specific ID/class and remove it from the DOM.
    *   Add a global event listener for `mouseup`:
        *   Inside the listener:
            *   Call `removeExistingButton()` first to clean up previous buttons.
            *   Get the current text selection: `const selection = window.getSelection();`
            *   Get the selected text: `const selectedText = selection.toString().trim();`
            *   Check if `selectedText` is not empty.
            *   If text is selected:
                *   Get the bounding rectangle of the selection range: `const range = selection.getRangeAt(0); const rect = range.getBoundingClientRect();`
                *   Calculate position for the button (e.g., bottom-right of selection: `x = rect.right + window.scrollX`, `y = rect.bottom + window.scrollY`). Adjust as needed for better placement.
                *   Call `injectAddButton(x, y, selectedText)`.
    *   Add a global event listener for `mousedown` or `click` that calls `removeExistingButton()` to hide the button when the user clicks elsewhere.
```

---

**Prompt 7: Content Script -> Background -> Popup Communication**

```text
Goal: Make the injected button send the selected text to the background script, which then notifies the popup when it opens.

1.  In `extension/background.js`:
    *   Add a listener for messages from content scripts: `chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { ... });`
    *   Inside the listener, check for a specific message type, e.g., `if (message.type === 'HIGHLIGHT_ADD')`.
    *   Store the received text temporarily. A simple global variable in the service worker is often sufficient for short-lived data like this, but be aware service workers can terminate. A more robust way might use `chrome.storage.session` if available/needed, but let's start simply: `let highlightedTextForPopup = message.text;`
    *   Add a listener for when the popup requests the text:
        ```javascript
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'GET_HIGHLIGHTED_TEXT') {
            sendResponse({ text: highlightedTextForPopup });
            highlightedTextForPopup = null; // Clear after sending
            return true; // Indicates async response
          }
          // Handle HIGHLIGHT_ADD from content script as before...
          if (message.type === 'HIGHLIGHT_ADD') {
             highlightedTextForPopup = message.text;
             // Optional: Open the popup programmatically if needed, though typically user clicks icon
             // chrome.action.openPopup();
          }
        });
        ```

2.  In `extension/content.js`:
    *   Modify the `injectAddButton` function:
        *   Inside the button's event listener (`click`):
            *   Prevent default behavior if necessary.
            *   Get the stored text: `const text = event.target.dataset.selectedText;`
            *   Send a message to the background script: `chrome.runtime.sendMessage({ type: 'HIGHLIGHT_ADD', text: text });`
            *   Optionally, provide user feedback (e.g., brief style change on button).
            *   Call `removeExistingButton()` after sending.

3.  In `extension/popup.js`:
    *   Modify the `DOMContentLoaded` listener:
        *   At the beginning, send a message to the background script to request the highlighted text:
          ```javascript
          chrome.runtime.sendMessage({ type: 'GET_HIGHLIGHTED_TEXT' }, (response) => {
            if (chrome.runtime.lastError) {
              // Handle error (e.g., background script inactive)
              console.error(chrome.runtime.lastError);
            } else if (response && response.text) {
              const backTextArea = document.getElementById('back-textarea');
              if (backTextArea) {
                backTextArea.value = response.text;
              }
            }
          });
          ```
        *   Ensure the rest of the popup initialization (getting elements, adding listeners) happens after this potentially asynchronous request (or structure it so it doesn't block).
```
**(Self-Correction:** Using a background script as an intermediary is more reliable than direct content-to-popup communication, especially with Manifest V3 service workers).

---

**Prompt 8: Learner Page Setup (NextJS)**

```text
Goal: Initialize a NextJS application for the Learner Page, set up Tailwind CSS, and create the basic page structure.

1.  Navigate to the `flashcards-extension/` directory in your terminal.
2.  Create the NextJS app inside `learner-app`: `npx create-next-app@latest learner-app --ts --tailwind --eslint --app --src-dir --no-import-alias` (Using App Router, TypeScript, Tailwind). Adjust flags as preferred.
3.  Navigate into `learner-app`: `cd learner-app`.
4.  Verify Tailwind setup: Check for `tailwind.config.ts` and `src/app/globals.css` with Tailwind directives.
5.  Clean up default NextJS boilerplate:
    *   Edit `src/app/layout.tsx`: Remove default styling if desired, ensure `<html>` and `<body>` tags exist.
    *   Edit `src/app/page.tsx`: Remove the default content inside the `main` tag. This will be our main Learner Page component.
6.  Establish a way to access the Learner Page:
    *   **Option 1 (Development):** Run `npm run dev` inside `learner-app`. Access via `http://localhost:3000`. This is fine for development.
    *   **Option 2 (Bundled Extension Page):** Configure NextJS to export a static HTML site (`next build && next export`, might need config changes in `next.config.js` like `output: 'export'`). Place the exported files (e.g., from `out/`) into a folder within the `extension` directory (e.g., `extension/learner/`). Update `manifest.json` to allow access or provide a way to open `extension/learner/index.html` (e.g., via `chrome.tabs.create` from the popup or background script). *Let's plan for Option 2 for the final build, but use Option 1 for development initially.*
7.  Create necessary shared logic access:
    *   Since the `learner-app` is separate, we need to access `shared-logic`. Configure path mapping in `learner-app/tsconfig.json` or use relative paths (e.g., `../../shared-logic/`). Path mapping is cleaner:
        ```json
        // learner-app/tsconfig.json
        {
          "compilerOptions": {
            // ... other options
            "baseUrl": ".",
            "paths": {
              "@shared/*": ["../shared-logic/*"]
            }
          },
          // ... include/exclude
        }
        ```
    *   Verify you can import types from `@shared/types` in `src/app/page.tsx`.
```

---

**Prompt 9: Learner Page - Load & Display Day 1 Cards**

```text
Goal: Implement the initial state management and data loading for the Learner Page to display the first card due for practice on Day 1.

1.  In `learner-app/src/app/page.tsx`:
    *   Make the main component a client component: Add `'use client';` at the top.
    *   Import React hooks: `useState`, `useEffect`.
    *   Import types: `Flashcard` from `@shared/types`.
    *   Import functions: `loadFlashcards` from `@shared/storage` (using path alias) and `practice` from `@shared/flashcardLogic`.
    *   Define component state:
        *   `allCards: Flashcard[]` (initially empty array)
        *   `cardsForToday: Flashcard[]` (initially empty array)
        *   `currentCardIndex: number` (initially 0)
        *   `currentDay: number` (initially 1)
        *   `isLoading: boolean` (initially true)
        *   `error: string | null` (initially null)
    *   Implement `useEffect` hook to run on component mount (`[]` dependency array):
        *   Set `isLoading` to true.
        *   Define an `async` function `fetchData` inside `useEffect`.
        *   Inside `fetchData`:
            *   Use a try-catch block.
            *   `const loadedCards = await loadFlashcards();`
            *   Call `checkRepFlashcardArray(loadedCards)` (import from logic). Catch errors and set the `error` state.
            *   `setAllCards(loadedCards);`
            *   `const cardsToPractice = practice(1, loadedCards);` // Use initial currentDay=1
            *   `setCardsForToday(cardsToPractice);`
            *   `setCurrentCardIndex(0);`
            *   Set `error` state to null on success.
        *   Call `fetchData()`.
        *   Finally, set `isLoading` to false.
    *   Implement the render logic:
        *   If `isLoading`, show a "Loading..." message.
        *   If `error`, show the error message.
        *   If not loading and no error:
            *   Display the current day: `<h1>Day {currentDay}</h1>`
            *   Check if `cardsForToday.length > 0`:
                *   Get the current card: `const currentCard = cardsForToday[currentCardIndex];`
                *   Display progress: `<div>Card {currentCardIndex + 1} of {cardsForToday.length}</div>`
                *   Display the front of the card: `<div>Front: {currentCard.front}</div>`
                *   Add placeholder buttons (disabled or hidden for now): 'Get Hint', 'Show Answer', 'Enable Camera'.
            *   If `cardsForToday.length === 0`:
                *   Display "No more cards to practice today!".
            *   Add a placeholder 'Go to Next Day' button (disabled or hidden for now).
2.  Run the NextJS dev server (`npm run dev` in `learner-app`) and open `http://localhost:3000`. Add some flashcards using the extension popup first. Verify that the Learner Page loads, shows "Day 1", and displays the front of the correct first card based on the `practice` logic (cards in bucket 0), or the "No cards" message if applicable.
```

---

**Prompt 10: Learner Page - Show Answer & Basic Navigation (Button-Based)**

```text
Goal: Implement the logic for showing the answer, revealing grading buttons (Easy, Hard, Wrong), handling grading actions (updating card state and history via pure functions), and navigating between cards and days using buttons.

1.  In `learner-app/src/app/page.tsx`:
    *   Import necessary functions: `update`, `addHistoryRecord` from `@shared/flashcardLogic`, `saveFlashcards`, `saveHistory`, `loadHistory` from `@shared/storage`.
    *   Import types: `PracticeRecord`, `Rating` from `@shared/types`.
    *   Add new state variables:
        *   `isAnswerVisible: boolean` (initially false)
        *   `practiceHistory: PracticeRecord[]` (initially empty array)
    *   Modify the `useEffect` hook:
        *   Also load history: `const loadedHistory = await loadHistory(); setPracticeHistory(loadedHistory);` (Add appropriate checks/error handling).
    *   Implement a function `handleShowAnswer()`:
        *   Set `isAnswerVisible` to true.
    *   Implement a function `handleGrade(rating: Rating)`:
        *   If `cardsForToday.length === 0` or `!isAnswerVisible`, return early.
        *   Get the `currentCard = cardsForToday[currentCardIndex]`.
        *   Record `previousBucket = currentCard.bucket`.
        *   Use an `async` block with try-catch:
            *   `const updatedCards = update(currentCard.id, rating, allCards);` // Pure function
            *   `const newBucket = updatedCards.find(c => c.id === currentCard.id)?.bucket ?? previousBucket;` // Find the new bucket
            *   `const updatedHistory = addHistoryRecord(currentCard.id, rating, previousBucket, newBucket, practiceHistory);` // Pure function
            *   Call `checkRepFlashcardArray(updatedCards)` and `checkRepPracticeRecordArray(updatedHistory)`.
            *   `await saveFlashcards(updatedCards);`
            *   `await saveHistory(updatedHistory);`
            *   Update state: `setAllCards(updatedCards); setPracticeHistory(updatedHistory);`
            *   Move to the next card or end the day:
                *   If `currentCardIndex < cardsForToday.length - 1`:
                    *   `setCurrentCardIndex(currentCardIndex + 1);`
                    *   `setIsAnswerVisible(false);` // Hide answer for next card
                *   Else (last card for today):
                    *   Set `cardsForToday` to an empty array temporarily to show the "End of Day" message or handle state appropriately. Maybe add a state like `isDayComplete = true`.
                    *   `setIsAnswerVisible(false);`
        *   Handle potential errors during saving/updates.
    *   Implement a function `handleNextDay()`:
        *   Increment `currentDay` state: `const nextDay = currentDay + 1; setCurrentDay(nextDay);`
        *   Recalculate cards for the new day: `const cardsForNewDay = practice(nextDay, allCards);`
        *   Reset state for the new day: `setCardsForToday(cardsForNewDay); setCurrentCardIndex(0); setIsAnswerVisible(false);` Reset `isDayComplete` if using.
    *   Modify the render logic:
        *   Get `currentCard` only if `cardsForToday.length > 0`.
        *   'Get Hint' button: (Implement later in Prompt 17). Add placeholder.
        *   'Show Answer' button:
            *   Show only if `currentCard` exists and `!isAnswerVisible`.
            *   `onClick={handleShowAnswer}`.
        *   If `currentCard` exists and `isAnswerVisible`:
            *   Display the 'Back': `<div>Back: {currentCard.back}</div>`.
            *   Show grading buttons: 'Easy', 'Hard', 'Wrong'.
            *   `onClick={() => handleGrade('Easy')}`, etc.
            *   Hide 'Show Answer' and 'Get Hint' buttons.
        *   If `cardsForToday.length === 0` or day is complete:
            *   Show "No more cards to practice today!".
            *   Show the 'Go to Next Day' button (`onClick={handleNextDay}`).
        *   Hide the 'Go to Next Day' button during active practice.
2.  Test thoroughly: Practice several cards, use different ratings, check Local Storage for updated buckets and history. Go to the next day and verify the correct cards appear based on the SRS logic.
```

---

**Prompt 11: Gesture Window - Setup & Camera Feed**

```text
Goal: Create the HTML and basic JavaScript for the separate gesture recognition window to access and display the webcam feed.

1.  Create `extension/gesture.html`:
    *   Basic HTML structure.
    *   Include a `<video>` element (e.g., `id="webcam-feed"`, `autoplay`, `muted`, `playsinline`). Style it to fill most of the window.
    *   Include a `<div>` for status messages (e.g., `id="status-message"`). Style it to overlay the video or be positioned below it.
    *   Link to `gesture.css` and `gesture.js`.
2.  Create `extension/gesture.css`:
    *   Add basic styling for the `body`, `video`, and status message elements. Ensure the video displays correctly. Example:
      ```css
      body { margin: 0; overflow: hidden; background-color: #222; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
      #webcam-feed { width: 95%; max-width: 400px; height: auto; border: 1px solid grey; transform: scaleX(-1); /* Mirror display */ }
      #status-message { margin-top: 10px; font-size: 1.2em; text-align: center; }
      ```
3.  Create `extension/gesture.js`:
    *   Get references to the video element and status message div.
    *   Define an `async` function `setupCamera()`:
        *   Display "Requesting camera..." in the status message.
        *   Use a try-catch block.
        *   Request camera access: `const stream = await navigator.mediaDevices.getUserMedia({ video: true });`
        *   If successful:
            *   Set the video element's `srcObject` to the stream.
            *   Add an event listener for `loadedmetadata` on the video to ensure dimensions are known.
            *   Display "Camera ready." in the status message.
            *   Return the video element for potential chaining.
        *   If failed (catch block):
            *   Display an error message (e.g., "Camera access denied or not available.").
            *   Log the error.
    *   Call `setupCamera()` when the script loads.
4.  (No Learner Page change yet) Manually open `gesture.html` in your browser (you might need to adjust security settings or serve it locally) to test if it requests permission and displays the webcam feed.
```

---

**Prompt 12: Learner Page - Launch Gesture Window**

```text
Goal: Add the "Enable Camera" button to the Learner Page and implement its logic to open the `gesture.html` window.

1.  In `learner-app/src/app/page.tsx`:
    *   Add state to track if the gesture window is open/enabled: `isGestureWindowOpen: boolean` (initially false).
    *   Implement a function `handleEnableCamera()`:
        *   Check if the window is already open; if so, maybe focus it or do nothing.
        *   Use `window.open('gesture.html', 'gestureWindow', 'width=400,height=350,noopener,noreferrer');` to open the gesture window. (Note: Direct path assumes `gesture.html` will be served relative to the learner page. If using the static export approach (Option 2 from Prompt 8), the path might be `/learner/gesture.html` or similar, depending on where you place it). *Adjust the path based on your chosen serving method.*
        *   Store the window reference if needed for later communication (though `chrome.runtime.sendMessage` is preferred).
        *   Set `isGestureWindowOpen` to true.
        *   (Optional) Add an event listener for the `beforeunload` event on the main window to try and close the gesture window automatically, or add a "Disable Camera" button.
    *   Modify the render logic:
        *   Show the 'Enable Camera' button (`onClick={handleEnableCamera}`) only if `!isGestureWindowOpen`.
        *   Optionally, show a 'Camera Enabled' status or a 'Disable Camera' button if `isGestureWindowOpen`.
2.  In `extension/manifest.json`: If using the static export approach (Option 2 from Prompt 8) where `gesture.html` is bundled inside the extension:
    *   Ensure `gesture.html` is listed under `web_accessible_resources` if it needs to be opened by the NextJS page (which might be running on localhost during dev, or as an extension page itself). Example:
      ```json
       "web_accessible_resources": [
         {
           "resources": ["learner/*", "gesture.html", "gesture.css", "gesture.js"], // Allow access to these files
           "matches": ["<all_urls>"] // Or restrict to your extension's origin if possible
         }
       ],
      ```
3.  Test: Load the extension, open the Learner Page, click 'Enable Camera'. Verify the small `gesture.html` window opens and starts the camera feed.
```
**(Self-Correction:** Added notes about path differences between dev/prod and the need for `web_accessible_resources`).

---

**Prompt 13: Gesture Window - Load TF.js & HandPose Model**

```text
Goal: Load TensorFlow.js and the HandPose detection model in the gesture window.

1.  In `extension/gesture.js`:
    *   Add necessary imports/script tags. If not using a bundler for `gesture.js`, you might need to include TF.js and the hand-pose model via CDN script tags in `gesture.html`:
        ```html
        <!-- In gesture.html -->
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection"></script>
        <script src="gesture.js" defer></script>
        ```
    *   If using imports (assuming bundling or module support):
        ```javascript
        import * as tf from '@tensorflow/tfjs-core';
        import '@tensorflow/tfjs-backend-webgl'; // Register WebGL backend
        import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
        ```
    *   Define global variables for the model and detector: `let model, detector;`
    *   Create an `async` function `loadHandPoseModel()`:
        *   Display "Loading model..." in the status message.
        *   Use try-catch.
        *   Set backend: `await tf.setBackend('webgl');`
        *   Load the model: `model = handPoseDetection.SupportedModels.MediaPipeHands;`
        *   Create the detector: `detector = await handPoseDetection.createDetector(model, { runtime: 'tfjs', modelType: 'lite' /* or 'full' */ });`
        *   Display "Model loaded. Detecting..." in the status message.
        *   Return the detector.
        *   If error, display "Failed to load model."
    *   Modify the `setupCamera` function or use promise chaining/async/await: After the camera is ready (e.g., inside `loadedmetadata` handler or after `setupCamera` promise resolves), call `loadHandPoseModel()`. Store the returned detector. Once the detector is loaded, start the detection loop (next prompt).
```

---

**Prompt 14: Gesture Window - Gesture Detection Logic**

```text
Goal: Implement the loop to detect hand poses, specifically looking for 👍 (Thumb_Up) and ✋ (Palm_Open/Five), and implement the 3-second hold confirmation. (Adding 👎 is complex, start with these two).

1.  You'll need a library or custom logic to interpret landmarks. Let's try a simplified landmark check first. Define constants for gesture names:
    ```javascript
    const GESTURE_TYPES = {
        THUMB_UP: 'Easy', // Map to rating
        PALM_OPEN: 'Hard', // Map to rating
        // THUMB_DOWN: 'Wrong', // Add later if feasible
        NONE: 'None'
    };
    ```
2.  In `extension/gesture.js`:
    *   Define state variables for the hold detection:
        ```javascript
        let currentDetectedGesture = GESTURE_TYPES.NONE;
        let gestureStartTime = null;
        const HOLD_DURATION_MS = 3000; // 3 seconds
        let rafId = null; // For requestAnimationFrame
        ```
    *   Define a function `detectGesture(predictions)`:
        *   This is the core logic. It needs to analyze the `predictions` array (usually contains one hand).
        *   If `predictions.length === 0`, return `GESTURE_TYPES.NONE`.
        *   Get the landmarks for the first hand: `const landmarks = predictions[0].keypoints;`
        *   **Thumb Up Logic (Simplified):**
            *   Check if Thumb_Tip (landmark 4) Y coordinate is significantly *above* (lower Y value) the Thumb_MCP (landmark 2) Y coordinate.
            *   Check if Index_Finger_Tip (8), Middle_Finger_Tip (12), Ring_Finger_Tip (16), Pinky_Tip (20) Y coordinates are significantly *below* (higher Y value) their respective MCP joints (5, 9, 13, 17) - indicating fingers are curled down.
            *   *Refine conditions based on testing.* If conditions met, return `GESTURE_TYPES.THUMB_UP`.
        *   **Palm Open Logic (Simplified):**
            *   Check if all fingertips (4, 8, 12, 16, 20) Y coordinates are significantly *above* (lower Y value) the Wrist (landmark 0) Y coordinate.
            *   Check if fingertips are reasonably spread apart horizontally (X coordinate differences).
            *   *Refine conditions based on testing.* If conditions met, return `GESTURE_TYPES.PALM_OPEN`.
        *   If neither gesture matches, return `GESTURE_TYPES.NONE`.
    *   Define an `async` function `detectionLoop()`:
        *   If `!detector` or `!videoElement.readyState === 4`), return.
        *   Estimate poses: `const predictions = await detector.estimateHands(videoElement, { flipHorizontal: false });` // Don't flip here if video CSS mirrors
        *   `const detected = detectGesture(predictions);`
        *   **Hold Logic:**
            *   If `detected !== GESTURE_TYPES.NONE`:
                *   If `detected === currentDetectedGesture`: // Same gesture held
                    *   If `gestureStartTime` is set:
                        *   Check if `Date.now() - gestureStartTime >= HOLD_DURATION_MS`:
                            *   **Gesture Confirmed!** Call `sendGestureResult(currentDetectedGesture)`.
                            *   Reset state: `currentDetectedGesture = GESTURE_TYPES.NONE; gestureStartTime = null;`
                            *   Update status: "Detected: [Gesture Name]!" (clear after 1-2s).
                        *   Else: // Still holding, update timer feedback
                            *   const holdTime = Math.round((Date.now() - gestureStartTime) / 1000);
                            *   Update status: `Holding ${detected}: ${holdTime}s...`
                    *   Else: // Gesture detected for the first time
                        *   `gestureStartTime = Date.now();`
                        *   `currentDetectedGesture = detected;`
                        *   Update status: `Detected ${detected}... Hold...`
                *   Else: // Different gesture detected
                    *   Reset: `gestureStartTime = Date.now();`
                    *   `currentDetectedGesture = detected;`
                    *   Update status: `Detected ${detected}... Hold...`
            *   Else (`detected === GESTURE_TYPES.NONE`): // No gesture or gesture lost
                *   Reset: `currentDetectedGesture = GESTURE_TYPES.NONE; gestureStartTime = null;`
                *   Update status: "Detecting..." (or clear message).
        *   Schedule next loop: `rafId = requestAnimationFrame(detectionLoop);`
    *   Create `function sendGestureResult(gestureName)` (implementation in next prompt).
    *   Start the loop after the model is loaded: Call `detectionLoop()` once `detector` is ready.
    *   Add cleanup: Use `cancelAnimationFrame(rafId)` if the window is closed or detection stops.
3.  Test: Open the gesture window. Verify status updates ("Loading model...", "Detecting..."). Try making the gestures. Check if the status updates with detection and the hold timer. *Fine-tuning the `detectGesture` logic will likely require significant iteration and testing.*
```
**(Self-Correction:** Added mapping of gestures to ratings early. Simplified to two gestures first. Added `requestAnimationFrame` for smooth looping. Added placeholder for `sendGestureResult`.)

---

**Prompt 15: Gesture Window -> Learner Page Communication**

```text
Goal: Send the confirmed gesture result from the Gesture Window back to the extension context (specifically, the Learner Page) using `chrome.runtime.sendMessage`.

1.  In `extension/gesture.js`:
    *   Implement the `sendGestureResult(gestureName)` function:
        *   Log the confirmed gesture: `console.log('Gesture confirmed:', gestureName);`
        *   Prepare the message payload: `const message = { type: 'GESTURE_RESULT', payload: gestureName };` // gestureName is 'Easy' or 'Hard' from GESTURE_TYPES
        *   Send the message:
          ```javascript
          chrome.runtime.sendMessage(message, (response) => {
              if (chrome.runtime.lastError) {
                  console.error("Error sending gesture result:", chrome.runtime.lastError.message);
                  // Handle error appropriately - maybe show feedback in gesture window
              } else {
                  console.log("Gesture result sent successfully.");
                  // Optional: Confirmation feedback in gesture window
              }
          });
          ```
2.  No changes needed in `learner-app` for this step (receiving is next).
3.  Test: Open both Learner Page and Gesture Window. Confirm a gesture (hold for 3s). Check the Gesture Window's console log to see "Gesture confirmed" and "Gesture result sent". Check the background script's console (accessible via chrome://extensions -> Service Worker) to see if the message arrived (it won't be processed yet, but shouldn't error out).
```

---

**Prompt 16: Learner Page - Receive Gesture & Update Card**

```text
Goal: Modify the Learner Page to listen for gesture results, process them by updating the card's state and history, and advancing the practice session.

1.  In `learner-app/src/app/page.tsx`:
    *   Add a new state variable: `isWaitingForGesture: boolean` (initially false).
    *   Modify `handleShowAnswer()`:
        *   Instead of just setting `isAnswerVisible = true`, also set `isWaitingForGesture = true`.
    *   Add a `useEffect` hook specifically for listening to messages:
        ```typescript
        useEffect(() => {
          const messageListener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
            if (message.type === 'GESTURE_RESULT' && isWaitingForGesture) { // Only process if waiting
              console.log('Gesture result received:', message.payload);
              const rating = message.payload as Rating; // Assuming payload matches 'Easy', 'Hard', 'Wrong'

              // Validate rating if necessary
              if (rating === 'Easy' || rating === 'Hard' || rating === 'Wrong') {
                 setImmediate(() => { // Use setImmediate or setTimeout to avoid state update issues within listener
                    handleGrade(rating); // Call the existing grading logic
                    setIsWaitingForGesture(false); // Stop waiting after processing
                 });
              } else {
                 console.warn("Received invalid rating:", rating);
              }
              sendResponse({ status: "processed" }); // Acknowledge message
            }
            return true; // Keep message channel open for async response if needed elsewhere
          };

          chrome.runtime.onMessage.addListener(messageListener);

          // Cleanup listener on component unmount
          return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
          };
        }, [isWaitingForGesture, handleGrade]); // Include dependencies that the listener uses (isWaitingForGesture, handleGrade)
        ```
        *(Self-Correction: Added `isWaitingForGesture` check, used `setImmediate` for state update safety, added dependency array to `useEffect`)*.
    *   Modify the render logic:
        *   When `isAnswerVisible` is true:
            *   Instead of showing the 'Easy', 'Hard', 'Wrong' buttons, display gesture instructions: `<div>👍 Easy | ✋ Hard | (👎 Wrong - TBD)</div>`
            *   Ensure the grading buttons are no longer rendered.
    *   Ensure the `handleGrade` function correctly sets `isAnswerVisible` back to `false` when moving to the next card or finishing the day.
2.  Test: Open Learner Page, enable camera, open Gesture Window. Practice a card:
    *   Click 'Show Answer'.
    *   Verify instructions appear.
    *   Make a confirmed gesture (👍 or ✋).
    *   Verify the Learner Page console logs receipt, calls `handleGrade`, updates the card/history (check Local Storage), and advances to the next card (hiding the answer again).
```
**(Self-Correction:** Added TBD for Wrong gesture. Ensured `isWaitingForGesture` is reset. Added `useEffect` dependency array.)

---

**Prompt 17: Implement Hint Feature**

```text
Goal: Implement the 'Get Hint' button functionality on the Learner Page.

1.  In `learner-app/src/app/page.tsx`:
    *   Import the `getHint` function from `@shared/flashcardLogic`.
    *   Add state to store the hint text: `hintText: string | null` (initially null).
    *   Implement a function `handleGetHint()`:
        *   If `cardsForToday.length === 0`, return.
        *   Get the `currentCard = cardsForToday[currentCardIndex]`.
        *   Call the pure function: `const hint = getHint(currentCard);`
        *   Update the state: `setHintText(hint);`
    *   Modify state resets: When moving to the next card (`handleGrade`) or next day (`handleNextDay`), reset `setHintText(null)`.
    *   Modify the render logic:
        *   Get the `currentCard` only if available.
        *   The 'Get Hint' button:
            *   Show only if `currentCard` exists and `!isAnswerVisible`.
            *   Disable the button if `!currentCard.hint`.
            *   Set `onClick={handleGetHint}`.
        *   Display the hint text:
            *   Conditionally render `<div>Hint: {hintText}</div>` only if `hintText` is not null. Place it appropriately (e.g., below the Front text or near the hint button).
        *   Hide the 'Get Hint' button when the answer is visible (`isAnswerVisible`).
2.  Test: Use a card with a hint and one without. Verify the button enables/disables correctly. Click the button, verify the hint appears. Show the answer, verify the hint button disappears. Go to the next card, verify the hint is cleared.
```

---

**Prompt 18: Implement Progress Stats Display**

```text
Goal: Add a way to view progress statistics calculated by the `computeProgress` function.

1.  In `learner-app/src/app/page.tsx`:
    *   Import `computeProgress` from `@shared/flashcardLogic`.
    *   Import the `ProgressStats` type from `@shared/types`.
    *   Add state for stats visibility and data:
        *   `isStatsVisible: boolean` (initially false)
        *   `progressStats: ProgressStats | null` (initially null)
    *   Implement a function `handleShowStats()`:
        *   Calculate stats: `const stats = computeProgress(allCards, practiceHistory);`
        *   Update state: `setProgressStats(stats); setIsStatsVisible(true);`
    *   Implement a function `handleHideStats()`:
        *   Set `setIsStatsVisible(false);`
    *   Modify the render logic:
        *   Add a 'Show Stats' button somewhere persistent (e.g., in the header/footer area). Set `onClick={handleShowStats}`.
        *   Conditionally render a modal or a dedicated section if `isStatsVisible`:
            *   The modal should overlay the main content.
            *   Include a 'Close' button (`onClick={handleHideStats}`).
            *   Display the statistics from the `progressStats` state object if it's not null:
                *   Total Cards: `{progressStats.totalCards}`
                *   Cards per Bucket: Iterate over `Object.entries(progressStats.cardsByBucket)` to display counts for each bucket (e.g., Bucket 0: X, Bucket 1: Y, ...).
                *   Total Practice Events: `{progressStats.totalPracticeEvents}`
                *   Success Rate: `{progressStats.successRate.toFixed(1)}%`
                *   Average Moves per Card: `{progressStats.averageMovesPerCard.toFixed(2)}`
            *   Style the modal appropriately (background, padding, positioning).
2.  Test: Add several cards, practice them a few times with different results. Click 'Show Stats', verify the modal appears and displays calculated statistics. Close the modal.
```

---

**Prompt 19: Final Polish, Build, and Packaging**

```text
Goal: Refine the UI, add error handling, ensure build steps work, and prepare the extension for packaging.

1.  **UI/UX Refinement:**
    *   Review all components (`popup.html`, `gesture.html`, `learner-app/src/app/page.tsx`).
    *   Improve layout, spacing, and styling using TailwindCSS for consistency.
    *   Ensure clear feedback for all actions (saving, errors, loading, gesture detection).
    *   Consider adding loading spinners or skeleton screens where appropriate.
    *   Make sure the gesture window instructions are clear.
2.  **Error Handling:**
    *   Review `try...catch` blocks in `storage.ts`, `popup.js`, `page.tsx`, `gesture.js`. Ensure meaningful error messages are shown to the user or logged.
    *   Handle camera permission denial gracefully in `gesture.js`.
    *   Handle potential failures in loading the TF.js model.
    *   Handle `chrome.runtime.lastError` when using chrome APIs.
3.  **`checkRep` Integration:**
    *   Ensure `checkRep` functions are called after loading data from storage and potentially before saving, as implemented earlier.
4.  **Build Learner App (Static Export):**
    *   If not already done, configure `learner-app/next.config.js` for static export:
        ```javascript
        /** @type {import('next').NextConfig} */
        const nextConfig = {
          output: 'export',
          // Optional: Set base path if deploying to a subdirectory within the extension
          // basePath: '/learner',
          // Optional: Disable image optimization for static export
          images: {
            unoptimized: true,
          },
        };
        module.exports = nextConfig;
        ```
    *   Run the build and export commands inside the `learner-app` directory: `npm run build && npm run export`. This should create an `out` directory.
5.  **Integrate Build Output:**
    *   Copy the contents of the `learner-app/out` directory into the `extension` directory, perhaps into a subfolder like `extension/learner/`.
    *   Update paths:
        *   In `manifest.json`, if you need to open the learner page programmatically (e.g., from the popup), use the path relative to the extension root, e.g., `chrome.tabs.create({ url: 'learner/index.html' });`.
        *   In `learner-app/src/app/page.tsx`, update the `window.open('gesture.html', ...)` call in `handleEnableCamera` to use the correct path relative to where `learner/index.html` is served from (e.g., it might become `../gesture.html` if `gesture.html` is at the root of `extension`). Adjust based on final structure.
        *   Update `web_accessible_resources` in `manifest.json` to include all necessary files from the `learner` folder and `gesture.*` files.
6.  **Bundling (If needed):**
    *   If you relied on ES module imports in `popup.js` or `content.js` or `gesture.js` that require bundling, set up Webpack/Rollup/Parcel to process these scripts and output them into the `extension` directory, correctly referenced by `manifest.json` and HTML files.
7.  **Final Testing:**
    *   Load the *unpacked* extension from the `extension` directory in Chrome (`chrome://extensions/`).
    *   Test *all* workflows thoroughly:
        *   Adding cards via highlight.
        *   Adding cards via toolbar icon.
        *   Practicing cards using gestures (hint, answer, grading).
        *   Day progression.
        *   Stats display.
        *   Error conditions (e.g., deny camera permission).
8.  **Packaging:**
    *   Once testing is complete, use Chrome's "Pack Extension" button in `chrome://extensions/` pointing to your `extension` directory to create the `.crx` file for distribution (or zip the `extension` folder contents).
```

This detailed sequence of prompts should guide the LLM through building the extension incrementally, ensuring each step builds upon a working foundation. Remember that the gesture detection logic (`detectGesture` in Prompt 14) might require the most manual refinement and testing.
