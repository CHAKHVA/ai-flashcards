if (typeof browser === "undefined") {
  var browser = chrome;
}

const ADD_BUTTON_ID = "flashcard-adder-button";
const POPUP_IFRAME_ID = "flashcard-adder-popup-iframe";

// Debugging function to trace execution
function debug(message) {
  console.log(`[Flashcard Debug] ${message}`);
}

function removeExistingButton() {
  debug("Removing existing button");
  const existingButton = document.getElementById(ADD_BUTTON_ID);
  if (existingButton) {
    existingButton.remove();
  }
}

function removeExistingPopup() {
  debug("Removing existing popup");
  const existingPopup = document.getElementById(POPUP_IFRAME_ID);
  if (existingPopup) {
    existingPopup.remove();
  }
}

function createButton(x, y, text) {
  debug(`Creating button at position: ${x}, ${y}`);
  const button = document.createElement("button");
  button.id = ADD_BUTTON_ID;
  button.textContent = "Add to Flashcard";
  button.style.position = "fixed"; // Changed from absolute to fixed
  button.style.left = `${x}px`;
  button.style.top = `${y}px`;
  button.style.zIndex = "99999";
  button.style.padding = "8px 16px";
  button.style.backgroundColor = "#2a83c3";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "4px";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
  button.style.fontSize = "14px";
  button.style.fontFamily = "Arial, sans-serif";
  button.dataset.text = text;
  return button;
}

function createPopup(x, y, text) {
  debug(`Creating popup at position: ${x}, ${y}`);
  const iframe = document.createElement("iframe");
  iframe.id = POPUP_IFRAME_ID;
  
  // Get the full URL for the popup
  const popupUrl = chrome.runtime.getURL("popup/popup.html");
  debug(`Popup URL: ${popupUrl}`);
  
  iframe.style.position = "fixed"; // Changed from absolute to fixed
  iframe.style.left = `${x}px`;
  iframe.style.top = `${y + 40}px`;
  iframe.style.width = "400px";
  iframe.style.height = "500px";
  iframe.style.zIndex = "100000";
  iframe.style.border = "none";
  iframe.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  iframe.style.borderRadius = "8px";
  iframe.style.backgroundColor = "white";
  
  // Set the src after all styles are applied
  iframe.src = popupUrl;
  
  return iframe;
}

function sendMessageToPopup(iframe, text) {
  debug("Attempting to send message to popup");
  
  const messageChannel = new MessageChannel();
  const popupOrigin = chrome.runtime.getURL("").replace(/\/$/, "");
  
  // Set up a message listener for the popup to confirm receipt
  messageChannel.port1.onmessage = (event) => {
    if (event.data && event.data.status === "received") {
      debug("Message receipt confirmed by popup");
    }
  };
  
  // Use a timeout to ensure the iframe has loaded
  setTimeout(() => {
    try {
      debug("Sending postMessage to iframe");
      iframe.contentWindow.postMessage(
        { type: "setSelectedText", text: text },
        "*",
        [messageChannel.port2]
      );
    } catch (e) {
      debug(`Error sending message: ${e.message}`);
    }
  }, 500); // Increased timeout to give iframe more time to load
}

function handleSelection() {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  if (text) {
    debug(`Text selected: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`);
    
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      debug(`Selection rectangle: ${JSON.stringify({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      })}`);
      
      if (rect.width > 0 && rect.height > 0) {
        // Use viewport-relative coordinates since we're using position:fixed
        const x = rect.left;
        const y = rect.bottom + 10; // Add small offset
        
        removeExistingButton();
        removeExistingPopup();
        
        const button = createButton(x, y, text);
        document.body.appendChild(button);
        debug("Button added to document");
        
        button.addEventListener("click", (e) => {
          debug("Button clicked");
          e.stopPropagation();
          e.preventDefault();
          
          removeExistingButton();
          
          const iframe = createPopup(x, y, text);
          document.body.appendChild(iframe);
          debug("Iframe added to document");
          
          // Send message to the iframe
          sendMessageToPopup(iframe, text);
          
          // Add a global click listener to detect clicks outside the popup
          setTimeout(() => {
            document.addEventListener("click", handleGlobalClick);
          }, 100);
        });
      }
    } catch (e) {
      debug(`Error processing selection: ${e.message}`);
    }
  } else {
    removeExistingButton();
    removeExistingPopup();
  }
}

function handleGlobalClick(e) {
  const popup = document.getElementById(POPUP_IFRAME_ID);
  const button = document.getElementById(ADD_BUTTON_ID);
  
  if (!popup) return;
  
  // Check if the click is inside the popup or button
  const clickedPopup = e.target === popup || popup.contains(e.target);
  const clickedButton = button && (e.target === button || button.contains(e.target));
  
  if (!clickedPopup && !clickedButton) {
    debug("Click outside detected");
    removeExistingPopup();
    document.removeEventListener("click", handleGlobalClick);
  }
}

// Event listeners
document.addEventListener("mouseup", handleSelection);

// Cleanup when page becomes hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    debug("Page hidden, cleaning up");
    removeExistingButton();
    removeExistingPopup();
    document.removeEventListener("click", handleGlobalClick);
  }
});

// Cleanup when navigating away
window.addEventListener("beforeunload", () => {
  debug("Page unloading, cleaning up");
  removeExistingButton();
  removeExistingPopup();
  document.removeEventListener("click", handleGlobalClick);
});

debug("Flashcard adder content script loaded.");