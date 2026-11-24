(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DoodleWordTools = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDoodleWordTools() {
  'use strict';

  // Picture data and matching algorithm copied without semantic changes from
  // Doodle-Guess-English-V1.7.2.html, EMOJI_MAP / localPic, lines 7185–7261.
  // Source SHA-256: 96a836e34d0b3f536ddc080166880459f6ed3ae99a7675223e5897b3f15a628f.
  // This is an offline emoji dictionary, not generated imagery or translation.
  // Missing pictures deliberately return ''. The caller must show that state.
  const EMOJI_MAP = {
    // animals
    "cat":"🐱","dog":"🐶","bird":"🐦","fish":"🐟","lion":"🦁","tiger":"🐯","elephant":"🐘","monkey":"🐵",
    "panda":"🐼","rabbit":"🐰","bunny":"🐰","bear":"🐻","frog":"🐸","duck":"🦆","chicken":"🐔","cow":"🐄",
    "pig":"🐷","horse":"🐴","sheep":"🐑","mouse":"🐭","fox":"🦊","wolf":"🐺","deer":"🦌","giraffe":"🦒",
    "zebra":"🦓","kangaroo":"🦘","penguin":"🐧","owl":"🦉","eagle":"🦅","snake":"🐍","turtle":"🐢",
    "whale":"🐳","dolphin":"🐬","shark":"🦈","octopus":"🐙","crab":"🦀","butterfly":"🦋","bee":"🐝",
    "ant":"🐜","spider":"🕷️","snail":"🐌","ladybug":"🐞","dinosaur":"🦕","dragon":"🐉","unicorn":"🦄",
    // food & drink
    "apple":"🍎","banana":"🍌","orange":"🍊","grape":"🍇","grapes":"🍇","watermelon":"🍉","strawberry":"🍓",
    "cherry":"🍒","lemon":"🍋","peach":"🍑","pear":"🍐","pineapple":"🍍","mango":"🥭","coconut":"🥥",
    "tomato":"🍅","potato":"🥔","carrot":"🥕","corn":"🌽","broccoli":"🥦","onion":"🧅","mushroom":"🍄",
    "bread":"🍞","cake":"🍰","cookie":"🍪","candy":"🍬","chocolate":"🍫","ice cream":"🍦","pizza":"🍕",
    "hamburger":"🍔","burger":"🍔","sandwich":"🥪","egg":"🥚","milk":"🥛","water":"💧","juice":"🧃",
    "coffee":"☕","tea":"🍵","rice":"🍚","noodles":"🍜","soup":"🍲","honey":"🍯","cheese":"🧀",
    "butter":"🧈","salt":"🧂","breakfast":"🥣","lunch":"🍱","dinner":"🍽️",
    // nature & weather
    "sun":"☀️","sunny":"☀️","moon":"🌙","star":"⭐","cloud":"☁️","cloudy":"☁️","rain":"🌧️","rainy":"🌧️",
    "snow":"❄️","snowy":"❄️","wind":"🌬️","windy":"🌬️","storm":"⛈️","rainbow":"🌈","tree":"🌳",
    "flower":"🌸","leaf":"🍃","grass":"🌿","mountain":"⛰️","river":"🏞️","lake":"🏞️","sea":"🌊",
    "ocean":"🌊","beach":"🏖️","island":"🏝️","fire":"🔥","earth":"🌍","world":"🌍","volcano":"🌋",
    "desert":"🏜️","forest":"🌲","sky":"🌌","night":"🌙","day":"🌞","spring":"🌱","summer":"🌞",
    "autumn":"🍂","fall":"🍂","winter":"❄️",
    // transport
    "car":"🚗","bus":"🚌","train":"🚆","bike":"🚲","bicycle":"🚲","plane":"✈️","airplane":"✈️",
    "rocket":"🚀","boat":"⛵","ship":"🚢","truck":"🚚","taxi":"🚕","helicopter":"🚁","motorcycle":"🏍️",
    "scooter":"🛴","road":"🛣️","bridge":"🌉","traffic":"🚦",
    // home & things
    "house":"🏠","home":"🏠","door":"🚪","window":"🪟","bed":"🛏️","chair":"🪑","table":"🍽️","lamp":"💡",
    "light":"💡","clock":"⏰","key":"🔑","book":"📕","pencil":"✏️","pen":"🖊️","ruler":"📏",
    "scissors":"✂️","bag":"🎒","ball":"⚽","balloon":"🎈","gift":"🎁","present":"🎁","hat":"🎩",
    "shoe":"👟","shoes":"👟","sock":"🧦","socks":"🧦","shirt":"👕","dress":"👗","glasses":"👓",
    "watch":"⌚","ring":"💍","crown":"👑","money":"💰","coin":"🪙","phone":"📱","camera":"📷",
    "computer":"💻","television":"📺","tv":"📺","radio":"📻","umbrella":"☂️","toy":"🧸","kite":"🪁",
    "map":"🗺️","letter":"✉️","stamp":"📮","bottle":"🍼","cup":"🥤","box":"📦",
    "basket":"🧺","mirror":"🪞","soap":"🧼","towel":"🧺","toothbrush":"🪥","bath":"🛁","toilet":"🚽",
    // body & people
    "eye":"👁️","ear":"👂","nose":"👃","mouth":"👄","hand":"✋","foot":"🦶","hair":"💇","tooth":"🦷",
    "heart":"❤️","brain":"🧠","face":"🙂","smile":"😊","baby":"👶","boy":"👦","girl":"👧","man":"👨",
    "woman":"👩","family":"👨‍👩‍👧","friend":"👫","friends":"👫","teacher":"👩‍🏫","doctor":"🧑‍⚕️",
    "nurse":"👩‍⚕️","police":"👮","farmer":"👨‍🌾","chef":"👨‍🍳","cook":"👨‍🍳","firefighter":"🧑‍🚒",
    "pirate":"🏴‍☠️","king":"🤴","queen":"👸","princess":"👸","clown":"🤡","superhero":"🦸",
    // feelings
    "happy":"😊","sad":"😢","angry":"😠","tired":"😴","sleepy":"😴","scared":"😨","surprised":"😲",
    "excited":"🤩","love":"❤️","laugh":"😄","cry":"😭","think":"🤔","dream":"💭","idea":"💡",
    "music":"🎵","song":"🎵","quiet":"🤫","loud":"📢",
    // actions
    "run":"🏃","jump":"🤸","swim":"🏊","sleep":"😴","eat":"🍽️","drink":"🥤","read":"📖","write":"✏️",
    "sing":"🎤","dance":"💃","play":"🎮","walk":"🚶","fly":"🕊️","draw":"🎨","paint":"🎨","climb":"🧗",
    "ride":"🚴","listen":"👂","speak":"🗣️","open":"📂","close":"📁","wash":"🧼","clean":"🧽",
    // school & places
    "school":"🏫","class":"🏫","classroom":"🏫","library":"📚","park":"🏞️","zoo":"🦓","hospital":"🏥",
    "shop":"🏪","store":"🏪","market":"🏪","bank":"🏦","museum":"🏛️","cinema":"🎬","restaurant":"🍽️",
    "city":"🏙️","town":"🏘️","village":"🏘️","farm":"🚜","garden":"🌷","playground":"🛝","station":"🚉",
    "airport":"🛫","hotel":"🏨","office":"🏢","factory":"🏭",
    // school things & study
    "homework":"📝","lesson":"📖","question":"❓","answer":"✅","story":"📖","word":"🔤","number":"🔢",
    "color":"🎨","shape":"🔷","circle":"⭕","square":"⬛","triangle":"🔺","line":"📏",
    // colours
    "red":"🔴","blue":"🔵","green":"🟢","yellow":"🟡","black":"⚫","white":"⚪","purple":"🟣",
    "pink":"💗","brown":"🟤","grey":"🩶","gray":"🩶","gold":"🟡","silver":"⚪",
    // time & misc
    "morning":"🌅","afternoon":"🌤️","evening":"🌆","birthday":"🎂","party":"🎉","holiday":"🏖️",
    "christmas":"🎄","halloween":"🎃","new year":"🎆","game":"🎮","sport":"⚽","football":"⚽",
    "basketball":"🏀","baseball":"⚾","tennis":"🎾","swimming":"🏊","running":"🏃","dancing":"💃",
    "singing":"🎤","reading":"📖","drawing":"🎨","weather":"🌤️","temperature":"🌡️","time":"⏰",
  };

  function localPic(word) {
    const w = String(word || "").toLowerCase().trim();
    if (EMOJI_MAP[w]) return EMOJI_MAP[w];
    if (w.endsWith("es") && EMOJI_MAP[w.slice(0, -2)]) return EMOJI_MAP[w.slice(0, -2)];
    if (w.endsWith("s") && EMOJI_MAP[w.slice(0, -1)]) return EMOJI_MAP[w.slice(0, -1)];
    if (w.endsWith("ing") && EMOJI_MAP[w.slice(0, -3)]) return EMOJI_MAP[w.slice(0, -3)];
    return "";
  }

  const WORD = /^[a-z]+(?:[-'][a-z]+)*$/;
  function parse(raw) {
    const tokens = String(raw ?? '').split(/[\s,，]+/u).map(word => word.trim().toLowerCase()).filter(Boolean);
    const words = [...new Set(tokens)];
    return {words, invalid: words.filter(word => !WORD.test(word)), duplicates: tokens.length - words.length};
  }

  function update(words, operation = {}) {
    const original = Array.isArray(words) ? words.slice() : [];
    const fail = (error, duplicates = 0) => ({ok: false, words: original.slice(), error, duplicates});
    const success = (next, duplicates = 0) => ({ok: true, words: next, error: '', duplicates});
    const key = value => String(value).trim().toLowerCase();
    if (!Array.isArray(words) || !operation || typeof operation !== 'object') return fail('invalid');
    const {type, index} = operation;
    if (!['add', 'replace', 'remove', 'batch'].includes(type)) return fail('invalid');
    if (['replace', 'remove'].includes(type) && (!Number.isInteger(index) || index < 0 || index >= original.length)) return fail('index');
    if (type === 'remove') return success(original.filter((word, i) => i !== index));

    const parsed = parse(operation.value);
    if (!parsed.words.length) return fail('empty');
    if (parsed.invalid.length) return fail('invalid', parsed.duplicates);
    if (type !== 'batch') {
      if (parsed.words.length + parsed.duplicates !== 1) return fail('multiple', parsed.duplicates);
      const word = parsed.words[0];
      if (original.some((existing, i) => key(existing) === word && (type !== 'replace' || i !== index))) return fail('duplicate', 1);
      if (type === 'add') return success([...original, word]);
      const next = original.slice(); next[index] = word;
      return success(next);
    }

    if (operation.mode === 'replace') return success(parsed.words.slice(), parsed.duplicates);
    const next = [], seen = new Set();
    let duplicates = parsed.duplicates;
    for (const word of [...original, ...parsed.words]) {
      const normalized = key(word);
      if (seen.has(normalized)) { duplicates++; continue; }
      seen.add(normalized); next.push(normalized);
    }
    return success(next, duplicates);
  }

  const api = {picture: localPic, parse, update};
  // The runtime can inline this self-contained factory inside an opaque frame.
  api.factory = createDoodleWordTools;
  return Object.freeze(api);
});
