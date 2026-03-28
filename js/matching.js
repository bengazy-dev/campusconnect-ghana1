// Event-to-user matching logic and recommendation scoring.

(function () {
  var goalCategoryMap = {
    internship: ["internship", "networking"],
    skills: ["workshop", "seminar", "competition"],
    network: ["networking", "seminar"],
    scholarship: ["scholarship"],
    scholarships: ["scholarship"],
    business: ["competition", "networking", "workshop"],
    research: ["seminar", "workshop"],
  };

  function tagToInterestSlug(tag) {
    var t = String(tag).trim().toLowerCase();
    if (t === "social impact") return "social-impact";
    if (t === "all fields") return "all";
    return t.replace(/\s+/g, "-");
  }

  function getEventTargetFields(event) {
    var raw = (event && (event.targetFields || event.tags)) || [];
    if (!Array.isArray(raw)) return [];
    return raw.map(tagToInterestSlug);
  }

  function getEventCategoryKey(event) {
    if (!event) return "";
    if (event.filter) return String(event.filter).toLowerCase();
    if (event.category) return String(event.category).toLowerCase();
    return "";
  }

  function normalizeEventFormat(format) {
    if (format == null) return "";
    return String(format).trim().toLowerCase().replace(/\s+/g, "-");
  }

  function formatMatches(preferredFormats, eventFormat) {
    var ef = normalizeEventFormat(eventFormat);
    if (!ef || !preferredFormats || !preferredFormats.length) return false;
    return preferredFormats.some(function (p) {
      return normalizeEventFormat(p) === ef;
    });
  }

  function eligibleYearMatches(eligibleYearsStr, userYear) {
    var s = (eligibleYearsStr || "").toLowerCase();
    if (
      s.includes("any year") ||
      /\bany\b/.test(s) ||
      s.includes("all year") ||
      s.includes("all undergraduate") ||
      s.includes("(any year)")
    ) {
      return true;
    }
    if (!userYear) return false;
    var y = String(userYear).toLowerCase();
    if (s.includes(y)) return true;
    if (y === "1" && (s.includes("1st") || s.includes("first"))) return true;
    if (y === "2" && (s.includes("2nd") || s.includes("second"))) return true;
    if (y === "3" && (s.includes("3rd") || s.includes("third"))) return true;
    if (y === "4" && (s.includes("4th") || s.includes("fourth"))) return true;
    if (y === "postgrad" && s.includes("postgrad")) return true;
    return false;
  }

  function institutionMatches(eventInstitution, userInstitution) {
    var e = (eventInstitution || "").toLowerCase().trim();
    var u = (userInstitution || "").toLowerCase().trim();
    if (!u) return false;
    if (e === "all" || e === "open" || (e.includes("open") && (e.includes("all") || e.includes("ghana")))) {
      return true;
    }
    return e === u || e.includes(u) || u.includes(e);
  }

  /**
   * @param {object} userProfile
   * @param {object} event
   * @returns {number}
   */
  function calculateMatchScore(userProfile, event) {
    var score = 0;
    if (!userProfile || !event) return score;

    var targets = getEventTargetFields(event);
    var interests = userProfile.interests || [];

    interests.forEach(function (interest) {
      var i = String(interest).toLowerCase();
      if (targets.includes(i) || targets.includes("all")) {
        score += 3;
      }
    });

    var catKey = getEventCategoryKey(event);
    var goals = userProfile.goals || [];
    goals.forEach(function (goal) {
      var g = String(goal).toLowerCase();
      var mapped = goalCategoryMap[g];
      if (mapped && mapped.includes(catKey)) {
        score += 2;
      }
    });

    var yearsStr = event.eligibleYears || "";
    var userYear = userProfile.year != null ? String(userProfile.year) : "";
    if (eligibleYearMatches(yearsStr, userYear)) {
      score += 2;
    }

    var prefs = userProfile.preferredFormats || [];
    if (formatMatches(prefs, event.format)) {
      score += 1;
    }

    var evInst = event.institution || "";
    var userInst = userProfile.institution || "";
    if (institutionMatches(evInst, userInst) || evInst.toLowerCase() === "all") {
      score += 1;
    }

    return score;
  }

  /**
   * @param {number} score
   * @returns {string}
   */
  function getMatchLabel(score) {
    var s = typeof score === "number" && !isNaN(score) ? score : 0;
    if (s >= 8) return "Perfect Match";
    if (s >= 5) return "Great Match";
    if (s >= 3) return "Good Match";
    return "";
  }

  /**
   * UI helper: label + tier for styling.
   * @param {number} score
   * @returns {{ text: string, tier: 'perfect'|'great'|'good' }}
   */
  function getMatchLabelWithTier(score) {
    var text = getMatchLabel(score);
    if (!text) return { text: "Good Match", tier: "good" };
    if (text === "Perfect Match") return { text: text, tier: "perfect" };
    if (text === "Great Match") return { text: text, tier: "great" };
    return { text: text, tier: "good" };
  }

  function buildUserProfile(raw) {
    if (!raw || typeof raw !== "object") return null;
    return {
      institution: raw.institution || "",
      course: raw.course || "",
      year: raw.year != null ? String(raw.year) : raw.studyYear != null ? String(raw.studyYear) : "",
      interests: Array.isArray(raw.interests) ? raw.interests : [],
      goals: Array.isArray(raw.goals) ? raw.goals : [],
      preferredFormats: Array.isArray(raw.preferredFormats)
        ? raw.preferredFormats
        : Array.isArray(raw.formats)
          ? raw.formats
          : [],
    };
  }

  function readOnboardingProfile() {
    try {
      var s = localStorage.getItem("campusconnect_onboarding");
      if (!s) return null;
      return buildUserProfile(JSON.parse(s));
    } catch (e) {
      return null;
    }
  }

  /**
   * @param {object[]} events
   * @param {object} userProfile
   * @returns {object[]}
   */
  function sortEventsByRelevance(events, userProfile) {
    var list = (events || []).map(function (e) {
      var copy = Object.assign({}, e);
      copy.matchScore = calculateMatchScore(userProfile, e);
      return copy;
    });
    list.sort(function (a, b) {
      return (b.matchScore || 0) - (a.matchScore || 0);
    });
    return list;
  }

  /**
   * @param {object[]} events
   * @param {string} category
   * @returns {object[]}
   */
  function filterEventsByCategory(events, category) {
    if (!category || category === "all") return (events || []).slice();
    var c = String(category).toLowerCase();
    return (events || []).filter(function (e) {
      var f = e.filter && String(e.filter).toLowerCase();
      var cat = e.category && String(e.category).toLowerCase();
      return f === c || cat === c;
    });
  }

  /**
   * @param {object[]} events
   * @param {object} userProfile
   * @param {string} [filter]
   * @returns {object[]}
   */
  function getPersonalizedEvents(events, userProfile, filter) {
    var f = filter == null ? "all" : filter;
    var filtered = filterEventsByCategory(events, f);
    if (!userProfile) return filtered;
    return sortEventsByRelevance(filtered, userProfile);
  }

  /** @deprecated use calculateMatchScore; kept for events.js */
  function scoreEventForUser(event, profile) {
    var up = profile ? buildUserProfile(profile) : readOnboardingProfile();
    if (!up) {
      if (event && typeof event.matchScore === "number") {
        return Math.round(event.matchScore * 10);
      }
      return 5;
    }
    return calculateMatchScore(up, event);
  }

  window.CampusConnectMatching = {
    calculateMatchScore: calculateMatchScore,
    getMatchLabel: getMatchLabel,
    getMatchLabelWithTier: getMatchLabelWithTier,
    sortEventsByRelevance: sortEventsByRelevance,
    filterEventsByCategory: filterEventsByCategory,
    getPersonalizedEvents: getPersonalizedEvents,
    scoreEventForUser: scoreEventForUser,
    buildUserProfile: buildUserProfile,
    readOnboardingProfile: readOnboardingProfile,
  };
})();
