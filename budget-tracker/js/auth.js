// ===== Storage helpers =====
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}
function setSession(userId) {
  sessionStorage.setItem("currentUserId", userId);
}
function getSessionUserId() {
  return sessionStorage.getItem("currentUserId");
}
function clearSession() {
  sessionStorage.removeItem("currentUserId");
}
function showMessage(text, isError = false) {
  const el = document.getElementById("message");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "crimson" : "green";
}
function makeId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ===== Route guard (dashboard protected) =====
(function guardRoutes() {
  const path = (window.location.pathname || "").toLowerCase();
  const onDashboard = path.includes("dashboard.html");

  const userId = getSessionUserId();
  if (onDashboard && !userId) window.location.href = "index.html";
})();

// ===== UI mode toggle (single form) =====
const toggleBtn = document.getElementById("toggleBtn");
const toggleText = document.getElementById("toggleText");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const confirmWrap = document.getElementById("confirmWrap");
const confirmPassword = document.getElementById("confirmPassword");
const formCard = document.getElementById("formCard");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const MODE_KEY = "authMode"; // remembers last selected form
let mode = localStorage.getItem(MODE_KEY) || "login"; // "login" or "signup"

function setMode(newMode, animate = true) {
  mode = newMode;
  localStorage.setItem(MODE_KEY, mode);

  // animation
  if (animate && formCard) {
    formCard.classList.remove("fade-in");
    formCard.classList.add("fade-out");
    setTimeout(() => {
      formCard.classList.remove("fade-out");
      applyModeUI();
      formCard.classList.add("fade-in");
    }, 180);
  } else {
    applyModeUI();
  }
}

function applyModeUI() {
  // clear message on switch
  showMessage("");

  const isSignup = mode === "signup";

  if (formTitle) formTitle.textContent = isSignup ? "Sign Up" : "Log In";
  if (submitBtn) submitBtn.textContent = isSignup ? "Create Account" : "Login";

  if (toggleText) toggleText.textContent = isSignup ? "Already have an account?" : "Don't have an account?";
  if (toggleBtn) toggleBtn.textContent = isSignup ? "Login" : "Sign Up";

  if (confirmWrap) {
    confirmWrap.classList.toggle("hidden", !isSignup);
  }
  if (confirmPassword) {
    confirmPassword.required = isSignup;
    if (!isSignup) confirmPassword.value = "";
  }

  // update placeholders if you want
  if (passwordInput) passwordInput.placeholder = isSignup ? "Password (min 8 chars)" : "Password";
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    setMode(mode === "login" ? "signup" : "login", true);
  });
}

// Apply saved mode on load
applyModeUI();

// ===== Single submit handler =====
const authForm = document.getElementById("authForm");
if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailInput?.value || "").trim().toLowerCase();
    const password = passwordInput?.value || "";

    if (!email || !password) {
      showMessage("Please enter email and password.", true);
      return;
    }

    if (mode === "signup") {
      const confirm = confirmPassword?.value || "";

      if (password.length < 8) {
        showMessage("Password must be at least 8 characters.", true);
        return;
      }
      if (password !== confirm) {
        showMessage("Passwords do not match.", true);
        return;
      }

      const users = getUsers();
      const exists = users.some((u) => u.email === email);
      if (exists) {
        showMessage("That email is already registered. Try logging in.", true);
        return;
      }

      const passwordHash = await sha256(password);
      users.push({
        id: makeId(),
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
      });
      saveUsers(users);

      showMessage("Account created ✅ Now log in.");
      authForm.reset();
      setMode("login", true);
      return;
    }

    // mode === "login"
    const users = getUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      showMessage("No account found for that email.", true);
      return;
    }

    const passwordHash = await sha256(password);
    if (passwordHash !== user.passwordHash) {
      showMessage("Incorrect password.", true);
      return;
    }

    setSession(user.id);
    window.location.href = "dashboard.html";
  });
}

// ===== Logout (works on dashboard.html) =====
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
}
