# One Year Together 💗

A one-year anniversary site for William & Zané. It's plain HTML, CSS and JavaScript with GSAP, so there's no install and no build step.

**To open it:** double-click `index.html`.
It needs an internet connection for GSAP, Google Fonts and the placeholder photos. Once you swap in your own photos, only GSAP and the fonts come from the web.

## Where everything lives

```
index.html          page structure (section headings/intros live here)
css/style.css       all styling; colours, fonts and spacing are variables at the top
js/data.js          ← ALL your personal content: edit this file
js/main.js          behaviour (you shouldn't need to touch it)
assets/images/      your photos (timeline, moments, closing photo)
assets/artists/     artist images for the music player
assets/music/       your mp3 files
assets/video/       the Chowder & Panini video
```

## Swap in your photos

1. Put your photo in `assets/images/`, for example `assets/images/month-01-1.jpg` (month 1, photo 1).
2. In `js/data.js`, find the line with that photo. Each line ends with a comment showing the suggested file name:
   ```js
   { src: "https://picsum.photos/seed/month1-1/600/750", alt: "Us on our very first date", caption: "Where it all began" }, // → assets/images/month-01-1.jpg
   ```
3. Replace the `src` value:
   ```js
   { src: "assets/images/month-01-1.jpg", alt: "Us on our very first date", caption: "Where it all began" },
   ```
4. Update `alt` so it describes the real photo. Screen readers read it aloud.

Tips:
- Portrait photos (about 4:5) fit the frames best. Other shapes still work: they get cropped to fill the frame.
- Each month currently has 3–5 photos. To add or remove one, add or delete a `{ src, alt, caption }` line in that month's `images: [ ... ]` list. Any number works: they sit 3 to a row on wider screens and 2 to a row on phones, and 2 or 4 photos arrange as a neat square.
- File names are case-sensitive on some systems, so `Photo.JPG` and `photo.jpg` are different files.

## Add your songs

1. Put each mp3 in `assets/music/`, named as in `data.js` (`song-01.mp3`, `song-02.mp3`, ...), or use any name you like and update `file`.
2. Put an artist or cover image in `assets/artists/` and update `image`.
3. Edit `title` and `artist`.

```js
{ title: "Lover", artist: "Taylor Swift", image: "assets/artists/artist-01.jpg", file: "assets/music/song-01.mp3" },
```

Add or remove whole lines to change the playlist. Until an mp3 exists, the player shows a small note saying which file is missing.

## Chowder & Panini surprise

Once you scroll past the first screen, Chowder & Panini peek in at the bottom-left with a speech bubble. Clicking them pauses the music and opens a video player. The video closes with the X, the Esc key or a click outside it.

The little × on the bubble tucks them away. A small round button with their faces then stays in the bottom-left corner, and clicking it brings them back.

Everything is set in `peek` near the bottom of `js/data.js`:

1. **Video:** save it as `assets/video/chowder-panini.mp4`, or use any name and update `video`. Use MP4, since it plays in every browser.
2. **Image:** currently `assets/images/chowder and panini 1.png`. To use a different picture, put it in `assets/images/` and change `image`. A PNG with a transparent background looks best, because they look like they're peeking up from the edge of the screen. Set `image: ""` to show two placeholder faces (🐱 🐰) instead.
3. **Text:** change `bubble` (the speech bubble) and `title` (shown under the video).

## Secret notes

Tapping your names on the first screen opens a little love note. "Another one" shows the next, and they go round in order. A subtle hint under the opening line ("psst… tap our names") points the way.

Edit them in `secret` in `js/data.js`:
- `notes`: add, remove or reword as many as you like
- `signoff`: the signature under each note
- `hint`: the hint text

## Hidden letters

Six envelopes are hidden at the end of lines of text around the site. Hovering over the words makes one pop out; on a phone you tap the words instead. Opening an envelope shows its letter, and after that an open envelope stays in that spot, so it can be read again.

The round envelope button at the bottom-right (with the "2/6" badge) opens the collection. Found letters are in colour and can be re-read. Grey ones are still hidden, and tapping one shows a clue.

Edit everything in `letters` in `js/data.js`:
- `items`: the six letters, each with a `title`, `text` (a blank line starts a new paragraph), a `clue`, and a `spot` saying where it hides
- `spot` is a CSS selector for a paragraph on the page, for example `".timeline__item:nth-child(4) .timeline__text"` means "the text of Month 4". If a spot doesn't match anything, that envelope isn't shown, and the browser console says which one.
- `hint`: the general hint at the bottom of the collection
- `signoff`: the signature under each letter

Once all six are found, confetti rains the first time the collection shows them all together, whether that's straight after the last letter or the next time the envelope button is opened. It plays only once; after that the collection simply says "You found them all ♥". Change that message with `complete` in `letters`.

Found letters, and whether the confetti has played, are remembered in the browser, so they survive closing the page. **If you test the hunt on the device you'll show Zané, click "Hide them all again"** at the bottom of the collection. That hides every envelope again and resets the confetti, so she gets the full experience.

## Little extras

- **Cursor trail:** moving the mouse leaves a soft trail of dots and tiny hearts in the site's colours. It only runs for a mouse; touch screens don't have a hovering cursor.
- **Heart burst:** clicking or tapping anywhere pops a small burst of hearts.

## Change the words

Everything personal is in `js/data.js`:
- `names`, `anniversary` (YYYY-MM-DD) and `heroLine`: the opening screen
- `timeline`: 12 entries, one per month, each with `date`, `title`, `text` and `images`. The "Month 1–12" labels are added automatically in order.
- `moments`: the card stack (`caption` and `date` per photo)
- `songs`: the playlist
- `closing`: the heading, message paragraphs, final photo, sign-off and footer line
- `secret`: the secret notes, their sign-off and the hint
- `letters`: the six hidden letters, where they hide, their clues, and the "found them all" message
- `peek`: the Chowder & Panini image, speech bubble and video

Section headings and their one-line intros ("Our Year", "Twelve little chapters of us." and so on) are in `index.html`.

## Accessibility and motion

If someone's device is set to *reduce motion*, the site automatically turns off smooth scrolling, scroll animations, the floating hearts, the cursor trail, the heart bursts and the confetti.

The muted text colour is `#7D6D71`, slightly darker than `#8A7B7F` from the original palette, so small text meets WCAG AA contrast on the cream background. You can change it in `css/style.css` under `--color-muted`.
