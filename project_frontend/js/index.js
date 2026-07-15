const TASKS_API = "https://improved-space-yodel-r7gr699jrr662wwjj-5000.app.github.dev";

function getToken() {
  return localStorage.getItem("access_token");
}

async function getTasks() {
  const token = await getValidAccessToken();
  if (!token) {
    console.error("No valid access token available for task fetch");
    // Redirect to login so user can re-authenticate
    window.location.href = "/project_frontend/html/logon.html";
    return [];
  }

  const response = await fetch(`${TASKS_API}/tasks/tasks`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to fetch tasks", response.status, errorText);
    return [];
  }

  return response.json();
}
let CURRENT_EDIT_TASK_ID = null;

async function loadSubjectsIntoEditSelect() {
  const token = await getValidAccessToken();
  if (!token) return;

  const response = await fetch(`${TASKS_API}/subjects/subjects`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!response.ok) return;

  const subjects = await response.json();
  const select = document.getElementById("edit-task-subject");
  select.innerHTML = "";

  subjects.forEach(sub => {
    const option = document.createElement("option");
    option.value = sub.id;
    option.textContent = sub.name;
    select.appendChild(option);
  });
}

function openTaskEditor(id, title, description, priority_level, subject_id, due_date) {
  CURRENT_EDIT_TASK_ID = id;

  // Load subjects into the dropdown
  loadSubjectsIntoEditSelect().then(() => {
    document.getElementById("edit-task-subject").value = subject_id;
  });

  document.getElementById("edit-task-title").value = title;
  document.getElementById("edit-task-description").value = description;
  document.getElementById("edit-task-priority").value = priority_level;
  document.getElementById("edit-task-duedate").value = due_date;

    document.getElementById("task-edit-overlay").style.display = "block";
  document.getElementById("task-edit-popup").style.display = "block";
}


function closeTaskEditor() {
  document.getElementById("task-edit-popup").style.display = "none";
  document.getElementById("task-edit-overlay").style.display = "none";
  CURRENT_EDIT_TASK_ID = null;
}
async function saveTaskEdits() {
  const title = document.getElementById("edit-task-title").value.trim();
  const description = document.getElementById("edit-task-description").value.trim();
  const priority_level = parseInt(document.getElementById("edit-task-priority").value);
  const subject_id = parseInt(document.getElementById("edit-task-subject").value);
  const duedate = document.getElementById("edit-task-duedate").value.trim();
  const updated = await updateTask(CURRENT_EDIT_TASK_ID, title, description, priority_level, subject_id, duedate);

  if (updated) {
    closeTaskEditor();
    loadTasks(); // refresh your task list
  }
}

function handleCreateTask() {
  const title = document.getElementById("task-title").value;
  const description = document.getElementById("task-description").value;
  const priority_level = parseInt(document.getElementById("task-priority").value);
  const subject_id = parseInt(document.getElementById("task-subject").value);
  const due_date = document.getElementById("task-due-date").value;
  createTask(title, description, priority_level, subject_id, due_date)
    .then(() => loadTasks());
}



async function createTask(title, description, priority_level, subject_id, due_date) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.href = "/project_frontend/html/logon.html";
    return null;
  }

  // Name length restriction
  if (title.length > 100) {
    alert("Task name cannot exceed 100 characters.");
    return;
  }

  // Description length restriction
  if (description.length > 500) {
    alert("Task description cannot exceed 500 characters.");
    return;
  }

  const response = await fetch(`${TASKS_API}/tasks/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      title,
      description,
      priority_level,
      subject_id,
      due_date
    })
  });

  const data = await response.json();

  if (!response.ok) {
    document.getElementById("task-failmessage").textContent =
      data.message || "Task creation failed";
    return null;
  }
}

async function toggleTaskComplete(id, completed) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    return;
  }

  const response = await fetch(`${TASKS_API}/tasks/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ completed })
  });

  if (!response.ok) {
    alert("Failed to update task");
    return;
  }

  await loadTasks();
}
async function calculateReadyScore(id) {
  const timeinput = prompt("Estimated hours to complete this task?");
  if (timeinput === null) return; // user cancelled

  const hours = parseFloat(timeinput);
  if (isNaN(hours) || hours < 0) {
    alert("Please enter a valid number of hours.");
    return;
  }

  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    return;
  }

  const response = await fetch(`${TASKS_API}/tasks/tasks/${id}/ready-score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ timeinput: hours })
  });

  if (!response.ok) {
    alert("Failed to calculate ready score");
    return;
  }

  await loadTasks(); // refresh so the new score shows
}
async function loadTasks() {
  const tasks = await getTasks();
  const activeList = document.getElementById("task-list");
  const completedList = document.getElementById("completed-task-list");
  activeList.innerHTML = "";
  completedList.innerHTML = "";

  tasks.forEach(task => {
    const item = document.createElement("li");
    const scoreText = task.ready_score != null ? `Ready: ${task.ready_score.toFixed(1)}%` : "Ready score not calculated";

    if (task.completed) {
      item.innerHTML = `
        <s>${task.title}</s> — ${scoreText}
        <button onclick="toggleTaskComplete(${task.id}, false)">Mark Active</button>
        <button onclick="deleteTask(${task.id}).then(() => loadTasks())">Delete</button>
      `;
      completedList.appendChild(item);
    } else {
      item.innerHTML = `
        ${task.title} — ${scoreText}
        ${task.description ? task.description : ""}
        <button onclick="calculateReadyScore(${task.id})">Calculate Ready Score</button>
        <button onclick="toggleTaskComplete(${task.id}, true)">Mark Done</button>
        <button onclick="deleteTask(${task.id}).then(() => loadTasks())">Delete</button>
        <button onclick="openTaskEditor(
          ${task.id},
          '${task.title}',
          '${task.description}',
          ${task.priority_level},
          ${task.subject_id},
          '${task.due_date}'
        )">Edit</button>

      `;
      activeList.appendChild(item);
    }
  });
}
async function getTask(id) {
  const token = await getValidAccessToken();
  if (!token) {
    console.error("No valid access token available for getTask");
    return null;
  }

  const response = await fetch(`${TASKS_API}/tasks/tasks/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.error("Task not found");
    return null;
  }

  return response.json();
}

