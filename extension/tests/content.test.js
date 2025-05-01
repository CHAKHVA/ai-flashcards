/**
 * @jest-environment jsdom
 */

const { JSDOM } = require("jsdom");

describe("content.js tests", () => {
  let document, window, chromeMock;

  beforeEach(() => {
    // Set up a DOM environment
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, { url: "http://localhost" });
    document = dom.window.document;
    window = dom.window;

    // Mock the Chrome API
    chromeMock = {
      runtime: {
        sendMessage: jest.fn((message, callback) => {
          callback({ success: true });
        }),
        lastError: null,
      },
    };
    global.chrome = chromeMock;

    // Mock global variables
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("createFloatingButton should create and append a button to the DOM", () => {
    const { createFloatingButton } = require("./content.js");

    const button = createFloatingButton();
    expect(button).toBeDefined();
    expect(button.id).toBe("ai-flashcard-button");
    expect(button.textContent).toBe("Add to Flashcard");
    expect(document.body.contains(button)).toBe(true);
  });

  test("hideButton should hide the floating button", () => {
    const { createFloatingButton, hideButton } = require("./content.js");

    const button = createFloatingButton();
    button.style.display = "block";

    hideButton();
    expect(button.style.display).toBe("none");
  });

  test("showButton should position and display the floating button", () => {
    const { createFloatingButton, showButton } = require("./content.js");

    const button = createFloatingButton();
    const mockSelection = {
      rect: { left: 100, bottom: 200, width: 50, height: 20 },
    };
    global.currentSelection = mockSelection;

    showButton();

    expect(button.style.left).toBe("100px");
    expect(button.style.top).toBe("205px");
    expect(button.style.display).toBe("block");
  });

  test("mouseup event listener should show the button when text is selected", () => {
    const { createFloatingButton } = require("./content.js");

    createFloatingButton();

    const mockSelection = {
      toString: () => "Selected text",
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ left: 100, bottom: 200, width: 50, height: 20 }),
      }),
    };
    window.getSelection = jest.fn(() => mockSelection);

    const mouseupEvent = new window.Event("mouseup");
    document.dispatchEvent(mouseupEvent);

    const button = document.getElementById("ai-flashcard-button");
    expect(button.style.display).toBe("block");
  });

  test("mousedown event listener should hide the button when clicking outside", () => {
    const { createFloatingButton, hideButton } = require("./content.js");

    const button = createFloatingButton();
    button.style.display = "block";

    const mousedownEvent = new window.Event("mousedown");
    document.dispatchEvent(mousedownEvent);

    expect(button.style.display).toBe("none");
  });

  test("scroll event listener should hide the button", () => {
    const { createFloatingButton, hideButton } = require("./content.js");

    const button = createFloatingButton();
    button.style.display = "block";

    const scrollEvent = new window.Event("scroll");
    document.dispatchEvent(scrollEvent);

    expect(button.style.display).toBe("none");
  });
});