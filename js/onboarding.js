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

  function submitProfile() {
    var session = readSession();
    if (!session || !session.id) {
      window.location.href = "login.html";
      return;
    }

    var payload = {
      institution: profileData.institution,
      course: profileData.course,
      year: profileData.year,
      studyYear: profileData.year,
      interests: profileData.interests.slice(),
      goals: profileData.goals.slice(),
      preferredFormats: profileData.preferredFormats.slice(),
      formats: profileData.preferredFormats.slice(),
    };
    if (session.name) payload.name = session.name;
    if (session.email) payload.email = session.email;

    var row = {
      user_id: session.id,
      institution: profileData.institution,
      course: profileData.course,
      year: profileData.year,
      interests: profileData.interests.slice(),
      goals: profileData.goals.slice(),
      preferred_formats: profileData.preferredFormats.slice(),
    };

    if (typeof window.getInsforgeClient !== "function") {
      persistProfileLocal(payload);
      window.location.href = "index.html";
      return;
    }

    if (nextBtn) nextBtn.disabled = true;

    window
      .getInsforgeClient()
      .then(function (ins) {
        return ins.database
          .from("profiles")
          .select("id")
          .eq("user_id", session.id)
          .maybeSingle()
          .then(function (sel) {
            if (sel.error) throw sel.error;
            if (sel.data && sel.data.id) {
              return ins.database
                .from("profiles")
                .update({
                  institution: row.institution,
                  course: row.course,
                  year: row.year,
                  interests: row.interests,
                  goals: row.goals,
                  preferred_formats: row.preferred_formats,
                })
                .eq("user_id", session.id)
                .select();
            }
            return ins.database.from("profiles").insert(row).select();
          });
      })
      .then(function (res) {
        if (res.error) throw res.error;
        persistProfileLocal(payload);
        window.location.href = "index.html";
      })
      .catch(function (err) {
        if (nextBtn) nextBtn.disabled = false;
        window.alert((err && err.message) || "Could not save your profile. Try again.");
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
    function startOnboarding() {
      if (!readSession()) {
        window.location.href = "login.html";
        return;
      }

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

    var A = window.CampusConnectAuth;
    if (typeof window.getInsforgeClient === "function" && A && typeof A.isAuthenticated === "function") {
      window
        .getInsforgeClient()
        .then(function () {
          return A.isAuthenticated();
        })
        .then(function (ok) {
          if (!ok) {
            window.location.href = "login.html";
            return;
          }
          startOnboarding();
        })
        .catch(function () {
          window.location.href = "login.html";
        });
      return;
    }

    startOnboarding();
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
