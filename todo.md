# Flashcards Extension with Hand Gestures - TODO Checklist

## Phase 1: Project Setup & Core Logic

### 1.1. Project Structure & Dependencies
- [ ] Create root project folder (`flashcards-extension`)
- [ ] Create subdirectories: `extension/icons`, `learner-app`, `shared-logic/tests`
- [ ] Initialize `npm` (`package.json`) in root
- [ ] Install base dev dependencies: `typescript`, `@types/node`, `@types/uuid`
- [ ] Install base dependency: `uuid`
- [ ] Create root `tsconfig.json` (configure paths, strict checks, module resolution)

### 1.2. Core Types Definition
- [ ] Create `shared-logic/types.ts`
- [ ] Define `Flashcard` interface/type
- [ ] Define `PracticeRecord` interface/type
- [ ] Define `ProgressStats` interface/type
- [ ] Define `Rating` type alias (`'Easy' | 'Hard' | 'Wrong'`)
- [ ] Define `checkRep` function signatures (`checkRepFlashcard`, `checkRepFlashcardArray`, `checkRepPracticeRecordArray`)

### 1.3. Pure Logic Implementation (`shared-logic/flashcardLogic.ts`)
- [ ] Create `shared-logic/flashcardLogic.ts`
- [ ] Import types, `uuid`, `checkRep` signatures
- [ ] Implement `checkRepFlashcard` function (validate invariants)
- [ ] Implement `checkRepFlashcardArray` function (validate array and elements)
- [ ] Implement `checkRepPracticeRecordArray` function (validate array and elements)
- [ ] Implement `saveCard` function (validate inputs, create card, UUID, bucket=0, return *new* array, check reps)
- [ ] Implement `practice` function (validate inputs, filter by SRS rule `dayNumber % (2 ** card.bucket) === 0`, return *new* array, check reps)
- [ ] Implement `getHint` function (validate input, return hint or default message, check rep)
- [ ] Implement `update` function (validate inputs, find card, update bucket based on rating, return *new* array, handle not found, check reps)
- [ ] Implement `addHistoryRecord` function (validate inputs, create record with timestamp, return *new* array, check reps)
- [ ] Implement `computeProgress` function (validate inputs, calculate all stats, handle division by zero, include all buckets, check reps)

### 1.4. Unit Testing (`shared-logic/tests/flashcardLogic.test.ts`)
- [ ] Install testing dependencies: `mocha`, `chai`, `@types/mocha`, `@types/chai`
- [ ] Configure `test` script in `package.json`
- [ ] Create `shared-logic/tests/flashcardLogic.test.ts`
- [ ] Add testing strategy comment
- [ ] Write unit tests for `checkRep` functions (valid/invalid cases)
- [ ] Write unit tests for `saveCard` (valid, invalid inputs, purity)
- [ ] Write unit tests for `practice` (valid, invalid inputs, edge cases - day 1, different buckets, purity)
- [ ] Write unit tests for `getHint` (with hint, without hint, invalid input)
- [ ] Write unit tests for `update` (Easy, Hard, Wrong ratings, bucket 0 cases, invalid inputs, card not found, purity)
- [ ] Write unit tests for `addHistoryRecord` (valid, invalid inputs, purity)
- [ ] Write unit tests for `computeProgress` (empty lists, populated lists, edge cases for rates/averages)
- [ ] Run tests (`npm test`) and ensure all pass
- [ ] Check code coverage and improve tests if necessary

## Phase 2: Storage Module

- [ ] Install Chrome types: `@types/chrome`
- [ ] Update root `tsconfig.json` to include `chrome` types
- [ ] Create `shared-logic/storage.ts`
- [ ] Import types and `checkRep` functions
- [ ] Define `FLASHCARDS_KEY` and `HISTORY_KEY` constants
- [ ] Implement `async loadFlashcards` (use `chrome.storage.local.get`, handle missing key, parse JSON, call `checkRepFlashcardArray`, handle errors, return `Flashcard[]`)
- [ ] Implement `async saveFlashcards` (call `checkRepFlashcardArray`, `JSON.stringify`, use `chrome.storage.local.set`, handle errors)
- [ ] Implement `async loadHistory` (similar to `loadFlashcards`, use `HISTORY_KEY` and `checkRepPracticeRecordArray`, return `PracticeRecord[]`)
- [ ] Implement `async saveHistory` (similar to `saveFlashcards`, use `HISTORY_KEY` and `checkRepPracticeRecordArray`)
- [ ] *Note: Plan for manual/integration testing later*

## Phase 3: Extension Core & Popup

