// @ts-nocheck
// snug's closet: every piece the shop sells, and how its details are painted onto the pixel art.
//
// A piece is one kind of clothing Jev can call for (tee, coat, umbrella...), with its own name, colours and details.
// The engine draws the kind's basic shape; applyFx() then paints the details (patterns, trims, little motifs) over
// whichever part of the shape they belong to, in both the character sprite and the shop's item icons.

export const COLORS = {
  white: ['#f4f2ee', '#d8d4cc', '#ffffff'], cream: ['#efe6d6', '#d6cab5', '#faf5ec'], butter: ['#f6e3a1', '#dcc57d', '#fbefc4'],
  yellow: ['#e8b93a', '#c79a22', '#f2cf6a'], orange: ['#e07a2c', '#bd6220', '#ee9a55'], peach: ['#f2b49a', '#d6937a', '#f8ccb8'],
  pink: ['#f2c4cf', '#dba5b2', '#f9dbe2'], rose: ['#d9687f', '#b84f65', '#e88b9d'], red: ['#c4453a', '#9c3329', '#dc6a5f'],
  burgundy: ['#7e2e3a', '#5f1f29', '#9a4552'], lavender: ['#c8b6e2', '#ab98c9', '#dccdef'], purple: ['#7b5ea7', '#5f4689', '#957bc0'],
  sky: ['#a9c4e6', '#8aa8cd', '#c6daf2'], denim: ['#4a6a9a', '#36507a', '#6a8ab8'], navy: ['#2f4166', '#223050', '#465a85'],
  teal: ['#2aa39a', '#1f827b', '#4cc2b9'], mint: ['#a8dcc4', '#86bea6', '#c4ebd8'], sage: ['#a3b597', '#869a7a', '#bfceb3'],
  green: ['#4f8a4a', '#3b6d37', '#6aa864'], olive: ['#7a7a52', '#5f5f3e', '#96966c'], tan: ['#c29a6b', '#a07c52', '#d6b58c'],
  brown: ['#6b4a33', '#523624', '#8a6447'], grey: ['#8c8f98', '#6f727a', '#a9acb4'], charcoal: ['#3e4048', '#2c2e34', '#555863'],
  black: ['#1f1f22', '#141416', '#34343a'],
  // the thrift store's colours (washed, sun-faded, a little off)
  matcha: ['#9fb86b', '#7f9a52', '#bad08a'], cocoa: ['#8a5a44', '#6e4535', '#a7735a'], washed: ['#4a4a50', '#38383d', '#606068'],
  cherry: ['#b8283a', '#8f1c2c', '#d64a5a'], baby: ['#bcd8f2', '#9dbde0', '#d6e8f8'], coral: ['#f0806a', '#d06450', '#f7a08e'],
  lilac: ['#b9a4dc', '#9a85bf', '#d2c2ea'], ivory: ['#f6f0e0', '#ded5bf', '#fffbf0'], rust: ['#b85a2e', '#954521', '#d07a4c'],
  // the boutique's colours (soft, rich, a little gold)
  blush: ['#f3c9c9', '#dfaaa9', '#fbe0de'], pearl: ['#f6f1e7', '#ddd5c4', '#ffffff'], champagne: ['#ead8b6', '#d2bd96', '#f6ead2'],
  camel: ['#c49a6c', '#a57d52', '#d9b88f'], mocha: ['#7b5a48', '#614536', '#97735f'], gold: ['#d9b45a', '#b8923e', '#ecd08a'],
  bronze: ['#b07a45', '#8a5a2e', '#d29a62'], silver: ['#c3c8d0', '#9aa0aa', '#e6e9ee'], tortoise: ['#7a4a26', '#4f2e16', '#b07a3a'], chrome: ['#d6dbe2', '#8f97a3', '#ffffff'],
};
const INK = '#1c1a28';
const IRI = [['#f7c6e3', '#e2a3c9'], ['#c6e6f7', '#a3c6e2'], ['#d2f2cf', '#a9d4a5'], ['#e3d2f7', '#c1abe2'], ['#f8e3c2', '#dfc29a']];
const TIEDYE = ['#f2a6c4', '#f6d36b', '#8fd3c4', '#a9b8f2', '#f2b49a'];

// little chest pictures: a = the piece's accent colour, d = accent shade, w = white, k = ink, g = leaf green, y = yellow
export const MOTIFS = {
  heart: [' a a ', 'aaaaa', 'aaaaa', ' aaa ', '  a  '],
  star: ['  y  ', 'yyyyy', ' yyy ', ' y y '],
  smiley: [' yyy ', 'ykyky', 'yyyyy', 'ykkky', ' yyy '],
  cherry: ['   g ', '  gg ', ' g  g', 'aa aa', 'aa aa'],
  flower: [' a a ', 'aayaa', ' a a ', '  g  '],
  frog: ['wk wk', 'ggggg', 'gkkkg', ' ggg '],
  bolt: ['  yy', ' yy ', 'yyyy', ' yy ', 'yy  '],
  moon: [' yy ', 'yy  ', 'yy  ', ' yy '],
  letter: ['aaa', 'a  ', 'aaa', '  a', 'aaa'],
  flame: ['  y  ', ' yay ', 'yaaay', 'yaaay', ' aaa '],
  butterfly: ['a   a', 'aa aa', ' aka ', 'aa aa', 'a   a'],
  mushroom: [' aaa ', 'awaaw', 'aaaaa', '  w  ', '  w  '],
  bow: ['aa aa', 'aaaaa', 'aa aa', ' a a '],
  mountain: ['  w  ', ' aaa ', 'aaaaa'],
  snowflake: ['w w w', ' www ', 'wwwww', ' www ', 'w w w'],
  eightball: [' kkk ', 'kwwwk', 'kwkwk', 'kwwwk', ' kkk '],
  sun: ['y y y', ' yyy ', 'yyyyy', ' yyy ', 'y y y'],
  checker: ['kwkwk', 'wkwkw', 'kwkwk'],
  wave: ['   a ', ' aaaa', 'aa ww', 'wwwww'],
  palm: ['gg gg', ' ggg ', '  a  ', '  a  ', ' aaa '],
};

// tags people can filter the racks by
export const TAGS = ['cute', 'cozy', 'classic', 'sporty', 'street', 'preppy', 'beachy', 'bold', 'luxe'];

