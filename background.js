let remainingTime = 1500; // 25 minutes in seconds

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({ 
        remainingTime,
        isPlaying: false,
        timerEnded: true
    });
});

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === "timerAlarm") {
        updateRemainingTime();
    }
});

function updateRemainingTime() {
    chrome.storage.local.get(["remainingTime"], function(result) {
        remainingTime = result.remainingTime - 1;
        chrome.storage.local.set({ remainingTime });

        if (remainingTime <= 0) {
            handleTimerEnd();
        }
    });
}

function handleTimerEnd() {
    chrome.alarms.clear("timerAlarm");
    chrome.storage.local.set({ 
        isPlaying: false,
        remainingTime: 1500,
        timerEnded: true
    });
    chrome.notifications.create({
        type: "basic",
        iconUrl: "images/icon128.png",
        title: "Timer Finished",
        message: "Your timer has finished!"
    });
}

function startTimer() {
    chrome.alarms.create("timerAlarm", { periodInMinutes: 1 / 60 });
}

function stopTimer() {
    chrome.alarms.clear("timerAlarm");
}

function resetTimer() {
    chrome.alarms.clear("timerAlarm");
    chrome.storage.local.set({ remainingTime: 1500 });
}

chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === "startTimer") {
        startTimer();
        chrome.storage.local.set({ isPlaying: true, timerEnded: false });
    } else if (request.action === "stopTimer") {
        stopTimer();
        chrome.storage.local.set({ isPlaying: false, timerEnded: false });
    } else if (request.action === "resetTimer") {
        resetTimer();
        chrome.storage.local.set({ isPlaying: false, timerEnded: true });
    }
});