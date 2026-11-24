/* Quantity-based island placement. Artwork stays attached to its stage ID. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StarlightMapLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const stageIds = ['lyrics', 'composer', 'echo', 'star'];
  const desktop = {
    1: { height:800, positions:[[600,520]], bends:[] },
    2: {
      height:800, positions:[[330,560],[880,350]],
      bends:[[[430,600,525,570,610,490],[710,415,750,335]]]
    },
    3: {
      height:800, positions:[[240,570],[600,360],[960,550]],
      bends:[
        [[320,600,440,560,430,460],[420,400,500,355]],
        [[700,355,765,385,775,445],[790,500,870,560]]
      ]
    }
  };
  const portrait = {
    1: { height:360, positions:[[210,150]], bends:[] },
    2: {
      height:620, positions:[[142,150],[284,430]],
      bends:[[[194,144,332,186,333,258],[335,320,298,346]]]
    },
    3: {
      height:900, positions:[[142,150],[284,430],[149,710]],
      bends:[
        [[194,144,332,186,333,258],[335,320,298,346]],
        [[219,425,98,456,79,521],[54,589,99,645]]
      ]
    }
  };
  const clone = value => JSON.parse(JSON.stringify(value));

  function layout(ids, mobile, baseLayout) {
    if (!Array.isArray(ids) || ids.some(id => !stageIds.includes(id)) || new Set(ids).size !== ids.length) {
      throw new TypeError('地图关卡必须是有效且不重复的关卡 ID。');
    }
    if (!baseLayout || !Array.isArray(baseLayout.stops)) throw new TypeError('缺少原始地图布局。');
    const source = new Map(baseLayout.stops.map(stop => [stop.id, stop]));
    if (ids.some(id => !source.has(id))) throw new TypeError('原始地图缺少所选关卡的尺寸。');
    // Keep the accepted four-island geometry byte-for-byte and object-for-object.
    if (ids.length === 4 && ids.every((id, index) => id === baseLayout.stops[index]?.id)) return baseLayout;
    if (!ids.length) return { ...clone(baseLayout), stops:[], bends:[], roadWidths:[], satellites:[] };
    if (ids.length === 4) {
      return {
        ...clone(baseLayout),
        stops:ids.map((id, index) => ({ ...clone(source.get(id)), x:baseLayout.stops[index].x, y:baseLayout.stops[index].y }))
      };
    }
    const template = (mobile ? portrait : desktop)[ids.length];
    const artworkScale = !mobile && ids.length === 2 ? 1.1 : 1;
    const round = value => Math.round(value * 100) / 100;
    return {
      width:mobile ? 420 : 1200,
      height:template.height,
      stops:ids.map((id, index) => {
        const original = source.get(id), [x, y] = template.positions[index];
        return { ...clone(original), id, x, y, size:round(original.size * artworkScale), terrain:round(original.terrain * artworkScale) };
      }),
      bends:clone(template.bends),
      roadWidths:Array.from({ length:ids.length - 1 }, () => mobile ? 28 : 30),
      satellites:[]
    };
  }

  return Object.freeze({ layout });
});
