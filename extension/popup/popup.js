if (typeof browser === "undefined") {
  var browser = chrome;
}

window.addEventListener("message", (event) => {
  if (event.data?.type === "setSelectedText") {
    const text = event.data.text;
    console.log("Received selected text:", text);
    document.getElementById("flashcard-back").value = text;
  }
});

// wait until the initial HTML document is fully loaded and parsed
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Popup] DOM content loaded.");

  // dom elements
  const frontInput = document.getElementById("flashcard-front");
  const backInput = document.getElementById("flashcard-back");
  const hintInput = document.getElementById("flashcard-hint");
  const tagsInput = document.getElementById("flashcard-tag");
  const saveButton = document.getElementById("save");
  const clearButton = document.getElementById("clear");
  const statusMessage = document.getElementById("status-msg");
  const recentCardsList = document.getElementById("list-cards");

  // Check if all required elements are loaded
  if (!frontInput || !backInput || !saveButton || !statusMessage || !recentCardsList) {
    console.error("[Popup] Critical DOM elements not found!");
    statusMessage.textContent = "Error initializing popup elements.";
    statusMessage.style.color = "red";
    return;
  }

  console.log("[Popup] DOM elements initialized successfully.");

  // Load recent cards when the popup opens
  loadRecentCards();

  // Request highlighted text from the background script on popup load
  console.log("[Popup] Requesting highlighted text from background.");
  browser.runtime.sendMessage({ type: "GET_HIGHLIGHTED_TEXT" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[Popup] Error getting highlighted text:", chrome.runtime.lastError.message);
      return;
    }

    console.log("[Popup] Received response from background:", response);
    if (response && response.text) {
      console.log("[Popup] Pre-filling back input with:", response.text);
      backInput.value = response.text;
    } else {
      console.log("[Popup] No highlighted text available from background.");
    }
  });

  // Function to save flashcard
  function saveFlashcard() {
    console.log("[Popup] Save button clicked.");
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    const hint = hintInput.value.trim();

    // Split tags, trim whitespace, and filter out any empty strings
    const tags = tagsInput.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    // Validation
    if (!front || !back) {
      showStatus("Front and Back fields are required.", "error");
      console.warn("[Popup] Validation Failed: Front or Back missing.");
      return;
    }

    // Create flashcard object
    const flashcard = {
      front,
      back,
      hint: hint || undefined,
      tags,
      createdAt: new Date().toISOString(),
    };

    console.log("[Popup] Saving flashcard:", flashcard);

    // Save card to local storage
    browser.storage.local
      .get({ flashcards: [] })
      .then((result) => {
        const updatedCards = [...result.flashcards, flashcard];
        return browser.storage.local.set({ flashcards: updatedCards });
      })
      .then(() => {
        console.log("[Popup] Flashcard saved successfully to local storage.");
        showStatus("Flashcard saved!", "success");
        clearForm();
        loadRecentCards();
        sendFlashcardToBackend(flashcard);
      })
      .catch((error) => {
        console.error("[Popup] Error saving flashcard to local storage:", error);
        showStatus(`Error saving flashcard locally: ${error.message || error}`, "error");
      });
  }

  // Function to load and display recent flashcards
  function loadRecentCards() {
    console.log("[Popup] Loading recent flashcards from local storage.");
    browser.storage.local
      .get({ flashcards: [] })
      .then((result) => {
        const flashcards = result.flashcards;
        flashcards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const recentCards = flashcards.slice(0, 5);

        console.log(`[Popup] Found ${flashcards.length} total cards, displaying ${recentCards.length} recent ones.`);

        recentCardsList.innerHTML = "";

        if (recentCards.length === 0) {
          const listItem = document.createElement("li");
          listItem.textContent = "No recent flashcards yet.";
          listItem.style.fontStyle = "italic";
          recentCardsList.appendChild(listItem);
        } else {
          recentCards.forEach((card) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>Q:</strong> ${escapeHTML(card.front)}<br><strong>A:</strong> ${escapeHTML(card.back)}`;
            recentCardsList.appendChild(listItem);
          });
        }
      })
      .catch((error) => {
        console.error("[Popup] Error loading recent flashcards:", error);
        recentCardsList.innerHTML = "<li>Error loading recent cards.</li>";
      });
  }

  // Clear form function
  function clearForm() {
    console.log("[Popup] Clear button clicked.");
    frontInput.value = "";
    backInput.value = "";
    hintInput.value = "";
    tagsInput.value = "";
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
    console.log("[Popup] Form cleared.");
  }

  let statusTimeout = null;

  // Display status to user
  function showStatus(message, type = "info") {
    console.log(`[Popup Status] ${type}: ${message}`);
    
    // Clear any existing timeout
    if (statusTimeout) {
      clearTimeout(statusTimeout);
    }

    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;

    switch (type) {
      case "success":
        statusMessage.style.color = "#28a745";
        break;
      case "error":
        statusMessage.style.color = "red";
        break;
      default:
        statusMessage.style.color = "black";
        break;
    }

    // Set new timeout
    statusTimeout = setTimeout(() => {
      statusMessage.textContent = "";
      statusMessage.className = "status-message";
      statusMessage.style.color = "";
    }, 3000);
  }

  const BACKEND_URL = "";

  // Send flashcard information to backend
  async function sendFlashcardToBackend(flashcard) {
    if (!BACKEND_URL) {
      console.warn("[Popup] BACKEND_URL is not configured. Skipping backend sync.");
      return;
    }

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(flashcard),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Popup] Backend sync failed:", response.status, response.statusText, errorText);
      } else {
        console.log("[Popup] Flashcard successfully sent to backend.");
      }
    } catch (error) {
      console.error("[Popup] Network error sending flashcard to backend:", error);
    }
  }

  // Simple helper function to prevent basic XSS when displaying user input
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // Event listeners
  saveButton.addEventListener("click", saveFlashcard);
  clearButton.addEventListener("click", clearForm);
});
