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

async function loadTasks() {
  const tasks = await getTasks();
  const activeList = document.getElementById("task-list");
  const completedList = document.getElementById("completed-task-list");
  activeList.innerHTML = "";
  completedList.innerHTML = "";

  const priorityLabels = { 1: "Low", 2: "Medium", 3: "High" };

  tasks.forEach(task => {
    const item = document.createElement("li");
    const scoreText = task.ready_score != null ? `Readiness: ${task.ready_score.toFixed(1)}%` : "Ready score not calculated";
    const priorityText = priorityLabels[task.priority_level] || "Not set";
    const dueDateText = task.due_date || "Not set";
    const detailsHtml = `
      <div class="task-details">
        <span>Priority: ${priorityText}</span>
        <span>Due: ${dueDateText}</span>
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
        <button onclick="toggleTaskComplete(${task.id}, true)">Mark Done</button>
        <button onclick="deleteTask(${task.id}).then(() => loadTasks())">Delete</button>
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
document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;
  loadTasks();});

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
