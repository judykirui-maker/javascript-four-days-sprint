// 1. SELECT HTML ELEMENTS
const message = document.querySelector("#message");
const changeMessageButton = document.querySelector("#change-message-btn");
const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskError = document.querySelector("#task-error");
const taskList = document.querySelector("#task-list");
const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const storageMessage = document.querySelector("#storage-message");

// Check that the required HTML elements exist.
if (
  !message ||
  !changeMessageButton ||
  !taskForm ||
  !taskInput ||
  !taskError ||
  !taskList ||
  !searchInput ||
  !statusFilter ||
  !storageMessage
) {
  throw new Error("A required HTML element is missing.");
}

// 2. INITIAL TASK DATA
const sampleTasks = [
  { id: 1, title: "Read the project brief", completed: false },
  { id: 2, title: "Practice JavaScript", completed: false },
  { id: 3, title: "Complete assignment", completed: true },
  { id: 4, title: "Review my notes", completed: false },
  { id: 5, title: "Test my code", completed: false }
];

let tasks = [];
let searchQuery = "";
let currentFilter = "all";

const STORAGE_KEY = "jsSprint.tasks.v1";

// 3. CHANGE THE WELCOME MESSAGE
changeMessageButton.addEventListener("click", function () {
  message.textContent = "You clicked the button! Well done!";
});

// 4. VALIDATE TASK INPUT
function validateTaskInput(title) {
  const normalizedTitle = title.trim();

  if (normalizedTitle.length === 0) {
    return {
      valid: false,
      value: "",
      error: "Please enter a task."
    };
  }

  if (normalizedTitle.length > 80) {
    return {
      valid: false,
      value: normalizedTitle,
      error: "Your task must not exceed 80 characters."
    };
  }

  return {
    valid: true,
    value: normalizedTitle,
    error: ""
  };
}

// 5. SEARCH AND FILTER TASKS
// This function does not change the original tasks array.
function getVisibleTasks(tasks, query, status) {
  const normalizedQuery = query.trim().toLowerCase();

  return tasks.filter(function (task) {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(normalizedQuery);

    const matchesStatus =
      status === "all" ||
      (status === "open" && task.completed === false) ||
      (status === "completed" && task.completed === true);

    return matchesSearch && matchesStatus;
  });
}

// 6. SAVE TASKS TO LOCAL STORAGE
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageMessage.textContent = "Tasks saved successfully.";
    return true;
  } catch (error) {
    console.error("Could not save tasks:", error);
    storageMessage.textContent =
      "Your tasks could not be saved. Browser storage may be unavailable.";
    return false;
  }
}

// 7. CHECK WHETHER STORED TASKS ARE VALID
function isValidTask(task) {
  return (
    task !== null &&
    typeof task === "object" &&
    Number.isFinite(task.id) &&
    typeof task.title === "string" &&
    task.title.trim().length >= 1 &&
    task.title.trim().length <= 80 &&
    typeof task.completed === "boolean"
  );
}

// 8. LOAD TASKS SAFELY
function loadTasks() {
  let savedData;

  try {
    savedData = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error("Could not access browser storage:", error);
    tasks = [];
    storageMessage.textContent =
      "Browser storage is unavailable. You can still use the task manager.";
    return;
  }

  // If there is no saved data, start with five sample tasks.
  if (savedData === null) {
    tasks = sampleTasks.map(function (task) {
      return { ...task };
    });
    return;
  }

  try {
    const parsedTasks = JSON.parse(savedData);

    if (
      !Array.isArray(parsedTasks) ||
      !parsedTasks.every(isValidTask)
    ) {
      tasks = [];
      storageMessage.textContent =
        "Saved task data was invalid. A safe empty task list has been loaded.";
      return;
    }

    tasks = parsedTasks.map(function (task) {
      return {
        id: task.id,
        title: task.title.trim(),
        completed: task.completed
      };
    });
  } catch (error) {
    console.error("Could not read saved tasks:", error);
    tasks = [];
    storageMessage.textContent =
      "Saved task data was corrupted. A safe empty task list has been loaded.";
  }
}

