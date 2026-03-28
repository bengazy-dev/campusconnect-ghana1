// Sign-in, sign-out, session handling, and protected-route helpers.

(function () {
  var loginTab;
  var signupTab;
  var loginFormContainer;
  var signupFormContainer;
  var loginForm;
  var loginEmail;
  var loginPassword;
  var loginError;
  var signupForm;
  var signupName;
  var signupEmail;
  var signupPassword;
  var signupError;
  var roleSelectionStep;
  var signupFormStep;
  var roleStudentCard;
  var roleOrganizerCard;
  var backToRoleBtn;
  var roleBadge;

  var loginSubmitBtn;
  var signupSubmitBtn;

  /** @type {string|null} */
  var selectedRole = null;

  var USER_KEY = "campusconnect_user";

  function showError(el, message) {
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
  }

  function hideError(el) {
    if (!el) return;
    el.textContent = "";
    el.hidden = true;
  }

  function setLoading(button, loading) {
    if (!button) return;
    button.disabled = !!loading;
    if (button.dataset.defaultLabel == null) {
      button.dataset.defaultLabel = button.textContent;
    }
    if (loading) {
      button.textContent = "Please wait…";
    } else {
      button.textContent = button.dataset.defaultLabel || button.textContent;
    }
  }

  function readSession() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeSession(user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      /* ignore */
    }
  }

  function hasCompletedOnboarding() {
    try {
      return !!localStorage.getItem("campusconnect_onboarding");
    } catch (e) {
      return false;
    }
  }

  function redirectAfterLogin(user) {
    if (user.role === "student") {
      if (!hasCompletedOnboarding()) {
        window.location.href = "onboarding.html";
      } else {
        window.location.href = "index.html";
      }
    } else {
      window.location.href = "submit.html";
    }
  }

  function redirectAfterSignup(user) {
    if (user.role === "student") {
      window.location.href = "onboarding.html";
    } else {
      window.location.href = "submit.html";
    }
  }

  /**
   * TODO: Replace with InsForge auth API call.
   * @returns {Promise<object>}
   */
  function insForgeLoginPlaceholder(email, password) {
    return new Promise(function (resolve, reject) {
      console.log("[InsForge TODO] login", { email });
      window.setTimeout(function () {
        if (!email || !password) {
          reject(new Error("Invalid email or password."));
          return;
        }
        var existing = readSession();
        if (existing && existing.email === email && existing.role) {
          resolve({
            email: existing.email,
            name: existing.name || "User",
            role: existing.role,
          });
          return;
        }
        resolve({
          email: email,
          name: email.split("@")[0] || "User",
          role: "student",
        });
      }, 600);
    });
  }

  /**
   * TODO: Replace with InsForge sign-up API call.
   * @returns {Promise<object>}
   */
  function insForgeSignupPlaceholder(payload) {
    return new Promise(function (resolve, reject) {
      console.log("[InsForge TODO] signup", {
        email: payload.email,
        role: payload.role,
      });
      window.setTimeout(function () {
        if (!payload.email || !payload.password || !payload.name || !payload.role) {
          reject(new Error("Could not create account."));
          return;
        }
        resolve({
          email: payload.email,
          name: payload.name,
          role: payload.role,
        });
      }, 600);
    });
  }

  function showLoginPanel() {
    loginTab.setAttribute("aria-selected", "true");
    signupTab.setAttribute("aria-selected", "false");
    loginFormContainer.hidden = false;
    signupFormContainer.hidden = true;
    hideError(loginError);
  }

  function showSignupPanel() {
    loginTab.setAttribute("aria-selected", "false");
    signupTab.setAttribute("aria-selected", "true");
    loginFormContainer.hidden = true;
    signupFormContainer.hidden = false;
    roleSelectionStep.hidden = false;
    signupFormStep.hidden = true;
    selectedRole = null;
    roleStudentCard.classList.remove("is-selected");
    roleOrganizerCard.classList.remove("is-selected");
    roleStudentCard.setAttribute("aria-pressed", "false");
    roleOrganizerCard.setAttribute("aria-pressed", "false");
    signupForm.setAttribute("data-role", "");
    if (roleBadge) roleBadge.textContent = "";
    hideError(signupError);
  }

  function selectRole(role) {
    selectedRole = role;
    var label = role === "student" ? "Student" : "Organizer";
    signupForm.setAttribute("data-role", role);
    if (roleBadge) roleBadge.textContent = "Role: " + label;
    roleSelectionStep.hidden = true;
    signupFormStep.hidden = false;
    roleStudentCard.classList.toggle("is-selected", role === "student");
    roleOrganizerCard.classList.toggle("is-selected", role === "organizer");
    roleStudentCard.setAttribute("aria-pressed", role === "student" ? "true" : "false");
    roleOrganizerCard.setAttribute("aria-pressed", role === "organizer" ? "true" : "false");
  }

  function backToRoleSelection() {
    signupFormStep.hidden = true;
    roleSelectionStep.hidden = false;
    selectedRole = null;
    signupForm.setAttribute("data-role", "");
    if (roleBadge) roleBadge.textContent = "";
    roleStudentCard.classList.remove("is-selected");
    roleOrganizerCard.classList.remove("is-selected");
    roleStudentCard.setAttribute("aria-pressed", "false");
    roleOrganizerCard.setAttribute("aria-pressed", "false");
  }

  function onLoginSubmit(e) {
    e.preventDefault();
    hideError(loginError);

    var email = (loginEmail && loginEmail.value.trim()) || "";
    var password = (loginPassword && loginPassword.value) || "";

    if (!email || !password) {
      showError(loginError, "Please enter your email and password.");
      return;
    }

    setLoading(loginSubmitBtn, true);
    insForgeLoginPlaceholder(email, password)
      .then(function (user) {
        writeSession(user);
        setLoading(loginSubmitBtn, false);
        redirectAfterLogin(user);
      })
      .catch(function (err) {
        showError(loginError, err.message || "Login failed. Try again.");
        setLoading(loginSubmitBtn, false);
      });
  }

  function onSignupSubmit(e) {
    e.preventDefault();
    hideError(signupError);

    var name = (signupName && signupName.value.trim()) || "";
    var email = (signupEmail && signupEmail.value.trim()) || "";
    var password = (signupPassword && signupPassword.value) || "";
    var role = signupForm.getAttribute("data-role") || selectedRole;

    if (!role) {
      showError(signupError, "Please choose Student or Organizer.");
      return;
    }
    if (!name) {
      showError(signupError, "Please enter your name.");
      return;
    }
    if (!email) {
      showError(signupError, "Please enter your email.");
      return;
    }
    if (!password) {
      showError(signupError, "Please choose a password.");
      return;
    }

    setLoading(signupSubmitBtn, true);
    insForgeSignupPlaceholder({ name: name, email: email, password: password, role: role })
      .then(function (user) {
        writeSession(user);
        setLoading(signupSubmitBtn, false);
        redirectAfterSignup(user);
      })
      .catch(function (err) {
        showError(signupError, err.message || "Sign up failed. Try again.");
        setLoading(signupSubmitBtn, false);
      });
  }

  function logout() {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      /* ignore */
    }
    window.location.href = "login.html";
  }

  function cacheDom() {
    loginTab = document.getElementById("loginTab");
    signupTab = document.getElementById("signupTab");
    loginFormContainer = document.getElementById("loginFormContainer");
    signupFormContainer = document.getElementById("signupFormContainer");
    loginForm = document.getElementById("loginForm");
    loginEmail = document.getElementById("loginEmail");
    loginPassword = document.getElementById("loginPassword");
    loginError = document.getElementById("loginError");
    signupForm = document.getElementById("signupForm");
    signupName = document.getElementById("signupName");
    signupEmail = document.getElementById("signupEmail");
    signupPassword = document.getElementById("signupPassword");
    signupError = document.getElementById("signupError");
    roleSelectionStep = document.getElementById("roleSelectionStep");
    signupFormStep = document.getElementById("signupFormStep");
    roleStudentCard = document.getElementById("roleStudentCard");
    roleOrganizerCard = document.getElementById("roleOrganizerCard");
    backToRoleBtn = document.getElementById("backToRoleBtn");
    roleBadge = document.getElementById("roleBadge");

    loginSubmitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    signupSubmitBtn = signupForm ? signupForm.querySelector('button[type="submit"]') : null;
  }

  function bindLoginPage() {
    if (!loginTab || !signupTab) return;

    loginTab.addEventListener("click", showLoginPanel);
    signupTab.addEventListener("click", showSignupPanel);

    if (roleStudentCard) {
      roleStudentCard.addEventListener("click", function () {
        selectRole("student");
      });
    }
    if (roleOrganizerCard) {
      roleOrganizerCard.addEventListener("click", function () {
        selectRole("organizer");
      });
    }
    if (backToRoleBtn) {
      backToRoleBtn.addEventListener("click", backToRoleSelection);
    }

    if (loginForm) {
      loginForm.addEventListener("submit", onLoginSubmit);
    }
    if (signupForm) {
      signupForm.addEventListener("submit", onSignupSubmit);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    cacheDom();
    bindLoginPage();
  });

  window.CampusConnectAuth = {
    logout: logout,
    showError: showError,
    hideError: hideError,
    setLoading: setLoading,
    getSelectedRole: function () {
      return selectedRole;
    },
    readSession: readSession,
  };
})();
