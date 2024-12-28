let taskBox, input, doneBox, timerTabClickHandler;

document.addEventListener("DOMContentLoaded", () => {
    initializeElements();
    loadTasksFromStorage();
    setupEventListeners();
});

const initializeElements = () => {
    input = document.getElementById("task-input");
    taskBox = document.getElementById("task-box");
    doneBox = document.getElementById("done-box");
    timerTab = document.getElementById("timer-tab");
    input.placeholder = "Enter a task";
};

const loadTasksFromStorage = () => {
    chrome.storage.local.get(["tasks"], (result) => {
        let tasks = result.tasks || [];
        tasks.forEach(addTask);
    });
};

const setupEventListeners = () => {
    input.addEventListener("keydown", handleTaskInput);
    timerTabClickHandler = () => window.location.href = 'timer.html';
    timerTab.addEventListener("click", timerTabClickHandler);
};

const handleTaskInput = (event) => {
    if (event.code === "Enter") {
        let taskId = generateUniqueId();
        let task = { id: taskId, content: input.value, done: false };
        addTask(task);
        saveTaskToStorage(task);
        input.value = "";
    }
};

const saveTaskToStorage = (task) => {
    chrome.storage.local.get(["tasks"], (result) => {
        let tasks = result.tasks || [];
        tasks.push(task);
        chrome.storage.local.set({ tasks });
    });
};

const generateUniqueId = () => 'task-' + Date.now();

const onDone = (event) => {
    const taskElement = event.target.parentElement;
    let taskId = taskElement.getAttribute('data-id');
    chrome.storage.local.get(["tasks"], (result) => {
        let tasks = result.tasks || [];
        let task = tasks.find(t => t.id === taskId);
        if (task) {
            task.done = !task.done;
            chrome.storage.local.set({ tasks });
            updateTaskElement(taskElement, task);
        }
    });
};

const updateTaskElement = (taskElement, task) => {
    task.done ? doneBox.appendChild(taskElement) : taskBox.appendChild(taskElement);
    taskElement.querySelector(".material-icons").innerHTML = task.done ? "check_circle" : "check_circle_outline";
    taskElement.querySelector(".task-text").style.textDecoration = task.done ? "line-through" : "none";
};

const onDelete = (event) => {
    let taskElement = event.target.parentElement.parentElement;
    let taskId = taskElement.getAttribute('data-id');
    taskElement.remove();
    chrome.storage.local.get(["tasks"], (result) => {
        let tasks = result.tasks.filter(t => t.id !== taskId);
        chrome.storage.local.set({ tasks });
    });
};

const onEdit = (event) => {
    let taskElement = event.target.parentElement.parentElement;
    let taskId = taskElement.getAttribute('data-id');
    let taskText = taskElement.querySelector(".task-text");
    let controlElements = taskElement.querySelector(".task-controls");
    if (taskText) {
        let taskContent = taskText.innerHTML;
        taskText.remove();
        let inputElement = createEditInput(taskContent, taskElement, controlElements, taskId);
        taskElement.insertBefore(inputElement, controlElements);
        inputElement.focus();
    }
};

const createEditInput = (taskContent, taskElement, controlElements, taskId) => {
    let inputElement = document.createElement("input");
    inputElement.value = taskContent;
    inputElement.type = "text";
    inputElement.id = "edit-input";
    inputElement.addEventListener("keydown", (event) => {
        if (event.code === "Enter") {
            debugger;
            taskContent = inputElement.value !== "" ? inputElement.value : taskContent;
            let taskText = document.createElement("p");
            taskText.className = "task-text";
            taskText.innerHTML = taskContent;
            inputElement.parentElement.parentElement.id === "done-box" ? 
                taskText.style.textDecoration = "line-through" : 
                taskText.style.textDecoration = "none";
            inputElement.remove();
            taskElement.insertBefore(taskText, controlElements);
            updateTaskContentInStorage(taskId, taskContent);
        }
    });
    return inputElement;
};

const updateTaskContentInStorage = (taskId, taskContent) => {
    chrome.storage.local.get(["tasks"], (result) => {
        let tasks = result.tasks || [];
        let task = tasks.find(t => t.id === taskId);
        if (task) {
            task.content = taskContent;
            chrome.storage.local.set({ tasks });
        }
    });
};

const addTask = (task) => {
    const taskElement = document.createElement("div");
    taskElement.className = "task";
    taskElement.setAttribute('data-id', task.id);
    taskElement.appendChild(createButton("check_circle_outline", onDone));
    taskElement.appendChild(createTaskText(task.content));
    taskElement.appendChild(createControlElements());
    task.done ? doneBox.appendChild(taskElement) : taskBox.appendChild(taskElement);
    if (task.done) {
        taskElement.querySelector(".material-icons").innerHTML = "check_circle";
        taskElement.querySelector(".task-text").style.textDecoration = "line-through";
    }
};

const createTaskText = (content) => {
    const taskText = document.createElement("p");
    taskText.className = "task-text";
    taskText.innerHTML = content;
    return taskText;
};

const createControlElements = () => {
    const controlElements = document.createElement("div");
    controlElements.className = "task-controls";
    controlElements.appendChild(createButton("delete_outline", onDelete));
    controlElements.appendChild(createButton("edit", onEdit));
    return controlElements;
};

const createButton = (text, eventListener) => {
    const button = document.createElement("span");
    button.className = "material-icons button";
    button.innerHTML = text;
    button.addEventListener("click", eventListener);
    return button;
};