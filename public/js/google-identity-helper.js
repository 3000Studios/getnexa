(function () {
  "use strict";

  window.GoogleIdentityHelper = {
    load: function () {
      return new Promise(function (resolve, reject) {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          resolve();
          return;
        }

        var existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existing) {
          existing.addEventListener("load", function () { resolve(); }, { once: true });
          existing.addEventListener("error", function () { reject(new Error("Failed to load Google Identity Services.")); }, { once: true });
          return;
        }

        var script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = function () { resolve(); };
        script.onerror = function () { reject(new Error("Failed to load Google Identity Services.")); };
        document.head.appendChild(script);
      });
    },

    decodeCredential: function (credential) {
      var payload = credential.split(".")[1];
      if (!payload) throw new Error("Invalid Google credential.");
      var normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
      var json = decodeURIComponent(
        atob(normalized)
          .split("")
          .map(function (char) {
            return "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(json);
    },

    init: function (clientId, callback) {
      return this.load().then(function () {
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
          throw new Error("Google Identity Services unavailable.");
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: callback
        });
      });
    },

    renderButton: function (elementId, clientId, callback, options) {
      options = options || {};
      return this.init(clientId, callback).then(function () {
        var el = document.getElementById(elementId);
        if (!el) throw new Error("Missing Google button element: " + elementId);

        window.google.accounts.id.renderButton(el, {
          type: options.type || "standard",
          theme: options.theme || "outline",
          size: options.size || "large",
          text: options.text || "signin_with",
          shape: options.shape || "rectangular",
          width: options.width
        });
      });
    },

    prompt: function () {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.prompt();
      }
    },

    revoke: function (emailOrSub, callback) {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.revoke(emailOrSub, callback);
      }
    },

    disableAutoSelect: function () {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    }
  };
})();
