const API = "https://didactic-meme-qvq94rrw99wphq6r-5000.app.github.dev";

async function loadSubjects() {
  const token = await getValidAccessToken();

  const res = await fetch(`${API}/subjects/subjects`, {
    headers: { "Authorization": "Bearer " + token }
  });

  const subjects = await res.json();
  const list = document.getElementById("subject-list");
  list.innerHTML = "";

  // Also populate the assessment-subject select
  const select = document.getElementById("assessment-subject");
  select.innerHTML = ""; // Clear existing options

  subjects.forEach(sub => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${sub.name} (priority: ${sub.priority_level})
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

async function createSubject() {
  const name = document.getElementById("subject-name").value;
  const priority = document.getElementById("subject-priority").value;
  const token = await getValidAccessToken();

  const res = await fetch(`${API}/subjects/subjects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ name, priority_level: priority })
  });

  if (res.ok) {
    loadSubjects();
  } else {
    const data = await res.json();
    alert(data.message);
  }
}

async function createAssessment() {
  const subject_id = document.getElementById("assessment-subject").value;
  const score = document.getElementById("assessment-mark").value;
  const weight = document.getElementById("assessment-weight").value;
  const token = await getValidAccessToken();

  const res = await fetch(`${API}/assessments/assessments`, {
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
    alert(data.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadSubjects();
  loadAssessments();
});
