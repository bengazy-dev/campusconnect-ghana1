// Loading, filtering, displaying, and interacting with event listings and detail.

(function () {
  var M = window.CampusConnectMatching;

  var mockEvents = [
    {
      id: "e1",
      filter: "workshop",
      category: "WORKSHOP",
      title: "Full-Stack Web Sprint",
      date: "Sat, Apr 5",
      format: "In-person",
      institution: "KNUST",
      description:
        "Build a small app end-to-end with mentors. Great for students who want hands-on coding practice and portfolio pieces.",
      paragraphs: [
        "Build a small app end-to-end with mentors. Great for students who want hands-on coding practice and portfolio pieces.",
        "Sessions run in three-hour blocks with code reviews and a demo day at the end. Laptops required; food provided.",
      ],
      tags: ["Tech", "Engineering"],
      eligibleYears: "2nd–4th Year, Postgrad",
      organizer: "KNUST Tech Society",
      matchScore: 0.91,
    },
    {
      id: "e2",
      filter: "internship",
      category: "INTERNSHIP",
      title: "Summer Analyst Program",
      date: "Apply by Apr 20",
      format: "Hybrid",
      institution: "UPSA",
      description:
        "Structured internship with rotations in product and data. Open to penultimate-year students with strong analytical skills.",
      paragraphs: [
        "Structured internship with rotations in product and data. Open to penultimate-year students with strong analytical skills.",
        "You will work with a mentor, present a capstone, and may receive a return offer for top performers.",
      ],
      tags: ["Business", "Finance"],
      eligibleYears: "Penultimate year",
      organizer: "Career Services Consortium",
      matchScore: 0.78,
    },
    {
      id: "e3",
      filter: "scholarship",
      category: "SCHOLARSHIP",
      title: "STEM Excellence Award",
      date: "Deadline May 1",
      format: "Online",
      institution: "Open (Ghana universities)",
      description:
        "Merit-based support for STEM majors. Includes mentorship and a community of past recipients.",
      paragraphs: [
        "Merit-based support for STEM majors. Includes mentorship and a community of past recipients.",
        "Shortlisted applicants complete a short video interview; awards are announced before semester break.",
      ],
      tags: ["Tech", "Social Impact"],
      eligibleYears: "All undergraduate years",
      organizer: "STEM Ghana Foundation",
      matchScore: 0.88,
    },
    {
      id: "e4",
      filter: "competition",
      category: "COMPETITION",
      title: "Campus Innovation Challenge",
      date: "Apr 12–26",
      format: "In-person",
      institution: "Ashesi University",
      description:
        "Pitch your idea to judges and win seed funding. Teams of 2–5; design and business tracks available.",
      paragraphs: [
        "Pitch your idea to judges and win seed funding. Teams of 2–5; design and business tracks available.",
        "Workshops on lean canvas and pitching are included in week one before elimination rounds.",
      ],
      tags: ["Business", "Tech"],
      eligibleYears: "Teams of 2–5 (any year)",
      organizer: "Ashesi Entrepreneurship Centre",
      matchScore: 0.7,
    },
    {
      id: "e5",
      filter: "seminar",
      category: "SEMINAR",
      title: "Public Speaking for Leaders",
      date: "Wed, Apr 9",
      format: "Online",
      institution: "UCC",
      description:
        "Short seminar on structuring talks and handling Q&A—useful for class presentations and club leadership.",
      paragraphs: [
        "Short seminar on structuring talks and handling Q&A—useful for class presentations and club leadership.",
        "Bring a two-minute draft talk for live coaching in breakout rooms.",
      ],
      tags: ["Arts", "Social Impact"],
      eligibleYears: "All years",
      organizer: "UCC Communications Guild",
      matchScore: 0.62,
    },
    {
      id: "e6",
      filter: "networking",
      category: "NETWORKING",
      title: "Alumni Mixer — Engineering",
      date: "Fri, Apr 11",
      format: "In-person",
      institution: "UG",
      description:
        "Meet graduates working in industry. Casual format with short intros and open networking time.",
      paragraphs: [
        "Meet graduates working in industry. Casual format with short intros and open networking time.",
        "Dress code: smart casual. RSVP required for catering numbers.",
      ],
      tags: ["Engineering", "Networking"],
      eligibleYears: "3rd Year and above",
      organizer: "UG Engineering Alumni Chapter",
      matchScore: 0.84,
    },
  ];

  function getEventById(id) {
    if (!id) return null;
    for (var i = 0; i < mockEvents.length; i++) {
      if (mockEvents[i].id === id) return mockEvents[i];
    }
    return null;
  }

  function readProfile() {
    try {
      var raw = localStorage.getItem("campusconnect_onboarding");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function getSavedIds() {
    try {
      var raw = localStorage.getItem("campusconnect_saved_events");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedIds(ids) {
    try {
      localStorage.setItem("campusconnect_saved_events", JSON.stringify(ids));
    } catch (e) {
      /* ignore */
    }
  }

  function isEventSaved(id) {
    return getSavedIds().indexOf(id) !== -1;
  }

  function toggleSaved(id) {
    var ids = getSavedIds().slice();
    var idx = ids.indexOf(id);
    if (idx === -1) ids.push(id);
    else ids.splice(idx, 1);
    setSavedIds(ids);
    return idx === -1;
  }

  function applyProfileToHeader(profile) {
    var nameEl = document.getElementById("userName");
    var instEl = document.getElementById("userInstitution");
    var avatarEl = document.getElementById("userAvatar");
    if (!nameEl || !instEl || !avatarEl) return;

    if (profile && profile.institution && profile.course) {
      instEl.textContent = profile.institution + " • " + profile.course;
    }

    var fullName = profile && profile.name ? profile.name.trim() : "";
    var displayName = fullName ? fullName.split(/\s+/)[0] : "Kwame";
    nameEl.textContent = "Welcome back, " + displayName + "!";

    var initials = "KW";
    if (fullName) {
      var parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else if (parts[0].length >= 2) {
        initials = parts[0].slice(0, 2).toUpperCase();
      } else {
        initials = (parts[0][0] + parts[0][0]).toUpperCase();
      }
    }
    avatarEl.textContent = initials;
  }

  function tierClass(tier) {
    if (tier === "perfect") return "event-card__match--perfect";
    if (tier === "great") return "event-card__match--great";
    return "event-card__match--good";
  }

  function createCard(event, profile) {
    var score = M.scoreEventForUser(event, profile);
    var label = M.getMatchLabel(score);
    var article = document.createElement("article");
    article.className = "event-card";
    article.dataset.eventId = event.id;

    var match = document.createElement("span");
    match.className = "event-card__match " + tierClass(label.tier);
    match.textContent = label.text;

    var cat = document.createElement("span");
    cat.className = "event-card__category";
    cat.textContent = event.category;

    var body = document.createElement("div");
    body.className = "event-card__body";

    var title = document.createElement("h3");
    title.className = "event-card__title";
    title.textContent = event.title;

    var meta = document.createElement("div");
    meta.className = "event-card__meta";
    var d1 = document.createElement("span");
    d1.textContent = "📅 " + event.date;
    var d2 = document.createElement("span");
    d2.textContent = "📍 " + event.format;
    meta.appendChild(d1);
    meta.appendChild(d2);

    var desc = document.createElement("p");
    desc.className = "event-card__desc";
    desc.textContent = event.description;

    var tagsWrap = document.createElement("div");
    tagsWrap.className = "event-card__tags";
    event.tags.forEach(function (t) {
      var span = document.createElement("span");
      span.className = "event-card__tag";
      span.textContent = t;
      tagsWrap.appendChild(span);
    });

    var actions = document.createElement("div");
    actions.className = "event-card__actions";
    var detail = document.createElement("a");
    detail.className = "btn btn-primary btn-small";
    detail.href = "event.html?id=" + encodeURIComponent(event.id);
    detail.textContent = "View Details";
    var save = document.createElement("button");
    save.type = "button";
    save.className = "btn btn-secondary btn-small";
    save.dataset.action = "save";
    save.dataset.eventId = event.id;
    save.textContent = isEventSaved(event.id) ? "★ Saved" : "☆ Save";
    save.addEventListener("click", function () {
      var nowSaved = toggleSaved(event.id);
      save.textContent = nowSaved ? "★ Saved" : "☆ Save";
    });
    actions.appendChild(detail);
    actions.appendChild(save);

    body.appendChild(title);
    body.appendChild(meta);
    body.appendChild(desc);
    body.appendChild(tagsWrap);
    body.appendChild(actions);

    article.appendChild(match);
    article.appendChild(cat);
    article.appendChild(body);

    return article;
  }

  var currentFilter = "all";

  function filterEvents(events) {
    if (currentFilter === "all") return events.slice();
    return events.filter(function (e) {
      return e.filter === currentFilter;
    });
  }

  function render() {
    var grid = document.getElementById("eventsGrid");
    var empty = document.getElementById("emptyState");
    var content = document.getElementById("content");
    if (!grid || !empty || !content) return;

    grid.innerHTML = "";
    var profile = readProfile();
    var list = filterEvents(mockEvents);

    if (list.length === 0) {
      empty.hidden = false;
      content.hidden = true;
      return;
    }

    empty.hidden = true;
    content.hidden = false;
    list.forEach(function (ev) {
      grid.appendChild(createCard(ev, profile));
    });
  }

  function setActiveFilter(btn) {
    document.querySelectorAll(".filter-btn").forEach(function (b) {
      b.classList.toggle("is-active", b === btn);
    });
  }

  function syncSaveButton(btn, id) {
    if (!btn) return;
    btn.textContent = isEventSaved(id) ? "★ Saved" : "☆ Save Event";
  }

  function fillDescription(el, paragraphs) {
    if (!el) return;
    el.innerHTML = "";
    var list = paragraphs && paragraphs.length ? paragraphs : [];
    if (list.length === 0) {
      var p = document.createElement("p");
      p.textContent = "";
      el.appendChild(p);
      return;
    }
    list.forEach(function (text) {
      var p = document.createElement("p");
      p.textContent = text;
      el.appendChild(p);
    });
  }

  function fillTags(el, tags) {
    if (!el) return;
    el.innerHTML = "";
    (tags || []).forEach(function (t) {
      var span = document.createElement("span");
      span.className = "event-card__tag";
      span.textContent = t;
      el.appendChild(span);
    });
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

      var ev = getEventById(id);
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

      if (catEl) catEl.textContent = ev.category;
      if (titleEl) titleEl.textContent = ev.title;

      if (metaEl) {
        metaEl.innerHTML = "";
        var s1 = document.createElement("span");
        s1.textContent = "📅 " + ev.date;
        var s2 = document.createElement("span");
        s2.textContent = "📍 " + ev.format;
        var s3 = document.createElement("span");
        s3.textContent = "🏫 " + ev.institution;
        metaEl.appendChild(s1);
        metaEl.appendChild(s2);
        metaEl.appendChild(s3);
      }

      var paras = ev.paragraphs;
      if (!paras || !paras.length) {
        paras = ev.description ? [ev.description] : [];
      }
      fillDescription(descEl, paras);
      fillTags(fieldsEl, ev.tags);
      if (yearsEl) yearsEl.textContent = ev.eligibleYears || "—";
      if (orgEl) orgEl.textContent = ev.organizer || "—";

      container.hidden = false;

      syncSaveButton(saveBtn, ev.id);
      if (saveBtn) {
        saveBtn.onclick = function () {
          toggleSaved(ev.id);
          syncSaveButton(saveBtn, ev.id);
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

  function initDashboard() {
    applyProfileToHeader(readProfile());

    document.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentFilter = btn.getAttribute("data-filter") || "all";
        setActiveFilter(btn);
        render();
      });
    });

    window.setTimeout(function () {
      var loading = document.getElementById("loading");
      if (loading) loading.hidden = true;
      render();
    }, 450);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("eventContainer")) {
      initEventDetail();
    } else {
      initDashboard();
    }
  });

  window.CampusConnectEvents = {
    getEventById: getEventById,
    mockEvents: mockEvents,
  };
})();
