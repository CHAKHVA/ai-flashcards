# Development Plan: Enhanced Flashcard Application

This plan outlines the development process for adding persistence, browser extension integration, and gesture controls to the flashcard application. It follows an iterative approach with testable steps and includes prompts suitable for guiding a code-generation LLM.

## Phase 1: Backend Data Persistence

**Goal:** Enable the backend server to save its current state (cards, decks, history) to a file upon shutdown and load it back upon startup.

**Step 1.1: State Transformation Utilities**

- **Objective:** Create functions to convert the server's in-memory data structures (like Maps and Sets used for card buckets) into a format compatible with JSON serialization, and back again.
- **LLM Prompt:**

  ```text
  Context: The flashcard backend currently holds state in memory, including a structure like `Map<number, Set<Flashcard>>`. To persist this to a JSON file, we need conversion functions.

  Task:
  1.  **Implement Utilities:** In a new file, `src/logic/stateTransforms.ts`, create and export two functions:
      * `prepareStateForJson(buckets, history, day)`: Takes the current card buckets (Map<number, Set<Flashcard>>), practice history (PracticeRecord[]), and current day (number). It should return a plain JavaScript object where the Map is converted (e.g., to an array of key-value pairs or an object) and Sets within the buckets are converted to Arrays. Define and export a TypeScript interface representing this JSON-ready structure.
      * `restoreStateFromJson(jsonData)`: Takes the JSON-ready object structure created by the function above. It should return an object containing the reconstructed `buckets` (as Map<number, Set<Flashcard>>), `history`, and `day`. Ensure array data for buckets is correctly converted back into Sets.
  2.  **Write Tests:** Create a corresponding test file `test/stateTransforms.test.ts`. Write unit tests using Jest (or your preferred framework) covering:
      * Serialization and deserialization of an empty state.
      * Serialization and deserialization of a state with multiple cards across different buckets and some practice history.
      * Ensure the data types are correctly transformed (Map -> Object/Array -> Map, Set -> Array -> Set).
  ```

**Step 1.2: Filesystem Interaction for State**

- **Objective:** Implement functions responsible for writing the JSON-compatible state to a file (`flashcard_state.json`) and reading it back.
- **LLM Prompt:**

  ```text
  Context: We have state transformation utilities from `src/logic/stateTransforms.ts`. Now, we need functions to handle reading/writing this transformed state to the disk.

  Task:
  1.  **Implement File Operations:** In a new file, `src/logic/filePersistence.ts`, implement and export two asynchronous functions:
      * `persistState(stateData)`: Takes the application state (buckets, history, day), uses `prepareStateForJson` to convert it, and writes the resulting JSON string to `flashcard_state.json` in the application's root directory using Node.js `fs.promises`. Overwrite the file if it exists.
      * `retrieveState()`: Attempts to read `flashcard_state.json`. If the file exists and contains valid JSON, it parses the content, uses `restoreStateFromJson` to reconstruct the application state, and returns the state. If the file does not exist, it should return `null`. If the file exists but contains invalid JSON or other read errors occur, it should throw an appropriate error (e.g., `Error('Failed to load state file: invalid format')`).
  2.  **Write Tests:** Create `test/filePersistence.test.ts`. Add tests for `persistState` and `retrieveState`. Use mocking (`jest.mock('fs/promises')`) or a temporary file system library to test:
      * Writing state correctly serializes and saves to the expected file path.
      * Reading successfully retrieves and deserializes state from a valid file.
      * Reading returns `null` when the file doesn't exist.
      * Reading throws an error for corrupted/invalid JSON data.
  ```

**Step 1.3: Integrate State Loading on Server Start**

