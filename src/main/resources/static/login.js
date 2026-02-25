const KEY_TOKEN = "skillforge_access_token";
const KEY_BASE = "skillforge_api_base";
const KEY_ROLE = "skillforge_role";
const KEY_EMAIL = "skillforge_email";
const KEY_USERNAME = "skillforge_username";

const messageEl = document.getElementById("message");
const apiBaseEl = document.getElementById("apiBase");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showLoginBtn = document.getElementById("showLogin");
const showRegisterBtn = document.getElementById("showRegister");

function showMessage(data) {
  messageEl.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function parseForm(form) {
  const obj = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (value === "") continue;
    obj[key] = value;
  }
  return obj;
}

function baseUrl() {
  return (apiBaseEl.value || "").trim();
}

async function apiCall(path, method, body) {
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = text;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_error) {
    // keep raw text
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
  }
  return payload;
}

function showLogin() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  showLoginBtn.classList.add("active");
  showRegisterBtn.classList.remove("active");
}

function showRegister() {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  showRegisterBtn.classList.add("active");
  showLoginBtn.classList.remove("active");
}

showLoginBtn.addEventListener("click", showLogin);
showRegisterBtn.addEventListener("click", showRegister);

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const payload = parseForm(registerForm);
    await apiCall("/users/register", "POST", payload);
    showMessage("Registration successful. You can login now.");
    showLogin();
  } catch (error) {
    showMessage(error.message);
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const payload = parseForm(loginForm);
    const result = await apiCall("/users/login", "POST", payload);
    localStorage.setItem(KEY_TOKEN, result.accessToken || "");
    localStorage.setItem(KEY_ROLE, result.role || "");
    localStorage.setItem(KEY_EMAIL, result.email || "");
    localStorage.setItem(KEY_USERNAME, result.username || "");
    localStorage.setItem(KEY_BASE, baseUrl());
    window.location.href = "/dashboard.html";
  } catch (error) {
    showMessage(error.message);
  }
});

(function init() {
  const defaultBase = window.location.origin;
  apiBaseEl.value = localStorage.getItem(KEY_BASE) || defaultBase;
  if (localStorage.getItem(KEY_TOKEN)) {
    window.location.href = "/dashboard.html";
  }
})();
