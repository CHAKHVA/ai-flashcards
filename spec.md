# Flashcards Extension with Hand Gestures - Specification

## 1. Introduction

### 1.1. Project Goal

To create a browser extension that allows users to save flashcards by highlighting text on webpages and practice them using a spaced repetition system (Modified Leitner) with hand gestures via webcam instead of traditional button clicks.

### 1.2. Main Components

1.  **Content Script:** Injects an "Add to Flashcards" button when text is highlighted on any webpage.
2.  **Browser Extension Popup:** A small window, triggered by the in-page button or the toolbar icon, used *only* for adding/saving new flashcards.
3.  **Flashcard Learner Page:** A separate, dedicated web page using NextJS where users practice their saved flashcards using the spaced repetition system and gesture recognition.
4.  **Gesture Recognition Window:** A secondary, smaller window launched from the Learner Page to display the webcam feed and detect hand gestures.
5.  **Local Storage:** Used as the primary data store for all flashcards and practice history.

### 1.3. Core Technologies

*   Browser Extension APIs (Manifest V3 recommended)
*   NextJS, TailwindCSS
*   TensorFlow.js (HandPose model) for gesture recognition
*   UUID library for generating unique IDs
*   Mocha/Chai for testing

## 2. Core Features

### 2.1. Flashcard Saving (Extension Popup & Content Script)

*   **Workflow 1 (Highlighting):**
    1.  User highlights text on any webpage.
    2.  The Content Script detects the highlight and injects a small "Add to Flashcards" button near the selection.
    3.  User clicks the "Add to Flashcards" button.
    4.  The Browser Extension Popup opens.
    5.  The 'Back' text area in the popup is pre-filled with the highlighted text.
    6.  The 'Front' text area is empty.
    7.  User manually types the 'Front' content.
    8.  User can optionally fill in 'Hint' and 'Tags' (comma-separated).
    9.  User clicks 'Save Card'.
    10. Go to "Save Action".
*   **Workflow 2 (Toolbar Icon):**
    1.  User clicks the extension's icon in the browser toolbar.
    2.  The Browser Extension Popup opens.
    3.  'Front', 'Back', 'Hint', and 'Tags' fields are all initially empty.
    4.  User manually fills 'Front' and 'Back'.
    5.  User can optionally fill in 'Hint' and 'Tags'.
    6.  User clicks 'Save Card'.
    7.  Go to "Save Action".
*   **Save Action:**
    1.  **Validation:** Check if 'Front' and 'Back' fields are non-empty. If invalid, show an error message and do not proceed.
    2.  **Data Creation:** Create a `Flashcard` object (see Data Structures). Generate a unique UUID for the `id`. Set `bucket` to `0`.
    3.  **Storage:** Call `saveCard` logic (see Function Specifications) which reads the existing `flashcards` array from Local Storage, adds the new card, and writes the updated array back.
    4.  **Feedback:** Display a temporary message "Card saved successfully!" within the popup.
    5.  **Auto-Close:** Automatically close the popup ~1.5 seconds after showing the success message.
*   **UI Elements (Popup):**
    *   Text input for 'Front'.
    *   Text area for 'Back'.
    *   Text input for 'Hint (optional)'.
    *   Text input for 'Tags (comma-separated)'.
    *   'Save Card' button.
    *   'Clear' button (optional, to clear fields).
    *   Area for feedback messages.

### 2.2. Spaced Repetition Learning (Flashcard Learner Page)

*   **Access:** User navigates to the dedicated Learner Page (e.g., by opening a specific HTML file bundled with the extension).
*   **Session State:**
    *   Maintains a temporary `currentDay` counter in memory, starting at `1` each time the page is loaded. This counter is **not** persisted in Local Storage.