// [id, kind, name, base colour, accent colour, details, tags]
const L = [
  // tanks
  ['rib-tank', 'tank', 'ribbed tank', 'white', null, ['ribs'], ['classic']],
  ['stripe-tank', 'tank', 'striped tank', 'white', 'navy', ['stripes'], ['beachy']],
  ['cherry-tank', 'tank', 'cherry tank', 'cream', 'red', ['motif:cherry'], ['cute']],
  ['train-tank', 'tank', 'training tank', 'red', 'white', ['sidestripe'], ['sporty']],
  ['tiedye-tank', 'tank', 'tie-dye tank', 'pink', null, ['tiedye'], ['bold', 'beachy']],
  ['bolt-tank', 'tank', 'graphic tank', 'black', 'yellow', ['motif:bolt'], ['street']],
  // tees
  ['tee', 'tee', 'classic tee', 'white', null, [], ['classic']],
  ['heart-tee', 'tee', 'heart tee', 'cream', 'red', ['motif:heart'], ['cute']],
  ['smiley-tee', 'tee', 'smiley tee', 'sky', 'yellow', ['motif:smiley'], ['cute', 'bold']],
  ['frog-tee', 'tee', 'frog tee', 'mint', 'green', ['motif:frog'], ['cute']],
  ['star-tee', 'tee', 'star tee', 'navy', 'yellow', ['motif:star'], ['cute', 'street']],
  ['flower-tee', 'tee', 'flower tee', 'lavender', 'rose', ['motif:flower'], ['cute']],
  ['bolt-tee', 'tee', 'graphic tee', 'black', 'yellow', ['motif:bolt'], ['street']],
  ['ringer-tee', 'tee', 'ringer tee', 'white', 'red', ['ringer'], ['classic']],
  ['breton-tee', 'tee', 'breton tee', 'white', 'navy', ['stripes'], ['classic', 'beachy']],
  ['polo', 'tee', 'polo', 'navy', 'white', ['collar', 'placket'], ['preppy']],
  ['baseball-tee', 'tee', 'baseball tee', 'white', 'navy', ['raglan'], ['sporty']],
  ['tiedye-tee', 'tee', 'tie-dye tee', 'sky', null, ['tiedye'], ['bold', 'beachy']],
  ['perf-tee', 'tee', 'performance tee', 'grey', 'teal', ['armstripe'], ['sporty']],
  ['pocket-tee', 'tee', 'pocket tee', 'olive', null, ['chestpocket'], ['classic']],
  // long sleeves
  ['long', 'long', 'long sleeve', 'navy', null, [], ['classic']],
  ['flannel', 'long', 'flannel', 'red', 'black', ['plaid'], ['cozy', 'classic']],
  ['oxford', 'long', 'oxford shirt', 'sky', 'white', ['collar', 'buttons'], ['preppy']],
  ['rugby', 'long', 'rugby shirt', 'navy', 'yellow', ['rugby', 'collar'], ['preppy', 'sporty']],
  ['track-top', 'long', 'track top', 'black', 'white', ['zip', 'armstripe'], ['sporty', 'street']],
  ['turtleneck', 'long', 'turtleneck', 'black', null, ['turtleneck'], ['classic']],
  ['stripe-long', 'long', 'striped long sleeve', 'cream', 'red', ['stripes'], ['cute']],
  ['raglan-long', 'long', 'raglan', 'grey', 'black', ['raglan'], ['sporty']],
  ['heart-long', 'long', 'heart long sleeve', 'pink', 'red', ['motif:heart'], ['cute']],
  ['linen-shirt', 'long', 'linen shirt', 'cream', null, ['linen', 'collar', 'buttons'], ['classic', 'beachy']],
  // sweaters
  ['crewneck', 'sweater', 'crewneck', 'grey', null, [], ['classic']],
  ['cable', 'sweater', 'cable knit', 'cream', null, ['cable'], ['cozy', 'preppy']],
  ['qzip', 'sweater', 'quarter-zip', 'navy', 'white', ['halfzip'], ['preppy', 'sporty']],
  ['cardigan', 'sweater', 'cardigan', 'sage', 'cream', ['buttons', 'knit'], ['cozy', 'cute']],
  ['fairisle', 'sweater', 'fair isle', 'cream', 'red', ['fairisle'], ['cozy']],
  ['chunky', 'sweater', 'chunky knit', 'tan', null, ['knit'], ['cozy']],
  ['fuzzy', 'sweater', 'fuzzy sweater', 'lavender', null, ['fuzzy'], ['cute', 'cozy']],
  ['heart-sweater', 'sweater', 'heart sweater', 'red', 'pink', ['motif:heart'], ['cute']],
  ['argyle', 'sweater', 'argyle', 'navy', 'yellow', ['argyle'], ['preppy']],
  // light jackets
  ['denim-jacket', 'light', 'denim jacket', 'denim', null, ['flaps', 'seams'], ['classic']],
  ['bomber', 'light', 'bomber', 'olive', 'orange', ['closed', 'zip', 'cuffs'], ['street']],
  ['windbreaker', 'light', 'windbreaker', 'teal', 'purple', ['closed', 'block', 'zip'], ['sporty', 'bold']],
  ['varsity', 'light', 'varsity jacket', 'red', 'cream', ['raglan', 'letter', 'cuffs'], ['preppy', 'street']],
  ['blazer', 'light', 'blazer', 'navy', 'yellow', ['lapels', 'goldbuttons'], ['preppy']],
  ['leather', 'light', 'leather jacket', 'black', 'grey', ['lapels', 'zipdiag'], ['street']],
  ['chore', 'light', 'chore jacket', 'tan', null, ['lowpockets'], ['classic']],
  ['corduroy', 'light', 'corduroy jacket', 'brown', null, ['ribs'], ['cozy']],
  ['fleece', 'light', 'fleece zip', 'cream', null, ['closed', 'zip', 'fuzzy'], ['cozy']],
  ['track-jacket', 'light', 'track jacket', 'navy', 'white', ['closed', 'zip', 'armstripe'], ['sporty']],
  // hoodies
  ['hoodie', 'hoodie', 'hoodie', 'grey', null, [], ['classic']],
  ['zip-hoodie', 'hoodie', 'zip hoodie', 'navy', 'white', ['zip'], ['sporty']],
  ['bolt-hoodie', 'hoodie', 'graphic hoodie', 'black', 'yellow', ['motif:bolt'], ['street']],
  ['smiley-hoodie', 'hoodie', 'smiley hoodie', 'butter', 'yellow', ['motif:smiley'], ['cute']],
  ['block-hoodie', 'hoodie', 'two-tone hoodie', 'pink', 'lavender', ['block'], ['bold', 'cute']],
  ['fleece-hoodie', 'hoodie', 'fleece hoodie', 'cream', null, ['fuzzy'], ['cozy']],
  ['heart-hoodie', 'hoodie', 'heart hoodie', 'lavender', 'rose', ['motif:heart'], ['cute']],
  ['tiedye-hoodie', 'hoodie', 'tie-dye hoodie', 'pink', null, ['tiedye'], ['bold']],
  // winter coats
  ['puffer', 'coat', 'puffer', 'black', null, ['quilt'], ['street', 'sporty']],
  ['pastel-puffer', 'coat', 'pastel puffer', 'lavender', null, ['quilt'], ['cute']],
  ['parka', 'coat', 'parka', 'olive', 'cream', ['fur', 'toggles'], ['classic']],
  ['trench', 'coat', 'trench coat', 'tan', null, ['belt', 'double'], ['classic', 'preppy']],
  ['peacoat', 'coat', 'peacoat', 'navy', 'yellow', ['double', 'lapels'], ['preppy']],
  ['teddy', 'coat', 'teddy coat', 'cream', null, ['fuzzy'], ['cozy', 'cute']],
  ['duffle', 'coat', 'duffle coat', 'red', 'cream', ['toggles'], ['cute', 'classic']],
  ['camel', 'coat', 'camel overcoat', 'tan', null, ['lapels'], ['preppy']],
  ['check-coat', 'coat', 'check coat', 'grey', 'black', ['check'], ['classic']],
  // rain
  ['raincoat', 'rain', 'raincoat', 'yellow', 'cream', ['toggles'], ['classic', 'cute']],
  ['rain-shell', 'rain', 'rain shell', 'navy', null, ['zip'], ['sporty']],
  ['dot-raincoat', 'rain', 'polka-dot raincoat', 'red', 'white', ['dots'], ['cute']],
  ['frog-raincoat', 'rain', 'frog raincoat', 'green', 'green', ['motif:frog'], ['cute']],
  ['waxed', 'rain', 'waxed jacket', 'olive', 'brown', ['collar', 'flaps'], ['classic']],
  ['lilac-rain', 'rain', 'lilac raincoat', 'lavender', null, ['zip'], ['cute']],
  // shorts (and skirts for shorts days)
  ['cutoffs', 'shorts', 'denim cutoffs', 'denim', 'white', ['frayed'], ['classic', 'beachy']],
  ['chino-shorts', 'shorts', 'chino shorts', 'tan', null, ['cuffs'], ['preppy']],
  ['linen-shorts', 'shorts', 'linen shorts', 'sage', null, ['linen'], ['beachy', 'classic']],
  ['cargo-shorts', 'shorts', 'cargo shorts', 'olive', null, ['pockets'], ['street']],
  ['run-shorts', 'shorts', 'running shorts', 'black', 'white', ['sidestripe'], ['sporty']],
  ['plaid-shorts', 'shorts', 'plaid shorts', 'navy', 'green', ['plaid'], ['preppy']],
  ['board-shorts', 'shorts', 'board shorts', 'teal', null, ['tiedye'], ['beachy']],
  ['pleat-skirt', 'shorts', 'pleated skirt', 'navy', null, ['skirt', 'pleats'], ['preppy', 'cute']],
  ['denim-skirt', 'shorts', 'denim skirt', 'denim', null, ['skirt'], ['classic']],
  ['tennis-skirt', 'shorts', 'tennis skirt', 'white', null, ['skirt', 'pleats'], ['sporty']],
  // pants (and skirts with tights for pants days)
  ['jeans', 'pants', 'jeans', 'denim', null, ['pockets'], ['classic']],
  ['wide-jeans', 'pants', 'wide-leg jeans', 'sky', null, ['wide'], ['street', 'cute']],
  ['black-jeans', 'pants', 'black jeans', 'black', null, ['pockets', 'cuffs'], ['street']],
  ['chinos', 'pants', 'chinos', 'tan', null, ['crease'], ['preppy']],
  ['linen-pants', 'pants', 'linen pants', 'cream', null, ['linen', 'wide'], ['beachy', 'classic']],
  ['joggers', 'pants', 'joggers', 'grey', null, ['cuffs'], ['sporty', 'cozy']],
  ['cargo', 'pants', 'cargo pants', 'olive', null, ['cargo'], ['street']],
  ['cords', 'pants', 'cords', 'brown', null, ['ribs'], ['cozy']],
  ['plaid-pants', 'pants', 'plaid trousers', 'grey', 'black', ['plaid'], ['preppy']],
  ['track-pants', 'pants', 'track pants', 'navy', 'white', ['sidestripe'], ['sporty']],
  ['plaid-skirt', 'pants', 'plaid skirt & tights', 'red', 'black', ['skirt', 'plaid'], ['cute', 'preppy']],
  ['cord-skirt', 'pants', 'cord skirt & tights', 'brown', null, ['skirt', 'ribs'], ['cozy']],
  // shoes
  ['sneakers', 'shoe', 'sneakers', 'white', null, [], ['classic']],
  ['hightops', 'shoe', 'high-tops', 'red', 'white', ['hightop'], ['street']],
  ['runners', 'shoe', 'running shoes', 'grey', 'orange', ['swoosh'], ['sporty']],
  ['loafers', 'shoe', 'loafers', 'brown', null, ['flat'], ['preppy']],
  ['boots', 'shoe', 'boots', 'tan', null, ['boot'], ['classic', 'cozy']],
  ['rainboots', 'shoe', 'rain boots', 'yellow', null, ['boot'], ['cute']],
  ['chunky-kicks', 'shoe', 'chunky sneakers', 'cream', null, ['chunky'], ['street']],
  ['maryjanes', 'shoe', 'mary janes', 'black', null, ['flat', 'strap'], ['cute']],
  ['checker-slipons', 'shoe', 'checker slip-ons', 'black', 'white', ['check'], ['street', 'beachy']],
  // beanies
  ['beanie', 'beanie', 'beanie', 'grey', null, [], ['classic']],
  ['pom-beanie', 'beanie', 'pom beanie', 'red', 'white', ['pom'], ['cute', 'cozy']],
  ['stripe-beanie', 'beanie', 'striped beanie', 'navy', 'yellow', ['stripes'], ['sporty']],
  ['bear-beanie', 'beanie', 'bear beanie', 'brown', 'tan', ['ears'], ['cute']],
  ['frog-beanie', 'beanie', 'frog beanie', 'green', null, ['frogeyes'], ['cute']],
  ['short-beanie', 'beanie', 'fisherman beanie', 'orange', null, ['short'], ['street']],
  // scarves
  ['scarf', 'scarf', 'knit scarf', 'red', null, [], ['classic']],
  ['stripe-scarf', 'scarf', 'striped scarf', 'cream', 'red', ['stripes'], ['cozy']],
  ['plaid-scarf', 'scarf', 'plaid scarf', 'tan', 'red', ['plaid'], ['preppy']],
  ['dot-scarf', 'scarf', 'dotted scarf', 'pink', 'white', ['dots'], ['cute']],
  // sunglasses
  ['shades', 'sunglasses', 'shades', 'black', null, [], ['classic']],
  ['heart-shades', 'sunglasses', 'heart shades', 'rose', null, ['heart'], ['cute']],
  ['round-shades', 'sunglasses', 'round shades', 'brown', null, ['round'], ['classic']],
  ['sport-shades', 'sunglasses', 'sport shades', 'black', 'orange', ['sport'], ['sporty']],
  ['star-shades', 'sunglasses', 'star shades', 'yellow', null, ['star'], ['bold', 'cute']],
  // umbrellas
  ['umbrella', 'umbrella', 'umbrella', 'navy', null, [], ['classic']],
  ['dot-umbrella', 'umbrella', 'polka-dot umbrella', 'red', 'white', ['dots'], ['cute']],
  ['stripe-umbrella', 'umbrella', 'striped umbrella', 'yellow', 'white', ['stripes'], ['beachy']],
  ['frog-umbrella', 'umbrella', 'frog umbrella', 'green', null, ['frogeyes'], ['cute']],
  ['bubble-umbrella', 'umbrella', 'bubble umbrella', 'sky', null, ['clear'], ['classic']],
];
// everyday colours each kind comes in (the shop's colour cards swipe through these, starting with the piece's own)
const COMMON = {
  tank: ['white', 'black', 'grey', 'navy', 'olive'], tee: ['white', 'black', 'grey', 'navy', 'cream', 'olive'],
  long: ['white', 'black', 'grey', 'navy', 'cream', 'olive'], sweater: ['cream', 'grey', 'navy', 'tan', 'green', 'burgundy'],
  light: ['denim', 'olive', 'black', 'tan', 'navy', 'brown'], hoodie: ['grey', 'black', 'navy', 'cream', 'olive', 'burgundy'],
  coat: ['black', 'navy', 'tan', 'olive', 'grey', 'cream'], rain: ['yellow', 'navy', 'olive', 'black', 'red', 'sage'],
  shorts: ['tan', 'denim', 'olive', 'black', 'navy', 'grey'], pants: ['denim', 'black', 'tan', 'grey', 'olive', 'navy'],
  shoe: ['white', 'black', 'grey', 'tan', 'brown', 'navy'], beanie: ['grey', 'black', 'navy', 'cream', 'red', 'olive'],
  scarf: ['grey', 'red', 'navy', 'cream', 'tan', 'green'], sunglasses: ['black', 'brown', 'tan', 'navy'],
  umbrella: ['navy', 'black', 'red', 'yellow', 'green', 'sky'],
};
// pieces that live in the girls department (the guys department leaves them out; everything else is for everyone)
const GIRLS = new Set(['pleat-skirt', 'denim-skirt', 'tennis-skirt', 'plaid-skirt', 'cord-skirt', 'maryjanes']);

