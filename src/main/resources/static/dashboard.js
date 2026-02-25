const KEY_TOKEN = "skillforge_access_token";
const KEY_BASE = "skillforge_api_base";
const KEY_ROLE = "skillforge_role";
const KEY_EMAIL = "skillforge_email";
const KEY_USERNAME = "skillforge_username";

const outputEl = document.getElementById("output");
const metaEl = document.getElementById("meta");
const titleEl = document.getElementById("title");

const token = localStorage.getItem(KEY_TOKEN) || "";
const base = (localStorage.getItem(KEY_BASE) || window.location.origin).trim();
const role = (localStorage.getItem(KEY_ROLE) || "").toUpperCase();
const email = localStorage.getItem(KEY_EMAIL) || "";
const username = localStorage.getItem(KEY_USERNAME) || "";

if (!token) {
  window.location.href = "/";
}

function show(data) {
  outputEl.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function formToObject(form) {
  const obj = {};
  for (const [key, value] of new FormData(form).entries()) {
    if (value === "") continue;
    obj[key] = value;
  }
  return obj;
}

async function callApi(path, method, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = text;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_error) {
    // keep text
  }

  show({
    status: response.status,
    method,
    path,
    response: payload,
  });
}

function targetId() {
  const value = document.querySelector("#adminTargetForm [name='id']").value;
  if (!value) throw new Error("User ID is required.");
  return value;
}

function initRolePanels() {
  document.getElementById("learnerPanel").classList.toggle("hidden", role !== "LEARNER");
  document.getElementById("trainerPanel").classList.toggle("hidden", !(role === "TRAINER" || role === "ADMIN"));
  document.getElementById("adminPanel").classList.toggle("hidden", role !== "ADMIN");
}

document.querySelectorAll("button[data-path]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    await callApi(btn.dataset.path, btn.dataset.method);
  });
});

document.getElementById("updateMeBtn").addEventListener("click", async () => {
  const payload = formToObject(document.getElementById("updateMeForm"));
  await callApi("/users/me", "PUT", payload);
});

document.getElementById("deleteMeBtn").addEventListener("click", async () => {
  await callApi("/users/me", "DELETE");
});

document.getElementById("adminGetUserBtn").addEventListener("click", async () => {
  await callApi(`/users/admin/users/${targetId()}`, "GET");
});

document.getElementById("adminCreateBtn").addEventListener("click", async () => {
  const payload = formToObject(document.getElementById("adminPayloadForm"));
  await callApi("/users/admin/users", "POST", payload);
});

document.getElementById("adminUpdateBtn").addEventListener("click", async () => {
  const payload = formToObject(document.getElementById("adminPayloadForm"));
  await callApi(`/users/admin/users/${targetId()}`, "PUT", payload);
});

document.getElementById("adminDeleteBtn").addEventListener("click", async () => {
  await callApi(`/users/admin/users/${targetId()}`, "DELETE");
});

document.getElementById("adminRoleFilterBtn").addEventListener("click", async () => {
  const roleValue = document.querySelector("#adminTargetForm [name='role']").value;
  await callApi(`/users/admin/roles/${roleValue}/users`, "GET");
});

document.getElementById("adminStatusBtn").addEventListener("click", async () => {
  const active = document.querySelector("#adminTargetForm [name='active']").value;
  await callApi(`/users/admin/users/${targetId()}/status?active=${active}`, "PATCH");
});

document.getElementById("adminRoleBtn").addEventListener("click", async () => {
  const roleValue = document.querySelector("#adminTargetForm [name='role']").value;
  await callApi(`/users/admin/users/${targetId()}/role?role=${roleValue}`, "PATCH");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_ROLE);
  localStorage.removeItem(KEY_EMAIL);
  localStorage.removeItem(KEY_USERNAME);
  window.location.href = "/";
});

document.getElementById("meBtn").addEventListener("click", async () => {
  await callApi("/users/me", "GET");
});

titleEl.textContent = `${role || "USER"} Workspace`;
metaEl.textContent = `${username || "Unknown user"} (${email || "no email"})`;
initRolePanels();
