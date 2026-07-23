
async function apiRequest(url, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}


async function requireAuth() {
  try {
    const user = await apiRequest("/api/me");
    return user;
  } catch (err) {
    window.location.href = "/login.html";
  }
}

async function logout() {
  await apiRequest("/api/logout", "POST");
  window.location.href = "/login.html";
}


function ensureToastStack() {
  let stack = document.querySelector(".toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = "success") {
  const stack = ensureToastStack();
  const toast = document.createElement("div");
  const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill";
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="bi ${icon}"></i><span>${message}</span>`;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 2600);
}
