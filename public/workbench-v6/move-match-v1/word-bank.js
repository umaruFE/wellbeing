/* Supplemental local vocabulary. No images, storage or age-appropriateness
   claims. The generator retains the original words and category rules. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MMWordBank = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const word = (value, ...aliases) => Object.freeze({word:value, aliases:Object.freeze([value.toLowerCase(), ...aliases])});
  const bank = {
    animals: [
      word('horse', '马'), word('cow', '奶牛'), word('pig', '猪'), word('sheep', '绵羊'),
      word('goat', '山羊'), word('mouse', '老鼠'), word('bear', '熊'), word('panda', '熊猫'),
      word('zebra', '斑马'), word('giraffe', '长颈鹿'), word('kangaroo', '袋鼠'), word('koala', '考拉', '树袋熊'),
      word('fox', '狐狸'), word('camel', '骆驼'), word('hippo', '河马', 'hippopotamus'),
      word('rhino', '犀牛', 'rhinoceros'), word('crocodile', '鳄鱼')
    ],
    fruit: [
      word('peach', '桃子', '桃'), word('cherry', '樱桃'), word('mango', '芒果'), word('kiwi fruit', 'kiwi', '猕猴桃', '奇异果'),
      word('plum', '李子'), word('apricot', '杏子', '杏'), word('blueberry', '蓝莓'), word('raspberry', '覆盆子'),
      word('blackberry', '黑莓'), word('coconut', '椰子'), word('papaya', '木瓜'), word('lychee', '荔枝', 'litchi'),
      word('pomegranate', '石榴'), word('grapefruit', '葡萄柚', '西柚'), word('tangerine', '橘子'),
      word('cantaloupe', '哈密瓜'), word('dragon fruit', '火龙果')
    ],
    vegetables: [
      word('cucumber', '黄瓜'), word('eggplant', '茄子', 'aubergine'), word('tomato', '番茄', '西红柿'),
      word('pumpkin', '南瓜'), word('corn', '玉米'), word('cauliflower', '菜花', '花椰菜'), word('mushroom', '蘑菇'),
      word('bell pepper', '甜椒', '彩椒'), word('sweet potato', '红薯', '地瓜'), word('radish', '萝卜'),
      word('beetroot', '甜菜根'), word('asparagus', '芦笋'), word('zucchini', '西葫芦', 'courgette'),
      word('leek', '韭葱'), word('green bean', '四季豆'), word('garlic', '大蒜'), word('okra', '秋葵')
    ],
    colors: [
      // Do not introduce ambiguous fruit names such as orange, olive or lime.
      word('gray', '灰色', '灰', 'grey'), word('beige', '米色'), word('turquoise', '绿松石色'),
      word('gold', '金色', 'golden'), word('silver', '银色'), word('navy', '藏青色', 'navy blue'),
      word('maroon', '栗红色'), word('teal', '蓝绿色'), word('light blue', '浅蓝色'), word('dark blue', '深蓝色'),
      word('light green', '浅绿色'), word('dark green', '深绿色'), word('light pink', '浅粉色'), word('dark pink', '深粉色'),
      word('light purple', '浅紫色'), word('dark purple', '深紫色'), word('light brown', '浅棕色')
    ],
    transport: [
      word('ambulance', '救护车'), word('fire engine', '消防车', 'fire truck'), word('police car', '警车'),
      word('motorcycle', '摩托车', 'motorbike'), word('scooter', '踏板车'), word('tram', '有轨电车'),
      word('subway', '地铁', 'metro'), word('ferry', '渡轮'), word('ship', '轮船'), word('sailboat', '帆船'),
      word('submarine', '潜水艇', '潜艇'), word('hot-air balloon', '热气球', 'hot air balloon'),
      word('rocket', '火箭'), word('space shuttle', '航天飞机'), word('van', '厢式车'),
      word('minibus', '小巴', '小型巴士'), word('school bus', '校车')
    ],
    clothes: [
      word('jacket', '夹克', '夹克衫'), word('sweater', '毛衣'), word('hoodie', '连帽衫'), word('jeans', '牛仔裤'),
      word('shorts', '短裤'), word('scarf', '围巾'), word('gloves', '手套'), word('boots', '靴子'),
      word('sandals', '凉鞋'), word('slippers', '拖鞋'), word('sneakers', '运动鞋', 'trainers'),
      word('pajamas', '睡衣', 'pyjamas'), word('raincoat', '雨衣'), word('swimsuit', '泳衣'),
      word('vest', '背心'), word('mittens', '连指手套'), word('cap', '鸭舌帽', '棒球帽')
    ],
    stationery: [
      word('paper', '纸', '纸张'), word('stapler', '订书机'), word('staple', '订书钉'), word('paper clip', '回形针'),
      word('binder clip', '长尾夹'), word('folder', '文件夹'), word('binder', '活页夹'), word('envelope', '信封'),
      word('sticky note', '便利贴', '便签纸'), word('index card', '索引卡'), word('highlighter', '荧光笔'),
      word('pencil sharpener', '卷笔刀', '削笔器'), word('pencil case', '文具盒', '笔袋'),
      word('drawing compass', '圆规'), word('protractor', '量角器'), word('correction tape', '修正带'),
      word('whiteboard eraser', '白板擦')
    ],
    toys: [
      // Toy qualifiers are part of the prompt, not aliases for real animals or vehicles.
      word('puppet', '手偶'), word('marbles', '弹珠'), word('jump rope', '跳绳', 'skipping rope'), word('hula hoop', '呼啦圈'),
      word('bubble wand', '泡泡棒'), word('rubber duck', '橡皮鸭'), word('rocking horse', '摇马'), word('play tent', '游戏帐篷'),
      word('toy drum', '玩具鼓'), word('toy piano', '玩具钢琴'), word('toy kitchen', '玩具厨房'), word('toy phone', '玩具电话'),
      word('toy camera', '玩具相机'), word('toy cash register', '玩具收银机'), word('beach bucket', '沙滩桶'),
      word('sand mold', '沙模', 'sand mould'), word('frisbee', '飞盘')
    ],
    food: [
      word('pasta', '意大利面'), word('toast', '烤面包'), word('pancake', '薄煎饼'), word('waffle', '华夫饼'),
      word('muffin', '麦芬', '玛芬'), word('cupcake', '纸杯蛋糕'), word('donut', '甜甜圈', 'doughnut'),
      word('bagel', '贝果'), word('pretzel', '椒盐脆饼'), word('croissant', '羊角面包', '可颂'),
      word('popcorn', '爆米花'), word('porridge', '粥'), word('omelet', '煎蛋卷', 'omelette'),
      word('sausage', '香肠'), word('meatball', '肉丸'), word('sushi', '寿司'), word('taco', '墨西哥塔可')
    ],
    drinks: [
      word('grape juice', '葡萄汁'), word('pineapple juice', '菠萝汁'), word('cranberry juice', '蔓越莓汁'),
      word('mango juice', '芒果汁'), word('peach juice', '桃汁'), word('pear juice', '梨汁'), word('tomato juice', '番茄汁'),
      word('carrot juice', '胡萝卜汁'), word('green tea', '绿茶'), word('black tea', '红茶'), word('iced tea', '冰茶'),
      word('milkshake', '奶昔'), word('smoothie', '冰沙'), word('soy milk', '豆浆', '豆奶'), word('oat milk', '燕麦奶'),
      word('almond milk', '杏仁奶'), word('sparkling water', '气泡水')
    ]
  };
  Object.values(bank).forEach(Object.freeze);
  return Object.freeze(bank);
});
