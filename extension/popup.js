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

    //update the status and update the flashcards

    browser.storage.local
      .get({ flashcards: [] })
      .then((result) => {
        const updatedCards = [...result.flashcards, flashcard];
        return browser.storage.local.set({ flashcards: updatedCards });
      })
      .then(() => {
        statusMsg.textContent = "Flashcard saved!";
        statusMsg.style.color = "#28a745";
        clearForm();
        loadRecentCards();
      })
      .catch((error) => {
        console.error("Error saving flashcard:", error);
        statusMsg.textContent = "Error saving flashcard!";
        statusMsg.style.color = "red";
      });
  }

  saveButton.addEventListener("click", saveFlashcard);

  // clear form function

  function clearForm() {
    frontInput.value = "";
    backInput.value = "";
    hintInput.value = "";
    tagInput.value = "";
  }

  clearButton.addEventListener("click", clearForm);

  //loading recent cards

  function loadRecentCards() {
    browser.storage.local
      .get({ flashcards: [] })
      .then((result) => {
        listCards.innerHTML = "";

        const recentCards = result.flashcards.slice(-5).reverse(); // last 5 cards
        recentCards.forEach((card) => {
          const li = document.createElement("li");
          li.textContent = `${card.front} → ${card.back}`;
          listCards.appendChild(li);
        });
      })
      .catch((error) => {
        console.error("Error loading flashcards:", error);
      });
  }
});
//event listener
document.addEventListener("DOMContentLoaded", loadRecentCards);