- **Objective:** Modify the main server file to attempt loading the persisted state when the application launches.
- **LLM Prompt:**

  ```text
  Context: The `retrieveState` function is available in `src/logic/filePersistence.ts`, and the initial application state is managed (e.g., in `src/state.ts`). We need the server to load persisted data at startup.

  Task:
  1.  **Update State Initialization:** Modify your state management module (`src/state.ts`):
      * Import `retrieveState` from `src/logic/filePersistence.ts`.
      * Create an exported async function, e.g., `loadInitialState`.
      * Inside `loadInitialState`, call `await retrieveState()`.
      * Use a `try...catch` block:
          * **Try:** If `retrieveState` returns valid state data, update the module's internal state variables (`currentBuckets`, `practiceHistory`, `currentDay`) with the loaded data. Log a message like "Loaded saved state from flashcard_state.json".
          * **Catch:** If `retrieveState` returns `null` (file not found), log a message like "No saved state found, using initial default state." Do nothing else (let the default initial state be used).
          * **Catch:** If `retrieveState` throws any other error (e.g., corrupted file), log the specific error and log a message like "Error loading state file, using initial default state." Ensure the server continues to run with the default state in this case.
  2.  **Update Server Startup Sequence:** Modify your main server file (`src/server.ts`):
      * Import `loadInitialState` from `src/state.ts`.
      * Ensure your server startup logic (where `app.listen` is called) is within an `async` function or context (like an async IIFE).
      * **Before** starting the HTTP listener (`app.listen`), call `await loadInitialState()`.
      * Adjust startup log messages to reflect whether saved state was loaded or default state is being used.
  ```

**Step 1.4: Integrate State Saving on Server Shutdown**

- **Objective:** Ensure the server saves its current state to the file before exiting when receiving termination signals (SIGINT, SIGTERM).
- **LLM Prompt:**

  ```text
  Context: The `persistState` function is available in `src/logic/filePersistence.ts`. The server needs to save its current state gracefully before shutting down.

  Task:
  1.  **Implement Shutdown Handler:** In your main server file (`src/server.ts`):
      * Import `persistState` from `src/logic/filePersistence.ts`.
      * Import the necessary functions to get the current state (e.g., `getBuckets`, `getHistory`, `getCurrentDay` from `src/state.ts`).
      * Create an `async` function named `shutdownSequence`.
      * Inside `shutdownSequence`, add a flag to prevent running concurrently if multiple signals arrive.
      * Log "Shutdown signal received. Saving state...".
      * Retrieve the current application state using the getters.
      * Use a `try...catch` block to call `await persistState(...)` with the retrieved state.
      * **Try (Success):** Log "State saved successfully. Exiting." Call `process.exit(0)`.
      * **Catch (Failure):** Log the error encountered during saving. Log "Failed to save state. Exiting anyway." Call `process.exit(1)`.
  2.  **Register Signal Listeners:** Still in `src/server.ts`, after setting up the server but before the final `app.listen` call (or outside the main async start function):
      * Use `process.on('SIGINT', shutdownSequence);` to register the handler for Ctrl+C.
      * Use `process.on('SIGTERM', shutdownSequence);` to register the handler for standard termination signals.
  ```

- **Verification:** Manually test this phase: start the server, add/modify some cards via existing API endpoints, stop the server using Ctrl+C, check `flashcard_state.json`, restart the server, verify the changes persisted.

## Phase 2: Backend API Enhancements for Extension

**Goal:** Modify the backend API to support the browser extension's requirements for creating cards with hints/tags and preparing cards using an LLM.

**Step 2.1: Update Card Model and Creation Endpoint**

- **Objective:** Modify the `Flashcard` data structure and the `POST /api/cards` endpoint to handle optional `hint` and `tags` fields.
- **LLM Prompt:**

  ```text
  Context: The browser extension needs to save flashcards with optional hints and tags (as an array of strings). The existing `POST /api/cards` endpoint needs to support this.

  Task:
  1.  **Update Flashcard Representation:** In `src/logic/flashcards.ts` (or wherever `Flashcard` is defined):
      * Modify the `Flashcard` class or interface to include optional `hint?: string` and `tags?: ReadonlyArray<string>` properties.
      * Update the constructor (if using a class) to accept these optional parameters and assign them. Ensure default values (e.g., `[]` for tags) are handled if needed.
  2.  **Update API Handler:** In `src/server.ts` (or your API route handler file):
      * Modify the handler for `POST /api/cards`.
      * Update the request body validation/destructuring to look for optional `hint` (string) and `tags` (array of strings).
      * When creating the new `Flashcard` object before adding it to the state, pass the received `hint` and `tags` (or their defaults if not provided) to the constructor/object creation.
      * Ensure the response JSON sent back to the client includes the `id`, `front`, `back`, and also the saved `hint` and `tags` of the newly created card.
  3.  **Refine Tests:** Update any existing integration tests for `POST /api/cards` to:
      * Test creating a card *without* hint/tags.
      * Test creating a card *with* hint/tags and verify they are correctly included in the response and presumably stored (if test setup allows checking state).
  ```

