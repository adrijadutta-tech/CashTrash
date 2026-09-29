// Waste category reference data — the bin, points, disposal note, display
// label, and whether the material is recyclable, for each of the seven
// categories the app recognizes.
//
// Design: plastic/paper/glass/metal/organic/ewaste are all trained on
// CLEAN, CLEARLY-RECYCLABLE (or clearly-compostable/special-handling)
// examples only — e.g. "plastic" means bottles/jugs/tubs, not wrappers
// or styrofoam. Anything that doesn't look like a good example of one
// of those falls to "trash" — a catch-all for general, non-recyclable
// waste (chip bags, styrofoam, greasy/soiled paper, broken ceramics,
// mixed-material packaging, etc.).
//
// This keeps the model simple to train (one extra class, not six
// recyclable/non-recyclable pairs) while still answering "is this
// recyclable?" correctly for the common case.
//
// classifyImageMock() is kept below for local testing ONLY — useful if
// you want to hit POST /api/scans without the frontend's ML model loaded
// yet. The real app should always send a real predicted category.

const crypto = require('crypto');

const CATEGORY_INFO = {
  plastic: {
    label: 'Plastic',
    bin: 'Blue Bin — Recyclables',
    recyclable: true,
    points: 15,
    disposalNote: 'Recyclable — rinse it out and drop it at your nearest recycling center.'
  },
  paper: {
    label: 'Paper',
    bin: 'Green Bin — Paper & Card',
    recyclable: true,
    points: 10,
    disposalNote: 'Recyclable — flatten or bundle it and take it to your nearest recycling center.'
  },
  glass: {
    label: 'Glass',
    bin: 'Blue Bin — Recyclables',
    recyclable: true,
    points: 15,
    disposalNote: 'Recyclable — remove the lid, rinse it, and drop it at your nearest recycling center.'
  },
  metal: {
    label: 'Metal',
    bin: 'Blue Bin — Recyclables',
    recyclable: true,
    points: 15,
    disposalNote: 'Recyclable — rinse it out (crush if you can) and take it to your nearest recycling center.'
  },
  organic: {
    label: 'Organic',
    bin: 'Brown Bin — Organic',
    recyclable: false,
    points: 8,
    disposalNote: 'Not recyclable — compostable instead. Put it in your organic/compost bin, not the recycling center.'
  },
  ewaste: {
    label: 'E-waste',
    bin: 'E-waste — Collection point',
    recyclable: true,
    points: 25,
    disposalNote: 'Recyclable, but NOT in a regular bin — take it to a dedicated e-waste collection point.'
  },
  trash: {
    label: 'General Waste',
    bin: 'Black Bin — General Waste',
    recyclable: false,
    points: 5,
    disposalNote: 'Not recyclable — this doesn\u2019t match any of our recyclable, compostable, or e-waste categories, so it goes in your regular household trash.'
  }
};

const CATEGORIES = Object.keys(CATEGORY_INFO);

// Returns { category, label, bin, recyclable, points, disposalNote } for
// a known category, or null if the category isn't one the app recognizes.
function getCategoryInfo(category) {
  const info = CATEGORY_INFO[category];
  if (!info) return null;
  return { category, ...info };
}

// TESTING ONLY — picks a category from the photo's byte hash, the same
// way the old fully-mocked classifier worked. Not used by the real
// scan flow once the frontend's ML model is wired up.
function classifyImageMock(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest();
  const category = CATEGORIES[hash[0] % CATEGORIES.length];
  const confidence = 88 + (hash[1] % 12);
  return { ...getCategoryInfo(category), confidence };
}

module.exports = { CATEGORY_INFO, CATEGORIES, getCategoryInfo, classifyImageMock };
