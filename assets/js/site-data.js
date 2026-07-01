(function () {
  "use strict";

  function loadJSON(path) {
    return fetch(path, { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .catch(function () { return null; });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function extractYouTubeId(url) {
    if (!url) return null;
    var patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
      /(?:youtu\.be\/)([\w-]{11})/,
      /(?:youtube\.com\/embed\/)([\w-]{11})/,
      /(?:youtube\.com\/shorts\/)([\w-]{11})/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = url.match(patterns[i]);
      if (m) return m[1];
    }
    return null;
  }

  function applyContact(contact) {
    if (!contact) return;

    var emailEl = document.getElementById("contact-email");
    if (emailEl && contact.email) {
      emailEl.textContent = contact.email;
      emailEl.href = "mailto:" + contact.email;
    }

    var phoneEl = document.getElementById("contact-phone");
    if (phoneEl && contact.phone_display) {
      phoneEl.textContent = contact.phone_display;
      var telDigits = contact.phone_tel || contact.phone_display.replace(/[^\d+]/g, "");
      phoneEl.href = "tel:" + telDigits;
    }

    var waEl = document.getElementById("contact-whatsapp");
    if (waEl && contact.whatsapp_display) {
      waEl.textContent = contact.whatsapp_display;
      var waDigits = contact.whatsapp_number || contact.whatsapp_display.replace(/[^\d]/g, "");
      waEl.href = "https://wa.me/" + waDigits;
    }

    var addrEl = document.getElementById("contact-address");
    if (addrEl && contact.address) {
      addrEl.innerHTML = String(contact.address).split("\n").map(escapeHtml).join("<br>");
    }
  }

  function buildClientChip(logo, hidden) {
    var div = document.createElement("div");
    div.className = "client-chip " + (logo.variant === "dark" ? "dark" : "light");
    if (hidden) div.setAttribute("aria-hidden", "true");
    var img = document.createElement("img");
    img.src = logo.image;
    img.alt = hidden ? "" : (logo.name || "");
    div.appendChild(img);
    return div;
  }

  function applyClients(data) {
    if (!data || !Array.isArray(data.logos) || !data.logos.length) return;
    var track = document.getElementById("clients-marquee-track");
    if (!track) return;
    track.innerHTML = "";
    data.logos.forEach(function (logo) { track.appendChild(buildClientChip(logo, false)); });
    data.logos.forEach(function (logo) { track.appendChild(buildClientChip(logo, true)); });
  }

  function applyFactory(data) {
    if (!data || !Array.isArray(data.photos) || !data.photos.length) return;
    var grid = document.getElementById("facility-gallery-grid");
    if (!grid) return;
    grid.innerHTML = "";
    data.photos.forEach(function (photo) {
      var img = document.createElement("img");
      if (photo.size === "tall") img.className = "tall";
      img.src = photo.image;
      img.alt = photo.caption || "";
      grid.appendChild(img);
    });
  }

  function applyVideos(data) {
    if (!data || !Array.isArray(data.videos) || !data.videos.length) return;
    var grid = document.getElementById("videos-grid");
    if (!grid) return;
    grid.innerHTML = "";

    data.videos.forEach(function (video) {
      var id = extractYouTubeId(video.url);
      if (!id) return;

      var card = document.createElement("div");
      card.className = "video-card";

      var embed = document.createElement("div");
      embed.className = "video-embed";

      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + id;
      iframe.title = video.title || "YouTube video";
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      embed.appendChild(iframe);
      card.appendChild(embed);

      if (video.title) {
        var title = document.createElement("p");
        title.className = "video-title";
        title.textContent = video.title;
        card.appendChild(title);
      }

      grid.appendChild(card);
    });

    if (grid.children.length) {
      var section = document.getElementById("videos");
      var navLink = document.getElementById("nav-videos-link");
      var footerLink = document.getElementById("footer-videos-link");
      if (section) section.style.display = "";
      if (navLink) navLink.style.display = "";
      if (footerLink) footerLink.style.display = "";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
      loadJSON("data/contact.json"),
      loadJSON("data/clients.json"),
      loadJSON("data/factory.json"),
      loadJSON("data/videos.json")
    ]).then(function (results) {
      applyContact(results[0]);
      applyClients(results[1]);
      applyFactory(results[2]);
      applyVideos(results[3]);
    });
  });
})();
