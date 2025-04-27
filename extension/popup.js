// compability shim
if (typeof browser === "undefined") {
  var browser = chrome;
}

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
  const recentCardsList = document.getElementById("recent-cards");

  if (
    !frontInput ||
    !backInput ||
    !saveButton ||
    !statusMessage ||
    !recentCardsList
  ) {
    console.error("[Popup] Critical DOM elements not found!");

    //display an error to the user in the popup itself
    statusMessage.textContent = "error initializing popup elements.";
    statusMessage.style.color = "red";
    return; // stop execution if essential elements are missing
  }

  console.log("[Popup] DOM elements initialized successfully.");

  // function definitions

  //save flashcard
  function saveFlashcard() {
    console.log("[Popup] Save button clicked.");
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    const hint = hintInput.value.trim();

    // split tags  trim whitespace and filter out any empty strings
    const tags = tagsInput.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    console.log("[Popup] Card data collected:", { front, back, hint, tags });

    // validation
    if (!front || !back) {
      showStatus("Front and Back fields are required.", "error");
      console.warn("[Popup] Validation Failed: Front or Back missing.");
      return;
    }

    // create flashcard
    const flashcard = {
      front,
      back,
      hint: hint || undefined,
      tags,
      createdAt: new Date().toISOString(),
    };

    console.log("[Popup] Saving flashcard:", flashcard);

    //save card to storage
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
        showStatus("Flashcard saved!", "success");
        clearForm();
        loadRecentCards();
        sendFlashcardToBackend(flashcard);
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
  }

  //clear form function
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

  //display status to user
  function showStatus(message, type = "info") {
    console.log(`[Popup Status] ${type}: ${message}`);
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

    // Clear the message after 3 seconds
    setTimeout(() => {
      statusMessage.textContent = "";
      statusMessage.className = "status-message";
      statusMessage.style.color = "";
    }, 3000);
  }

  const BACKEND_URL = ""; //here i will add backend endpoint after we have it in the project

  //send flashcard information to backend

  async function sendFlashcardToBackend(flashcard) {
    console.log("[Popup] Attempting to send flashcard to backend:", flashcard);
    //will replace with the api endpoint at some point
    if (BACKEND_URL === "BACKEND_API_ENDPOINT") {
      console.warn(
        "[Popup] BACKEND_URL is not configured. Skipping backend sync."
      );
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
        console.error(
          "[Popup] Backend sync failed:",
          response.status,
          response.statusText,
          errorText
        );
      } else {
        console.log("[Popup] Flashcard successfully sent to backend.");
      }
    } catch (error) {
      console.error(
        "[Popup] Network error sending flashcard to backend:",
        error
      );
    }
  }

  //event listeners
  saveButton.addEventListener("click", saveFlashcard);
  clearButton.addEventListener("click", clearForm);
});
