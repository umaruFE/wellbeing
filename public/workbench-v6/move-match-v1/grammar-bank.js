/* Additional local example questions. No AI service and no changes to V39 templates. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MMGrammarBank = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Rows are authored sentences, not a Cartesian product of nouns and verbs.
  // The two article activities intentionally share this teaching pool; each
  // receives separate objects and stable, activity-scoped item identifiers.
  // [stable key, sentence, noun phrase, existing V39 artwork or null, context]
  const A = [
    ['ball-draw', 'Please draw ___ ball.', 'ball', 'ball', 'Any one ball.'],
    ['pencil-borrow', 'May I borrow ___ pencil?', 'pencil', 'pencil', 'Any one pencil.'],
    ['chair-need', 'We need ___ chair for our visitor.', 'chair', null, 'Any one chair.'],
    ['bag-choose', 'Please choose ___ bag for the trip.', 'bag', null, 'Any one bag.'],
    ['kite-make', 'I want to make ___ kite.', 'kite', null, 'Any one kite.'],
    ['banana-take', 'Please take ___ banana for your snack.', 'banana', 'banana', 'Any one banana.'],
    ['rabbit-spot', 'We spot ___ rabbit near the path.', 'rabbit', 'rabbit', 'One new rabbit.'],
    ['bus-take', 'Let us take ___ bus to town.', 'bus', 'bus', 'Any one bus.'],
    ['train-draw', 'Please draw ___ train.', 'train', 'train', 'Any one train.'],
    ['car-want', 'They want to buy ___ car.', 'car', 'car', 'Any one car.'],
    ['bike-rent', 'I want to rent ___ bike.', 'bike', 'bike', 'Any one bike.'],
    ['shirt-choose', 'Please choose ___ shirt to wear.', 'shirt', 'shirt', 'Any one shirt.'],
    ['flower-pick', 'She picks ___ flower for her card.', 'flower', 'flower', 'One new flower.'],
    ['bird-draw', 'I want to draw ___ bird.', 'bird', 'bird', 'Any one bird.'],
    ['fish-catch', 'He catches ___ fish in the pond.', 'fish', 'fish', 'One new fish.'],
    ['cow-see', 'We see ___ cow beside the barn.', 'cow', 'cow', 'One new cow.'],
    ['duck-spot', 'I spot ___ duck on the lake.', 'duck', 'duck', 'One new duck.'],
    ['bear-draw', 'She wants to draw ___ bear.', 'bear', 'bear', 'Any one bear.'],
    ['pear-bring', 'Please bring ___ pear for your snack.', 'pear', 'pear', 'Any one pear.'],
    ['lemon-need', 'I need ___ lemon for this recipe.', 'lemon', 'lemon', 'Any one lemon.'],
    ['carrot-take', 'He takes ___ carrot from the basket.', 'carrot', 'carrot', 'Any one carrot.'],
    ['potato-peel', 'Please peel ___ potato for the soup.', 'potato', 'potato', 'Any one potato.'],
    ['tomato-need', 'We need ___ tomato for the salad.', 'tomato', 'tomato', 'Any one tomato.'],
    ['cookie-have', 'May I have ___ cookie?', 'cookie', 'cookie', 'Any one cookie.'],
    ['dog-draw', 'Please draw ___ dog.', 'dog', 'dog', 'Any one dog.']
  ];
  const AN = [
    ['apple-eat', 'I want to eat ___ apple.', 'apple', 'apple', 'Any one apple.'],
    ['elephant-draw', 'Please draw ___ elephant.', 'elephant', null, 'Any one elephant.'],
    ['owl-see', 'We see ___ owl in the tree.', 'owl', null, 'One new owl.'],
    ['ant-notice', 'I notice ___ ant on the path.', 'ant', null, 'One new ant.'],
    ['insect-find', 'She finds ___ insect on a leaf.', 'insect', null, 'One new insect.'],
    ['octopus-draw', 'He wants to draw ___ octopus.', 'octopus', null, 'Any one octopus.'],
    ['alligator-see', 'They see ___ alligator in the river.', 'alligator', null, 'One new alligator.'],
    ['animal-draw', 'She wants to draw ___ animal.', 'animal', null, 'Any one animal.'],
    ['eraser-borrow', 'May I borrow ___ eraser?', 'eraser', null, 'Any one eraser.'],
    ['envelope-need', 'I need ___ envelope for my letter.', 'envelope', null, 'Any one envelope.'],
    ['apron-need', 'I need ___ apron for painting.', 'apron', null, 'Any one apron.'],
    ['arrow-draw', 'Please draw ___ arrow on the map.', 'arrow', null, 'One new arrow.'],
    ['oval-cut', 'Cut out ___ oval from the paper.', 'oval', null, 'Any one oval.'],
    ['igloo-build', 'We want to build ___ igloo from snow.', 'igloo', null, 'One new igloo.'],
    ['iguana-see', 'I see ___ iguana on a branch.', 'iguana', null, 'One new iguana.'],
    ['ostrich-spot', 'We spot ___ ostrich in the field.', 'ostrich', null, 'One new ostrich.'],
    ['otter-see', 'They see ___ otter near the water.', 'otter', null, 'One new otter.'],
    ['eagle-draw', 'She wants to draw ___ eagle.', 'eagle', null, 'Any one eagle.'],
    ['ambulance-draw', 'He wants to draw ___ ambulance.', 'ambulance', null, 'Any one ambulance.'],
    ['airplane-draw', 'I want to draw ___ airplane.', 'airplane', 'plane', 'Any one airplane.'],
    ['artist-need', 'We need ___ artist to paint our poster.', 'artist', null, 'Any one artist.'],
    ['actor-need', 'The play needs ___ actor for this part.', 'actor', null, 'Any one actor.'],
    ['astronaut-draw', 'Please draw ___ astronaut.', 'astronaut', null, 'Any one astronaut.'],
    ['hour-have', 'We have ___ hour before lunch.', 'hour', null, 'One hour of time.'],
    ['honest-person-need', 'We need ___ honest person to count the votes.', 'honest person', null, 'Any one honest person.']
  ];
  const THE = [
    ['dog-bark', '___ dog is barking.', 'dog', 'dog', 'One dog is by the gate.'],
    ['ball-pick', 'Please pick up ___ ball.', 'ball', 'ball', 'That ball on the floor.'],
    ['pencil-sharpen', 'Please sharpen ___ pencil.', 'pencil', 'pencil', 'Our only pencil.'],
    ['hat-hang', 'Please hang up ___ hat.', 'hat', 'hat', 'That hat in my hand.'],
    ['apple-wash', 'Please wash ___ apple.', 'apple', 'apple', 'That apple on your plate.'],
    ['orange-peel', 'Please peel ___ orange.', 'orange', 'orange', 'That orange in your lunchbox.'],
    ['shirt-wet', '___ shirt is still wet.', 'shirt', 'shirt', 'The shirt I just washed.'],
    ['bike-lock', 'Please lock ___ bike.', 'bike', 'bike', 'Our only bike.'],
    ['book-owner', '___ book on my desk belongs to Mia.', 'book', 'book', 'The only book on my desk.'],
    ['door-close', 'Please close ___ door.', 'door', null, 'The only door in this room.'],
    ['window-open', 'Please open ___ window.', 'window', null, 'That window I am pointing to.'],
    ['moon-round', '___ moon looks round tonight.', 'moon', null, 'Our moon.'],
    ['bus-wait', '___ bus is waiting for us.', 'bus', 'bus', 'The bus booked for our class.']
  ];
  // [stable key, sentence, noun, artwork, plural?]
  const ZERO = [
    ['rice-eat', 'I eat ___ rice with vegetables.', 'rice', null, false],
    ['bread-breakfast', 'We eat ___ bread for breakfast.', 'bread', 'bread', false],
    ['cheese-like', 'She likes ___ cheese.', 'cheese', 'cheese', false],
    ['juice-breakfast', 'He drinks ___ juice with breakfast.', 'juice', 'juice', false],
    ['music-enjoy', 'We enjoy ___ music.', 'music', null, false],
    ['snow-cold', '___ snow is cold.', 'snow', null, false],
    ['honey-sweet', '___ honey tastes sweet.', 'honey', null, false],
    ['sand-castles', 'Children can build castles with ___ sand.', 'sand', null, false],
    ['apples-grow', '___ apples grow on trees.', 'apples', null, true],
    ['dogs-exercise', '___ dogs need exercise.', 'dogs', null, true],
    ['books-stories', '___ books can tell stories.', 'books', null, true],
    ['birds-feathers', '___ birds have feathers.', 'birds', null, true],
    ['grapes-grow', '___ grapes grow in bunches.', 'grapes', 'grapes', true]
  ];
  // [stable key, full sentence, subject, matching artwork or null, image noun]
  const BE = {
    am: [
      ['i-happy', 'I ___ happy today.', 'I'],
      ['i-tired', 'I ___ tired after the game.', 'I'],
      ['i-hungry', 'I ___ hungry now.', 'I'],
      ['i-thirsty', 'I ___ thirsty after our walk.', 'I'],
      ['i-age', 'I ___ six years old.', 'I'],
      ['i-classroom', 'I ___ in the classroom.', 'I'],
      ['i-park', 'I ___ at the park.', 'I'],
      ['i-window', 'I ___ near the window.', 'I'],
      ['i-classmate', 'I ___ your new classmate.', 'I'],
      ['i-first', 'I ___ the first in line.', 'I'],
      ['i-drawing', 'I ___ good at drawing.', 'I'],
      ['i-thunder', 'I ___ afraid of thunder.', 'I'],
      ['i-proud', 'I ___ proud of my work.', 'I'],
      ['i-trip', 'I ___ excited about the trip.', 'I'],
      ['i-sorry', 'I ___ sorry for being late.', 'I'],
      ['i-member', 'I ___ a member of the team.', 'I'],
      ['i-team', 'I ___ on the blue team.', 'I']
    ],
    is: [
      ['he-brother', 'He ___ my brother.', 'He'],
      ['she-teacher', 'She ___ our teacher.', 'She'],
      ['it-sunny', 'It ___ a sunny day.', 'It'],
      ['mia-library', 'Mia ___ at the library.', 'Mia'],
      ['tom-age', 'Tom ___ ten years old.', 'Tom'],
      ['sister-swimming', 'My sister ___ good at swimming.', 'My sister'],
      ['cat-table', 'The cat ___ under the table.', 'The cat', 'cat', 'cat'],
      ['dog-door', 'The dog ___ beside the door.', 'The dog', 'dog', 'dog'],
      ['book-interesting', 'This book ___ interesting.', 'This book', 'book', 'book'],
      ['banana-ripe', 'That banana ___ ripe.', 'That banana', 'banana', 'banana'],
      ['pencil-desk', 'My pencil ___ on the desk.', 'My pencil', 'pencil', 'pencil'],
      ['bus-late', 'The bus ___ late today.', 'The bus', 'bus', 'bus'],
      ['classroom-clean', 'Our classroom ___ clean.', 'Our classroom'],
      ['ball-box', 'The ball ___ in the box.', 'The ball', 'ball', 'ball'],
      ['rabbit-quiet', 'The rabbit ___ quiet.', 'The rabbit', 'rabbit', 'rabbit'],
      ['milk-cold', 'The milk ___ cold.', 'The milk', 'milk', 'milk'],
      ['bird-fence', 'One bird ___ on the fence.', 'One bird', 'bird', 'bird']
    ],
    are: [
      ['you-welcome', 'You ___ welcome here.', 'You'],
      ['we-class', 'We ___ in the same class.', 'We'],
      ['they-playground', 'They ___ at the playground.', 'They'],
      ['you-helpful', 'You ___ very helpful.', 'You'],
      ['we-show', 'We ___ excited about the show.', 'We'],
      ['they-team', 'They ___ on the red team.', 'They'],
      ['friends-outside', 'My friends ___ outside.', 'My friends'],
      ['cats-hungry', 'The cats ___ hungry.', 'The cats'],
      ['dogs-garden', 'The dogs ___ in the garden.', 'The dogs'],
      ['books-shelf', 'These books ___ on the shelf.', 'These books'],
      ['apples-sweet', 'Those apples ___ sweet.', 'Those apples'],
      ['flowers-beautiful', 'The flowers ___ beautiful.', 'The flowers'],
      ['shoes-bed', 'My shoes ___ by the bed.', 'My shoes', 'shoes', 'shoes'],
      ['birds-tree', 'Two birds ___ in the tree.', 'Two birds'],
      ['mia-tom-partners', 'Mia and Tom ___ partners.', 'Mia and Tom'],
      ['brother-i-home', 'My brother and I ___ at home.', 'My brother and I'],
      ['children-lunch', 'The children ___ ready for lunch.', 'The children']
    ]
  };

  const capitalize = text => text[0].toUpperCase() + text.slice(1);
  function articleItem(activity, label, row) {
    const [key, sentence, noun, art, context] = row;
    const vowel = label === 'an', definite = label === 'the';
    return {
      id: 'local-' + activity + '-' + label + '-' + key,
      categoryId: label, sentence, answerText: label, word: noun, keyword: noun,
      art, imageAlt: art ? noun : '', context: activity === 'articles-two' ? '' : context,
      hint: definite ? 'Which ' + noun + ' do we mean?' : 'Listen to the first sound in ' + noun + '.',
      explanation: definite ? 'The context identifies which ' + noun + ' we mean. Use the.'
        : capitalize(noun) + ' begins with a ' + (vowel ? 'vowel' : 'consonant') + ' sound. Use ' + label + ' for one, not a specific one.',
      archiveText: label + ' ' + noun, type: 'sentence-gap'
    };
  }
  function zeroItem(row) {
    const [key, sentence, noun, art, plural] = row;
    return {
      id: 'local-articles-four-zero-' + key, categoryId: 'zero', sentence, answerText: '',
      word: noun, keyword: noun, art, imageAlt: art ? noun : '', context: capitalize(noun) + ' in general.',
      hint: 'Do we mean ' + noun + ' in general, or some particular ' + noun + '?',
      explanation: (plural ? '"' + noun + '" is plural' : capitalize(noun) + ' is uncountable') + ' here. We mean ' + noun + ' in general, so no article is needed.',
      archiveText: noun, type: 'sentence-gap'
    };
  }
  function beItem(label, row) {
    const [key, sentence, subject, art = null, imageAlt = ''] = row;
    return {
      id: 'local-be-three-' + label + '-' + key, categoryId: label, sentence, answerText: label,
      word: subject + ' ' + label, keyword: subject + ' ' + label, art, imageAlt, context: '',
      hint: 'Look at the subject: ' + subject + '.',
      explanation: label === 'am' ? 'Use am with I.' : label === 'is'
        ? 'Use is with ' + subject + ': one person or thing.'
        : 'Use are with ' + subject + '.',
      archiveText: subject + ' ' + label, type: 'sentence-gap'
    };
  }
  const two = { a: A.map(row => articleItem('articles-two', 'a', row)), an: AN.map(row => articleItem('articles-two', 'an', row)) };
  const four = { a: A.map(row => articleItem('articles-four', 'a', row)), an: AN.map(row => articleItem('articles-four', 'an', row)), the: THE.map(row => articleItem('articles-four', 'the', row)), 'Ø': ZERO.map(zeroItem) };
  const be = Object.fromEntries(Object.entries(BE).map(([label, rows]) => [label, rows.map(row => beItem(label, row))]));
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  return freeze({ 'articles-two': two, 'articles-four': four, 'be-three': be });
});