export const ITEMS = L.map(([id, kind, name, base, acc, fx, tags]) => ({
  id, kind, name, base, acc, fx, tags, dept: GIRLS.has(id) ? 'girls' : 'all',
  colors: [base, ...(COMMON[kind] || []).filter(c => c !== base && c !== acc)].slice(0, 6),
}));
// every piece by id; a thrift or boutique id (thrift-..., maison-...) is made up from the id itself, so a piece from
// any week's drop still works long after the drop has moved on
export const ITEM = new Proxy(Object.fromEntries(ITEMS.map(it => [it.id, it])), {
  get(t, k) { if (typeof k === 'string' && !(k in t)) { const it = k.startsWith('thrift-') ? thriftItem(k) : k.startsWith('maison-') ? CAPSULE_ITEMS.find(c => c.id === k) ?? maisonItem(k) : null; if (it) t[k] = it; } return t[k]; },
});
export const has = (it, f) => !!it && it.fx.includes(f);

/**
 * Paint a piece's details over its drawn shape.
 * P(x,y,c) sets a pixel; R describes where the piece is: all/body/arms masks, its bounds, the chest point for a
 * motif, the hem row, the front-centre column. col and acc are [base, shade, light] colours.
 */
export function applyFx(P, it, R, col, acc) {
  if (!it) return;
  const A = acc || [col[1], col[1], col[2]];
  const each = (m, fn) => { if (!m) return; for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) if (m(x, y)) fn(x, y); };
  const all = R.all, body = R.body || all, arms = R.arms;
  for (const f of it.fx) {
    if (f === 'closed' && R.front) each(R.front, (x, y) => P(x, y, col[0]));
    else if (f === 'stripes') each(all, (x, y) => { if ((y - R.y0) % 3 === 2) P(x, y, A[0]); });
    // the boutique's finishes: iridescent bands, scattered sequins, a metallic shine
    else if (f === 'holo') each(all, (x, y) => { const b = ((x + y) >> 1) % 5; P(x, y, (y - R.y0) % 3 === 2 ? IRI[b][1] : IRI[b][0]); });
    else if (f === 'sequin') each(all, (x, y) => { if ((x * 7 + y * 13) % 9 === 0) P(x, y, '#ffffff'); else if ((x * 5 + y * 11) % 7 === 0) P(x, y, col[2]); });
    else if (f === 'metallic') each(all, (x, y) => { const d = (x + y) % 8; if (d === 0) P(x, y, '#ffffff'); else if (d <= 2) P(x, y, col[2]); });
    else if (f === 'rugby') each(body, (x, y) => { if (((y - R.y0) >> 1) % 2 === 1) P(x, y, A[0]); });
    else if (f === 'check') each(all, (x, y) => { if (((x + y) & 1) === 0 && ((x >> 1) + (y >> 1)) % 2 === 0) P(x, y, A[0]); });
    else if (f === 'plaid') each(all, (x, y) => { const a = (x - R.x0) % 4 === 0, b = (y - R.y0) % 4 === 0; if (a && b) P(x, y, A[1]); else if (a || b) P(x, y, A[0]); });
    else if (f === 'dots') each(all, (x, y) => { if (y % 3 === 0 && (x + (y % 6 ? 0 : 2)) % 4 === 0) P(x, y, A[0]); });
    else if (f === 'tiedye') each(all, (x, y) => { const t = Math.sin(x * 0.55 + y * 0.35) + Math.cos(y * 0.5 - x * 0.25); P(x, y, TIEDYE[Math.floor((t + 2) * 1.25) % TIEDYE.length]); });
    else if (f === 'block') { const cut = R.y0 + Math.round((R.hem - R.y0) * 0.42); each(all, (x, y) => { if (y <= cut) P(x, y, A[0]); else if (y === cut + 1) P(x, y, '#f2cf6a'); }); }
    else if (f === 'raglan') each(arms, (x, y) => P(x, y, A[0]));
    else if (f === 'armstripe') each(arms, (x, y) => { if (x === R.armX[0] || x === R.armX[1]) P(x, y, A[0]); });
    else if (f === 'sidestripe') each(all, (x, y) => { if (x === R.sideX[0] || x === R.sideX[1]) P(x, y, A[0]); });
    else if (f === 'ringer') { each(arms, (x, y) => { if (y >= R.cuffY) P(x, y, A[0]); }); R.neck.forEach(([x, y]) => P(x, y, A[0])); }
    else if (f === 'collar' || f === 'turtleneck') R[f === 'collar' ? 'collar' : 'turtle'].forEach(([x, y]) => P(x, y, f === 'collar' && it.acc ? A[0] : col[1]));
    else if (f === 'placket' || f === 'buttons' || f === 'goldbuttons') for (let y = R.chest[1] - 1; y <= (f === 'placket' ? R.chest[1] + 1 : R.hem - 1); y += 2) P(R.cx, y, f === 'goldbuttons' ? '#d9b45a' : f === 'placket' ? col[1] : A[2]);
    else if (f === 'zip') each(body, (x, y) => { if (x === R.cx) P(x, y, '#d8d4cc'); });
    else if (f === 'halfzip') for (let y = R.y0; y <= R.chest[1] + 1; y++) P(R.cx, y, '#d8d4cc');
    else if (f === 'zipdiag') for (let i = 0; i < R.hem - R.chest[1]; i++) P(R.cx + 2 - Math.round(i * 0.3), R.chest[1] - 2 + i, '#c9c2b4');
    else if (f === 'double') for (let y = R.chest[1]; y <= R.hem - 2; y += 3) { P(R.cx - 2, y, '#e2c28a'); P(R.cx + 2, y, '#e2c28a'); }
    else if (f === 'toggles') for (let y = R.chest[1]; y <= R.hem - 2; y += 3) { P(R.cx - 1, y, A[0]); P(R.cx, y, A[0]); P(R.cx + 1, y, A[0]); }
    else if (f === 'belt') { for (let x = R.x0; x <= R.x1; x++) if (body(x, R.waist)) { P(x, R.waist, col[1]); P(x, R.waist + 1, col[1]); } }
    else if (f === 'lapels') R.lapels.forEach(([x, y]) => P(x, y, A === acc ? col[2] : col[2]));
    else if (f === 'quilt') each(all, (x, y) => { if ((y - R.y0) % 3 === 2) P(x, y, col[1]); });
    else if (f === 'fuzzy') each(all, (x, y) => { const r = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; const v = r - Math.floor(r); if (v < 0.22) P(x, y, col[2]); else if (v > 0.86) P(x, y, col[1]); });
    else if (f === 'ribs') each(all, (x, y) => { if ((x - R.x0) % 2 === 1) P(x, y, col[1]); });
    else if (f === 'knit') each(body, (x, y) => { if ((y - R.y0) % 2 === 0 && (x + (y % 4 ? 1 : 0)) % 2 === 0) P(x, y, col[1]); });
    else if (f === 'cable') each(body, (x, y) => { const c1 = R.cx - 3 + (y % 2), c2 = R.cx + 3 - (y % 2); if (x === c1 || x === c2) P(x, y, col[1]); });
    else if (f === 'argyle') each(body, (x, y) => { const u = (x - R.cx + 40) % 6, v = (y - R.y0) % 6; if (Math.abs(u - 3) + Math.abs(v - 3) === 3) P(x, y, A[0]); });
    else if (f === 'fairisle') { const y0 = R.chest[1] - 2; each(all, (x, y) => { if (y === y0 || y === y0 + 4) P(x, y, A[0]); else if (y > y0 && y < y0 + 4 && (x + y) % 2 === 0) P(x, y, A[0]); }); }
    else if (f === 'fur') R.fur.forEach(([x, y], i) => P(x, y, i % 2 ? '#e8dcc6' : '#f6efe2'));
    else if (f === 'flaps' || f === 'chestpocket') { const [x, y] = R.chest; P(x - 3, y, col[1]); P(x - 2, y, col[1]); if (f === 'flaps') { P(x + 2, y, col[1]); P(x + 3, y, col[1]); } else P(x - 3, y + 1, col[1]); }
    else if (f === 'lowpockets') { const y = R.hem - 3; [R.cx - 4, R.cx - 3, R.cx + 3, R.cx + 4].forEach(x => { P(x, y, col[1]); P(x, y + 1, col[1]); }); }
    else if (f === 'seams') for (let y = R.chest[1] + 2; y < R.hem; y += 3) { P(R.cx - 3, y, col[2]); P(R.cx + 3, y, col[2]); }
    else if (f === 'cuffs') each(all, (x, y) => { if (y >= R.hem - 1) P(x, y, A[0]); });
    else if (f === 'pockets') R.pockets.forEach(([x, y]) => P(x, y, col[1]));
    else if (f === 'frayed') each(all, (x, y) => { if (y === R.hem && x % 2 === 0) P(x, y, '#f4f2ee'); });
    else if (f === 'linen') each(all, (x, y) => { const r = Math.sin(x * 3.1 + y * 17.7) * 9137.13; if (y % 2 === 0 && r - Math.floor(r) < 0.4) P(x, y, col[2]); });
    else if (f === 'crease' && R.legs) R.legs[0].forEach(c => { for (let y = R.thighY; y <= R.hem; y++) if (all(c, y)) P(c, y, col[1]); });
    else if (f === 'cargo' && R.legs) R.legs[0].forEach((c, i) => { const x = i ? c + 1 : c - 2; for (let y = R.thighY; y < R.thighY + 3; y++) for (let dx = 0; dx < 2; dx++) if (all(x + dx, y)) P(x + dx, y, col[1]); });
    else if (f === 'pleats') each(all, (x, y) => { if ((x - R.x0) % 3 === 0 && y > R.y0 + 1) P(x, y, col[1]); });
    else if (f === 'letter') draw(P, MOTIFS.letter, R.chest[0] - 4, R.chest[1] - 2, A, col);
    else if (f.startsWith('motif:')) { const m = MOTIFS[f.slice(6)]; draw(P, m, R.chest[0] - Math.floor(m[0].length / 2), R.chest[1] - Math.floor(m.length / 2), A, col); }
  }
}

