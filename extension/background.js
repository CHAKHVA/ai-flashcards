console.log("AI Flashcard Creator: Background service worker started.");

chrome.runtime.onInstalled.addListener(details => {
    console.log("Extension installed or updated:", details);
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Background: Message received", message);

    if (message.type === "OPEN_FLASHCARD_POPUP" && message.text) {
        console.log("Background: Received request to open popup for text:", message.text);

        chrome.storage.local.set({ pendingBackText: message.text }, () => {
            if (chrome.runtime.lastError) {
                console.error("Background: Error saving pending text:", chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }

            console.log("Background: Pending text saved.");

            const popupWidth = 450;
            const popupHeight = 600;

            chrome.windows.create({
                url: chrome.runtime.getURL("popup/popup.html"),
                type: "popup",
                width: popupWidth,
                height: popupHeight
            }, (window) => {
                if (chrome.runtime.lastError) {
                    console.error("Background: Error creating window:", chrome.runtime.lastError);
                    chrome.storage.local.remove('pendingBackText');
                    sendResponse({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    console.log("Background: Popup window created successfully, ID:", window.id);
                    sendResponse({ success: true, windowId: window.id });
                }
            });
        });

        return true;
    }
    else {
        console.log("Background: Received unhandled message type or missing text");
        sendResponse({ success: false, error: "Invalid message type or missing text" });
    }
});

console.log("Background: Message listener added.");