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

let SUBJECT_CACHE = [];

async function loadSubjects() {
  const token = await getValidAccessToken();

  const res = await fetch(`${SUBJECTS_API}/subjects/subjects`, {
    headers: { "Authorization": "Bearer " + token }
  });

  const subjects = await res.json();

  SUBJECT_CACHE = subjects;

  // Populate the assessment-subject select
  const select = document.getElementById("assessment-subject");
  if (select) {
    select.innerHTML = ""; // Clear existing options
    subjects.forEach(sub => {
      const option = document.createElement("option");
      option.value = sub.id;
      option.textContent = sub.name;
      select.appendChild(option);
    });
  }

  // Populate subject list if it exists
  const list = document.getElementById("subject-list");
  if (!list) return; // Element doesn't exist on this page
  list.innerHTML = "";

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
  
  if (!name || !priority) {
    alert("Please fill in both subject name and difficulty level");
    return;
  }
  
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
    document.getElementById("subject-name").value = "";
    document.getElementById("subject-priority").value = "";
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
    const subject = SUBJECT_CACHE.find(s => s.id === assessment.subject_id);
    const subjectName = subject ? subject.name : `Unknown (${assessment.subject_id})`;

    const li = document.createElement("li");
    li.innerHTML = `
      Subject: ${subjectName}, Mark: ${assessment.score}%, Weight: ${assessment.weight}%
      <button onclick="deleteAssessment(${assessment.id})">Delete</button>
    `;
    list.appendChild(li);
});
}

async function createAssessment() {
  const subject_id = document.getElementById("assessment-subject").value;
  const score = document.getElementById("assessment-mark").value;
  const weight = document.getElementById("assessment-weight").value;
  const due_date = document.getElementById("assessment-due-date").value;
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
      body: JSON.stringify({ subject_id: parseInt(subject_id), score: parseFloat(score), weight: parseFloat(weight), due_date })
  });

  if (res.ok) {
    loadAssessments();
  } else {
    const data = await res.json();
    alert(data.message || data.msg || JSON.stringify(data));
  }
}

async function deleteAssessment(id) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    window.location.href = "/project_frontend/html/logon.html";
    return;
  }

  const res = await fetch(`${SUBJECTS_API}/assessments/assessments/${id}`, {
    method: "DELETE",
    headers: { "Authorization": "Bearer " + token }
  });

  if (!res.ok) {
    alert("Failed to delete assessment");
    return;
  }

  await loadAssessments();
}

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;

  loadSubjects();
  loadAssessments();
})
