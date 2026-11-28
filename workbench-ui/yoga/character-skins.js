// Landmarks are traced in the coordinate system of the supplied character turnarounds.
// The returned skin uses the bottom of the torso as its origin and a 150-unit standing height.
(function (root, factory) {
  const library = factory();
  if (typeof module === 'object' && module.exports) module.exports = library;
  else root.YogaCharacterSkins = library;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  function line(d, width, color) {
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + width +
      '" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  function oval(x, y, rx, ry, color, border, width) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry +
      '" fill="' + color + '"' + (border ? ' stroke="' + border + '" stroke-width="' + width + '"' : '') + '/>';
  }

  function eyes(points, radius, ink, resting) {
    return points.map(function ([x, y]) {
      if (!resting) return oval(x, y, radius, radius * 1.03, ink);
      const reach = radius * 1.15;
      return line('M' + (x - reach) + ' ' + y + 'q' + reach + ' ' + (radius * 1.1) +
        ' ' + reach * 2 + ' 0', Math.max(1.2, radius * 0.56), ink);
    }).join('');
  }

  const skins = {
    Poppy: {
      fill: '#FDADB3', ink: '#4E4142', stroke: 1.85, scale: 150 / 219,
      arm: [14, 39, 35], leg: [13, 37, 36], shoe: [29, 5.7, 7.6], handSize: 1.02,
      front: {
        origin: [362, 208], top: 72, shoulders: [[307, 152], [417, 152]], hips: [[353.5, 205], [370.5, 205]],
        path: 'M334 90 C345 66 379 65 391 90 C407 88 420 99 424 112 C437 117 444 126 443 138 C453 143 460 155 460 166 C461 184 447 196 432 196 C426 198 421 196 417 194 Q406 203 390 198 C376 212 350 214 334 198 Q317 204 305 196 C284 201 265 185 264 169 C262 155 269 143 282 138 C280 125 288 117 301 111 C304 99 319 88 334 90Z',
        face(resting) {
          return line('M286 163Q284 174 292 182 M339 180Q345 195 360 190 M396 186Q411 189 414 176 M434 151Q443 164 435 174', 2.1, '#D78690') +
            eyes([[345.6,112.7],[375.8,112.7]],3.4,'#43393A',resting) +
            line('M348.6 129.9Q361.7 136.2 375.3 130.0',1.8,'#593A3D');
        }
      },
      side: {
        origin: [902, 211], top: 70, shoulders: [[898,145],[908,145]], hips: [[899,206],[903,206]],
        path: 'M849 128 C848 110 855 88 869 78 C882 67 901 68 913 76 Q923 82 925 94 C941 94 950 105 947 128 C957 136 961 146 958 158 Q955 177 936 183 C933 198 918 211 900 211 C884 211 871 201 867 187 C852 180 847 169 852 149 Q849 139 849 128Z',
        face(resting) {
          return line('M887 82Q900 77 905 90 M919 110Q932 112 930 125 M938 140Q948 153 939 160 M861 160Q860 170 868 175 M883 171Q887 180 895 180',1.9,'#D78690') +
            eyes([[859.6,111]],3.2,'#43393A',resting) + line('M850 135Q859 136 864 132.8',1.7,'#593A3D');
        }
      }
    },
    Edi: {
      fill: '#6CCBE3', ink: '#39494C', stroke: 1.9, scale: 150 / 257,
      arm: [14.5, 37, 34], leg: [15, 34, 32], shoe: [28, 6.6, 6.7], handSize: 1.02,
      front: {
        origin: [358, 583], top: 401, shoulders: [[316,515], [400,515]], hips: [[338.5,580],[373.5,580]],
        path: 'M302 419 C303 404 315 401.5 331 401.5 L391 401.7 Q416 401 421 414 C426 428 424 450 419 460 C414 473 405 480 393 486 C385 490 381 496 388 502 C399 510 410 515 416 529 Q423 541 421 560 C420 575 416 580 405 581 C384 584 335 584 316 582 C303 581 298 575 297 563 C293 550 296 536 303 525 C311 514 326 505 333 499 Q341 491 330 484 C310 471 300 456 301.5 430Z',
        face(resting) {
          const wire = '#41656E';
          return line('M307 429Q317 419 326 426 M354 427L366 427 M396 426Q407 418 416 430',1.05,wire) +
            oval(341.5,427.5,15,15.7,'#E9F7FA',wire,1.15) + oval(381.3,427.6,14.9,15.5,'#E9F7FA',wire,1.15) +
            eyes([[344.5,427.7],[379.4,427.6]],2.8,'#303A41',resting) + line('M351 447.6Q361.4 455.5 371.9 447.4',1.3,'#2D6572');
        }
      },
      side: {
        origin: [893, 584], top: 401, shoulders: [[887,521],[896,521]], hips: [[888,580],[895,580]],
        path: 'M850 422 C852 406 859 402 875 401.5 L920 401.8 Q944 402 949 417 C951 429 952 447 948 458 Q944 475 925 485 C913 491 911 495 915 505 C922 518 938 530 942 545 Q949 575 933 580 Q918 585 890 584 Q856 584 850 574 C839 555 847 534 859 519 C872 503 885 494 869 485 C851 475 846 458 847 439Z',
        face(resting) {
          const wire='#41656E';
          return line('M867 427Q884 420 894 431',1,wire) + oval(845.2,430.4,3.1,10.5,'#E9F7FA',wire,.95) +
            oval(857.7,430.7,8.6,14,'#E9F7FA',wire,1.15) + eyes([[857.8,431]],2.4,'#303A41',resting) +
            line('M848.5 454Q855 455 860 449',1.4,'#2D6572');
        }
      }
    },
    Rolly: {
      fill: '#F55826', ink: '#523D36', stroke: 2.05, scale: 150 / 246,
      arm: [12.5, 46.5, 46.5], leg: [13.5, 48.5, 47], shoe: [29, 6.2, 7.2], handSize: 1,
      front: {
        origin: [361, 919], top: 779, shoulders: [[301,859],[422,859]], hips: [[347.5,914],[375.5,914]],
        path: 'M323 779 L361 786 C399 786 428 811 428 849 C430 884 408 913 370 918 C333 923 300 899 295 867 C291 837 302 810 326 798Z',
        face(resting) {
          return eyes([[346.3,820.2],[376.1,820.4]],3.4,'#443831',resting) +
            line('M332.4 838.2Q361.4 851.2 390.2 838.2',2.1,'#743820');
        }
      },
      side: {
        origin: [887, 918], top: 779, shoulders: [[881,859],[887,859]], hips: [[885,914],[890,914]],
        path: 'M899.8 779 L899.6 788 C926 793 946 817 948 845 C951 878 935 907 904 915 C873 923 844 911 828 888 C812 866 813 836 827 814 C837 798 853 789 872 786Z',
        face(resting) {
          return eyes([[833,824.7]],3.1,'#443831',resting) + line('M817 848Q832 849 842 843',1.7,'#743820');
        }
      }
    },
    Milo: {
      fill: '#F1A74C', ink: '#544535', stroke: 1.95, scale: 150 / 312,
      arm: [14.5, 45, 42], leg: [13.5, 35, 35], shoe: [28, 6.6, 7.1], handSize: 1.05,
      front: {
        origin: [361,1387], top: 1151, shoulders: [[297,1280],[425,1280]], hips: [[348.5,1381],[372,1381]],
        path: 'M316 1194 C316 1171 334 1152 360 1151.5 C384 1151 405 1169 407 1193 C408 1215 409 1228 418 1245 C432 1273 441 1295 437 1321 C434 1355 410 1383 371 1386 C333 1390 303 1371 291 1342 C278 1314 283 1286 296 1260 C311 1230 314 1220 316 1194Z',
        face(resting) {
          const wire='#423B31';
          return line('M308.5 1202Q317 1191.7 326.4 1197 M354.7 1198.5H365 M394 1197.5Q405 1189.5 412 1202',1.9,wire) +
            oval(341,1199,14.5,14.8,'#FAF9F2',wire,1.95) + oval(379.5,1199.2,14.6,14.7,'#FAF9F2',wire,1.95) +
            eyes([[342.7,1199.5],[377.5,1199.8]],2.8,'#3E3932',resting) +
            line('M348.3 1217.4Q361.3 1224.7 374.6 1217.4',1.65,'#6C421A') +
            line('M303.5 1345.3Q310.2 1358 322.5 1365.6',1.65,'#7A4F29');
        }
      },
      side: {
        origin: [900,1388], top: 1151, shoulders: [[891,1268],[899,1268]], hips: [[897,1382],[904,1382]],
        path: 'M852 1195 C851 1174 866 1153 894 1151.5 C922 1150 944 1169 944 1200 C944 1221 947 1235 960 1255 C974 1279 980 1306 972 1334 C965 1364 944 1384 912 1387 C877 1391 846 1375 832 1349 C815 1320 819 1288 833 1260 C843 1240 850 1226 852 1209Z',
        face(resting) {
          const wire='#423B31';
          return line('M866 1200Q884 1192.6 899 1203.5',1.55,wire) +
            oval(846.7,1203.3,5.2,13.8,'#FAF9F2',wire,1.5) + oval(858.6,1203.2,9,14.2,'#FAF9F2',wire,1.6) +
            eyes([[857.3,1203.4]],2.5,'#3E3932',resting) + line('M851 1225Q859 1225 865 1221.4',1.6,'#6C421A');
        }
      }
    },
    Ace: {
      fill: '#B293DC', ink: '#493E52', stroke: 2.05, scale: 150 / 218,
      arm: [13, 38, 38], leg: [17.4, 18, 18], shoe: [33, 17, 16], handSize: .96,
      front: {
        origin: [368,1758], top: 1579, shoulders: [[307,1651],[429,1651]], hips: [[344.4,1733.5],[392,1733.5]],
        path: 'M360.4 1584 Q366.8 1574.3 373.6 1583.7 L391.2 1604.1 L415.8 1598.6 Q426 1596.6 426.2 1607.2 L426.5 1630.8 L448.8 1640.3 Q457.4 1644.1 452.5 1652.7 L439.5 1674 L452.5 1692.5 Q457.2 1700 448.5 1703.2 L427.2 1711 L426.3 1733.9 Q426.4 1746.2 416.7 1745 L392.4 1740.5 L375.3 1754.9 Q368.6 1762 361.3 1754.8 L345.7 1740.8 L320.2 1744.7 Q311.1 1745.6 311.1 1735.2 L310.4 1711.5 L287.4 1703 Q279.2 1700.6 282.5 1693.8 L294 1673.5 L281.9 1652.6 Q277 1644.9 285.3 1640.9 L309.6 1630.5 L309.6 1607.2 Q309.3 1597.5 319.3 1599 L345.3 1603.6Z',
        face(resting) {
          return eyes([[352.9,1626.4],[382.7,1626.4]],3.65,'#423646',resting) +
            line('M338.7 1644.4Q367.6 1657.3 397.1 1644.3',1.95,'#4E375C');
        }
      },
      side: {
        origin: [896,1752], top: 1587, shoulders: [[887,1661],[896,1661]], hips: [[890,1738],[900,1738]],
        path: 'M883 1592 Q891 1581.7 898 1591.8 L908 1603.7 Q920.3 1597.5 925.5 1609 L937 1633.7 Q951.8 1661.5 946.5 1690.2 Q942.8 1710 936 1723 L934 1738.2 Q934 1748.9 926.2 1748.8 L914.2 1744.1 Q898 1752.6 883.7 1748 L865.5 1753 Q859.4 1755 858.8 1748 L855.2 1726.4 Q843.6 1712 841.3 1692 Q837.8 1651.1 857.5 1620.4Z',
        face(resting) {
          return line('M887.8 1611.8L908.7 1603.6 M903.3 1634.3L927 1645.2Q934.4 1649.1 930.6 1656.8L921.8 1674.4Q919.1 1678 924 1687.3L929.2 1698Q932 1703.2 925.6 1706.4L908.2 1713.2',1.65,'#654C77') +
            eyes([[859.5,1633.6]],3.6,'#423646',resting) + line('M842.3 1659.7Q854.3 1659.5 865.4 1653.5',1.7,'#4E375C');
        }
      }
    }
  };

  function makeBody(profile, design, resting) {
    return '<g transform="scale(' + design.scale + ') translate(' + (-profile.origin[0]) + ' ' + (-profile.origin[1]) + ')">' +
      '<path d="' + profile.path + '" fill="' + design.fill + '" stroke="' + design.ink + '" stroke-width="' +
      design.stroke + '" stroke-linejoin="round"/>' + profile.face(resting) + '</g>';
  }

  function makeHand(armWidth, outline, design) {
    // The sheet's left hand: the thumb points in towards the body. The wrist has an open seam.
    const scale = armWidth / 13 * design.handSize;
    return '<g transform="scale(' + scale + ')"><path d="M-5.8 -3 Q-6.1 .2 -8.1 4.8 L-9.8 12 Q-10.3 15.5 -8.5 16.1 Q-6.7 16.7 -5.4 12.7 L-4.2 9.8 L-5 16 Q-5.2 19 -3.1 19.2 Q-.9 19.3 -.4 16 L.4 11.3 L.4 16.9 Q.5 19.7 2.5 19.7 Q4.7 19.5 4.8 16.6 L5 11.2 L6.7 15.4 Q7.8 18.1 9.5 17.1 Q11 16.3 10.2 13.8 L8.1 7.7 L10.7 9.5 Q13.2 11.2 14.5 9.5 Q15.9 7.7 13.4 5.5 L7.2 .5 Q5.8 -.6 5.7 -3" fill="' +
      design.fill + '" stroke="' + design.ink + '" stroke-width="' + outline / scale + '" stroke-linecap="round" stroke-linejoin="round"/></g>';
  }

  function makePrayerHand(armWidth, outline, design) {
    // Edge-on palm with the four fingers together and the thumb folded towards the chest.
    const scale = armWidth / 13 * design.handSize;
    return '<g transform="scale(' + scale + ')"><path d="M-5.7 -3.4 Q-5.8 .7 -4.7 5 L-2.8 14.6 Q-2.3 17.4 -.3 17.5 Q1.7 17.7 2.2 15.1 L2.7 8.9 Q4.3 11 5.8 9.7 Q7.2 8.5 6.4 6.1 L5.7 2.2 L5.7 -3.4" fill="' +
      design.fill + '" stroke="' + design.ink + '" stroke-width="' + outline / scale + '" stroke-linecap="round" stroke-linejoin="round"/></g>';
  }

  function makeFoot(id, design, legWidth) {
    const [toe, heel, depth] = design.shoe;
    // The ankle joins a low oblong shoe. Ace has the larger oval feet seen on the sheet.
    const path = id === 'Ace'
      ? 'M-8.4 -4.3 C-17.4 -7.7 -30.8 -3.5 -32.3 5.6 C-34.3 16.8 -27 21.4 -10 21.7 C7.5 22.3 16.6 19.8 16.6 10.9 Q16.8 .7 8.1 -3.1'
      : 'M' + (-legWidth/2) + ' -3.3 L' + (-toe*0.57) + ' -3.3 C' + (-toe*0.87) + ' -3.3 ' + (-toe) + ' .1 ' + (-toe) + ' ' + (depth*.45) +
        ' Q' + (-toe) + ' ' + depth + ' ' + (-toe*.59) + ' ' + depth + ' H' + (heel*.38) +
        ' Q' + heel + ' ' + depth + ' ' + heel + ' ' + (depth*.5) + ' L' + (legWidth/2) + ' -4.5';
    return '<g transform="scale(' + design.scale + ')"><path d="' + path + '" fill="' + design.fill + '" stroke="' + design.ink +
      '" stroke-width="' + design.stroke + '" stroke-linecap="round" stroke-linejoin="round"/></g>';
  }

  const cache = new Map();
  function getSkin(id, view) {
    const key = Object.keys(skins).find(name => name.toLowerCase() === String(id).toLowerCase());
    if (!key) return null;
    const angle = view === 'side' ? 'side' : 'front';
    const cacheKey = key + '/' + angle;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const design = skins[key];
    const profile = design[angle];
    const s = design.scale;
    const arm = profile.arm || design.arm;
    const leg = design.leg;
    const outline = design.stroke * s;
    const anchors = points => points.map(([x,y]) => [(x-profile.origin[0])*s,(y-profile.origin[1])*s]);
    const skin = {
      id: key, view: angle, fill: design.fill, ink: design.ink, outline,
      shoulders: anchors(profile.shoulders), hips: anchors(profile.hips),
      armLengths: arm.slice(1).map(n => n*s), legLengths: leg.slice(1).map(n => n*s),
      armWidth: arm[0]*s, legWidth: leg[0]*s, bodyHeight: (profile.origin[1]-profile.top)*s,
      body: makeBody(profile, design, false), restingBody: makeBody(profile, design, true),
      hand: makeHand(arm[0]*s, outline, design), prayerHand: makePrayerHand(arm[0]*s, outline, design),
      foot: makeFoot(key, design, leg[0]),
      footDepth: (key === 'Ace' ? 21.8 : design.shoe[2])*s, footToeX: design.shoe[0]*s
    };
    cache.set(cacheKey, skin);
    return skin;
  }

  return { getSkin, ids: Object.freeze(Object.keys(skins)) };
});
