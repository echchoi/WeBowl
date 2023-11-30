// ------------------------------------------------------------------
// Page Constants
// ------------------------------------------------------------------
const home = "home";
const away = "away";

//
// ------------------------------------------------------------------
// Page State Variables
// ------------------------------------------------------------------
let endCount = 0;
let homeScore = 0;
let awayScore = 0;

let currentGame = null;

let sidePicked = null; // Side picked when either score is pressed
let numPressed = null; // Number key pressed on Score Panel

// Debug purpose
const width = window.innerWidth;
const height = window.innerHeight;
document.getElementById(
  "info"
).innerHTML += ` width: ${width}, height: ${height}`;

//
// ------------------------------------------------------------------
// When Document Object Model (DOM) loaded
// ------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------------
  // Add Event Listensers
  // ----------------------------------------------
  // Page show
  window.addEventListener("pageshow", refreshScores);

  // Home and Away Score
  const homeScoreLabel = document.querySelector("#home-score");
  homeScoreLabel.addEventListener("click", buttonPressed);
  const awayScoreLabel = document.querySelector("#away-score");
  awayScoreLabel.addEventListener("click", buttonPressed);

  // Scorecard Button
  const scoreCardBtn = document.querySelector("#score-card-btn__wrap");
  scoreCardBtn.addEventListener("click", buttonPressed);

  // Numpad on Score Panel
  const numPad = document.querySelector("#numpad");
  numPad.addEventListener("click", recordScore);

  // Cancel button on Score Panel
  const cancelScoreBtn = document.querySelector("#cancel-score");
  cancelScoreBtn.addEventListener("click", cancelScoreInput);

  // Confirm button on Score Panel
  const confirmScoreBtn = document.querySelector("#confirm-score");
  confirmScoreBtn.addEventListener("click", confirmScoreInput);

  //
  // ----------------------------------------------
  // Check Local Storage for saved state
  // ----------------------------------------------
  if (localStorage) {
    // Ask to delete the storage or not during the testing stage
    let confirmDelete = confirm("Delete existing Storage?");
    if (confirmDelete) {
      localStorage.removeItem("currentGame");
    }

    refreshScores();
  } else {
    // local Storage is not supported
    console.log("Error: (101) Local Storage is not supported");
  }
});

//
// ------------------------------------------------------------------
// Function: refreshScores()
// Parameter: none
// Description: Refresh scores from Local Storage
// ------------------------------------------------------------------
function refreshScores() {
  if (!localStorage) {
    console.log("Error: (101) Local Storage is not supported!");
    return;
  }

  // Retrieve result of current end
  let currentGameJSON = localStorage.getItem("currentGame");

  if (currentGameJSON) {
    currentGame = JSON.parse(currentGameJSON);
    let homeWinnings = currentGame.scores.filter((score) => score > 0);
    let awayWinnings = currentGame.scores
      .filter((score) => score < 0)
      .map((score) => -score);

    // Update Running Scores
    homeScore = homeWinnings.reduce((sum, item) => (sum += item), 0);
    awayScore = awayWinnings.reduce((sum, item) => (sum += item), 0);

    // Update End Count
    endCount = currentGame.scores.length;

    // Refresh User Interface
    refreshUI();
  } else {
    // Current Game is not found
    console.log("Current Game is not found, initialize a new one");

    // Initialize Current Game object
    currentGame = {
      gameID: _uuid(),
      date: Date.now(),
      scores: [],
    };
    console.log(`New Game created ${currentGame}`);
  }
}

//
// ------------------------------------------------------------------
// Function: refreshUI()
// Parameter: none
// Description: Refresh value of UI element
// ------------------------------------------------------------------
function refreshUI() {
  console.log(`Home Score: ${homeScore}, Away: ${awayScore}, End: ${endCount}`);
  console.log(currentGame.scores);

  const homeScoreLabel = document.querySelector("#home-score");
  const awayScoreLabel = document.querySelector("#away-score");
  const endCountLabel = document.querySelector("#end__count");

  homeScoreLabel.innerHTML = homeScore;
  awayScoreLabel.innerHTML = awayScore;
  endCountLabel.innerHTML = endCount;
}

//
// ------------------------------------------------------------------
// Function: buttonPressed(ev)
// Parameter: ev - Trigger Event
// Description: Update app status when Home score, Away
//              score or Scorecard button is pressed
// ------------------------------------------------------------------
function buttonPressed(ev) {
  //
  // According to button pressed, take corresponding action,
  // If Home score or Away score is pressed, Update App status
  // according to side picked
  // If Scorecard button is pressed, show scorecard
  switch (this.id) {
    case "home-score":
      sidePicked = home;
      openScorePad(home);
      break;
    case "away-score":
      sidePicked = away;
      openScorePad(away);
      break;
    case "score-card-btn__wrap":
      console.log("score card");
      window.location.href = "scorecard.html";
      break;
    default:
      console.log(`${ev.target.id} is pressed`);
  }
}

