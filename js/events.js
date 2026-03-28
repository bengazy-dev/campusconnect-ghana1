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
      description:
        "Build a small app end-to-end with mentors. Great for students who want hands-on coding practice and portfolio pieces.",
      tags: ["Tech", "Engineering"],
      matchScore: 0.91,
    },
    {
      id: "e2",
      filter: "internship",
      category: "INTERNSHIP",
      title: "Summer Analyst Program",
      date: "Apply by Apr 20",
      format: "Hybrid",
      description:
        "Structured internship with rotations in product and data. Open to penultimate-year students with strong analytical skills.",
      tags: ["Business", "Finance"],
      matchScore: 0.78,
    },
    {
      id: "e3",
      filter: "scholarship",
      category: "SCHOLARSHIP",
      title: "STEM Excellence Award",
      date: "Deadline May 1",
      format: "Online",
      description:
        "Merit-based support for STEM majors. Includes mentorship and a community of past recipients.",
      tags: ["Tech", "Social Impact"],
      matchScore: 0.88,
    },
    {
      id: "e4",
      filter: "competition",
      category: "COMPETITION",
      title: "Campus Innovation Challenge",
      date: "Apr 12–26",
      format: "In-person",
      description:
        "Pitch your idea to judges and win seed funding. Teams of 2–5; design and business tracks available.",
      tags: ["Business", "Tech"],
      matchScore: 0.7,
    },
    {
      id: "e5",
      filter: "seminar",
      category: "SEMINAR",
      title: "Public Speaking for Leaders",
      date: "Wed, Apr 9",
      format: "Online",
      description:
        "Short seminar on structuring talks and handling Q&A—useful for class presentations and club leadership.",
      tags: ["Arts", "Social Impact"],
      matchScore: 0.62,
    },
    {
      id: "e6",
      filter: "networking",
      category: "NETWORKING",
      title: "Alumni Mixer — Engineering",
      date: "Fri, Apr 11",
      format: "In-person",
      description:
        "Meet graduates working in industry. Casual format with short intros and open networking time.",
      tags: ["Engineering", "Networking"],
      matchScore: 0.84,
    },
  ];

  function readProfile() {
    try {
      var raw = localStorage.getItem("campusconnect_onboarding");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
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
    save.textContent = "☆ Save";
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

  document.addEventListener("DOMContentLoaded", function () {
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
  });
})();