**Step 2.2: Implement LLM Interaction Service**

- **Objective:** Create a dedicated service module to abstract the logic for calling an external LLM API to generate card fronts.
- **LLM Prompt:**

  ```text
  Context: A new API endpoint will need to generate a question (card front) based on an answer (card back) using an LLM. This interaction should be isolated in a service module.

  Task:
  1.  **Configuration Setup:** Ensure you have a way to manage the LLM API key securely (e.g., using environment variables via `dotenv` package and a `.env` file). Define `LLM_API_KEY` and optionally `LLM_API_ENDPOINT` in your configuration. **Ensure `.env` is in `.gitignore`**.
  2.  **Create LLM Service:** Create a new file `src/logic/llmService.ts`.
      * Implement and export an `async` function `generateQuestionForAnswer(answerText: string): Promise<string>`.
      * Inside the function:
          * Retrieve the API key and endpoint from your configuration. Throw an error if the key is missing.
          * Define the prompt structure: "Generate a concise question or keyword for which the following text is the answer: [answerText]".
          * Use `axios` or Node's `Workspace` to make a POST request to the LLM API endpoint.
          * Include appropriate headers (`Authorization: Bearer ...`, `Content-Type: application/json`).
          * Format the request body according to the specific LLM provider's requirements (e.g., Gemini, OpenAI), including the prompt.
          * Handle the response: Extract the generated text from the LLM's JSON response structure.
          * Implement robust error handling: Check for HTTP status codes (e.g., throw for non-2xx), handle network errors (timeouts), and handle potential errors within the LLM's response body. Throw descriptive errors on failure.
  3.  **Write Unit Tests:** Create `test/llmService.test.ts`. Write unit tests for `generateQuestionForAnswer`. **Mock the HTTP client (`axios`/`Workspace`)** to avoid making real API calls during tests. Verify that:
      * The correct prompt is constructed.
      * The API key is included in headers.
      * A successful mocked response correctly extracts the generated text.
      * Mocked API errors (e.g., 4xx, 5xx status codes) are handled and result in thrown errors.
      * Mocked network errors are handled.
  ```

**Step 2.3: Implement Card Preparation Endpoint**

- **Objective:** Create the `POST /api/cards/prepare` endpoint that checks for duplicate answers and uses the LLM service to generate a question.
- **LLM Prompt:**

  ```text
  Context: The browser extension needs an endpoint to check if a card answer (`backText`) already exists and, if not, generate a suggested question (`frontText`) using the LLM service created in `src/logic/llmService.ts`.

  Task:
  1.  **Implement Duplicate Check:** In your state management module (`src/state.ts`):
      * Create and export a function `checkIfAnswerExists(answerText: string): boolean`.
      * This function should iterate through all flashcards in the current state (`currentBuckets`) and return `true` if any card's `back` property strictly equals `answerText`. Otherwise, return `false`.
      * Add unit tests for `checkIfAnswerExists` in `test/state.test.ts`.
  2.  **Define and Implement API Route:** In `src/server.ts` (or your routing file):
      * Define a new route: `POST /api/cards/prepare`.
      * Implement its `async` handler function.
      * Import `checkIfAnswerExists` from `src/state.ts` and `generateQuestionForAnswer` from `src/logic/llmService.ts`.
      * Validate that `req.body.backText` exists and is a non-empty string. Return a 400 error if invalid.
      * Call `checkIfAnswerExists(req.body.backText)`.
          * If `true`, respond with status 409 (Conflict) and JSON body `{ "status": "duplicate", "message": "A card with this answer already exists." }`.
          * If `false`, proceed to call the LLM.
      * Use a `try...catch` block for the LLM call:
          * **Try:** Call `await generateQuestionForAnswer(req.body.backText)`. Respond with status 200 (OK) and JSON body `{ "status": "success", "front": generatedFrontText, "back": req.body.backText }`.
          * **Catch:** If `generateQuestionForAnswer` throws an error, log the error server-side. Respond with status 502 (Bad Gateway) and JSON body `{ "status": "llm_error", "message": "Could not generate question via LLM." }`.
  3.  **Write Integration Tests:** In `test/server.test.ts` (using `supertest` or similar):
      * Test the `/api/cards/prepare` endpoint:
          * Scenario: Valid `backText`, not a duplicate (mock LLM success) -> Expect 200 OK with correct front/back.
          * Scenario: Valid `backText`, IS a duplicate -> Expect 409 Conflict with duplicate status.
          * Scenario: Valid `backText`, not a duplicate (mock LLM failure) -> Expect 502 Bad Gateway with LLM error status.
          * Scenario: Missing or empty `backText` in request -> Expect 400 Bad Request.
  ```

