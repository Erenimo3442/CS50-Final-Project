let minuteIncrease;
let minuteDecrease;
let secondIncrease;
let secondDecrease;

let playButton;
const taskTab = document.getElementById("task-tab");
const timerTab = document.getElementById("timer-tab");

const timerControls = document.getElementById("timer-controls");
let currentListeners = new Map(); 

document.addEventListener("DOMContentLoaded", function () {
    playButton = document.getElementById("timer-play-button");

    taskTab.addEventListener("click", () => {
        window.location.href = "popup.html";
    });

    updateTimerDisplay();
    
    setInterval(() => {
        updateTimerDisplay();
    }, 1000);

    chrome.storage.local.get(["isPlaying", "timerEnded"], (res) => {
        const timerEnded = res.timerEnded === undefined ? true : res.timerEnded;
    
        if (res.isPlaying) {
            onPlay();
        }
        else if (timerEnded) {
            addTopButtons();
            updateTimerDisplay();
            updateTimerUI(TimerState.STOPPED); 
        }
    });
    playButton.addEventListener("click", onPlay);
});

function updateTimerUI(state) {
    currentListeners.forEach((listener, element) => {
        element.removeEventListener('click', listener);
    });
    currentListeners.clear();

    timerControls.innerHTML = '';

    if (state === 'stopped') {
        debugger;
        timerControls.appendChild(playButton);
        playButton.addEventListener('click', onPlay);
        currentListeners.set(playButton, playListener);
    }
}

function createTimerButton(id, icon, handler) {
    const button = document.createElement("span");
    button.id = id;
    button.className = "material-icons";
    button.innerHTML = icon;
    button.addEventListener("click", handler);
    currentListeners.set(button, handler);
    return button;
}

const TimerState = {
    PLAYING: 'playing',
    PAUSED: 'paused',
    STOPPED: 'stopped'
};

function updateTimerState(newState) {
    chrome.storage.local.set({
        isPlaying: newState === TimerState.PLAYING,
        timerEnded: newState === TimerState.STOPPED
    }, () => {
        updateTimerUI(newState);
    });
}

const onPlay = () => {
    chrome.storage.local.set({
        isPlaying: true,
        timerEnded: false
    }, () => {
        if (minuteIncrease) minuteIncrease.remove();
        if (minuteDecrease) minuteDecrease.remove();
        if (secondIncrease) secondIncrease.remove();
        if (secondDecrease) secondDecrease.remove();

        chrome.runtime.sendMessage({ action: "startTimer" });

        playButton.remove();

        let pauseButton = document.createElement("span");
        pauseButton.id = "timer-pause-button";
        pauseButton.className = "material-icons";
        pauseButton.innerHTML = "pause";
        document.getElementById("timer-controls").appendChild(pauseButton);

        let stopButton = document.createElement("span");
        stopButton.id = "timer-stop-button";
        stopButton.className = "material-icons";
        stopButton.innerHTML = "stop";
        document.getElementById("timer-controls").appendChild(stopButton);

        pauseButton.addEventListener("click", onPause);
        stopButton.addEventListener("click", onStop);
    });
};


const onPause = () => {
    chrome.runtime.sendMessage({ action: "stopTimer" });
    updateTimerDisplay();

    document.getElementById("timer-controls").innerHTML = "";
    document.getElementById("timer-controls").appendChild(playButton);
    playButton.addEventListener("click", onPlay);
};

const onStop = () => {
    chrome.runtime.sendMessage({ action: "resetTimer" }, () => {
        updateTimerState(TimerState.STOPPED);
        addTopButtons();
        updateTimerDisplay();
    });
};

function addTopButtons() {
    chrome.storage.local.get(['isPlaying', 'timerEnded'], (result) => {
        if (!result.timerEnded || document.getElementById("minute-timer-up")) {
            return;
        }

        const minutesContainer = document.getElementById("timer-minutes").parentElement;
        const secondsContainer = document.getElementById("timer-seconds").parentElement;

        const minuteUpButton = createTimerButton("minute-timer-up", "arrow_drop_up", onMinuteIncrease);
        const minuteDownButton = createTimerButton("minute-timer-down", "arrow_drop_down", onMinuteDecrease);

        const secondUpButton = createTimerButton("second-timer-up", "arrow_drop_up", onSecondIncrease);
        const secondDownButton = createTimerButton("second-timer-down", "arrow_drop_down", onSecondDecrease);

        minutesContainer.insertBefore(minuteUpButton, minutesContainer.firstChild);
        minutesContainer.appendChild(minuteDownButton);

        secondsContainer.insertBefore(secondUpButton, secondsContainer.firstChild);
        secondsContainer.appendChild(secondDownButton);

        minuteIncrease = minuteUpButton;
        minuteDecrease = minuteDownButton;
        secondIncrease = secondUpButton;
        secondDecrease = secondDownButton;
    });
}

function onMinuteIncrease() {
    chrome.storage.local.get(["remainingTime"], (result) => {
        let remainingTime = result.remainingTime || 1500;
        remainingTime += 60;
        chrome.storage.local.set({ remainingTime: remainingTime });
        updateTimerDisplay();
    });
}

function onMinuteDecrease() {
    chrome.storage.local.get(["remainingTime"], (result) => {
        let remainingTime = result.remainingTime || 1500;
        if (Math.floor(remainingTime / 60) === 0) {
            return;
        }
        remainingTime -= 60;
        chrome.storage.local.set({ remainingTime: remainingTime });
        updateTimerDisplay();
    });
}

function onSecondIncrease() {
    chrome.storage.local.get(["remainingTime"], (result) => {
        let remainingTime = result.remainingTime || 1500;
        remainingTime += 1;
        chrome.storage.local.set({ remainingTime: remainingTime });
        updateTimerDisplay();
    });
}

function onSecondDecrease() {
    chrome.storage.local.get(["remainingTime"], (result) => {
        let remainingTime = result.remainingTime || 1500;
        if (remainingTime === 0) {
            return;
        }
        remainingTime -= 1;
        chrome.storage.local.set({ remainingTime: remainingTime });
        updateTimerDisplay();
    });
}

function updateTimerDisplay() {
    chrome.storage.local.get(["remainingTime", "timerEnded"], (result) => {
        if (result.timerEnded === true) {
            addTopButtons();
            document.getElementById("timer-controls").innerHTML = "";
            document.getElementById("timer-controls").appendChild(playButton);
            chrome.storage.local.set({ timerEnded: true });
        }
        chrome.storage.local.get(["remainingTime"], (result) => {
            let remainingTime = result.remainingTime || 1500;
            let minutes = Math.floor(remainingTime / 60);
            let seconds = remainingTime % 60;
            document.getElementById("timer-minutes").textContent = minutes.toString().padStart(2, "0");
            document.getElementById("timer-seconds").textContent = seconds.toString().padStart(2, "0");
        });
    })
};