*   **Initiating Practice for a Day:**
    1.  On page load (or when advancing day), call `practice(currentDay, allCardsFromStorage)` (see Function Specifications) to get the list of cards due for practice.
    2.  Display the `currentDay` number (e.g., "Day 1").
    3.  If cards are due:
        *   Display progress (e.g., "Card 1 of X").
        *   Display the 'Front' of the first card.
        *   Show 'Get Hint' and 'Show Answer' buttons.
        *   Show an "Enable Camera" button (only if not already enabled for the session).
    4.  If no cards are due:
        *   Display "No more cards to practice today!".
        *   Show "Go to Next Day" button.
*   **Gesture Window Initiation:**
    1.  User clicks "Enable Camera".
    2.  Browser requests camera permission (if needed).
    3.  A separate, smaller "Gesture Window" opens.
    4.  Webcam feed starts in the Gesture Window.
    5.  HandPose model loads (show "Loading Model...").
    6.  Gesture Window indicates readiness (e.g., "Detecting...").
    7.  The Gesture Window remains open until the user navigates away from the Learner Page or potentially closes it manually (manual close behavior TBD, maybe add a Disable button).
*   **Practice Flow (Per Card):**
    1.  **Hint:** User clicks 'Get Hint'. Call `getHint(currentCard)` (see Function Specifications). Display the returned hint text below the button (prefixed with "Hint: "). Button should be disabled if `card.hint` is empty/null. This action is purely informational and doesn't affect grading.
    2.  **Show Answer:** User clicks 'Show Answer'.
        *   Display the 'Back' text of the card.
        *   Hide 'Get Hint' and 'Show Answer' buttons.
        *   Display instructions for gestures: "👍 Easy, 👎 Wrong, ✋ Hard".
        *   The Learner Page now waits for a gesture result from the Gesture Window.
    3.  **Gesture Input (in Gesture Window):**
        *   TensorFlow.js HandPose model continuously analyzes the webcam feed.
        *   If 👍, 👎, or ✋ is detected:
            *   Display detected gesture icon and name (e.g., "👍 Easy").
            *   Start a 3-second timer/counter visible to the user (e.g., "Hold detected: 1... 2... 3").
            *   If the gesture is held consistently for 3 seconds:
                *   Send the result ('Easy', 'Hard', or 'Wrong') back to the Learner Page using `chrome.runtime.sendMessage`.
            *   If the gesture changes or is lost before 3 seconds, reset the timer and feedback.
    4.  **Processing Result (in Learner Page):**
        *   Learner page listens for messages via `chrome.runtime.onMessage.addListener`.
        *   On receiving a gesture result message (e.g., `{ type: 'GESTURE_RESULT', payload: 'Easy' }`):
            *   Record the `currentBucket` of the card being practiced.
            *   Call `update(currentCard.id, receivedRating, allCards)` (see Function Specifications) to get the `newAllCards` list with the updated bucket.
            *   Call `addHistoryRecord(currentCard.id, receivedRating, currentBucket, newBucket, currentHistory)` (see Function Specifications) to get the `newHistory` list.
            *   Save `newAllCards` to the `flashcards` key in Local Storage.
            *   Save `newHistory` to the `practiceHistory` key in Local Storage.
            *   Update the `allCards` and `practiceHistory` variables in memory.
            *   Advance to the next card or finish the day (see below).
*   **Advancing / End of Day:**
    1.  After processing a card's result, check if there are more cards in the current day's queue.
    2.  If yes:
        *   Clear the previous card's display.
        *   Display the 'Front' of the next card.
        *   Update the progress indicator ("Card X of Y").
        *   Show 'Get Hint' and 'Show Answer' buttons for the new card.
    3.  If no (last card was just processed):
        *   Clear the card display area.
        *   Display "No more cards to practice today!".
        *   Show the "Go to Next Day" button.
*   **Going to Next Day:**
    1.  User clicks "Go to Next Day".
    2.  Increment the in-memory `currentDay` counter.
    3.  Call `practice(currentDay, allCards)` to get the cards for the new day.
    4.  Update the UI to show the new day number and either the first card or the "No more cards..." message, restarting the practice flow for the new day.

