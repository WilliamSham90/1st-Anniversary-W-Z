/* =========================================================
   Our Year — the journey (GSAP)
   ---------------------------------------------------------
   One winding line with a station per month. Scrolling rides along it; at each station the
   month's pin board opens full-screen (note card + pinned photos), then closes as the line
   carries on. One pinned stage, one scrubbed timeline.
   1. Config: every tunable
   2. Markup from SITE_DATA.timeline (rendered straight away: main.js, which loads after this,
      hides a letter in month 7's text and opens the lightbox from the photos)
   3. Geometry: the line, the stations, the board layouts
   4. Motion: the timeline, sway, sparkles, focus (pinned) · the stacked version (reduced motion)
   5. Start: gsap.matchMedia (wide · phone · reduced motion), rebuilt on resize
   ========================================================= */
(() => {
  "use strict";

  /* ---------- 1. Config ---------- */
  const JOURNEY_CONFIG = {
    // Length of each phase, in screens of scrolling (1 = one screen height)
    scroll: { travel: 0.8, arrive: 0.5, note: 0.3, drop: 0.3, hold: 0.25, leave: 0.4 },
    stagger: 0.06,        // between photo drops (screens)
    boardScroll: 1,       // tall boards: screens of scrolling per screen of board (1 = moves with the wheel)
    scrub: 0.8,
    cameraPush: 0.3,      // zoom while a board opens (0.3 = 130%)
    boardInset: 12,       // px: the frame around each board
    dotPitch: 11,         // px between the dots on a board
    strings: false,       // true: strings from the note's pin out to every photo's pin, like a tree
    swayStrength: 1,      // photos swing gently on their pins while their board is open (0 = still)
    sparkles: 24,         // tiny hearts and dots thrown by the head of the line (pooled, 30 at most)
    envelopeAfter: 7,     // a hidden letter's envelope (#journey-letter) sits on the line after this month
    boardColors: ["#F6D6DC", "#F9DFCB", "#F6EBC4", "#D5E6CF", "#CBEADF", "#CFE5EE",
                  "#D6DBF2", "#E2D7F0", "#EFD5E8", "#F2DAD0", "#CFE7E4", "#F3E1E6"],
    // Drawn into the line between month n and n+1 (11 of them): "heart", "curl", "curl-down", "love-you"
    // (the words, written along the line) or "none"
    flourishes: ["heart", "curl", "heart", "curl-down", "love-you", "curl", "heart", "curl-down", "heart", "love-you", "heart"],

    // The line and the boards per kind of screen. Functions get the stage's width and height in px.
    wide: {
      stepX: (w) => w * 0.6,          // from one station to the next: across…
      stepY: (w, h) => h * 0.28,      // …and down
      leadIn: (w) => w * 0.42,        // line before month 1
      camera: [0.36, 0.56],           // where the head of the line sits on screen (share of width, height)
      heart: 140, curl: 50,           // flourish sizes (px)
      loveYou: 26,                    // "love you": its x-height (px), smaller if the gap between stations is tight
      envelopeAt: (stepX, stepY) => [stepX * 0.55, stepY * 0.15],   // the envelope, from its month's station (px)
      // Where each month's note card sits on its board (month 1, 2, … then round again); photos fill the rest
      notePlaces: ["left top", "center top", "right top", "center center", "left center", "center center",
                   "left bottom", "center bottom", "right bottom"],
      noteWidth: (w) => Math.min(440, Math.max(300, w * 0.28)),
      cellWidth: 260, rowHeight: 270, // usual cell for a photo (px); rows below the first screen use it
      minCell: [190, 230],            // smallest cell, used to fit a whole month on one screen
      safe: { top: 88, bottom: 24, side: 48 },           // px clear of the menu, the board's bottom edge and its sides
      // Fixed things over the bottom of the screen that photos keep clear of: [where, width, height] (px).
      // Chowder & Panini, the music player (a bar in the middle from 900px wide) and the round buttons.
      keepClear: (w) => (w >= 900
        ? [["left", 190, 215], ["center", 470, 100], ["right", 84, 150]]
        : [["left", 190, 215], ["right", 84, 210]]),
    },
    phone: {
      stepX: (w) => w * 0.72, stepY: (w, h) => h * 0.32, leadIn: (w) => w * 0.5,
      camera: [0.28, 0.52],
      heart: 96, curl: 34, loveYou: 20,
      loveYouStep: 1.5,               // the gap between stations is this much wider where "love you" is written
      envelopeAt: (stepX, stepY) => [stepX * 0.65, stepY * 0.15],
      scrub: 0.4,                     // follows the finger more closely than the wheel's 0.8
      flourishes: ["heart", "none", "curl", "none", "love-you", "none", "curl-down", "none", "heart", "love-you", "curl"],
      // (no notePlaces: the note card goes across the top, photos in rows below it)
      cellWidth: 170, rowHeight: (w) => w * 0.64,
      safe: { top: 76, bottom: 200, side: 18 },          // the round buttons stack up on the right on phones
      keepClear: [],                                     // all inside safe.bottom already
    },
    // Reduced motion: no pin. A flat map (scrolls sideways) with the line drawn, then the boards stacked.
    still: {
      stepX: () => 300, stepY: () => 0, leadIn: () => 140,
      heart: 110, curl: 40, loveYou: 22,
      envelopeAt: (stepX) => [stepX * 0.28, -50],
      flourishes: ["heart", "curl", "heart", "curl", "love-you", "curl", "heart", "curl", "heart", "love-you", "heart"],
    },
  };

  /* ---------- 2. Markup ---------- */
  const months = SITE_DATA.timeline;
  const root = document.getElementById("our-year");
  const $ = (sel, el = root) => el.querySelector(sel);
  const $$ = (sel, el = root) => [...el.querySelectorAll(sel)];
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const PLAY = '<svg class="polaroid__play" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="24"/><path d="M19 14.5v19l15-9.5z"/></svg>';

  // Station card line: `teaser` from data.js, or else the first phrase of the month's text
  const teaserOf = ({ teaser, text }) => {
    if (teaser) return teaser;
    const first = text.split(/[.:!?]/)[0].trim();
    return first.length <= 64 ? first : `${first.slice(0, 62).replace(/[\s,;]+\S*$/, "")}…`;
  };
  const meta = (entry, i) => `Month ${i + 1}${entry.date ? ` <span aria-hidden="true">·</span> ${esc(entry.date)}` : ""}`;
  const colour = (i) => `--board: var(--board-${(i % 12) + 1})`;

  // A pinned photo. Its place in the month (data-index) and the month on the list (data-month) are what
  // main.js hands the lightbox. The image gets its src when the journey comes near (loadMonth).
  const photo = (item, i) => `
    <li class="journey__photo">
      <button class="journey__card" type="button" data-index="${i}" aria-label="${item.video ? "Play video" : "View larger"}: ${esc(item.alt)}">
        <span class="journey__frame">
          <img data-src="${esc(item.src)}" alt="${esc(item.alt)}" decoding="async"${item.focus ? ` style="object-position: ${esc(item.focus)}"` : ""}>
          ${item.video ? PLAY : ""}
        </span>
        <span class="journey__caption">${esc(item.caption || "♥")}</span>
      </button>
    </li>`;

  $("#journey-stations").innerHTML = months.map((entry, i) => `
    <div class="journey__station" style="${colour(i)}">
      <span class="journey__dot"><span class="journey__dot-core"></span></span>
      <div class="journey__label">
        <p class="journey__meta">${meta(entry, i)}</p>
        <p class="journey__teaser">${esc(teaserOf(entry))}</p>
      </div>
    </div>`).join("");

  $("#journey-months").innerHTML = months.map((entry, i) => `
    <li class="journey__month" style="${colour(i)}">
      <article class="journey__board" aria-labelledby="journey-title-${i + 1}">
        <span class="journey__face" aria-hidden="true"></span>
        <svg class="journey__strings" aria-hidden="true" focusable="false"></svg>
        <div class="journey__note">
          <p class="journey__meta">${meta(entry, i)}</p>
          <h3 class="journey__title" id="journey-title-${i + 1}">${esc(entry.title)}</h3>
          <p class="journey__text">${esc(entry.text)}</p>
          <span class="journey__pin" aria-hidden="true"></span>
        </div>
        <ul class="journey__photos" data-month="${i}" aria-label="Photos">${entry.images.map(photo).join("")}</ul>
      </article>
    </li>`).join("");

  JOURNEY_CONFIG.boardColors.forEach((c, i) => root.style.setProperty(`--board-${i + 1}`, c));
  root.style.setProperty("--board-inset", `${JOURNEY_CONFIG.boardInset}px`);
  root.style.setProperty("--dot-pitch", `${JOURNEY_CONFIG.dotPitch}px`);

  // A photo takes its own shape once it has loaded (square until then; it is still hidden at that point),
  // between 2:3 portrait and 8:5 landscape
  root.addEventListener("load", (e) => {
    const img = e.target;
    if (img.tagName !== "IMG" || !img.naturalWidth) return;
    const ratio = Math.min(1.6, Math.max(0.66, img.naturalWidth / img.naturalHeight)); // tall phone shots are cropped to 2:3 (`focus` picks the part)
    img.closest(".journey__photo").style.setProperty("--ratio", ratio.toFixed(3));
  }, true);

  const stage = $(".journey__stage");
  const header = $(".journey__header");
  const map = $(".journey__map");
  const world = $(".journey__world");
  const track = $(".journey__track");
  const fill = $(".journey__fill");
  const head = $(".journey__head");
  const letter = $("#journey-letter");
  const stations = $$(".journey__station");
  const dots = $$(".journey__dot");
  const dotCores = $$(".journey__dot-core");
  const lis = $$(".journey__month");
  const boardEls = $$(".journey__board");

  const loaded = new Set();
  const loadMonth = (i) => {
    if (i < 0 || i >= lis.length || loaded.has(i)) return;
    loaded.add(i);
    $$("img[data-src]", lis[i]).forEach((img) => { img.src = img.dataset.src; });
  };

  /* ---------- 3. Geometry ---------- */
  const val = (v, w, h) => (typeof v === "function" ? v(w, h) : v);
  // Small seeded random, so each board is scattered the same way every visit
  const random = (seed) => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const CAPTION = 44; // px a card adds to its photo: its padding and a one-line caption
  const GAP = 22;     // px kept clear between cards (they tilt a little)

  // "love you" in joined-up handwriting: cubic Bézier segments [c1x, c1y, c2x, c2y, x, y] in units of the
  // x-height, starting at (0, 0) on the line and ending back on it at (LOVE_YOU_WIDTH, 0). Loops reach up to
  // about 2.4 units above the line (the l) and 1.4 below it (the y).
  const LOVE_YOU = [
    [0.45, -0.1, 1.05, -1.3, 1.1, -1.95], [1.13, -2.35, 0.75, -2.45, 0.68, -2.0], [0.6, -1.4, 0.62, -0.35, 0.9, -0.08], // l
    [1.25, 0.12, 1.95, 0.1, 2.12, -0.3], [2.2, -0.62, 2.1, -0.98, 1.84, -0.98], [1.56, -0.98, 1.4, -0.66, 1.44, -0.36], // o
    [1.48, -0.04, 1.92, -0.02, 2.08, -0.3], [2.18, -0.52, 2.18, -0.9, 2.06, -0.96], [2.24, -0.9, 2.44, -0.92, 2.58, -0.98],
    [2.74, -0.86, 2.8, -0.35, 2.92, -0.02], [3.05, -0.4, 3.22, -0.82, 3.38, -1.0], [3.46, -1.1, 3.3, -1.16, 3.28, -0.98], // v
    [3.32, -0.7, 3.55, -0.45, 3.82, -0.45], [4.22, -0.45, 4.36, -0.88, 4.1, -0.98], [3.8, -1.08, 3.58, -0.62, 3.72, -0.26], // e
    [3.86, 0.06, 4.28, 0.03, 4.5, -0.12],
    [4.72, -0.26, 5.35, 0, 5.67, 0], // the space, along the line
    [5.9, 0, 6.05, -0.6, 6.09, -0.98], [6.03, -0.55, 6.01, -0.04, 6.3, -0.04], [6.57, -0.04, 6.65, -0.6, 6.69, -0.98], // y
    [6.65, -0.4, 6.67, 0.6, 6.5, 1.1], [6.39, 1.46, 6.07, 1.42, 6.17, 1.0], [6.25, 0.6, 6.7, 0.1, 7.15, 0.04],
    [7.55, 0, 7.71, -0.3, 7.65, -0.6], [7.61, -0.86, 7.49, -0.98, 7.31, -0.98], [7.03, -0.98, 6.87, -0.66, 6.91, -0.36], // o
    [6.95, -0.04, 7.39, -0.02, 7.55, -0.3], [7.65, -0.52, 7.65, -0.9, 7.53, -0.96], [7.71, -0.9, 7.91, -0.92, 8.07, -0.98],
    [8.13, -0.6, 8.01, -0.04, 8.31, -0.04], [8.57, -0.04, 8.65, -0.6, 8.71, -0.98], [8.65, -0.6, 8.65, -0.04, 8.91, -0.02], // u
    [9.13, 0, 9.3, 0, 9.55, 0],
  ];
  const LOVE_YOU_WIDTH = 9.55;

  // Flourishes are part of the same stroke, so the fill draws through them. SVG y grows downwards.
  // A heart starts and ends at its tip on the line; a curl is a loop like a joined-up "l"; "love-you" is
  // the words written along the line, as big as m.loveYou allows within `room` px.
  const flourish = (kind, cx, y, m, room) => {
    if (kind === "love-you") {
      const unit = Math.min(m.loveYou, room / LOVE_YOU_WIDTH);
      const sx = cx - (LOVE_YOU_WIDTH * unit) / 2;
      const p = (px, py) => `${(sx + px * unit).toFixed(1)},${(y + py * unit).toFixed(1)}`;
      return `L${sx.toFixed(1)},${y}` + LOVE_YOU.map((c) => `C${p(c[0], c[1])} ${p(c[2], c[3])} ${p(c[4], c[5])}`).join("");
    }
    if (kind === "heart") {
      const p = (px, py) => `${cx + px * m.heart},${y + py * m.heart}`;
      return `L${cx},${y}C${p(0.16, -0.1)} ${p(0.5, -0.36)} ${p(0.5, -0.64)}C${p(0.5, -0.9)} ${p(0.24, -1)} ${p(0, -0.8)}` +
        `C${p(-0.24, -1)} ${p(-0.5, -0.9)} ${p(-0.5, -0.64)}C${p(-0.5, -0.36)} ${p(-0.16, -0.1)} ${p(0, 0)}`;
    }
    if (kind === "curl" || kind === "curl-down") {
      const f = kind === "curl" ? -1 : 1;
      const sx = cx - 0.65 * m.curl;
      const p = (px, py) => `${sx + px * m.curl},${y + f * py * m.curl}`;
      return `L${sx},${y}C${p(0.7, 0)} ${p(1.1, 0.6)} ${p(0.8, 1.1)}C${p(0.55, 1.5)} ${p(-0.1, 1.4)} ${p(-0.1, 0.9)}` +
        `C${p(-0.1, 0.4)} ${p(0.6, 0)} ${p(1.4, 0)}`;
    }
    return "";
  };

  // From one station to the next: a short run, a smooth drop, a flourish, then a run into the station.
  // Words need more room, so before them the drop comes sooner and they're centred on what's left.
  const segment = (a, b, kind, m) => {
    const dx = b.x - a.x;
    const words = kind === "love-you";
    const x1 = a.x + dx * (words ? 0.06 : 0.12);
    const x2 = a.x + dx * (words ? 0.3 : 0.42);
    const xm = (x1 + x2) / 2;
    const end = b.x - 24; // clear of the station's dot
    const cx = words ? (x2 + end) / 2 : a.x + dx * 0.68;
    return `L${x1},${a.y}C${xm},${a.y} ${xm},${b.y} ${x2},${b.y}${flourish(kind, cx, b.y, m, (end - x2) * 0.9)}L${b.x},${b.y}`;
  };

  // The whole line, generated from the station positions. pts[0] is where the line starts, pts[n] is
  // month n; dist[n] is how far along the line month n is.
  function buildPath(m, W, H) {
    const stepX = val(m.stepX, W, H);
    const stepY = val(m.stepY, W, H);
    const kinds = m.flourishes || JOURNEY_CONFIG.flourishes;
    const pts = [{ x: 0, y: 0 }, { x: val(m.leadIn, W, H), y: 0 }];
    for (let i = 1; i < months.length; i++) {
      const across = stepX * (kinds[i - 1] === "love-you" ? m.loveYouStep ?? 1 : 1);
      pts.push({ x: pts[i].x + across, y: pts[i].y + stepY });
    }
    const parts = [`M0,0L${pts[1].x},0`];
    for (let i = 1; i < pts.length - 1; i++) parts.push(segment(pts[i], pts[i + 1], kinds[i - 1], m));
    const dist = [0];
    let d = "";
    parts.forEach((part) => {
      d += part;
      track.setAttribute("d", d);
      dist.push(track.getTotalLength());
    });
    fill.setAttribute("d", d);
    pts.slice(1).forEach(({ x, y }, i) => {
      stations[i].style.setProperty("--x", `${x}px`);
      stations[i].style.setProperty("--y", `${y}px`);
    });
    const [ex, ey] = m.envelopeAt(stepX, stepY);
    const after = pts[JOURNEY_CONFIG.envelopeAfter];
    letter.style.setProperty("--x", `${after.x + ex}px`);
    letter.style.setProperty("--y", `${after.y + ey}px`);
    return { pts, dist, total: dist[dist.length - 1] };
  }

  // The camera rides a calmer version of the line (no loops): straight across, easing down at the drop
  const cameraAt = (pts, i, u) => {
    const a = pts[i];
    const b = pts[i + 1];
    const t = Math.min(1, Math.max(0, (u - 0.06) / 0.36));
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * t * t * (3 - 2 * t) };
  };

  // A rectangle minus another one lying over it: the biggest piece left beside, above or below it
  const cut = (c, o) => {
    if (o.x >= c.x + c.w || o.x + o.w <= c.x || o.y >= c.y + c.h || o.y + o.h <= c.y) return c;
    const area = (r) => Math.max(0, r.w) * Math.max(0, r.h);
    return [
      { x: c.x, y: c.y, w: o.x - c.x, h: c.h },
      { x: o.x + o.w, y: c.y, w: c.x + c.w - o.x - o.w, h: c.h },
      { x: c.x, y: c.y, w: c.w, h: o.y - c.y },
      { x: c.x, y: o.y + o.h, w: c.w, h: c.y + c.h - o.y - o.h },
    ].reduce((a, b) => (area(b) > area(a) ? b : a));
  };

  // A rectangle cut into a cols × rows grid, each cell trimmed clear of `blocks` (the note, the fixed
  // buttons); a cell left too small for a photo drops out. Most photos are portrait, so a cell may lose
  // some width but little height: a block's `keep` is the share of height a cell it trims must keep.
  const gridCells = (rect, cols, rows, blocks) => {
    const cw = rect.w / cols;
    const ch = rect.h / rows;
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let cell = { x: rect.x + c * cw, y: rect.y + r * ch, w: cw, h: ch };
        let keep = 0;
        for (const block of blocks) {
          const trimmed = cut(cell, block);
          if (trimmed !== cell) keep = Math.max(keep, block.keep);
          cell = trimmed;
        }
        if (cell.w >= cw * 0.55 && cell.h >= ch * keep) cells.push({ ...cell, row: r, col: c });
      }
    }
    return cells;
  };
  // How big a photo a cell can hold
  const roomFor = (cell) => Math.min(cell.w, cell.h - CAPTION);

  // The first screen's grid: every photo in the biggest cells that hold them all; when even the smallest
  // cells can't, cells near the usual size (the rest then go in rows below)
  const better = (a, b) => {
    if (a.fits !== b.fits) return a.fits;
    if (!a.fits) return a.off < b.off;
    if (Math.abs(a.size - b.size) > 8) return a.size > b.size;
    return a.cells.length < b.cells.length; // same size: fewest empty spaces
  };
  const firstScreenCells = (rect, n, blocks, m) => {
    let best = null;
    for (let rows = 1; rows <= 6; rows++) {
      for (let cols = 1; cols <= 10; cols++) {
        const cw = rect.w / cols;
        const ch = rect.h / rows;
        if (cw < m.minCell[0] || ch < m.minCell[1] || cw > ch * 1.7 || ch > cw * 1.6) continue;
        const cells = gridCells(rect, cols, rows, blocks);
        const option = {
          cells,
          fits: cells.length >= n,
          size: cells.map(roomFor).sort((a, b) => b - a)[n - 1] || 0, // the smallest photo it would use
          off: Math.abs(Math.log(cw / m.cellWidth)) + Math.abs(Math.log(ch / m.rowHeight)),
        };
        if (!best || better(option, best)) best = option;
      }
    }
    return best ? best.cells : [];
  };

  // The fixed things over the bottom of a screen ending at `end` (m.keepClear), as rectangles. `keep`:
  // a photo may sit above one a little shorter (0.65) or, in a board's last row, only at full height.
  const keepClear = (m, W, end, keep = 0.65) => val(m.keepClear, W).map(([where, w, h]) => ({
    x: { left: 0, center: (W - w) / 2, right: W - w }[where],
    y: end - h,
    w,
    h,
    keep,
  }));

  // k of a row's cells, evenly spread along it
  const spread = (row, k) => Array.from({ length: k }, (_, j) => row[Math.round(((j + 0.5) * row.length) / k - 0.5)]);

  // Rows of `cols` cells across the board from y down for n photos, the last row spreading its photos
  // evenly across the board, clear of the fixed things at the bottom of the screen the board ends on
  const rowsBelow = (y, n, cols, rowH, m, W) => {
    const { side, bottom } = m.safe;
    const w = W - 2 * side;
    const full = Math.ceil(n / cols) - 1;
    const cells = gridCells({ x: side, y, w, h: full * rowH }, cols, full, []);
    const rest = n - cells.length;
    const lastY = y + full * rowH;
    for (let c = rest; c <= cols; c++) {
      const row = gridCells({ x: side, y: lastY, w, h: rowH }, c, 1, keepClear(m, W, lastY + rowH + bottom, 0.8));
      if (row.length >= rest) return { cells: cells.concat(spread(row, rest)), end: lastY + rowH };
    }
    // The fixed things take too much of one row: the rest go in two
    const two = gridCells({ x: side, y: lastY, w, h: 2 * rowH }, cols, 2, keepClear(m, W, lastY + 2 * rowH + bottom, 0.8));
    return { cells: cells.concat(two.slice(0, rest)), end: lastY + 2 * rowH };
  };

  // n of the cells, in reading order. The spare ones left empty are, first, any card that would sit alone
  // in its row, then cells trimmed small by the note or the fixed things, then the lowest, spread along it.
  const pick = (cells, n) => {
    const kept = cells.slice();
    const room = (c) => Math.round(roomFor(c) / 8);
    while (kept.length > n) {
      const alone = (c) => !kept.some((o) => o !== c && o.row === c.row && Math.abs(o.col - c.col) === 1);
      const drop = kept.reduce((a, b) => {
        if (alone(a) !== alone(b)) return alone(b) ? b : a;
        if (room(a) !== room(b)) return room(b) < room(a) ? b : a;
        if (a.row !== b.row) return b.row > a.row ? b : a;
        return (b.col * 0.618) % 1 > (a.col * 0.618) % 1 ? b : a;
      });
      kept.splice(kept.indexOf(drop), 1);
    }
    return kept;
  };

  // A card in a cell: hung from a pin near the top, nudged and sized a little differently each time, but
  // always inside the cell less GAP, so cards never overlap whatever shape their photo turns out to be.
  // A slot is the pin (x, y) at the top centre of a card and the box its photo fits in (bw × bh).
  const slotIn = (cell, rnd, caption) => {
    const size = 0.9 + rnd() * 0.1;
    const w = (cell.w - GAP) * size;
    const h = (cell.h - GAP) * size;
    return {
      x: cell.x + cell.w / 2 + (rnd() - 0.5) * (cell.w - GAP - w),
      y: cell.y + GAP / 2 + rnd() * (cell.h - GAP - h),
      bw: w - 16,
      bh: h - caption,
      tilt: (rnd() < 0.5 ? -1 : 1) * (1 + rnd() * 3),
    };
  };

  // One month's board: the note card and photos spread over the whole board, which grows taller
  // (and scrolls) when the month has many photos. Positions go into CSS variables.
  function layoutBoard(li, i, m, W, H) {
    const rnd = random(i + 7);
    const note = $(".journey__note", li);
    const items = $$(".journey__photo", li);
    const n = items.length;
    const { top, bottom, side } = m.safe;
    let box;
    let cells;
    let end;
    if (m.notePlaces) {
      const w = val(m.noteWidth, W, H);
      note.style.setProperty("--w", `${w}px`);
      const h = note.offsetHeight;
      const [across, down] = m.notePlaces[i % m.notePlaces.length].split(" ");
      const x = { left: side + 8, center: (W - w) / 2, right: W - side - w - 8 }[across];
      // At the bottom it sits just above whatever fixed thing is below it
      const under = keepClear(m, W, H).filter((z) => z.x < x + w && x < z.x + z.w);
      const lowest = Math.min(H - bottom, ...under.map((z) => z.y)) - h - 8;
      const y = { top: top + 8, center: (top + lowest) / 2, bottom: lowest }[down];
      box = { x, y, w, h };
      // Photos around the note on the first screen (it tilts a little, hence the extra room); any that
      // don't fit go in rows below, and the board scrolls
      const room = GAP + 12;
      const screen = { x: side, y: top, w: W - 2 * side, h: H - bottom - top };
      const blocks = [{ x: x - room, y: y - room, w: w + 2 * room, h: h + 2 * room, keep: 0.8 }, ...keepClear(m, W, H)];
      cells = pick(firstScreenCells(screen, n, blocks, m), n);
      end = H - bottom;
      if (cells.length < n) {
        const below = rowsBelow(end, n - cells.length, Math.max(2, Math.round(screen.w / m.cellWidth)), m.rowHeight, m, W);
        cells = cells.concat(below.cells);
        end = below.end;
      }
    } else {
      // Phones: the note across the top, the photos in rows below it
      const w = W - 2 * side;
      note.style.setProperty("--w", `${Math.min(w, 560)}px`);
      box = { x: side, y: top, w, h: note.offsetHeight };
      const below = rowsBelow(box.y + box.h + 30, n, Math.max(2, Math.round(w / val(m.cellWidth, W, H))), val(m.rowHeight, W, H), m, W);
      cells = below.cells;
      end = below.end;
    }
    note.style.setProperty("--x", `${box.x}px`);
    note.style.setProperty("--y", `${box.y}px`);

    // A caption longer than about 20 characters may wrap onto a second line
    const slots = cells.map((cell, j) => slotIn(cell, rnd, CAPTION + ($(".journey__caption", items[j]).textContent.length > 20 ? 20 : 0)));
    slots.forEach((slot, j) => {
      const style = items[j].style;
      style.setProperty("--x", `${slot.x.toFixed(1)}px`);
      style.setProperty("--y", `${slot.y.toFixed(1)}px`);
      style.setProperty("--bw", `${slot.bw.toFixed(1)}px`);
      style.setProperty("--bh", `${slot.bh.toFixed(1)}px`);
    });
    const height = Math.ceil(Math.max(H, box.y + box.h + bottom, end + bottom));
    boardEls[i].style.setProperty("--board-h", `${height}px`);

    // Thin strings, sagging a little, like a tree from the note's pin (bottom-left): each photo hangs from
    // the nearest pin above it, the note's or a photo's, so no string runs across the whole board
    const pins = [{ x: box.x + 31, y: box.y + box.h - 31 }];
    const svg = $(".journey__strings", li);
    svg.setAttribute("viewBox", `0 0 ${W} ${height}`);
    svg.innerHTML = JOURNEY_CONFIG.strings ? slots.map(({ x, y }) => {
      const to = { x, y: y + 9 };
      const from = pins.filter((p, k) => !k || p.y < to.y - 60)
        .reduce((a, b) => (Math.hypot(b.x - x, b.y - y) < Math.hypot(a.x - x, a.y - y) ? b : a));
      pins.push(to);
      const sag = 18 + Math.hypot(to.x - from.x, to.y - from.y) * 0.08;
      return `<path class="journey__string" pathLength="1" d="M${from.x},${from.y}Q${(from.x + to.x) / 2},${Math.max(from.y, to.y) + sag} ${to.x},${to.y}"/>`;
    }).join("") : "";

    return { note, items, slots, height, extra: height - H, tilt: (rnd() < 0.5 ? -1 : 1) * (0.8 + rnd() * 1.6), strings: $$(".journey__string", li) };
  }

  /* ---------- 4. Motion ---------- */
  let current = null; // the pinned timeline, so a resize can keep your place

  // Scrolls the page to a moment of the pinned timeline, straight there or smoothly
  const scrollToTime = (tl, time, smooth = false) => {
    const st = tl.scrollTrigger;
    const y = st.start + (time / tl.duration()) * (st.end - st.start);
    const smoother = window.ScrollSmoother?.get();
    if (smoother) smooth ? smoother.scrollTo(y, true) : smoother.scrollTop(y);
    else window.scrollTo({ top: y, behavior: smooth ? "smooth" : "instant" });
  };
  // Where the reader is, as a label plus how far on to the next one. Board heights (and so the scroll
  // lengths) change with the screen size, so this is what survives a rebuild.
  const marks = (tl) => Object.entries(tl.labels).sort((a, b) => a[1] - b[1]);
  const placeOf = (tl) => {
    const time = tl.scrollTrigger.progress * tl.duration();
    const list = marks(tl);
    const i = Math.max(0, list.findLastIndex(([, at]) => at <= time));
    const next = list[i + 1]?.[1] ?? tl.duration();
    return { label: list[i][0], frac: (time - list[i][1]) / (next - list[i][1] || 1) };
  };
  const timeOf = (tl, { label, frac }) => {
    const list = marks(tl);
    const i = list.findIndex(([name]) => name === label);
    const next = list[i + 1]?.[1] ?? tl.duration();
    return list[i][1] + frac * (next - list[i][1]);
  };

  // Photos swing gently on their pins the whole time their board is open, like the swaying gallery:
  // each card its own angle, duration and direction. One ticker drives the open month's cards and eases
  // the swing in when a board opens.
  function buildSway(boards) {
    const strength = JOURNEY_CONFIG.swayStrength;
    const durations = [1, 1.8, 1.3, 1.5, 1.1, 1.6, 1.2];
    const angles = [3, -3.3, 2.4];
    const cards = boards.map((b) => b.items.map((el, j) => ({
      set: gsap.quickSetter(el.firstElementChild, "rotation", "deg"),
      amp: angles[j % 3] * strength,
      speed: Math.PI / durations[j % 7],
      phase: j % 2 ? Math.PI : 0,
    })));
    const sway = { month: -1 };
    let shown = -1;
    let energy = 0;
    const tick = (time, ms) => {
      if (sway.month !== shown) {
        cards[shown]?.forEach((c) => c.set(0));
        shown = sway.month;
        energy = 0;
      }
      if (!cards[shown] || !strength) return;
      energy += (1 - energy) * (1 - Math.exp(-ms / 400));
      cards[shown].forEach((c) => c.set(energy * c.amp * Math.sin(time * c.speed + c.phase)));
    };
    gsap.ticker.add(tick);
    sway.kill = () => {
      gsap.ticker.remove(tick);
      cards.flat().forEach((c) => c.set(0));
    };
    return sway;
  }

  // Tiny hearts and dots thrown off by the head as it travels (a fixed pool, reused)
  function buildSparks() {
    const box = $(".journey__sparks");
    const pool = Array.from({ length: Math.min(30, JOURNEY_CONFIG.sparkles) }, (_, i) => {
      const el = document.createElement("span");
      el.className = i % 3 ? "journey__spark" : "journey__spark journey__spark--dot";
      if (i % 3) el.textContent = "♥";
      box.append(el);
      return el;
    });
    const r = gsap.utils.random;
    let next = 0;
    let last = null;
    return {
      throw(h, resting) {
        if (!pool.length) return;
        if (!last || resting) {
          last = h;
          return;
        }
        const moved = Math.hypot(h.x - last.x, h.y - last.y);
        if (moved < 28) return;
        last = h;
        if (moved > 300) return; // a jump (nav link, resize), not travelling
        gsap.fromTo(pool[next++ % pool.length],
          { x: h.x, y: h.y, opacity: 0.9, scale: r(0.6, 1.2), rotation: r(-25, 25) },
          { x: h.x + r(-36, 36), y: h.y - r(18, 64), opacity: 0, rotation: r(-45, 45), duration: r(0.7, 1.2), ease: "power2.out", overwrite: true });
      },
      kill() {
        gsap.killTweensOf(pool);
        pool.forEach((el) => el.remove());
      },
    };
  }

  // Wide screens and phones: the stage is pinned and one scrubbed timeline plays the whole year.
  // Per month: TRAVEL along the line → ARRIVE (dot pops, the board opens from it like an iris while the
  // camera pushes in) → EXPLORE (note taps on, photos drop onto their pins, tall boards scroll) → LEAVE.
  // After the last month the pin lets go, so the page scrolls on to Forever.
  function buildPinned(m, geo, boards, W, H) {
    const cfg = JOURNEY_CONFIG;
    const S = cfg.scroll;
    const ax = W * m.camera[0];
    const ay = H * m.camera[1];
    const radius = Math.hypot(Math.max(ax, W - ax), Math.max(ay, H - ay));
    const state = { pos: 0, push: 0 };
    const open = boards.map(() => ({ iris: 0, scroll: 0 }));
    const times = new Map(); // focusable photo → timeline time when it's on screen
    const sway = buildSway(boards);
    const sparks = buildSparks();
    const last = geo.pts.length - 2;
    let shown = -1;

    const render = () => {
      const i = Math.min(Math.floor(state.pos), last);
      const u = state.pos - i;
      const d = geo.dist[i] + (geo.dist[i + 1] - geo.dist[i]) * u;
      fill.style.strokeDashoffset = geo.total - d;
      const h = track.getPointAtLength(d);
      head.style.transform = `translate(${h.x}px, ${h.y}px)`;
      const cam = cameraAt(geo.pts, i, u);
      const z = 1 + state.push * cfg.cameraPush;
      world.style.transform = `translate(${ax - cam.x * z}px, ${ay - cam.y * z}px) scale(${z})`;

      let showing = -1;
      let covered = false;
      open.forEach((o, j) => {
        if (o.iris > 0) showing = j;
        if (o.iris >= 1) covered = true;
        if (o.iris === o.drawnIris && o.scroll === o.drawnScroll) return;
        o.drawnIris = o.iris;
        o.drawnScroll = o.scroll;
        lis[j].style.clipPath = o.iris >= 1 ? "none" : `circle(${(o.iris * radius).toFixed(1)}px at ${ax}px ${ay}px)`;
        boardEls[j].style.transform = `translate3d(0, ${(-o.scroll * boards[j].extra).toFixed(1)}px, 0)`;
      });
      map.style.visibility = covered ? "hidden" : ""; // nothing to paint under a full board
      if (showing !== shown) {
        lis[shown]?.classList.remove("is-open");
        lis[showing]?.classList.add("is-open");
        shown = sway.month = showing;
      }
      if (state.pos > 0) {
        loadMonth(i);
        loadMonth(i + 1);
      }
      sparks.throw(h, state.push > 0.01);
    };

    const irises = []; // [start, end] of every board opening or closing
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate: render,
      scrollTrigger: {
        trigger: stage,
        pin: true,
        start: "top top",
        end: () => `+=${Math.round(tl.duration() * stage.clientHeight)}`,
        scrub: m.scrub ?? cfg.scrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 1, // main.js made its triggers first; this pin sits above Forever's, so it measures first
      },
    });

    boards.forEach((b, i) => {
      const n = i + 1;
      // TRAVEL
      tl.addLabel(`m${n}`).to(state, { pos: n, duration: S.travel, ease: "sine.inOut" });
      // ARRIVE
      tl.addLabel(`m${n}-arrive`)
        .fromTo(dotCores[i], { opacity: 0 }, { opacity: 1, duration: 0.02 }, `m${n}-arrive`)
        .fromTo(dots[i], { scale: 1 }, { scale: 1.7, duration: S.arrive * 0.25, ease: "power2.out", repeat: 1, yoyo: true }, `m${n}-arrive`)
        .to(state, { push: 1, duration: S.arrive, ease: "power2.in" }, `m${n}-arrive`)
        .to(open[i], { iris: 1, duration: S.arrive * 0.8, ease: "power2.in" }, `m${n}-arrive+=${S.arrive * 0.2}`);
      // EXPLORE: photos on the first screen drop in turn; then tall boards scroll and lower ones drop as they come in
      const t0 = tl.duration();
      irises.push([tl.labels[`m${n}-arrive`], t0]);
      tl.addLabel(`m${n}-explore`, t0)
        .fromTo(b.note, { opacity: 0, scale: 1.15, rotation: b.tilt + 5 }, { opacity: 1, scale: 1, rotation: b.tilt, duration: S.note, ease: "back.out(1.7)" }, t0);
      const first = t0 + S.note * 0.6;
      const fold = H * 0.82;
      const onFirstScreen = b.slots.filter((s) => s.y < fold).length;
      const scrollAt = first + Math.max(0, onFirstScreen - 1) * cfg.stagger + S.drop;
      const scrollFor = (b.extra / H) * cfg.boardScroll;
      let k = 0;
      b.slots.forEach((s, j) => {
        const at = s.y < fold
          ? first + k++ * cfg.stagger
          : scrollAt + Math.min(1, (s.y - fold) / b.extra) * scrollFor;
        tl.fromTo(b.items[j], { opacity: 0, y: -70, rotation: s.tilt * 3 }, { opacity: 1, y: 0, rotation: s.tilt, duration: S.drop, ease: "back.out(1.5)" }, at);
        if (b.strings[j]) tl.fromTo(b.strings[j], { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: S.drop }, at + S.drop * 0.4);
        // Focusing a photo scrolls to when it has landed and, on a tall board, its whole card is in view
        const inView = scrollAt + Math.min(1, Math.max(0, (s.y + s.bh + CAPTION - (H - m.safe.bottom)) / b.extra)) * scrollFor;
        times.set(b.items[j].firstElementChild, Math.max(at + S.drop, b.extra > 0 ? inView : 0));
      });
      if (b.extra > 0) tl.to(open[i], { scroll: 1, duration: scrollFor }, scrollAt);
      // LEAVE (the last board stays: the pin lets go and it scrolls away with the page)
      const leave = tl.duration() + S.hold;
      tl.addLabel(`m${n}-leave`, leave);
      if (n < boards.length) {
        irises.push([leave, leave + S.leave]);
        tl.to(open[i], { iris: 0, duration: S.leave, ease: "power2.inOut" }, leave)
          .to(state, { push: 0, duration: S.leave, ease: "power2.inOut" }, leave);
      } else {
        tl.to({}, { duration: S.hold }, leave - S.hold);
      }
    });
    tl.to(header, { opacity: 0, y: -40, duration: S.travel * 0.5 }, 0);
    current = tl;
    render();

    // Never come to rest with a board half open: when scrolling stops mid-iris, finish opening or
    // closing it, the way you were going
    const settle = () => {
      const st = tl.scrollTrigger;
      const y = window.scrollY; // where the scroll stopped (st.progress still lags behind with ScrollSmoother)
      if (y <= st.start || y >= st.end) return;
      const time = ((y - st.start) / (st.end - st.start)) * tl.duration();
      const span = irises.find(([a, b]) => time > a + 0.01 && time < b - 0.01);
      if (span) scrollToTime(tl, st.direction > 0 ? span[1] + 0.005 : span[0] - 0.005, true); // a hair past, whole pixels round
    };
    ScrollTrigger.addEventListener("scrollEnd", settle);

    // Tabbing to something on a board (or to the envelope beside the line) that isn't showing yet
    // scrolls the journey to it
    const onFocus = (e) => {
      if (letter.contains(e.target)) {
        const r = e.target.getBoundingClientRect();
        const showing = open.every((o) => !o.iris) && r.left >= 0 && r.right <= W && r.top >= 0 && r.bottom <= H;
        if (!showing) scrollToTime(tl, tl.labels[`m${cfg.envelopeAfter + 1}`] + S.travel * 0.5);
        return;
      }
      const li = e.target.closest?.(".journey__month");
      if (!li) return;
      const i = lis.indexOf(li);
      const time = times.get(e.target) ?? tl.labels[`m${i + 1}-explore`] + S.note;
      const r = e.target.getBoundingClientRect();
      if (open[i].iris >= 1 && tl.time() >= time - 0.01 && r.top >= 0 && r.bottom <= H) return;
      loadMonth(i);
      scrollToTime(tl, time);
    };
    document.addEventListener("focusin", onFocus);

    return () => {
      document.removeEventListener("focusin", onFocus);
      ScrollTrigger.removeEventListener("scrollEnd", settle);
      sway.kill();
      sparks.kill();
      current = null;
      fill.style.strokeDashoffset = head.style.transform = world.style.transform = map.style.visibility = "";
      lis.forEach((li) => {
        li.style.clipPath = "";
        li.classList.remove("is-open");
      });
      boardEls.forEach((el) => (el.style.transform = ""));
    };
  }

  // Reduced motion: no pin, scrub or sway. The map shows the whole line drawn (scrolls sideways),
  // the boards stack below it and their cards simply fade in.
  function buildStill(boards) {
    fill.style.strokeDashoffset = 0;
    gsap.set(dotCores, { opacity: 1 });
    const box = track.getBBox();
    const labelH = Math.max(...$$(".journey__label").map((el) => el.offsetHeight));
    world.style.transform = `translate(32px, ${32 - box.y}px)`;
    map.style.setProperty("--map-h", `${Math.ceil(64 - box.y + 30 + labelH)}px`);

    $$("img[data-src]").forEach((img) => {
      img.loading = "lazy";
      img.src = img.dataset.src;
    });
    lis.forEach((_, i) => loaded.add(i));
    const cards = boards.flatMap((b) => {
      gsap.set(b.note, { rotation: b.tilt });
      b.items.forEach((el, j) => gsap.set(el, { rotation: b.slots[j].tilt }));
      return [b.note, ...b.items];
    });
    gsap.set(cards, { opacity: 0 });
    const show = (els) => gsap.to(els, { opacity: 1, duration: 0.6, stagger: 0.04, overwrite: true });
    ScrollTrigger.batch(cards, { start: "top 95%", onEnter: show, onLeave: show });

    return () => {
      fill.style.strokeDashoffset = world.style.transform = "";
      map.style.removeProperty("--map-h");
    };
  }

  function build(mode, wide) {
    const still = mode === "still";
    const m = still ? { ...JOURNEY_CONFIG[wide ? "wide" : "phone"], ...JOURNEY_CONFIG.still } : JOURNEY_CONFIG[mode];
    root.classList.toggle("journey--still", still);
    const W = stage.clientWidth;
    const H = still ? document.documentElement.clientHeight : stage.clientHeight;
    const geo = buildPath(m, W, H);
    fill.style.strokeDasharray = geo.total;
    const boards = lis.map((li, i) => layoutBoard(li, i, m, W, H));
    return still ? buildStill(boards) : buildPinned(m, geo, boards, W, H);
  }

  /* ---------- 5. Start (after main.js has set up ScrollSmoother, and the fonts are in for measuring) ---------- */
  function start() {
    gsap.registerPlugin(ScrollTrigger);
    // Month 1's photos start loading as the journey comes up the screen
    ScrollTrigger.create({ trigger: root, start: "top bottom", once: true, onEnter: () => [0, 1].forEach(loadMonth) });

    // (matchMedia only runs this while one of them matches, hence `phone` even though it's just "not wide")
    const media = { wide: "(min-width: 768px)", phone: "(max-width: 767.98px)", reduce: "(prefers-reduced-motion: reduce)" };
    gsap.matchMedia().add(media, (context) => {
      const { wide, reduce } = context.conditions;
      const mode = reduce ? "still" : wide ? "wide" : "phone";
      let journey = gsap.context(() => build(mode, wide));
      const touch = window.matchMedia("(pointer: coarse)").matches;
      let size = [window.innerWidth, window.innerHeight];
      let timer = null;
      let place = null;
      // Same kind of screen, new size: rebuild everything at the new size, keeping your place
      const rebuild = () => {
        timer = null;
        const [w, h] = [window.innerWidth, window.innerHeight];
        if (w === size[0] && (h === size[1] || touch)) return; // on touch screens: the toolbar or keyboard (the stage is 100svh)
        size = [w, h];
        journey.revert();
        journey = gsap.context(() => build(mode, wide));
        ScrollTrigger.refresh();
        if (place && current) scrollToTime(current, timeOf(current, place));
      };
      const onResize = () => {
        // Note the place before ScrollTrigger's own resize refresh changes the progress
        if (!timer) place = current?.scrollTrigger.isActive ? placeOf(current) : null;
        clearTimeout(timer);
        timer = setTimeout(rebuild, 250);
      };
      window.addEventListener("resize", onResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", onResize);
        journey.revert();
      };
    });
    ScrollTrigger.refresh();
  }

  document.addEventListener("DOMContentLoaded", () => {
    Promise.race([document.fonts?.ready, new Promise((resolve) => setTimeout(resolve, 1500))]).then(start);
  });
})();
