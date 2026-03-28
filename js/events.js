// Loading, filtering, displaying, and interacting with event listings and detail.

(function () {
  var USER_KEY = "campusconnect_user";
  var ONBOARDING_KEY = "campusconnect_onboarding";
  var SAVED_KEY = "campusconnect_saved_events";
  var POSTED_KEY = "campusconnect_posted_events";

  var M = window.CampusConnectMatching;

  const sampleEvents = [
    {
      id: "1",
      title: "Cursor Hackathon KNUST",
      description:
        "Join the Cursor community at KNUST for a hackathon experience. Meet other Cursor users, build projects, and collaborate with fellow developers.",
      date: "2026-03-28",
      category: "competition",
      targetFields: ["Tech", "Engineering"],
      eligibleYears: ["any"],
      format: "in-person",
      institution: "KNUST",
      organizerName: "Cursor Community Africa",
    },
    {
      id: "2",
      title: "Hack54 Finance & Digital Assets Hackathon",
      description:
        "Build solutions for finance and digital assets. Previous edition brought teams from Ashesi, KNUST, UG, and UMaT. Top teams get incubation, mentorship, and pitch opportunities at Tech in Ghana and FiDCon.",
      date: "2026-02-15",
      category: "competition",
      targetFields: ["Tech", "Finance", "Business"],
      eligibleYears: ["any"],
      format: "in-person",
      institution: "all",
      organizerName: "thedsgnjunkies & Socialite AF",
    },
    {
      id: "3",
      title: "GREAT Scholarships UK 2026-27",
      description:
        "£10,000 towards tuition fees for one-year taught postgraduate courses at UK universities including Durham, Imperial College London, and Lancaster University. Multiple institutions participating.",
      date: "2026-06-30",
      category: "scholarship",
      targetFields: ["All"],
      eligibleYears: ["4", "postgrad"],
      format: "online",
      institution: "all",
      organizerName: "British Council Ghana",
    },
    {
      id: "4",
      title: "Ghana Government Scholarship Secretariat",
      description:
        "Government-funded scholarships for Ghanaian students for local and international tertiary education. Covers tuition and academic-related costs. Application window: April 1 - May 15.",
      date: "2026-05-15",
      category: "scholarship",
      targetFields: ["All"],
      eligibleYears: ["1", "2", "3", "4"],
      format: "online",
      institution: "all",
      organizerName: "Ghana Scholarship Secretariat",
    },
    {
      id: "5",
      title: "MasterCard Foundation Scholars Program at Ashesi",
      description:
        "Partnership between Ashesi University and MasterCard Foundation since 2012. Full scholarship for academically talented students with financial need.",
      date: "2026-05-01",
      category: "scholarship",
      targetFields: ["All"],
      eligibleYears: ["1", "2"],
      format: "online",
      institution: "Ashesi",
      organizerName: "MasterCard Foundation",
    },
    {
      id: "6",
      title: "MTN Global Graduate Development Programme 2026",
      description:
        "Fast-track programme for top graduates across Africa. Combines formal development with Duke Corporate Education and MTN Academy, plus on-the-job training with executive mentoring and job rotation.",
      date: "2026-04-30",
      category: "internship",
      targetFields: ["Tech", "Business", "Finance"],
      eligibleYears: ["4", "postgrad"],
      format: "hybrid",
      institution: "all",
      organizerName: "MTN Ghana",
    },
    {
      id: "7",
      title: "Deloitte West Africa Graduate Trainee Programme",
      description:
        "Graduate recruitment for Audit & Assurance, Tax & Legal, and Consulting Services. For graduates from 2024/2025/2026. Application deadline: April 10, 2026.",
      date: "2026-04-10",
      category: "internship",
      targetFields: ["Business", "Finance", "Law"],
      eligibleYears: ["4", "postgrad"],
      format: "in-person",
      institution: "all",
      organizerName: "Deloitte Ghana",
    },
    {
      id: "8",
      title: "Deloitte Ghana National Service Programme",
      description:
        "Opportunities for graduates from Business, Social Science and Computer Science/Engineering backgrounds. Exposure to world-class work environment while completing National Service.",
      date: "2026-06-21",
      category: "internship",
      targetFields: ["Business", "Tech", "Engineering"],
      eligibleYears: ["4", "postgrad"],
      format: "in-person",
      institution: "all",
      organizerName: "Deloitte Ghana",
    },
    {
      id: "9",
      title: "Standard Chartered Women in Tech Accelerator",
      description:
        "Sixth edition of the accelerator programme in partnership with Village Capital and Ghana Climate Innovation Centre at Ashesi. For women-led startups. Past participants reported increased revenue and job creation.",
      date: "2026-04-15",
      category: "workshop",
      targetFields: ["Tech", "Business"],
      eligibleYears: ["any"],
      format: "hybrid",
      institution: "all",
      organizerName: "Standard Chartered Foundation",
    },
    {
      id: "10",
      title: "KNUST Climate-Health Research Programme",
      description:
        "Part of £20 million West African climate-health research consortium led by KNUST. Supported by Wellcome Trust. Research opportunities exploring how climate factors affect health in the region.",
      date: "2026-05-20",
      category: "seminar",
      targetFields: ["Health", "Engineering", "Tech"],
      eligibleYears: ["3", "4", "postgrad"],
      format: "in-person",
      institution: "KNUST",
      organizerName: "KNUST & Wellcome Trust",
    },
    {
      id: "11",
      title: "Noguchi Institute Quality Week 2026",
      description:
        "Week-long programme focused on biosafety, biosecurity and laboratory quality systems at Noguchi Memorial Institute for Medical Research, University of Ghana.",
      date: "2026-04-08",
      category: "seminar",
      targetFields: ["Health"],
      eligibleYears: ["3", "4", "postgrad"],
      format: "in-person",
      institution: "UG",
      organizerName: "Noguchi Memorial Institute",
    },
    {
      id: "12",
      title: "KNUST DIPPER Lab Internship Programme",
      description:
        "Internship at the Distributed IoT Platforms, Privacy, and Edge-Intelligence Research Lab. Learn about IoT systems, data analytics, sensors, and microcontrollers. Open to CS students.",
      date: "2026-06-01",
      category: "internship",
      targetFields: ["Tech", "Engineering"],
      eligibleYears: ["3", "4"],
      format: "in-person",
      institution: "all",
      organizerName: "KNUST DIPPER Lab",
    },
    {
      id: "13",
      title: "Ashesi-ETH Zurich Joint Masters in Mechatronics",
      description:
        "Joint Master's programme in Mechatronic Engineering offered by Ashesi University and ETH Zurich since January 2022.",
      date: "2026-07-01",
      category: "scholarship",
      targetFields: ["Engineering", "Tech"],
      eligibleYears: ["4", "postgrad"],
      format: "hybrid",
      institution: "Ashesi",
      organizerName: "Ashesi University & ETH Zurich",
    },
    {
      id: "14",
      title: "YALI Regional Leadership Centre Accra",
      description:
        "Young African Leaders Initiative by US government. Leadership training for young leaders from Ghana, Nigeria, Togo, Ivory Coast, The Gambia, Burkina Faso, and more West African countries.",
      date: "2026-05-10",
      category: "workshop",
      targetFields: ["Business", "Social Impact"],
      eligibleYears: ["any"],
      format: "in-person",
      institution: "all",
      organizerName: "YALI West Africa",
    },
    {
      id: "15",
      title: "Tech in Ghana Conference 2026",
      description:
        "Major tech conference showcasing Ghanaian startups and innovation. Networking opportunities with founders, investors, and tech professionals.",
      date: "2026-06-15",
      category: "networking",
      targetFields: ["Tech", "Business"],
      eligibleYears: ["any"],
      format: "in-person",
      institution: "all",
      organizerName: "Tech in Ghana",
    },
  ];

  var currentFilter = "all";
  var userProfile = null;

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readSession() {
    try {
      var raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function readProfileRaw() {
    try {
      var raw = localStorage.getItem(ONBOARDING_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function requireAuthOrRedirect() {
    if (!readSession()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  function runProtectedInit(initFn) {
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
          initFn();
        })
        .catch(function () {
          window.location.href = "login.html";
        });
      return;
    }
    if (!requireAuthOrRedirect()) return;
    initFn();
  }

  function loadUserProfile() {
    if (M && typeof M.buildUserProfile === "function") {
      return M.buildUserProfile(readProfileRaw());
    }
    var raw = readProfileRaw();
    if (!raw) return null;
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

  function initialsFromName(name) {
    var n = (name || "").trim();
    if (!n) return "CC";
    var parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[0][0]).toUpperCase();
  }

  function updateWelcomeSection() {
    var nameEl = document.getElementById("userName");
    var instEl = document.getElementById("userInstitution");
    var avatarEl = document.getElementById("userAvatar");
    if (!nameEl || !instEl || !avatarEl) return;

    var session = readSession();
    var raw = readProfileRaw();
    var displayName = (session && session.name && session.name.split(/\s+/)[0]) || "Kwame";
    nameEl.textContent = "Welcome back, " + displayName + "!";

    if (raw && raw.institution && raw.course) {
      instEl.textContent = raw.institution + " • " + raw.course;
    } else {
      instEl.textContent = "Complete your profile to personalize your feed";
    }

    var fullName = session && session.name ? session.name.trim() : "";
    avatarEl.textContent = initialsFromName(fullName || displayName);
  }

  function getSavedIds() {
    try {
      var raw = localStorage.getItem(SAVED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedIds(ids) {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
    } catch (e) {
      /* ignore */
    }
  }

  function isEventSaved(id) {
    var s = String(id);
    return getSavedIds().some(function (x) {
      return String(x) === s;
    });
  }

  function toggleSavedId(id) {
    var s = String(id);
    var ids = getSavedIds().map(String);
    var i = ids.indexOf(s);
    if (i === -1) {
      ids.push(s);
      setSavedIds(ids);
      return true;
    }
    ids.splice(i, 1);
    setSavedIds(ids);
    return false;
  }

  function handleSaveEvent(eventId, buttonEl) {
    var nowSaved = toggleSavedId(eventId);
    if (document.getElementById("savedGrid")) {
      displaySavedEvents(userProfile, currentFilter);
      return;
    }
    if (buttonEl && buttonEl.getAttribute("data-action") === "save") {
      buttonEl.textContent = nowSaved ? "★ Saved" : "☆ Save";
    }
  }

  function formatEventDate(isoOrStr) {
    if (!isoOrStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(isoOrStr))) {
      var d = new Date(isoOrStr + "T12:00:00");
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }
    return String(isoOrStr);
  }

  function formatFormatLabel(f) {
    var x = String(f || "").toLowerCase();
    if (x === "in-person" || x === "in person") return "In-person";
    if (x === "online") return "Online";
    if (x === "hybrid") return "Hybrid";
    return f;
  }

  function formatInstitutionLabel(inst) {
    var s = String(inst || "").toLowerCase();
    if (s === "all" || (s.includes("open") && s.includes("all"))) return "Open to all";
    return inst || "—";
  }

  function tierClassFromLabel(label) {
    if (label === "Perfect Match") return "perfect";
    if (label === "Great Match") return "great";
    return "good";
  }

  function truncateText(text, max) {
    var t = String(text || "");
    if (t.length <= max) return t;
    return t.slice(0, max).trim() + "…";
  }

  function getTargetFieldsList(ev) {
    return ev.targetFields || ev.tags || [];
  }

  function createEventCard(event, matchScore, matchLabel, useRemoveButton) {
    var badgeHtml = "";
    if (matchLabel) {
      var tier = tierClassFromLabel(matchLabel);
      badgeHtml =
        '<span class="event-card__match event-card__match--' +
        tier +
        '">' +
        escapeHtml(matchLabel) +
        "</span>";
    }

    var cat = String(event.category || "").toUpperCase();
    var fields = getTargetFieldsList(event);
    var tagsHtml = fields
      .map(function (t) {
        return '<span class="event-card__tag">' + escapeHtml(t) + "</span>";
      })
      .join("");

    var actionHtml = useRemoveButton
      ? '<button type="button" class="btn btn-secondary btn-small remove-btn" data-event-id="' +
        escapeHtml(event.id) +
        '">Remove</button>'
      : '<button type="button" class="btn btn-secondary btn-small" data-action="save" data-event-id="' +
        escapeHtml(event.id) +
        '">' +
        (isEventSaved(event.id) ? "★ Saved" : "☆ Save") +
        "</button>";

    return (
      '<article class="event-card" data-event-id="' +
      escapeHtml(event.id) +
      '">' +
      badgeHtml +
      '<span class="event-card__category">' +
      escapeHtml(cat) +
      "</span>" +
      '<div class="event-card__body">' +
      '<h3 class="event-card__title">' +
      escapeHtml(event.title) +
      "</h3>" +
      '<div class="event-card__meta">' +
      "<span>📅 " +
      escapeHtml(formatEventDate(event.date)) +
      "</span>" +
      "<span>📍 " +
      escapeHtml(formatFormatLabel(event.format)) +
      "</span>" +
      "</div>" +
      '<p class="event-card__desc">' +
      escapeHtml(truncateText(event.description, 100)) +
      "</p>" +
      '<div class="event-card__tags">' +
      tagsHtml +
      "</div>" +
      '<div class="event-card__actions">' +
      '<a class="btn btn-primary btn-small" href="event.html?id=' +
      encodeURIComponent(event.id) +
      '">View Details</a>' +
      actionHtml +
      "</div>" +
      "</div>" +
      "</article>"
    );
  }

  function getPostedEventsNormalized() {
    try {
      var raw = localStorage.getItem(POSTED_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map(adaptPostedToSampleShape);
    } catch (e) {
      return [];
    }
  }

  function adaptPostedToSampleShape(ev) {
    var cat = (ev.filter || String(ev.category || "").toLowerCase()).toLowerCase();
    var years = ev.eligibleYears;
    if (typeof years === "string") {
      years = years.split(",").map(function (s) {
        return s.trim();
      });
    } else if (!Array.isArray(years)) {
      years = [];
    }
    var fmt = String(ev.format || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
    if (fmt === "in-person") fmt = "in-person";
    var inst = ev.institution || "";
    var instLower = String(inst).toLowerCase();
    if (instLower.indexOf("open") !== -1 && instLower.indexOf("all") !== -1) inst = "all";
    return {
      id: ev.id,
      title: ev.title,
      description: ev.description || "",
      date: ev.date,
      category: cat,
      targetFields: ev.tags || ev.targetFields || [],
      eligibleYears: years,
      format: fmt || "online",
      institution: instLower === "open to all" || instLower === "open" ? "all" : inst,
      organizerName: ev.organizerName || ev.organizer || "",
    };
  }

  function getAllEvents() {
    return sampleEvents.concat(getPostedEventsNormalized());
  }

  function findEventById(id) {
    if (id == null || id === "") return null;
    var s = String(id);
    var all = getAllEvents();
    for (var i = 0; i < all.length; i++) {
      if (String(all[i].id) === s) return all[i];
    }
    return null;
  }

  function displayEvents(events, profile, filter) {
    var filterVal = filter == null ? "all" : filter;
    var grid = document.getElementById("eventsGrid");
    var empty = document.getElementById("emptyState");
    var content = document.getElementById("content");
    if (!grid || !empty || !content) return;

    var list =
      M && typeof M.getPersonalizedEvents === "function"
        ? M.getPersonalizedEvents(events, profile, filterVal)
        : events.slice();

    if (!list.length) {
      empty.hidden = false;
      content.hidden = true;
      return;
    }

    empty.hidden = true;
    content.hidden = false;
    grid.innerHTML = "";

    list.forEach(function (ev) {
      var score = ev.matchScore != null ? ev.matchScore : M ? M.calculateMatchScore(profile, ev) : 0;
      var labelStr = M && typeof M.getMatchLabel === "function" ? M.getMatchLabel(score) : "";
      var html = createEventCard(ev, score, labelStr || null, false);
      grid.insertAdjacentHTML("beforeend", html);
    });
  }

  function displaySavedEvents(profile, filter) {
    var filterVal = filter == null ? "all" : filter;
    var grid = document.getElementById("savedGrid");
    var empty = document.getElementById("emptyState");
    var content = document.getElementById("content");
    if (!grid || !empty || !content) return;

    var titleEl = document.getElementById("emptyStateTitle");
    var hintEl = document.getElementById("emptyStateHint");
    var browseBtn = document.getElementById("emptyStateBrowse");

    var savedIds = getSavedIds().map(String);
    var all = getAllEvents();
    var savedEvents = all.filter(function (e) {
      return savedIds.indexOf(String(e.id)) !== -1;
    });

    var list =
      M && typeof M.getPersonalizedEvents === "function"
        ? M.getPersonalizedEvents(savedEvents, profile, filterVal)
        : savedEvents.slice();

    if (savedEvents.length === 0) {
      empty.hidden = false;
      content.hidden = true;
      if (titleEl) titleEl.textContent = "No saved events yet";
      if (hintEl)
        hintEl.textContent = "Browse events and save the ones you're interested in";
      if (browseBtn) browseBtn.hidden = false;
      return;
    }

    if (!list.length) {
      empty.hidden = false;
      content.hidden = true;
      if (titleEl) titleEl.textContent = "No events found";
      if (hintEl) hintEl.textContent = "Try a different filter";
      if (browseBtn) browseBtn.hidden = true;
      return;
    }

    empty.hidden = true;
    content.hidden = false;
    grid.innerHTML = "";

    list.forEach(function (ev) {
      var score = ev.matchScore != null ? ev.matchScore : M ? M.calculateMatchScore(profile, ev) : 0;
      var labelStr = M && typeof M.getMatchLabel === "function" ? M.getMatchLabel(score) : "";
      var html = createEventCard(ev, score, labelStr || null, true);
      grid.insertAdjacentHTML("beforeend", html);
    });
  }

  function setupFilters() {
    document.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(function (b) {
          b.classList.remove("is-active");
        });
        btn.classList.add("is-active");
        currentFilter = btn.getAttribute("data-filter") || "all";
        if (document.getElementById("eventsGrid")) {
          displayEvents(getAllEvents(), userProfile, currentFilter);
        }
        if (document.getElementById("savedGrid")) {
          displaySavedEvents(userProfile, currentFilter);
        }
      });
    });
  }

  function bindDashboardGridClicks() {
    var grid = document.getElementById("eventsGrid");
    if (!grid || grid.dataset.saveBound === "1") return;
    grid.dataset.saveBound = "1";
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest('[data-action="save"]');
      if (!btn) return;
      handleSaveEvent(btn.getAttribute("data-event-id"), btn);
    });
  }

  function bindSavedGridClicks() {
    var grid = document.getElementById("savedGrid");
    if (!grid || grid.dataset.removeBound === "1") return;
    grid.dataset.removeBound = "1";
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".remove-btn");
      if (!btn) return;
      handleSaveEvent(btn.getAttribute("data-event-id"), btn);
    });
  }

  function initDashboard() {
    userProfile = loadUserProfile();
    updateWelcomeSection();
    setupFilters();
    bindDashboardGridClicks();

    window.setTimeout(function () {
      var loading = document.getElementById("loading");
      if (loading) loading.hidden = true;
      displayEvents(getAllEvents(), userProfile, "all");
    }, 350);
  }

  function initSavedPage() {
    userProfile = loadUserProfile();
    setupFilters();
    bindSavedGridClicks();

    window.setTimeout(function () {
      var loading = document.getElementById("loading");
      if (loading) loading.hidden = true;
      displaySavedEvents(userProfile, "all");
    }, 350);
  }

  function eligibleYearsDisplay(ev) {
    var y = ev.eligibleYears;
    if (Array.isArray(y)) return y.join(", ");
    return y || "—";
  }

  function fillDescription(el, text) {
    if (!el) return;
    el.innerHTML = "";
    var p = document.createElement("p");
    p.textContent = text || "";
    el.appendChild(p);
  }

  function fillFieldTags(el, ev) {
    if (!el) return;
    el.innerHTML = "";
    getTargetFieldsList(ev).forEach(function (t) {
      var span = document.createElement("span");
      span.className = "event-card__tag";
      span.textContent = t;
      el.appendChild(span);
    });
  }

  function syncDetailSaveBtn(btn, id) {
    if (!btn) return;
    btn.textContent = isEventSaved(id) ? "★ Saved" : "☆ Save Event";
  }

  function initEventDetail() {
    var container = document.getElementById("eventContainer");
    if (!container) return;

    var loading = document.getElementById("eventLoading");
    var notFound = document.getElementById("eventNotFound");
    var id =
      typeof window.__eventIdParam !== "undefined" && window.__eventIdParam !== null
        ? window.__eventIdParam
        : new URLSearchParams(window.location.search).get("id");

    window.setTimeout(function () {
      if (loading) loading.hidden = true;

      var ev = findEventById(id);
      if (!ev) {
        if (notFound) notFound.hidden = false;
        document.title = "Event not found — CampusConnect";
        return;
      }

      document.title = ev.title + " — CampusConnect";

      var catEl = document.getElementById("eventCategory");
      var titleEl = document.getElementById("eventTitle");
      var metaEl = document.getElementById("eventMeta");
      var descEl = document.getElementById("eventDescription");
      var fieldsEl = document.getElementById("eventFields");
      var yearsEl = document.getElementById("eventYears");
      var orgEl = document.getElementById("eventOrganizer");
      var saveBtn = document.getElementById("saveBtn");
      var shareBtn = document.getElementById("shareBtn");

      if (catEl) catEl.textContent = String(ev.category || "").toUpperCase();
      if (titleEl) titleEl.textContent = ev.title;

      if (metaEl) {
        metaEl.innerHTML = "";
        var s1 = document.createElement("span");
        s1.textContent = "📅 " + formatEventDate(ev.date);
        var s2 = document.createElement("span");
        s2.textContent = "📍 " + formatFormatLabel(ev.format);
        var s3 = document.createElement("span");
        s3.textContent = "🏫 " + formatInstitutionLabel(ev.institution);
        metaEl.appendChild(s1);
        metaEl.appendChild(s2);
        metaEl.appendChild(s3);
      }

      fillDescription(descEl, ev.description);
      fillFieldTags(fieldsEl, ev);
      if (yearsEl) yearsEl.textContent = eligibleYearsDisplay(ev);
      if (orgEl) orgEl.textContent = ev.organizerName || ev.organizer || "—";

      container.hidden = false;

      syncDetailSaveBtn(saveBtn, ev.id);
      if (saveBtn) {
        saveBtn.onclick = function () {
          toggleSavedId(ev.id);
          syncDetailSaveBtn(saveBtn, ev.id);
        };
      }

      if (shareBtn) {
        shareBtn.hidden = false;
        shareBtn.onclick = function () {
          var shareData = { title: ev.title, url: window.location.href };
          if (navigator.share) {
            navigator.share(shareData).catch(function () {});
          } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(window.location.href).then(function () {
              shareBtn.textContent = "Link copied";
              window.setTimeout(function () {
                shareBtn.textContent = "Share";
              }, 2000);
            });
          }
        };
      }
    }, 400);
  }

  var TARGET_FIELD_LABEL = {
    tech: "Tech",
    business: "Business",
    health: "Health",
    arts: "Arts",
    law: "Law",
    engineering: "Engineering",
    "social-impact": "Social Impact",
    finance: "Finance",
    all: "All fields",
  };

  var YEAR_LABEL = {
    any: "Any year",
    "1": "1st Year",
    "2plus": "2nd+",
    "3plus": "3rd+",
    final: "Final Year",
    postgrad: "Postgrad",
  };

  function getPostedEventsRaw() {
    try {
      var raw = localStorage.getItem(POSTED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setPostedEvents(arr) {
    try {
      localStorage.setItem(POSTED_KEY, JSON.stringify(arr));
    } catch (e) {
      /* ignore */
    }
  }

  function formatDateDisplay(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function initSubmitForm() {
    var form = document.getElementById("submitForm");
    if (!form) return;
    var successEl = document.getElementById("submitSuccess");
    var errorEl = document.getElementById("submitError");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (successEl) successEl.hidden = true;
      if (errorEl) {
        errorEl.hidden = true;
        errorEl.textContent = "";
      }

      var titleEl = document.getElementById("eventTitle");
      var descEl = document.getElementById("eventDescription");
      var dateEl = document.getElementById("eventDate");
      var catEl = document.getElementById("eventCategory");
      var fmtEl = document.getElementById("eventFormat");
      var instEl = document.getElementById("eventInstitution");

      var title = titleEl ? titleEl.value.trim() : "";
      var desc = descEl ? descEl.value.trim() : "";
      var date = dateEl ? dateEl.value : "";
      var cat = catEl ? catEl.value : "";
      var fmt = fmtEl ? fmtEl.value : "";
      var inst = instEl ? instEl.value : "";

      var tf = form.querySelectorAll('input[name="targetFields"]:checked');
      var ey = form.querySelectorAll('input[name="eligibleYears"]:checked');

      function showErr(msg) {
        if (errorEl) {
          errorEl.textContent = msg;
          errorEl.hidden = false;
        }
      }

      if (!title) return showErr("Please enter a title.");
      if (!desc) return showErr("Please enter a description.");
      if (!date) return showErr("Please choose a date.");
      if (!cat) return showErr("Please select a category.");
      if (!fmt) return showErr("Please select a format.");
      if (!inst) return showErr("Please select an institution.");
      if (tf.length === 0) return showErr("Select at least one target field.");
      if (ey.length === 0) return showErr("Select at least one eligible year option.");

      var tags = [];
      var hasAll = false;
      Array.prototype.forEach.call(tf, function (inp) {
        if (inp.value === "all") hasAll = true;
      });
      if (hasAll) {
        tags = ["All fields"];
      } else {
        Array.prototype.forEach.call(tf, function (inp) {
          tags.push(TARGET_FIELD_LABEL[inp.value] || inp.value);
        });
      }

      var years = [];
      Array.prototype.forEach.call(ey, function (inp) {
        years.push(YEAR_LABEL[inp.value] || inp.value);
      });

      var catText = catEl.options[catEl.selectedIndex].text;
      var fmtText = fmtEl.options[fmtEl.selectedIndex].text;
      var instText = instEl.options[instEl.selectedIndex].text;

      var paragraphs = desc.split(/\n\s*\n/).filter(function (p) {
        return p.trim().length > 0;
      });
      if (paragraphs.length === 0) paragraphs = [desc];

      var newEvent = {
        id: "p" + Date.now(),
        filter: cat,
        category: catText.toUpperCase(),
        title: title,
        date: formatDateDisplay(date),
        format: fmtText,
        institution: instText,
        description: desc,
        paragraphs: paragraphs,
        tags: tags,
        eligibleYears: years.join(", "),
        organizer: "Posted via CampusConnect",
        matchScore: 0.82,
      };

      var posted = getPostedEventsRaw();
      posted.push(newEvent);
      setPostedEvents(posted);

      form.reset();
      document.querySelectorAll("#submitForm .checkbox-item").forEach(function (item) {
        item.classList.remove("selected");
      });

      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("eventContainer")) {
      runProtectedInit(initEventDetail);
    } else if (document.getElementById("savedGrid")) {
      runProtectedInit(initSavedPage);
    } else if (document.getElementById("submitForm")) {
      runProtectedInit(initSubmitForm);
    } else if (document.getElementById("eventsGrid")) {
      runProtectedInit(initDashboard);
    }
  });

  window.CampusConnectEvents = {
    sampleEvents: sampleEvents,
    getAllEvents: getAllEvents,
    findEventById: findEventById,
    displayEvents: displayEvents,
    displaySavedEvents: displaySavedEvents,
    setupFilters: setupFilters,
    handleSaveEvent: handleSaveEvent,
    createEventCard: createEventCard,
  };
})();