### 2.3. Progress Tracking

*   A function `computeProgress(allCards, history)` (see Function Specifications) calculates statistics.
*   **Metrics Calculated:**
    *   `totalCards`: Total number of flashcards.
    *   `cardsByBucket`: An object mapping bucket number to the count of cards in that bucket (e.g., `{0: 10, 1: 5, 2: 3}`). Ensure all buckets up to the max have entries, even if 0.
    *   `totalPracticeEvents`: Total number of entries in the `practiceHistory`.
    *   `successRate`: Percentage of practice events marked 'Easy' or 'Hard'. `(Easy + Hard) / totalPracticeEvents * 100`. Returns 0 if `totalPracticeEvents` is 0.
    *   `averageMovesPerCard`: Average number of practice events per unique card present in the history. `totalPracticeEvents / uniqueCardsInHistory`. Returns 0 if no history.
*   **Display:** (To be determined - Could be a separate section/modal on the Learner Page activated by a 'Stats' button).

## 3. Data Structures

### 3.1. Local Storage

*   **`flashcards` (Key):** Stores a JSON string representing an array of `Flashcard` objects.
    ```json
    [
      {
        "id": "uuid-string-1",
        "front": "Front text",
        "back": "Back text",
        "hint": "Optional hint text",
        "tags": ["tag1", "tag2"],
        "bucket": 0
      },
      { ... }
    ]
    ```
*   **`practiceHistory` (Key):** Stores a JSON string representing an array of `PracticeRecord` objects.
    ```json
    [
      {
        "cardId": "uuid-string-1",
        "timestamp": 1678886400000,
        "difficulty": "Easy",
        "previousBucket": 0,
        "newBucket": 1
      },
      { ... }
    ]
    ```

### 3.2. Object Definitions

*   **`Flashcard` Object:**
    *   `id`: `string` (Unique UUID v4)
    *   `front`: `string` (Non-empty)
    *   `back`: `string` (Non-empty)
    *   `hint`: `string | null | undefined`
    *   `tags`: `Array<string>`
    *   `bucket`: `number` (Non-negative integer, initially 0)
*   **`PracticeRecord` Object:**
    *   `cardId`: `string` (UUID of the practiced card)
    *   `timestamp`: `number` (Unix timestamp, e.g., `Date.now()`)
    *   `difficulty`: `'Easy' | 'Hard' | 'Wrong'`
    *   `previousBucket`: `number` (Bucket before practice)
    *   `newBucket`: `number` (Bucket after practice)
*   **`ProgressStats` Object (Returned by `computeProgress`):**
    *   `totalCards`: `number`
    *   `cardsByBucket`: `Record<number, number>`
    *   `totalPracticeEvents`: `number`
    *   `successRate`: `number` (0-100)
    *   `averageMovesPerCard`: `number`

## 4. Function Specifications

