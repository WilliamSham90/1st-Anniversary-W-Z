/* =========================================================
   Coco & Moose: the play area along the bottom of the first screen
   ---------------------------------------------------------
   Two pixel cats with a food bowl, a bed, two balls and a toy mouse. They hop about, play, eat, nap
   and keep each other company. Click (or tap) a cat for its menu, drag cats and toys about, click a
   toy, the bowl or the bed, or anywhere on the floor to call a cat over.
   The cats' brains come from the Cat Playground project; here they're drawn with plain HTML and CSS
   (no PixiJS): each sprite is a <span> showing one frame of its sheet, moved with transforms.
   1. Config  2. Art  3. Things on the floor  4. Speech and effects  5. Cat brain  6. Toys
   7. Pointer and keyboard  8. Cat menu  9. Loop (only while the play area is on screen)
   ========================================================= */
(() => {
  "use strict";

  const room = document.getElementById("cats");
  if (!room) return;

  /* ---------- 1. Config ---------- */
  const CATS_CONFIG = {
    scale: (w) => (w >= 900 ? 3 : 2),   // screen px per sprite pixel (whole numbers keep the pixel art crisp)
    back: 0.4,                          // the floor's back edge, as a share of the play area's height
    keepLeft: 58,                       // px the bowl and the cats' spots keep clear of Chowder & Panini's button (bottom left)
    keepRight: 72,                      // px at the right end the floor stops short of, under the envelope button
    hop: { length: 20, height: 8, perSecond: 3.2 },   // sprite px per hop, sprite px high, hops a second
    needRate: { hunger: 1 / 90, tired: 1 / 130, bored: 1 / 35, lonely: 1 / 60 },   // per second, 0 → 1
    servings: 3,                        // a full bowl
    chatter: [7, 16],                   // seconds between a cat's remarks
  };
  const ART = "assets/images/Cats/";
  const LOOKS = {
    grey: { sheet: `${ART}cats/Grey.png`, colour: "grey" },
    orange: { sheet: `${ART}cats/OrangeCat.png`, colour: "orange" },
  };
  const CATS = SITE_DATA.cats?.length ? SITE_DATA.cats.slice(0, 2) : [{ name: "Coco", look: "grey" }, { name: "Moose", look: "orange" }];

  // The cat sheets: 32px frames, one animation per row. [row, frames, frames per second]
  const CELL = 32;
  const ANIMS = {
    idle: [0, 10, 6], idle2: [1, 10, 6], sleep: [2, 4, 2.5], dance: [3, 4, 6], yawn: [4, 8, 7], shy: [5, 12, 8],
    loaf: [6, 12, 5], sniff: [7, 9, 6], cry: [8, 4, 6], box1: [9, 12, 7], box2: [10, 4, 6], box3: [11, 4, 7],
    gasp: [12, 12, 12], eat: [13, 15, 5], sit: [14, 6, 3], blink: [15, 13, 7], hiss: [16, 9, 9], blush: [17, 12, 7],
  };
  const HOP_POSE = { ground: ["idle", 0], air: ["dance", 0], held: ["gasp", 2] };
  const EAT_BOWL_X = 8;   // where the bowl in the "eat" frames sits, in sheet px from the frame's left

  const ITEMS = {
    bowl: { src: `${ART}food/bowls.png`, frame: [16, 0, 16, 16] },   // the blue one: like the bowl in the eat frames
    bed: { src: `${ART}bed/bed-blue.png`, frame: [0, 0, 64, 64], seat: 7 },   // seat: how far up a cat lies in it
    ballBlue: { src: `${ART}Toys/ball-blue.png`, frame: [0, 0, 24, 16], size: 4 / 3 },   // a touch bigger, easier to tap
    ballPink: { src: `${ART}Toys/ball-pink.png`, frame: [0, 0, 24, 16], size: 4 / 3 },
    mouse: { src: `${ART}Toys/mouse.png`, frame: [0, 0, 32, 32], frames: 4, stride: 42 },
  };
  const EFFECTS = { hearts: `${ART}effects/hearts.png`, music: `${ART}effects/music.png`, alert: `${ART}effects/alert.png` };

  const LINES = {
    chat: ["Meow", "Mew", "Mrrp", "Purr~", "Nya~", "Mrow?", "Prrt!"],
    hunger: ["Feed me!", "Hungry…", "Meooow!"],
    tired: ["*yawn*", "Sleepy…"],
    bored: ["Play?", "Bored…", "Mrrp?"],
    lonely: ["Mew?", "Anyone?"],
  };

  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const every = (sec, fn) => { let t = sec; return (dt) => { if ((t -= dt) <= 0) { t = sec; fn(); } }; };

  /* ---------- 2. Art: load the sheets, and measure where each picture's feet are ---------- */
  const load = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });
  const pixelsOf = (img) => {
    const c = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height });
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
  };
  // The opaque pixels across `count` frames: the box they fill and the point under their feet, so an
  // animation stands on the same spot whatever its frames do (done once, at load)
  function measure(px, [x, y, w, h], count = 1, stride = w) {
    let left = w, right = -1, top = h, bottom = -1;
    for (let i = 0; i < count; i++) {
      for (let py = 0; py < h; py++) {
        for (let qx = 0; qx < w; qx++) {
          if (!px.data[((y + py) * px.width + x + i * stride + qx) * 4 + 3]) continue;
          left = Math.min(left, qx); right = Math.max(right, qx);
          top = Math.min(top, py); bottom = Math.max(bottom, py);
        }
      }
    }
    if (bottom < 0) [left, right, top, bottom] = [0, w - 1, 0, h - 1];
    return { foot: { x: (left + right + 1) / 2, y: bottom + 1 }, w: right - left + 1, h: bottom - top + 1 };
  }

  async function loadArt() {
    const sheets = {};
    for (const look of new Set(CATS.map((c) => c.look))) {
      const src = (LOOKS[look] ?? LOOKS.grey).sheet;
      const img = await load(src);
      const px = pixelsOf(img);
      const anims = {};
      let w = 0, h = 0;
      for (const [name, [row, frames]] of Object.entries(ANIMS)) {
        anims[name] = measure(px, [0, row * CELL, CELL, CELL], frames);
        if (!["dance", "box1", "box2", "box3"].includes(name)) {   // the body's box: sitting about, not the odd big pose
          w = Math.max(w, anims[name].w);
          h = Math.max(h, anims[name].h);
        }
      }
      sheets[look] = { src, colour: (LOOKS[look] ?? LOOKS.grey).colour, width: img.width, height: img.height, anims, box: { w, h } };
    }
    const items = {};
    for (const [name, def] of Object.entries(ITEMS)) {
      const img = await load(def.src);
      const m = measure(pixelsOf(img), def.frame, def.frames, def.stride);
      items[name] = { ...def, width: img.width, height: img.height, foot: m.foot, box: { w: m.w, h: m.h } };
    }
    const effects = {};
    for (const [name, src] of Object.entries(EFFECTS)) {
      const img = await load(src);
      effects[name] = { src, size: img.height, frames: Math.round(img.width / img.height), width: img.width };
    }
    return { sheets, items, effects };
  }

  /* ---------- 3. Things on the floor ---------- */
  // Every cat and object stands on the floor at (x, y), its feet, in px from the play area's top left.
  // `lift` raises the picture without moving it on the floor (a hop, a cat in the bed, something carried).
  const things = [];
  const view = { w: 0, h: 0, s: 2, x0: 0, x1: 0, y0: 0, y1: 0 };
  const unit = () => view.s / 3;   // speeds are given for scale 3
  let art;

  function addThing(kind, def, label) {
    const el = document.createElement("span");
    el.className = `cats__thing cats__thing--${kind}`;
    const shadow = Object.assign(document.createElement("span"), { className: "cats__shadow" });
    const body = document.createElement("button");
    body.type = "button";
    body.className = "cats__body";
    body.setAttribute("aria-label", label);
    const sprite = Object.assign(document.createElement("span"), { className: "cats__sprite" });
    sprite.style.backgroundImage = `url("${def.src}")`;
    body.append(sprite);
    el.append(shadow, body);
    room.append(el);
    const e = { kind, def, el, body, sprite, shadow, x: 0, y: 0, lift: 0, vx: 0, vy: 0, dir: 1, squash: 0, frame: 0, drawn: {} };
    body.addEventListener("pointerdown", (ev) => startDrag(e, ev));
    body.addEventListener("click", () => {
      if (e.dragged) { e.dragged = false; return; }   // the click that ends a drag
      activate(e);
    });
    things.push(e);
    return e;
  }

  // Sizes in px for the current scale; re-run when the play area is resized
  function fit(e) {
    const s = (e.s = view.s * (e.def.size ?? 1));
    const box = e.look ? e.look.box : e.def.box;
    e.half = (box.w * s) / 2;
    e.tall = box.h * s;
    const bw = Math.max(box.w * s, 40), bh = Math.max(box.h * s, 36);   // big enough to tap
    Object.assign(e.body.style, { width: `${bw}px`, height: `${bh}px`, left: `${-bw / 2}px`, top: `${-bh}px` });
    e.bw = bw;
    e.bh = bh;
    const sheetW = e.look ? e.look.width : e.def.width, sheetH = e.look ? e.look.height : e.def.height;
    e.sprite.style.backgroundSize = `${sheetW * s}px ${sheetH * s}px`;
    const sw = Math.max(18, box.w * s * 0.75);
    Object.assign(e.shadow.style, { width: `${sw}px`, height: `${sw * 0.28}px`, left: `${-sw / 2}px`, top: `${-sw * 0.14}px` });
    e.drawn = {};
    place(e);
  }

  // Puts the sprite so its feet sit on the body's bottom middle (feet differ from one animation to the next)
  function place(e) {
    const s = e.s;
    const [fw, fh] = e.look ? [CELL, CELL] : [e.def.frame[2], e.def.frame[3]];
    const foot = e.look ? e.look.anims[e.anim ?? "idle"].foot : e.def.foot;
    Object.assign(e.sprite.style, {
      width: `${fw * s}px`,
      height: `${fh * s}px`,
      left: `${e.bw / 2 - foot.x * s}px`,
      top: `${e.bh - foot.y * s}px`,
      transformOrigin: `${foot.x * s}px ${foot.y * s}px`,
    });
  }

  // The frame to show: [sheet x, sheet y] of its top-left corner
  function frameAt(e) {
    if (e.look) {
      const pose = e.held ? HOP_POSE.held : e.mode === "move" && !REDUCED ? (e.lift > 2 * unit() ? HOP_POSE.air : HOP_POSE.ground) : null;
      const [name, f] = pose ?? [e.anim, Math.floor(e.frame)];
      if (pose && name !== e.anim) { e.anim = name; place(e); }
      return [f * CELL, ANIMS[name][0] * CELL];
    }
    const [x, y, , , stride = e.def.frame[2]] = [...e.def.frame, e.def.stride];
    return [x + Math.floor(e.frame) * stride, y];
  }

  // Writes only what changed since the last frame
  function draw(e) {
    const d = e.drawn;
    const pos = `translate3d(${Math.round(e.x)}px, ${Math.round(e.y)}px, 0)`;
    if (pos !== d.pos) e.el.style.transform = d.pos = pos;
    const z = e.held ? 9999 : Math.round(e.y + (e.z ?? 0));
    if (z !== d.z) e.el.style.zIndex = d.z = z;
    const lift = Math.round(e.lift + (e.held ? 10 * unit() : 0));
    if (lift !== d.lift) {
      e.body.style.transform = `translate3d(0, ${-lift}px, 0)`;
      const k = clamp(1 - lift / (90 * unit()), 0.4, 1);
      e.shadow.style.transform = `scale(${k.toFixed(2)})`;
      e.shadow.style.opacity = (0.35 + k * 0.65).toFixed(2);
      d.lift = lift;
    }
    let sx = 1, sy = 1;
    if (e.mode === "move" && e.look && !REDUCED) {   // hopping: squashed on the ground, stretched in the air
      const c = Math.cos(e.hop * Math.PI * 2);
      sx = 1 + 0.08 * c;
      sy = 1 - 0.08 * c;
    } else if (e.squash > 0) {
      sx = 1 + 0.14 * e.squash;
      sy = 1 - 0.14 * e.squash;
    }
    const look = `scale(${(e.dir * sx).toFixed(3)}, ${sy.toFixed(3)})`;
    if (look !== d.look) e.sprite.style.transform = d.look = look;
    const [fx, fy] = frameAt(e);
    const bg = `${-fx * e.s}px ${-fy * e.s}px`;
    if (bg !== d.bg) e.sprite.style.backgroundPosition = d.bg = bg;
  }

  // The play area's floor: feet go between the back edge and the front, inside the ends
  function layout() {
    const w = room.clientWidth, h = room.clientHeight;
    if (!w || !h) return;
    const s = CATS_CONFIG.scale(w);
    // The floor ends before the envelope button (fixed at the screen's bottom right), so nothing hides under it
    const next = { w, h, s, x0: 10, x1: w - 10 - CATS_CONFIG.keepRight, y0: Math.round(h * CATS_CONFIG.back), y1: h - 12 };
    // Keep everything in the same place relative to the floor
    if (view.w) {
      for (const e of things) {
        e.x = next.x0 + ((e.x - view.x0) / (view.x1 - view.x0)) * (next.x1 - next.x0);
        e.y = next.y0 + ((e.y - view.y0) / (view.y1 - view.y0 || 1)) * (next.y1 - next.y0);
        e.lift *= s / view.s;
      }
    }
    const rescale = s !== view.s || !view.w;
    Object.assign(view, next);
    for (const e of things) {
      if (rescale) fit(e);
      keepIn(e);
    }
  }

  // Keep e's feet on the floor; says whether it was pushed back in (sideways, front/back)
  function keepIn(e) {
    const pad = e.half * 0.6;
    const x = clamp(e.x, view.x0 + pad, view.x1 - pad), y = clamp(e.y, view.y0, view.y1);
    const hit = { x: x !== e.x, y: y !== e.y };
    e.x = x;
    e.y = y;
    return hit;
  }
  const spotOnFloor = (e) => ({ x: rand(view.x0 + CATS_CONFIG.keepLeft + e.half, view.x1 - e.half), y: rand(view.y0, view.y1) });
  const nearest = (from, list) => list.reduce((best, e) => (!best || Math.hypot(e.x - from.x, e.y - from.y) < Math.hypot(best.x - from.x, best.y - from.y) ? e : best), null);
  const face = (a, b) => { if (Math.abs(b.x - a.x) > 1) a.dir = Math.sign(b.x - a.x); };
  const besideX = (cat, item) => item.x + (cat.x < item.x ? -1 : 1) * (item.half + cat.half * 0.5);

  /* ---------- 4. Speech bubbles and effects ---------- */
  function say(e, text, time = 2.4) {
    e.bubble?.el.remove();
    const el = Object.assign(document.createElement("span"), { className: "cats__bubble", textContent: text });
    el.setAttribute("aria-hidden", "true");
    room.append(el);
    e.bubble = { el, age: 0, time, w: el.offsetWidth, h: el.offsetHeight };
  }
  function updateBubbles(dt) {
    for (const e of things) {
      const b = e.bubble;
      if (!b) continue;
      if ((b.age += dt) >= b.time) {
        b.el.remove();
        e.bubble = null;
        continue;
      }
      // The tail's tip (bottom right) just above the head
      const x = Math.round(e.x + e.half * 0.35 - b.w + 10), y = Math.round(e.y - e.lift - e.tall * 0.95 - b.h);
      b.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      b.el.style.opacity = Math.min(1, (b.time - b.age) / 0.3).toFixed(2);
    }
  }

  // A pixel effect played once over the head (hearts, alert) or the middle (music) of e
  function effect(name, e) {
    if (REDUCED) return;
    const fx = art.effects[name], k = name === "alert" ? view.s / 3 : view.s / 2.5, size = Math.round(fx.size * k);
    const el = document.createElement("span");
    el.className = "cats__fx";
    el.setAttribute("aria-hidden", "true");
    const y = name === "music" ? e.y - e.lift - e.tall * 0.5 + size / 2 : e.y - e.lift - e.tall * 0.8;
    Object.assign(el.style, {
      width: `${size}px`, height: `${size}px`, left: `${Math.round(e.x - size / 2)}px`, top: `${Math.round(y - size)}px`,
      backgroundImage: `url("${fx.src}")`, backgroundSize: `${size * fx.frames}px ${size}px`, zIndex: 10000,
    });
    el.style.setProperty("--frames", fx.frames);
    el.style.setProperty("--end", `${-size * fx.frames}px`);
    el.addEventListener("animationend", () => el.remove(), { once: true });
    room.append(el);
  }

  /* ---------- 5. Cat brain ----------
     Needs run from 0 (content) to 1 (desperate) and creep up every second. Whenever a cat finishes
     something it sees to its most pressing need, otherwise it potters about. A cat is always either
     acting (an animation for a while) or moving (hopping to a spot, or after something), then runs `next`. */
  const NEEDS = Object.keys(CATS_CONFIG.needRate);
  const URGENT = 0.5;
  const relieve = (cat, need, amount) => { cat.needs[need] = Math.max(0, cat.needs[need] - amount); };
  const cats = () => things.filter((e) => e.look);
  const free = (c) => c.look && !c.held && c.anim !== "sleep" && !c.using && c !== menuCat && !c.falling;

  function play(cat, name) {
    cat.anim = name;
    cat.frame = 0;
    cat.loop = true;
    cat.fps = ANIMS[name][2];
    place(cat);
  }
  function act(cat, anim, time, next = null, tick = null) {
    Object.assign(cat, { mode: "act", time, next, tick, vx: 0, vy: 0 });
    play(cat, anim);
  }
  // The animation plays exactly once over `time`
  function actOnce(cat, anim, time, next = null, tick = null) {
    act(cat, anim, time, next, tick);
    cat.loop = false;
    cat.fps = ANIMS[anim][1] / time;
  }
  // Hop to (x, y), or after `follow`, then do `next`. `rush` = faster (chasing, zoomies).
  function goTo(cat, x, y, next = null, follow = null, rush = 1) {
    const to = { x, y };
    keepIn(Object.assign(to, { half: cat.half }));
    Object.assign(cat, { mode: "move", time: 12, next, tick: null, follow, rush, tx: to.x, ty: to.y, leaping: false, hop: cat.hop ?? 0 });
    if (REDUCED) Object.assign(cat, { x: follow ? besideX(cat, follow) : to.x, y: follow ? follow.y : to.y, mode: "act", time: 0 });   // no hopping: just there
  }

  // Let go of whatever the cat was doing
  function settle(cat) {
    if (cat.using) {
      cat.using.user = null;
      cat.using.el.style.visibility = "";   // the bowl hides while a cat eats from it (it's in the eat frames)
    }
    cat.using = cat.follow = cat.next = cat.tick = null;
    cat.inBed = false;
    cat.z = 0;
  }

  function think(cat) {
    settle(cat);
    if (REDUCED) return act(cat, "idle", Infinity);   // no pottering about: menu actions only
    const urgent = NEEDS.filter((k) => cat.needs[k] > URGENT).sort((a, b) => cat.needs[b] - cat.needs[a]);
    for (const need of urgent) if (pursue(cat, need)) return;
    pickWeighted(PASTIMES, cat)(cat);
  }

  // What a content cat does next, and how likely each is
  const rest = () => pick(["idle", "idle", "idle2", "blink", "sit", "loaf"]);
  const PASTIMES = [
    [5, (cat) => { const to = spotOnFloor(cat); goTo(cat, to.x, to.y, () => act(cat, rest(), rand(1, 2.5))); }],
    [3, (cat) => act(cat, rest(), rand(1.5, 3.5))],
    [2, sniff],
    [(cat) => 0.6 + cat.needs.bored * 3, zoomies],
    [(cat) => (cats().some((c) => c !== cat && free(c)) ? 1.5 : 0), tag],
    [0.8, (cat) => { say(cat, "*yawn*"); actOnce(cat, "yawn", 1.4); }],
    [1, boxTime],
    [0.5, dance],
  ];
  function pickWeighted(list, cat) {
    const weights = list.map(([w]) => (typeof w === "function" ? w(cat) : w));
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) if ((r -= weights[i]) < 0) return list[i][1];
    return list[0][1];
  }

  function sniff(cat) {
    const thing = pick(things.filter((e) => e !== cat && !e.held));
    if (!thing) return act(cat, "sit", 1.5);
    goTo(cat, besideX(cat, thing), thing.y + 1, () => { face(cat, thing); act(cat, "sniff", rand(1.2, 2)); });
  }
  function zoomies(cat) {
    let laps = 2 + Math.floor(Math.random() * 3);
    const lap = () => {
      if (laps-- <= 0) return act(cat, "sit", rand(1, 2));
      const to = spotOnFloor(cat);
      goTo(cat, to.x, to.y, lap, null, 1.8);
    };
    relieve(cat, "bored", 0.25);
    lap();
  }
  function tag(cat) {
    const friend = pick(cats().filter((c) => c !== cat && free(c)));
    if (!friend) return act(cat, "sit", 1);
    goTo(cat, friend.x, friend.y, () => greet(cat, friend), friend, 1.3);
  }

  function pursue(cat, need) {
    if (need === "lonely") {
      const friend = cats().find((c) => c !== cat && free(c));
      if (!friend) return false;
      goTo(cat, friend.x, friend.y, () => greet(cat, friend), friend);
      return true;
    }
    if (need === "hunger") {
      if (bowl.food > 0 && !bowl.user) return use(cat, bowl), true;
      if (Math.random() < 0.5) return false;   // empty: sometimes begs by the bowl, sometimes gets on with things
      goTo(cat, besideX(cat, bowl), bowl.y + 1, () => { face(cat, bowl); say(cat, "Feed me!"); act(cat, "cry", 3); });
      return true;
    }
    if (need === "tired") {
      if (!bed.user) use(cat, bed);
      else nap(cat);   // bed taken: curl up on the floor
      return true;
    }
    if (need === "bored") {
      const toy = nearest(cat, toys().filter((t) => !t.held && !t.stun));
      if (!toy) return false;
      use(cat, toy);
      return true;
    }
    return false;
  }

  const toys = () => things.filter((e) => e.kind === "ball" || e.kind === "mouse");
  function use(cat, item) {
    settle(cat);
    if (item.kind === "ball") return goTo(cat, item.x, item.y, () => kick(cat, item), item, 1.3);
    if (item.kind === "mouse") return goTo(cat, item.x, item.y, () => pounce(cat, item), item, 1.3);
    item.user = cat;
    cat.using = item;
    if (item.kind === "bowl") return goTo(cat, bowl.x + (cat.look.anims.eat.foot.x - EAT_BOWL_X) * cat.s, bowl.y, () => eat(cat));
    if (item.kind === "bed") return goTo(cat, bed.x, bed.y + 1, () => sleepInBed(cat));
  }

  function eat(cat) {
    if (bowl.food <= 0) { settle(cat); say(cat, "Empty…"); return act(cat, "cry", 2); }
    cat.dir = 1;
    cat.x = bowl.x + (cat.look.anims.eat.foot.x - EAT_BOWL_X) * cat.s;
    cat.y = bowl.y;
    bowl.el.style.visibility = "hidden";   // the cat's frames have the bowl in them
    actOnce(cat, "eat", 3.2, () => {
      setFood(bowl.food - 1);
      relieve(cat, "hunger", 0.8);
      settle(cat);
      say(cat, pick(["Yum!", "Nom nom", "Mrrp!"]));
      effect("music", cat);
      act(cat, "blink", 1.2);
    });
  }
  function setFood(n) {
    bowl.food = clamp(n, 0, CATS_CONFIG.servings);
    bowl.el.classList.toggle("is-empty", bowl.food === 0);
    bowl.body.setAttribute("aria-label", bowl.food ? `Food bowl, ${bowl.food} of ${CATS_CONFIG.servings} left` : "Food bowl, empty: fill it up");
  }

  function sleepInBed(cat) {
    Object.assign(cat, { x: bed.x, y: bed.y + 1, z: 1, inBed: true, lift: bed.def.seat * bed.s });
    nap(cat, true);
  }
  function nap(cat, inBed = false) {
    act(cat, inBed || Math.random() < 0.6 ? "sleep" : "loaf", 6 + cat.needs.tired * 12, () => {
      cat.needs.tired = 0;
      if (inBed) { cat.inBed = false; cat.lift = 0; cat.y = bed.y + 6 * unit(); cat.squash = 1; }
    }, every(4.5, () => say(cat, "Zzz…", 1.6)));
  }

  function kick(cat, ball) {
    face(cat, ball);
    if (ball.held) return actOnce(cat, "dance", 0.6);   // swats at the ball you're dangling
    const a = Math.atan2(ball.y - cat.y, ball.x - cat.x) + rand(-0.7, 0.7);
    const v = rand(380, 620) * unit();
    ball.vx = Math.cos(a) * v;
    ball.vy = Math.sin(a) * v * 0.5;
    relieve(cat, "bored", 0.2);
    actOnce(cat, "dance", 0.5, () => {
      if (cat.needs.bored > 0.25 && Math.random() < 0.65) use(cat, ball);   // after it again!
    });
  }
  function pounce(cat, mouse) {
    face(cat, mouse);
    if (mouse.held || mouse.stun > 0) return actOnce(cat, "dance", 0.6);
    mouse.stun = 1.6;
    mouse.vx = mouse.vy = 0;
    mouse.squash = 1;
    effect("alert", mouse);
    say(mouse, "Eek!", 1.2);
    relieve(cat, "bored", 0.6);
    say(cat, pick(["Gotcha!", "Mine!", "Caught it!"]));
    act(cat, "gasp", 0.6, () => act(cat, "blush", 1.6));
  }

  function greet(cat, friend) {
    if (!free(friend)) return act(cat, "sit", 2);
    settle(friend);
    face(cat, friend);
    face(friend, cat);
    const scrap = Math.random() < 0.4;   // a play-fight, or a cuddle
    for (const c of [cat, friend]) {
      relieve(c, "lonely", 0.7);
      if (scrap) relieve(c, "bored", 0.3);
      effect(scrap ? "alert" : "hearts", c);
      if (scrap) actOnce(c, "hiss", 1.6);
      else act(c, "blush", 3);
    }
    say(cat, scrap ? "Hiss!" : "Mrrp!");
  }

  function pet(cat) {
    const asleep = cat.anim === "sleep";
    settle(cat);
    cat.lift = 0;
    if (asleep) return gasp(cat, "Hmph!");
    relieve(cat, "lonely", 0.5);
    relieve(cat, "bored", 0.2);
    if (Math.random() < 0.35) { say(cat, "Hehe~"); return act(cat, "shy", 2); }
    effect("hearts", cat);
    say(cat, "Purr~");
    act(cat, "blush", 2.2);
  }

  // ---- Moods (from the menu) ----
  function boxTime(cat) {
    say(cat, pick(["Box!", "Mine!", "Mrrp!"]));
    act(cat, "box1", rand(2.5, 4), () => act(cat, "box2", rand(1.5, 2.5), () => act(cat, "box3", rand(1.5, 2.5), () => relieve(cat, "bored", 0.4))));
  }
  function dance(cat) {
    say(cat, pick(["La la~", "Nya nya~", "Mew mew~"]));
    effect("music", cat);
    act(cat, "dance", rand(2.5, 4), () => relieve(cat, "bored", 0.3), every(1.3, () => effect("music", cat)));
  }
  function gasp(cat, line = pick(["Mrow?!", "Eek!"])) {
    effect("alert", cat);
    say(cat, line);
    act(cat, "gasp", 1.4);
  }
  const MOODS = [
    { label: "Box", anim: "box1", frame: 4, run: boxTime },
    { label: "Dance", anim: "dance", frame: 0, run: dance },
    { label: "Gasp", anim: "gasp", frame: 2, run: (cat) => gasp(cat) },
    { label: "Shy", anim: "shy", frame: 4, run: (cat) => { say(cat, "Hehe~"); act(cat, "shy", 2.4); } },
    { label: "Loaf", anim: "loaf", frame: 0, run: (cat) => act(cat, "loaf", rand(3, 5)) },
    { label: "Cry", anim: "cry", frame: 0, run: (cat) => { say(cat, pick(["Mew…", "Sniff…"])); act(cat, "cry", 3); } },
    { label: "Yawn", anim: "yawn", frame: 1, run: (cat) => { say(cat, "*yawn*"); actOnce(cat, "yawn", 1.4); } },
    { label: "Hiss", anim: "hiss", frame: 6, run: (cat) => { effect("alert", cat); say(cat, "Hiss!"); actOnce(cat, "hiss", 1.4); } },
  ];

  function chatter(cat, dt) {
    if ((cat.chat -= dt) > 0) return;
    cat.chat = rand(...CATS_CONFIG.chatter);
    if (cat.anim === "sleep" || cat.held || cat === menuCat) return;
    const need = NEEDS.filter((k) => cat.needs[k] > URGENT).sort((a, b) => cat.needs[b] - cat.needs[a])[0];
    say(cat, pick(LINES[need] ?? LINES.chat));
  }

  function updateCat(cat, dt) {
    if (!REDUCED) for (const k of NEEDS) cat.needs[k] = Math.min(1, cat.needs[k] + CATS_CONFIG.needRate[k] * dt);
    if (!REDUCED) chatter(cat, dt);
    cat.time -= dt;
    if (cat.mode !== "move" && !cat.inBed && cat.lift > 0 && !cat.falling) {   // came down at the end of a hop
      cat.lift = Math.max(0, cat.lift - 420 * unit() * dt);
      if (!cat.lift) cat.squash = 0.6;
    }
    if (cat.mode === "act") {
      cat.tick?.(dt);
      if (cat.time > 0) return;
    } else if (cat.mode === "move") {
      const t = cat.follow;
      if (t?.held || cat.time <= 0 || (t?.stun > 0 && t.kind === "mouse")) return think(cat);   // target gone, or gave up
      const gx = t ? t.x : cat.tx, gy = t ? t.y : cat.ty;
      const reach = t ? t.half + cat.half * 0.5 : 0;
      if (t?.kind === "mouse") cat.leaping = Math.hypot(gx - cat.x, gy - cat.y) < 110 * unit();   // a big pounce from close by
      if (hop(cat, gx, gy, reach, dt)) return;
    } else if (cat.mode !== null && cat.mode !== undefined) return;
    if (cat.held || cat.falling) return;
    const next = cat.next;
    cat.mode = cat.next = cat.tick = null;
    next?.();
    if (!cat.mode) think(cat);
  }

  // One step of hopping towards (tx, ty), stopping `reach` short. False once it's there.
  function hop(cat, tx, ty, reach, dt) {
    const dx = tx - cat.x, dy = ty - cat.y, dist = Math.hypot(dx, dy), left = dist - reach;
    if (left <= 1.5) return false;
    const { length, height, perSecond } = CATS_CONFIG.hop;
    const len = length * view.s * (cat.leaping ? 1.6 : 1);
    const step = Math.min(left, len * perSecond * cat.rush * dt);
    cat.x += (dx / dist) * step;
    cat.y += (dy / dist) * step;
    if (Math.abs(dx) > 1) cat.dir = Math.sign(dx);
    cat.hop = (cat.hop + step / len) % 1;
    cat.lift = Math.sin(cat.hop * Math.PI) * height * view.s * (cat.leaping ? 1.8 : 1);
    return true;
  }

  /* ---------- 6. Toys ---------- */
  // Slide by velocity, bounce off the floor's edges; says whether it bounced
  function slide(e, dt, friction) {
    const x = e.x + e.vx * dt, y = e.y + e.vy * dt;
    e.x = x;
    e.y = y;
    const hit = keepIn(e);
    if (hit.x) e.vx = -e.vx * 0.8;
    if (hit.y) e.vy = -e.vy * 0.8;
    const f = Math.exp(-friction * dt);
    e.vx *= f;
    e.vy *= f;
    return hit.x || hit.y;
  }

  function updateBall(b, dt) {
    slide(b, dt, 1.2);
    const speed = Math.hypot(b.vx, b.vy);
    b.hop = (b.hop ?? 0) + (dt * speed) / (25 * unit());
    if (!b.falling) b.lift = Math.abs(Math.sin(b.hop)) * Math.min(speed / 14, 20 * unit());
    if (Math.abs(b.vx) > 4) b.dir = Math.sign(b.vx);
  }

  // The mouse darts about in short dashes with pauses in between. When an awake cat comes close it
  // bolts, zig-zagging away and steering clear of the ends it could be trapped in.
  const MOUSE = { dash: 190, flee: 300, scare: 190 };
  function updateMouse(m, dt) {
    const u = unit();
    let speed = 0;
    if (m.stun > 0) {
      m.stun -= dt;
      if (m.stun <= 0) { m.fleeing = false; m.time = 0; }   // caught, let go: off it runs
    } else {
      const cat = nearest(m, cats().filter((c) => !c.held && c.anim !== "sleep"));
      const d = cat ? Math.hypot(m.x - cat.x, m.y - cat.y) : Infinity;
      m.time -= dt;
      if (d < MOUSE.scare * u) {
        if (!m.fleeing || m.time <= 0) {
          if (!m.fleeing && performance.now() - (m.alerted ?? 0) > 4000) { effect("alert", m); m.alerted = performance.now(); }
          m.fleeing = true;
          m.time = rand(0.15, 0.35);
          m.heading = escapeHeading(m, cat);
        }
        speed = MOUSE.flee;
      } else {
        m.fleeing = false;
        if (m.time <= 0) {
          m.dashing = !m.dashing;
          m.time = m.dashing ? rand(0.3, 0.9) : rand(0.4, 1.6);
          if (m.dashing) m.heading = (m.heading ?? rand(0, Math.PI * 2)) + rand(-1.3, 1.3);
        }
        if (m.dashing) speed = MOUSE.dash;
      }
    }
    const k = Math.min(1, 14 * dt);
    m.vx += (Math.cos(m.heading ?? 0) * speed * u - m.vx) * k;
    m.vy += (Math.sin(m.heading ?? 0) * speed * 0.5 * u - m.vy) * k;
    if (slide(m, dt, m.stun > 0 ? 6 : 0)) m.heading = Math.atan2(m.vy / 0.5, m.vx);
    const v = Math.hypot(m.vx, m.vy);
    if (v > 5 * u) m.frame = (m.frame + dt * 15 * clamp(v / (200 * u), 0.6, 1.8)) % m.def.frames;
    if (Math.abs(m.vx) > 5) m.dir = Math.sign(m.vx);
  }
  // Away from the cat but not into an end: try headings around "straight away", keep the most open one
  function escapeHeading(m, cat) {
    const away = Math.atan2((m.y - cat.y) / 0.5, m.x - cat.x);
    let best = away, score = -Infinity;
    for (let i = -4; i <= 4; i++) {
      const a = away + i * 0.4 + rand(-0.15, 0.15);
      const x = m.x + Math.cos(a) * 110 * unit(), y = m.y + Math.sin(a) * 55 * unit();
      const out = Math.max(view.x0 + 30 - x, x - (view.x1 - 30), view.y0 - y, y - view.y1, 0);
      const sc = Math.cos(a - away) - out / 20;
      if (sc > score) { best = a; score = sc; }
    }
    return best;
  }

  /* ---------- 7. Pointer and keyboard ---------- */
  // A click (or Enter / Space): cats open their menu, toys get played with
  function activate(e) {
    hideHint();
    if (e.look) return openMenu(e);
    if (e.kind === "ball") {
      if (!REDUCED) {
        const a = rand(0, Math.PI * 2), v = 520 * unit();
        e.vx = Math.cos(a) * v;
        e.vy = Math.sin(a) * v * 0.5;
      }
    } else if (e.kind === "mouse") {
      say(e, "Squeak!", 1.4);
      if (!REDUCED) { e.stun = 0; e.heading = rand(0, Math.PI * 2); e.dashing = true; e.time = 1; }
    } else if (e.kind === "bowl") {
      if (bowl.food < CATS_CONFIG.servings) { setFood(CATS_CONFIG.servings); say(bowl, "Full!", 1.4); }
      const hungry = cats().filter(free).sort((a, b) => b.needs.hunger - a.needs.hunger)[0];
      if (hungry && !bowl.user) { say(hungry, "Food!"); use(hungry, bowl); }
      return;
    } else if (e.kind === "bed") {
      const sleepy = cats().filter(free).sort((a, b) => b.needs.tired - a.needs.tired)[0];
      if (sleepy && !bed.user) { say(sleepy, "*yawn*"); use(sleepy, bed); }
      return;
    }
    // …and the nearest cat that isn't busy comes over to see
    const cat = nearest(e, cats().filter(free));
    if (cat) use(cat, e);
  }

  // Drag cats and toys about (the bed and bowl stay put). A press that doesn't move is a click.
  let drag = null;
  function startDrag(e, ev) {
    if (drag || ev.button !== 0 || e.fixed) return;
    drag = { e, id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, moved: false, box: room.getBoundingClientRect(), trail: [] };
    e.body.setPointerCapture(ev.pointerId);
    e.body.addEventListener("pointermove", onDragMove);
    e.body.addEventListener("pointerup", endDrag);
    e.body.addEventListener("pointercancel", endDrag);
  }
  function onDragMove(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    const e = drag.e;
    if (!drag.moved) {
      if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 6) return;
      drag.moved = true;
      pickUp(e);
      drag.ox = e.x - (drag.sx - drag.box.left);
      drag.oy = e.y - e.lift - (drag.sy - drag.box.top);
    }
    const px = ev.clientX - drag.box.left, py = ev.clientY - drag.box.top;
    e.x = px + drag.ox;
    const want = py + drag.oy;   // where its feet would be, if it could float
    e.y = want;
    keepIn(e);
    e.lift = clamp(e.y - want, 0, Math.max(0, e.y - e.tall));   // held up above the floor
    drag.trail.push({ x: e.x, y: e.y, t: ev.timeStamp });
    if (drag.trail.length > 5) drag.trail.shift();
  }
  function pickUp(e) {
    hideHint();
    e.held = true;
    e.falling = false;
    e.vx = e.vy = 0;
    if (e.look) {
      if (e === menuCat) hideMenu();
      settle(e);
      e.mode = null;
      say(e, pick(["Mrow?!", "Wheee!", "Hey!"]), 1.4);
    }
    room.classList.add("is-dragging");
  }
  function endDrag(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    const { e, moved, trail } = drag;
    drag = null;
    e.body.removeEventListener("pointermove", onDragMove);
    e.body.removeEventListener("pointerup", endDrag);
    e.body.removeEventListener("pointercancel", endDrag);
    room.classList.remove("is-dragging");
    if (!moved) return;
    e.dragged = true;   // so the click that follows is ignored
    e.held = false;
    e.lift += 10 * unit();
    e.falling = !REDUCED;
    e.fallV = 0;
    if (REDUCED) e.lift = 0;
    if (!e.look && trail.length > 1 && !REDUCED) {   // toys are thrown the way they were moving
      const a = trail[0], b = trail[trail.length - 1], t = Math.max(16, b.t - a.t) / 1000, max = 900 * unit();
      e.vx = clamp((b.x - a.x) / t, -max, max);
      e.vy = clamp(((b.y - a.y) / t) * 0.5, -max, max);
    }
    if (e.look) act(e, "gasp", Infinity);
    if (REDUCED) landed(e);
  }
  // Back on the floor after being carried
  function landed(e) {
    e.squash = 1;
    if (!e.look) return;
    say(e, pick(["Mrrp!", "Again!", "Hmph."]), 1.6);
    act(e, "sit", 1);
  }
  const GRAVITY = 1700;
  function fall(e, dt) {
    e.fallV += GRAVITY * unit() * dt;
    e.lift -= e.fallV * dt;
    if (e.lift > 0) return;
    e.lift = 0;
    e.falling = false;
    landed(e);
  }

  // Click the floor: the nearest cat that isn't busy hops over for a look
  room.addEventListener("click", (ev) => {
    if (ev.target !== room) return;
    hideHint();
    const box = room.getBoundingClientRect(), x = ev.clientX - box.left, y = ev.clientY - box.top;
    const cat = nearest({ x, y }, cats().filter(free));
    if (!cat) return;
    settle(cat);
    goTo(cat, x, Math.max(y, view.y0), () => act(cat, "sniff", 1.6), null, 1.2);
  });

  /* ---------- 8. Cat menu: name the cat, see how it's doing, tell it what to do ---------- */
  const menu = document.getElementById("cat-menu");
  const nameInput = document.getElementById("cat-menu-name");
  const hasPopover = typeof menu.showPopover === "function";
  let menuCat = null;
  let menuClock = 0;
  if (!hasPopover) menu.classList.add("cat-menu--fallback");

  // Shown as "how good", so a full bar is a happy cat
  const NEED_BARS = [
    { need: "hunger", label: "Full", colour: "#e9a46a" },
    { need: "tired", label: "Energy", colour: "#8fb8d8" },
    { need: "bored", label: "Fun", colour: "#e8c66a" },
    { need: "lonely", label: "Love", colour: "#e89a9a" },
  ];
  const ui = (file) => Object.assign(document.createElement("img"), { src: `${ART}ui/${file}`, alt: "" });
  // A picture of one frame of the cat's sheet
  const frameIcon = (cat, anim, frame) => {
    const icon = document.createElement("span");
    icon.className = "cat-menu__frame";
    icon.style.backgroundImage = `url("${cat.look.src}")`;
    icon.style.backgroundPosition = `${-frame * CELL}px ${-ANIMS[anim][0] * CELL}px`;
    return icon;
  };
  const MENU_ACTIONS = [
    { label: "Pet", icon: () => ui("paw.png"), run: pet },
    { label: "Feed", icon: () => ui("fish.png"), run: (cat) => { if (!bowl.food) setFood(CATS_CONFIG.servings); if (bowl.user && bowl.user !== cat) { say(cat, "My turn?"); return act(cat, "sit", 2); } use(cat, bowl); } },
    { label: "Play", icon: (cat) => frameIcon(cat, "dance", 0), run: (cat) => pursue(cat, "bored") || zoomies(cat) },
    { label: "Nap", icon: () => ui("sleeping-cat.png"), run: (cat) => (bed.user && bed.user !== cat ? nap(cat) : use(cat, bed)) },
    { label: "Sit", icon: (cat) => frameIcon(cat, "sit", 0), run: (cat) => act(cat, "sit", rand(4, 6)) },
    { label: "Zoomies", icon: (cat) => frameIcon(cat, "gasp", 2), run: (cat) => (REDUCED ? act(cat, "blink", 2) : zoomies(cat)) },
  ];

  const meters = NEED_BARS.map(({ label, colour }) => {
    const bar = document.createElement("span");
    bar.className = "cat-menu__meter";
    bar.setAttribute("role", "meter");
    bar.setAttribute("aria-label", label);
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.style.setProperty("--fill", colour);
    bar.append(document.createElement("span"));
    document.getElementById("cat-menu-needs").append(Object.assign(document.createElement("span"), { textContent: label }), bar);
    return bar;
  });
  function showNeeds(cat) {
    NEED_BARS.forEach(({ need }, i) => {
      const value = Math.round((1 - cat.needs[need]) * 100);
      meters[i].setAttribute("aria-valuenow", value);
      meters[i].firstChild.style.width = `${value}%`;
    });
  }

  function openMenu(cat) {
    if (menuCat && menuCat !== cat) hideMenu();
    menuCat = cat;
    settle(cat);
    if (!cat.falling) act(cat, "sit", Infinity);
    cat.waiting = true;
    say(cat, "Mew?");
    nameInput.value = cat.name;
    menu.setAttribute("aria-label", cat.name);
    const button = (label, icon, run) => {
      const b = Object.assign(document.createElement("button"), { type: "button", className: "cat-menu__button" });
      b.append(icon, label);
      b.addEventListener("click", () => {
        cat.waiting = false;
        hideMenu();
        settle(cat);
        run(cat);
      });
      return b;
    };
    document.getElementById("cat-menu-actions").replaceChildren(...MENU_ACTIONS.map(({ label, icon, run }) => button(label, icon(cat), run)));
    document.getElementById("cat-menu-moods").replaceChildren(...MOODS.map(({ label, anim, frame, run }) => button(label, frameIcon(cat, anim, frame), run)));
    showNeeds(cat);
    cat.body.setAttribute("aria-expanded", "true");
    if (hasPopover) menu.showPopover();
    else {
      menu.classList.add("is-open");
      setTimeout(() => document.addEventListener("click", closeOutside), 0);
    }
    placeMenu();
    menu.querySelector(".cat-menu__button").focus({ preventScroll: true });
  }
  let keepFocus = false;   // closed by scrolling away: focus stays put (moving it back would scroll the page back)
  function hideMenu(scrolledAway = false) {
    if (!menuCat) return;
    keepFocus = scrolledAway;
    if (hasPopover) menu.hidePopover();
    else { menu.classList.remove("is-open"); menuClosed(); }
  }
  function menuClosed() {
    document.removeEventListener("click", closeOutside);
    const cat = menuCat;
    if (!cat) return;
    menuCat = null;
    cat.body.setAttribute("aria-expanded", "false");
    if (!keepFocus && (menu.contains(document.activeElement) || document.activeElement === document.body)) cat.body.focus({ preventScroll: true });
    keepFocus = false;
    if (cat.waiting) { cat.waiting = false; think(cat); }   // closed without picking anything: it carries on
  }
  const closeOutside = (ev) => { if (!menu.contains(ev.target)) hideMenu(); };
  menu.addEventListener("toggle", (ev) => { if (ev.newState === "closed") menuClosed(); });
  menu.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !hasPopover) hideMenu(); });
  nameInput.addEventListener("input", () => {
    const name = nameInput.value.trim();
    if (menuCat && name) rename(menuCat, name);
  });
  nameInput.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter") return;
    ev.preventDefault();   // so the same key press doesn't also "click" the cat it hands focus back to
    hideMenu();
  });

  // Beside the cat, on whichever side has room
  function placeMenu() {
    const r = menuCat.body.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight;
    let left = r.right + 12;
    if (left + w > innerWidth - 8) left = r.left - 12 - w;
    menu.style.left = `${clamp(left, 8, Math.max(8, innerWidth - w - 8))}px`;
    menu.style.top = `${clamp(r.top + r.height / 2 - h / 2, 8, Math.max(8, innerHeight - h - 8))}px`;
  }
  function updateMenu(dt) {
    if (!menuCat) return;
    placeMenu();
    if ((menuClock -= dt) <= 0) { menuClock = 0.25; showNeeds(menuCat); }
  }

  function rename(cat, name) {
    cat.name = name;
    cat.tag.textContent = name;
    cat.body.setAttribute("aria-label", `${name}, the ${cat.look.colour} cat: pet, feed or play`);
    menu.setAttribute("aria-label", name);
  }

  // The little sign in the corner, until the cats have been played with
  const hint = room.querySelector(".cats__hint");
  function hideHint() { hint?.classList.add("is-hidden"); }

  /* ---------- 9. Start, and the loop (only while the play area is on screen) ---------- */
  let bowl, bed, last = 0, running = false, raf = 0;

  function step(now) {
    const dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    for (const e of things) {
      if (e.held) continue;
      if (e.falling) fall(e, dt);
      if (e.look) {
        if (!REDUCED) e.frame = e.loop ? (e.frame + e.fps * dt) % ANIMS[e.anim][1] : Math.min(e.frame + e.fps * dt, ANIMS[e.anim][1] - 1);
        updateCat(e, dt);
      } else if (!REDUCED && e.kind === "ball") updateBall(e, dt);
      else if (!REDUCED && e.kind === "mouse") updateMouse(e, dt);
      if (e.squash > 0) e.squash = Math.max(0, e.squash - dt * 5);
    }
    for (const e of things) draw(e);
    updateBubbles(dt);
    updateMenu(dt);
  }
  // Reduced motion: no animation at all, just a slow tick so timed things (bubbles, poses) end
  const tick = REDUCED ? (fn) => setTimeout(() => fn(performance.now()), 250) : requestAnimationFrame;
  const untick = REDUCED ? clearTimeout : cancelAnimationFrame;
  function loop(now) {
    raf = tick(loop);
    step(now);
  }
  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) { last = performance.now(); raf = tick(loop); }
    else { untick(raf); hideMenu(true); }
  }

  async function start() {
    try {
      art = await loadArt();
    } catch (err) {
      console.warn("Cats:", err.message);
      return;
    }
    layout();
    const at = (fx, fy) => ({ x: view.x0 + fx * (view.x1 - view.x0), y: view.y0 + fy * (view.y1 - view.y0) });
    bowl = Object.assign(addThing("bowl", art.items.bowl, "Food bowl"), { fixed: true, food: CATS_CONFIG.servings });
    bed = Object.assign(addThing("bed", art.items.bed, "Cat bed: call a sleepy cat"), { fixed: true });
    const spots = [[0.13, 0.55], [0.62, 0.45]];
    CATS.forEach((c, i) => {
      const look = art.sheets[c.look] ?? Object.values(art.sheets)[0];
      const cat = Object.assign(addThing("cat", { src: look.src }, ""), {
        look, name: c.name, needs: { hunger: rand(0.2, 0.45), tired: rand(0, 0.3), bored: rand(0.4, 0.7), lonely: rand(0, 0.3) },
        chat: rand(1, 6), dir: i ? -1 : 1,
      });
      cat.body.setAttribute("aria-haspopup", "dialog");
      cat.body.setAttribute("aria-expanded", "false");
      cat.body.setAttribute("aria-controls", "cat-menu");
      cat.tag = Object.assign(document.createElement("span"), { className: "cats__tag" });
      cat.tag.setAttribute("aria-hidden", "true");
      cat.body.append(cat.tag);
      fit(cat);
      rename(cat, c.name);
      Object.assign(cat, at(...spots[i]));
      act(cat, "idle", rand(1, 2.5));
    });
    const balls = [addThing("ball", art.items.ballBlue, "Blue ball: give it a kick"), addThing("ball", art.items.ballPink, "Pink ball: give it a kick")];
    const mouse = Object.assign(addThing("mouse", art.items.mouse, "Toy mouse: make it squeak"), { stun: 0, time: 0 });
    for (const e of [bowl, bed, ...balls, mouse]) fit(e);
    Object.assign(bowl, at(0, 0.62));
    bowl.x = view.x0 + CATS_CONFIG.keepLeft + bowl.half;
    Object.assign(bed, at(1, 0.35));
    bed.x = view.x1 - bed.half;
    Object.assign(balls[0], at(0.28, 0.85));
    Object.assign(balls[1], at(0.47, 0.3));
    Object.assign(mouse, at(0.4, 0.6));
    const moose = cats()[1];
    if (moose) moose.x = Math.min(moose.x, bed.x - bed.half - moose.half - 8);
    setFood(CATS_CONFIG.servings);
    for (const e of things) { keepIn(e); draw(e); }
    room.classList.add("is-ready");

    new ResizeObserver(() => { layout(); for (const e of things) draw(e); }).observe(room);
    new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting)).observe(room);
  }

  start();
})();
