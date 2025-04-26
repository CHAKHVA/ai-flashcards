//elements
const frontInput = document.getElementById("flashcard-front");
const backInput = document.getElementById("flashcard-back");
const hintInput = document.getElementById("flashcard-hint");
const tagInput = document.getElementById("flashcard-tags");
const saveButton = document.getElementById("save");
const clearButton = document.getElementById("clear");
const statusMsg = document.getElementById("status-msg");
const recentCardList = document.getElementById("recent-cards");

//save flashcard
function saveFlashcard() {
  const front = frontInput.value.trim();
  const back = backInput.value.trim();
  const hint = hintInput.value.trim();
  const tags = tagInput.value.trim();

  //check if either frant or back are empty + update status if they are

  if (!front || !back) {
    statusMsg.textContent = "front and back are required";
    statusMsg.style.color = "red";
    return;
  }

  //create flashcard

  const flashcard = {
    front,
    back,
    hint,
    tags: tags.split(",").map((tag) => tag.trim()),
    createdAt: new Date().toISOString(),
  };

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

saveButton.onclick = function () {
  console.log("save button clicked");
};

clearButton.onclick = function () {
  console.log("clear button clicked");
};
