async function signupUser() {
  if (!document.getElementById("signup-email")) return;

  const email = document.getElementById("signup-email").value;
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const cpassword = document.getElementById("signup-cpassword").value;

  if (password !== cpassword) {
    alert("Passwords do not match");
    return;
  }

  const response = await fetch("https://didactic-meme-qvq94rrw99wphq6r-5000.app.github.dev/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password })
  });

  const data = await response.json();

  if (response.ok) {
    alert("Signup successful! Welcome, " + username);
    document.getElementById("signup-email").value = "";
    document.getElementById("signup-username").value = "";
    document.getElementById("signup-password").value = "";
    document.getElementById("signup-cpassword").value = "";
    return;
  }
  if (data.message === "Password must be at least 8 characters long") {
    alert(data.message);
    return;
  }
  if (data.message === "Password must be less than 50 characters long") {
    alert(data.message);
    return;
  }
  if (data.message === `Invalid email format`) {
    alert(data.message);
    return;
  }

  if (data.message === `Invalid username format`) {
    alert(data.message);
    return;
  }

  if (data.message === `Password must contain at least one letter, number, and special character`) {
    alert(data.message);
    return;
  }

  if (data.message === `User with username ${username} or email ${email} already exists`) {
    alert(data.message);
    return;
  }

  alert(data.message || "An unexpected error occurred. Please try again.");
}

async function loginUser() {
  if (!document.getElementById("login-username")) return;

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const response = await fetch("https://didactic-meme-qvq94rrw99wphq6r-5000.app.github.dev/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (response.ok) {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    alert("Login successful");
    document.getElementById("login-username").value = "";
    document.getElementById("login-password").value = "";
    return;
  }

  if (response.status === 401) {
    alert(data.message || "Invalid username or password");
  }
}

async function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  alert("Logged out");
  window.location.href = "/logon.html";
}

async function getValidAccessToken() {
  let access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");

  // Try using the current access token
  const test = await fetch("https://didactic-meme-qvq94rrw99wphq6r-5000.app.github.dev/tasks/tasks", {
    headers: { "Authorization": "Bearer " + access }
  });

  // If access token is still valid → return it
  if (test.status !== 401) return access;

  // Otherwise refresh it
  const refreshResponse = await fetch("https://didactic-meme-qvq94rrw99wphq6r-5000.app.github.dev/auth/refresh", {
    method: "POST",
    headers: { "Authorization": "Bearer " + refresh }
  });

  const data = await refreshResponse.json();

  if (!refreshResponse.ok) {
    alert("Session expired. Please log in again.");
    localStorage.clear();
    window.location.href = "/logon.html";
    return null;
  }

  // Save new access token
  localStorage.setItem("access_token", data.access_token);
  return data.access_token;
}
