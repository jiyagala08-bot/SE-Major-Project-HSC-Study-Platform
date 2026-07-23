const PROFILE_API = "https://improved-space-yodel-r7gr699jrr662wwjj-5000.app.github.dev";

function displayProfile(profile) {
  document.getElementById("display-name").textContent = profile.name || "Not set";
  document.getElementById("display-school-year").textContent = profile.school_year ? `Year ${profile.school_year}` : "Not set";
  document.getElementById("display-birthdate").textContent = profile.birthdate ? profile.birthdate.split("T")[0] : "Not set"; 
  // Removes time component from ISO datetime strings returned by the backend.
}

async function loadProfile() {
  const token = await getValidAccessToken();
  if (!token) return; // Prevents profile fetch when session is invalid; caller handles redirect.

  const res = await fetch(`${PROFILE_API}/profile/`, {
    headers: { "Authorization": "Bearer " + token }
  });

  if (!res.ok) {
    console.error("Failed to load profile", res.status);
    return;
  }

  const profile = await res.json();
  document.getElementById("profile-name").value = profile.name || "";
  if (profile.school_year) {
    document.getElementById("profile-school-year").value = profile.school_year;
  }
  if (profile.birthdate) {
    document.getElementById("profile-birthdate").value = profile.birthdate.split("T")[0];
    // Converts backend ISO date into YYYY-MM-DD format for HTML date inputs.
  }
  displayProfile(profile);
}

async function updateProfile() {
  const name = document.getElementById("profile-name").value;
  const school_year = parseInt(document.getElementById("profile-school-year").value);
  const birthdate = document.getElementById("profile-birthdate").value;

  const token = await getValidAccessToken();
  if (!token) {
    alert("Please log in first.");
    window.location.href = "/project_frontend/html/logon.html";
    return;
  }

  const res = await fetch(`${PROFILE_API}/profile/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ name, school_year, birthdate })
  });

  if (res.ok) {
    const data = await res.json();
    displayProfile(data);
    alert("Profile updated!");
  } else {
    const data = await res.json();
    alert(data.message || "Failed to update profile");
    // Displays backend validation errors to the user.
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initializes profile and related dropdowns once the page is fully loaded.
  loadProfile();
  loadSubjects();
  loadAssessments();
});
