// ------------------------------
// Global Variables
// ------------------------------

// Current Game
let currentGame = null;

//
// -----------------------------------------------------
// Link screen items and add event listener to buttons
// -----------------------------------------------------

// Retrieve Viewport height and set height of content
window.onresize = refreshViewHeight();

// Prepare content whenever page show
window.addEventListener("pageshow", getResult);

// End Rows
const endRows = document.querySelector("#end-rows");
endRows.addEventListener("long-press", openEditPanel);

// Close Button
const closeBtn = document.getElementById("close-btn");
closeBtn.addEventListener("click", () => {
  window.history.back();
});

// Change Sheet Buttons
const editSheet = document.querySelector("#edit-sheet");
const endLabel = document.querySelector("#end-label");
const scoreBefore = document.querySelector("#score__before");
const scoreAfter = document.querySelector("#score__after");
const sideSelector = document.querySelector("#side-selector");
const numPad = document.querySelector("#numpad");
const editCancelBtn = document.querySelector("#edit-cancel");
const editConfirmBtn = document.querySelector("#edit-confirm");

//
// ------------------------------------------------------------------
// Funtion: getResult
// Description: Retrieve End Results from Storage and update screen
// ------------------------------------------------------------------
function getResult() {
  // Initialize variables
  const endRows = document.getElementById("end-rows");

  // Check and retrieve end scores if exists
  if (localStorage) {
    const currentGameJSON = localStorage.getItem("currentGame");
    if (currentGameJSON === null) {
      console.log("Error: (102) Current Game is not found!");
      return;
    }
    currentGame = JSON.parse(currentGameJSON);
    console.log(currentGame); // Debug
  } else {
    // Local Storage not suggported
    console.log("Error: (101) Local Storage not supported by browser!");
  }

  // If there is End Scores records
  if (currentGame) {
    // Derive Aggregate Scores
    // -- Initiate aggregrate scores
    const endDetail = {
      end: 0,
      home: 0,
      away: 0,
      aggHome: 0,
      aggAway: 0,
    };

    // -- Initiate end rows
    endRows.innerHTML = "";

    // -- Get score details of each end
    for (let i = 0; i < currentGame.scores.length; i++) {
      const score = currentGame.scores[i];

      // Update End Count
      endDetail.end += 1;

      // Retrieve scores from each end and accumulate to aggregrate scores
      switch (true) {
        case score > 0: // home won the end
          endDetail.home = score;
          endDetail.away = 0;
          endDetail.aggHome += score;
          break;
        case score < 0: // Away team won the end
          endDetail.home = 0;
          endDetail.away = -score;
          endDetail.aggAway += -score;
          break;
        case score == 0:
          endDetail.home = 0;
          endDetail.away = 0;
          break;
      }

      // Construct End header
      let divRow = document.createElement("div");
      divRow.classList.add("end-row");

      let rowContent = `
        <p></p>
        <p class="score_200 neutral">${endDetail.end.toString()}</p>
        <p></p>       
        <p class="score_200 home">${endDetail.home.toString()}</p>
        <p class="score_200 home">${endDetail.aggHome.toString()}</p>
        <p></p>
        <p class="score_200 away">${endDetail.away.toString()}</p>
        <p class="score_200 away">${endDetail.aggAway.toString()}</p>
      `;
      divRow.innerHTML = rowContent;

      endRows.appendChild(divRow);
    }
  } else {
    console.log("No results found");
  }
}

//
// ------------------------------------------------------------------
// Funtion: saveResult
// Description: Save End Results to Storage
// ------------------------------------------------------------------
function saveResult() {
  if (!localStorage) {
    console.log("Error: (101) Local Storage not supported by browser!");
    return;
  }

  localStorage.setItem("currentGame", JSON.stringify(currentGame));
}

//
// ------------------------------------------------------------------
// Funtion: openEditPanel
// Description: Open edit panel for editing specific end
// ------------------------------------------------------------------
function openEditPanel(ev) {
  console.log(ev.target);
  let rowPicked = null;
  if (ev.target.classList.contains("end-row")) {
    rowPicked = ev.target;
  } else if (ev.target.parentNode.classList.contains("end-row")) {
    rowPicked = ev.target.parentNode;
  } else {
    ev.stopPropagation();
  }

  if (rowPicked) {
    console.log(rowPicked.children[1].innerHTML);
    editEnd(rowPicked);
  }
}