*(Note: These functions operate on data passed as arguments and return new data structures; they don't directly interact with Local Storage themselves unless specified as part of a higher-level workflow description)*

### 4.1. `saveCard(front, back, hint, tags, allCards)`

*   **Purpose:** Creates a new flashcard object and adds it to a copy of the provided list.
*   **Parameters:**
    *   `front`: `string` (Content for the front).
    *   `back`: `string` (Content for the back).
    *   `hint`: `string | null | undefined` (Optional hint).
    *   `tags`: `Array<string>` (Optional tags).
    *   `allCards`: `Array<Flashcard>` (The current list of all flashcards).
*   **Preconditions:**
    *   `front` and `back` must be non-empty strings.
    *   `tags` must be an array of strings.
    *   `allCards` must be a valid array of `Flashcard` objects.
*   **Returns:** (`Array<Flashcard>`)
    *   A **new** array containing all flashcards from `allCards` plus the newly created flashcard.
    *   The new flashcard object will have a unique `id` (UUID v4), the provided `front`, `back`, `hint`, `tags`, and `bucket: 0`.
*   **Effects:** Pure function. Does not modify input `allCards`.
*   **Error Handling:**
    *   Throws `TypeError` if `front` or `back` are empty or not strings.
    *   Throws `TypeError` if `tags` or `allCards` are not arrays.

### 4.2. `practice(dayNumber, allCards)`

*   **Purpose:** Selects the flashcards due for practice on a specific day based on their bucket.
*   **Parameters:**
    *   `dayNumber`: `number` (The current practice day, starting from 1).
    *   `allCards`: `Array<Flashcard>` (The current list of all flashcards).
*   **Preconditions:**
    *   `dayNumber` must be a positive integer.
    *   `allCards` must be a valid array of `Flashcard` objects, each with a non-negative integer `bucket` property.
*   **Returns:** (`Array<Flashcard>`)
    *   An array containing only the flashcard objects from `allCards` that are due for practice on `dayNumber`.
    *   A card is due if `dayNumber` is divisible by `2 ** card.bucket`.
*   **Effects:** Pure function. Does not modify input `allCards`.
*   **Error Handling:**
    *   Throws `TypeError` if `dayNumber` is not a positive integer.
    *   Throws `TypeError` if `allCards` is not an array or contains invalid objects.

### 4.3. `getHint(card)`

*   **Purpose:** Retrieves the hint text for a given flashcard.
*   **Parameters:**
    *   `card`: `Flashcard` (The flashcard object).
*   **Preconditions:**
    *   `card` must be a valid `Flashcard` object.
*   **Returns:** (`string`)
    *   The value of `card.hint` if it exists and is non-empty.
    *   A default string like "No hint available." if `card.hint` is null, undefined, or empty.
*   **Effects:** Pure function.
*   **Error Handling:**
    *   Throws `TypeError` if `card` is not a valid object.

### 4.4. `update(cardId, rating, allCards)`

*   **Purpose:** Calculates the new bucket for a specific flashcard based on a practice rating and returns a *new* list containing all flashcards, with the updated bucket for the specified card.
*   **Parameters:**
    *   `cardId`: `string` (The unique UUID of the flashcard to update).
    *   `rating`: `'Easy' | 'Hard' | 'Wrong'` (The user's assessment).
    *   `allCards`: `Array<Flashcard>` (The current list of *all* flashcard objects).
*   **Preconditions:**
    *   `cardId` must be a non-empty string.
    *   `rating` must be exactly one of: 'Easy', 'Hard', 'Wrong'.
    *   `allCards` must be a valid Array of `Flashcard` objects.
    *   There must be exactly one flashcard object within `allCards` whose `id` property matches `cardId`.
*   **Returns:** (`Array<Flashcard>`)
    *   A **new** array containing copies of all flashcard objects.
    *   The flashcard object matching `cardId` will have its `bucket` updated:
        *   'Wrong': `bucket` = `0`.
        *   'Hard': `bucket` = `max(0, currentBucket - 1)`.
        *   'Easy': `bucket` = `currentBucket + 1`.
    *   All other flashcard objects remain unchanged.
*   **Effects:** Pure function. Does not modify input `allCards`.
*   **Error Handling:**
    *   Throws `TypeError` for invalid `rating` or `allCards` structure.
    *   Throws `Error` if `cardId` is not found or is not unique.

### 4.5. `addHistoryRecord(cardId, rating, previousBucket, newBucket, currentHistory)`

*   **Purpose:** Creates a new practice record and adds it to a copy of the history list.
*   **Parameters:**
    *   `cardId`: `string` (UUID of the practiced card).
    *   `rating`: `'Easy' | 'Hard' | 'Wrong'`.
    *   `previousBucket`: `number` (Bucket before practice).
    *   `newBucket`: `number` (Bucket after practice).
    *   `currentHistory`: `Array<PracticeRecord>` (The current list of history records).
*   **Preconditions:**
    *   `cardId` must be a non-empty string.
    *   `rating` must be valid.
    *   `previousBucket`, `newBucket` must be non-negative integers.
    *   `currentHistory` must be a valid array of `PracticeRecord` objects.
*   **Returns:** (`Array<PracticeRecord>`)
    *   A **new** array containing all records from `currentHistory` plus the newly created `PracticeRecord`.
    *   The new record includes `cardId`, `timestamp` (`Date.now()`), `difficulty` (`rating`), `previousBucket`, `newBucket`.
*   **Effects:** Pure function. Does not modify input `currentHistory`.
*   **Error Handling:**
    *   Throws `TypeError` for invalid parameters or `currentHistory` structure.

### 4.6. `computeProgress(allCards, history)`

*   **Purpose:** Calculates learning progress statistics based on the current state of cards and their practice history.
*   **Parameters:**
    *   `allCards`: `Array<Flashcard>` (The current list of all flashcards).
    *   `history`: `Array<PracticeRecord>` (The list of all practice events).
*   **Preconditions:**
    *   `allCards` must be a valid array of `Flashcard` objects.
    *   `history` must be a valid array of `PracticeRecord` objects.
*   **Returns:** (`ProgressStats`)
    *   An object containing `totalCards`, `cardsByBucket`, `totalPracticeEvents`, `successRate`, and `averageMovesPerCard` as defined in Data Structures.
*   **Effects:** Pure function.
*   **Error Handling:**
    *   Throws `TypeError` if inputs are not valid arrays or contain invalid objects.

## 5. Engineering Requirements

*   **Specifications:** Every public function must have a detailed specification, as demonstrated above.
*   **Abstraction Function (AF) & Representation Invariant (RI):** Define AF and RI for key data structures (e.g., `Flashcard` class/object, the list representation in Local Storage).
    *   **Example `Flashcard` RI:** `id` is non-empty UUID string; `front`, `back` are non-empty strings; `hint` is string/null/undefined; `tags` is array of strings; `bucket` is non-negative integer.
*   **`checkRep()`:** Implement `checkRep()` methods or functions to assert Representation Invariants at critical points (e.g., after reading from Local Storage, before writing, potentially start/end of key methods).
*   **Code Quality:** Aim for code that is:
    *   **SFB (Safe From Bugs):** Defensive programming, thorough testing, use of types (TypeScript recommended).
    *   **ETU (Easy To Understand):** Clear naming, comments where necessary, consistent style, modular design.
    *   **RFC (Ready For Change):** Decoupled components (e.g., UI vs. logic), pure functions where possible, adherence to specs.
*   **Version Control:** Use Git and push often to a repository (e.g., GitHub) with small, atomic commits and descriptive messages.
*   **Development Process:** Follow Test-First Programming (TFP): Write Spec -> Write Test -> Write Code -> Iterate.

## 6. Testing Requirements

*   **Framework:** Use Mocha and Chai (or a similar standard JavaScript testing framework).
*   **Scope:** Write thorough unit tests for every public function specified in Section 4. Test UI interaction logic where feasible.
*   **Strategy:** Include a testing strategy comment at the beginning of each test suite file, outlining the partitions and cases being tested for that unit.
*   **Test Types:**
    *   Test with correct inputs covering different valid scenarios.
    *   Test with incorrect inputs (invalid types, values outside ranges, missing properties) to ensure error handling works.
    *   Test edge cases (e.g., empty lists, day 1, bucket 0, max bucket).
    *   Use glass box testing: write tests specifically designed to catch likely implementation errors based on the code's structure (e.g., off-by-one errors, incorrect loop bounds, mutation of inputs when purity is expected).
*   **Coverage:** Use a code coverage tool (e.g., `nyc` integrated with `npm run coverage`) and aim for high statement, branch, and function coverage for the core logic functions. Review coverage reports to identify untested code paths.