## Phase 3: Browser Extension Development

**Goal:** Create a browser extension that allows users to select text, trigger card preparation via the backend, review/edit the proposed card, and save it.

**Step 3.1: Extension Foundation and Trigger**

- **Objective:** Set up the basic file structure for the browser extension and implement a trigger mechanism (e.g., context menu) based on text selection.
- **LLM Prompt:**

  ```text
  Context: We need to create the initial structure for a Manifest V3 browser extension (Chrome/Edge/Firefox compatible) that activates upon text selection.

  Task:
  1.  **Directory Setup:** Create a new directory `extension/` at the project root.
  2.  **Manifest File (`extension/manifest.json`):** Create the manifest file. Include:
      * `manifest_version: 3`
      * Basic info: `name`, `version`, `description`.
      * `permissions`: Start with `contextMenus`, `activeTab`, `scripting`. (We might add `storage` or `notifications` later).
      * `background`: Define a service worker, e.g., `{ "service_worker": "background.js" }`.
      * Provide placeholder `icons`.
  3.  **Background Script (`extension/background.js`):** Create the background service worker.
      * Implement `chrome.runtime.onInstalled` listener to create a context menu item:
          * `id`: "prepareFlashcard"
          * `title`: "Prepare Flashcard for '%s'" (uses selected text)
          * `contexts`: ["selection"]
      * Implement `chrome.contextMenus.onClicked` listener:
          * Check if the clicked item ID is "prepareFlashcard".
          * If yes, retrieve the selected text from `clickData.selectionText`.
          * For now, simply log the text to the console: `console.log('Context menu triggered for:', clickData.selectionText);`. We will add the API call next.
  4.  **Loading Instructions:** Provide brief instructions on how to load this unpacked extension into a Chromium-based browser or Firefox for testing the context menu.
  ```

**Step 3.2: Extension API Call and Basic Feedback**

- **Objective:** Connect the extension's trigger to the `POST /api/cards/prepare` backend endpoint and provide initial feedback to the user (e.g., via console or simple notifications).
- **LLM Prompt:**

  ```text
  Context: The extension's `background.js` captures selected text via the context menu (Step 3.1). Now it needs to call the backend endpoint `/api/cards/prepare` and handle the basic responses.

  Task:
  1.  **Update Background Script (`extension/background.js`):** Inside the `chrome.contextMenus.onClicked` listener (within the `if` block):
      * Get the `selectedText`.
      * Define the backend endpoint URL (e.g., `const apiUrl = 'http://localhost:3001/api/cards/prepare';`).
      * Use `Workspace` to make a POST request:
          * URL: `apiUrl`
          * Method: `POST`
          * Headers: `{ 'Content-Type': 'application/json' }`
          * Body: `JSON.stringify({ backText: selectedText })`
      * Handle the promise returned by `Workspace`:
          * Use `.then(response => ...)`: Check `response.ok`. If not ok, check `response.status` (e.g., 409 for duplicate, 502 for LLM error) and handle appropriately (e.g., log specific message). Throw an error or return a specific error object if not ok. If ok, parse the JSON using `response.json()`.
          * Use `.then(data => ...)`: If the previous step succeeded (response was OK), `data` contains `{ status: 'success', front, back }`. Log this data. (This is where UI display will be triggered later).
          * Use `.catch(error => ...)`: Handle network errors or errors thrown from the first `.then`. Log an appropriate error message (e.g., "Network error", "Duplicate card", "LLM error").
  2.  **(Optional) Basic Notifications:**
      * Add the `notifications` permission to `manifest.json`.
      * Inside the `Workspace` handling logic (in `.then` and `.catch`), use `chrome.notifications.create` to show simple status updates: "Preparing card...", "Duplicate card found.", "LLM error occurred.", "Card ready to review." (when successful). This provides feedback before a proper UI is built.
  ```

