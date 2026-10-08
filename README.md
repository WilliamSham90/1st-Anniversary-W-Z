# One Year Together 💗

A one-year anniversary site for William & Zané. It's plain HTML, CSS and JavaScript with GSAP, so there's no install and no build step.

**To open it:** double-click `index.html`.
It needs an internet connection for GSAP, Google Fonts and the placeholder photos. Once you swap in your own photos, only GSAP, the fonts and the Chowder & Panini video come from the web.

## Where everything lives

```
index.html          page structure (section headings/intros live here)
css/style.css       all styling; colours, fonts and spacing are variables at the top
js/data.js          ← ALL your personal content: edit this file
js/main.js          behaviour (you shouldn't need to touch it)
assets/images/      your photos: month-01 … month-12 for the timeline (photos and videos), plus moments and the closing photo
assets/songs/       the songs: each mp3 and its square album cover
assets/video/       small local videos (the Chowder & Panini one is hosted online, see below)
```

## Swap in your photos

Each month has its own folder: `assets/images/month-01/` for Month 1, up to `assets/images/month-12/`. All twelve months have their photos. (Month 12's title and text are placeholders for now.)

1. Put the photo in that month's folder and rename it to a short, lowercase name with hyphens instead of spaces that says what's in it, for example `assets/images/month-12/anniversary-dinner.jpg`. (Photos saved from WhatsApp are named like `WhatsApp Image 2026-09-28 at 21.05.53 (1).jpeg`. Rename those, because the spaces and brackets can break links once the site is online.)
2. In `js/data.js`, find that month and add a line for it to its `images: [ ... ]` list (or change the `src` of an existing line), with the path to your photo:
   ```js
   { src: "assets/images/month-12/anniversary-dinner.jpg", alt: "Our anniversary dinner table", caption: "Dinner for two" },
   ```
3. Update `alt` so it describes the real photo (screen readers read it aloud), and `caption`, the handwritten line under the photo.

Tips:
- Portrait photos (about 4:5) fit the frames best. Other shapes still work: the small frame shows the middle of the photo, and clicking it opens the whole photo. If the middle is the wrong part (a face cut off, say), add `focus` to choose what the frame keeps: `"top"`, `"bottom"`, `"left"`, `"right"`, or a position like `"50% 20%"` (across, then down).
- To add or remove a photo, add or delete a `{ src, alt, caption }` line in that month's `images: [ ... ]` list. Any number works: they're pinned all over that month's board, and a month with lots of photos gets a taller board that scrolls.
- File names are case-sensitive once the site is online, so `Photo.JPG` and `photo.jpg` are different files. Keeping everything lowercase avoids surprises.
- **Small copies (`thumbs`):** each month folder has a `thumbs` folder with a smaller copy of every photo (720 pixels on the long side, same file name). The boards show those, so phones load and decode a fifth as much and scrolling stays smooth; clicking a photo still opens the full-size one. A new photo works without a small copy (the board then uses the full photo), but for the smoothest scrolling put a copy in `thumbs` too, made with any photo resizer (for example [squoosh.app](https://squoosh.app): resize to 720 on the long side, JPEG quality about 80).

### Add a video

Videos sit in the timeline next to the photos, with a play button on the frame. Clicking one opens it big, with sound and the usual controls, and the arrows step through photos and videos together. Playing a video pauses the music. Month 3 has three examples.

1. Put the `.mp4` in the month's folder with a short lowercase name, e.g. `assets/images/month-12/first-dance.mp4`. Videos saved from WhatsApp or a phone are already MP4, which plays in every browser.
2. Add a still picture from the video with the **same name** as a `.jpg` (`first-dance.jpg`). It's what shows in the frame and before the video starts. A screenshot of a good moment works well.
3. Add a line with both:
   ```js
   { src: "assets/images/month-12/first-dance.jpg", video: "assets/images/month-12/first-dance.mp4", alt: "Our first dance", caption: "First dance" },
   ```

Videos only download when they're opened, so they don't slow the page down. Keeping each one under about 10 MB still helps on mobile data.

## Add your songs

1. Put the mp3 in `assets/songs/` and rename it to a short lowercase name with hyphens, e.g. `perfect-ed-sheeran.mp3`. Put that path in `file`.
2. Put the album cover next to it (e.g. `perfect-cover.jpg`) and put that path in `image`. Covers are shown square, so a square image about 500×500 looks best.
3. Edit `title` and `artist`.

```js
{ title: "Dandelions", artist: "Ruth B.", image: "assets/songs/dandelions-cover.jpg", file: "assets/songs/dandelions-ruth-b.mp3" },
```

Add or remove whole lines to change the playlist. Until an mp3 exists, the player shows a small note saying which file is missing.

The Our Songs section has no heading on screen, just the album covers in a 3D "coverflow" over slowly drifting, blurred colours, with the player underneath. Swipe or drag the covers sideways, click one, or tab to a cover and use the ← → keys to browse. Clicking a side cover plays that song; clicking the middle cover (or the round button) plays and pauses. Browsing keeps the music going if it was already playing. It starts on the middle song so the covers fan out on both sides. Chowder's cover is the exception: instead of play/pause it carries an envelope, shown while Chowder's song is in the middle. The letter's `spot` picks the cover by song title, so reordering the songs is fine.

### Mini music player

Once you scroll past the first screen, a small spinning record plays the same music as Our Songs, so it can be paused or skipped from anywhere. The two always match: changing the song or pausing in one changes the other. On a computer it's a bar in the bottom centre with the song, a progress line and back / play / next (click the record to shrink it to just the record). On a phone it's a round record above the envelope button; tap it for the controls, tap anywhere else to tuck them away. It hides while the big player in Our Songs is on screen.

Any video (timeline, letters, Chowder & Panini) pauses the music; when the video finishes or its viewer is closed, the music carries on. Music paused by hand stays paused.

## Chowder & Panini surprise

Once you scroll past the first screen, Chowder & Panini peek in at the bottom-left with a speech bubble. Clicking them pauses the music and opens a video player. The video closes with the X, the Esc key or a click outside it.

The little × on the bubble tucks them away. A small round button with their faces then stays in the bottom-left corner, and clicking it brings them back.

Everything is set in `peek` near the bottom of `js/data.js`:

1. **Video:** it's hosted on 3dlasermonkey.co.za, because at 226 MB it's too big for GitHub (100 MB per file). `video` holds its web address. It streams, so it starts playing straight away, and nothing downloads until it's opened. To swap it, upload the new MP4 there and paste its address into `video`. A small video can also go in `assets/video/` with `video: "assets/video/name.mp4"`. Either way use MP4 (H.264), which plays in every browser.
2. **Image:** currently `assets/images/chowder and panini 1.png`. To use a different picture, put it in `assets/images/` and change `image`. A PNG with a transparent background looks best, because they look like they're peeking up from the edge of the screen. Set `image: ""` to show two placeholder faces (🐱 🐰) instead.
3. **Text:** change `bubble` (the speech bubble) and `title` (shown under the video).

## Hidden letters

Six envelopes are tucked away around the site, always visible: at the end of lines of text, on Chowder's album cover, and one beside Our Year's line between Month 7 and Month 8. Opening an envelope shows its letter, and after that it's drawn open, so it can be read again.

The round envelope button at the bottom-right (with the "2/6" badge) opens the collection. Found letters are in colour and can be re-read. Grey ones are still hidden, and tapping one shows a clue.

Edit everything in `letters` in `js/data.js`:
- `items`: the six letters, each with a `title`, `text` (a blank line starts a new paragraph), a `clue`, and a `spot` saying where it hides
- A letter can have `images` instead of `text`: then it shows just its title and those photos, which open in the photo viewer (stepping through only that letter's photos). The Chowder & Panini letter, "Love U my Bebe Girllll", works like this. Its envelope hides beside the names under the Chowder & Panini video.
- `spot` is a CSS selector for a paragraph on the page, for example `"#forever-message p:last-child"` means "the last paragraph of the closing message", and `"#journey-letter"` is the spot beside Our Year's line (`envelopeAfter` in `js/journey.js` picks which month it follows). If a spot doesn't match anything, that envelope isn't shown, and the browser console says which one.
- `hint`: the general hint at the bottom of the collection
- `signoff`: the signature under each letter

Once all six are found, confetti rains the first time the collection shows them all together, whether that's straight after the last letter or the next time the envelope button is opened. It plays only once; after that the collection simply says "You found them all ♥". Change that message with `complete` in `letters`.

Found letters, and whether the confetti has played, are remembered in the browser, so they survive closing the page. **If you test the hunt on the device you'll show Zané, click "Hide them all again"** at the bottom of the collection. That hides every envelope again and resets the confetti, so she gets the full experience.

## Photo booth (Moments)

The Moments section (the pink band after the first screen) is a little photo booth card. Pressing **Take our snapshots** opens a pop-up that counts down 3, 2, 1, then takes the photos in `moments` one by one, each with a soft camera flash inside the booth's window. At the end they come out as two photo strips that "develop" from a hazy sepia. "Skip to the prints" jumps straight to the strips.

After the first time, a small film-strip button, **See our prints again**, appears under the booth and opens the finished strips directly. It's remembered in the browser, so it's still there next visit.

Under the prints, **Download as a picture** saves both strips as one JPEG (`william-and-zane-photo-booth.jpg`), drawn the same way as on screen. This only works once the site is online (GitHub Pages is fine). Browsers block it when `index.html` is opened by double-clicking, and the booth says so. To try it on your computer, run a local server in the project folder, for example `npx serve`.

One of the hidden envelopes sits at the end of the "All 8 snaps, printed ♥" line under the prints. Its letter, "Haha Coco and Sniper!!!", is a video (`assets/images/coco-and-sniper-love-note.mp4`) that opens in the video viewer.

**Sticker backgrounds:** the pink Moments band shows `assets/images/photo-booth-pattern.webp` repeated over the pink, and the pop-up (and the downloaded picture) shows `assets/images/photo-booth-card-pattern.webp` over a light apricot. These are compressed copies of `PhotoBooth_bg.png` and `photobooth_card_bg.png` (about 5 times smaller). To change a pattern, replace the `.webp` file with the same name, or point the `url(...)` in `css/style.css` (section 7) at a new image. Patterns made to tile seamlessly look best.

Edit the photos in `moments` in `js/data.js` (`src`, `alt` and a short, silly `caption`, like "Plot twist!"). The photos live in `assets/images/photo-booth/`; the booth takes them in the order listed. Eight photos fill two strips of four; any number works. The frames are square, like a real photo booth, so landscape and portrait photos both fit; the middle of each photo is shown.

## Coco & Moose (the play area on the first screen)

Along the bottom of the first screen is a little pixel playroom with two cats, Coco (grey) and Moose (orange), plus a food bowl, a bed, two balls and a toy mouse. The cats get on with their day by themselves: they hop about, chase the balls and the mouse, eat, nap in the bed, hide in a box, dance, and come over to each other for a cuddle or a play-fight.

- **Click (or tap) a cat** to open its menu: change its name, see how full, rested, entertained and loved it is, and tell it what to do (Pet, Feed, Play, Nap, Sit, Zoomies, or one of the moods).
- **Drag** a cat or a toy to move it; let go of a toy while moving it to throw it.
- **Click a toy** to set it off, **the bowl** to fill it up (it holds 3 servings), **the bed** to send a sleepy cat to bed, or **anywhere on the floor** to call a cat over.
- Their names and colours are in `cats` in `js/data.js`. The pictures are in `assets/images/Cats/`, and everything about how they behave (speeds, how quickly they get hungry or bored, sizes) is in `CATS_CONFIG` at the top of `js/cats.js`.
- The cats only move while the first screen is in view, so they don't slow the rest of the site down. With *reduce motion* on, they sit still and only do what their menu tells them.

## Little extras

- **Cursor trail:** moving the mouse leaves a soft trail of dots and tiny hearts in the site's colours. It only runs for a mouse; touch screens don't have a hovering cursor.
- **Heart burst:** clicking or tapping anywhere pops a small burst of hearts.

## Change the words

Everything personal is in `js/data.js`:
- `names`, `anniversary` (YYYY-MM-DD) and `heroLine`: the opening screen
- `timeline`: 12 entries, one per month, each with `date`, `title`, `text` and `images` (and an optional `teaser`, the short line on the month's card along the path; without it, the first phrase of `text` is used). The "Month 1–12" labels are added automatically in order. Scrolling rides along one line from month to month, and each month opens into its own pin board. The colours, flourishes, scroll lengths and sway are in `JOURNEY_CONFIG` at the top of `js/journey.js`. Clicking a photo opens the viewer for that month only ("3 / 12"), and its arrows step through that month's photos and videos.
- `moments`: the photo booth snapshots (`src`, `alt` and `caption` per photo)
- `songs`: the playlist
- `closing`: the heading, message paragraphs, final photo, sign-off and footer line
- `letters`: the six hidden letters, where they hide, their clues, and the "found them all" message
- `peek`: the Chowder & Panini image, speech bubble and video

Section headings and their one-line intros ("Our Year", "Twelve little chapters of us." and so on) are in `index.html`.

## Accessibility and motion

If someone's device is set to *reduce motion*, the site automatically turns off smooth scrolling, scroll animations, the drifting colours behind the names and the music, the floating hearts, the cursor trail, the heart bursts and the confetti. Our Year shows its whole line drawn on a map you can scroll sideways, with the month boards stacked below it. The photo booth skips its countdown and flashes and goes straight to the printed strips.

The muted text colour is `#7D6D71`, slightly darker than `#8A7B7F` from the original palette, so small text meets WCAG AA contrast on the cream background. You can change it in `css/style.css` under `--color-muted`.