function draw(P, rows, x0, y0, A, col) {
  const C = { a: A[0], d: A[1], w: '#ffffff', k: INK, g: '#5fa858', y: '#f2cf3a' };
  rows.forEach((row, j) => [...row].forEach((ch, i) => { if (C[ch]) P(x0 + i, y0 + j, C[ch]); }));
}

// Quick styles: a whole closet in one tap, for anyone who doesn't want to shop piece by piece. Each lists pieces per
// kind (snug rotates through them day to day); `girls` adds pieces for girls (skirts, mary janes) on top.
const KIT_LIST = {
  classic: { label: 'classic', items: { tank: ['rib-tank'], tee: ['tee', 'pocket-tee'], long: ['long', 'oxford', 'linen-shirt'], sweater: ['crewneck'], light: ['denim-jacket', 'chore'], hoodie: ['hoodie'], coat: ['parka', 'puffer'], rain: ['raincoat'], shorts: ['chino-shorts', 'cutoffs'], pants: ['jeans', 'chinos'], shoe: ['sneakers'], beanie: ['beanie'], scarf: ['scarf'], sunglasses: ['shades'], umbrella: ['umbrella'] }, girls: { shorts: ['denim-skirt'] } },
  preppy: { label: 'preppy', items: { tank: ['stripe-tank'], tee: ['polo', 'ringer-tee'], long: ['oxford', 'rugby'], sweater: ['cable', 'qzip', 'argyle'], light: ['blazer', 'varsity'], hoodie: ['zip-hoodie'], coat: ['peacoat', 'camel'], rain: ['waxed'], shorts: ['chino-shorts', 'plaid-shorts'], pants: ['chinos', 'plaid-pants'], shoe: ['loafers'], beanie: ['stripe-beanie'], scarf: ['plaid-scarf'], sunglasses: ['round-shades'], umbrella: ['stripe-umbrella'] }, girls: { shorts: ['pleat-skirt'], pants: ['plaid-skirt'], shoe: ['maryjanes'] } },
  sporty: { label: 'sporty', items: { tank: ['train-tank'], tee: ['perf-tee', 'baseball-tee'], long: ['track-top', 'raglan-long'], sweater: ['qzip'], light: ['windbreaker', 'track-jacket'], hoodie: ['zip-hoodie', 'hoodie'], coat: ['puffer'], rain: ['rain-shell'], shorts: ['run-shorts'], pants: ['joggers', 'track-pants'], shoe: ['runners'], beanie: ['stripe-beanie'], scarf: ['scarf'], sunglasses: ['sport-shades'], umbrella: ['umbrella'] }, girls: { shorts: ['tennis-skirt'] } },
  street: { label: 'street', items: { tank: ['bolt-tank'], tee: ['bolt-tee', 'star-tee'], long: ['track-top', 'turtleneck'], sweater: ['crewneck'], light: ['bomber', 'leather'], hoodie: ['bolt-hoodie', 'block-hoodie'], coat: ['puffer'], rain: ['rain-shell'], shorts: ['cargo-shorts'], pants: ['cargo', 'wide-jeans', 'black-jeans'], shoe: ['chunky-kicks', 'hightops'], beanie: ['short-beanie'], scarf: ['scarf'], sunglasses: ['shades'], umbrella: ['umbrella'] }, girls: {} },
  cozy: { label: 'cozy', items: { tank: ['rib-tank'], tee: ['tee', 'pocket-tee'], long: ['flannel', 'turtleneck'], sweater: ['chunky', 'fairisle', 'cardigan'], light: ['corduroy', 'fleece'], hoodie: ['fleece-hoodie'], coat: ['teddy', 'duffle'], rain: ['raincoat'], shorts: ['cutoffs'], pants: ['cords', 'joggers'], shoe: ['boots'], beanie: ['pom-beanie'], scarf: ['stripe-scarf'], sunglasses: ['round-shades'], umbrella: ['umbrella'] }, girls: { pants: ['cord-skirt'] } },
  beachy: { label: 'beachy', items: { tank: ['stripe-tank', 'tiedye-tank'], tee: ['breton-tee', 'tiedye-tee'], long: ['stripe-long', 'linen-shirt'], sweater: ['crewneck'], light: ['denim-jacket'], hoodie: ['tiedye-hoodie'], coat: ['parka'], rain: ['raincoat'], shorts: ['board-shorts', 'linen-shorts', 'cutoffs'], pants: ['linen-pants', 'wide-jeans'], shoe: ['checker-slipons'], beanie: ['beanie'], scarf: ['scarf'], sunglasses: ['star-shades', 'round-shades'], umbrella: ['stripe-umbrella'] }, girls: { shorts: ['denim-skirt'] } },
  playful: { label: 'playful', items: { tank: ['cherry-tank'], tee: ['heart-tee', 'smiley-tee', 'frog-tee', 'star-tee'], long: ['heart-long', 'stripe-long'], sweater: ['heart-sweater', 'fuzzy'], light: ['varsity'], hoodie: ['smiley-hoodie', 'heart-hoodie'], coat: ['pastel-puffer', 'duffle'], rain: ['dot-raincoat', 'frog-raincoat'], shorts: ['cutoffs'], pants: ['wide-jeans'], shoe: ['hightops'], beanie: ['bear-beanie', 'frog-beanie'], scarf: ['dot-scarf'], sunglasses: ['heart-shades'], umbrella: ['dot-umbrella', 'frog-umbrella'] }, girls: { shorts: ['pleat-skirt'], shoe: ['maryjanes'] } },
};
// the extras they choose to wear (in the closet), whatever the weather: they're not part of what Jev dresses snug in
export const EXTRAS = new Set(['bag', 'hat', 'glasses', 'chain', 'headphones']);
// pieces only for a properly wet day (puddles), never just because they match the vibe
const WET_ONLY = new Set(['rainboots']);
// legacy per-style picks, as a vibe tag
export const STYLE_TAG = { casual: 'classic', surf: 'beachy', minimal: 'classic', sporty: 'sporty', street: 'street', preppy: 'preppy', cozy: 'cozy' };
/** What snug wears today from what it owns: one vibe for the day (cycling through the tags they own), and every
 * piece picked to match it, or else to match the rest of the outfit, so joggers don't end up with a polo. Rain boots
 * come out on wet days (their own pair, or the store's); otherwise only when they're the only shoes. */