//
// ------------------------------------------------------------------
// Funtion: editEnd
// Description: show edit sheet for the picked end
// ------------------------------------------------------------------
function editEnd(endRow) {
  const editingEnd = endRow.children[1].innerHTML;

  // Set End Label
  endLabel.innerHTML = `End ${editingEnd}`;

  // Set Score before
  endScore = currentGame.scores[editingEnd - 1];
  switch (true) {
    case endScore > 0:
      scoreBefore.dataset.side = "home";
      break;
    case endScore < 0:
      scoreBefore.dataset.side = "away";
      break;
    default:
      scoreBefore.dataset.side = "tie";
  }
  scoreBefore.innerHTML = Math.abs(endScore);

  // Initialize Score After
  scoreAfter.dataset.side = "";
  scoreAfter.innerHTML = "";

  // Initialize Selector
  sideSelector.dataset.side = "";
  sideSelector.addEventListener("click", sideBtnPressed);

  // Initialize Number Pad
  numPad.numPicked = null;
  numPad.addEventListener("click", numKeyPressed);

  // Initialize Cancel Button
  editCancelBtn.addEventListener("click", cancelEdit);

  // Setup Confirm Button
  editConfirmBtn.addEventListener("click", confirmChange);
  editConfirmBtn.editedEnd = editingEnd;
  editConfirmBtn.oldScore = endScore;

  editSheet.showModal();
}

//
// ------------------------------------------------------------------
// Funtion: sideBtnPressed
// Description: One of the Side buttons is pressed, updaet side
//              buttons, numpad buttons and confirm button status
// ------------------------------------------------------------------
function sideBtnPressed(ev) {
  console.log(ev.target);
  switch (ev.target.id) {
    case "home-btn":
      // If side is not set or it was a tie before the home button is
      // pressed, enable the num keys
      if (
        sideSelector.dataset.side === "" ||
        sideSelector.dataset.side === "tie"
      ) {
        for (const numKey of numPad.children) {
          numKey.disabled = false;
        }
      }
      sideSelector.dataset.side = "home";

      // if none of the num keys is pressed, reset after score and
      // disable the confirm button, otherwise update the after score and
      // enable the confirm button
      scoreAfter.dataset.side = "home";
      if (numPad.numPicked) {
        scoreAfter.innerHTML = numPad.numPicked.dataset.value;
        editConfirmBtn.newScore = +numPad.numPicked.dataset.value;
        editConfirmBtn.disabled = false;
      } else {
        scoreAfter.innerHTML = "";
        editConfirmBtn.newScore = undefined;
        editConfirmBtn.disabled = true;
      }

      break;

    case "tie-btn":
      // If side was home or away before the tie button is pressed,
      // disable the num keys and reset the numPicked value
      if (
        sideSelector.dataset.side === "home" ||
        sideSelector.dataset.side === "away"
      ) {
        for (const numKey of numPad.children) {
          numKey.disabled = true;
        }
      }
      sideSelector.dataset.side = "tie";

      if (numPad.numPicked) {
        numPad.numPicked.classList.remove("pressed");
        numPad.numPicked = null;
      }

      // Update After-Score
      scoreAfter.dataset.side = "tie";
      scoreAfter.innerHTML = 0;

      // Enable Confirm button
      editConfirmBtn.disabled = false;
      editConfirmBtn.newScore = 0;
      break;

    case "away-btn":
      // If side is not set or it was a tie before the away button is
      // pressed, enable the num keys
      if (
        sideSelector.dataset.side === "" ||
        sideSelector.dataset.side === "tie"
      ) {
        for (const numKey of numPad.children) {
          numKey.disabled = false;
        }
      }
      sideSelector.dataset.side = "away";

      // if none of the num keys is pressed, reset after score and
      // disable the confirm button, otherwise update the after score and
      // enable the confirm button
      scoreAfter.dataset.side = "away";
      if (numPad.numPicked) {
        scoreAfter.innerHTML = numPad.numPicked.dataset.value;
        editConfirmBtn.newScore = -numPad.numPicked.dataset.value;
        editConfirmBtn.disabled = false;
      } else {
        scoreAfter.innerHTML = "";
        editConfirmBtn.newScore = undefined;
        editConfirmBtn.disabled = true;
      }

      break;
  }
}

