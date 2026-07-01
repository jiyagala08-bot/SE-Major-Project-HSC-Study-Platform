const AUTH_API = "https://psychic-space-funicular-q7pvrx4j7xv249v9-5000.app.github.dev";

async function signupUser() {
  if (!document.getElementById("signup-email")) return;

  const email = document.getElementById("signup-email").value;
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const cpassword = document.getElementById("signup-cpassword").value;

  if (password !== cpassword) {
    document.getElementById("signup-message").textContent = "Passwords do not match";
    return;
  }

  const response = await fetch(`${AUTH_API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password })
  });

  const data = await response.json();
  console.log('Login response', { status: response.status, body: data });

  if (response.ok) {
    document.getElementById("signup-message").textContent = "";
    document.getElementById("signup-msg").textContent = "";
    document.getElementById("signup-msg").textContent = `Signup successful! Welcome, ${username}. Please log in.`;

    setTimeout(() => {
      window.location.href = "/project_frontend/html/logon.html";
    }, 1000);
    
    document.getElementById("signup-email").value = "";
    document.getElementById("signup-username").value = "";
    document.getElementById("signup-password").value = "";
    document.getElementById("signup-cpassword").value = "";
    return;
  }
  if (data.message === "Password must be at least 8 characters long") {
    document.getElementById("signup-message").textContent = "";
    document.getElementById("signup-msg").textContent = "";
    document.getElementById("signup-message").textContent = data.message;
    return;
  }
  if (data.message === "Password must be less than 50 characters long") {
    document.getElementById("signup-message").textContent = "";
    document.getElementById("signup-msg").textContent = "";
    document.getElementById("signup-message").textContent = data.message;
    return;
  }
  if (data.message === `Invalid email format`) {
    document.getElementById("signup-message").textContent = "";
    document.getElementById("signup-msg").textContent = "";
    document.getElementById("signup-message").textContent = data.message;
    return;
  }

  if (data.message === `Invalid username format`) {
    document.getElementById("signup-message").textContent = "";
    document.getElementById("signup-msg").textContent = "";
    document.getElementById("signup-message").textContent = data.message;
    return;
  }

  if (data.message === `Password must contain at least one letter, number, and special character`) {
    document.getElementById("signup-message").textContent = "";
    document.getElementById("signup-msg").textContent = "";
    document.getElementById("signup-message").textContent = data.message;
    return;
  }

  if (data.message === `User with username ${username} or email ${email} already exists`) {
    document.getElementById("signup-message").textContent = "";
    document.getElementById("signup-msg").textContent = "";
    document.getElementById("signup-message").textContent = data.message;
    return;
  }

  document.getElementById("signup-message").textContent = data.message || "An unexpected error occurred. Please try again.";
}

async function loginUser() {
  if (!document.getElementById("login-username")) return;

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const response = await fetch(`${AUTH_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (response.ok) {
    document.getElementById("login-message").textContent = "";
    document.getElementById("login-msg").textContent = "";
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    document.getElementById("login-msg").textContent = `Login successful! Welcome back, ${username}`;
    document.getElementById("login-username").value = "";
    document.getElementById("login-password").value = "";
    window.location.href = "/project_frontend/html/home.html";
    return;
  }

  if (response.status === 401) {
    document.getElementById("login-message").textContent = "";
    document.getElementById("login-msg").textContent = "";
    document.getElementById("login-message").textContent = data.message || "Invalid username or password";
  }
}

async function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  const msg = document.getElementById("login-message");
  if (msg) msg.textContent = "Logged out";
  window.location.href = "/project_frontend/html/logon.html";
}

async function getValidAccessToken() {
  let access = localStorage.getItem("access_token");
  const refresh = localStorage.getItem("refresh_token");

  // If there's no refresh token, signal caller to redirect/login
  if (!refresh) {
    return null;
  }

  if (!access) {
    return await refreshAccessToken(refresh);
  }

  // If we have an access token, return it and let callers handle failed requests.
  return access;
}

async function refreshAccessToken(refresh) {
  try {
    const refreshResponse = await fetch(`${AUTH_API}/auth/refresh`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + refresh }
    });

    const text = await refreshResponse.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.warn('Refresh response is not JSON', text);
    }
    console.log('Refresh response', { status: refreshResponse.status, body: data || text });

    if (!refreshResponse.ok) {
      // Let caller handle logout/redirect; return null to indicate failure
      return null;
    }

    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  } catch (e) {
    console.error('Refresh token request failed', e);
    return null;
  }
}
