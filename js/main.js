/* =========================================================
   One Year Together — main script
   ---------------------------------------------------------
   1. Render content from SITE_DATA (js/data.js)
   2. Navbar menu + in-page links
   3. Dialogs + photo lightbox
   4. Music player
   5. Chowder & Panini peek → video (+ bring-back button)
   6. Hidden letters
   7. Cursor trail + click hearts
   8. ScrollSmoother, active nav link, scroll animations
   9. Moments card stack
  10. Keep ScrollTrigger accurate as images/fonts load
   Parts 1–7 don't need GSAP, so they still work if the CDN is slow or down.
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

  let smoother = null; // set in part 8 (stays null for reduced motion)

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
  $(".hero__inner").style.opacity = 1; // hidden in CSS until the names are in

  // Timeline. Every photo and video is also added to `gallery`, which the lightbox steps through.
  // A video shows its still image (`src`) with a play button; `focus` picks which part the frame shows.
  const gallery = [];
  const polaroid = (item) => {
    gallery.push(item);
    const focus = item.focus ? ` style="object-position: ${esc(item.focus)}"` : "";
    const img = `<img src="${esc(item.src)}" alt="${esc(item.alt)}" loading="lazy"${focus}>`;
    const media = item.video
      ? `<span class="polaroid__media">${img}<svg class="polaroid__play" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="24"/><path d="M19 14.5v19l15-9.5z"/></svg></span>`
      : img;
    return `
      <button class="polaroid${item.video ? " polaroid--video" : ""}" type="button" data-index="${gallery.length - 1}" aria-label="${item.video ? "Play video" : "View larger"}: ${esc(item.alt)}">
        ${media}
        <span class="polaroid__caption">${esc(item.caption || "♥")}</span>
      </button>`;
  };
  $("#timeline-list").innerHTML = data.timeline.map((entry, i) => `
    <li class="timeline__item">
      <span class="timeline__dot" aria-hidden="true">♥</span>
      <article class="timeline__card" data-reveal>
        <p class="timeline__meta">
          <span class="timeline__month">Month ${i + 1}</span>
          ${entry.date ? `<span class="timeline__date">${esc(entry.date)}</span>` : ""}
        </p>
        <h3 class="timeline__title">${esc(entry.title)}</h3>
        <p class="timeline__text">${esc(entry.text)}</p>
        <div class="timeline__photos">${entry.images.map(polaroid).join("")}</div>
      </article>
    </li>`).join("");

  // Moments
  $("#stack-pile").innerHTML = data.moments.map((m, i) => `
    <figure class="stack__card" data-i="${i}">
      <img src="${esc(m.src)}" alt="${esc(m.alt)}" loading="lazy" draggable="false">
      <figcaption>
        <span class="stack__caption">${esc(m.caption)}</span>
        ${m.date ? `<span class="stack__date">${esc(m.date)}</span>` : ""}
      </figcaption>
    </figure>`).join("");

  // Playlist
  $("#playlist").innerHTML = data.songs.map((s, i) => `
    <li>
      <button class="song" type="button" data-index="${i}" aria-current="false" aria-label="${esc(s.title)} by ${esc(s.artist)}">
        <img class="song__img" src="${esc(s.image)}" alt="${esc(s.artist)}" loading="lazy">
        <span>
          <span class="song__title">${esc(s.title)}</span>
          <span class="song__artist">${esc(s.artist)}</span>
        </span>
        <span class="song__mark" aria-hidden="true">♥</span>
      </button>
    </li>`).join("");

  // Closing
  const closing = data.closing;
  $("#forever-title").textContent = closing.heading;
  Object.assign($("#forever-img"), { src: closing.image.src, alt: closing.image.alt });
  $("#forever-caption").textContent = closing.image.caption || "♥";
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
  $("#video-title").textContent = peekData.title;

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

  // Navbar background + back-to-top button (window scroll works with and without ScrollSmoother)
  const toTop = $(".to-top");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 10);
    const pastHero = window.scrollY > window.innerHeight * 0.8;
    toTop.classList.toggle("is-visible", pastHero);
    // Chowder & Panini peek in once you're past the first screen, and stay until closed
    if (pastHero && !peek.dataset.dismissed) peek.classList.add("is-visible");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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
      lockScroll(false);
      onClose();
    });
  };

  const lightbox = $("#lightbox");
  const lbImg = $(".lightbox__img", lightbox);
  const lbVideo = $(".lightbox__clip", lightbox);
  let lbIndex = 0;
  let lbOpener = null;

  // Stop and unload the video, so it doesn't keep playing or downloading in the background
  const stopVideo = () => {
    lbVideo.pause();
    lbVideo.removeAttribute("src");
    lbVideo.load();
  };

  const showItem = (i) => {
    lbIndex = (i + gallery.length) % gallery.length;
    const item = gallery[lbIndex];
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
    $(".lightbox__count", lightbox).textContent = `${lbIndex + 1} / ${gallery.length}`;
  };

  $("#timeline-list").addEventListener("click", (e) => {
    const frame = e.target.closest(".polaroid");
    if (!frame) return;
    lbOpener = frame;
    showItem(Number(frame.dataset.index));
    openDialog(lightbox);
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

  /* ---------- 4. Music player (one shared <audio>) ---------- */
  const songs = data.songs;
  const audio = new Audio();
  audio.preload = "metadata";
  const player = $("#player");
  const playBtn = $("#player-play");
  const seek = $("#player-seek");
  const volume = $("#player-volume");
  const status = $("#player-status");
  const songButtons = $$(".song");
  let current = 0;

  const fmt = (t) => (Number.isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}` : "0:00");
  const setFill = (range) => range.style.setProperty("--fill", `${(range.value / range.max) * 100 || 0}%`);
  const setPlaying = (on) => {
    player.classList.toggle("is-playing", on);
    playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
  };
  const play = () => audio.play().catch(() => {}); // a missing file is reported by the "error" listener
  const togglePlay = () => (audio.paused ? play() : audio.pause());

  const loadSong = (i, autoplay) => {
    current = (i + songs.length) % songs.length;
    const song = songs[current];
    audio.src = song.file;
    Object.assign($("#player-img"), { src: song.image, alt: song.artist });
    $("#player-title").textContent = song.title;
    $("#player-artist").textContent = song.artist;
    $("#player-current").textContent = $("#player-duration").textContent = "0:00";
    status.textContent = "";
    seek.max = 0;
    seek.value = 0;
    setFill(seek);
    songButtons.forEach((b, j) => b.setAttribute("aria-current", j === current));
    if (autoplay) play();
  };

  playBtn.addEventListener("click", togglePlay);
  $("#player-prev").addEventListener("click", () => loadSong(current - 1, true));
  $("#player-next").addEventListener("click", () => loadSong(current + 1, true));
  $("#playlist").addEventListener("click", (e) => {
    const btn = e.target.closest(".song");
    if (!btn) return;
    const i = Number(btn.dataset.index);
    i === current ? togglePlay() : loadSong(i, true);
  });

  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  // Any video starting (timeline or Chowder & Panini) pauses the music, so they don't play over each other.
  // "play" doesn't bubble, so listen in the capture phase.
  document.addEventListener("play", (e) => e.target.matches("video") && audio.pause(), true);
  audio.addEventListener("ended", () => loadSong(current + 1, true));
  audio.addEventListener("loadedmetadata", () => {
    seek.max = audio.duration;
    $("#player-duration").textContent = fmt(audio.duration);
  });
  audio.addEventListener("timeupdate", () => {
    seek.value = audio.currentTime;
    setFill(seek);
    $("#player-current").textContent = fmt(audio.currentTime);
  });
  audio.addEventListener("error", () => {
    setPlaying(false);
    status.textContent = `Couldn't load “${songs[current].title}”. Add the file at ${songs[current].file}`;
  });
  seek.addEventListener("input", () => {
    audio.currentTime = seek.value;
    setFill(seek);
  });
  volume.addEventListener("input", () => {
    audio.volume = volume.value;
    setFill(volume);
  });
  audio.volume = volume.value;
  setFill(volume);
  loadSong(0, false);

  /* ---------- 5. Chowder & Panini peek → video ---------- */
  const videoModal = $("#video-modal");
  const video = $("#peek-video");
  const peekOpen = $("#peek-open");

  peekOpen.addEventListener("click", () => {
    openDialog(videoModal);
    video.play().catch(() => {}); // a missing file is reported by the "error" listener
  });
  video.addEventListener("error", () => {
    $("#video-title").textContent = "Couldn't load the video. Check the internet connection and try again.";
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
  // in the browser's top layer, above everything else on the page).
  const confettiCtx = reduceMotion ? null : createCanvas("confetti", lettersDialog);
  const rainConfetti = () => {
    const ctx = confettiCtx;
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
      if (confettiCtx) rainConfetti();
    }
  };

  const showLetter = (i) => {
    $("#letter-count").textContent = `Letter ${i + 1} of ${letters.length}`;
    $("#letter-title").textContent = letters[i].title;
    $("#letter-text").textContent = letters[i].text;
    $("#letter-sign").textContent = data.letters.signoff;
    // Just found the last one? Nudge towards the collection, where the celebration happens
    $("#letters-back-label").textContent = allFound() && !celebrated ? `See all ${letters.length} ♥` : "All letters";
    readPanel.dataset.letter = i;
    listPanel.hidden = true;
    readPanel.hidden = false;
    $("#letter-title").focus(); // screen readers start reading at the letter
  };

  const openLetters = (opener, letter) => {
    lettersOpener = opener;
    if (!lettersDialog.open) openDialog(lettersDialog);
    if (letter === undefined) showList();
    else showLetter(letter);
  };

  document.addEventListener("click", (e) => {
    const stash = e.target.closest(".stash");
    if (stash) {
      const i = Number(stash.dataset.letter);
      found.add(i);
      saveFound();
      renderLetters();
      openLetters(stash, i);
      return;
    }
    // Touch screens can't hover: tapping the words reveals their envelope instead
    e.target.closest(".has-stash")?.classList.add("is-peeking");
  });

  fab.addEventListener("click", () => openLetters(fab));
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
    $$(".has-stash.is-peeking").forEach((host) => host.classList.remove("is-peeking"));
    showList();
    lettersHint.textContent = "All the envelopes are hidden again. Happy hunting!";
    $("#letters-list-title").focus();
  });
  wireDialog(lettersDialog, () => lettersOpener?.focus({ preventScroll: true }));
  renderLetters();

  /* ---------- 7. Cursor trail + click hearts (one decorative canvas) ---------- */
  if (!reduceMotion) {
    const ctx = createCanvas("cursor-trail", document.body);
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

  /* ---------- 8. ScrollSmoother, active nav link, scroll animations ---------- */
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  if (!reduceMotion) {
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.1,
      smoothTouch: 0.1,
      // ScrollSmoother jumps to any newly focused element. Sections are focused by our
      // nav links while they're already smooth-scrolling there, so skip those.
      onFocusIn: (self, e) => !e.target.matches("section"),
    });
  }

  // Highlight the nav link for whichever section crosses the middle of the screen
  const links = $$(".nav__link");
  $$("main > section").forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top center",
      end: "bottom center",
      onToggle: (self) => {
        if (!self.isActive) return;
        links.forEach((a) => {
          const on = a.hash === `#${section.id}`;
          a.classList.toggle("is-active", on);
          on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
        });
      },
    });
  });

  // Floating hearts only animate while the closing section is on screen
  ScrollTrigger.create({ trigger: "#forever", start: "top bottom", end: "bottom top", toggleClass: "is-in-view" });

  if (!reduceMotion) {
    // Hero: gentle staggered fade-and-rise
    gsap.from(".hero__inner > *", { y: 30, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.15, delay: 0.2 });
    gsap.from(".scroll-cue", { y: -10, opacity: 0, duration: 1, delay: 1.1 });

    // Timeline line draws itself as you scroll
    gsap.fromTo(".timeline__progress", { scaleY: 0 }, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: ".timeline", start: "top 65%", end: "bottom 65%", scrub: true },
    });

    // Heart dots pop in as each month arrives
    $$(".timeline__dot").forEach((dot) => gsap.from(dot, {
      scale: 0,
      duration: 0.6,
      ease: "back.out(2)",
      scrollTrigger: { trigger: dot, start: "top 80%" },
    }));

    // Anything marked data-reveal fades up as it enters the viewport.
    // Opacity only (not visibility) so keyboard users can still tab to hidden content.
    $$("[data-reveal]").forEach((el) => gsap.from(el, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    }));
  }

  /* ---------- 9. Moments card stack ---------- */
  const pile = $("#stack-pile");
  const order = $$(".stack__card", pile); // order[0] is the top card
  const tilts = [-5, 6, -3.5, 4.5, -6, 3, 5, -4]; // degrees, one per card (repeats)
  let flyOut = null;

  // Put a card at a depth in the pile (0 = top). Only the top 4 are visible.
  const placeCard = (card, depth, duration) => {
    const d = Math.min(depth, 3);
    card.style.zIndex = order.length - depth;
    card.setAttribute("aria-hidden", depth > 0);
    gsap.to(card, {
      xPercent: 0,
      y: d * 12,
      scale: 1 - d * 0.03,
      rotation: tilts[card.dataset.i % tilts.length] * (depth ? 1 : 0.35), // top card sits almost straight
      opacity: depth < 4 ? 1 : 0,
      duration,
      ease: "power3.out",
      overwrite: "auto",
    });
  };
  const layoutStack = (duration, skip) => order.forEach((card, depth) => card !== skip && placeCard(card, depth, duration));
  const updateCount = () => {
    $("#stack-count").textContent = `${Number(order[0].dataset.i) + 1} / ${order.length}`;
  };

  // Send the top card to the back. dir: 1 = fly right, -1 = fly left.
  const nextMoment = (dir = 1) => {
    if (order.length < 2) return;
    flyOut?.progress(1); // finish a fly-out still in progress so fast clicks stay in sync
    const top = order.shift();
    order.push(top);
    updateCount();
    if (reduceMotion) return layoutStack(0);

    top.style.zIndex = order.length + 1; // stay above the rest while flying out
    top.setAttribute("aria-hidden", true);
    layoutStack(0.5, top);
    flyOut = gsap.to(top, {
      xPercent: 115 * dir,
      y: -20,
      rotation: 18 * dir,
      duration: 0.35,
      ease: "power2.in",
      overwrite: "auto",
      onComplete: () => placeCard(top, order.length - 1, 0.45),
    });
  };

  layoutStack(0);
  updateCount();
  $("#stack-next").addEventListener("click", () => nextMoment());

  // Tap/click the pile, or swipe it left/right
  let startX = null;
  pile.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    startX = e.clientX;
    pile.setPointerCapture(e.pointerId);
  });
  pile.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) < 8 || Math.abs(dx) > 40) nextMoment(dx < -40 ? -1 : 1); // ignore small accidental drags
  });
  pile.addEventListener("pointercancel", () => (startX = null));

  /* ---------- 10. Keep trigger positions accurate as images and fonts load ---------- */
  let refreshTimer;
  const queueRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
  };
  $$("img").forEach((img) => img.complete || img.addEventListener("load", queueRefresh, { once: true }));
  window.addEventListener("load", queueRefresh);
  document.fonts?.ready.then(queueRefresh);
})();
