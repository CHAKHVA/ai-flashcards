/**
 * @jest-environment jsdom
 */

const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

describe("popup.js tests", () => {
  let document, window;

  beforeEach(() => {
    // Load the HTML file into jsdom
    const html = fs.readFileSync(
      path.resolve(__dirname, "popup.html"),
      "utf8"
    );
    const dom = new JSDOM(html, { runScripts: "dangerously" });
    document = dom.window.document;
    window = dom.window;

    // Mock DOM elements
    global.document = document;
    global.window = window;

    // Mock required DOM elements
    global.frontInput = document.createElement("input");
    global.backInput = document.createElement("input");
    global.hintInput = document.createElement("input");
    global.tagsInput = document.createElement("input");
    global.statusMessage = document.createElement("div");
    global.recentFlashcardsList = document.createElement("ul");

    document.body.appendChild(frontInput);
    document.body.appendChild(backInput);
    document.body.appendChild(hintInput);
    document.body.appendChild(tagsInput);
    document.body.appendChild(statusMessage);
    document.body.appendChild(recentFlashcardsList);

    // Mock setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("escapeHTML should escape HTML characters", () => {
    const { escapeHTML } = require("./popup.js");
    expect(escapeHTML("<script>alert('XSS')</script>")).toBe(
      "&lt;script&gt;alert('XSS')&lt;/script&gt;"
    );
    expect(escapeHTML("Hello & Welcome")).toBe("Hello &amp; Welcome");
    expect(escapeHTML("")).toBe("");
  });

  test("showStatus should display a status message", () => {
    const { showStatus } = require("./popup.js");

    showStatus("Test message", "success");

    expect(statusMessage.textContent).toBe("Test message");
    expect(statusMessage.className).toBe("status-msg success");
    expect(statusMessage.style.display).toBe("block");

    // Fast-forward the timer
    jest.runAllTimers();

    expect(statusMessage.textContent).toBe("");
    expect(statusMessage.style.display).toBe("none");
  });

  test("clearForm should clear all input fields", () => {
    const { clearForm } = require("./popup.js");

    frontInput.value = "Front text";
    backInput.value = "Back text";
    hintInput.value = "Hint text";
    tagsInput.value = "Tag1, Tag2";

    clearForm();

    expect(frontInput.value).toBe("");
    expect(backInput.value).toBe("");
    expect(hintInput.value).toBe("");
    expect(tagsInput.value).toBe("");
  });

  test("renderRecentFlashcards should render flashcards", () => {
    const { renderRecentFlashcards } = require("./popup.js");

    const mockCards = [
      {
        front: "Front 1",
        back: "Back 1",
        hint: "Hint 1",
        tags: ["Tag1", "Tag2"],
        bucket: 1,
        timestamp: Date.now(),
      },
      {
        front: "Front 2",
        back: "Back 2",
        tags: [],
        bucket: 2,
        timestamp: Date.now(),
      },
    ];

    renderRecentFlashcards(mockCards);

    expect(recentFlashcardsList.children.length).toBe(2);
    expect(recentFlashcardsList.children[0].innerHTML).toContain("Front 1");
    expect(recentFlashcardsList.children[1].innerHTML).toContain("Front 2");
  });
});