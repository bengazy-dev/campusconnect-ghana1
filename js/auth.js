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
  var PENDING_SIGNUP_KEY = "campusconnect_pending_signup";

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

  function getInsforge() {
    if (typeof window.getInsforgeClient !== "function") {
      return Promise.reject(new Error("Authentication is not configured."));
    }
    return window.getInsforgeClient();
  }

  function fetchUserRow(insforge, userId) {
    return insforge.database
      .from("users")
      .select("id,email,name,role")
      .eq("id", userId)
      .maybeSingle()
      .then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
  }

  function ensureUserInTable(insforge, row) {
    return insforge.database
      .from("users")
      .select("id")
      .eq("id", row.id)
      .maybeSingle()
      .then(function (sel) {
        if (sel.error) throw sel.error;
        if (sel.data && sel.data.id) {
          return insforge.database
            .from("users")
            .update({ email: row.email, name: row.name, role: row.role })
            .eq("id", row.id)
            .select();
        }
        return insforge.database
          .from("users")
          .insert({
            id: row.id,
            email: row.email,
            name: row.name,
            role: row.role,
            password_hash: "",
          })
          .select();
      })
      .then(function (result) {
        if (result.error) throw result.error;
        return result;
      });
  }

  function profileExistsForUser(insforge, userId) {
    return insforge.database
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()
      .then(function (r) {
        if (r.error) return false;
        return !!(r.data && r.data.id);
      });
  }

  function redirectAfterLoginAsync(insforge, sessionUser) {
    if (sessionUser.role === "organizer") {
      window.location.href = "submit.html";
      return Promise.resolve();
    }
    return profileExistsForUser(insforge, sessionUser.id).then(function (exists) {
      window.location.href = exists ? "index.html" : "onboarding.html";
    });
  }

  function redirectAfterSignup(user) {
    if (user.role === "student") {
      window.location.href = "onboarding.html";
    } else {
      window.location.href = "index.html";
    }
  }

  function authErrorMessage(err) {
    if (!err) return "Something went wrong.";
    if (typeof err.message === "string" && err.message) return err.message;
    return "Something went wrong.";
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
    getInsforge()
      .then(function (ins) {
        return ins.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
          return { ins: ins, res: res };
        });
      })
      .then(function (ctx) {
        var ins = ctx.ins;
        var res = ctx.res;
        if (res.error) throw res.error;
        if (!res.data || !res.data.user) throw new Error("Sign in failed.");
        var u = res.data.user;
        return fetchUserRow(ins, u.id).then(function (row) {
          return { ins: ins, u: u, row: row };
        });
      })
      .then(function (ctx) {
        var ins = ctx.ins;
        var u = ctx.u;
        var row = ctx.row;

        if (row && row.id) {
          var displayName = row.name || (u.profile && u.profile.name) || email.split("@")[0];
          var role = row.role;
          var sessionUser = { id: u.id, email: u.email || row.email, name: displayName, role: role };
          writeSession(sessionUser);
          setLoading(loginSubmitBtn, false);
          return redirectAfterLoginAsync(ins, sessionUser);
        }

        var pending = null;
        try {
          pending = JSON.parse(sessionStorage.getItem(PENDING_SIGNUP_KEY) || "null");
        } catch (e2) {
          pending = null;
        }
        var uEmail = (u.email || "").toLowerCase();
        if (pending && pending.email && uEmail === String(pending.email).toLowerCase()) {
          var displayName2 = pending.name || (u.profile && u.profile.name) || email.split("@")[0];
          var role2 = pending.role || "student";
          return ensureUserInTable(ins, {
            id: u.id,
            email: u.email,
            name: displayName2,
            role: role2,
          }).then(function () {
            sessionStorage.removeItem(PENDING_SIGNUP_KEY);
            var sessionUser2 = { id: u.id, email: u.email, name: displayName2, role: role2 };
            writeSession(sessionUser2);
            setLoading(loginSubmitBtn, false);
            return redirectAfterLoginAsync(ins, sessionUser2);
          });
        }

        throw new Error("Account setup incomplete. Finish sign up or use the same email you registered with.");
      })
      .catch(function (err) {
        showError(loginError, authErrorMessage(err) || "Login failed. Try again.");
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

    var redirectTo = window.location.href.split("#")[0];

    setLoading(signupSubmitBtn, true);
    getInsforge()
      .then(function (ins) {
        return ins.auth
          .signUp({
            email: email,
            password: password,
            name: name,
            redirectTo: redirectTo,
          })
          .then(function (res) {
            return { ins: ins, res: res };
          });
      })
      .then(function (ctx) {
        var ins = ctx.ins;
        var res = ctx.res;
        if (res.error) throw res.error;
        var d = res.data;
        if (!d || !d.user) throw new Error("Could not create account.");

        if (d.requireEmailVerification && !d.accessToken) {
          try {
            sessionStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify({ email: email, name: name, role: role }));
          } catch (e3) {
            /* ignore */
          }
          setLoading(signupSubmitBtn, false);
          showError(
            signupError,
            "We sent a verification code to your email. Enter it to verify, then sign in here. Check spam if you do not see it."
          );
          return;
        }

        if (!d.accessToken) {
          throw new Error("Could not sign you in. Try again.");
        }

        return ensureUserInTable(ins, {
          id: d.user.id,
          email: email,
          name: name,
          role: role,
        }).then(function () {
          var sessionUser = { id: d.user.id, email: email, name: name, role: role };
          writeSession(sessionUser);
          setLoading(signupSubmitBtn, false);
          redirectAfterSignup(sessionUser);
        });
      })
      .catch(function (err) {
        showError(signupError, authErrorMessage(err) || "Sign up failed. Try again.");
        setLoading(signupSubmitBtn, false);
      });
  }

  function clearCampusConnectStorage() {
    try {
      var keys = Object.keys(localStorage);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf("campusconnect_") === 0) {
          localStorage.removeItem(keys[i]);
        }
      }
    } catch (e) {
      /* ignore */
    }
    try {
      sessionStorage.removeItem(PENDING_SIGNUP_KEY);
    } catch (e2) {
      /* ignore */
    }
  }

  function logout() {
    function finish() {
      clearCampusConnectStorage();
      window.location.href = "login.html";
    }

    if (typeof window.getInsforgeClient !== "function") {
      finish();
      return;
    }

    window
      .getInsforgeClient()
      .then(function (ins) {
        return ins.auth.signOut();
      })
      .catch(function () {
        /* ignore */
      })
      .finally(finish);
  }

  function isAuthenticated() {
    return getInsforge()
      .then(function (ins) {
        return ins.auth.getCurrentUser();
      })
      .then(function (res) {
        if (res.error) return false;
        return !!(res.data && res.data.user);
      })
      .catch(function () {
        return false;
      });
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

  function bindNavLogout() {
    var navLogout = document.getElementById("navLogout");
    if (!navLogout) return;
    navLogout.addEventListener("click", function (e) {
      e.preventDefault();
      logout();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    cacheDom();
    bindLoginPage();
    bindNavLogout();
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
    isAuthenticated: isAuthenticated,
  };
})();
