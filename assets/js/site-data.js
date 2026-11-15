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
      var waFloat = document.getElementById("whatsapp-float");
      if (waFloat) waFloat.href = "https://wa.me/" + waDigits;
    }

    var addrEl = document.getElementById("contact-address");
    if (addrEl && contact.address) {
      addrEl.innerHTML = String(contact.address).split("\n").map(escapeHtml).join("<br>");
    }

    var formEl = document.getElementById("contact-form");
    if (formEl && contact.formEndpoint) {
      formEl.action = contact.formEndpoint;
    }
  }

  function buildClientChip(logo, hidden) {
    var div = document.createElement("div");
    div.className = "client-chip " + (logo.variant === "dark" ? "dark" : "light");
    if (hidden) div.setAttribute("aria-hidden", "true");
    var img = document.createElement("img");
    img.loading = "lazy";
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
      img.loading = "lazy";
      img.src = photo.image;
      img.alt = photo.caption || "";
      grid.appendChild(img);
    });
  }

  // Pop-up player. The YouTube iframe is created only when a card is clicked and removed on close.
  function openVideo(id, title) {
    var dialog = document.getElementById("video-dialog");
    var frame = document.getElementById("video-dialog-frame");
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    iframe.title = title || "YouTube video";
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
    iframe.setAttribute("allowfullscreen", "");
    frame.innerHTML = "";
    frame.appendChild(iframe);
    dialog.showModal();
  }

  function setupVideoDialog() {
    var dialog = document.getElementById("video-dialog");
    if (!dialog) return;
    dialog.addEventListener("close", function () {
      document.getElementById("video-dialog-frame").innerHTML = ""; // stops playback
    });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog || e.target.closest(".video-dialog-close")) dialog.close();
    });
  }

  function buildVideoCard(video, id) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "video-card" + (video.featured ? " featured" : "");
    card.setAttribute("aria-label", "Play video: " + (video.title || "YouTube video"));

    var thumbWrap = document.createElement("span");
    thumbWrap.className = "video-thumb";
    var img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    // The channel's own custom thumbnails; bigger file only for the featured card.
    img.src = "https://i.ytimg.com/vi/" + id + (video.featured ? "/maxresdefault.jpg" : "/sddefault.jpg");
    img.onerror = function () { img.onerror = null; img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg"; };
    thumbWrap.appendChild(img);
    var play = document.createElement("span");
    play.className = "video-play";
    thumbWrap.appendChild(play);
    card.appendChild(thumbWrap);

    var title = document.createElement("span");
    title.className = "video-title";
    title.textContent = video.title || "";
    card.appendChild(title);

    card.addEventListener("click", function () { openVideo(id, video.title); });
    return card;
  }

  function setupVideoArrows(track) {
    var prev = document.getElementById("videos-prev");
    var next = document.getElementById("videos-next");
    if (!prev || !next) return;
    function step() { return Math.max(track.clientWidth * 0.8, 280); }
    prev.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
    next.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    function update() {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function applyVideos(data) {
    if (!data) return;
    var grid = document.getElementById("videos-grid");
    if (!grid) return;
    grid.innerHTML = "";

    (Array.isArray(data.videos) ? data.videos : []).forEach(function (video) {
      var id = extractYouTubeId(video.url);
      if (id) grid.appendChild(buildVideoCard(video, id)); // empty link = hidden card
    });

    var plLink = document.getElementById("videos-playlist-link");
    if (plLink && data.playlist) { plLink.href = data.playlist; plLink.hidden = false; }

    if (grid.children.length) {
      var section = document.getElementById("videos");
      var navLink = document.getElementById("nav-videos-link");
      var footerLink = document.getElementById("footer-videos-link");
      if (section) section.style.display = "";
      if (navLink) navLink.style.display = "";
      if (footerLink) footerLink.style.display = "";
      setupVideoDialog();
      setupVideoArrows(grid);
    }
  }

  // Send the inquiry in the background (Formspree's free JSON submit) and thank the buyer on our own page.
  function setupContactForm() {
    var form = document.getElementById("contact-form");
    var status = document.getElementById("form-status");
    if (!form || !status) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!/^https:\/\/formspree\.io\//.test(form.action)) {
        status.textContent = "Sorry, the form isn't available right now. Please email us instead.";
        return;
      }
      var button = form.querySelector("button[type=submit]");
      button.disabled = true;
      button.textContent = "Sending…";
      status.textContent = "";
      fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          var done = document.getElementById("form-thanks");
          form.hidden = true;
          done.hidden = false;
          done.focus();
        })
        .catch(function () {
          var email = (document.getElementById("contact-email") || {}).textContent || "";
          status.textContent = "Sorry, your message could not be sent. Please try again, or email us at " + email + ".";
          button.disabled = false;
          button.textContent = "Send Inquiry";
        });
    });
  }

  function setupMobileMenu() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    if (!header || !toggle) return;
    function set(open) {
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }
    toggle.addEventListener("click", function () { set(!header.classList.contains("nav-open")); });
    header.querySelectorAll(".main-nav a").forEach(function (a) {
      a.addEventListener("click", function () { set(false); });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileMenu();
    setupContactForm();
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