export function dressFrom(wardrobe, day, kinds, wet = false, allExtras = false) {
  const tagsOf = p => (p.id && ITEM[p.id] ? ITEM[p.id].tags : [STYLE_TAG[p.s] || 'classic']);
  // a vibe has to tie at least two kinds of clothing together, or it can't make an outfit match
  const kindsWith = t => Object.values(wardrobe).filter(l => l.some(p => tagsOf(p).includes(t))).length;
  const tags = [...new Set(Object.values(wardrobe).flat().flatMap(tagsOf))].sort(), linked = tags.filter(t => kindsWith(t) >= 2);
  const pool0 = linked.length ? linked : tags, vibe = pool0.length ? pool0[day % pool0.length] : null;
  const worn = {}, chosen = [];
  kinds.forEach((k, ki) => { const all = wardrobe[k];
    // extras (bag, hat, glasses, chain, headphones) are only on when they've chosen to wear them (avOf puts those on)
    if (EXTRAS.has(k) && !allExtras) return;
    // a wet day with no rain boots in the closet: the store's pair, so the outfit's still right for puddles
    if (wet && k === 'shoe' && !(all || []).some(p => WET_ONLY.has(p.id))) { worn[k] = { id: 'rainboots' }; chosen.push(worn[k]); return; }
    if (!all || !all.length) return;
    const rainy = all.filter(p => WET_ONLY.has(p.id)), dry = all.filter(p => !WET_ONLY.has(p.id));
    const list = wet && rainy.length ? rainy : dry.length ? dry : all;
    const score = p => (tagsOf(p).includes(vibe) ? 10 : 0) + chosen.reduce((s, q) => s + tagsOf(p).filter(t => tagsOf(q).includes(t)).length, 0);
    const best = Math.max(...list.map(score)), pool = list.filter(p => score(p) === best);
    worn[k] = pool[(day + ki) % pool.length]; chosen.push(worn[k]); });
  return worn;
}

