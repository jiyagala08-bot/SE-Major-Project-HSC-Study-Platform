const CALENDAR_API = "https://improved-space-yodel-r7gr699jrr662wwjj-5000.app.github.dev";

function getToken() {
  return localStorage.getItem("access_token");
}

function parseDateOnly(dateStr) {
  // Avoids timezone shift issues from new Date("YYYY-MM-DD") being parsed as UTC
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonday(date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; // shift Sunday back to previous Monday
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getBucket(dueDateStr) {
  if (!dueDateStr) return "No due date";

  const today = startOfDay(new Date());
  const due = parseDateOnly(dueDateStr);

  const thisMonday = getMonday(today);
  const thisSunday = addDays(thisMonday, 6);
  const nextMonday = addDays(thisMonday, 7);
  const nextSunday = addDays(thisMonday, 13);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const monthAfterNextStart = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  if (due < today) return "Overdue";
  if (due.getTime() === today.getTime()) return "Today";
  if (due.getTime() === addDays(today, 1).getTime()) return "Tomorrow";
  if (due >= today && due <= thisSunday) return "This Week";
  if (due >= nextMonday && due <= nextSunday) return "Next Week";
  if (due >= thisMonthStart && due < nextMonthStart) return "This Month";
  if (due >= nextMonthStart && due < monthAfterNextStart) return "Next Month";
  return "Later";
}

const BUCKET_ORDER = ["Overdue", "Today", "Tomorrow", "This Week", "Next Week", "This Month", "Next Month", "Later", "No due date"];

async function deleteTask(id) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    return false;
  }

  const response = await fetch(`${CALENDAR_API}/tasks/tasks/${id}`, {
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

async function toggleTaskComplete(id, completed) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    return;
  }

  const response = await fetch(`${CALENDAR_API}/tasks/tasks/${id}`, {
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

async function loadCalendarView() {
  const tasks = await getTasks();
  const container = document.getElementById("calendar-view");
  if (!container) return;

  const activeTasks = tasks.filter(t => !t.completed);

  if (activeTasks.length === 0) {
    container.innerHTML = ""; // clear
    const heading = document.createElement("h3");
    heading.textContent = "My Calendar";
    container.appendChild(heading);
    return;
  }

  container.innerHTML = "";

  const grouped = {};
  BUCKET_ORDER.forEach(b => grouped[b] = []);

  activeTasks.forEach(task => {
    const bucket = getBucket(task.due_date);
    grouped[bucket].push(task);
  });

  const priorityLabels = { 1: "Low", 2: "Medium", 3: "High" };

  BUCKET_ORDER.forEach(bucket => {
    const tasksInBucket = grouped[bucket];
    if (tasksInBucket.length === 0) return;

    const section = document.createElement("div");
    section.classList.add("calendar-bucket");

    const heading = document.createElement("h3");
    heading.textContent = bucket;
    section.appendChild(heading);

    const list = document.createElement("ul");

    tasksInBucket.forEach(task => {
      const li = document.createElement("li");

      const scoreText = task.ready_score != null
        ? `Readiness: ${task.ready_score.toFixed(1)}%`
        : "Ready score not calculated";

      const priorityText = priorityLabels[task.priority_level] || "Not set";

      li.innerHTML = `
        ${task.title} - ${scoreText}
        <div class="task-details">
          <span>Priority: ${priorityText}</span>
          <span>Due: ${task.due_date || "Not set"}</span>
          <span>Subject: ${task.subject_name || "No subject"}</span>
          <button onclick="toggleTaskComplete(${task.id}, true)">Mark Done</button>
          <button onclick="deleteTask(${task.id}).then(() => loadTasks())">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });

    section.appendChild(list);
    container.appendChild(section);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadCalendarView();
});
