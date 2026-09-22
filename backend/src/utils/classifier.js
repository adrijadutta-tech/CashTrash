// Stands in for a real image-classification model.
//
// There's no trained model wired up yet, so this picks a result from a
// fixed table of waste categories. It's deterministic per image (hashes
// the uploaded bytes) so scanning the same photo twice gives the same
// answer instead of a random one each time — closer to how the real
// model will behave once it's plugged in here.
//
// To swap in a real model later: replace the body of classifyImage()
// with a call to your model/API, but keep the same return shape.

const crypto = require('crypto');

const CATALOG = [
  { itemName: 'Plastic bottle', category: 'plastic', bin: 'Blue Bin — Recyclables', points: 15, disposalNote: 'Rinse before disposing. Cap can stay on.' },
  { itemName: 'Yogurt tub', category: 'plastic', bin: 'Blue Bin — Recyclables', points: 12, disposalNote: 'Rinse out any residue before disposing.' },
  { itemName: 'Cardboard box', category: 'paper', bin: 'Green Bin — Paper & Card', points: 10, disposalNote: 'Flatten before placing in the bin.' },
  { itemName: 'Newspaper stack', category: 'paper', bin: 'Green Bin — Paper & Card', points: 10, disposalNote: 'Keep dry and bundled if possible.' },
  { itemName: 'Glass jar', category: 'glass', bin: 'Blue Bin — Recyclables', points: 15, disposalNote: 'Remove the lid and rinse before disposing.' },
  { itemName: 'Aluminium can', category: 'metal', bin: 'Blue Bin — Recyclables', points: 15, disposalNote: 'Rinse out and crush if you can.' },
  { itemName: 'Vegetable peels', category: 'organic', bin: 'Brown Bin — Organic', points: 8, disposalNote: 'Fine to compost — no packaging included.' },
  { itemName: 'Old phone charger', category: 'ewaste', bin: 'E-waste — Collection point', points: 25, disposalNote: 'Do not put in household bins — take to a collection point.' },
  { itemName: 'Used battery', category: 'ewaste', bin: 'E-waste — Collection point', points: 20, disposalNote: 'Never dispose of batteries in general waste.' }
];

function classifyImage(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest();
  const index = hash[0] % CATALOG.length;
  const match = CATALOG[index];

  // Derive a stable-but-varied confidence (88–99%) from the hash too
  const confidence = 88 + (hash[1] % 12);

  return { ...match, confidence };
}

module.exports = { classifyImage, CATALOG };
