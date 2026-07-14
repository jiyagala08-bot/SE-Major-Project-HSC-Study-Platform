const SUBJECTS_API = "https://improved-space-yodel-r7gr699jrr662wwjj-5000.app.github.dev";

function requireLogin() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    alert("Please log in first.");
    window.location.href = "/project_frontend/html/logon.html";
    return false;
  }

  return true;
}

async function loadSubjects() {
  const token = await getValidAccessToken();

  const res = await fetch(`${SUBJECTS_API}/subjects/subjects`, {
    headers: { "Authorization": "Bearer " + token }
  });

  const subjects = await res.json();
  const list = document.getElementById("subject-list");
  list.innerHTML = "";

  // Also populate the assessment-subject select
  const select = document.getElementById("assessment-subject");
  select.innerHTML = ""; // Clear existing options

  function getDifficultyLabel(level) {
  if (level <= 3) return "Low";
  if (level <= 6) return "Medium";
  return "High";
  }


  subjects.forEach(sub => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${sub.name} (difficulty: ${getDifficultyLabel(sub.difficulty_level)} - ${sub.difficulty_level})
      <button onclick="deleteSubject(${sub.id})">Delete</button>
    `;
    list.appendChild(li);

    // Add to select
    const option = document.createElement("option");
    option.value = sub.id;
    option.textContent = sub.name;
    select.appendChild(option);
  });
}

async function deleteSubject(id) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.href = "/project_frontend/html/logon.html";
    return;
  }

  const res = await fetch(`${SUBJECTS_API}/subjects/subjects/${id}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });

  if (!res.ok) {
    alert("Failed to delete subject");
    return;
  }

  await loadSubjects(); // refresh the list so the deleted subject disappears
}

async function createSubject() {
  const name = document.getElementById("subject-name").value;
  const priority = document.getElementById("subject-priority").value;
  const token = await getValidAccessToken();
  if (!token) {
    alert("Please log in first.");
    window.location.href = "/project_frontend/html/logon.html";
    return;
  }

  const res = await fetch(`${SUBJECTS_API}/subjects/subjects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ name, difficulty_level: parseInt(priority) })
  });

  if (res.ok) {
    loadSubjects();
  } else {
    const data = await res.json();
    alert(data.message || data.msg || JSON.stringify(data));
  }
}

async function loadAssessments() {
  const token = await getValidAccessToken();

  const res = await fetch(`${SUBJECTS_API}/assessments/assessments`, {
    headers: { "Authorization": "Bearer " + token }
  });

  if (!res.ok) {
    console.error("Failed to load assessments");
    return;
  }

  const assessments = await res.json();
  const list = document.getElementById("assessment-list");
  list.innerHTML = "";

  assessments.forEach(assessment => {
    const li = document.createElement("li");
    li.textContent = `Subject ID: ${assessment.subject_id}, Mark: ${assessment.score}%, Weight: ${assessment.weight}%`;
    list.appendChild(li);
  });
}

async function createAssessment() {
  const subject_id = document.getElementById("assessment-subject").value;
  const score = document.getElementById("assessment-mark").value;
  const weight = document.getElementById("assessment-weight").value;
  const token = await getValidAccessToken();
  if (!token) {
    alert("Please log in first.");
    window.location.href = "/project_frontend/html/logon.html";
    return;
  }

  const res = await fetch(`${SUBJECTS_API}/assessments/assessments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ subject_id: parseInt(subject_id), score: parseFloat(score), weight: parseFloat(weight) })
  });

  if (res.ok) {
    loadAssessments();
  } else {
    const data = await res.json();
    alert(data.message || data.msg || JSON.stringify(data));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;

  loadSubjects();
  loadAssessments();
})