//
// ------------------------------------------------------------------
// Funtion: numKeyPressed
// Parameter: ev - Trigger event
// Description: One of the Num key is pressed, update record the
//              num key pressed
// ------------------------------------------------------------------
function numKeyPressed(ev) {
  console.log(ev);
  if (!ev.target.classList.contains("num-btn")) {
    console.log("Event is not triggered by num keys");
    return;
  }
  if (numPad.numPicked) {
    numPad.numPicked.classList.remove("pressed");
  }
  ev.target.classList.add("pressed");
  numPad.numPicked = ev.target;

  // Update After Score
  scoreAfter.innerHTML = ev.target.dataset.value;

  // Update Confirm Button state
  switch (sideSelector.dataset.side) {
    case "home":
      editConfirmBtn.newScore = +numPad.numPicked.dataset.value;
      break;
    case "away":
      editConfirmBtn.newScore = -numPad.numPicked.dataset.value;
      break;
    case "tie":
      editConfirmBtn.newScore = 0;
  }
  editConfirmBtn.disabled = false;
}

//
// ------------------------------------------------------------------
// Funtion: cancelEdit
// Description: Cancel the edit and close Editing Panel
// ------------------------------------------------------------------
function cancelEdit() {
  console.log(this.id);
  if (this.id !== "edit-cancel") {
    console.log("Error: cancelScoreInput is not triggered by cancel button");
    return;
  }

  closeEditPanel();
}

//
// ------------------------------------------------------------------
// Funtion: confirmChange
// Description: Confirm edit changes and close Editing Panel
// ------------------------------------------------------------------
function confirmChange(ev) {
  console.log(ev);
  const editingEnd = parseInt(ev.target.editedEnd);
  console.log(`End ${editingEnd}: ${this.oldScore} => ${this.newScore}`);

  if (currentGame.logs) {
    currentGame.logs.push(Array(editingEnd, this.oldScore, this.newScore));
  } else {
    currentGame.logs = [[editingEnd, this.oldScore, this.newScore]];
  }
  currentGame.scores[editingEnd - 1] = this.newScore;

  console.log(currentGame);
  saveResult();
  closeEditPanel();
}

//
// ------------------------------------------------------------------
// Function: closeEditPanel
// Parameter: none
// Description: Reset App status and close Score Panel
// ------------------------------------------------------------------
function closeEditPanel() {
  // reset before-after data
  // scoreAfter.innerHTML = "";

  // reset Side Selector status
  sideSelector.side = "";
  sideSelector.removeEventListener("click", sideBtnPressed);
  // for (const btn of sideSelector.children) {
  //   btn.style.background = "var(--button-normal)";
  // }

  // Reset numpad state
  if (numPad.numPicked) {
    numPad.numPicked.classList.remove("pressed");
    numPad.numPicked = null;
  }
  numPad.removeEventListener("click", numKeyPressed);
  // numPad.classList.remove("home");
  // numPad.classList.remove("away");

  // Reset num keys state
  for (const numKey of numPad.children) {
    numKey.disabled = true;
  }

  // Remove Cancel button event listener
  editCancelBtn.removeEventListener("click", cancelEdit);

  // Reset Confirm Button status
  editConfirmBtn.disabled = true;
  editConfirmBtn.removeEventListener("click", confirmChange);

  const editSheet = document.querySelector("#edit-sheet");
  editSheet.close();
  getResult();
}

//
// ------------------------------------------------------------------
// Funtion: refreshViewHeight
// Description: Retrieve Viewport height and set height of content
// ------------------------------------------------------------------
function refreshViewHeight() {
  // Debug purpose
  const width = window.innerWidth;
  const height = window.innerHeight;
  document.getElementById(
    "info"
  ).innerHTML += ` width: ${width}, height: ${height}`;

  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
  console.log(vh);
}
