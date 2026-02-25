const tokenField = document.getElementById("token");
const output = document.getElementById("output");
const apiBaseField = document.getElementById("apiBase");

const KEY = "skillforge_access_token";
const KEY_BASE = "skillforge_api_base";

function show(value) {
  output.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function getToken() {
  return tokenField.value.trim();
}

function setToken(token) {
  tokenField.value = token || "";
}

function toObject(form) {
  const obj = {};
  const fd = new FormData(form);
  for (const [key, value] of fd.entries()) {
    if (value === "") continue;
    if (value === "true") obj[key] = true;
    else if (value === "false") obj[key] = false;
    else obj[key] = value;
  }
  return obj;
}

async function callApi(method, url, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const base = (apiBaseField.value || "").trim();
  const fullUrl = `${base}${url}`;

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = text;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (_e) {
    // keep text
  }

  show({
    status: response.status,
    ok: response.ok,
    method,
    url: fullUrl,
    response: payload,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return payload;
}

async function run(action) {
  try {
    await action();
  } catch (error) {
    show({ error: error.message });
  }
}

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await run(async () => {
    const body = toObject(e.target);
    await callApi("POST", "/users/register", body);
  });
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await run(async () => {
    const body = toObject(e.target);
    const result = await callApi("POST", "/users/login", body);
    if (result && result.accessToken) {
      setToken(result.accessToken);
      localStorage.setItem(KEY, result.accessToken);
    }
  });
});

document.getElementById("saveTokenBtn").addEventListener("click", () => {
  localStorage.setItem(KEY, getToken());
  show("Token saved in localStorage.");
});

document.getElementById("clearTokenBtn").addEventListener("click", () => {
  setToken("");
  localStorage.removeItem(KEY);
  show("Token cleared.");
});

document.querySelectorAll("button[data-method]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    await run(async () => {
      await callApi(btn.dataset.method, btn.dataset.url);
    });
  });
});

document.getElementById("updateMeBtn").addEventListener("click", async () => {
  await run(async () => {
    const body = toObject(document.getElementById("updateMeForm"));
    await callApi("PUT", "/users/me", body);
  });
});

function targetId() {
  const id = document.querySelector("#adminUserIdForm [name='id']").value;
  if (!id) throw new Error("Admin user target ID is required.");
  return id;
}

document.getElementById("getAdminUserByIdBtn").addEventListener("click", async () => {
  await run(async () => {
    await callApi("GET", `/users/admin/users/${targetId()}`);
  });
});

document.getElementById("adminCreateBtn").addEventListener("click", async () => {
  await run(async () => {
    const body = toObject(document.getElementById("adminCreateUpdateForm"));
    await callApi("POST", "/users/admin/users", body);
  });
});

document.getElementById("adminUpdateBtn").addEventListener("click", async () => {
  await run(async () => {
    const body = toObject(document.getElementById("adminCreateUpdateForm"));
    await callApi("PUT", `/users/admin/users/${targetId()}`, body);
  });
});

document.getElementById("adminDeleteBtn").addEventListener("click", async () => {
  await run(async () => {
    await callApi("DELETE", `/users/admin/users/${targetId()}`);
  });
});

document.getElementById("adminStatusBtn").addEventListener("click", async () => {
  await run(async () => {
    const active = document.querySelector("#adminUserIdForm [name='active']").value;
    await callApi("PATCH", `/users/admin/users/${targetId()}/status?active=${active}`);
  });
});

document.getElementById("adminRoleBtn").addEventListener("click", async () => {
  await run(async () => {
    const role = document.querySelector("#adminUserIdForm [name='role']").value;
    await callApi("PATCH", `/users/admin/users/${targetId()}/role?role=${role}`);
  });
});

document.getElementById("adminUsersByRoleBtn").addEventListener("click", async () => {
  await run(async () => {
    const role = document.querySelector("#adminUserIdForm [name='role']").value;
    await callApi("GET", `/users/admin/roles/${role}/users`);
  });
});

(function init() {
  const defaultBase =
    window.location.protocol === "file:"
      ? "http://localhost:8080"
      : window.location.origin;
  apiBaseField.value = localStorage.getItem(KEY_BASE) || defaultBase;
  const stored = localStorage.getItem(KEY);
  if (stored) setToken(stored);
  apiBaseField.addEventListener("change", () => localStorage.setItem(KEY_BASE, apiBaseField.value.trim()));
  show("Ready. Register or login, then invoke secured endpoints.");
})();