export const KITS = Object.entries(KIT_LIST).map(([id, k]) => ({ id, label: k.label }));
/** The closet a quick style gives someone (by girl/boy). */
export function kitWardrobe(id, body) {
  const k = KIT_LIST[id];
  if (!k) return {};
  const w = {};
  Object.entries(k.items).forEach(([kind, ids]) => { w[kind] = ids.filter(i => ITEM[i]).map(i => ({ id: i })); });
  if (body === 'girl') Object.entries(k.girls).forEach(([kind, ids]) => { w[kind] = [...ids.filter(i => ITEM[i]).map(i => ({ id: i })), ...(w[kind] || [])].slice(0, 12); });
  return w;
}


// ---- the thrift store -------------------------------------------------------------------------------------------
// A new rack every Monday: a theme for the week, and tops the store makes up itself from the theme's colourways, cuts,
// patterns and graphics, named like the tags on a real vintage rack. Everyone in the same season sees the same rack
// (it's all seeded by the week), and the season comes from where you are: wool in a northern January, tanks in a
// southern one, and the tropics stay in summer.

const DAY0_MONDAY = 4; // 1970-01-05, the first Monday after the epoch (day numbers count from 1970-01-01)
/** Days since 1970 by the local calendar for a YYYY-MM-DD date. */
const dayNo = d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000;
/** Which thrift week a local date is in, and how many days until the next rack (1-7). */
export function thriftWeek(date) {
  const n = dayNo(date) - DAY0_MONDAY;
  return { week: Math.floor(n / 7), next: 7 - (((n % 7) + 7) % 7) };
}
/** The season at a place on a date: by month, flipped south of the equator; the tropics are always summer. */
export function seasonAt(date, lat) {
  if (Math.abs(lat) < 23.5) return 'summer';
  const m = (+date.slice(5, 7) + (lat < 0 ? 6 : 0) - 1) % 12 + 1;
  return m >= 3 && m <= 5 ? 'spring' : m >= 6 && m <= 8 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter';
}

// themes: colourways [base, accent], the patterns and graphics they lean on, words for the names, the closet's tags
const THEMES = {
  racing: { label: 'y2k racing', pairs: [['black', 'red'], ['white', 'red'], ['ivory', 'black'], ['navy', 'yellow'], ['red', 'white']], fx: ['raglan', 'armstripe', 'block', 'sidestripe'], motifs: ['flame', 'checker', 'bolt', 'star'], words: ['turbo', 'pit crew', 'grand prix', 'pole position', 'lap one'], tags: ['street', 'bold'] },
  coquette: { label: 'coquette', pairs: [['pink', 'rose'], ['ivory', 'cherry'], ['white', 'pink'], ['butter', 'rose'], ['baby', 'pink']], fx: ['ringer', 'dots', 'collar'], motifs: ['bow', 'heart', 'cherry', 'butterfly'], words: ['ballet', 'sweetheart', 'lace', 'ribbon', 'pirouette'], tags: ['cute'] },
  surf: { label: 'surf shack', pairs: [['baby', 'coral'], ['ivory', 'teal'], ['sky', 'butter'], ['coral', 'ivory'], ['mint', 'navy']], fx: ['stripes', 'tiedye', 'ringer'], motifs: ['wave', 'palm', 'sun'], words: ['low tide', 'boardwalk', 'salt', 'sunburn', 'beach club'], tags: ['beachy', 'bold'] },
  skate: { label: 'skate park', pairs: [['butter', 'navy'], ['white', 'green'], ['baby', 'cherry'], ['ivory', 'cocoa'], ['washed', 'white']], fx: ['ringer', 'check', 'stripes'], motifs: ['smiley', 'flame', 'eightball'], words: ['ollie', 'kickflip', 'halfpipe', 'grip tape', 'nollie'], tags: ['street'] },
  grunge: { label: 'grunge', pairs: [['washed', 'burgundy'], ['black', 'olive'], ['olive', 'black'], ['burgundy', 'washed'], ['charcoal', 'lilac']], fx: ['stripes', 'plaid', 'frayed'], motifs: ['moon', 'star', 'eightball'], words: ['static', 'dial-up', 'basement', 'feedback', 'b-side'], tags: ['street', 'cozy'] },
  college: { label: 'college merch', pairs: [['navy', 'white'], ['burgundy', 'ivory'], ['green', 'white'], ['grey', 'navy'], ['ivory', 'green']], fx: ['ringer', 'collar', 'rugby', 'stripes'], motifs: ['letter', 'star'], words: ['varsity', 'campus', 'alumni', 'homecoming', 'class of 98'], tags: ['preppy', 'sporty'] },
  cottage: { label: 'cottage', pairs: [['ivory', 'green'], ['butter', 'sage'], ['white', 'rose'], ['sage', 'ivory'], ['lilac', 'matcha']], fx: ['knit', 'cable', 'dots', 'buttons'], motifs: ['mushroom', 'flower', 'frog', 'butterfly'], words: ['meadow', 'orchard', 'garden', 'picnic', 'foraged'], tags: ['cute', 'cozy'] },
  gorp: { label: 'gorpcore', pairs: [['sage', 'rust'], ['olive', 'orange'], ['tan', 'teal'], ['charcoal', 'orange'], ['matcha', 'cocoa']], fx: ['halfzip', 'block', 'chestpocket'], motifs: ['mountain', 'mushroom', 'sun'], words: ['trail', 'summit', 'basecamp', 'switchback', 'ridgeline'], tags: ['sporty', 'cozy'] },
  ski: { label: '90s ski', pairs: [['teal', 'purple'], ['navy', 'yellow'], ['red', 'white'], ['purple', 'mint'], ['white', 'teal']], fx: ['block', 'raglan', 'fairisle', 'halfzip'], motifs: ['snowflake', 'mountain'], words: ['après', 'powder day', 'lodge', 'black diamond', 'chairlift'], tags: ['sporty', 'cozy'] },
  cabin: { label: 'cabin', pairs: [['cream', 'rust'], ['cocoa', 'ivory'], ['burgundy', 'cream'], ['olive', 'cream'], ['charcoal', 'butter']], fx: ['cable', 'fairisle', 'knit', 'fuzzy'], motifs: ['snowflake', 'moon'], words: ['fireside', 'hot cocoa', 'woodstove', 'snowed in', 'flannel'], tags: ['cozy'] },
};
// what each season's racks are made of: its themes, and how often each cut turns up
const SEASONS = {
  summer: { themes: ['surf', 'coquette', 'skate', 'racing'], kinds: { tank: 4, tee: 5, long: 1 } },
  spring: { themes: ['coquette', 'cottage', 'college', 'skate'], kinds: { tee: 5, long: 3, tank: 1, sweater: 1 } },
  autumn: { themes: ['grunge', 'college', 'cottage', 'gorp'], kinds: { long: 4, sweater: 3, tee: 2, hoodie: 2 } },
  winter: { themes: ['ski', 'cabin', 'gorp', 'grunge'], kinds: { sweater: 5, hoodie: 3, long: 3 } },
};
// the cut's name on the tag, by kind, and by the detail that makes it
const CUTS = { tank: ['tank', 'cami', 'baby tank'], tee: ['baby tee', 'boxy tee', 'tee', 'oversized tee'], long: ['long sleeve', 'thermal', 'layering tee'], sweater: ['knit', 'crewneck', 'sweater'], hoodie: ['hoodie', 'zip hoodie'] };
const CUT_BY_FX = { ringer: 'ringer', raglan: 'raglan', rugby: 'rugby', collar: 'polo', halfzip: 'quarter zip', cable: 'cable knit', fairisle: 'fair isle', buttons: 'cardigan' };
const FEEL = ['washed', 'vintage', 'faded', 'thrifted', 'oversized', 'sun-bleached', 'deadstock', 'secondhand'];
const RACK_SIZE = 9;
// each season's letter in a piece's id
const CODE = { spring: 'p', summer: 's', autumn: 'a', winter: 'w' }, SEASON_OF = { p: 'spring', s: 'summer', a: 'autumn', w: 'winter' };

