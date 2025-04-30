console.log("AI Flashcard Creator: Content script loaded.");

const ADD_BUTTON_ID = "ai-flashcard-button";
let floatingButton;
let currentSelection = null;

function createFloatingButton() {
  const button = document.createElement('button');
  button.id = ADD_BUTTON_ID;
  button.textContent = 'Add to Flashcard';
  document.body.appendChild(button);

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
      console.log("AI Flashcard Creator: Button clicked. Sending text to background:", selectedText);
      chrome.runtime.sendMessage(
        { type: "OPEN_FLASHCARD_POPUP", text: selectedText },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("AI Flashcard Creator: Error sending message:", chrome.runtime.lastError.message);
          } else {
            console.log("AI Flashcard Creator: Message sent, background responded:", response);
          }
        }
      );
      hideButton();
    } else {
      console.log("AI Flashcard Creator: No text selected when button clicked?");
      hideButton();
    }
  });
  return button;
}

function getFloatingButton() {
  if (!floatingButton) {
    floatingButton = createFloatingButton();
  }
  return floatingButton;
}

function hideButton() {
  const button = getFloatingButton();
  button.style.display = 'none';
  currentSelection = null;
}

function showButton() {
  if (!currentSelection) return;

  const button = getFloatingButton();
  const rect = currentSelection.rect;

  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollX || document.documentElement.scrollTop;

  const buttonX = rect.left + scrollX;
  const buttonY = rect.bottom + scrollY + 5;

  button.style.left = `${buttonX}px`;
  button.style.top = `${buttonY}px`;
  button.style.display = 'block';
}


document.addEventListener('mouseup', (event) => {
  if (event.target.id === ADD_BUTTON_ID || event.target.closest('input, textarea, [contenteditable=true]')) {
    return;
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    console.log("AI Flashcard Creator: Text selected:", selectedText);
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width > 0 || rect.height > 0) {
        currentSelection = { text: selectedText, rect: rect };
        setTimeout(() => {
          if (currentSelection && window.getSelection().toString().trim() === currentSelection.text) {
            showButton();
          }
        }, 50);
      } else {
        hideButton();
        currentSelection = null;
      }
    } catch (e) {
      console.error("AI Flashcard Creator: Error getting selection range/rect", e);
      hideButton();
      currentSelection = null;
    }
  } else {
    if (floatingButton && floatingButton.style.display === 'block') {
      setTimeout(hideButton, 50);
    }
    currentSelection = null;
  }
});

document.addEventListener('mousedown', (event) => {
  if (floatingButton && floatingButton.style.display === 'block' && event.target.id !== ADD_BUTTON_ID) {
    hideButton();
  }
});

document.addEventListener('scroll', () => {
  if (floatingButton && floatingButton.style.display === 'block') {
    hideButton();
  }
}, { passive: true });


console.log("AI Flashcard Creator: Event listeners added.");