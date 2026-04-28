// Service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("service-worker.js")
    .then(reg => console.log("Service Worker registered:", reg))
    .catch(err => console.error("Service Worker registration failed:", err));
}

const BASE_URL = "https://didactic-meme-qvq94rrw99wphq6r-5000.app.github.dev";

function getToken() {
  return localStorage.getItem("access_token");
}

async function getTasks() {
  const token = await getValidAccessToken();
  if (!token) {
    console.error("No valid access token available for task fetch");
    return [];
  }

  const response = await fetch(`${BASE_URL}/tasks/tasks`, {
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
    return null;
  }

  const response = await fetch(`${BASE_URL}/tasks/tasks`, {
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
    alert(data.message || "Failed to create task");
    return null;
  }

  return data;
}

async function getTask(id) {
  const token = await getValidAccessToken();
  if (!token) {
    console.error("No valid access token available for getTask");
    return null;
  }

  const response = await fetch(`${BASE_URL}/tasks/tasks/${id}`, {
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

  const response = await fetch(`${BASE_URL}/tasks/tasks/${id}`, {
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

  const response = await fetch(`${BASE_URL}/tasks/tasks/${id}`, {
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
  if (!token) return;

  const response = await fetch(`${BASE_URL}/subjects/subjects`, {
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
});
