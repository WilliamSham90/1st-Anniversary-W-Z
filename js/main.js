/* =========================================================
   One Year Together — main script
   ---------------------------------------------------------
   1. Render content from SITE_DATA (js/data.js)
   2. Navbar menu + in-page links
   3. Dialogs + photo lightbox
   4. Music player
   5. Chowder & Panini peek → video (+ bring-back button)
   6. Hidden letters
   7. Photo booth (Moments)
   8. Cursor trail + click hearts
   9. ScrollSmoother, active nav link, scroll animations
  10. Trigger positions (kept to as few re-measures as possible)
   Parts 1–8 don't need GSAP, so they still work if the CDN is slow or down.
   ========================================================= */
(() => {
  "use strict";

  const data = SITE_DATA;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  // Escape text from data.js before it goes into an HTML string
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Heart outline in a 110×95 box centred on (75, 72), drawn by the cursor trail and the confetti
  const HEART = new Path2D("M75 40C75 37 70 25 50 25C20 25 20 62.5 20 62.5C20 80 40 102 75 120C110 102 130 80 130 62.5C130 62.5 130 25 100 25C85 25 75 37 75 40Z");

  // Full-screen decorative canvas (sharp on high-DPI screens, resizes with the window)
  const createCanvas = (className, parent) => {
    const canvas = document.createElement("canvas");
    canvas.className = className;
    canvas.setAttribute("aria-hidden", "true");
    parent.append(canvas);
    const ctx = canvas.getContext("2d");
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return ctx;
  };

  let smoother = null; // set in part 9 (stays null for reduced motion)

  /* ---------- 1. Render ---------- */
  const { one, two } = data.names;
  document.title = `${one} & ${two} · One Year Together`;
  $(".nav__brand").textContent = `${one[0]} & ${two[0]}`;
  $("#hero-names").innerHTML = `${esc(one)} <span class="hero__amp">&amp;</span> ${esc(two)}`;

  const [year, month, day] = data.anniversary.split("-").map(Number);
  const heroDate = $("#hero-date");
  heroDate.dateTime = data.anniversary;
  heroDate.textContent = new Date(year, month - 1, day)
    .toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  $("#hero-line").textContent = data.heroLine;
  // The names stay hidden (CSS) until they're in, and their fonts too (or 1.5 seconds, whichever comes
  // first): shown in a stand-in font first, they'd jump when the real one arrived. .is-ready shows them
  // and starts the opening fade-up (a CSS animation, style.css section 5).
  const heroFonts = ['400 1em "Great Vibes"', 'italic 500 1em "Cormorant Garamond"', '500 1em "DM Sans"'];
  Promise.race([
    document.fonts ? Promise.all(heroFonts.map((font) => document.fonts.load(font))) : null,
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]).catch(() => {}).then(() => $("#home").classList.add("is-ready"));

  // Our Year is rendered by js/journey.js. This polaroid frame is for the photos in a photo letter:
  // it knows its place in the letter (data-index), so the lightbox steps through that letter only.
  // A video shows its still image (`src`) with a play button; `focus` picks which part the frame shows.
  const polaroid = (item, i) => {
    const focus = item.focus ? ` style="object-position: ${esc(item.focus)}"` : "";
    const img = `<img src="${esc(item.src)}" alt="${esc(item.alt)}" loading="lazy"${focus}>`;
    const media = item.video
      ? `<span class="polaroid__media">${img}<svg class="polaroid__play" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="24"/><path d="M19 14.5v19l15-9.5z"/></svg></span>`
      : img;
    return `
      <button class="polaroid${item.video ? " polaroid--video" : ""}" type="button" data-index="${i}" aria-label="${item.video ? "Play video" : "View larger"}: ${esc(item.alt)}">
        ${media}
        <span class="polaroid__caption">${esc(item.caption || "♥")}</span>
      </button>`;
  };

  // Moments: the photo booth prints the snapshots as two strips, like a real booth
  const half = Math.ceil(data.moments.length / 2);
  $("#booth-prints").innerHTML = [data.moments.slice(0, half), data.moments.slice(half)]
    .filter((strip) => strip.length)
    .map((strip) => `
      <div class="strip">
        <ol class="strip__frames">${strip.map((m) => `
          <li>
            <img src="${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy">
            <span class="strip__caption">${esc(m.caption)}</span>
          </li>`).join("")}
        </ol>
        <p class="strip__stamp">${esc(one)} &amp; ${esc(two)}</p>
        <p class="strip__date">${esc(heroDate.textContent)}</p>
      </div>`).join("");
  $("#booth-printed").textContent = `All ${data.moments.length} snaps, printed ♥`; // set before part 6 hides an envelope here

  // Playlist: one album cover per song (placed in 3D by part 4). data-song lets a hidden letter pick a cover.
  $("#covers").innerHTML = data.songs.map((s, i) => `
    <li class="covers__item" data-song="${esc(s.title)}">
      <button class="cover" type="button" data-index="${i}" aria-label="${esc(s.title)} by ${esc(s.artist)}">
        <img src="${esc(s.image)}" alt="" draggable="false">
        <span class="cover__overlay" aria-hidden="true">
          <svg class="icon-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <svg class="icon-pause" viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>
        </span>
      </button>
    </li>`).join("");

  // Closing
  const closing = data.closing;
  $("#forever-title").textContent = closing.heading;
  $("#forever-photo").innerHTML = polaroid(closing.image, 0);
  $("#forever-message").innerHTML = closing.message.map((p) => `<p>${esc(p)}</p>`).join("");
  $("#forever-signoff").textContent = closing.signoff;
  $("#footer-text").textContent = closing.footer;

  // Chowder & Panini peek
  const peekData = data.peek;
  const peek = $("#peek");
  $("#peek-bubble").textContent = peekData.bubble;
  $("#peek-open").setAttribute("aria-label", `Play the ${peekData.title} video`);
  if (peekData.image) {
    $("#peek-art").innerHTML = `<img src="${esc(peekData.image)}" alt="${esc(peekData.alt)}">`;
    $("#peek-return-art").innerHTML = `<img src="${esc(peekData.image)}" alt="">`;
  }
  $("#peek-video").src = peekData.video;
  $("#video-title-text").textContent = peekData.title;

  // Floating hearts: random size/speed/position per heart, animated purely in CSS
  const rand = (min, max) => (min + Math.random() * (max - min)).toFixed(2);
  $("#hearts").innerHTML = Array.from({ length: 14 }, () =>
    `<span style="--x:${rand(2, 96)}%;--size:${rand(0.7, 1.6)}rem;--dur:${rand(10, 18)}s;--delay:-${rand(0, 18)}s;` +
    `--drift:${rand(-40, 40)}px;--spin:${rand(-40, 40)}deg;--alpha:${rand(0.25, 0.6)}">♥</span>`
  ).join("");

  /* ---------- 2. Navbar menu + in-page links ---------- */
  const nav = $("#nav");
  const toggle = $(".nav__toggle");
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  // Every "#section" link (nav, skip link, scroll cue, back to top) scrolls smoothly
  // and moves keyboard focus to the section it points at.
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    const target = link && document.querySelector(link.hash);
    if (!target) return;
    e.preventDefault();
    if (smoother) smoother.scrollTo(target, true, "top top");
    else target.scrollIntoView();
    target.focus({ preventScroll: true });
    setMenu(false);
  });

  // Navbar background, back-to-top button, Chowder & Panini and the mini player (part 4) depend on how far
  // the page has scrolled. Two invisible markers in the hero, watched by an IntersectionObserver, say so:
  // reading the scroll position on every scroll event would make the browser lay out the page each time.
  const toTop = $(".to-top");
  const marker = (top) => {
    const el = Object.assign(document.createElement("span"), { className: "hero__marker" });
    el.style.top = top;
    el.setAttribute("aria-hidden", "true");
    $("#home").append(el);
    return el;
  };
  const scrolledMarker = marker("10px");   // gone off the top: the page has scrolled
  const pastMarker = marker("80svh");      // gone off the top: most of the first screen is behind us
  let pastHero = false;
  const isPastHero = () => pastHero;
  const watchMarkers = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const above = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      if (entry.target === scrolledMarker) {
        nav.classList.toggle("is-scrolled", above);
        continue;
      }
      pastHero = above;
      toTop.classList.toggle("is-visible", above);
      // Chowder & Panini peek in once you're past the first screen, and stay until closed
      if (above && !peek.dataset.dismissed) peek.classList.add("is-visible");
      updateMini();
    }
  });
  watchMarkers.observe(scrolledMarker);
  watchMarkers.observe(pastMarker);


  const lockScroll = (locked) => {
    if (smoother) smoother.paused(locked);
    else document.documentElement.style.overflow = locked ? "hidden" : "";
  };

  /* ---------- 3. Dialogs: photo + video lightbox (native <dialog>: focus trap + Esc for free) ---------- */
  const openDialog = (dialog) => {
    dialog.showModal();
    lockScroll(true);
  };
  // Shared by every dialog (photos, video, letters): the [data-close] button, a click on
  // the dark area, and clean-up however it was closed (X, Esc, outside click).
  const wireDialog = (dialog, onClose) => {
    const figure = $(".lightbox__figure", dialog); // null for the letters dialog, which is fine
    $("[data-close]", dialog).addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog || e.target === figure) dialog.close();
    });
    dialog.addEventListener("close", () => {
      lockScroll(Boolean($("dialog[open]"))); // stay locked if one is still open underneath (a letter found in the photo booth)
      onClose();
    });
  };

  const lightbox = $("#lightbox");
  const lbImg = $(".lightbox__img", lightbox);
  const lbVideo = $(".lightbox__clip", lightbox);
  let album = []; // what the lightbox steps through: one timeline month, or a photo letter's photos
  let lbIndex = 0;
  let lbOpener = null;

  // Stop and unload the video, so it doesn't keep playing or downloading in the background
  const stopVideo = () => {
    lbVideo.pause();
    lbVideo.removeAttribute("src");
    lbVideo.load();
  };

  const showItem = (i) => {
    lbIndex = (i + album.length) % album.length;
    const item = album[lbIndex];
    stopVideo();
    lbImg.hidden = Boolean(item.video);
    lbVideo.hidden = !item.video;
    if (item.video) {
      lbVideo.poster = item.src;
      lbVideo.src = item.video;
      lbVideo.setAttribute("aria-label", item.alt);
      lbVideo.play().catch(() => {}); // if the browser blocks it, the play button is still there
    } else {
      lbImg.src = item.src;
      lbImg.alt = item.alt;
    }
    $(".lightbox__caption", lightbox).textContent = item.caption || item.alt;
    $(".lightbox__count", lightbox).textContent = `${lbIndex + 1} / ${album.length}`;
  };

  // Open the lightbox on items[i], stepping through just those items
  const openAlbum = (items, i, opener) => {
    album = items;
    lbOpener = opener;
    $$(".lightbox__nav, .lightbox__count", lightbox).forEach((el) => (el.hidden = items.length < 2)); // no arrows or "1 / 1" for one item
    showItem(i);
    openDialog(lightbox);
  };

  // Our Year's pinned photos (journey.js): the month is on their list, so the lightbox steps through that month only
  $("#journey-months").addEventListener("click", (e) => {
    const frame = e.target.closest(".journey__card");
    if (!frame) return;
    const month = data.timeline[frame.closest("[data-month]").dataset.month];
    openAlbum(month.images, Number(frame.dataset.index), frame);
  });
  // Forever's photo (or video): opens on its own in the viewer
  $("#forever-photo").addEventListener("click", (e) => {
    const frame = e.target.closest(".polaroid");
    if (frame) openAlbum([data.closing.image], 0, frame);
  });
  $(".lightbox__nav--prev", lightbox).addEventListener("click", () => showItem(lbIndex - 1));
  $(".lightbox__nav--next", lightbox).addEventListener("click", () => showItem(lbIndex + 1));
  lightbox.addEventListener("keydown", (e) => {
    if (e.target === lbVideo) return; // arrow keys seek the video while its controls have focus
    if (e.key === "ArrowLeft") showItem(lbIndex - 1);
    if (e.key === "ArrowRight") showItem(lbIndex + 1);
  });
  wireDialog(lightbox, () => {
    stopVideo();
    lbOpener?.focus({ preventScroll: true });
  });

  /* ---------- 4. Music player (one shared <audio>) + album-cover coverflow ---------- */
  const songs = data.songs;
  const audio = new Audio();
  audio.preload = "metadata";
  const music = $("#music");
  const playBtn = $("#player-play");
  const seek = $("#player-seek");
  const status = $("#player-status");
  const coverList = $("#covers");
  const covers = $$(".cover", coverList);
  let current = 0;

  const fmt = (t) => (Number.isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}` : "0:00");
  const setFill = (range) => range.style.setProperty("--fill", `${(range.value / range.max) * 100 || 0}%`);
  const mini = $("#mini");
  const miniToggle = $("#mini-toggle");
  const setPlaying = (on) => {
    [music, mini].forEach((el) => el.classList.toggle("is-playing", on));
    [playBtn, $("#mini-play")].forEach((btn) => btn.setAttribute("aria-label", on ? "Pause" : "Play"));
  };
  const play = () => audio.play().catch(() => {}); // a missing file is reported by the "error" listener
  const togglePlay = () => (audio.paused ? play() : audio.pause());

  // Coverflow: CSS places each cover from its distance to the current song (--offset: -2, -1, 0, 1 …)
  const layoutCovers = () => covers.forEach((cover, i) => {
    const offset = i - current;
    const item = cover.parentElement;
    item.style.setProperty("--offset", offset);
    item.style.setProperty("--distance", Math.abs(offset));
    item.inert = Math.abs(offset) > 3; // too far away to see, so not focusable either
    cover.setAttribute("aria-current", offset === 0);
  });

  const loadSong = (i, autoplay) => {
    current = (i + songs.length) % songs.length;
    const song = songs[current];
    audio.src = song.file;
    $("#player-title").textContent = $("#mini-title").textContent = song.title;
    $("#player-artist").textContent = $("#mini-artist").textContent = song.artist;
    $("#mini-art").src = song.image;
    miniToggle.setAttribute("aria-label", `Music: ${song.title} by ${song.artist}`);
    $("#mini-bar").style.transform = "scaleX(0)";
    $("#player-current").textContent = $("#player-duration").textContent = "0:00";
    status.textContent = "";
    seek.max = 0;
    seek.value = 0;
    setFill(seek);
    layoutCovers();
    if (autoplay) play();
  };
  // Swiping or arrow keys browse without wrapping round, and keep playing if music was on
  const browseTo = (i) => {
    const target = Math.min(Math.max(i, 0), songs.length - 1); // a long swipe stops at the first/last cover
    if (target !== current) loadSong(target, !audio.paused);
  };

  playBtn.addEventListener("click", togglePlay);
  $("#player-prev").addEventListener("click", () => loadSong(current - 1, true));
  $("#player-next").addEventListener("click", () => loadSong(current + 1, true));

  // Click a side cover to play that song, the middle cover to play/pause. The one cover holding a hidden
  // envelope (Chowder's) doesn't play/pause from the middle: its envelope sits there instead.
  // A swipe that ends on a cover (or on the envelope) is followed by a click; ignore that click.
  // Keyboard clicks (Enter/Space) have detail 0 and always count.
  let lastSwipe = -Infinity;
  const isSwipeClick = (e) => e.detail > 0 && performance.now() - lastSwipe < 300;
  coverList.addEventListener("click", (e) => {
    const cover = e.target.closest(".cover");
    if (!cover || isSwipeClick(e)) return;
    const i = Number(cover.dataset.index);
    if (i !== current) loadSong(i, true);
    else if (!cover.parentElement.classList.contains("has-stash")) togglePlay();
  });
  coverList.addEventListener("keydown", (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    browseTo(current + step);
    covers[current].focus();
  });
  // Swipe or drag sideways anywhere on the covers (including over the envelope):
  // a short swipe moves one cover, a long one several
  const coverflow = $(".coverflow");
  let startX = null;
  coverflow.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
  });
  coverflow.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) < 30) return; // a tap, handled by the click listeners
    lastSwipe = performance.now();
    browseTo(current - Math.sign(dx) * Math.max(1, Math.round(Math.abs(dx) / 120)));
  });
  coverflow.addEventListener("pointercancel", () => (startX = null));

  // Any video starting (timeline, letters, Chowder & Panini) pauses the music; when the video ends or
  // its viewer closes, the music carries on. Media events don't bubble, so listen in the capture phase.
  let pausedForVideo = false;
  const resumeAfterVideo = () => {
    if (!pausedForVideo || $$("dialog[open] video").some((v) => !v.paused)) return; // another video still going
    pausedForVideo = false;
    play();
  };
  document.addEventListener("play", (e) => {
    if (!e.target.matches("video") || audio.paused) return;
    pausedForVideo = true;
    audio.pause();
  }, true);
  document.addEventListener("ended", (e) => e.target.matches("video") && resumeAfterVideo(), true);
  // "close" fires after the dialog loses [open], so the viewer's own (stopping) video isn't counted
  document.addEventListener("close", (e) => $("video", e.target) && resumeAfterVideo(), true);

  audio.addEventListener("play", () => {
    pausedForVideo = false; // playing by hand (or resuming) clears it
    setPlaying(true);
  });
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("ended", () => loadSong(current + 1, true));
  audio.addEventListener("loadedmetadata", () => {
    seek.max = audio.duration;
    $("#player-duration").textContent = fmt(audio.duration);
  });
  audio.addEventListener("timeupdate", () => {
    seek.value = audio.currentTime;
    setFill(seek);
    $("#player-current").textContent = fmt(audio.currentTime);
    $("#mini-bar").style.transform = `scaleX(${audio.currentTime / audio.duration || 0})`;
  });
  audio.addEventListener("error", () => {
    setPlaying(false);
    status.textContent = `Couldn't load “${songs[current].title}”. Add the file at ${songs[current].file}`;
  });
  seek.addEventListener("input", () => {
    audio.currentTime = seek.value;
    setFill(seek);
  });
  loadSong(Math.floor(songs.length / 2), false); // start in the middle, so covers fan out on both sides

  // Mini player: same controls, same song. Shown once past the first screen, and hidden while the
  // big player in Our Songs is on screen (no need for two).
  $("#mini-play").addEventListener("click", togglePlay);
  $("#mini-prev").addEventListener("click", () => loadSong(current - 1, true));
  $("#mini-next").addEventListener("click", () => loadSong(current + 1, true));

  const wide = window.matchMedia("(min-width: 900px)"); // matches the CSS: bar in the middle vs. button on the side
  const setMiniOpen = (open) => {
    mini.classList.toggle("is-open", open);
    miniToggle.setAttribute("aria-expanded", open);
  };
  setMiniOpen(wide.matches);
  miniToggle.addEventListener("click", () => setMiniOpen(!mini.classList.contains("is-open")));
  // On a phone the controls pop up over the page: tapping elsewhere or Esc tucks them away again
  document.addEventListener("click", (e) => {
    if (!wide.matches && mini.classList.contains("is-open") && !mini.contains(e.target)) setMiniOpen(false);
  });
  mini.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || wide.matches || !mini.classList.contains("is-open")) return;
    setMiniOpen(false);
    miniToggle.focus();
  });

  let bigPlayerInView = false;
  const updateMini = () => mini.classList.toggle("is-visible", isPastHero() && !bigPlayerInView);   // (part 2's markers call it too)
  new IntersectionObserver(([entry]) => {
    bigPlayerInView = entry.isIntersecting;
    updateMini();
  }, { threshold: 0.3 }).observe(music);
  updateMini();

  /* ---------- 5. Chowder & Panini peek → video ---------- */
  const videoModal = $("#video-modal");
  const video = $("#peek-video");
  const peekOpen = $("#peek-open");

  peekOpen.addEventListener("click", () => {
    openDialog(videoModal);
    video.play().catch(() => {}); // a missing file is reported by the "error" listener
  });
  video.addEventListener("error", () => {
    $("#video-title-text").textContent = "Couldn't load the video. Check the internet connection and try again.";
    console.warn(`Chowder & Panini video failed to load: ${peekData.video}`);
  });
  wireDialog(videoModal, () => {
    video.pause();
    peekOpen.focus({ preventScroll: true });
  });
  // Closing the peek swaps it for a small round button that brings it back
  const peekReturn = $("#peek-return");
  $("#peek-close").addEventListener("click", () => {
    peek.classList.remove("is-visible");
    peek.dataset.dismissed = "true";
    peekReturn.classList.add("is-visible");
    peekReturn.focus();
  });
  peekReturn.addEventListener("click", () => {
    peekReturn.classList.remove("is-visible");
    delete peek.dataset.dismissed;
    peek.classList.add("is-visible");
    peekOpen.focus();
  });

  /* ---------- 6. Hidden letters (envelopes around the site + the collection dialog) ---------- */
  const letters = data.letters.items;
  const lettersDialog = $("#letters");
  const listPanel = $("#letters-list");
  const readPanel = $("#letters-read");
  const lettersHint = $("#letters-hint");
  const fab = $("#letters-fab");
  let lettersOpener = null;

  // Progress is remembered in this browser. Storage can be blocked (e.g. private browsing),
  // in which case it simply lasts until the page is closed.
  const storage = {
    get(key) {
      try {
        return JSON.parse(localStorage.getItem(key));
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage unavailable: nothing to do */
      }
    },
  };
  const FOUND_KEY = "anniversary-letters-found";
  const CELEBRATED_KEY = "anniversary-letters-celebrated"; // confetti has played for this hunt
  const saved = storage.get(FOUND_KEY);
  const found = new Set(Array.isArray(saved) ? saved.filter((i) => i < letters.length) : []);
  const saveFound = () => storage.set(FOUND_KEY, [...found]);
  let celebrated = storage.get(CELEBRATED_KEY) === true;

  // Confetti rain. The canvas lives inside the dialog so it falls over the modal (which sits
  // in the browser's top layer, above everything else on the page). Made the first time it rains.
  let confettiCtx = null;
  const rainConfetti = () => {
    const ctx = (confettiCtx ??= createCanvas("confetti", lettersDialog));
    const colors = ["#D98B9A", "#B5586B", "#F6D6DC", "#A8BFA3", "#F2C57C"];
    const perFrame = Math.max(2, Math.round(window.innerWidth / 300)); // fewer pieces on small screens
    const pieces = [];
    let start = null;
    let last = null;
    let toSpawn = 0;

    const frame = (now) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (!lettersDialog.open) return ctx.clearRect(0, 0, w, h); // stop if the dialog is closed early
      start ??= now;
      const dt = last === null ? 1 : Math.min((now - last) / 16.7, 3); // same speed on 60 Hz and 120 Hz screens
      last = now;

      // Keep it raining for 2.5 seconds, then let the last pieces fall off-screen
      if (now - start < 2500) {
        for (toSpawn += perFrame * dt; toSpawn >= 1; toSpawn--) {
          pieces.push({
            x: Math.random() * w,
            y: -20 - Math.random() * 60,
            vx: (Math.random() - 0.5) * 1.2,
            vy: 2.5 + Math.random() * 2.5,
            size: 7 + Math.random() * 7,
            color: colors[Math.floor(Math.random() * colors.length)],
            heart: Math.random() < 0.25,
            rot: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.2,
            wobble: Math.random() * Math.PI * 2,
          });
        }
      }

      ctx.clearRect(0, 0, w, h);
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        p.wobble += 0.08 * dt;
        p.x += (p.vx + Math.sin(p.wobble)) * dt;
        p.y += p.vy * dt;
        p.rot += p.spin * dt;
        if (p.y > h + 30) {
          pieces.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.heart) {
          ctx.scale((p.size * 1.4) / 110, (p.size * 1.4) / 110);
          ctx.translate(-75, -72);
          ctx.fill(HEART);
        } else {
          ctx.scale(1, Math.cos(p.wobble)); // flips over like a falling strip of paper
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }
      if (pieces.length) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const envelope = (open) => `<svg viewBox="0 0 48 44" aria-hidden="true" focusable="false"><use href="#env-${open ? "open" : "closed"}"/></svg>`;

  // Hide one envelope at the end of each letter's `spot`
  const stashes = letters.map((letter, i) => {
    const host = $(letter.spot);
    if (!host) {
      console.warn(`Hidden letter ${i + 1}: nothing on the page matches spot "${letter.spot}"`);
      return null;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stash";
    btn.dataset.letter = i;
    host.classList.add("has-stash");
    host.append(btn);
    return btn;
  });

  // Sync every envelope (on the page, in the grid, on the button) with `found`
  const renderLetters = () => {
    stashes.forEach((btn, i) => {
      if (!btn) return;
      const isFound = found.has(i);
      btn.classList.toggle("is-found", isFound);
      btn.innerHTML = envelope(isFound);
      btn.setAttribute("aria-label", isFound ? `Read hidden letter ${i + 1} again` : "You found a hidden envelope! Open it");
    });
    $("#letters-grid").innerHTML = letters.map((letter, i) => {
      const isFound = found.has(i);
      return `
        <li>
          <button class="letters__tile${isFound ? " is-found" : ""}" type="button" data-letter="${i}">
            ${envelope(isFound)}
            <span class="letters__tile-num">Letter ${i + 1}</span>
            <span class="letters__tile-title">${isFound ? esc(letter.title) : "Need a clue?"}</span>
          </button>
        </li>`;
    }).join("");
    const total = letters.length;
    $("#letters-progress").textContent = found.size === total ? "You found them all ♥" : `${found.size} of ${total} found`;
    $("#letters-fab-count").textContent = `${found.size}/${total}`;
    fab.setAttribute("aria-label", `Hidden letters: ${found.size} of ${total} found`);
    $("#letters-reset").hidden = found.size === 0;
  };

  const allFound = () => found.size === letters.length;

  const showList = (focusLetter) => {
    renderLetters();
    lettersHint.textContent = allFound() ? data.letters.complete : data.letters.hint;
    readPanel.hidden = true;
    listPanel.hidden = false;
    if (focusLetter !== undefined) $(`.letters__tile[data-letter="${focusLetter}"]`).focus();
    // The first time all the letters are here together: confetti, once (remembered across visits)
    if (allFound() && !celebrated) {
      celebrated = true;
      storage.set(CELEBRATED_KEY, true);
      if (!reduceMotion) rainConfetti();
    }
  };

  const letterPhotos = $("#letter-photos");
  const showLetter = (i) => {
    const letter = letters[i];
    const isPhotoLetter = Boolean(letter.images); // a photo letter: just its title and photos
    $("#letter-count").textContent = `Letter ${i + 1} of ${letters.length}`;
    $("#letter-title").textContent = letter.title;
    $("#letter-text").textContent = letter.text || "";
    $("#letter-text").hidden = isPhotoLetter;
    $("#letter-sign").textContent = data.letters.signoff;
    $("#letter-sign").hidden = isPhotoLetter;
    letterPhotos.innerHTML = isPhotoLetter ? letter.images.map(polaroid).join("") : "";
    letterPhotos.hidden = !isPhotoLetter;
    // Just found the last one? Nudge towards the collection, where the celebration happens
    $("#letters-back-label").textContent = allFound() && !celebrated ? `See all ${letters.length} ♥` : "All letters";
    readPanel.dataset.letter = i;
    listPanel.hidden = true;
    readPanel.hidden = false;
    $("#letter-title").focus(); // screen readers start reading at the letter
  };

  const openLetters = (opener, letter) => {
    lettersOpener = opener;
    $$("video").forEach((v) => v.pause()); // e.g. the Chowder & Panini video, when its envelope is opened
    if (!lettersDialog.open) openDialog(lettersDialog);
    if (letter === undefined) showList();
    else showLetter(letter);
  };

  document.addEventListener("click", (e) => {
    const stash = e.target.closest(".stash");
    if (stash) {
      if (isSwipeClick(e)) return; // a swipe over the covers that happened to end on their envelope
      const i = Number(stash.dataset.letter);
      found.add(i);
      saveFound();
      renderLetters();
      openLetters(stash, i);
    }
  });

  fab.addEventListener("click", () => openLetters(fab));
  // A photo letter's photos open in the lightbox on top, stepping through only this letter's photos
  letterPhotos.addEventListener("click", (e) => {
    const frame = e.target.closest(".polaroid");
    if (!frame) return;
    const letter = letters[readPanel.dataset.letter];
    openAlbum(letter.images.map((img) => ({ caption: letter.title, ...img })), Number(frame.dataset.index), frame);
  });
  $("#letters-grid").addEventListener("click", (e) => {
    const tile = e.target.closest(".letters__tile");
    if (!tile) return;
    const i = Number(tile.dataset.letter);
    if (found.has(i)) showLetter(i);
    else lettersHint.textContent = `Clue for letter ${i + 1}: ${letters[i].clue}`;
  });
  $("#letters-back").addEventListener("click", () => showList(Number(readPanel.dataset.letter)));
  $("#letters-reset").addEventListener("click", () => {
    if (!window.confirm("Hide all the envelopes again? Letters you've found will be locked until they're found again.")) return;
    found.clear();
    saveFound();
    celebrated = false; // a fresh hunt earns the confetti again
    storage.set(CELEBRATED_KEY, false);
    showList();
    lettersHint.textContent = "All the envelopes are hidden again. Happy hunting!";
    $("#letters-list-title").focus();
  });
  wireDialog(lettersDialog, () => lettersOpener?.focus({ preventScroll: true }));
  renderLetters();

  /* ---------- 7. Photo booth (Moments): countdown, a flash per snap, then two printed strips ---------- */
  const booth = $("#booth-show");
  const boothShot = $("#booth-shot");
  const boothCount = $("#booth-count");
  const boothStatus = $("#booth-status");
  const boothPrints = $("#booth-prints");
  const boothSkip = $("#booth-skip");
  const boothDone = $("#booth-done");
  const filmBtn = $("#booth-film");
  const PRINTED_KEY = "anniversary-booth-printed";
  const moments = data.moments;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let boothRun = 0; // bumped to stop a show that's still playing (skip, close, film button)
  let boothOpener = null;

  const setStage = (printed) => {
    $("#booth-title").textContent = printed ? "Printed with love" : "Say cheese!";
    $("#booth-viewfinder").hidden = printed;
    boothSkip.hidden = printed;
    boothPrints.hidden = !printed;
    $("#booth-printed").hidden = !printed;
    $("#booth-actions").hidden = !printed;
    // Once printed, the live status only speaks to screen readers; "All 8 snaps, printed" shows instead
    boothStatus.classList.toggle("visually-hidden", printed);
  };

  const showPrints = (develop) => {
    boothRun++;
    const skipHadFocus = document.activeElement === boothSkip;
    setStage(true);
    boothCount.textContent = ""; // in case Skip was pressed mid-countdown
    boothStatus.textContent = "Your prints are ready.";
    if (skipHadFocus) boothDone.focus(); // the Skip button just disappeared
    // Photos "develop" from a hazy sepia, like a fresh booth print
    if (develop) $$("img", boothPrints).forEach((img, i) => img.animate(
      [{ filter: "sepia(0.9) brightness(1.5) blur(3px)", opacity: 0.35 }, { filter: "none", opacity: 1 }],
      { duration: 1400, delay: i * 120, easing: "ease-out", fill: "backwards" },
    ));
    storage.set(PRINTED_KEY, true);
    filmBtn.hidden = false;
  };

  const playShow = async () => {
    const run = ++boothRun;
    const stopped = () => run !== boothRun || !booth.open;
    moments.forEach((m) => { new Image().src = m.src; }); // load every photo during the countdown
    setStage(false);
    boothShot.removeAttribute("src");
    boothShot.alt = "";
    boothStatus.textContent = "Get ready…";

    for (const n of [3, 2, 1]) {
      boothCount.textContent = n;
      boothCount.animate([{ opacity: 0, transform: "scale(1.6)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: "ease-out" });
      await wait(750);
      if (stopped()) return;
    }
    boothCount.textContent = "";

    // One snap about every second: the flash stays inside the viewfinder and well under 3 per second
    for (const [i, m] of moments.entries()) {
      $("#booth-flash").animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 500, easing: "ease-out" });
      Object.assign(boothShot, { src: m.src, alt: m.alt });
      boothShot.animate([{ opacity: 0, transform: "scale(1.06)" }, { opacity: 1, transform: "none" }], { duration: 450, easing: "ease-out" });
      boothStatus.textContent = `Snap ${i + 1} of ${moments.length}: ${m.caption}`;
      await wait(1100);
      if (stopped()) return;
    }
    showPrints(true);
  };

  // withShow: the full countdown and flashes. Otherwise (film button, reduced motion) straight to the prints.
  const openBooth = (opener, withShow) => {
    boothOpener = opener;
    openDialog(booth);
    if (withShow && !reduceMotion) playShow();
    else showPrints(false);
  };

  $("#booth-start").addEventListener("click", (e) => openBooth(e.currentTarget, true));
  filmBtn.addEventListener("click", () => openBooth(filmBtn, false));
  boothSkip.addEventListener("click", () => showPrints(true));
  boothDone.addEventListener("click", () => booth.close());
  wireDialog(booth, () => boothOpener?.focus({ preventScroll: true }));
  filmBtn.hidden = storage.get(PRINTED_KEY) !== true;

  // "Download as a picture": redraws the two strips on a canvas (same layout as on screen) and saves one JPEG.
  // Browsers only allow saving a canvas with photos in it when the site is served from the web (or a local
  // server); from a file opened by double-click it's blocked, and the message below says so.
  const downloadLabel = $("#booth-download-label");
  const DOWNLOAD_LABEL = downloadLabel.textContent;
  const fileName = `${one}-and-${two}-photo-booth.jpg`.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, ""); // "zané" → "zane", safe everywhere
  let saving = false;

  const loadForCanvas = async (src) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // photos from another site (like the placeholders) must allow canvas use
    img.src = src;
    await img.decode();
    return img;
  };
  // Crop to fill, like object-fit: cover
  const drawCover = (ctx, img, x, y, w, h) => {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
  };
  // Washi tape centred on (x, y): the same stripes as .strip::before in style.css
  const drawTape = (ctx, x, y, stripe) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((-3 * Math.PI) / 180);
    ctx.beginPath();
    ctx.rect(-85, -20, 170, 40);
    ctx.clip();
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillRect(-85, -20, 170, 40);
    ctx.strokeStyle = stripe;
    ctx.lineWidth = 9;
    for (let i = -130; i < 130; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, 20);
      ctx.lineTo(i + 40, -20);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawPrints = async () => {
    const [images, stickers] = await Promise.all([
      Promise.all(moments.map((m) => loadForCanvas(m.src))),
      loadForCanvas("assets/images/photo-booth-card-pattern.webp"),
      document.fonts.load("italic 500 30px 'Cormorant Garamond'"),
      document.fonts.load("56px 'Great Vibes'"),
      document.fonts.load("22px 'DM Sans'"),
    ]);
    const css = getComputedStyle(document.documentElement);
    const color = (name) => css.getPropertyValue(`--color-${name}`).trim();
    const strips = [moments.slice(0, half), moments.slice(half)].filter((strip) => strip.length);

    // Sizes in pixels: 300 × 300 photos (square, like on screen)
    const FRAME_W = 300, FRAME_H = 300, PAD = 18, GAP = 16, MARGIN = 80, STRIP_GAP = 72;
    const stripW = PAD * 2 + half * FRAME_W + (half - 1) * GAP;
    const stripH = PAD + FRAME_H + 50 + 72 + 36 + PAD; // photo, caption, names, date
    const canvas = document.createElement("canvas");
    canvas.width = stripW + MARGIN * 2;
    canvas.height = MARGIN * 2 + strips.length * stripH + (strips.length - 1) * STRIP_GAP;
    const ctx = canvas.getContext("2d");
    // The pop-up's apricot card with its repeating sticker pattern, as on screen
    ctx.fillStyle = color("bg-honey");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const pattern = ctx.createPattern(stickers, "repeat");
    pattern.setTransform(new DOMMatrix().scale(1.1)); // same size next to the strips as on screen
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";

    let n = 0;
    strips.forEach((strip, s) => {
      ctx.save();
      // Same slight tilt as on screen: first strip left, second right
      ctx.translate(canvas.width / 2, MARGIN + s * (stripH + STRIP_GAP) + stripH / 2);
      ctx.rotate(((s % 2 ? 0.75 : -0.75) * Math.PI) / 180);
      ctx.translate(-stripW / 2, -stripH / 2); // (0, 0) is now the strip's top-left corner

      ctx.shadowColor = "rgba(58, 46, 50, 0.22)";
      ctx.shadowBlur = 36;
      ctx.shadowOffsetY = 14;
      ctx.fillStyle = color("surface");
      ctx.fillRect(0, 0, stripW, stripH);
      ctx.shadowColor = "transparent";

      strip.forEach((m, i) => {
        const x = PAD + i * (FRAME_W + GAP);
        drawCover(ctx, images[n++], x, PAD, FRAME_W, FRAME_H);
        ctx.fillStyle = color("muted");
        ctx.font = "italic 500 30px 'Cormorant Garamond'";
        ctx.fillText(m.caption, x + FRAME_W / 2, PAD + FRAME_H + 40, FRAME_W); // squeezed to fit if it's long
      });
      ctx.fillStyle = color("primary-deep");
      ctx.font = "56px 'Great Vibes'";
      ctx.fillText(`${one} & ${two}`, stripW / 2, PAD + FRAME_H + 50 + 58);
      ctx.fillStyle = color("muted");
      ctx.font = "22px 'DM Sans'";
      ctx.fillText(heroDate.textContent, stripW / 2, stripH - PAD - 10);
      drawTape(ctx, stripW / 2, 0, s % 2 ? "rgba(168, 191, 163, 0.7)" : "rgba(246, 214, 220, 0.9)");
      ctx.restore();
    });
    return canvas;
  };

  const downloadProblem = (text) => {
    boothStatus.classList.remove("visually-hidden");
    boothStatus.textContent = text;
  };

  $("#booth-download").addEventListener("click", async () => {
    if (saving) return; // already making one
    if (location.protocol === "file:") {
      return downloadProblem("Downloading works once the site is online. It can't save from a file opened on this computer.");
    }
    saving = true;
    downloadLabel.textContent = "Getting it ready…";
    try {
      const canvas = await drawPrints();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: fileName });
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    } catch (err) {
      downloadProblem("Couldn't make the picture: not all the photos loaded. Check the connection and try again.");
      console.warn("Photo booth download failed:", err);
    } finally {
      saving = false;
      downloadLabel.textContent = DOWNLOAD_LABEL;
    }
  });

  /* ---------- 8. Cursor trail + click hearts (one decorative canvas, made on the first mouse move or tap) ---------- */
  if (!reduceMotion) {
    let ctx = null;
    const colors = ["#D98B9A", "#B5586B", "#F2B6C1", "#A8BFA3"];
    const particles = [];
    let running = false;
    let lastX = null;
    let lastY = null;

    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 - 0.02; // slow down, then drift gently upwards
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        const size = p.size * (0.5 + p.life * 0.5); // shrink while fading
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.heart) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(size / 110, size / 110);
          ctx.translate(-75, -72);
          ctx.fill(HEART);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      running = particles.length > 0;
      if (running) requestAnimationFrame(tick); // loop sleeps when nothing is on screen
    };

    const spawn = (x, y, burst) => {
      if (particles.length > 300) return;
      ctx ??= createCanvas("cursor-trail", document.body);
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? 2 + Math.random() * 3 : Math.random() * 0.8;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (burst ? 1.5 : 0.3),
        size: burst ? 12 + Math.random() * 10 : 4 + Math.random() * 8,
        heart: burst || Math.random() < 0.4, // trail = mix of dots and hearts, bursts = hearts
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        decay: burst ? 0.016 : 0.02 + Math.random() * 0.02,
        rot: (Math.random() - 0.5) * 0.6,
        spin: (Math.random() - 0.5) * 0.06,
      });
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
    };

    // Trail follows the mouse only (touch screens have no hovering cursor).
    // Fills in the gaps on fast moves; a big jump (mouse re-entering the window) starts fresh.
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);
      if (lastX !== null && dist < 8) return;
      if (lastX !== null && dist < 200) {
        const steps = Math.min(Math.floor(dist / 8), 4);
        for (let i = 1; i <= steps; i++) spawn(lastX + (dx * i) / steps, lastY + (dy * i) / steps, false);
      }
      lastX = e.clientX;
      lastY = e.clientY;
    }, { passive: true });

    // Click or tap anywhere: a little burst of hearts
    window.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      for (let i = 0; i < 10; i++) spawn(e.clientX, e.clientY, true);
    }, { passive: true });
  }

  /* ---------- 9. ScrollSmoother, active nav link, scroll animations ---------- */
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
  // Re-measure on resize and on coming back to the tab, not on DOMContentLoaded or load: every image has a
  // set size, journey.js measures once it has built Our Year (and again if the fonts come in late), and each
  // re-measure covers the whole 40,000px journey, so the extra ones only cost time
  ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,resize" });

  if (!reduceMotion) {
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.1,
      // Phones scroll natively (GSAP's default): smoothing touch moves the whole page with JS on every
      // frame, which stutters on slower phones. journey.js pins with position: fixed there to match.
      smoothTouch: false,
      // ScrollSmoother jumps to any newly focused element. Sections are focused by our
      // nav links while they're already smooth-scrolling there, so skip those. Our Year's
      // pinned stage scrolls to a focused photo or envelope itself (journey.js). The cats in the
      // hero take focus when clicked; only scroll to one that's actually off screen.
      onFocusIn: (self, e) => {
        if (e.target.matches("section") || e.target.closest(".journey__stage")) return false;
        if (!e.target.closest(".cats")) return true;
        const r = e.target.getBoundingClientRect();
        return r.top < 0 || r.bottom > window.innerHeight;
      },
    });
  }

  // Highlight the nav link for whichever section crosses the middle of the screen, and run the floating
  // hearts and drifting colours (hero, music, Forever) only while they're on screen. IntersectionObservers
  // rather than ScrollTriggers: these only need to know what's in view, which costs the browser no layout.
  const links = $$(".nav__link");
  const middle = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach((a) => {
        const on = a.hash === `#${entry.target.id}`;
        a.classList.toggle("is-active", on);
        on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
      });
    }
  }, { rootMargin: "-50% 0px -50% 0px" });   // a line across the middle of the screen
  $$("main > section").forEach((section) => middle.observe(section));
  const onScreen = new IntersectionObserver((entries) => {
    for (const entry of entries) entry.target.classList.toggle("is-in-view", entry.isIntersecting);
  });
  ["#home", "#songs", "#forever"].forEach((sel) => onScreen.observe($(sel)));

  // Anything marked data-reveal fades up as it comes into view: a CSS transition (style.css, section 5),
  // started by an IntersectionObserver. Like the hero's opening, it runs on the compositor, needs no
  // measuring, and stays smooth while the page is busy. Opacity only (not visibility), so keyboard users
  // can still tab to it.
  if (!reduceMotion) {
    document.documentElement.classList.add("can-reveal");
    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        reveal.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -12% 0px" });   // once its top is 88% of the way down the screen
    $$("[data-reveal]").forEach((el) => reveal.observe(el));
  }

  /* ---------- 10. Trigger positions ----------
     Every image has a set size (CSS aspect-ratio), so one loading never moves anything: no need to
     re-measure for each. ScrollTrigger measures again by itself once the page has loaded, and journey.js
     once more if the fonts come in late. (Each re-measure covers the whole 40,000px journey, so they're
     kept to a minimum.) */
})();
