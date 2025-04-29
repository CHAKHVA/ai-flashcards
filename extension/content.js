// Compatibility shim
if (typeof browser === "undefined") {
  var browser = chrome;
}

console.log("workssss");

const ADD_BUTTON_ID = "flashcard-adder-button"; // ID for the injected button
const POPUP_IFRAME_ID = "flashcard-adder-popup-iframe"; // ID for the injected popup iframe

// Remove the existing button
function removeExistingButton() {
  const existingButton = document.getElementById(ADD_BUTTON_ID);
  if (existingButton) {
    existingButton.remove();
  }
}

// Remove the existing popup iframe
function removeExistingPopup() {
  const existingPopup = document.getElementById(POPUP_IFRAME_ID);
  if (existingPopup) {
    existingPopup.remove();
  }
}

/**
 * Creates and injects the "Add to Flashcard" button.
 * @param {number} x - The horizontal coordinate (pixels from left).
 * @param {number} y - The vertical coordinate (pixels from top).
 * @param {string} selectedText - The text selected by the user.
 */
function injectAddButton(x, y, selectedText) {
  removeExistingButton();
  removeExistingPopup();

  const button = document.createElement("button");
  button.textContent = "Add to Flashcard";
  button.id = ADD_BUTTON_ID;
  button.dataset.selectedText = selectedText; // Store text for the click handler

  button.style.position = "absolute";
  button.style.left = `${x}px`;
  button.style.top = `${y}px`;
  button.style.zIndex = "99999";
  button.style.padding = "5px 10px";
  button.style.backgroundColor = "#2a83c3";
  button.style.color = "white";
  button.style.border = "1px solid #184667";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";
  button.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.2)";
  button.style.fontSize = "12px";
  button.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
  button.style.transition = "background-color 0.2s ease";
  button.style.pointerEvents = "auto";

  button.onmouseover = () => {
    button.style.backgroundColor = "#184667";
  };
  button.onmouseout = () => {
    button.style.backgroundColor = "#2a83c3";
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const textToAdd = event.target.dataset.selectedText;

    // Inject the popup with selected text for the back
    injectPopup(x, y, textToAdd);

    // Remove the button after action
    removeExistingButton();
  });

  document.body.appendChild(button);
}

// Function to inject the full popup (popup.html) near the button
function injectPopup(x, y, selectedText) {
  const iframe = document.createElement("iframe");
  iframe.id = POPUP_IFRAME_ID;
  iframe.src = chrome.runtime.getURL("popup.html"); // Load the popup.html
  iframe.style.position = "absolute";
  iframe.style.left = `${x}px`;
  iframe.style.top = `${y + 35}px`; // Adjust the offset
  iframe.style.zIndex = "100000";
  iframe.style.width = "400px";
  iframe.style.height = "400px";
  iframe.style.border = "none";
  iframe.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.2)";

  document.body.appendChild(iframe);

  // Pass the selected text to the popup
  iframe.onload = function () {
    iframe.contentWindow.postMessage(
      { type: "setSelectedText", text: selectedText },
      "*"
    );
  };
}

// Listen for text selection finishing
document.addEventListener("mouseup", (event) => {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      removeExistingButton();
      removeExistingPopup();
      return;
    }

    const buttonX = rect.left + window.scrollX;
    const buttonY = rect.bottom + window.scrollY + 5;

    injectAddButton(buttonX, buttonY, selectedText);
  } else {
    removeExistingButton();
    removeExistingPopup();
  }
});

document.addEventListener("mousedown", (event) => {
  const isButtonClick = event.target.id === ADD_BUTTON_ID;
  const popupIframe = document.getElementById(POPUP_IFRAME_ID);
  const isClickInsidePopup = popupIframe?.contains(event.target);

  if (!isButtonClick && !isClickInsidePopup) {
    removeExistingButton();
    removeExistingPopup();
  }
});

console.log("[Content Script] Flashcard adder content script loaded.");
