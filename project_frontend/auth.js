
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
    alert("Signup successful! Welcome to your productive double life!");
    document.getElementById("signup-email").value = "";
    document.getElementById("signup-username").value = "";
    document.getElementById("signup-password").value = "";
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
    localStorage.setItem("token", data.access_token);
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
  localStorage.removeItem("token");
  alert("Logged out");
  window.location.href = "/logon.html";
}
