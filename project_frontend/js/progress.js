const TASKS_API = "https://improved-space-yodel-r7gr699jrr662wwjj-5000.app.github.dev";

function getToken() {
  return localStorage.getItem("access_token");
}

let CURRENT_EDIT_TASK_ID = null;

function showError(message) {
  const el = document.getElementById("global-error");
  if (!el) return alert(message); // fallback
  el.textContent = message;
  el.style.display = "block";

  clearTimeout(window._errorTimeout);
  window._errorTimeout = setTimeout(() => {
    el.style.display = "none";
  }, 5000);
}

async function getTasks() {
  const token = await getValidAccessToken();
  if (!token) {
    showError("Session expired. Please log in again.");
    window.location.href = "/project_frontend/html/logon.html";
    return null;
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
    showError("Failed to get tasks.");
    return [];
  }

  return response.json();
}

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
  const hours = parseFloat(document.getElementById("edit-task-hours").value);

  const updated = await updateTask(CURRENT_EDIT_TASK_ID, title, description, priority_level, subject_id, duedate);

  if (updated) {
    // recalc ready score automatically
    await calculateReadyScore(CURRENT_EDIT_TASK_ID, hours);
    closeTaskEditor();
    loadTasks();
  }
}

function handleCreateTask() {
  const title = document.getElementById("task-title").value;
  const description = document.getElementById("task-description").value;
  const priority_level = parseInt(document.getElementById("task-priority").value);
  const subject_id = parseInt(document.getElementById("task-subject").value);
  const due_date = document.getElementById("task-due-date").value;
  
  createTask(title, description, priority_level, subject_id, due_date)
    .then(async (task) => {
      if (task) {
        const hours = parseFloat(document.getElementById("task-hours").value);
        await calculateReadyScore(task.id, hours);
        loadTasks();
      }
    });
}

async function createTask(title, description, priority_level, subject_id, due_date) {
  const token = await getValidAccessToken();
  if (!token) return;

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
    showError("Failed to create task.");
    return null;
  }

  return data;
}



async function toggleTaskComplete(id, completed) {
  const token = await getValidAccessToken();
  if (!token) {
    return null;
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
    showError("Failed to update task.");
    return;
  }

  await loadTasks();
}
async function calculateReadyScore(id, hours) {
  if (isNaN(hours) || hours < 0) {
    showError("Please enter a valid number of hours before calculating.");
    return;
  }

  saveHoursLocally(id, hours);
  const token = await getValidAccessToken();
  if (!token) {
    showError("Session expired. Please log in again.");
    window.location.href = "/project_frontend/html/logon.html";
    return null;
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
    showError("Failed to calculate ready score");
    return;
  }

  await loadTasks();
}

function recommendTask(tasks) {
  if (!tasks || tasks.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];

  // 1. Overdue tasks (due date < today)
  const overdue = tasks.filter(t => !t.completed && t.due_date && t.due_date < today);
  if (overdue.length > 0) {
    return overdue[0]; // earliest overdue task
  }

  // 2. Tasks due today
  const dueToday = tasks.filter(t => !t.completed && t.due_date === today);
  if (dueToday.length > 0) {
    return dueToday[0];
  }

  // 3. Fallback: first active task in the ordered list
  const active = tasks.filter(t => !t.completed);
  if (active.length > 0) {
    return active[0];
  }
  return null;
}

