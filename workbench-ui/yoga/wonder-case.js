/* Frozen local visual case: output/yoga-wonder-visual-v2-2-20261119.
 * Selected A (soft blue sky), all 11 original pages. Not an online user work.
 * Original English, poses and character crop metadata are retained verbatim;
 * asset paths are rebased, Chinese scene/teacher descriptions describe the existing art.
 * This module has no storage, audio, network or navigation side effects.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YogaWonderCase = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(deepFreeze);
      Object.freeze(value);
    }
    return value;
  }
  return deepFreeze({
  "templateId": "wonder-v2-2",
  "title": "A Walk in Wonder",
  "character": {
    "id": "wonder-blue",
    "name": "蓝色伙伴"
  },
  "settings": {
    "templateId": "wonder-v2-2",
    "title": "A Walk in Wonder",
    "theme": "自然漫步",
    "characterId": "wonder-blue"
  },
  "pages": [
    {
      "source": 0,
      "label": "启程",
      "heading": "<span>A Walk</span><span>in Wonder</span>",
      "caption": "",
      "sourceText": "A WALK IN WONDER",
      "pose": "",
      "kind": "cover",
      "background": "yoga-wonder-case/assets/p01-sky-a-soft-blue.png",
      "longCaption": false,
      "id": "wonder-page-01",
      "scene": "淡晴蓝天空下，金黄草甸与黄绿草坡之间的小路通向湖水和远山。",
      "teacher": "封面展示蓝色伙伴与自然旅程。",
      "shortText": "A WALK IN WONDER",
      "actionId": null,
      "focus": "",
      "character": {
        "path": "yoga-wonder-case/source-assets/image25.png",
        "dimensions_px": [
          633,
          633
        ],
        "visible_alpha_bbox_px": [
          99,
          56,
          514,
          592
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": false,
        "character_count": 1
      }
    },
    {
      "source": 1,
      "label": "发现草地",
      "heading": "<span>Green and soft</span><span>grass...</span>",
      "caption": "where am I? Let’s find out!",
      "sourceText": "Green and soft grass... where am I? Let’s find out!",
      "pose": "",
      "kind": "intro",
      "background": "yoga-wonder-case/assets/p02-grass-sky-blue.png",
      "longCaption": false,
      "id": "wonder-page-02",
      "scene": "淡晴蓝天空下，柔软的绿色草地上散落着白色小花。",
      "teacher": "蓝色伙伴站在柔软的草地上。",
      "shortText": "Green and soft grass... where am I? Let’s find out!",
      "actionId": null,
      "focus": "",
      "character": {
        "path": "yoga-wonder-case/source-assets/image28.png",
        "dimensions_px": [
          633,
          633
        ],
        "visible_alpha_bbox_px": [
          113,
          56,
          519,
          589
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": false,
        "character_count": 1
      }
    },
    {
      "source": 2,
      "label": "巨树与伸展",
      "heading": "<span>Upward</span><span>Salute</span>",
      "caption": "Oh! Look at those giant <mark>trees</mark>... reaching up to the sky!",
      "sourceText": "Oh! Look at those giant trees... reaching up to the sky!",
      "pose": "Upward Salute",
      "kind": "tall",
      "background": "yoga-wonder-case/assets/p03-tall-trees-sky-blue.png",
      "longCaption": false,
      "id": "wonder-page-03",
      "scene": "高大的树干和深浅绿色树冠围成森林，枝叶之间露出淡晴蓝天空。",
      "teacher": "蓝色伙伴静态展示 Upward Salute，双臂向上伸展。",
      "shortText": "Oh! Look at those giant trees... reaching up to the sky!",
      "actionId": "wonder-upward-salute",
      "focus": "trees",
      "character": {
        "path": "yoga-wonder-case/source-assets/image35.png",
        "dimensions_px": [
          600,
          600
        ],
        "visible_alpha_bbox_px": [
          172,
          45,
          437,
          553
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": false,
        "character_count": 1
      }
    },
    {
      "source": 3,
      "label": "森林与树式",
      "heading": "Tree Pose",
      "caption": "So many trees in this <mark>forest</mark>... each one a different shape!",
      "sourceText": "So many trees in this forest... each one a different shape!",
      "pose": "Tree Pose",
      "kind": "tree",
      "background": "yoga-wonder-case/assets/p04-tree-grove-sky-blue.png",
      "longCaption": false,
      "id": "wonder-page-04",
      "scene": "淡晴蓝天空下，不同形状的树木围着绿色草地与弯曲小路。",
      "teacher": "蓝色伙伴静态展示 Tree Pose，单脚站立，双臂向上。",
      "shortText": "So many trees in this forest... each one a different shape!",
      "actionId": "wonder-tree",
      "focus": "forest",
      "character": {
        "path": "yoga-wonder-case/source-assets/image38.png",
        "dimensions_px": [
          372,
          461
        ],
        "visible_alpha_bbox_px": [
          63,
          10,
          311,
          456
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": true,
        "character_count": 1
      }
    },
    {
      "source": 4,
      "label": "风与侧伸展",
      "heading": "Side Reach",
      "caption": "The wind is here! <mark>Leaves</mark> are falling... reach left, reach right!",
      "sourceText": "The wind is here! Leaves are falling... reach left, reach right!",
      "pose": "Side Reach",
      "kind": "side",
      "background": "yoga-wonder-case/assets/p05-windy-leaves-sky-blue.png",
      "longCaption": false,
      "id": "wonder-page-05",
      "scene": "淡晴蓝天空下，林间小路旁的叶子随风飘落。",
      "teacher": "蓝色伙伴静态展示 Side Reach，身体向一侧伸展。",
      "shortText": "The wind is here! Leaves are falling... reach left, reach right!",
      "actionId": "wonder-side-reach",
      "focus": "leaves",
      "character": {
        "path": "yoga-wonder-case/source-assets/image51.png",
        "dimensions_px": [
          615,
          615
        ],
        "visible_alpha_bbox_px": [
          81,
          92,
          520,
          540
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": false,
        "character_count": 1
      }
    },
    {
      "source": 5,
      "label": "岩石与平衡",
      "heading": "<span>Standing</span><span>Balance</span>",
      "caption": "A big <mark>rock</mark>! Can I balance on it like a <mark>mountain</mark> goat?",
      "sourceText": "A big rock! Can I balance on it like a mountain goat?",
      "pose": "Standing Balance",
      "kind": "rock",
      "background": "yoga-wonder-case/assets/p06-rock-sky-blue.png",
      "longCaption": false,
      "id": "wonder-page-06",
      "scene": "淡晴蓝天空下，林间小路旁立着一块大岩石，远处可见蓝紫色山峰。",
      "teacher": "蓝色伙伴静态展示 Standing Balance，单脚站立，双臂展开。",
      "shortText": "A big rock! Can I balance on it like a mountain goat?",
      "actionId": "wonder-standing-balance",
      "focus": "rock",
      "character": {
        "path": "yoga-wonder-case/source-assets/image53.png",
        "dimensions_px": [
          633,
          633
        ],
        "visible_alpha_bbox_px": [
          102,
          72,
          558,
          575
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": false,
        "character_count": 1
      }
    },
    {
      "source": 6,
      "label": "湖河与扭转",
      "heading": "<span>Seated Spinal</span><span>Twist</span>",
      "caption": "I see something sparkling... a <mark>lake</mark> and a <mark>river</mark>! Wiggle, wiggle, like the water...",
      "sourceText": "I see something sparkling... a lake and a river! Wiggle, wiggle, like the water...",
      "pose": "Seated Spinal Twist",
      "kind": "lake",
      "background": "yoga-wonder-case/assets/p07-lake-river-sky-blue.png",
      "longCaption": true,
      "id": "wonder-page-07",
      "scene": "淡晴蓝天空下，青蓝色湖河连接着沙色岸边，远处是树林与山峰。",
      "teacher": "蓝色伙伴静态展示 Seated Spinal Twist，坐姿转向一侧。",
      "shortText": "I see something sparkling... a lake and a river! Wiggle, wiggle, like the water...",
      "actionId": "wonder-seated-spinal-twist",
      "focus": "lake",
      "character": {
        "path": "yoga-wonder-case/source-assets/image62.png",
        "dimensions_px": [
          633,
          633
        ],
        "visible_alpha_bbox_px": [
          84,
          100,
          516,
          560
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": false,
        "character_count": 1
      }
    },
    {
      "source": 7,
      "label": "登上山顶",
      "heading": "Mountain Pose",
      "caption": "I climb up, up, up... I'm at the <mark>mountain</mark>! I can see everything!",
      "sourceText": "I climb up, up, up... I'm at the mountain! I can see everything!",
      "pose": "Mountain Pose",
      "kind": "mountain",
      "background": "yoga-wonder-case/assets/p08-mountain-sky-blue.png",
      "longCaption": false,
      "id": "wonder-page-08",
      "scene": "淡晴蓝天空下，山顶岩石平台前展开蓝紫色群山与蜿蜒水流。",
      "teacher": "蓝色伙伴静态展示 Mountain Pose，站立并将双手举过头顶。",
      "shortText": "I climb up, up, up... I'm at the mountain! I can see everything!",
      "actionId": "wonder-mountain",
      "focus": "mountain",
      "character": {
        "path": "yoga-wonder-case/source-assets/image67.png",
        "dimensions_px": [
          372,
          461
        ],
        "visible_alpha_bbox_px": [
          97,
          4,
          278,
          459
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": false,
        "character_count": 1
      }
    },
    {
      "source": 8,
      "label": "坐下感受大地",
      "heading": "Butterfly Pose",
      "caption": "My legs are tired... let me sit and feel the <mark>ground</mark>...",
      "sourceText": "My legs are tired... let me sit and feel the ground...",
      "pose": "Butterfly Pose",
      "kind": "ground",
      "background": "yoga-wonder-case/assets/p09-ground.png",
      "longCaption": false,
      "id": "wonder-page-09",
      "scene": "没有天空的近景地面，沙色空地四周围着青草、花朵、叶子与小石头。",
      "teacher": "蓝色伙伴静态展示 Butterfly Pose，坐姿屈膝，双脚相对。",
      "shortText": "My legs are tired... let me sit and feel the ground...",
      "actionId": "wonder-butterfly",
      "focus": "ground",
      "character": {
        "path": "yoga-wonder-case/source-assets/image74.png",
        "dimensions_px": [
          346,
          461
        ],
        "visible_alpha_bbox_px": [
          15,
          61,
          332,
          416
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": false,
        "character_count": 1
      }
    },
    {
      "source": 9,
      "label": "安静休息",
      "heading": "Savasana",
      "caption": "Time to rest. My body remembers the journey...",
      "sourceText": "Time to rest. My body remembers the journey...",
      "pose": "Savasana",
      "kind": "rest",
      "background": "yoga-wonder-case/assets/p10-rest-sky-blue.png",
      "longCaption": false,
      "id": "wonder-page-10",
      "scene": "淡晴蓝天空下，安静的湖畔有沙色空地，远处是蓝紫色山脉。",
      "teacher": "蓝色伙伴以原稿 Savasana 静态画面休息。",
      "shortText": "Time to rest. My body remembers the journey...",
      "actionId": "wonder-savasana",
      "focus": "rest",
      "character": {
        "path": "yoga-wonder-case/source-assets/image82.png",
        "dimensions_px": [
          1265,
          712
        ],
        "visible_alpha_bbox_px": [
          39,
          164,
          1202,
          657
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": false,
        "character_count": 3,
        "note": "Original source image contains pink, yellow and blue characters. PPTX crops its right-hand region through fillRect l=-185988, so only the blue character is displayed. Reproduce as a CSS viewport; do not alter the PNG or invent a new pose.",
        "original_display_crop": {
          "mechanism": "a:stretch/a:fillRect",
          "srcRect": null,
          "fillRect": {
            "l": -185988
          },
          "viewport_px": [
            243.8666666667,
            403.4666666667
          ],
          "rotation_degrees": 26.39965,
          "css_image": {
            "width": "285.988%",
            "left": "-185.988%",
            "height": "100%"
          },
          "source_visible_x_range_px": [
            822.6737485488902,
            1265.0
          ],
          "source_visible_y_range_px": [
            0,
            712
          ],
          "note": "Source XML rotation is recorded here for provenance. The visual preview intentionally applies no extra CSS rotation because the bitmap is already tilted; source width and height preserve the PPTX viewport stretch."
        }
      }
    },
    {
      "source": 10,
      "label": "感谢自然",
      "heading": "<span>Thank you,</span><span>peaceful place.</span>",
      "caption": "",
      "sourceText": "Thank you, peaceful place.",
      "pose": "",
      "kind": "farewell",
      "background": "yoga-wonder-case/assets/p11-farewell-sky-blue.png",
      "longCaption": false,
      "id": "wonder-page-11",
      "scene": "淡晴蓝天空下，两侧花丛和灌木围着一片安静的绿色草地。",
      "teacher": "蓝色伙伴坐在草地上，双手合拢，向自然道别。",
      "shortText": "Thank you, peaceful place.",
      "actionId": null,
      "focus": "",
      "character": {
        "path": "yoga-wonder-case/source-assets/image84.png",
        "dimensions_px": [
          3875,
          2180
        ],
        "visible_alpha_bbox_px": [
          1194,
          389,
          2651,
          1873
        ],
        "format": "PNG",
        "transparent_background": true,
        "includes_yoga_mat": false,
        "includes_arrow": false,
        "includes_ground_baseline": true,
        "character_count": 1
      }
    }
  ],
  "actions": [
    {
      "id": "wonder-upward-salute",
      "name": "上举伸展",
      "english": "Upward Salute",
      "instruction": "Oh! Look at those giant trees... reaching up to the sky!",
      "short": "Oh! Look at those giant trees... reaching up to the sky!",
      "teacher": "蓝色伙伴静态展示 Upward Salute，双臂向上伸展。",
      "demo": true
    },
    {
      "id": "wonder-tree",
      "name": "树式",
      "english": "Tree Pose",
      "instruction": "So many trees in this forest... each one a different shape!",
      "short": "So many trees in this forest... each one a different shape!",
      "teacher": "蓝色伙伴静态展示 Tree Pose，单脚站立，双臂向上。",
      "demo": true
    },
    {
      "id": "wonder-side-reach",
      "name": "侧向伸展",
      "english": "Side Reach",
      "instruction": "The wind is here! Leaves are falling... reach left, reach right!",
      "short": "The wind is here! Leaves are falling... reach left, reach right!",
      "teacher": "蓝色伙伴静态展示 Side Reach，身体向一侧伸展。",
      "demo": true
    },
    {
      "id": "wonder-standing-balance",
      "name": "站立平衡",
      "english": "Standing Balance",
      "instruction": "A big rock! Can I balance on it like a mountain goat?",
      "short": "A big rock! Can I balance on it like a mountain goat?",
      "teacher": "蓝色伙伴静态展示 Standing Balance，单脚站立，双臂展开。",
      "demo": true
    },
    {
      "id": "wonder-seated-spinal-twist",
      "name": "坐姿脊柱扭转",
      "english": "Seated Spinal Twist",
      "instruction": "I see something sparkling... a lake and a river! Wiggle, wiggle, like the water...",
      "short": "I see something sparkling... a lake and a river! Wiggle, wiggle, like the water...",
      "teacher": "蓝色伙伴静态展示 Seated Spinal Twist，坐姿转向一侧。",
      "demo": true
    },
    {
      "id": "wonder-mountain",
      "name": "山式",
      "english": "Mountain Pose",
      "instruction": "I climb up, up, up... I'm at the mountain! I can see everything!",
      "short": "I climb up, up, up... I'm at the mountain! I can see everything!",
      "teacher": "蓝色伙伴静态展示 Mountain Pose，站立并将双手举过头顶。",
      "demo": true
    },
    {
      "id": "wonder-butterfly",
      "name": "蝴蝶式",
      "english": "Butterfly Pose",
      "instruction": "My legs are tired... let me sit and feel the ground...",
      "short": "My legs are tired... let me sit and feel the ground...",
      "teacher": "蓝色伙伴静态展示 Butterfly Pose，坐姿屈膝，双脚相对。",
      "demo": true
    },
    {
      "id": "wonder-savasana",
      "name": "仰卧休息",
      "english": "Savasana",
      "instruction": "Time to rest. My body remembers the journey...",
      "short": "Time to rest. My body remembers the journey...",
      "teacher": "蓝色伙伴以原稿 Savasana 静态画面休息。",
      "demo": true
    }
  ],
  "fonts": {
    "regular": "yoga-wonder-case/assets/noto-sans-regular.woff2",
    "bold": "yoga-wonder-case/assets/noto-sans-bold.woff2"
  }
});
});
