// Onboarding flow: steps, validation, and persisting initial user preferences.

(function () {
  var USER_KEY = "campusconnect_user";
  var ONBOARDING_KEY = "campusconnect_onboarding";

  let currentStep = 1;
  const totalSteps = 6;

  let profileData = {
    institution: "",
    course: "",
    year: "",
    interests: [],
    goals: [],
    preferredFormats: [],
  };

  var step1;
  var step2;
  var step3;
  var step4;
  var step5;
  var step6;
  var prevBtn;
  var nextBtn;
  var progressBar;
  var progressDots;
  var institutionEl;
  var courseEl;

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

  /** Merge InsForge auth user into campusconnect_user for downstream readSession(). */
  function ensureSessionFromAuthUser(authUser) {
    var cur = readSession() || {};
    cur.id = authUser.id;
    if (authUser.email) cur.email = authUser.email;
    if (authUser.profile && authUser.profile.name) cur.name = authUser.profile.name;
    writeSession(cur);
  }

  function syncRadioItemClasses() {
    document.querySelectorAll(".radio-item").forEach(function (item) {
      var input = item.querySelector('input[type="radio"]');
      if (input) item.classList.toggle("selected", input.checked);
    });
  }

  function syncCheckboxItemClasses() {
    document.querySelectorAll(".checkbox-item").forEach(function (item) {
      var input = item.querySelector('input[type="checkbox"]');
      if (input) item.classList.toggle("selected", input.checked);
    });
  }

  function getStepErrorEl(n) {
    return document.getElementById("step" + n + "Error");
  }

  function clearStepError(n) {
    var el = getStepErrorEl(n);
    if (el) el.textContent = "";
  }

  function showStepError(n, message) {
    var el = getStepErrorEl(n);
    if (el) el.textContent = message || "";
  }

  function updateProgressBar() {
    if (!progressDots || !progressDots.length) return;
    progressDots.forEach(function (dot, index) {
      var stepIndex = index + 1;
      dot.classList.remove("active", "completed");
      if (stepIndex < currentStep) dot.classList.add("completed");
      else if (stepIndex === currentStep) dot.classList.add("active");
    });
    if (progressBar) progressBar.setAttribute("aria-valuenow", String(currentStep));
  }

  function showStep(n) {
    if (n < 1 || n > totalSteps) return;
    currentStep = n;

    [step1, step2, step3, step4, step5, step6].forEach(function (el, i) {
      if (!el) return;
      el.hidden = i + 1 !== n;
    });

    updateProgressBar();

    if (prevBtn) prevBtn.hidden = currentStep === 1;
    if (nextBtn) {
      nextBtn.textContent = currentStep === totalSteps ? "Complete Setup" : "Next →";
    }
  }

  function validateStep(n) {
    clearStepError(n);
    switch (n) {
      case 1:
        if (!institutionEl || !institutionEl.value) {
          showStepError(1, "Please select your institution.");
          return false;
        }
        return true;
      case 2:
        if (!courseEl || !courseEl.value.trim()) {
          showStepError(2, "Please enter your course or program.");
          return false;
        }
        return true;
      case 3: {
        var picked = document.querySelector('#step3 input[name="studyYear"]:checked');
        if (!picked) {
          showStepError(3, "Please select your year.");
          return false;
        }
        return true;
      }
      case 4:
        if (!document.querySelector('#step4 input[name="interests"]:checked')) {
          showStepError(4, "Select at least one interest.");
          return false;
        }
        return true;
      case 5:
        if (!document.querySelector('#step5 input[name="goals"]:checked')) {
          showStepError(5, "Select at least one goal.");
          return false;
        }
        return true;
      case 6:
        if (!document.querySelector('#step6 input[name="formats"]:checked')) {
          showStepError(6, "Select at least one event format.");
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  function checkedDataValuesInStep(stepEl, inputName) {
    if (!stepEl) return [];
    var out = [];
    stepEl.querySelectorAll('input[name="' + inputName + '"]:checked').forEach(function (inp) {
      var item = inp.closest(".checkbox-item");
      var dv = item && item.getAttribute("data-value");
      out.push(dv || inp.value);
    });
    return out;
  }

  function saveStepData(n) {
    switch (n) {
      case 1:
        profileData.institution = institutionEl ? institutionEl.value : "";
        break;
      case 2:
        profileData.course = courseEl ? courseEl.value.trim() : "";
        break;
      case 3: {
        var radio = document.querySelector('#step3 input[name="studyYear"]:checked');
        var wrap = radio && radio.closest(".radio-item");
        profileData.year =
          (wrap && wrap.getAttribute("data-value")) || (radio && radio.value) || "";
        break;
      }
      case 4:
        profileData.interests = checkedDataValuesInStep(step4, "interests");
        break;
      case 5:
        profileData.goals = checkedDataValuesInStep(step5, "goals");
        break;
      case 6:
        profileData.preferredFormats = checkedDataValuesInStep(step6, "formats");
        break;
      default:
        break;
    }
  }

  function persistProfileLocal(payload) {
    try {
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
  }

  function profileSubmitErrorMessage(err) {
    if (err && typeof err.message === "string" && err.message) return err.message;
    return "Could not save your profile. Try again.";
  }

  function submitProfile() {
    clearStepError(6);

    if (typeof window.getInsforgeClient !== "function") {
      showStepError(6, "Connection to the server is unavailable. Refresh the page and try again.");
      return;
    }

    if (nextBtn) nextBtn.disabled = true;

    var payloadBase = {
      institution: profileData.institution,
      course: profileData.course,
      year: profileData.year,
      studyYear: profileData.year,
      interests: profileData.interests.slice(),
      goals: profileData.goals.slice(),
      preferredFormats: profileData.preferredFormats.slice(),
      formats: profileData.preferredFormats.slice(),
    };

    window
      .getInsforgeClient()
      .then(function (ins) {
        return ins.auth.getCurrentUser().then(function (authRes) {
          var uid = null;
          if (authRes.data && authRes.data.user) uid = authRes.data.user.id;
          if (!uid) {
            var sess = readSession();
            uid = sess && sess.id ? sess.id : null;
          }
          if (!uid) {
            throw new Error("Could not verify your account. Please sign in again.");
          }
          return { ins: ins, userId: uid };
        });
      })
      .then(function (ctx) {
        var ins = ctx.ins;
        var userId = ctx.userId;
        var session = readSession();
        var payload = Object.assign({}, payloadBase);
        if (session && session.name) payload.name = session.name;
        if (session && session.email) payload.email = session.email;

        var createdAt = new Date().toISOString();
        var rowInsert = {
          user_id: userId,
          institution: profileData.institution,
          course: profileData.course,
          year: profileData.year,
          interests: profileData.interests.slice(),
          goals: profileData.goals.slice(),
          preferred_formats: profileData.preferredFormats.slice(),
          created_at: createdAt,
        };

        return ins.database
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle()
          .then(function (sel) {
            if (sel.error) throw sel.error;
            if (sel.data && sel.data.id) {
              return ins.database
                .from("profiles")
                .update({
                  institution: rowInsert.institution,
                  course: rowInsert.course,
                  year: rowInsert.year,
                  interests: rowInsert.interests,
                  goals: rowInsert.goals,
                  preferred_formats: rowInsert.preferred_formats,
                })
                .eq("user_id", userId)
                .select();
            }
            return ins.database.from("profiles").insert(rowInsert).select();
          })
          .then(function (res) {
            if (res.error) throw res.error;
            return payload;
          });
      })
      .then(function (payload) {
        persistProfileLocal(payload);
        window.location.href = "index.html";
      })
      .catch(function (err) {
        if (nextBtn) nextBtn.disabled = false;
        showStepError(6, profileSubmitErrorMessage(err));
      });
  }

  function onNextClick() {
    if (!validateStep(currentStep)) return;
    saveStepData(currentStep);

    if (currentStep < totalSteps) {
      showStep(currentStep + 1);
    } else {
      submitProfile();
    }
  }

  function onPrevClick() {
    if (currentStep > 1) {
      clearStepError(currentStep);
      showStep(currentStep - 1);
    }
  }

  function bindRadioAndCheckboxUi() {
    document.addEventListener("change", function (e) {
      var t = e.target;
      if (t.matches && t.matches('.radio-item input[type="radio"]')) {
        syncRadioItemClasses();
      }
      if (t.matches && t.matches('.checkbox-item input[type="checkbox"]')) {
        syncCheckboxItemClasses();
      }
    });

    document.querySelectorAll(".radio-item").forEach(function (item) {
      item.addEventListener("click", function () {
        window.requestAnimationFrame(syncRadioItemClasses);
      });
    });

    document.querySelectorAll(".checkbox-item").forEach(function (item) {
      item.addEventListener("click", function () {
        window.requestAnimationFrame(syncCheckboxItemClasses);
      });
    });
  }

  function cacheDom() {
    step1 = document.getElementById("step1");
    step2 = document.getElementById("step2");
    step3 = document.getElementById("step3");
    step4 = document.getElementById("step4");
    step5 = document.getElementById("step5");
    step6 = document.getElementById("step6");
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
    progressBar = document.getElementById("progressBar");
    progressDots = document.querySelectorAll("#progressBar .progress-step[data-step]");
    institutionEl = document.getElementById("institution");
    courseEl = document.getElementById("course");
  }

  document.addEventListener("DOMContentLoaded", function () {
    function startOnboardingUi() {
      cacheDom();
      bindRadioAndCheckboxUi();
      syncRadioItemClasses();
      syncCheckboxItemClasses();

      if (nextBtn) nextBtn.addEventListener("click", onNextClick);
      if (prevBtn) prevBtn.addEventListener("click", onPrevClick);

      var form = document.getElementById("onboardingForm");
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          onNextClick();
        });
      }

      showStep(1);
    }

    if (typeof window.getInsforgeClient !== "function") {
      window.location.href = "login.html";
      return;
    }

    window
      .getInsforgeClient()
      .then(function (ins) {
        return ins.auth.getCurrentUser().then(function (res) {
          return { ins: ins, res: res };
        });
      })
      .then(function (ctx) {
        if (ctx.res.error || !ctx.res.data || !ctx.res.data.user) {
          window.location.href = "login.html";
          return null;
        }
        var u = ctx.res.data.user;
        ensureSessionFromAuthUser(u);
        return ctx.ins.database
          .from("profiles")
          .select("id")
          .eq("user_id", u.id)
          .maybeSingle()
          .then(function (prof) {
            return { prof: prof };
          });
      })
      .then(function (next) {
        if (!next) return;
        if (next.prof.error) {
          window.location.href = "login.html";
          return;
        }
        if (next.prof.data && next.prof.data.id) {
          window.location.href = "index.html";
          return;
        }
        startOnboardingUi();
      })
      .catch(function () {
        window.location.href = "login.html";
      });
  });

  window.CampusConnectOnboarding = {
    getCurrentStep: function () {
      return currentStep;
    },
    getProfileData: function () {
      return profileData;
    },
    showStep: showStep,
    validateStep: validateStep,
    saveStepData: saveStepData,
    submitProfile: submitProfile,
  };
})();
