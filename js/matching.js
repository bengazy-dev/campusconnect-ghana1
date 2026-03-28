// Event-to-user matching logic and recommendation scoring.

(function () {
  /**
   * @param {number} score — 0..1 match strength
   * @returns {{ text: string, tier: 'perfect'|'great'|'good' }}
   */
  function getMatchLabel(score) {
    var s = typeof score === "number" && !isNaN(score) ? score : 0;
    if (s >= 0.85) return { text: "Perfect Match", tier: "perfect" };
    if (s >= 0.65) return { text: "Great Match", tier: "great" };
    return { text: "Good Match", tier: "good" };
  }

  /**
   * Placeholder: combine event attributes with a stored profile to produce 0..1 score.
   * @param {object} event
   * @param {object|null} profile
   */
  function scoreEventForUser(event, profile) {
    if (event && typeof event.matchScore === "number") return event.matchScore;
    return 0.72;
  }

  window.CampusConnectMatching = {
    getMatchLabel: getMatchLabel,
    scoreEventForUser: scoreEventForUser,
  };
})();
