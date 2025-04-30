console.log("AI Flashcard Creator: Popup script loaded.");

const frontInput = document.getElementById("flashcard-front");
const backInput = document.getElementById("flashcard-back");
const hintInput = document.getElementById("flashcard-hint");
const tagsInput = document.getElementById("flashcard-tag");
const saveButton = document.getElementById("save");
const clearButton = document.getElementById("clear");
const statusMessage = document.getElementById("status-msg");
const recentFlashcardsList = document.getElementById("list-cards");

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function showStatus(message, type = "info") {
  console.log(`Showing status (${type}): ${message}`);
  if (statusMessage) {
    statusMessage.textContent = message;
    statusMessage.className = `status-msg ${type}`;
    statusMessage.style.display = "block";

    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.style.display = "none";
      statusMessage.className = 'status-msg';
    }, 3000);
  } else {
    console.error("Status message element not found!");
  }
}

function clearForm() {
  console.log("Clearing form");
  if (frontInput) frontInput.value = "";
  if (backInput) backInput.value = "";
  if (hintInput) hintInput.value = "";
  if (tagsInput) tagsInput.value = "";
}

function renderRecentFlashcards(cards = []) {
  if (!recentFlashcardsList) {
    console.error("Recent flashcards list element not found!");
    return;
  }
  recentFlashcardsList.innerHTML = '';

  if (cards.length === 0) {
    recentFlashcardsList.innerHTML = "<li>No flashcards created yet.</li>";
    return;
  }

  const latestCards = cards.slice(0, 5);

  latestCards.forEach(card => {
    const cardElement = document.createElement('li');

    let tagsHTML = '';
    if (card.tags && card.tags.length > 0) {
      tagsHTML = `<span class="tags">${card.tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join(' ')}</span>`;
    } else {
      tagsHTML = `<span class="tags"><span>none</span></span>`;
    }


    const formattedDate = card.timestamp ? new Date(card.timestamp).toLocaleString() : 'N/A';

    cardElement.innerHTML = `
            <strong>Front:</strong> ${escapeHTML(card.front)}<br>
            <strong>Back:</strong> ${escapeHTML(card.back)}
            ${card.hint ? `<br><strong>Hint:</strong> ${escapeHTML(card.hint)}` : ''}
            <br><strong>Tags:</strong> ${tagsHTML}
            <br><strong>Bucket:</strong> ${card.bucket}
            <div class="timestamp">Created: ${formattedDate}</div>
        `;
    recentFlashcardsList.appendChild(cardElement);
  });
}

async function loadRecentFlashcards() {
  console.log("Loading recent flashcards...");
  try {
    const result = await chrome.storage.local.get({ flashcards: [] });
    console.log("Loaded flashcards from storage:", result.flashcards);
    renderRecentFlashcards(result.flashcards);
  } catch (error) {
    console.error("Error loading flashcards:", error);
    if (chrome.runtime.lastError) {
      console.error("Chrome runtime error:", chrome.runtime.lastError.message);
      showStatus(`Error loading cards: ${chrome.runtime.lastError.message}`, "error");
    } else {
      showStatus("Error loading recent flashcards.", "error");
    }
    renderRecentFlashcards([]);
  }
}

async function handleSave(event) {
  event.preventDefault();
  console.log("Save button clicked");

  const front = frontInput.value.trim();
  const back = backInput.value.trim();
  const hint = hintInput.value.trim();
  const tags = tagsInput.value.trim().split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
  const bucket = 0;

  if (!front || !back) {
    showStatus("Front and Back fields are required.", "error");
    return;
  }

  const newFlashcard = {
    id: Date.now(),
    front: front,
    back: back,
    hint: hint,
    tags: tags,
    bucket: bucket,
    timestamp: new Date().toISOString() 
  };

  console.log("Attempting to save new flashcard:", newFlashcard);

  try {
    const result = await chrome.storage.local.get({ flashcards: [] });
    let updatedFlashcards = result.flashcards || [];

    updatedFlashcards.unshift(newFlashcard);

    await chrome.storage.local.set({ flashcards: updatedFlashcards });

    console.log("Flashcard saved successfully.");
    showStatus("Flashcard saved!", "success");
    clearForm();
    loadRecentFlashcards();

    setTimeout(() => window.close(), 1200);

  } catch (error) {
    console.error("Error saving flashcard:", error);
    if (chrome.runtime.lastError) {
      console.error("Chrome runtime error:", chrome.runtime.lastError.message);
      showStatus(`Error saving: ${chrome.runtime.lastError.message}`, "error");
    } else {
      showStatus("An error occurred while saving.", "error");
    }
  }
}

function handleClear() {
  console.log("Clear button clicked");
  clearForm();
  showStatus("Form cleared.", "info");
}

document.addEventListener('DOMContentLoaded', () => {
  console.log("Popup DOM fully loaded and parsed.");

  if (!frontInput || !backInput || !hintInput || !tagsInput || !saveButton || !clearButton || !statusMessage || !recentFlashcardsList) {
    console.error("One or more essential DOM elements are missing!");
    if (statusMessage) {
      statusMessage.textContent = "Error: Popup UI failed to load correctly.";
      statusMessage.className = "status-msg error";
      statusMessage.style.display = "block";
    }
    return;
  }


  chrome.storage.local.get(['pendingBackText'], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Error getting pending back text:", chrome.runtime.lastError);
    } else if (result.pendingBackText) {
      console.log("Found pending back text:", result.pendingBackText);
      backInput.value = result.pendingBackText;
      frontInput.focus();

      chrome.storage.local.remove('pendingBackText', () => {
        if (chrome.runtime.lastError) {
          console.error("Error removing pending back text:", chrome.runtime.lastError);
        } else {
          console.log("Pending back text cleared from storage.");
        }
      });
    } else {
      console.log("No pending back text found.");
      frontInput.focus();
    }
  });

  loadRecentFlashcards();

  saveButton.addEventListener('click', handleSave);
  clearButton.addEventListener('click', handleClear);

  console.log("Popup initialization complete. Event listeners attached.");
});