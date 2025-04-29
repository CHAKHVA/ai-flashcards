if (typeof browser === "undefined") {
  var browser = chrome;
}

// Debug function
function debug(message) {
  console.log(`[Popup Debug] ${message}`);
}

// Immediately announce popup is loaded
debug("Popup script loaded");

// Listen for messages from the content script
window.addEventListener("message", (event) => {
  debug(`Received message: ${JSON.stringify(event.data)}`);
  
  if (event.data && event.data.type === "setSelectedText") {
    debug(`Setting selected text: ${event.data.text.substring(0, 20)}${event.data.text.length > 20 ? '...' : ''}`);
    document.getElementById("flashcard-front").value = event.data.text;
    
    // Confirm receipt back to content script if possible
    if (event.ports && event.ports[0]) {
      debug("Sending receipt confirmation");
      event.ports[0].postMessage({ status: "received" });
    }
  }
});

// Initialize when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  debug("DOM loaded, initializing...");
  
  // Get DOM elements
  const frontInput = document.getElementById("flashcard-front");
  const backInput = document.getElementById("flashcard-back");
  const hintInput = document.getElementById("flashcard-hint");
  const tagsInput = document.getElementById("flashcard-tag");
  const saveButton = document.getElementById("save");
  const clearButton = document.getElementById("clear");
  const statusMessage = document.getElementById("status-msg");
  const recentFlashcards = document.getElementById("list-cards");
  
  debug("DOM elements status: " + JSON.stringify({
    frontInput: !!frontInput,
    backInput: !!backInput,
    hintInput: !!hintInput,
    tagsInput: !!tagsInput,
    saveButton: !!saveButton,
    clearButton: !!clearButton,
    statusMessage: !!statusMessage,
    recentFlashcards: !!recentFlashcards
  }));

  if (!frontInput || !backInput || !tagsInput || !saveButton) {
    debug("Missing required DOM elements - popup functionality might not work properly");
    if (statusMessage) {
      statusMessage.textContent = "Error: Some UI elements not found";
      statusMessage.style.color = "red";
      statusMessage.style.display = "block";
    }
    return;
  }

  // Save flashcard
  saveButton.addEventListener("click", () => {
    debug("Save button clicked");
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    const hint = hintInput ? hintInput.value.trim() : "";
    const tags = tagsInput.value.trim().split(",").map(tag => tag.trim()).filter(tag => tag);
    
    debug(`Form values: ${JSON.stringify({ front, back, hint, tags })}`);

    if (!front || !back) {
      debug("Validation failed - missing front or back");
      showStatus("Please fill in both front and back of the flashcard", "error");
      return;
    }

    // Get existing flashcards
    chrome.storage.local.get("flashcards", (result) => {
      debug(`Retrieved existing flashcards: ${result.flashcards ? result.flashcards.length : 0} cards`);
      const flashcards = result.flashcards || [];
      
      // Add new flashcard
      const newCard = {
        front,
        back,
        hint,
        tags,
        createdAt: new Date().toISOString()
      };
      
      flashcards.push(newCard);
      debug(`Added new flashcard: ${JSON.stringify(newCard)}`);
      
      // Save to storage
      chrome.storage.local.set({ flashcards }, () => {
        if (chrome.runtime.lastError) {
          debug(`Error saving flashcards: ${chrome.runtime.lastError.message}`);
          showStatus("Error saving flashcard", "error");
        } else {
          debug("Flashcard saved successfully");
          showStatus("Flashcard saved!", "success");
          clearForm();
          loadRecentFlashcards();
        }
      });
    });
  });

  // Clear button event listener
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      debug("Clear button clicked");
      clearForm();
      showStatus("Form cleared", "info");
    });
  }

  // Load recent flashcards
  function loadRecentFlashcards() {
    debug("Loading recent flashcards");
    chrome.storage.local.get("flashcards", (result) => {
      const flashcards = result.flashcards || [];
      debug(`Found ${flashcards.length} flashcards in storage`);
      
      // Sort by creation date (newest first)
      flashcards.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // Display recent flashcards
      if (recentFlashcards) {
        recentFlashcards.innerHTML = "";
        const recent = flashcards.slice(0, 5);
        
        if (recent.length === 0) {
          recentFlashcards.innerHTML = "<li>No flashcards created yet</li>";
        } else {
          recent.forEach((card) => {
            const cardElement = document.createElement("li");
            cardElement.innerHTML = `
              <strong>Front:</strong> ${escapeHTML(card.front)}<br>
              <strong>Back:</strong> ${escapeHTML(card.back)}
              ${card.hint ? `<br><strong>Hint:</strong> ${escapeHTML(card.hint)}` : ''}
              <br><strong>Tags:</strong> ${escapeHTML(card.tags.join(", "))}
            `;
            recentFlashcards.appendChild(cardElement);
          });
        }
      }
    });
  }

  // Helper function to escape HTML
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Clear form
  function clearForm() {
    debug("Clearing form");
    if (frontInput) frontInput.value = "";
    if (backInput) backInput.value = "";
    if (hintInput) hintInput.value = "";
    if (tagsInput) tagsInput.value = "";
  }

  // Show status message
  function showStatus(message, type = "info") {
    debug(`Showing status message (${type}): ${message}`);
    if (statusMessage) {
      statusMessage.textContent = message;
      statusMessage.className = `status-msg ${type}`;
      
      // Set color based on type
      if (type === "error") {
        statusMessage.style.color = "#e74c3c";
      } else if (type === "success") {
        statusMessage.style.color = "#2ecc71";
      } else {
        statusMessage.style.color = "#559bc0";
      }
      
      statusMessage.style.display = "block";
      
      setTimeout(() => {
        statusMessage.style.display = "none";
      }, 3000);
    }
  }

  // Initial load of recent flashcards
  loadRecentFlashcards();
  debug("Popup initialization complete");
});