async function updateTask(id, title, description, priority_level, subject_id, duedate) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    return null;
  }

  // Title length restriction
  if (title.length > 100) {
    alert("Task name cannot exceed 100 characters.");
    return null;
  }

  // Description length restriction
  if (description.length > 500) {
    alert("Task description cannot exceed 500 characters.");
    return null;
  }

  const response = await fetch(`${TASKS_API}/tasks/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      title,
      description,
      priority_level,
      subject_id,
      due_date: duedate
    })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.message || "Failed to update task");
    return null;
  }

  return data;
}


async function deleteTask(id) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    return false;
  }

  const response = await fetch(`${TASKS_API}/tasks/tasks/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    alert("Failed to delete task");
    return false;
  }

  return true;
}

async function loadSubjectsIntoSelect() {
  const token = await getValidAccessToken();
  if (!token) {
    window.location.href = "/project_frontend/html/logon.html";
    return;
  }

  const response = await fetch(`${TASKS_API}/subjects/subjects`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!response.ok) return;

  const subjects = await response.json();
  const select = document.getElementById("task-subject");
  select.innerHTML = ""; // Clear existing

  subjects.forEach(sub => {
    const option = document.createElement("option");
    option.value = sub.id;
    option.textContent = sub.name;
    select.appendChild(option);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  loadSubjectsIntoSelect();
  loadSubjects(); // Populate assessment-subject select and assessment list
});

const quotes = [
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Change your thoughts and you change your world. — Norman Vincent Peale",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "Act as if what you do makes a difference. It does. — William James",
  "Start where you are. Use what you have. Do what you can. — Arthur Ashe",
  "The only limit to our realization of tomorrow will be our doubts of today. — Franklin D. Roosevelt",
  "The way to get started is to quit talking and begin doing.— Walt Disney",
  "A year from now you may wish you had started today. — Karen Lamb",
  "Do the best you can. No one can do more than that. — John Wooden",
  "You are never too old to set another goal or to dream a new dream. — C.S. Lewis",
  "It does not matter how slowly you go as long as you do not stop. — Confucius",
  "Success is not final, failure is not fatal: It is the courage to continue that counts. — Winston Churchill",
  "Hardships often prepare ordinary people for an extraordinary destiny. — C.S. Lewis",
  "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
  "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
  "The only person you are destined to become is the person you decide to be. — Ralph Waldo Emerson",
  "Go confidently in the direction of your dreams. Live the life you have imagined. — Henry David Thoreau",
  "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle. — Christian D. Larson",
  "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart. — Roy T. Bennett",
  "The best way to predict the future is to create it. — Peter Drucker",
  "Keep your face always toward the sunshine and shadows will fall behind you. — Walt Whitman",
  "The best way to predict the future is to create it. — Peter Drucker",
  "You must be the change you wish to see in the world. — Mahatma Gandhi",
  "What you get by achieving your goals is not as important as what you become. — Zig Ziglar",
  "Happiness is not something ready-made. It comes from your own actions. — Dalai Lama",
  "Limit your 'always' and your 'nevers'. — Amy Poehler",
  "Never bend your head. Always hold it high. Look the world straight in the eye. — Helen Keller",
  "Opportunities don't happen. You create them. — Chris Grosser",
  "Be yourself; everyone else is already taken. — Oscar Wilde",
  "The HSC is not the end of the world. — Your teachers before you get your marks"
];

  //Generate a random index based on the array length and get the random quote
const randomIndex = Math.floor(Math.random() * quotes.length);
const randomQuote = quotes[randomIndex];

document.addEventListener("DOMContentLoaded", () => {
  const quoteEl = document.getElementById("daily-quote");
  if (quoteEl) {
    quoteEl.textContent = randomQuote;
  }
});