// ------------------------------------------------------------------
// Function: openScorePad(side)
// Parameter: side - side of score picked
// Description: Update Score Panel status, and open the
//              Panel
// ------------------------------------------------------------------
function openScorePad(side) {
  const scorePad = document.querySelector("#score-panel");
  switch (side) {
    case home:
      scorePad.classList.add(home);
      break;
    case away:
      scorePad.classList.add(away);
      break;
    default:
      console.log(
        "Error: (001) Parameter passed to openScorePad() must be 'home' or 'away'!"
      );
  }
  scorePad.showModal();
}

//
// ------------------------------------------------------------------
// Function: cancelScoreInput()
// Parameter: none
// Description: Do the cleanup job when the cancel button
//              of Score Panel is pressed
// ------------------------------------------------------------------
function cancelScoreInput() {
  console.log(this.id);
  if (this.id !== "cancel-score") {
    console.log(
      "Error: (002) cancelScoreInput is not triggered by cancel button"
    );
    return;
  }

  closeScorePanel();
}

// ------------------------------------------------------------------
// Function: confirmScoreInput()
// Parameter: none
// Description: Record score input and clean up App status
//              when confirm button of Score Panel is
//              pressed
// ------------------------------------------------------------------
function confirmScoreInput() {
  if (this.id !== "confirm-score") {
    console.log(
      "Error: (003) ConfirmScoreInput is not triggered by confirm button!"
    );
    return;
  }

  // Update game state
  const endScore = Number(numPressed.dataset.value); // Retrieve vale of number pressed
  endCount = endCount + 1; // Update End Count

  switch (sidePicked) {
    case home:
      currentGame.scores.push(endScore);
      homeScore += endScore;
      break;
    case away:
      currentGame.scores.push(-endScore);
      awayScore += endScore;
      break;
    default:
      console.log("Error: sidePicked is invalid!");
  }

  // Error Checking
  if (endCount !== currentGame.scores.length) {
    console.log(
      "Error: (004) End count and End count label are out of sync!!!"
    );
  }

  // Refresh UI
  refreshUI();
  updateStorage();
  closeScorePanel();
}

// ------------------------------------------------------------------
// Function: closeScorePanel()
// Parameter: none
// Description: Reset App status and close Score Panel
// ------------------------------------------------------------------
function closeScorePanel() {
  // Reset numpad status
  if (numPressed) {
    numPressed.classList.remove("pressed");
    numPressed = null;
  }

  // Reset score-panel status
  const scorePad = document.querySelector("#score-panel");
  scorePad.classList.remove(sidePicked);
  sidePicked = null;
  const confirmScoreBtn = document.querySelector("#confirm-score");
  confirmScoreBtn.disabled = true;
  scorePad.close();
}

// ------------------------------------------------------------------
// Function: recordScore(ev)
// Parameter: ev - Trigger event
// Description: Record the num key pressed
// ------------------------------------------------------------------
function recordScore(ev) {
  console.log(ev.target);
  if (
    !ev.target.classList.contains("num-btn") &&
    ev.target.id !== "tie-btn"
  ) {
    return;
  }

  if (numPressed) {
    numPressed.classList.remove("pressed");
  }
  numPressed = ev.target;
  console.log("hey");
  console.log(numPressed);
  console.log(numPressed.dataset.value + " is pressed");
  numPressed.classList.add("pressed");
  const confirmScoreBtn = document.querySelector("#confirm-score");
  confirmScoreBtn.disabled = false;
}

//
// ------------------------------------------------------------------
// Function: updateStorage()
// Parameter: none
// Description: Update current scores to local Storage
// ------------------------------------------------------------------
function updateStorage() {
  if (localStorage) {
    localStorage.setItem("currentGame", JSON.stringify(currentGame));
  }
}

//
// ------------------------------------------------------------------
// Function: screenRotated()
// Parameter: none
// Description: Show message when device rotated to
//              Landscape and close the message when device
//              rotated back to Portrait mode
// ------------------------------------------------------------------
function screenRotated() {
  const rotateWarning = document.querySelector("#rotate-warning");
  if (screen.orientation.type.startsWith("landscape")) {
    rotateWarning.showModal();
  } else {
    if (rotateWarning.open) {
      rotateWarning.close();
    }
  }
}

//
// ------------------------------------------------------------------
// Function: _uuid()
// Parameter: none
// Description: generate an 128-bit label UUID
// ------------------------------------------------------------------
function _uuid() {
  var d = Date.now();
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    d += performance.now(); //use high-precision timer if available
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
