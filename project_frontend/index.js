// Service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/SE-Major-Project-HSC-Study-Platform/project_frontend/service-worker.js")
    .then(reg => console.log("Service Worker registered:", reg))
    .catch(err => console.error("Service Worker registration failed:", err));
}

const BASE_URL = "https://didactic-meme-qvq94rrw99wphq6r-5000.app.github.dev";

function getToken() {
  return localStorage.getItem("token");
}

// ---------------- TASK CRUD ----------------

async function getTasks() {
  const response = await fetch(`${BASE_URL}/tasks/tasks`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    console.error("Failed to fetch tasks");
    return [];
  }

  return response.json();
}

async function createTask(title, description, priority_level, subject_id) {
  const response = await fetch(`${BASE_URL}/tasks/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
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
    alert(data.message || "Failed to create task");
    return null;
  }

  return data;
}

async function getTask(id) {
  const response = await fetch(`${BASE_URL}/tasks/tasks/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    console.error("Task not found");
    return null;
  }

  return response.json();
}

async function updateTask(id, title, description) {
  const response = await fetch(`${BASE_URL}/tasks/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`
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
  const response = await fetch(`${BASE_URL}/tasks/tasks/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    alert("Failed to delete task");
    return false;
  }

  return true;
}

// ---------------- RENDERING ----------------

async function loadTasks() {
  const tasks = await getTasks();
  const container = document.getElementById("task-list");

  container.innerHTML = "";

  tasks.forEach(task => {
    const div = document.createElement("div");
    div.classList.add("task-item");

    div.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.description}</p>
      <p>Priority: ${task.priority_level}</p>
      <button onclick="deleteTask(${task.id}).then(loadTasks)">Delete</button>
    `;

    container.appendChild(div);
  });
}