### 3.1. Manifest V3 & Basic Files
- [ ] Create `extension/manifest.json`
    - [ ] Set `manifest_version`, `name`, `version`, `description`
    - [ ] Define `permissions`: `storage`, `scripting`, `activeTab`
    - [ ] Define `host_permissions`: `<all_urls>`
    - [ ] Define `action` (popup, icons)
    - [ ] Define `background` service worker (`background.js`)
    - [ ] Define `content_scripts` (matches `<all_urls>`, `content.js`)
    - [ ] Define placeholder `icons` entries
    - [ ] Define placeholder `web_accessible_resources` (comment out initially)
- [ ] Create `extension/icons` folder
- [ ] Add placeholder icons (16x16, 48x48, 128x128)
- [ ] Create placeholder `extension/background.js`
- [ ] Create placeholder `extension/content.js`

### 3.2. Popup UI (`extension/popup.html`, `extension/popup.css`)
- [ ] Create `extension/popup.html`
    - [ ] Basic HTML structure
    - [ ] Link `popup.css` and `popup.js`
    - [ ] Add form elements (inputs: Front, Hint, Tags; textarea: Back) with IDs
    - [ ] Add buttons (Save Card, Clear) with IDs
    - [ ] Add feedback area `div` with ID
- [ ] Create `extension/popup.css`
    - [ ] Add Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`)
- [ ] Set up Tailwind CSS processing to generate `popup.css`

### 3.3. Popup Logic (`extension/popup.js`)
- [ ] *Decision: Set up bundler (Webpack/Rollup) or use alternative for module imports?* Assume bundler for now.
- [ ] Implement `extension/popup.js`
- [ ] Import necessary functions from `storage.ts` and `flashcardLogic.ts`
- [ ] Add `DOMContentLoaded` listener
- [ ] Get references to all UI elements
- [ ] Implement 'Clear' button listener
- [ ] Implement 'Save Card' button listener
    - [ ] Get input values
    - [ ] Validate 'Front' and 'Back' non-empty
    - [ ] Show validation error in feedback area
    - [ ] Parse 'Tags' input string into array
    - [ ] Define `async` save logic
        - [ ] `await loadFlashcards()`
        - [ ] Call `saveCard` pure function
        - [ ] `await saveFlashcards()`
        - [ ] Clear input fields
        - [ ] Show success message in feedback area
        - [ ] Set `setTimeout` to `window.close()` (~1.5s)
        - [ ] Handle errors during save and show error message
- [ ] Manually test adding cards via popup, check local storage.

## Phase 4: Content Script & Highlighting

### 4.1. Highlight Detection & Button Injection (`extension/content.js`)
- [ ] Implement `extension/content.js`
- [ ] Implement `injectAddButton(x, y, selectedText)`
    - [ ] Create button element
    - [ ] Set text & style (absolute position, visible, unique ID/class)
    - [ ] Store `selectedText` (e.g., `dataset.selectedText`)
    - [ ] Append button to `body`
- [ ] Implement `removeExistingButton()` (find by ID/class and remove)
- [ ] Add `mouseup` event listener
    - [ ] Call `removeExistingButton`
    - [ ] Get `window.getSelection()`
    - [ ] Get selected text, trim, check if non-empty
    - [ ] Get selection bounding rect (`getBoundingClientRect`)
    - [ ] Calculate button position (e.g., bottom-right of selection)
    - [ ] Call `injectAddButton`
- [ ] Add `mousedown`/`click` listener to call `removeExistingButton`
- [ ] Manually test highlighting text on various pages injects the button correctly.

### 4.2. Communication Pipeline (`content.js` -> `background.js` -> `popup.js`)
- [ ] Implement `extension/background.js` message listener (`chrome.runtime.onMessage`)
    - [ ] Handle `HIGHLIGHT_ADD` message: store `message.text` temporarily (e.g., service worker global variable `highlightedTextForPopup`).
    - [ ] Handle `GET_HIGHLIGHTED_TEXT` message: `sendResponse({ text: highlightedTextForPopup })`, clear the temporary variable, `return true`.
- [ ] Modify `content.js` `injectAddButton`: Add `click` listener to the button
    - [ ] Get text from `dataset.selectedText`
    - [ ] Send `HIGHLIGHT_ADD` message to background: `chrome.runtime.sendMessage({ type: 'HIGHLIGHT_ADD', text: text })`
    - [ ] Call `removeExistingButton`
- [ ] Modify `popup.js` `DOMContentLoaded`:
    - [ ] Send `GET_HIGHLIGHTED_TEXT` message to background: `chrome.runtime.sendMessage({ type: 'GET_HIGHLIGHTED_TEXT' }, callback)`
    - [ ] In callback, check for response text and pre-fill 'Back' textarea if text exists. Handle `runtime.lastError`.
- [ ] Manually test full flow: Highlight -> Click Button -> Open Popup -> Verify Back field is pre-filled.

## Phase 5: Learner Page (Next.js)

### 5.1. Next.js App Setup (`learner-app`)
- [ ] Run `npx create-next-app` in `learner-app` (with TypeScript, Tailwind, App Router recommended)
- [ ] Navigate into `learner-app`
- [ ] Clean up default boilerplate (`src/app/layout.tsx`, `src/app/page.tsx`)
- [ ] *Decision: Choose development (localhost) vs. static export strategy for serving.* Plan for static export eventually.
- [ ] Configure path mapping in `learner-app/tsconfig.json` to access `@shared/*`

### 5.2. Initial Page Load & Display (`learner-app/src/app/page.tsx`)
- [ ] Add `'use client';` to `page.tsx`
- [ ] Import React hooks (`useState`, `useEffect`), types (`Flashcard`), functions (`loadFlashcards`, `practice`, `checkRepFlashcardArray`) using path alias.
- [ ] Define component state: `allCards`, `cardsForToday`, `currentCardIndex`, `currentDay` (default 1), `isLoading`, `error`, `practiceHistory`.
- [ ] Implement `useEffect` hook for component mount (`[]`)
    - [ ] Set `isLoading = true`
    - [ ] Define `async fetchData` inside
        - [ ] `try...catch` block
        - [ ] `await loadFlashcards()` -> Call `checkRep` -> `setAllCards`
        - [ ] `await loadHistory()` -> Call `checkRep` -> `setPracticeHistory`
        - [ ] Call `practice(currentDay, loadedCards)` -> `setCardsForToday`
        - [ ] Reset `currentCardIndex = 0`
        - [ ] Handle loading/error states (`isLoading`, `error`)
    - [ ] Call `fetchData()`
- [ ] Implement render logic:
    - [ ] Show loading state
    - [ ] Show error state
    - [ ] Display `currentDay`
    - [ ] If cards for today exist:
        - [ ] Display progress ("Card X of Y")
        - [ ] Display `currentCard.front`
        - [ ] Add placeholder buttons: 'Get Hint', 'Show Answer', 'Enable Camera'
    - [ ] If no cards for today:
        - [ ] Display "No more cards to practice today!"
        - [ ] Add placeholder 'Go to Next Day' button
- [ ] Run dev server (`npm run dev`) and test initial load with stored data.

### 5.3. Core Practice Flow (Button-Based) (`learner-app/src/app/page.tsx`)
- [ ] Import necessary functions (`update`, `addHistoryRecord`, `saveFlashcards`, `saveHistory`) and types (`Rating`).
- [ ] Add state: `isAnswerVisible` (default false)
- [ ] Implement `handleShowAnswer()`: set `isAnswerVisible = true`
- [ ] Implement `async handleGrade(rating: Rating)`:
    - [ ] Get `currentCard`, `previousBucket`
    - [ ] `try...catch` block
    - [ ] Call `update` pure function -> `updatedCards`
    - [ ] Find `newBucket` from `updatedCards`
    - [ ] Call `addHistoryRecord` pure function -> `updatedHistory`
    - [ ] Call `checkRep` on updated lists
    - [ ] `await saveFlashcards(updatedCards)`
    - [ ] `await saveHistory(updatedHistory)`
    - [ ] Update state: `setAllCards`, `setPracticeHistory`
    - [ ] Advance logic: `setCurrentCardIndex` or handle end of day
    - [ ] Reset `isAnswerVisible = false`
    - [ ] Handle errors
- [ ] Implement `handleNextDay()`:
    - [ ] Increment `currentDay` state
    - [ ] Call `practice(newDay, allCards)` -> `setCardsForToday`
    - [ ] Reset `currentCardIndex = 0`, `isAnswerVisible = false`
- [ ] Update render logic:
    - [ ] Show 'Show Answer' button (`onClick`) only when `!isAnswerVisible`
    - [ ] When `isAnswerVisible`:
        - [ ] Display `currentCard.back`
        - [ ] Hide 'Show Answer' / 'Get Hint'
        - [ ] Show grading buttons ('Easy', 'Hard', 'Wrong') with `onClick={() => handleGrade(...)`
    - [ ] Show 'Go to Next Day' button (`onClick`) only when day is complete.
- [ ] Test full practice cycle using buttons: grading, card advance, day advance, storage updates.

## Phase 6: Gesture Recognition

### 6.1. Gesture Window Setup (`extension/gesture.html`, `css`, `js`)
- [ ] Create `extension/gesture.html` (DOCTYPE, head, body, `<video id="webcam-feed">`, `<div id="status-message">`, link CSS/JS)
- [ ] Create `extension/gesture.css` (Basic styling for body, video, status)
- [ ] Implement `extension/gesture.js`
    - [ ] Get element references (video, status)
    - [ ] Implement `async setupCamera()`:
        - [ ] Update status ("Requesting...")
        - [ ] `navigator.mediaDevices.getUserMedia({ video: true })`
        - [ ] Set `video.srcObject = stream`
        - [ ] Add `loadedmetadata` listener
        - [ ] Update status ("Camera ready.")
        - [ ] Handle errors (permission denied, etc.)
    - [ ] Call `setupCamera()` on load
- [ ] Test `gesture.html` directly in browser for camera feed.

### 6.2. Launch Gesture Window from Learner Page (`page.tsx`)
- [ ] Add state `isGestureWindowOpen` (default false) to `page.tsx`
- [ ] Implement `handleEnableCamera()`:
    - [ ] Use `window.open('gesture.html', 'gestureWindow', 'width=400,height=350,...')` (adjust path for dev/prod)
    - [ ] Set `isGestureWindowOpen = true`
- [ ] Update render logic: Show 'Enable Camera' button (`onClick`) based on `isGestureWindowOpen` state.
- [ ] Update `manifest.json` -> `web_accessible_resources` if `gesture.html` is bundled.
- [ ] Test clicking 'Enable Camera' opens the gesture window.

### 6.3. Load TensorFlow.js & HandPose Model (`gesture.js`)
- [ ] *Decision: Use CDN script tags in `gesture.html` or bundle `gesture.js`?* Add CDN links for now.
    - [ ] Add TF.js Core, WebGL backend, Hand Pose Detection model scripts to `gesture.html`.
- [ ] If using bundler: `import * as tf`, `import * as handPoseDetection`.
- [ ] Define global `model`, `detector` variables in `gesture.js`.
- [ ] Implement `async loadHandPoseModel()`:
    - [ ] Update status ("Loading model...")
    - [ ] `tf.setBackend('webgl')`
    - [ ] `handPoseDetection.createDetector(...)`
    - [ ] Store detector in global variable
    - [ ] Update status ("Model loaded. Detecting...")
    - [ ] Handle errors
- [ ] Call `loadHandPoseModel()` after camera is ready (e.g., after `setupCamera` resolves or in `loadedmetadata` listener).
- [ ] Test gesture window loads model successfully (check status/console).

### 6.4. Gesture Detection & Hold Logic (`gesture.js`)
- [ ] Define `GESTURE_TYPES` constant mapping gestures (Thumb_Up, Palm_Open) to ratings ('Easy', 'Hard').
- [ ] Define hold detection state variables: `currentDetectedGesture`, `gestureStartTime`, `HOLD_DURATION_MS`, `rafId`.
- [ ] Implement `detectGesture(predictions)`:
    - [ ] Handle no predictions.
    - [ ] Get landmarks.
    - [ ] Implement logic for `GESTURE_TYPES.THUMB_UP` (Thumb tip Y vs MCP Y, other fingers down). *Needs tuning.*
    - [ ] Implement logic for `GESTURE_TYPES.PALM_OPEN` (Fingertips Y vs Wrist Y, finger spread). *Needs tuning.*
    - [ ] Return detected gesture type or `GESTURE_TYPES.NONE`.
- [ ] Implement `async detectionLoop()`:
    - [ ] Check if detector/video ready.
    - [ ] `detector.estimateHands(...)`
    - [ ] Call `detectGesture()`
    - [ ] Implement Hold Logic:
        - [ ] If gesture detected:
            - [ ] If same as `currentDetectedGesture`: Check hold time (`Date.now() - gestureStartTime >= HOLD_DURATION_MS`).
                - [ ] If held: Call `sendGestureResult()`, reset state, update status.
                - [ ] If holding: Update timer feedback status.
            - [ ] If different gesture: Reset `gestureStartTime`, update `currentDetectedGesture`, update status.
        - [ ] If no gesture (`NONE`): Reset state, update status ("Detecting...").
    - [ ] `requestAnimationFrame(detectionLoop)`
- [ ] Define placeholder `sendGestureResult(gestureName)`.
- [ ] Start `detectionLoop()` after model is loaded.
- [ ] Implement cleanup: `cancelAnimationFrame(rafId)`.
- [ ] Test gesture detection visually via status updates and console logs. *Iterate heavily on `detectGesture` logic.*

### 6.5. Send Gesture Result (`gesture.js` -> `background`)
- [ ] Implement `sendGestureResult(gestureName)` in `gesture.js`:
    - [ ] Log confirmation.
    - [ ] Prepare message: `{ type: 'GESTURE_RESULT', payload: gestureName }`
    - [ ] `chrome.runtime.sendMessage(message, callback)`
    - [ ] Handle `runtime.lastError` in callback.
- [ ] Test sending message: Confirm gesture, check gesture window console and background script console.

### 6.6. Receive & Process Gesture (`page.tsx`)
- [ ] Add state `isWaitingForGesture` (default false) to `page.tsx`.
- [ ] Modify `handleShowAnswer`: Set `isWaitingForGesture = true`.
- [ ] Add `useEffect` hook for `chrome.runtime.onMessage` listener (include `isWaitingForGesture` in dependency array).
    - [ ] Inside listener, check `message.type === 'GESTURE_RESULT'` AND `isWaitingForGesture === true`.
    - [ ] Get `rating = message.payload as Rating`.
    - [ ] Validate rating ('Easy', 'Hard').
    - [ ] Use `setImmediate` or `setTimeout` to call `handleGrade(rating)`.
    - [ ] Set `isWaitingForGesture = false`.
    - [ ] `sendResponse({ status: "processed" });`
    - [ ] Add cleanup `removeListener` in `useEffect` return.
- [ ] Update render logic: When `isAnswerVisible`, show gesture instructions ("👍 Easy | ✋ Hard") instead of grading buttons.
- [ ] Ensure `handleGrade` resets `isWaitingForGesture` if necessary (implicitly done by resetting `isAnswerVisible`).
- [ ] Test full loop: Show answer -> Make gesture -> Verify card grade/advance happens on Learner Page.

## Phase 7: Enhancements & Polish

### 7.1. Hint Feature (`page.tsx`)
- [ ] Import `getHint` function.
- [ ] Add state `hintText` (default null) to `page.tsx`.
- [ ] Implement `handleGetHint()`: Call `getHint(currentCard)`, `setHintText`.
- [ ] Reset `hintText = null` when card/day advances (`handleGrade`, `handleNextDay`).
- [ ] Update render logic:
    - [ ] Show 'Get Hint' button only if `!isAnswerVisible`.
    - [ ] Disable button if `!currentCard.hint`.
    - [ ] Set `onClick={handleGetHint}`.
    - [ ] Display hint text (`<div>Hint: {hintText}</div>`) conditionally.
    - [ ] Hide hint button when answer visible.
- [ ] Test hint button enable/disable, display, clearing.

### 7.2. Progress Stats Display (`page.tsx`)
- [ ] Import `computeProgress`, `ProgressStats`.
- [ ] Add state `isStatsVisible` (default false), `progressStats` (default null).
- [ ] Implement `handleShowStats()`: Call `computeProgress`, set `progressStats`, set `isStatsVisible = true`.
- [ ] Implement `handleHideStats()`: set `isStatsVisible = false`.
- [ ] Update render logic:
    - [ ] Add 'Show Stats' button (`onClick={handleShowStats}`).
    - [ ] Conditionally render a modal/section when `isStatsVisible`.
        - [ ] Display stats from `progressStats` object (Total, Buckets, Events, Rate, Avg Moves).
        - [ ] Add 'Close' button (`onClick={handleHideStats}`).
- [ ] Test showing and hiding stats modal with calculated data.

### 7.3. Final Polish & Build
- [ ] Review and refine UI/UX across popup, gesture window, learner page (Tailwind).
- [ ] Improve user feedback (loading states, success/error messages).
- [ ] Enhance error handling (camera denial, storage errors, model load failures, runtime errors).
- [ ] Double-check `checkRep` function calls are appropriately placed.
- [ ] Configure `learner-app/next.config.js` for static export (`output: 'export'`). Add `basePath` if needed. Set `images: { unoptimized: true }`.
- [ ] Run build: `cd learner-app && npm run build && npm run export`.
- [ ] Copy `learner-app/out/*` contents to `extension/learner/` (or similar).
- [ ] Adjust paths in `manifest.json`, `page.tsx` (`window.open`), `web_accessible_resources` to match bundled structure.
- [ ] Finalize bundler setup for `popup.js`/`content.js`/`gesture.js` if required.
- [ ] Perform thorough end-to-end testing using the unpacked extension from the `extension` folder.
- [ ] Package the extension (Zip `extension` folder or use Chrome's "Pack Extension").