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
// Local caches used to avoid repeated API calls and speed up weighted-average calculations.
let SUBJECT_CACHE = [];
let ASSESSMENT_CACHE = [];
let CURRENT_EDIT_SUBJECT_ID = null;

function openSubjectEditor(id, name, difficulty_level) {
  CURRENT_EDIT_SUBJECT_ID = id;

  document.getElementById("edit-subject-name").value = name;
  document.getElementById("edit-subject-difficulty").value = difficulty_level;

  document.getElementById("subject-edit-overlay").style.display = "block";
  document.getElementById("subject-edit-popup").style.display = "block";
}
function closeSubjectEditor() {
  document.getElementById("subject-edit-popup").style.display = "none";
  document.getElementById("subject-edit-overlay").style.display = "none";
  CURRENT_EDIT_SUBJECT_ID = null;
}

async function loadSubjects() {
  const token = await getValidAccessToken();

  const res = await fetch(`${SUBJECTS_API}/subjects/subjects`, {
    headers: { "Authorization": "Bearer " + token }
  });

  const subjects = await res.json();
  const assessRes = await fetch(`${SUBJECTS_API}/assessments/assessments`, {
    headers: { "Authorization": "Bearer " + token }
});
  const assessments = await assessRes.json();


  SUBJECT_CACHE = subjects;
  ASSESSMENT_CACHE = assessments;

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

  function getDifficultyLabel(level) { // Converts numeric difficulty into a user-friendly label for UI display.
  if (level <= 3) return "Low";
  if (level <= 6) return "Medium";
  return "High";
  }

  subjects.forEach(sub => {
  const avg = calculateSubjectWeightedAverage(sub.id);
  const avgText = avg ? `Weighted Average: ${avg}%` : "No assessments yet";

  const li = document.createElement("li");
  li.innerHTML = `
    ${sub.name} - ${avgText}
    ${avg ? `(${calculateGrade(avg)})` : ""}
    (difficulty: ${getDifficultyLabel(sub.difficulty_level)} - ${sub.difficulty_level})
    <button onclick="deleteSubject(${sub.id})">Delete</button>
    <button onclick="openSubjectEditor(
        ${sub.id},
        '${sub.name}',
        ${sub.difficulty_level}
      )">Edit</button>
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

  // Name length restriction
  if (name.length > 100) {
    alert("Task name cannot exceed 100 characters.");
    return null;
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

async function updateSubject(id, name, difficulty_level) {
  const token = await getValidAccessToken();
  if (!token) {
    alert("Session expired. Please log in again.");
    return null;
  }

  if (name.length > 100) {
    alert("Subject name cannot exceed 100 characters.");
    return null;
  }

  const res = await fetch(`${SUBJECTS_API}/subjects/subjects/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ name, difficulty_level })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Failed to update subject");
    return null;
  }
  return data;
}

async function saveSubjectEdits() {
  const name = document.getElementById("edit-subject-name").value.trim();
  const difficulty_level = parseInt(document.getElementById("edit-subject-difficulty").value);

  const updated = await updateSubject(CURRENT_EDIT_SUBJECT_ID, name, difficulty_level);

  if (updated) {
    closeSubjectEditor();
    loadSubjects();
  }
}

function calculateSubjectWeightedAverage(subjectId) {
// Computes weighted average, returns null if subject has no assessments or total weight is zero.
  const subjectAssessments = ASSESSMENT_CACHE.filter(a => a.subject_id === subjectId);

  if (subjectAssessments.length === 0) return null;

  const totalWeight = subjectAssessments.reduce((sum, a) => sum + a.weight, 0);
  if (totalWeight === 0) return null;

  const weightedAverage =
    subjectAssessments.reduce((sum, a) => sum + (a.score * a.weight), 0) /
    totalWeight;
  
  return weightedAverage.toFixed(2);
}

function calculateGrade(weightedAverage) {
  // Maps weighted average to grade bands (A–E) using fixed thresholds.
  let avg = parseFloat(weightedAverage);
  if (avg === null) return "N/A";
  if (avg >= 85) return "A";
  if (avg >= 65) return "B";
  if (avg >= 45) return "C";
  if (avg >= 25) return "D";
  return "E";
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
  ASSESSMENT_CACHE = assessments;

  const list = document.getElementById("assessment-list");
  if (!list) return; // Element doesn't exist on this page
  list.innerHTML = "";

  // Group assessments by subject_id
  const grouped = {};
  assessments.forEach(a => {
    if (!grouped[a.subject_id]) grouped[a.subject_id] = [];
    grouped[a.subject_id].push(a);
  });

  Object.keys(grouped).forEach(subjectId => {
    const subject = SUBJECT_CACHE.find(s => s.id === parseInt(subjectId));
    const subjectName = subject ? subject.name : `Unknown Subject (${subjectId})`;

  // Subject header WITH cumulative weighted score. Displays subject-level summary (cumulative weighted mark + grade) before listing individual assessments.
  const avg = calculateSubjectWeightedAverage(parseInt(subjectId));
  const avgText = avg ? ` - Cumulative Mark: ${avg}%` : "";
  const gradeText = avg ? ` - Grade: ${calculateGrade(avg)}` : "";

  const subjectHeader = document.createElement("li");
  subjectHeader.classList.add("subject-header");
  subjectHeader.innerHTML = `<strong>${subjectName}${avgText}${gradeText}</strong>`;
  list.appendChild(subjectHeader);


    // Create a nested list for assessments
    const subList = document.createElement("ul");
    subList.style.marginLeft = "20px";

    grouped[subjectId].forEach(a => {
      const li = document.createElement("li");
      li.innerHTML = `
        Mark: ${a.score}%, Weight: ${a.weight}%
        <button onclick="deleteAssessment(${a.id})">Delete</button>
      `;
      subList.appendChild(li);
    });

    list.appendChild(subList);
  });
}


async function createAssessment() {
  const subject_id = parseInt(document.getElementById("assessment-subject").value);
  const score = parseInt(document.getElementById("assessment-mark").value);
  const weight = parseInt(document.getElementById("assessment-weight").value);
  // Calculate existing total weight for this subject. Prevents total assessment weight for a subject from exceeding 100%.
  const existingWeightTotal = ASSESSMENT_CACHE
    .filter(a => a.subject_id === subject_id)
    .reduce((sum, a) => sum + a.weight, 0);

  // Check if adding this weight exceeds 100%
  if (existingWeightTotal + weight > 100) {
    alert(`Total weight for this subject cannot exceed 100%. 
  Current total: ${existingWeightTotal}%. 
  Adding ${weight}% would make it ${existingWeightTotal + weight}%.`);
  return;
}
  // MARK RESTRICTIONS
  if (isNaN(score) || score < 0 || score > 100) {
    alert("Mark must be between 0 and 100.");
    return;
  }

  // WEIGHT RESTRICTIONS
  if (isNaN(weight) || weight <= 0 || weight > 100) {
    alert("Weight must be between 0 and 100.");
    return;
  }

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
      body: JSON.stringify({ subject_id: parseInt(subject_id), score: parseFloat(score), weight: parseFloat(weight)})
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

document.addEventListener("DOMContentLoaded", async () => {
  // Initializes subject and assessment data when the page loads.
  if (!requireLogin()) return;

  await loadSubjects();
  await loadAssessments();
});
