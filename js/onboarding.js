// Onboarding flow: steps, validation, and persisting initial user preferences.

(function () {
  var TOTAL_STEPS = 6;
  var currentStep = 1;

  function $(id) {
    return document.getElementById(id);
  }

  function getStepEl(n) {
    return $("step" + n);
  }

  function getStepErrorEl(n) {
    return $("step" + n + "Error");
  }

  function clearError(n) {
    var el = getStepErrorEl(n);
    if (el) el.textContent = "";
  }

  function setError(n, message) {
    var el = getStepErrorEl(n);
    if (el) el.textContent = message || "";
  }

  function validateStep(n) {
    clearError(n);
    switch (n) {
      case 1: {
        var inst = $("institution");
        if (!inst || !inst.value) {
          setError(1, "Please select your institution.");
          return false;
        }
        return true;
      }
      case 2: {
        var course = $("course");
        if (!course || !course.value.trim()) {
          setError(2, "Please enter your course or program.");
          return false;
        }
        return true;
      }
      case 3: {
        var picked = document.querySelector('input[name="studyYear"]:checked');
        if (!picked) {
          setError(3, "Please select your year.");
          return false;
        }
        return true;
      }
      case 4: {
        var any = document.querySelector(
          '#step4 input[name="interests"]:checked'
        );
        if (!any) {
          setError(4, "Select at least one interest.");
          return false;
        }
        return true;
      }
      case 5: {
        var g = document.querySelector('#step5 input[name="goals"]:checked');
        if (!g) {
          setError(5, "Select at least one goal.");
          return false;
        }
        return true;
      }
      case 6: {
        var f = document.querySelector('#step6 input[name="formats"]:checked');
        if (!f) {
          setError(6, "Select at least one event format.");
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  }

  function updateProgressDots() {
    var dots = document.querySelectorAll(".progress-step[data-step]");
    var bar = $("progressBar");
    dots.forEach(function (dot) {
      var stepNum = parseInt(dot.getAttribute("data-step"), 10);
      dot.classList.remove("active", "completed");
      if (stepNum < currentStep) dot.classList.add("completed");
      else if (stepNum === currentStep) dot.classList.add("active");
    });
    if (bar) bar.setAttribute("aria-valuenow", String(currentStep));
  }

  function updateStepVisibility() {
    for (var i = 1; i <= TOTAL_STEPS; i++) {
      var section = getStepEl(i);
      if (!section) continue;
      section.hidden = i !== currentStep;
    }

    var prevBtn = $("prevBtn");
    var nextBtn = $("nextBtn");
    if (prevBtn) prevBtn.hidden = currentStep === 1;
    if (nextBtn) {
      nextBtn.textContent = currentStep === TOTAL_STEPS ? "Complete Setup" : "Next →";
    }
    updateProgressDots();
  }

  function goNext() {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) {
      currentStep += 1;
      updateStepVisibility();
    } else {
      completeOnboarding();
    }
  }

  function goPrev() {
    if (currentStep > 1) {
      clearError(currentStep);
      currentStep -= 1;
      updateStepVisibility();
    }
  }

  function checkedValues(containerSelector, name) {
    return Array.prototype.map.call(
      document.querySelectorAll(containerSelector + ' input[name="' + name + '"]:checked'),
      function (input) {
        return input.value;
      }
    );
  }

  function completeOnboarding() {
    var studyYearInput = document.querySelector('input[name="studyYear"]:checked');
    var snapshot = {
      institution: ($("institution") && $("institution").value) || "",
      course: ($("course") && $("course").value.trim()) || "",
      studyYear: (studyYearInput && studyYearInput.value) || "",
      interests: checkedValues("#step4", "interests"),
      goals: checkedValues("#step5", "goals"),
      formats: checkedValues("#step6", "formats"),
    };
    try {
      if (window.localStorage) {
        localStorage.setItem("campusconnect_onboarding", JSON.stringify(snapshot));
      }
    } catch (e) {
      /* ignore */
    }
    window.location.href = "index.html";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("onboardingForm");
    var nextBtn = $("nextBtn");
    var prevBtn = $("prevBtn");
    if (nextBtn) nextBtn.addEventListener("click", goNext);
    if (prevBtn) prevBtn.addEventListener("click", goPrev);
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        goNext();
      });
    }
    updateStepVisibility();
  });
})();
