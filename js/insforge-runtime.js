/* Loads InsForge SDK once and exposes window.getInsforgeClient() for auth + DB. */
(function () {
  var BASE_URL = "https://hzx6vhb6.us-east.insforge.app";
  var ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTA1OTZ9.chcEy1gewO7sdHWnVCxa5utccFoRLQWtQscR-Pqunhc";

  window.INSFORGE_BASE_URL = BASE_URL;

  window.getInsforgeClient = function () {
    if (window.__campusConnectInsforge) {
      return Promise.resolve(window.__campusConnectInsforge);
    }
    return import("https://esm.sh/@insforge/sdk@latest").then(function (mod) {
      var createClient = mod.createClient;
      if (typeof createClient !== "function" && mod.default) {
        createClient = typeof mod.default === "function" ? mod.default : mod.default.createClient;
      }
      window.__campusConnectInsforge = createClient({
        baseUrl: BASE_URL,
        anonKey: ANON_KEY,
      });
      return window.__campusConnectInsforge;
    });
  };
})();
