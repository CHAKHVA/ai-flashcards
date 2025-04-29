// compability shim
if (typeof browser === "undefined") {
  var browser = chrome;
}

// wait until the initial HTML document is fully loaded and parsed
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Popup] DOM content loaded."); // dom elements

  const frontInput = document.getElementById("flashcard-front");
  const backInput = document.getElementById("flashcard-back");
  const hintInput = document.getElementById("flashcard-hint");
  const tagsInput = document.getElementById("flashcard-tag");
  const saveButton = document.getElementById("save");
  const clearButton = document.getElementById("clear");
  const statusMessage = document.getElementById("status-msg");
  const recentCardsList = document.getElementById("list-cards"); // This is where recent cards will be displayed

  if (
    !frontInput ||
    !backInput ||
    !saveButton ||
    !statusMessage ||
    !recentCardsList
  ) {
    // Make sure this element exists in your popup.html
    console.error("[Popup] Critical DOM elements not found!"); //display an error to the user in the popup itself

    statusMessage.textContent = "error initializing popup elements.";
    statusMessage.style.color = "red";
    return; // stop execution if essential elements are missing
  }

  console.log("[Popup] DOM elements initialized successfully."); // Load recent cards when the popup opens

  loadRecentCards(); //Request highlighted text from the background script on popup load

  console.log("[Popup] Requesting highlighted text from background.");
  browser.runtime.sendMessage({ type: "GET_HIGHLIGHTED_TEXT" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(
        "[Popup] Error getting highlighted text:",
        chrome.runtime.lastError.message
      );
      return;
    }

    console.log("[Popup] Received response from background:", response);
    if (response && response.text) {
      console.log("[Popup] Pre-filling back input with:", response.text);
      backInput.value = response.text;
    } else {
      console.log("[Popup] No highlighted text available from background.");
    }
  }); // function definitions //save flashcard

  function saveFlashcard() {
    console.log("[Popup] Save button clicked.");
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    const hint = hintInput ? hintInput.value.trim() : ""; // Handle hintInput possibly not existing
    const tags = tagsInput
      ? tagsInput.value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : []; // Handle tagsInput possibly not existing

    console.log("[Popup] Card data collected:", { front, back, hint, tags }); // validation

    if (!front || !back) {
      showStatus("Front and Back fields are required.", "error");
      console.warn("[Popup] Validation Failed: Front or Back missing.");
      return;
    } // create flashcard object

    const flashcard = {
      front,
      back,
      hint: hint || undefined, // Store undefined if hint is empty
      tags,
      createdAt: new Date().toISOString(), // Add timestamp for sorting
    };

    console.log(
      "[Popup] Attempting to save flashcard to local storage:",
      flashcard
    ); //save card to storage

    browser.storage.local
      .get({ flashcards: [] })
      .then((result) => {
        const updatedCards = [...result.flashcards, flashcard];

        console.log(
          `[Popup] Saving ${updatedCards.length} total cards to local storage.`
        );
        return browser.storage.local.set({ flashcards: updatedCards });
      })
      .then(() => {
        console.log("[Popup] Flashcard saved successfully to local storage.");
        showStatus("Flashcard saved locally!", "success");
        clearForm();
        loadRecentCards(); // Reload recent cards after saving
      })
      .catch((error) => {
        console.error(
          "[Popup] Error saving flashcard to local storage:",
          error
        );
        showStatus(
          `Error saving flashcard locally: ${error.message || error}`,
          "error"
        );
      });
  } // Function to load and display recent flashcards

  function loadRecentCards() {
    console.log("[Popup] Loading recent flashcards from local storage.");
    browser.storage.local
      .get({ flashcards: [] })
      .then((result) => {
        const flashcards = result.flashcards; // Sort by createdAt timestamp descending (newest first)

        flashcards.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        ); // Get the 5 most recent cards

        const recentCards = flashcards.slice(0, 5); // Display up to 5 recent cards

        console.log(
          `[Popup] Found ${flashcards.length} total cards, displaying ${recentCards.length} recent ones.`
        ); // Clear the current list

        recentCardsList.innerHTML = "";

        if (recentCards.length === 0) {
          const listItem = document.createElement("li");
          listItem.textContent = "No recent flashcards yet.";
          listItem.style.fontStyle = "italic";
          recentCardsList.appendChild(listItem);
        } else {
          recentCards.forEach((card) => {
            const listItem = document.createElement("li"); // Display front and back
            listItem.innerHTML = `<strong>Q:</strong> ${escapeHTML(
              card.front
            )}<br><strong>A:</strong> ${escapeHTML(card.back)}`;
            recentCardsList.appendChild(listItem);
          });
        }
      })
      .catch((error) => {
        console.error("[Popup] Error loading recent flashcards:", error);
        recentCardsList.innerHTML = "<li>Error loading recent cards.</li>";
      });
  } // clear form function

  function clearForm() {
    console.log("[Popup] Clear button clicked.");
    frontInput.value = "";
    backInput.value = "";
    if (hintInput) hintInput.value = "";
    if (tagsInput) tagsInput.value = "";
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
    console.log("[Popup] Form cleared.");
  } // display status to user

  function showStatus(message, type = "info") {
    console.log(`[Popup Status] ${type}: ${message}`);
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    switch (type) {
      case "success":
        statusMessage.style.color = "#28a745"; // Green
        break;
      case "error":
        statusMessage.style.color = "red";
        break;
      default:
        statusMessage.style.color = ""; // Reset to default/CSS color
        break;
    } // Clear the message after 3 seconds

    setTimeout(() => {
      statusMessage.textContent = "";
      statusMessage.className = "status-message"; // Reset class
      statusMessage.style.color = ""; // Reset color
    }, 3000);
  }

  // Simple helper function to prevent basic XSS when displaying user input
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  } // event listeners

  saveButton.addEventListener("click", saveFlashcard);
  clearButton.addEventListener("click", clearForm);
});
