(() => {
  'use strict';

  const ink = '#493a35';
  const skin = '#efb080';
  const shirt = '#4f9d83';
  const normal = {
    hip: [60, 70], lean: 0,
    hands: [[-18, 1], [18, 1]], feet: [[48, 104], [72, 104]]
  };
  // Hands are in torso space. Feet are on the stage so a supporting foot stays planted.
  const moves = {
    squat:   [{}, {hip:[60,87], hands:[[-42,-15],[42,-15]]}],
    sidebend:[{hands:[[-18,1],[31,-14]]}, {hip:[61,70], lean:-28, hands:[[-20,4],[7,-56]]}],
    balance: [{}, {hip:[55,70], lean:-4, hands:[[-47,-23],[47,-23]], feet:[[48,104],[62,84]]}],
    armsup:  [{}, {hands:[[-22,-60],[22,-60]]}],
    cook:    [{hands:[[-10,-9],[23,-20]]}, {lean:3, hands:[[-10,-9],[9,-14]]}],
    films:   [{hands:[[-9,-8],[0,-10]]}, {hands:[[-9,-8],[5,-33]]}],
    chess:   [{hands:[[-11,-4],[16,-12]]}, {lean:8, hands:[[-9,-4],[26,-4]]}],
    hiking:  [{hip:[58,70], lean:7, hands:[[-17,-13],[22,-22]], feet:[[51,104],[70,96]]},
              {hip:[61,70], lean:9, hands:[[-25,-7],[18,-28]], feet:[[42,96],[73,104]]}],
    picnic:  [{hands:[[-18,-2],[21,-9]]}, {lean:3, hands:[[-19,-4],[27,-19]]}],
    football:[{hip:[56,70], hands:[[-23,-18],[22,-20]], feet:[[49,104],[61,92]]},
              {hip:[55,70], lean:-7, hands:[[-32,-25],[27,-27]], feet:[[49,104],[85,84]]}],
    bike:    [{hip:[54,72], lean:12, hands:[[13,-18],[25,-16]], feet:[[60,92],[53,104]]},
              {hip:[54,73], lean:15, hands:[[13,-18],[25,-16]], feet:[[57,104],[64,92]]}],
    draw:    [{hands:[[-5,-10],[13,-15]]}, {lean:4, hands:[[-5,-10],[3,-12]]}],
    swim:    [{hands:[[-8,-47],[21,-3]],feet:[[50,103],[75,95]]},
              {hands:[[-26,-12],[14,-47]],feet:[[43,94],[68,104]]}],
    read:    [{hands:[[-13,-12],[15,-9]]}, {lean:4, hands:[[-13,-12],[4,-17]]}]
  };
  const activities = {
    cook: ['cook','cooking'],
    films: ['watch films','watch a film','watch movies','watch a movie','watching films','watching movies'],
    chess: ['play chess','playing chess'],
    hiking: ['go hiking','going hiking','hike','hiking'],
    picnic: ['have a picnic','having a picnic','go on a picnic'],
    football: ['play football','playing football','play soccer','playing soccer'],
    bike: ['ride a bike','riding a bike','ride a bicycle','riding a bicycle','cycling'],
    draw: ['draw pictures','drawing pictures','draw a picture','drawing a picture','draw','drawing'],
    swim: ['swim','swimming','go swimming'],
    read: ['read books','reading books','read a book','reading a book']
  };
  const byText = new Map(Object.entries(activities).flatMap(([id, terms]) => terms.map(term => [term, id])));

  function activity(text) {
    return byText.get(String(text ?? '').trim().toLowerCase().replace(/[.!?]+$/, '').replace(/\s+/g, ' ')) ?? null;
  }

  const rad = Math.PI / 180;
  const rot = angle => 'rotate(' + angle.toFixed(2) + 'deg)';
  const shift = ([x,y]) => 'translate(' + x + 'px,' + y + 'px)';
  function joint(start, end, inside) {
    return '<g class="wc-joint" style="--wc-start:' + start + ';--wc-end:' + end + '">' + inside + '</g>';
  }
  function at(x,y, inside) { return '<g transform="translate(' + x + ' ' + y + ')">' + inside + '</g>'; }

  // A rigid two-link chain reaches the hand or shoe. The elbow and knee choose
  // opposite bend directions on the two sides of the figure.
  function angles(dx, dy, upper, lower, bend) {
    const distance = Math.max(Math.abs(upper - lower) + .01, Math.min(upper + lower - .01, Math.hypot(dx,dy)));
    const elbow = bend * Math.acos((distance ** 2 - upper ** 2 - lower ** 2) / (2 * upper * lower));
    const shoulder = Math.atan2(-dx,dy) - Math.atan2(lower * Math.sin(elbow), upper + lower * Math.cos(elbow));
    return [shoulder / rad, elbow / rad];
  }
  function rotation(from, to, inside) {
    const delta = ((to - from + 540) % 360) - 180;
    return joint(rot(from), rot(from + delta), inside);
  }
  function segment(length, width, color) {
    const line = '<path d="M0 0V' + length + '"';
    return line + ' stroke="' + ink + '" stroke-width="' + (width+3) + '"/>' +
      line + ' stroke="' + color + '" stroke-width="' + width + '"/>';
  }

  // The grip point of each prop is its local origin.
  const prop = {
    pan: '<path d="M0 1l13 6" fill="none" stroke="#614733" stroke-width="4"/><path d="M10 4q11-3 23 1l-4 7q-12 6-19-8Z" fill="#65888c"/><path d="M13 5q8-3 17 0" fill="none" stroke="#fdeac6"/>',
    spoon: '<path d="M0 0l-3 13" stroke="#805632" stroke-width="3"/><ellipse cx="-4" cy="15" rx="3" ry="4.5" fill="#d6a366"/>',
    popcorn: '<path d="M-2 0l2 13h13l3-13Z" fill="#fff0d3"/><path d="m2 2 2 9m5-9v9" stroke="#d96b52" stroke-width="2.4"/><path d="M-3 1q-2-5 3-5 1-6 6-3 5-4 7 2 6-1 5 5Z" fill="#ffda80"/>',
    kernel:'<circle r="2.6" fill="#ffd276"/>',
    pawn:'<path d="M0 1q-3 0-2 3l-2 3h9L2 4q1-3-2-3Z" fill="#854c39"/><circle cy="-1" r="2.6" fill="#ce835a"/>',
    pole:'<path d="M0-3l-5 42" stroke="#815a37" stroke-width="2.6"/><path d="m-3 35 5 1" stroke="#52644a"/>',
    basket:'<path d="M-10 8Q-8-4 0 0q9-3 11 8" fill="none" stroke="#8f6136" stroke-width="2.5"/><path d="M-12 7h25l-3 13H-8Z" fill="#d89a53"/><path d="M-8 9H9l-3 5-5-3-5 3Z" fill="#f5c67c"/>',
    apple:'<path d="M-1-3q-5-4-7 1-1 7 6 9 6-1 7-7 0-5-6-3Z" fill="#db684e"/><path d="M-1-3q0-5 4-5" fill="none" stroke="#52784a"/>',
    pad:'<path d="m0-13 22 3-4 25-21-4Z" fill="#fff2cd"/><path d="m3 2 5-6 3 6 5-2" fill="none" stroke="#679581"/>',
    pencil:'<path d="m0-3 5-6 2 2-10 13-2 1Z" fill="#efaa45"/>',
    book:'<path d="M-1-6q7-3 15 1 8-5 16-3l-1 17q-8-1-15 3-7-3-15-2Z" fill="#eab96f"/><path d="M0-8q7-2 14 2 7-5 15-4v16q-9 0-15 4Q8 6 0 7Z" fill="#fff4d9"/><path d="m14-5 .2 14" fill="none" stroke="#bf9460"/>'
  };
  const handProps = {
    cook:['pan','spoon'], films:['popcorn','kernel'], chess:[null,'pawn'],
    hiking:[null,'pole'], picnic:['basket','apple'], draw:['pad','pencil'], read:['book',null]
  };
  const boot = '<path d="M-4-2q3 2 6 0l5 2q4 2 2 5H-5q-2-3 1-7Z" fill="#a76b43"/><path d="M-5 4H9" stroke="#f7e4b3" stroke-width="2.2"/>';
  function limb(type, i, poses, move) {
    const arm = type === 'arm';
    const sign = i === 0 ? -1 : 1;
    const x = (arm ? 10 : 6) * sign, y = arm ? -23 : 0;
    const upper = arm ? 18.8 : 18, lower = arm ? 18.2 : 17;
    const bend = arm && move === 'sidebend' && i === 1 ? -1 : sign;
    const joints = poses.map(p => {
      const [tx,ty] = arm ? p.hands[i] : p.feet[i];
      return angles(tx - x - (arm ? 0 : p.hip[0]), ty - y - (arm ? 0 : p.hip[1]), upper, lower, bend);
    });
    const [[a,b],[c,d]] = joints;
    let attachment;
    if (arm) {
      const object = prop[handProps[move]?.[i]] || '';
      const grip = '<circle cx="0" cy="0" r="3.9" fill="' + skin + '"/>';
      attachment = rotation(-a-b-poses[0].lean,-c-d-poses[1].lean, object + grip);
    } else {
      const shoe = i === 0 ? '<g transform="scale(-1 1)">' + boot + '</g>' : boot;
      attachment = rotation(-a-b,-c-d,shoe);
    }
    const distal = segment(lower, arm ? 5.8 : 7.8, arm ? skin : '#69786c') + at(0,lower,attachment);
    // Round overlapping limb ends form the elbows and knees, without visible hinge pins.
    const upperSkin = arm ? segment(upper,6.6,skin) + segment(5.8,9,shirt) : segment(upper,10.3,'#52685b');
    return at(x,y,rotation(a,c,upperSkin + at(0,upper,rotation(b,d,distal))));
  }

  const shirtAndScarf =
    '<path d="M-5-27q5 3 10 0l6 4 1 5-2 16q-10 3-20 0l-2-16 1-5Z" fill="' + shirt + '"/>' +
    '<path d="m-8-24 7 8 8-8-7 3Z" fill="#ffc259"/><path d="m-2-17 4-1 1 8-4-2Z" fill="#e89a43"/>' +
    '<path d="M-9-2q9 2 18 0" fill="none" stroke="#365d52" stroke-width="2.5"/>';
  const head =
    '<path d="M-4-31h8v6q-4 3-8 0Z" fill="' + skin + '"/>' +
    '<path d="M-11-37q-2-12 9-14 12-3 15 8l-1 8q-1 8-11 8-7 0-10-7-5 0-5-3t3-2Z" fill="#f3bc8d"/>' +
    '<path d="M-11-40q-2-8 8-10 11-2 15 5l-2 4-4-4q-4 5-11 4l-2 6-3-1Z" fill="#614030"/>' +
    '<path d="M-13-43q-1-9 8-12 11-3 15 6l1 5Z" fill="#d9ad62"/>' +
    '<path d="M-12-47q11-2 22 0l1 4h-24Z" fill="#507664"/>' +
    '<path d="M-15-44q12-3 29-1l2 3q-15 0-28 2-5 0-3-4Z" fill="#edc780"/>' +
    '<path d="M-4-37v1m9-1v1" stroke-width="2.3"/><path d="M-2-32q3 2 6-1" fill="none" stroke-width="1.4"/>';
  function scenery(move) {
    if (move === 'chess') return '<g><path d="m74 82 7-7h26l-2 7Z" fill="#f5d392"/><path d="M74 82h31v3H74Z" fill="#b48050"/><path d="M78 85v19m23-19v19" stroke="#8a6745" stroke-width="3"/><path d="m80 79 5-1m5 2 5-1m4-2h4" stroke="#88633e" stroke-width="2"/><path d="m95 75 1-4 3 4Z" fill="#654c46"/></g>';
    if (move === 'bike') return '<g fill="none"><circle cx="32" cy="90" r="16" stroke="#51675f" stroke-width="4"/><circle cx="88" cy="90" r="16" stroke="#51675f" stroke-width="4"/><path d="m32 90 19-22 12 22H32l44-17 12 17-11-31h-6M51 68l-2-4" stroke="#c76b43" stroke-width="3.8"/><path d="M44 63h12" stroke-width="4" stroke="#684938"/></g>';
    return '';
  }
  function foreground(move) {
    if (move === 'football') return joint(shift([0,0]), shift([12,-7]), at(88,100,
      '<circle r="7" fill="#fff7de"/><path d="m0-4 4 2-2 4-4-1-1-3Zm-6 5 2 3m8-6 2 2" fill="#405b50" stroke-width="1"/>'));
    if (move === 'swim') return '<path d="M7 83q6 6 12 0t12 0 12 0 12 0 12 0 12 0 12 0 12 0" fill="none" stroke="#659fa1" stroke-width="3"/>';
    return '';
  }
  function figure(move) {
    if (!Object.hasOwn(moves, move)) return '';
    const poses = moves[move].map(p => ({...normal,...p}));
    const [a,b] = poses;
    const torso = rotation(a.lean,b.lean,
      shirtAndScarf + head + limb('arm',0,poses,move) + limb('arm',1,poses,move));
    let coach = joint(shift(a.hip),shift(b.hip),limb('leg',1,poses,move) + limb('leg',0,poses,move) + torso);
    if (move === 'swim') coach = '<g transform="translate(57 75) rotate(65) translate(-60 -71)">' + coach + '</g>';
    return '<svg class="words-coach" data-coach-move="' + move + '" viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
      '<ellipse cx="60" cy="110" rx="29" ry="3" fill="#9c9e6c" opacity=".23"/>' +
      '<g stroke="' + ink + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      scenery(move) + coach + foreground(move) + '</g></svg>';
  }

  window.WordsCoach = Object.freeze({figure, activity});
})();
