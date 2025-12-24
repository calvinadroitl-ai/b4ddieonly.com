/* ================= account.js ================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.Auth) return;

    if (!Auth.requireAuth("login.html")) return;
    Auth.bindAuthButton("authBtn", {
      loggedOutText: "Login",
      loggedInText: "👤",
      loggedOutHref: "login.html",
      accountHref: "account.html",
      loggedOutClass: "login-black",
      iconClass: "cart-btn",
    });

    const el = (id) => document.getElementById(id);

    const piName = el("piName");
    const piEmail = el("piEmail");

    const btnEdit = el("btnEdit");
    const btnChangePass = el("btnChangePass");
    const btnLogout = el("btnLogout");

    const panelEdit = el("panelEdit");
    const panelPass = el("panelPass");

    const firstName = el("firstName");
    const lastName = el("lastName");
    const email = el("email");
    const address = el("address");
    const btnSaveProfile = el("btnSaveProfile");

    const currentPassword = el("currentPassword");
    const newPassword = el("newPassword");
    const confirmPassword = el("confirmPassword");
    const btnSavePassword = el("btnSavePassword");

    function renderPersonalCard() {
      const user = Auth.getCurrentUser();
      if (!user) return;

      if (piName) piName.textContent = `${user.firstName || "-"} ${user.lastName || "-"}`.trim();
      if (piEmail) piEmail.textContent = user.email || "-";
    }

    function openPanel(which) {
      if (panelEdit) panelEdit.style.display = which === "edit" ? "block" : "none";
      if (panelPass) panelPass.style.display = which === "pass" ? "block" : "none";
    }

    function fillEditForm() {
      const user = Auth.getCurrentUser();
      if (!user) return;
      if (firstName) firstName.value = user.firstName || "";
      if (lastName) lastName.value = user.lastName || "";
      if (email) email.value = user.email || "";
      if (address) address.value = user.address || "";
    }

    renderPersonalCard();
    openPanel("edit");
    fillEditForm();

    if (btnEdit) {
      btnEdit.addEventListener("click", () => {
        openPanel("edit");
        fillEditForm();
      });
    }

    if (btnChangePass) {
      btnChangePass.addEventListener("click", () => {
        openPanel("pass");
        if (currentPassword) currentPassword.value = "";
        if (newPassword) newPassword.value = "";
        if (confirmPassword) confirmPassword.value = "";
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        Auth.logout();
        window.location.href = "home.html";
      });
    }

    if (btnSaveProfile) {
      btnSaveProfile.addEventListener("click", () => {
        const result = Auth.updateProfile({
          firstName: firstName?.value,
          lastName: lastName?.value,
          email: email?.value,
          address: address?.value,
        });

        if (!result.ok) return alert(result.message);

        renderPersonalCard();
        fillEditForm();
        alert("Profile updated.");
      });
    }

    if (btnSavePassword) {
      btnSavePassword.addEventListener("click", () => {
        const result = Auth.changePassword(
          currentPassword?.value,
          newPassword?.value,
          confirmPassword?.value
        );
        if (!result.ok) return alert(result.message);

        alert("Password changed.");
        openPanel("edit");
      });
    }
  });
})();