**Step 3.3: Extension Card Review UI and Save**

- **Objective:** Implement the user interface form within the extension (e.g., in a popup or injected into the page) for reviewing/editing the prepared card and saving it via the `POST /api/cards` endpoint.
- **LLM Prompt:**

  ```text
  Context: The background script successfully calls `/api/cards/prepare` and gets `{ front, back }` or handles errors (Step 3.2). A UI is needed for review/editing and saving. This often involves switching from a background script to a popup or content script UI. Assume we'll use a popup triggered after the API call.

  Task:
  1.  **Manifest Update:** Modify `manifest.json`:
      * Add an `action` definition with a `default_popup`: `"action": { "default_popup": "popup.html" }`. Remove the context menu creation if switching entirely to a popup flow, or keep both. Add `storage` permission.
  2.  **Popup HTML (`extension/popup.html`):** Create the HTML structure for the form:
      * Input/Textarea for 'Front' (id: `front-input`).
      * Input/Textarea for 'Back' (id: `back-input`).
      * Input for 'Hint' (optional) (id: `hint-input`).
      * Input for 'Tags' (comma-separated) (id: `tags-input`).
      * 'Save Card' button (id: `save-button`).
      * Placeholders for status/error messages (e.g., `<div id="status-message"></div>`).
  3.  **Background Script Modification (`extension/background.js`):**
      * On successful response from `/api/cards/prepare`:
          * Instead of just logging, store the received `{ front, back }` in `chrome.storage.local` (e.g., `chrome.storage.local.set({ cardData: { front, back } });`).
          * (Optional) Trigger the popup to open programmatically if needed, or rely on the user clicking the extension icon.
      * On duplicate or LLM error: Store an error status in `chrome.storage.local` (e.g., `{ cardError: 'duplicate' }` or `{ cardError: 'llm_error' }`).
  4.  **Popup Script (`extension/popup.js`):** Create this file and link it from `popup.html`.
      * On `DOMContentLoaded`:
          * Retrieve data from `chrome.storage.local` (`chrome.storage.local.get(['cardData', 'cardError'], result => ...)`).
          * If `result.cardError` exists, display the corresponding error message (e.g., "Duplicate card found.") and potentially hide the form or show different buttons.
          * If `result.cardData` exists, populate the 'Front' and 'Back' fields of the form. Clear the stored data (`chrome.storage.local.remove(...)`).
      * Add event listener to the 'Save Card' button:
          * Read values from all form fields (`front`, `back`, `hint`, `tags`).
          * Parse the tags input string into an array (split by comma, trim whitespace).
          * Validate inputs (e.g., front/back not empty).
          * Construct the payload object: `{ front, back, hint, tags }`.
          * Make a `Workspace` POST request to `http://localhost:3001/api/cards` with the payload.
          * Handle the response: Show a success message ("Card Saved!") in the status area and potentially close the popup (`window.close()`), or show an error message if saving fails.
  ```

## Phase 4: Frontend Gesture Recognition

**Goal:** Integrate hand gesture recognition into the existing frontend application's practice view for answering flashcards.

**Step 4.1: Webcam Setup and Error Handling**

- **Objective:** Add webcam access and display to the practice component, including robust error handling as specified.
- **LLM Prompt:**

  ```text
  Context: We need to modify the frontend component responsible for the flashcard practice session to include webcam functionality.

  Task:
  1.  **Add Video Element:** In the template/JSX of your practice component, add a `<video>` element (e.g., `<video id="webcam-feed" playsinline autoplay muted></video>`). Initially, it might be hidden or styled appropriately.
  2.  **Implement Webcam Activation:** In the component's script (e.g., Vue/React component logic):
      * Create an `async` function, `activateWebcam`.
      * Inside, use `navigator.mediaDevices.getUserMedia({ video: true })`.
      * Use a `try...catch` block:
          * **Success:** Get the `MediaStream`. Set the `srcObject` of the video element. Set component state `isWebcamEnabled = true`, `webcamError = null`. Show the video element.
          * **Failure:** Catch the error. Set `isWebcamEnabled = false`. Set `webcamError` state with a user-friendly message based on the error type (`NotFoundError`, `NotAllowedError`, etc.).
  3.  **Error UI:** Based on the `webcamError` state:
      * Conditionally display the error message.
      * Conditionally display two buttons: "Try Again" (calls `activateWebcam`) and "Continue without Webcam".
      * The "Continue without Webcam" button should set `isWebcamEnabled = false`, clear `webcamError`, and potentially set another state flag `gesturesDisabled = true` for the session.
  4.  **Lifecycle Integration:** Call `activateWebcam` when the practice session starts or the component mounts.
  5.  **Session Pause:** Ensure that while the error UI ("Try Again" / "Continue") is visible, the practice session is paused (e.g., timer stopped, answer buttons disabled).
  ```

**Step 4.2: TensorFlow.js Integration**

- **Objective:** Add TensorFlow.js and the Hand Pose Detection model to the frontend project and load the model when the webcam is active.
- **LLM Prompt:**

  ```text
  Context: Webcam access is working (Step 4.1). Now, integrate TensorFlow.js for hand detection.

  Task:
  1.  **Install Libraries:** Add necessary TFJS packages to your frontend project: `@tensorflow/tfjs-core`, `@tensorflow/tfjs-backend-webgl`, `@tensorflow-models/hand-pose-detection`.
  2.  **Import Dependencies:** Import TFJS core, the backend, and the hand pose model in your practice component script.
  3.  **Model Loading Logic:**
      * Declare component state/variables to hold the loaded detector (`handDetector = null`) and model loading status (`isModelLoading = false`, `modelError = null`).
      * Create an `async` function `initializeHandDetector`.
      * Inside: Set `isModelLoading = true`, `modelError = null`. Set TFJS backend (`tf.setBackend`). Define model (`handPoseDetection.SupportedModels.MediaPipeHands`) and detector configuration. Call `handPoseDetection.createDetector`. Store the result in `handDetector`. Set `isModelLoading = false`. Include `try...catch` to handle loading errors, setting `modelError` if fails.
  4.  **Trigger Loading:** Modify the `activateWebcam` function (from Step 4.1). In the success block (after video stream is set), if `handDetector` is null and not already loading, call `initializeHandDetector()`. Show a loading indicator based on `isModelLoading`. Display an error message based on `modelError`.
  ```

**Step 4.3: Gesture Detection Activation and Loop**

- **Objective:** Implement the "Ready to Answer" button and the main loop that uses the loaded TFJS model to detect hands when activated.
- **LLM Prompt:**

  ```text
  Context: The TFJS Hand Pose model is loaded (Step 4.2). We need a trigger ("Ready to Answer") to start actively detecting gestures from the webcam feed.

  Task:
  1.  **Add "Ready" Button:** Add a "Ready to Answer" button to the practice UI. This button should only be active when the card answer is visible AND `isWebcamEnabled` is true AND `gesturesDisabled` is false AND `handDetector` is loaded AND not currently detecting.
  2.  **Detection State:** Add component state variables: `isDetectingGestures = false`, `currentGesture = null`.
  3.  **Start Detection Function:** Create an `async` function `runGestureDetection`.
      * Set `isDetectingGestures = true`. Show a visual indicator (e.g., "Processing gesture...").
      * Get the video element and the loaded `handDetector`. Check they exist.
      * Implement a loop using `requestAnimationFrame` for efficiency.
      * **Inside the loop:**
          * Check if `isDetectingGestures` is still true (allow loop termination). If not, `cancelAnimationFrame`.
          * Call `await handDetector.estimateHands(videoElement)`.
          * If hands are found (`predictions.length > 0`):
              * Extract keypoints from `predictions[0]`.
              * Call a separate (initially simple) function `recognizeGesture(keypoints)` that returns 'ThumbsUp', 'ThumbsDown', 'FlatHand', or 'None'. (Implementation details for `recognizeGesture` will be refined).
              * Update `currentGesture` state based on the result. Log the detected gesture for debugging.
          * Else (no hands found): Set `currentGesture = 'None'`.
          * Request the next frame: `requestAnimationFrame(loopFunction)`.
      * The "Ready to Answer" button click handler should call `runGestureDetection()` and disable itself.
  4.  **Stop Detection Function:** Create `stopGestureDetection()`. Set `isDetectingGestures = false`. Hide the processing indicator. Reset `currentGesture = null`. Call this when an answer is submitted or the card advances.
  ```

**Step 4.4: Gesture Confirmation and Action Trigger**

- **Objective:** Implement the 3-second hold confirmation for detected gestures and trigger the existing card update logic upon successful confirmation.
- **LLM Prompt:**

  ```text
  Context: The gesture detection loop (Step 4.3) updates the `currentGesture` state. We need to add logic to confirm a gesture by holding it for 3 seconds and then trigger the appropriate action.

  Task:
  1.  **Confirmation State:** Add component state variables: `gestureToConfirm = null`, `confirmationStartTime = null`, `confirmationTimerId = null`.
  2.  **Update Detection Logic:** Modify the part of the detection loop where `currentGesture` is updated:
      * Let `newlyDetectedGesture` be the result from `recognizeGesture(keypoints)` (or 'None').
      * **If `newlyDetectedGesture` is NOT 'None' AND is DIFFERENT from `gestureToConfirm`:**
          * A new potential gesture is detected.
          * Set `gestureToConfirm = newlyDetectedGesture`.
          * Set `confirmationStartTime = Date.now()`.
          * Clear any existing `confirmationTimerId` (`clearTimeout`).
          * Set a new timeout: `confirmationTimerId = setTimeout(() => { handleGestureConfirmed(gestureToConfirm); }, 3000);`
          * Update UI to provide feedback (e.g., highlight corresponding button, show icon for `newlyDetectedGesture`).
      * **If `newlyDetectedGesture` IS 'None' AND `gestureToConfirm` is NOT null:**
          * The gesture was lost before confirmation.
          * Clear `confirmationTimerId`.
          * Reset `gestureToConfirm = null`, `confirmationStartTime = null`.
          * Update UI to remove confirmation feedback.
      * **(No change needed if `newlyDetectedGesture` matches `gestureToConfirm`)**
  3.  **Confirmation Handler Function:** Create `handleGestureConfirmed(confirmedGesture)`.
      * Log the confirmed gesture.
      * `stopGestureDetection()`.
      * Map `confirmedGesture` ('ThumbsUp', 'ThumbsDown', 'FlatHand') to the corresponding `AnswerDifficulty` (e.g., Easy, Wrong, Hard).
      * Call your existing card update function (e.g., `submitAnswer(difficulty)`) which handles the API call (`/api/update`) and advances to the next card.
      * Reset confirmation state: `gestureToConfirm = null`, `confirmationStartTime = null`.
  4.  **Integration:** Ensure fallback buttons (Wrong, Hard, Easy clicks) still work and call `stopGestureDetection()` before submitting their answer. Ensure the "Ready to Answer" button logic correctly interacts with hint display (may need to be clicked again after hint is shown). Ensure gesture features are fully bypassed if `gesturesDisabled` is true.
  ```