// 9. RENDER TASKS SAFELY
function renderTasks() {
  // Clear the list before displaying updated tasks.
  taskList.textContent = "";

  const visibleTasks = getVisibleTasks(
    tasks,
    searchQuery,
    currentFilter
  );

  if (visibleTasks.length === 0) {
    const emptyMessage = document.createElement("li");

    emptyMessage.textContent =
      tasks.length === 0
        ? "No tasks yet."
        : "No matching tasks found.";

    taskList.appendChild(emptyMessage);
    return;
  }

  visibleTasks.forEach(function (task) {
    const listItem = document.createElement("li");
    listItem.classList.add("task-item");
    listItem.dataset.taskId = task.id;

    if (task.completed) {
      listItem.classList.add("completed");
    }

    // Create a checkbox for task completion.
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.dataset.action = "complete";
    checkbox.dataset.taskId = task.id;
    checkbox.setAttribute(
      "aria-label",
      "Mark " + task.title + " as completed"
    );

    // Display the task title safely.
    const title = document.createElement("span");
    title.textContent = task.title;

    // Complete button.
    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.textContent = task.completed
      ? "Mark Open"
      : "Complete";
    completeButton.dataset.action = "complete";
    completeButton.dataset.taskId = task.id;

    // Delete button.
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.taskId = task.id;

    listItem.append(
      checkbox,
      title,
      completeButton,
      deleteButton
    );

    taskList.appendChild(listItem);
  });
}

// 10. COMPLETE A TASK
function completeTask(id) {
  tasks = tasks.map(function (task) {
    if (task.id === id) {
      return {
        ...task,
        completed: !task.completed
      };
    }

    return task;
  });

  saveTasks();
  renderTasks();
}

// 11. DELETE A TASK
function deleteTask(id) {
  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });

  saveTasks();
  renderTasks();
}

// 12. EVENT DELEGATION FOR TASK BUTTONS
// One click listener handles complete and delete buttons.
taskList.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");

  if (!button || !taskList.contains(button)) {
    return;
  }

  const taskId = Number(button.dataset.taskId);

  if (!Number.isFinite(taskId)) {
    return;
  }

  if (button.dataset.action === "complete") {
    completeTask(taskId);
  }

  if (button.dataset.action === "delete") {
    deleteTask(taskId);
  }
});

// 13. HANDLE CHECKBOX CHANGES
taskList.addEventListener("change", function (event) {
  const checkbox = event.target;

  if (
    !checkbox.matches('input[type="checkbox"][data-action="complete"]')
  ) {
    return;
  }

  const taskId = Number(checkbox.dataset.taskId);

  if (!Number.isFinite(taskId)) {
    return;
  }

  tasks = tasks.map(function (task) {
    if (task.id === taskId) {
      return {
        ...task,
        completed: checkbox.checked
      };
    }

    return task;
  });

  saveTasks();
  renderTasks();
});

// 14. HANDLE SEARCH
searchInput.addEventListener("input", function () {
  searchQuery = searchInput.value;
  renderTasks();
});

// 15. HANDLE STATUS FILTER
statusFilter.addEventListener("change", function () {
  currentFilter = statusFilter.value;
  renderTasks();
});

// 16. ADD A NEW TASK USING FORMDATA
taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(taskForm);
  const titleResult = validateTaskInput(formData.get("title") || "");

  if (!titleResult.valid) {
    taskError.textContent = titleResult.error;
    taskInput.focus();
    return;
  }

  // Challenge 11: Prevent duplicate titles.
  const alreadyExists = tasks.some(function (task) {
    return (
      task.title.trim().toLowerCase() ===
      titleResult.value.toLowerCase()
    );
  });

  if (alreadyExists) {
    taskError.textContent =
      "This task already exists. Please enter a different title.";
    taskInput.focus();
    return;
  }

  const newTask = {
    id: Date.now(),
    title: titleResult.value,
    completed: false
  };

  tasks.push(newTask);

  const saved = saveTasks();

  renderTasks();

  taskForm.reset();
  taskError.textContent = saved
    ? "Task added successfully."
    : "Task added, but could not be saved.";

  taskInput.focus();
});

// 17. START THE APPLICATION
loadTasks();
renderTasks();
