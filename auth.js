/* ================= auth.js ================= */
(function () {
  "use strict";

  const USERS_KEY = "users";
  const SESSION_KEY = "currentUser";

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function emitAuthChanged() {
    document.dispatchEvent(new CustomEvent("auth:changed"));
  }

  function getUsers() {
    return readJSON(USERS_KEY, []);
  }

  function saveUsers(users) {
    writeJSON(USERS_KEY, users);
  }

  function getSession() {
    return readJSON(SESSION_KEY, null);
  }

  function setSession(session) {
    if (!session) localStorage.removeItem(SESSION_KEY);
    else writeJSON(SESSION_KEY, session);
    emitAuthChanged();
  }

  function findUserByEmail(email) {
    const users = getUsers();
    const e = normalizeEmail(email);
    return users.find((u) => normalizeEmail(u.email) === e) || null;
  }

  function safeUser(user) {
    if (!user) return null;
    const { pass, ...rest } = user;
    return rest;
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session || !session.email) return null;
    const user = findUserByEmail(session.email);
    return safeUser(user);
  }

  function isLoggedIn() {
    return !!getCurrentUser();
  }

  function requireAuth(redirectTo = "login.html") {
    if (!isLoggedIn()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }

  function signup(payload) {
    const firstName = String(payload?.firstName || "").trim();
    const lastName = String(payload?.lastName || "").trim();
    const address = String(payload?.address || "").trim();
    const email = normalizeEmail(payload?.email);
    const pass = String(payload?.pass || "");

    if (!firstName) return { ok: false, message: "First name wajib diisi." };
    if (!lastName) return { ok: false, message: "Last name wajib diisi." };
    if (!email) return { ok: false, message: "Email wajib diisi." };
    if (pass.length < 6) return { ok: false, message: "Password minimal 6 karakter." };

    const users = getUsers();
    if (users.some((u) => normalizeEmail(u.email) === email)) {
      return { ok: false, message: "Email sudah terdaftar. Silakan login." };
    }

    const user = {
      id: "u_" + Math.random().toString(16).slice(2) + Date.now().toString(16),
      firstName,
      lastName,
      email,
      address,
      pass,
      createdAt: Date.now(),
    };

    users.push(user);
    saveUsers(users);

    setSession({ email: user.email });
    return { ok: true, user: safeUser(user) };
  }

  function login(email, pass) {
    const e = normalizeEmail(email);
    const p = String(pass || "");

    if (!e || !p) return { ok: false, message: "Email dan password wajib diisi." };

    const user = findUserByEmail(e);
    if (!user || user.pass !== p) return { ok: false, message: "Email atau password salah." };

    setSession({ email: user.email });
    return { ok: true, user: safeUser(user) };
  }

  function logout() {
    setSession(null);
  }

  function updateProfile(patch) {
    const current = getCurrentUser();
    if (!current) return { ok: false, message: "Kamu belum login." };

    const users = getUsers();
    const idx = users.findIndex((u) => normalizeEmail(u.email) === normalizeEmail(current.email));
    if (idx < 0) return { ok: false, message: "User tidak ditemukan." };

    const nextEmail = normalizeEmail(patch?.email ?? users[idx].email);
    if (!nextEmail) return { ok: false, message: "Email wajib diisi." };

    const emailChanged = normalizeEmail(users[idx].email) !== nextEmail;
    if (emailChanged && users.some((u) => normalizeEmail(u.email) === nextEmail)) {
      return { ok: false, message: "Email ini sudah dipakai akun lain." };
    }

    users[idx] = {
      ...users[idx],
      firstName: String(patch?.firstName ?? users[idx].firstName).trim(),
      lastName: String(patch?.lastName ?? users[idx].lastName).trim(),
      address: String(patch?.address ?? users[idx].address).trim(),
      email: nextEmail,
    };

    if (!users[idx].firstName) return { ok: false, message: "First name wajib diisi." };
    if (!users[idx].lastName) return { ok: false, message: "Last name wajib diisi." };

    saveUsers(users);

    setSession({ email: users[idx].email });

    return { ok: true, user: safeUser(users[idx]) };
  }

  function changePassword(currentPass, newPass, confirmPass) {
    const current = getCurrentUser();
    if (!current) return { ok: false, message: "Kamu belum login." };

    const users = getUsers();
    const idx = users.findIndex((u) => normalizeEmail(u.email) === normalizeEmail(current.email));
    if (idx < 0) return { ok: false, message: "User tidak ditemukan." };

    if (users[idx].pass !== String(currentPass || "")) {
      return { ok: false, message: "Current password salah." };
    }
    if (String(newPass || "").length < 6) {
      return { ok: false, message: "New password minimal 6 karakter." };
    }
    if (String(newPass || "") !== String(confirmPass || "")) {
      return { ok: false, message: "Confirm password tidak sama." };
    }

    users[idx].pass = String(newPass);
    saveUsers(users);
    return { ok: true };
  }

  function bindAuthButton(buttonId, options = {}) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const opts = {
      loggedOutText: options.loggedOutText ?? "Login",
      loggedInText: options.loggedInText ?? "👤",
      loggedOutHref: options.loggedOutHref ?? "login.html",
      accountHref: options.accountHref ?? "account.html",
      loggedOutClass: options.loggedOutClass ?? "login-black",
      iconClass: options.iconClass ?? "cart-btn",
    };

    function render() {
      const user = getCurrentUser();

      if (user) {
        btn.textContent = opts.loggedInText;
        btn.classList.remove(opts.loggedOutClass);
        btn.classList.add(opts.iconClass);
        btn.onclick = () => (window.location.href = opts.accountHref);
      } else {
        btn.textContent = opts.loggedOutText;
        btn.classList.add(opts.loggedOutClass);
        btn.classList.remove(opts.iconClass);
        btn.onclick = () => (window.location.href = opts.loggedOutHref);
      }
    }

    render();
    document.addEventListener("auth:changed", render);
    window.addEventListener("storage", render);
  }

  window.Auth = {
    getCurrentUser,
    isLoggedIn,
    requireAuth,
    signup,
    login,
    logout,
    updateProfile,
    changePassword,
    bindAuthButton,
  };
})();