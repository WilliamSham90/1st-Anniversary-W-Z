/* =========================================================
   SITE CONTENT — edit everything personal here.
   ---------------------------------------------------------
   • Swap a photo: put it in that month's folder (the comment at the
     end of each line says which one), give it a short lowercase name
     with hyphens, e.g. "assets/images/month-03/beach-day.jpg", and
     put that path in `src`. Update `alt` and `caption` too.
   • Add or remove photos inside any `images: [ ... ]` list.
   • Songs need an mp3 in assets/music/ and an image in assets/artists/.
   • Plain text only — no HTML needed.
   ========================================================= */

const SITE_DATA = {
  names: { one: "William", two: "Zané" },

  // YYYY-MM-DD
  anniversary: "2026-10-29",

  heroLine: "Twelve months, countless little moments, and a lifetime of more to come.",

  /* ---------- Our Year: one entry per month (Month 1 → Month 12), photos in assets/images/month-01 … month-12 ---------- */
  timeline: [
    {
      date: "November 2025",
      title: "Clay Painting & Farm Days",
      text: "We started with clay painting: paint all over our hands, a little grey cat, a pink triceratops and pizza between coats. Then it was off to the farm for horses, dog cuddles and a day out hunting. Not your usual first chapter, but it's ours.",
      images: [
        { src: "assets/images/month-01/clay-painting-paint-hands.jpg", alt: "Showing off paint-covered hands and pulling a cheeky face", caption: "Caught pink-handed" },
        { src: "assets/images/month-01/clay-painting-paint-hands-2.jpg", alt: "Holding up paint-covered hands and smiling under a tree", caption: "Guilty as charged" },
        { src: "assets/images/month-01/clay-painting-cat.jpg", alt: "A freshly painted grey clay cat on the painting table", caption: "Meet the cat" },
        { src: "assets/images/month-01/clay-painting-cat-finished.jpg", alt: "Proudly holding up the finished clay cat with its yellow heart", caption: "Proud cat parent" },
        { src: "assets/images/month-01/clay-painting-triceratops.jpg", alt: "A pink clay triceratops held up to the camera", caption: "Pink triceratops" },
        { src: "assets/images/month-01/clay-painting-table.jpg", alt: "Paint pots, brushes, the clay cat and triceratops next to a pizza", caption: "Paint & pizza" },
        { src: "assets/images/month-01/farm-horse.jpg", alt: "Saying hello to a horse over the fence at the farm", caption: "New friend" },
        { src: "assets/images/month-01/farm-dog-cuddles.jpg", alt: "The two of us in camp chairs at the farm with a little dog", caption: "Camp-chair cuddles" },
        { src: "assets/images/month-01/farm-dog-kisses.jpg", alt: "Snuggled up in camp chairs, giving the little dog a kiss", caption: "Dog kisses" },
        { src: "assets/images/month-01/farm-hunt-hoof.jpg", alt: "Laughing and holding up a hoof on the farm", caption: "A leg up" },
        { src: "assets/images/month-01/farm-hunt-wildebeest.jpg", alt: "Kneeling with a rifle beside a black wildebeest on the hillside", caption: "The hunt" },
      ],
    },
    {
      date: "December 2025",
      title: "The Nutcracker & New Year's",
      text: "All dressed up for The Nutcracker at Teatro, Montecasino, posing under the poster and pulling silly faces in our seats. Then we saw the year out together at a New Year's party: glitter, a photo frame, and 2026 starting with you right beside me.",
      images: [
        { src: "assets/images/month-02/nutcracker-poster.jpg", alt: "Posing under The Nutcracker poster at Teatro, Montecasino", caption: "The Nutcracker!" },
        { src: "assets/images/month-02/nutcracker-dressed-up.jpg", alt: "All dressed up and smiling against a sandstone wall", caption: "All dressed up" },
        { src: "assets/images/month-02/nutcracker-laughing.jpg", alt: "Laughing together against a sandstone wall", caption: "Mid-laugh" },
        { src: "assets/images/month-02/nutcracker-tongue-out.jpg", alt: "Hugging against the wall, one of us with a cheeky tongue out", caption: "Couldn't stay serious" },
        { src: "assets/images/month-02/nutcracker-theatre-selfie.jpg", alt: "Pulling silly faces in our theatre seats", caption: "Best seats in the house" },
        { src: "assets/images/month-02/back-smiley.jpg", alt: "A smiley face of love bites on a back", caption: "Left you a smile" },
        { src: "assets/images/month-02/new-year-frame-kiss.jpg", alt: "Posing in a 2026 Happy New Year photo frame, one of us pulling a kissy face", caption: "Hello, 2026" },
        { src: "assets/images/month-02/new-year-frame-smile.jpg", alt: "Smiling together in a 2026 Happy New Year photo frame", caption: "Our first New Year" },
        { src: "assets/images/month-02/new-year-glitter.jpg", alt: "A glittery close-up with a tongue out at the New Year's party", caption: "Glitter everywhere" },
        { src: "assets/images/month-02/new-year-selfie.jpg", alt: "A squished-together selfie, laughing", caption: "Squished & happy" },
      ],
    },
    {
      date: "January 2026",
      title: "A Brand-New Year",
      text: "Midnight kisses and a whole year stretched out in front of us. Every plan suddenly had a 'we' in it.",
      images: [
        { src: "https://picsum.photos/seed/month3-1/600/750", alt: "Celebrating New Year's Eve together", caption: "Hello, 2026" }, // → assets/images/month-03/
        { src: "https://picsum.photos/seed/month3-2/600/750", alt: "Fireworks over the city", caption: "Midnight sky" }, // → assets/images/month-03/
        { src: "https://picsum.photos/seed/month3-3/600/750", alt: "Sparklers in the dark", caption: "Make a wish" }, // → assets/images/month-03/
        { src: "https://picsum.photos/seed/month3-4/600/750", alt: "Our list of New Year's resolutions", caption: "Resolutions (ha)" }, // → assets/images/month-03/
        { src: "https://picsum.photos/seed/month3-5/600/750", alt: "A lazy New Year's Day brunch", caption: "Recovery brunch" }, // → assets/images/month-03/
      ],
    },
    {
      date: "February 2026",
      title: "Our First Valentine's",
      text: "Handwritten notes, a slightly burnt dinner, and laughing about it until our cheeks hurt.",
      images: [
        { src: "https://picsum.photos/seed/month4-1/600/750", alt: "Valentine's dinner at home", caption: "Chef's kiss" }, // → assets/images/month-04/
        { src: "https://picsum.photos/seed/month4-2/600/750", alt: "Handwritten notes on the table", caption: "Love notes" }, // → assets/images/month-04/
        { src: "https://picsum.photos/seed/month4-3/600/750", alt: "Flowers on the kitchen counter", caption: "For you" }, // → assets/images/month-04/
      ],
    },
    {
      date: "March 2026",
      title: "Little Adventures",
      text: "Wrong turns, new cafés and the discovery that getting lost is more fun with you.",
      images: [
        { src: "https://picsum.photos/seed/month5-1/600/750", alt: "Exploring a new neighbourhood", caption: "Took the long way" }, // → assets/images/month-05/
        { src: "https://picsum.photos/seed/month5-2/600/750", alt: "Coffee at a tiny café we found", caption: "Our new spot" }, // → assets/images/month-05/
        { src: "https://picsum.photos/seed/month5-3/600/750", alt: "A map covered in scribbles", caption: "Where to next?" }, // → assets/images/month-05/
        { src: "https://picsum.photos/seed/month5-4/600/750", alt: "Street art on a random wall", caption: "Found this!" }, // → assets/images/month-05/
        { src: "https://picsum.photos/seed/month5-5/600/750", alt: "The view from a train window", caption: "Window seat" }, // → assets/images/month-05/
      ],
    },
    {
      date: "April 2026",
      title: "Spring in Bloom",
      text: "Picnics, flowers and long evenings. Everything felt lighter, and so did we.",
      images: [
        { src: "https://picsum.photos/seed/month6-1/600/750", alt: "Picnic in the park in spring", caption: "Blossom season" }, // → assets/images/month-06/
        { src: "https://picsum.photos/seed/month6-2/600/750", alt: "Cherry blossoms overhead", caption: "Pink skies" }, // → assets/images/month-06/
        { src: "https://picsum.photos/seed/month6-3/600/750", alt: "A picnic blanket full of snacks", caption: "Too many snacks" }, // → assets/images/month-06/
        { src: "https://picsum.photos/seed/month6-4/600/750", alt: "Flowers from the market", caption: "Market flowers" }, // → assets/images/month-06/
      ],
    },
    {
      date: "May 2026",
      title: "Sunday Mornings",
      text: "Slow breakfasts, crosswords we never finished and the comfort of doing nothing together.",
      images: [
        { src: "https://picsum.photos/seed/month7-1/600/750", alt: "A lazy Sunday breakfast", caption: "Pancake Sundays" }, // → assets/images/month-07/
        { src: "https://picsum.photos/seed/month7-2/600/750", alt: "A crossword we never finished", caption: "7 down?" }, // → assets/images/month-07/
        { src: "https://picsum.photos/seed/month7-3/600/750", alt: "Rain on the window on a slow morning", caption: "Staying in" }, // → assets/images/month-07/
      ],
    },
    {
      date: "June 2026",
      title: "Summer Begins",
      text: "Sunscreen, salty hair and the best ice cream debate of all time. (I was right.)",
      images: [
        { src: "https://picsum.photos/seed/month8-1/600/750", alt: "A day at the beach", caption: "Sun-kissed" }, // → assets/images/month-08/
        { src: "https://picsum.photos/seed/month8-2/600/750", alt: "Sharing ice cream by the sea", caption: "Two scoops" }, // → assets/images/month-08/
        { src: "https://picsum.photos/seed/month8-3/600/750", alt: "Footprints in the sand", caption: "Side by side" }, // → assets/images/month-08/
        { src: "https://picsum.photos/seed/month8-4/600/750", alt: "Sunglasses and sunscreen on a towel", caption: "SPF 50, always" }, // → assets/images/month-08/
      ],
    },
    {
      date: "July 2026",
      title: "Golden Hours",
      text: "Sunsets that made us stop mid-sentence, and the realisation that home can be a person.",
      images: [
        { src: "https://picsum.photos/seed/month9-1/600/750", alt: "Watching the sunset together", caption: "Golden hour" }, // → assets/images/month-09/
        { src: "https://picsum.photos/seed/month9-2/600/750", alt: "Our silhouettes against the sky", caption: "Just us" }, // → assets/images/month-09/
        { src: "https://picsum.photos/seed/month9-3/600/750", alt: "Warm light through the trees", caption: "Glow" }, // → assets/images/month-09/
        { src: "https://picsum.photos/seed/month9-4/600/750", alt: "An evening walk by the water", caption: "Evening stroll" }, // → assets/images/month-09/
        { src: "https://picsum.photos/seed/month9-5/600/750", alt: "The sky turning pink", caption: "Cotton-candy sky" }, // → assets/images/month-09/
      ],
    },
    {
      date: "August 2026",
      title: "The Road Trip",
      text: "Questionable snacks, a perfect playlist and singing every word with the windows down.",
      images: [
        { src: "https://picsum.photos/seed/month10-1/600/750", alt: "On the road during our trip", caption: "Windows down" }, // → assets/images/month-10/
        { src: "https://picsum.photos/seed/month10-2/600/750", alt: "Road-trip snacks on the dashboard", caption: "Snack co-pilot" }, // → assets/images/month-10/
        { src: "https://picsum.photos/seed/month10-3/600/750", alt: "A viewpoint on the way", caption: "Worth the detour" }, // → assets/images/month-10/
      ],
    },
    {
      date: "September 2026",
      title: "Cosy Season",
      text: "Blankets, rainy days and movie marathons. The kind of ordinary I'd choose again and again.",
      images: [
        { src: "https://picsum.photos/seed/month11-1/600/750", alt: "Movie night under a blanket", caption: "Movie marathon" }, // → assets/images/month-11/
        { src: "https://picsum.photos/seed/month11-2/600/750", alt: "A rainy day through the window", caption: "Rain again" }, // → assets/images/month-11/
        { src: "https://picsum.photos/seed/month11-3/600/750", alt: "Two mugs of tea", caption: "Tea for two" }, // → assets/images/month-11/
        { src: "https://picsum.photos/seed/month11-4/600/750", alt: "Autumn leaves on a walk", caption: "Crunchy leaves" }, // → assets/images/month-11/
      ],
    },
    {
      date: "October 2026",
      title: "One Whole Year",
      text: "Three hundred and sixty-five days of you. Here's to every single one still to come.",
      images: [
        { src: "https://picsum.photos/seed/month12-1/600/750", alt: "Celebrating our first anniversary", caption: "Year one" }, // → assets/images/month-12/
        { src: "https://picsum.photos/seed/month12-2/600/750", alt: "The two of us, one year on", caption: "Still us" }, // → assets/images/month-12/
        { src: "https://picsum.photos/seed/month12-3/600/750", alt: "Our anniversary dinner table", caption: "Dinner for two" }, // → assets/images/month-12/
        { src: "https://picsum.photos/seed/month12-4/600/750", alt: "A cake with one candle", caption: "One candle" }, // → assets/images/month-12/
        { src: "https://picsum.photos/seed/month12-5/600/750", alt: "Holding hands", caption: "Always" }, // → assets/images/month-12/
      ],
    },
  ],

  /* ---------- Moments: the shuffle-able card stack ---------- */
  moments: [
    { src: "https://picsum.photos/seed/moment1/600/750", alt: "Our first selfie together", caption: "Our first selfie", date: "Nov 2025" }, // → assets/images/moment-01.jpg
    { src: "https://picsum.photos/seed/moment2/600/750", alt: "A rainy-day picnic", caption: "That rainy picnic", date: "Dec 2025" }, // → assets/images/moment-02.jpg
    { src: "https://picsum.photos/seed/moment3/600/750", alt: "Our matching mugs", caption: "Matching mugs", date: "Jan 2026" }, // → assets/images/moment-03.jpg
    { src: "https://picsum.photos/seed/moment4/600/750", alt: "Ice cream at midnight", caption: "Midnight ice cream", date: "Mar 2026" }, // → assets/images/moment-04.jpg
    { src: "https://picsum.photos/seed/moment5/600/750", alt: "Sunset on the pier", caption: "Sunset on the pier", date: "May 2026" }, // → assets/images/moment-05.jpg
    { src: "https://picsum.photos/seed/moment6/600/750", alt: "Laughing at something silly", caption: "You, mid-laugh", date: "Jul 2026" }, // → assets/images/moment-06.jpg
    { src: "https://picsum.photos/seed/moment7/600/750", alt: "Our blanket fort for movie night", caption: "Blanket fort HQ", date: "Sep 2026" }, // → assets/images/moment-07.jpg
    { src: "https://picsum.photos/seed/moment8/600/750", alt: "The two of us together", caption: "Us, always", date: "Oct 2026" }, // → assets/images/moment-08.jpg
  ],

  /* ---------- Our Songs ---------- */
  // `file` must be a local mp3 in assets/music/. `image` can be a local file or a URL.
  songs: [
    { title: "Lover", artist: "Taylor Swift", image: "https://picsum.photos/seed/artist1/400/400", file: "assets/music/song-01.mp3" }, // image → assets/artists/artist-01.jpg
    { title: "Until I Found You", artist: "Stephen Sanchez", image: "https://picsum.photos/seed/artist2/400/400", file: "assets/music/song-02.mp3" }, // image → assets/artists/artist-02.jpg
    { title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars", image: "https://picsum.photos/seed/artist3/400/400", file: "assets/music/song-03.mp3" }, // image → assets/artists/artist-03.jpg
    { title: "Yellow", artist: "Coldplay", image: "https://picsum.photos/seed/artist4/400/400", file: "assets/music/song-04.mp3" }, // image → assets/artists/artist-04.jpg
    { title: "Perfect", artist: "Ed Sheeran", image: "https://picsum.photos/seed/artist5/400/400", file: "assets/music/song-05.mp3" }, // image → assets/artists/artist-05.jpg
  ],

  /* ---------- Forever: closing section ---------- */
  closing: {
    heading: "Here's to Forever",
    message: [
      "A year ago I didn't know how much one person could change the shape of my days. Now I can't picture them without you.",
      "Thank you for the laughter, the patience, the terrible puns and the quiet moments in between. You make ordinary things feel like something worth remembering.",
      "This is only chapter one. I can't wait to write the rest with you.",
    ],
    image: { src: "https://picsum.photos/seed/forever/600/750", alt: "The two of us together", caption: "Chapter one of many" }, // → assets/images/forever.jpg
    signoff: "All my love, William",
    footer: "Made with love by William, for Zané",
  },

  /* ---------- Hidden letters ---------- */
  // Six envelopes hidden around the site. Hovering over (or tapping) the words in `spot`
  // makes the envelope pop out at the end of that text. The envelope button at the
  // bottom-right shows which ones have been found.
  //   spot:  where it hides (a CSS selector for a paragraph on the page)
  //   clue:  shown when you tap an envelope that hasn't been found yet
  //   text:  the letter itself; a blank line starts a new paragraph
  letters: {
    hint: "Six envelopes are hiding around the site. Hover over the words (or tap them on a phone) to find them. Stuck? Tap a grey envelope for a clue.",
    complete: "You found every single letter, and every word is true. ♥",   // shown once all are found
    signoff: "— W",
    items: [
      {
        spot: ".hero__date",
        clue: "Start at the very beginning, with the date that matters most.",
        title: "Open when it's our anniversary",
        text: "Happy one year, my love.\n\nEvery day with you has been my favourite kind of ordinary. Thank you for choosing me, again and again.",
      },
      {
        spot: ".timeline__item:nth-child(4) .timeline__text",
        clue: "Month 4 has a story about a certain dinner.",
        title: "Open when you need a laugh",
        text: "Remember the burnt dinner? You laughed so hard you snorted, and that's when I knew I was in trouble. The good kind.",
      },
      {
        spot: ".timeline__item:nth-child(9) .timeline__text",
        clue: "Golden hours, in month 9. Read it slowly.",
        title: "Open when you miss me",
        text: "Close your eyes. That warm, golden feeling? That's me thinking about you.\n\nI'm always just one message away.",
      },
      {
        spot: "#moments .section__intro",
        clue: "The Moments section has something tucked into its words.",
        title: "Open when you can't sleep",
        text: "Count little moments instead of sheep: the matching mugs, the midnight ice cream, you mid-laugh.\n\nI'll be right here in the morning.",
      },
      {
        spot: "#songs .section__intro",
        clue: "The songs that sound like us… hover and listen.",
        title: "Open when you hear our song",
        text: "Turn it up and dance in the kitchen like nobody's watching. If I'm not there, I'm dancing with you anyway.",
      },
      {
        spot: "#forever-message p:last-child",
        clue: "Look in the last few words before the goodbye.",
        title: "Open when you need a reminder",
        text: "You are loved. Loudly, quietly, on the easy days and the hard ones.\n\nThat won't change. Not in a year, not in fifty.",
      },
    ],
  },

  /* ---------- Chowder & Panini surprise ---------- */
  // Peeks in at the bottom-left once you scroll past the first screen.
  // Clicking it opens a video player.
  peek: {
    image: "assets/images/chowder and panini 1.png", // a transparent PNG looks best. Set to "" for the 🐱 🐰 placeholder.
    alt: "Chowder and Panini",
    bubble: "Psst… click us!",
    video: "assets/video/chowder-panini.mp4", // put your video here (mp4 plays everywhere)
    title: "Chowder & Panini",
  },
};
