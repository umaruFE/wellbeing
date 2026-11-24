/* Read-only context labels shared by preparation and the classroom. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MMQuestionContext = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const string = value => typeof value === 'string' ? value : '';
  const key = value => string(value).trim().toLowerCase().replace(/\s+/g, ' ');
  const sentenceKey = value => key(value).replace(/[.!?。！？]+$/u, '').trim();
  // Match the complete original context as well as its sentence. A teacher's
  // replacement context must never be shortened merely because its ID matches.
  const CASES = [
    ['I pack ___ umbrella.', 'One umbrella, not a particular one.', 'Any one umbrella.', true],
    ['I see ___ cat.', 'One cat, mentioned for the first time.', 'First mention.', true],
    ['___ sun is bright today.', 'We are talking about the sun in our sky.', '', false],
    ['I like ___ milk.', 'Milk in general, not a particular glass.', 'Milk in general.', false],
    ['She buys ___ orange.', 'One orange, not a particular one.', 'Any one orange.', true],
    ['I need ___ book.', 'Any one book will do.', 'Any one book.', true],
    ['___ cat is sleeping.', 'There is a cat by our door. We mean that cat.', 'A cat is by our door.', false],
    ['I drink ___ water every day.', 'Water in general, not a particular bottle.', 'Water in general.', false],
    ['I want ___ egg.', 'Any one egg will do.', 'Any one egg.', true],
    ['He buys ___ hat.', 'One hat, not a particular one.', 'Any one hat.', true],
    ['Please pass me ___ book.', 'There is one book on the desk. We mean that book.', 'One book is on the desk.', false],
    ['I love ___ flowers.', 'All flowers in general.', 'Flowers in general.', false]
  ];
  // Exactly the reviewed forms used by linked-content.js. No suffix guessing.
  const FORMS = [
    ['flowers', 'flower'], ['cars', 'car'], ['cats', 'cat'], ['dogs', 'dog'], ['books', 'book'],
    ['birds', 'bird'], ['rabbits', 'rabbit'], ['trains', 'train'], ['buses', 'bus'], ['bikes', 'bike'],
    ['hats', 'hat'], ['balls', 'ball'], ['pencils', 'pencil'], ['apples', 'apple'], ['oranges', 'orange'],
    ['eggs', 'egg'], ['bananas', 'banana'], ['pears', 'pear'], ['carrots', 'carrot']
  ];

  function categorySet(lesson) {
    if (!Array.isArray(lesson?.categories)) return '';
    const labels = lesson.categories.map(category => key(category?.label));
    if (labels.some(label => !label) || new Set(labels).size !== labels.length) return '';
    return labels.sort().join('|');
  }

  function text(item, lesson) {
    const context = string(item?.context);
    if (!context || item?.type === 'word-sort' || lesson?.mode === 'word-sort') return context;
    const categories = categorySet(lesson), two = categories === 'a|an', four = categories === 'a|an|the|ø';
    if (!two && !four) return context;
    const sentence = sentenceKey(item?.sentence);
    const known = CASES.find(([original, originalContext]) => sentence === sentenceKey(original) && context === originalContext);
    if (known && (four || known[3])) return four ? known[2] : '';

    for (const [plural, singular] of FORMS) {
      if (four && sentence === sentenceKey(`I love ___ ${plural}.`) && context === `All ${plural} in general.`) {
        return plural[0].toUpperCase() + plural.slice(1) + ' in general.';
      }
      if (four && sentence === sentenceKey(`I love ___ ${singular}.`)
        && context === `We are pointing to one particular ${singular} that we both can identify.`) return `This ${singular} here.`;
      if (two && sentence === sentenceKey(`I see ___ ${singular}.`)
        && context === `One ${singular}, mentioned for the first time.`) return '';
    }
    return context;
  }

  return Object.freeze({ text });
});
