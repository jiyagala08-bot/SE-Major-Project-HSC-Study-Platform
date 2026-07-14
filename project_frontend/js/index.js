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

function handleCreateTask() {
  const title = document.getElementById("task-title").value;
  const description = document.getElementById("task-description").value;
  const priority_level = parseInt(document.getElementById("task-priority").value);
  const subject_id = parseInt(document.getElementById("task-subject").value);
  console.log({ title, description, priority_level, subject_id }); // DEBUG
  createTask(title, description, priority_level, subject_id)
    .then(() => loadTasks());
}


async function createTask(title, description, priority_level, subject_id) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.href = "/project_frontend/html/logon.html";
    return null;
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
      subject_id
    })
  });

  const data = await response.json();

  if (!response.ok) {
    document.getElementById("task-failmessage").textContent = data.message || "Task creation failed";
    return null;
  }

  document.getElementById("task-message").textContent = "Task created successfully!";
  return data;
}
async function loadTasks() {
  const tasks = await getTasks();
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  tasks.forEach(task => {
    const item = document.createElement("li");
    item.textContent = task.title;
    list.appendChild(item);
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

async function updateTask(id, title, description) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    return null;
  }

  const response = await fetch(`${TASKS_API}/tasks/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ title, description })
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