const rngOf = seed => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const pickW = (r, weights) => { const e = Object.entries(weights), n = e.reduce((s, [, w]) => s + w, 0); let x = r() * n; for (const [k, w] of e) { if ((x -= w) < 0) return k; } return e[0][0]; };

/** The week's theme for a season (it moves on every week, never twice running). */
export const thriftTheme = (week, season) => { const t = SEASONS[season].themes; return THEMES[t[((week % t.length) + t.length) % t.length]]; };

/** One top on the rack, made up from its week, season and place on the rack. */
function makeTop(week, season, slot) {
  const th = thriftTheme(week, season), r = rngOf(week * 7919 + slot * 104729 + 'psaw'.indexOf(CODE[season]) * 15485863 + 17);
  const kind = pickW(r, SEASONS[season].kinds), [base, acc] = pick(r, th.pairs);
  // a pattern, a graphic, or both: never plain
  const fx = [], roll = r();
  const pattern = roll < 0.75 ? pick(r, th.fx) : null, motif = roll > 0.35 || !pattern ? pick(r, th.motifs) : null;
  if (pattern) fx.push(pattern);
  if (motif) fx.push(motif === 'letter' ? 'letter' : 'motif:' + motif);
  if (kind === 'hoodie' && !fx.includes('halfzip') && r() < 0.4) fx.push('zip');
  const cut = (pattern && CUT_BY_FX[pattern] && kind !== 'tank' && kind !== 'hoodie') ? CUT_BY_FX[pattern] : pick(r, CUTS[kind]);
  const art = motif && motif !== 'letter' ? (motif === 'eightball' ? '8-ball' : motif) : pattern && !CUT_BY_FX[pattern] ? ({ tiedye: 'tie-dye', check: 'checker', block: 'colour-block', armstripe: 'track', sidestripe: 'track', frayed: 'distressed', dots: 'polka', knit: 'waffle', fuzzy: 'mohair', chestpocket: 'utility', plaid: 'plaid', stripes: 'striped', letter: 'collegiate', zip: 'zip' })[pattern] : null;
  const lead = r() < 0.5 ? pick(r, FEEL) : pick(r, th.words);
  const name = [lead, art, cut].filter(Boolean).join(' ');
  return { id: `thrift-${week}-${CODE[season]}-${slot}`, kind, name, base, acc, fx, tags: th.tags, dept: 'all', colors: [base], thrift: { week, season, theme: th.label } };
}

/** This week's rack for a season: no two the same, no colour more than twice, no look (cut and details) twice, so the
 * rack reads as a mix rather than a stack of one thing. */
export function thriftRack(week, season) {
  const names = new Set(), looks = new Set(), bases = {};
  const rack = [];
  for (let slot = 0; rack.length < RACK_SIZE && slot < RACK_SIZE * 8; slot++) {
    const it = makeTop(week, season, slot), look = it.kind + it.fx.join();
    if (names.has(it.name) || looks.has(look) || (bases[it.base] ?? 0) >= 2) continue;
    names.add(it.name); looks.add(look); bases[it.base] = (bases[it.base] ?? 0) + 1; rack.push(it);
  }
  return rack;
}

/** A thrift piece from its id (thrift-<week>-<season letter>-<slot>), or null. */
export function thriftItem(id) {
  const m = /^thrift-(-?\d+)-([psaw])-(\d+)$/.exec(id);
  return m ? makeTop(+m[1], SEASON_OF[m[2]], +m[3]) : null;
}


// ---- maison snugé ---------------------------------------------------------------------------------------------------
// The boutique, for anyone. Each week: one of each extra (a bag, a hat, glasses, a chain, headphones), made up from the
// week like the thrift rack (fur ones in winter), and three statement pieces from the season's capsule, turning over
// week by week. Everyone sees the same drop, and a piece keeps working after it's gone.

// for each extra: its cuts, each with the detail that makes it, the seasons it's out (p s a w, or * all year), and its
// own materials or colourways where the kind's usual ones don't fit; then the kind's usual materials and colourways
const MAISON_KINDS = {
  bag: {
    cuts: [
      { cut: 'crossbody', fx: [], when: '*' }, { cut: 'chain bag', fx: ['chain'], when: '*' },
      { cut: 'quilted crossbody', fx: ['quilt'], when: 'aw' }, { cut: 'tote', fx: ['tote'], when: 'ps' },
      { cut: 'mini backpack', fx: ['backpack'], when: 'pa' }, { cut: 'saddle bag', fx: [], when: 'a', mats: ['suede', 'tan leather'] },
      { cut: 'basket bag', fx: ['basket'], when: 's', mats: ['woven', 'raffia'], pairs: [['tan', null], ['cream', null]] },
      { cut: 'shearling tote', fx: ['tote', 'fur'], when: 'w', mats: [], pairs: [['cream', null], ['mocha', null]], fur: true },
      { cut: 'faux fur bag', fx: ['fur'], when: 'w', mats: [], pairs: [['pearl', 'gold'], ['mocha', 'gold'], ['black', 'silver']], fur: true },
    ],
    materials: ['leather', 'suede', 'nylon', 'canvas'], pairs: [['black', 'gold'], ['camel', 'gold'], ['mocha', 'silver'], ['cream', 'gold'], ['olive', 'silver'], ['burgundy', 'gold']],
  },
  hat: {
    cuts: [
      { cut: 'bucket hat', fx: [], when: '*' }, { cut: 'cap', fx: ['cap'], when: '*' },
      { cut: 'visor', fx: ['visor'], when: 's', mats: ['terry', 'nylon'] },
      { cut: 'bandana', fx: ['bandana'], when: 's', mats: ['silk', 'paisley'], pairs: [['red', 'white'], ['navy', 'white'], ['sage', 'cream'], ['black', 'cream']] },
      { cut: 'earmuffs', fx: ['earmuffs'], when: 'w', mats: ['faux fur', 'shearling'], pairs: [['cream', null], ['pearl', null], ['mocha', null]], fur: true },
      { cut: 'trapper hat', fx: ['trapper'], when: 'w', mats: ['shearling'], pairs: [['mocha', 'ivory'], ['black', 'cream'], ['camel', 'ivory']], fur: true },
    ],
    materials: ['suede', 'wool', 'corduroy', 'nylon', 'canvas'], pairs: [['cream', 'mocha'], ['black', 'cream'], ['camel', 'cream'], ['olive', 'cream'], ['navy', 'cream'], ['mocha', 'ivory']],
  },
  glasses: {
    cuts: [{ cut: 'frames', fx: [], when: '*' }, { cut: 'tinted frames', fx: ['tint'], when: 'ps', pairs: [['gold', 'pink'], ['silver', 'sky'], ['tortoise', 'butter']] }],
    materials: ['tortoiseshell', 'wire-rim', 'clear acetate', 'black acetate'], pairs: [['tortoise', null], ['gold', null], ['pearl', null], ['black', null], ['silver', null]],
  },
  chain: {
    cuts: [
      { cut: 'chain', fx: [], when: '*' }, { cut: 'pendant chain', fx: ['pendant'], when: '*' },
      { cut: 'pearl strand', fx: [], when: 'p', mats: [], pairs: [['pearl', null]] },
      { cut: 'puka shell necklace', fx: ['shells'], when: 's', mats: [], pairs: [['pearl', null]] },
      { cut: 'beaded necklace', fx: ['beads'], when: 's', mats: [], pairs: [['pearl', null]] },
      { cut: 'locket', fx: ['pendant'], when: 'a', mats: ['gold', 'silver'], pairs: [['gold', 'gold'], ['silver', 'silver']] },
      { cut: 'chunky chain', fx: [], when: 'w', mats: ['gold', 'silver'], pairs: [['gold', 'gold'], ['silver', 'silver']] },
    ],
    materials: ['gold rope', 'silver box', 'gold curb'], pairs: [['gold', 'gold'], ['silver', 'silver']],
  },
  headphones: {
    cuts: [
      { cut: 'headphones', fx: [], when: '*' }, { cut: 'wired earbuds', fx: ['earbuds'], when: 'ps', mats: [], pairs: [['white', null]] },
      { cut: 'earmuff headphones', fx: ['fuzzy'], when: 'w', mats: [], pairs: [['cream', null], ['mocha', null]] },
    ],
    materials: ['matte', 'chrome', 'cream', 'olive', 'suede'], pairs: [['black', null], ['chrome', null], ['cream', null], ['olive', null], ['camel', null]],
  },
};
const MAISON_SLOTS = ['bag', 'hat', 'glasses', 'chain', 'headphones'];
// materials that are really a colour (glasses frames, chains, headphones)
const MATERIAL_COLOUR = { tortoiseshell: 'tortoise', 'wire-rim': 'gold', 'clear acetate': 'pearl', 'black acetate': 'black', 'gold rope': 'gold', 'silver box': 'silver', 'gold curb': 'gold', gold: 'gold', silver: 'silver', matte: 'black', chrome: 'chrome' };

