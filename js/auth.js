// Sign-in, sign-out, session handling, and protected-route helpers.

(function () {
  var loginTab;
  var signupTab;
  var loginFormContainer;
  var signupFormContainer;
  var loginMainStep;
  var loginForm;
  var loginEmail;
  var loginPassword;
  var loginError;
  var forgotPasswordLink;
  var forgotPasswordStep;
  var newPasswordStep;
  var backFromForgotBtn;
  var backFromNewPasswordBtn;
  var resetEmail;
  var sendResetBtn;
  var resetMessage;
  var resetCode;
  var newPassword;
  var confirmPassword;
  var resetPasswordBtn;
  var resetError;

  var signupForm;
  var signupName;
  var signupEmail;
  var signupPassword;
  var signupError;
  var roleSelectionStep;
  var signupFormStep;
  var verificationStep;
  var verificationSubtext;
  var verificationCode;
  var verifyBtn;
  var verificationError;
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

  function showInlineMessage(el, message, variant) {
    if (!el) return;
    el.textContent = message || "";
    el.hidden = !message;
    el.classList.remove("alert-error", "alert-success");
    if (message) {
      el.classList.add(variant === "success" ? "alert-success" : "alert-error");
    }
  }

  function hideInlineMessage(el) {
    if (!el) return;
    el.textContent = "";
    el.hidden = true;
    el.classList.remove("alert-error", "alert-success");
  }

  function resetLoginErrorStyle() {
    if (!loginError) return;
    loginError.classList.remove("alert-success");
    loginError.classList.add("alert-error");
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

  function isEmailVerified(user) {
    return user && (user.emailVerified === true || user.emailVerified === "true");
  }

  function clearPendingSignup() {
    try {
      sessionStorage.removeItem(PENDING_SIGNUP_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function hideVerificationStep() {
    if (verificationStep) verificationStep.hidden = true;
    hideError(verificationError);
    if (verificationCode) verificationCode.value = "";
  }

  function showVerificationStepForEmail(email) {
    hideError(signupError);
    if (roleSelectionStep) roleSelectionStep.hidden = true;
    if (signupFormStep) signupFormStep.hidden = true;
    if (verificationStep) verificationStep.hidden = false;
    if (verificationSubtext) {
      verificationSubtext.textContent =
        "We sent a 6-digit code to " + (email || "your email") + ". Enter it below to finish creating your account.";
    }
    hideError(verificationError);
    if (verificationCode) verificationCode.value = "";
    if (verificationCode) verificationCode.focus();
  }

  function showLoginMainView() {
    if (loginMainStep) loginMainStep.hidden = false;
    if (forgotPasswordStep) forgotPasswordStep.hidden = true;
    if (newPasswordStep) newPasswordStep.hidden = true;
    hideInlineMessage(resetMessage);
    hideError(resetError);
    if (resetEmail) resetEmail.value = "";
    if (resetCode) resetCode.value = "";
    if (newPassword) newPassword.value = "";
    if (confirmPassword) confirmPassword.value = "";
  }

  function showForgotPasswordView() {
    if (loginMainStep) loginMainStep.hidden = true;
    if (forgotPasswordStep) forgotPasswordStep.hidden = false;
    if (newPasswordStep) newPasswordStep.hidden = true;
    hideInlineMessage(resetMessage);
    hideError(resetError);
    if (resetEmail) resetEmail.focus();
  }

  function showNewPasswordView() {
    if (newPasswordStep) newPasswordStep.hidden = false;
    hideError(resetError);
    if (resetCode) resetCode.focus();
  }

  function showLoginPanel() {
    loginTab.setAttribute("aria-selected", "true");
    signupTab.setAttribute("aria-selected", "false");
    loginFormContainer.hidden = false;
    signupFormContainer.hidden = true;
    resetLoginErrorStyle();
    hideError(loginError);
    clearPendingSignup();
    hideVerificationStep();
    showLoginMainView();
  }

  function showSignupPanel() {
    loginTab.setAttribute("aria-selected", "false");
    signupTab.setAttribute("aria-selected", "true");
    loginFormContainer.hidden = true;
    signupFormContainer.hidden = false;
    hideVerificationStep();
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
    resetLoginErrorStyle();
    hideError(loginError);
    hideInlineMessage(resetMessage);

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

        if (!isEmailVerified(u)) {
          return ins.auth.signOut().then(function () {
            throw new Error("Please verify your email before signing in. Check your inbox for the code.");
          });
        }

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

        throw new Error(
          "Your account is not fully registered yet. Complete sign up and email verification, then try again."
        );
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
            sessionStorage.setItem(
              PENDING_SIGNUP_KEY,
              JSON.stringify({ email: email, name: name, role: role })
            );
          } catch (e3) {
            /* ignore */
          }
          setLoading(signupSubmitBtn, false);
          showVerificationStepForEmail(email);
          return;
        }

        if (!d.accessToken) {
          throw new Error("Could not sign you in. Try again.");
        }

        if (!isEmailVerified(d.user)) {
          throw new Error("Please verify your email before continuing.");
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

  function onVerifyClick() {
    hideError(verificationError);
    var code = (verificationCode && verificationCode.value.replace(/\D/g, "")) || "";
    var pending = null;
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING_SIGNUP_KEY) || "null");
    } catch (e) {
      pending = null;
    }

    if (!pending || !pending.email) {
      showError(verificationError, "Sign up session expired. Start over from Sign up.");
      return;
    }
    if (code.length !== 6) {
      showError(verificationError, "Enter the 6-digit code from your email.");
      return;
    }

    setLoading(verifyBtn, true);
    getInsforge()
      .then(function (ins) {
        return ins.auth
          .verifyEmail({
            email: pending.email,
            otp: code,
          })
          .then(function (res) {
            return { ins: ins, res: res, pending: pending };
          });
      })
      .then(function (ctx) {
        if (ctx.res.error) throw ctx.res.error;
        var vd = ctx.res.data;
        if (!vd || !vd.user) throw new Error("Verification failed.");
        var u = vd.user;
        if (!isEmailVerified(u)) {
          throw new Error("Email could not be verified. Try again or request a new code.");
        }

        var p = ctx.pending;
        return ensureUserInTable(ctx.ins, {
          id: u.id,
          email: p.email,
          name: p.name,
          role: p.role,
        }).then(function () {
          return { u: u, pending: p };
        });
      })
      .then(function (x) {
        clearPendingSignup();
        var sessionUser = {
          id: x.u.id,
          email: x.pending.email,
          name: x.pending.name,
          role: x.pending.role,
        };
        writeSession(sessionUser);
        setLoading(verifyBtn, false);
        redirectAfterSignup(sessionUser);
      })
      .catch(function (err) {
        showError(verificationError, authErrorMessage(err) || "Verification failed.");
        setLoading(verifyBtn, false);
      });
  }

  function onForgotPasswordLinkClick(e) {
    e.preventDefault();
    resetLoginErrorStyle();
    hideError(loginError);
    hideInlineMessage(resetMessage);
    var em = (loginEmail && loginEmail.value.trim()) || "";
    if (resetEmail) resetEmail.value = em;
    showForgotPasswordView();
  }

  function onSendResetClick() {
    hideInlineMessage(resetMessage);
    var email = (resetEmail && resetEmail.value.trim()) || "";
    if (!email) {
      showInlineMessage(resetMessage, "Please enter your email.", "error");
      return;
    }

    var redirectTo = window.location.href.split("#")[0];
    setLoading(sendResetBtn, true);
    getInsforge()
      .then(function (ins) {
        return ins.auth.sendResetPasswordEmail({ email: email, redirectTo: redirectTo });
      })
      .then(function (res) {
        if (res.error) throw res.error;
        setLoading(sendResetBtn, false);
        showInlineMessage(
          resetMessage,
          "If that email is registered, we sent a reset code. Check your inbox.",
          "success"
        );
        showNewPasswordView();
      })
      .catch(function (err) {
        setLoading(sendResetBtn, false);
        showInlineMessage(resetMessage, authErrorMessage(err), "error");
      });
  }

  function onResetPasswordClick() {
    hideError(resetError);
    var email = (resetEmail && resetEmail.value.trim()) || "";
    var code = (resetCode && resetCode.value.replace(/\D/g, "")) || "";
    var pw = (newPassword && newPassword.value) || "";
    var pw2 = (confirmPassword && confirmPassword.value) || "";

    if (!email) {
      showError(resetError, "Email is missing. Go back and enter your email.");
      return;
    }
    if (code.length !== 6) {
      showError(resetError, "Enter the 6-digit code from your email.");
      return;
    }
    if (!pw || pw.length < 8) {
      showError(resetError, "Use a new password of at least 8 characters.");
      return;
    }
    if (pw !== pw2) {
      showError(resetError, "Passwords do not match.");
      return;
    }

    setLoading(resetPasswordBtn, true);
    getInsforge()
      .then(function (ins) {
        return ins.auth
          .exchangeResetPasswordToken({
            email: email,
            code: code,
          })
          .then(function (ex) {
            if (ex.error) throw ex.error;
            if (!ex.data || !ex.data.token) throw new Error("Invalid or expired code.");
            return ins.auth.resetPassword({
              newPassword: pw,
              otp: ex.data.token,
            });
          })
          .then(function (rp) {
            if (rp.error) throw rp.error;
            return ins;
          });
      })
      .then(function () {
        setLoading(resetPasswordBtn, false);
        if (newPasswordStep) newPasswordStep.hidden = true;
        if (forgotPasswordStep) forgotPasswordStep.hidden = true;
        showLoginMainView();
        showInlineMessage(resetMessage, "Password reset! Please log in.", "success");
        if (loginPassword) loginPassword.value = "";
        if (loginEmail && !loginEmail.value) loginEmail.value = email;
      })
      .catch(function (err) {
        showError(resetError, authErrorMessage(err) || "Could not reset password.");
        setLoading(resetPasswordBtn, false);
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
        var u = res.data && res.data.user;
        if (!u) return false;
        return isEmailVerified(u);
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
    loginMainStep = document.getElementById("loginMainStep");
    loginForm = document.getElementById("loginForm");
    loginEmail = document.getElementById("loginEmail");
    loginPassword = document.getElementById("loginPassword");
    loginError = document.getElementById("loginError");
    forgotPasswordLink = document.getElementById("forgotPasswordLink");
    forgotPasswordStep = document.getElementById("forgotPasswordStep");
    newPasswordStep = document.getElementById("newPasswordStep");
    backFromForgotBtn = document.getElementById("backFromForgotBtn");
    backFromNewPasswordBtn = document.getElementById("backFromNewPasswordBtn");
    resetEmail = document.getElementById("resetEmail");
    sendResetBtn = document.getElementById("sendResetBtn");
    resetMessage = document.getElementById("resetMessage");
    resetCode = document.getElementById("resetCode");
    newPassword = document.getElementById("newPassword");
    confirmPassword = document.getElementById("confirmPassword");
    resetPasswordBtn = document.getElementById("resetPasswordBtn");
    resetError = document.getElementById("resetError");

    signupForm = document.getElementById("signupForm");
    signupName = document.getElementById("signupName");
    signupEmail = document.getElementById("signupEmail");
    signupPassword = document.getElementById("signupPassword");
    signupError = document.getElementById("signupError");
    roleSelectionStep = document.getElementById("roleSelectionStep");
    signupFormStep = document.getElementById("signupFormStep");
    verificationStep = document.getElementById("verificationStep");
    verificationSubtext = document.getElementById("verificationSubtext");
    verificationCode = document.getElementById("verificationCode");
    verifyBtn = document.getElementById("verifyBtn");
    verificationError = document.getElementById("verificationError");
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

    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener("click", onForgotPasswordLinkClick);
    }
    if (sendResetBtn) {
      sendResetBtn.addEventListener("click", onSendResetClick);
    }
    if (resetPasswordBtn) {
      resetPasswordBtn.addEventListener("click", onResetPasswordClick);
    }
    if (verifyBtn) {
      verifyBtn.addEventListener("click", onVerifyClick);
    }
    if (backFromForgotBtn) {
      backFromForgotBtn.addEventListener("click", function () {
        showLoginMainView();
        resetLoginErrorStyle();
        hideError(loginError);
      });
    }
    if (backFromNewPasswordBtn) {
      backFromNewPasswordBtn.addEventListener("click", function () {
        if (newPasswordStep) newPasswordStep.hidden = true;
        hideError(resetError);
        if (resetCode) resetCode.value = "";
        if (newPassword) newPassword.value = "";
        if (confirmPassword) confirmPassword.value = "";
      });
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