async function loadTasks() {
  const tasks = await getTasks();
  const recommended = recommendTask(tasks);

  if (recommended) {
    console.log("Recommended task: ", recommended.title);
   // You can display it anywhere in your UI:
    const recEl = document.getElementById("recommended-task");
   if (recEl) {
    recEl.textContent = `Recommend completing: ${recommended.title}`;
  }
}

  // Auto-refresh ready scores for active tasks with saved hours
  for (const task of tasks) {
    if (!task.completed) {
      const savedHours = parseFloat(getSavedHours(task.id));
      if (!isNaN(savedHours)) {
        await calculateReadyScoreSilent(task.id, savedHours);
      }
    }
  }
  
  const refreshedTasks = await getTasks();

  const activeList = document.getElementById("task-list");
  const completedList = document.getElementById("completed-task-list");
  activeList.innerHTML = "";
  completedList.innerHTML = "";

  const priorityLabels = { 1: "Low", 2: "Medium", 3: "High" };

  refreshedTasks.forEach(task => {
    const item = document.createElement("li");
    const scoreText = task.ready_score != null ? `Readiness: ${task.ready_score.toFixed(1)}%` : "Ready score not calculated";
    const priorityText = priorityLabels[task.priority_level] || "Not set";
    const dueDateText = task.due_date || "Not set";
    const hoursText = getSavedHours(task.id) || "Not set";

    const detailsHtml = `
      <div class="task-details">
        <span>Priority: ${priorityText}</span>
        <span>Due: ${dueDateText}</span>
        <span>Est. hours: ${hoursText}</span>
        <span>Subject: ${task.subject_name || "No subject"}</span>
      </div>
    `;
    const descHtml = `
      <div class="task-desc">
        <span>Description: ${task.description ? task.description : "No description"}</span>
      </div>
    `;

    if (task.completed) {
      item.innerHTML = `
        <s>${task.title}</s> - ${scoreText}
        ${detailsHtml}
        ${descHtml}
        <button onclick="toggleTaskComplete(${task.id}, false)">Mark Active</button>
        <button onclick="deleteTask(${task.id}).then(() => loadTasks())">Delete</button>
      `;
      completedList.appendChild(item);
    } else {
      item.innerHTML = `
        ${task.title} - ${scoreText}
        ${detailsHtml}
        ${descHtml}
        <button onclick="calculateReadyScore(${task.id}, parseFloat(getSavedHours(${task.id})))">Calculate Ready Score</button>
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
async function calculateReadyScoreSilent(id, hours) {
  const token = await getValidAccessToken();
  if (!token) return;

  await fetch(`${TASKS_API}/tasks/tasks/${id}/ready-score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ timeinput: hours })
  });
}
async function deleteTask(id) {
  const token = await getValidAccessToken();
  if (!token) {
    return false;
  }

  const response = await fetch(`${TASKS_API}/tasks/tasks/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) {
    showError("Failed to delete task");
    return false;
  }

  return true;
}

async function updateTask(id, title, description, priority_level, subject_id, duedate) {
  const token = await getValidAccessToken();
  if (!token) {
    return null;
  }

  // Title length restriction
  if (title.length > 100) {
    showError("Task name cannot exceed 100 characters.");
    return null;
  }

  // Description length restriction
  if (description.length > 500) {
    showError("Task description cannot exceed 500 characters.");
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
  return data;
}

async function loadSubjectsIntoSelect() {
  const token = await getValidAccessToken();
  if (!token) {
    return null;
  }

  const response = await fetch(`${TASKS_API}/subjects/subjects`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!response.ok) return;

  const subjects = await response.json();
  const select = document.getElementById("task-subject");
  if (!select) return;
  select.innerHTML = "";

  subjects.forEach(sub => {
    const option = document.createElement("option");
    option.value = sub.id;
    option.textContent = sub.name;
    select.appendChild(option);
  });
}
function saveHoursLocally(taskId, hours) {
  localStorage.setItem(`task-hours-${taskId}`, hours);
}

function getSavedHours(taskId) {
  return localStorage.getItem(`task-hours-${taskId}`) || "";
}

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  loadSubjectsIntoSelect();
  loadSubjects(); // Populate assessment-subject select and assessment list
});

async function loadProgressSummary() {
  const tasks = await getTasks();
  const summaryEl = document.getElementById("progress-summary");
  if (!summaryEl) return;

  if (!tasks || tasks.length === 0) {
    summaryEl.textContent = "No tasks yet.";
    return;
  }

  const totalReadyScore = tasks.reduce((sum, task) => {
    if (task.completed) return sum + 100;
    if (task.ready_score == null) return sum + 50;
    return sum + task.ready_score;
  }, 0);

  const percentComplete = totalReadyScore / tasks.length;
  
  // Find the progress bar element
  const progressBar = document.getElementById('my-progress-bar');
  
  // Only update if the element actually exists on the page
  if (progressBar) {
  // Format the number to 1 decimal place to match your text summary
    const formattedPercent = percentComplete.toFixed(1); 
    
    progressBar.style.width = formattedPercent + "%";
    progressBar.textContent = formattedPercent + "%";
    if (percentComplete >= 100) {
    progressBar.style.backgroundColor = "#191970";
    } else if (percentComplete >= 70) {
    progressBar.style.backgroundColor = "#32CD32";
  } else if (percentComplete >= 40) {
    progressBar.style.backgroundColor = "#E2725B";
  } else {
    progressBar.style.backgroundColor = "#950606";
  }
}
    if (percentComplete < 40) {
    summaryEl.textContent = `Procrasrination at its peak.`;
    return;
  }
  if (percentComplete >= 40 && percentComplete < 70) {
    summaryEl.textContent = `Were you born for mediocrity or did that become the plan along the way?`;
    return;
  }
  if (percentComplete >= 70 && percentComplete < 100) {
    summaryEl.textContent = `There might be hope for you yet.`;
    return;
  }
  if (percentComplete === 100) {
    summaryEl.textContent = `Acceptable Progress. Any chance you forgot to add some tasks?`;
    return;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadProgressSummary();
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