// each season's capsule of statement pieces, worn when the weather calls for that kind of piece
// [id, kind, name, base colour, accent colour, details]
const CAPSULES = {
  autumn: [
    ['maison-bronze-bomber', 'light', 'metallic bronze bomber', 'bronze', null, ['closed', 'zip', 'metallic']],
    ['maison-cashmere-cardigan', 'sweater', 'gold-button cashmere cardigan', 'camel', null, ['goldbuttons', 'knit']],
    ['maison-shearling', 'light', 'shearling jacket', 'mocha', 'ivory', ['fur', 'closed']],
    ['maison-sequin-crew', 'sweater', 'sequin knit', 'burgundy', null, ['sequin']],
    ['maison-leather-jacket', 'light', 'leather jacket', 'black', null, ['closed', 'zip', 'metallic']],
    ['maison-mohair-cardigan', 'sweater', 'mohair cardigan', 'olive', null, ['fuzzy', 'buttons']],
  ],
  winter: [
    ['maison-holo-puffer', 'coat', 'holographic puffer', 'silver', null, ['quilt', 'holo']],
    ['maison-fur-coat', 'coat', 'faux fur coat', 'champagne', null, ['fuzzy', 'fur']],
    ['maison-sequin-turtleneck', 'long', 'sequin turtleneck', 'black', null, ['turtleneck', 'sequin']],
    ['maison-chocolate-fur', 'coat', 'chocolate fur coat', 'mocha', null, ['fuzzy', 'fur']],
    ['maison-fur-boots', 'shoe', 'fur-lined boots', 'camel', 'ivory', ['boot', 'furtrim']],
    ['maison-fur-stole', 'scarf', 'faux fur stole', 'pearl', null, ['fuzzy']],
  ],
  spring: [
    ['maison-iri-windbreaker', 'light', 'iridescent windbreaker', 'lilac', null, ['closed', 'zip', 'holo']],
    ['maison-trench', 'rain', 'cotton trench', 'camel', null, ['belt', 'double']],
    ['maison-satin-bomber', 'light', 'satin bomber', 'champagne', null, ['closed', 'zip', 'metallic']],
    ['maison-silk-shirt', 'long', 'silk shirt', 'ivory', null, ['placket', 'linen']],
  ],
  summer: [
    ['maison-sequin-tank', 'tank', 'sequin tank', 'black', null, ['sequin']],
    ['maison-holo-tee', 'tee', 'holographic tee', 'silver', null, ['holo']],
    ['maison-camp-shirt', 'long', 'linen camp shirt', 'ivory', null, ['linen', 'collar']],
    ['maison-crochet-tank', 'tank', 'crochet tank', 'cream', null, ['knit']],
  ],
};
export const CAPSULE_ITEMS = Object.values(CAPSULES).flat().map(([id, kind, name, base, acc, fx]) => ({ id, kind, name, base, acc, fx, tags: ['luxe'], dept: 'all', colors: [base] }));

function makeExtra(week, slot, season) {
  const kind = MAISON_SLOTS[slot], K = MAISON_KINDS[kind], code = CODE[season], r = rngOf(week * 6007 + slot * 92821 + 'psaw'.indexOf(code) * 15485863 + 3);
  const out = K.cuts.filter(c => c.when === '*' || c.when.includes(code));
  // the season's own cuts come up twice as often; winter always has something fur (a hat one week, a bag the next)
  const furs = out.filter(c => c.fur), furWeek = furs.length && (kind === 'hat' ? week % 2 === 0 : week % 2 !== 0);
  const c = furWeek ? pick(r, furs) : pick(r, out.flatMap(c => (c.when === '*' ? [c] : [c, c])));
  const mats = c.mats ?? K.materials, material = mats.length ? pick(r, mats) : null;
  let [base, acc] = pick(r, c.pairs ?? K.pairs);
  if (material && MATERIAL_COLOUR[material] && !c.pairs) base = MATERIAL_COLOUR[material];
  if (c.cut === 'locket' || c.cut === 'chunky chain') base = acc = material;
  // a special finish on about half of them (never on things that are already the point: fur, shells, beads, baskets,
  // earbuds); chrome is always iridescent
  const plain = c.fur || ['shells', 'beads', 'basket', 'earbuds'].some(f => c.fx.includes(f));
  const roll = r(), fin = plain ? null : material === 'chrome' ? 'holo' : roll < 0.2 ? 'holo' : roll < 0.35 ? 'metallic' : roll < 0.48 && (kind === 'bag' || kind === 'hat') ? 'sequin' : null;
  const word = { holo: 'iridescent', metallic: 'metallic', sequin: 'sequin' }[fin];
  const name = fin ? `${word} ${c.cut}` : material ? `${material} ${c.cut}` : c.cut;
  return { id: `maison-${week}-${code}-${slot}`, kind, name, base, acc, fx: fin ? [...c.fx, fin] : [...c.fx], tags: ['luxe'], dept: 'all', colors: [base] };
}

/** This week's drop at maison snugé for a season: one of each extra, and three of the season's capsule. */
export function maisonDrop(week, season) {
  const extras = MAISON_SLOTS.map((_, slot) => makeExtra(week, slot, season));
  const cap = CAPSULES[season], at = ((week % cap.length) + cap.length) % cap.length;
  const pieces = [...cap.slice(at), ...cap.slice(0, at)].slice(0, 3).map(([id]) => CAPSULE_ITEMS.find(c => c.id === id));
  return { extras, pieces };
}

/** A boutique extra from its id (maison-<week>-<season letter>-<slot>), or null. */
export function maisonItem(id) {
  const m = /^maison-(-?\d+)-([psaw])-(\d+)$/.exec(id);
  return m && +m[3] < MAISON_SLOTS.length ? makeExtra(+m[1], +m[3], SEASON_OF[m[2]]) : null;
}
