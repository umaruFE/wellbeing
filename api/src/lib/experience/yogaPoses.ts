/**
 * 体式库常量（来源：newpage/体式-身体反应-情境匹配库.md）
 *
 * body（身体反应）同时是生图时「该动作长什么样」的权威描述：
 * 图片 prompt 与 LLM 选型约束共用这一份数据，保证脚本、下拉与插图一致。
 * - en：唯一 ASCII 全名（注入 LLM / 图片 prompt）
 * - label：图上标注用的短名（不含限定词，避免图中出现中文）
 * 前端下拉的同源副本：src/modules/creative-workshop/yogaPoses.js（改动需两处同步）。
 */

export interface YogaPose {
  /** 唯一英文全名（ASCII） */
  en: string;
  /** 图上标注短名（无括号限定词） */
  label: string;
  /** 中文名（下拉展示，可含 简易/慢速 等限定） */
  zh: string;
  /** 身体反应 / 动作要点 */
  body: string;
  /** 难度：1-3 星 */
  level: 1 | 2 | 3;
}

export const YOGA_POSES: YogaPose[] = [
  { en: 'Boat Pose', label: 'Boat Pose', zh: '船式（简易）', body: '坐姿，双腿伸直，身体左右摇摆', level: 2 },
  { en: 'Bow Pose', label: 'Bow Pose', zh: '弓式（简易）', body: '俯卧，手抓脚踝，身体前后摇摆', level: 2 },
  { en: 'Bridge Pose', label: 'Bridge Pose', zh: '桥式', body: '仰卧，屈膝抬臀，手撑地', level: 2 },
  { en: 'Butterfly Pose', label: 'Butterfly Pose', zh: '蝴蝶式', body: '坐姿，脚底相对，膝盖轻轻扇动', level: 1 },
  { en: 'Camel Pose', label: 'Camel Pose', zh: '骆驼式', body: '跪姿，身体后弯，手扶脚跟', level: 2 },
  { en: 'Cat-Cow Pose', label: 'Cat-Cow Pose', zh: '猫牛式', body: '四肢着地，拱背→塌腰', level: 1 },
  { en: 'Cat Pose → Crawl', label: 'Cat Crawl', zh: '猫式 → 爬行', body: '四肢着地，背拱起，爬行', level: 1 },
  { en: 'Chair Pose', label: 'Chair Pose', zh: '椅子式', body: '站直，双脚踩稳，身体微微下沉', level: 1 },
  { en: 'Chair Pose → Hop', label: 'Chair Hop', zh: '椅子式 → 跳', body: '屈膝，摆臂，跳起', level: 2 },
  { en: 'Chair Pose → Upward Salute', label: 'Chair to Salute', zh: '椅子式 → 向上致敬', body: '从蹲姿慢慢站起，手臂从身体两侧向上伸展', level: 1 },
  { en: "Child's Pose", label: "Child's Pose", zh: '婴儿式', body: '蹲下，双手抱膝，身体团成球', level: 1 },
  { en: "Child's Pose (Side-Lying)", label: "Child's Pose", zh: '婴儿式（侧卧）', body: '侧卧，身体蜷缩，双手抱膝', level: 1 },
  { en: 'Cobra Pose', label: 'Cobra Pose', zh: '眼镜蛇式', body: '趴下，手撑地，抬头', level: 1 },
  { en: 'Cobra Pose + Side Wiggles', label: 'Cobra Wiggle', zh: '眼镜蛇式 + 侧摆', body: '俯卧，手撑地，抬头挺胸，身体左右摆动', level: 2 },
  { en: 'Cobra Pose + Sway', label: 'Cobra Sway', zh: '眼镜蛇式 + 摇摆', body: '俯卧，手撑地，抬头，身体左右摆动', level: 1 },
  { en: 'Downward Dog + Hip Wiggles', label: 'Dog Wiggle', zh: '下犬式 + 摆臀', body: '四肢着地，臀部左右摇摆', level: 1 },
  { en: 'Eagle Pose', label: 'Eagle Pose', zh: '鹰式', body: '站姿，手臂交叉缠绕，单腿站立', level: 3 },
  { en: 'Forward Fold → Bear Crawl', label: 'Bear Crawl', zh: '前弯 → 熊爬', body: '从站姿前弯到手撑地，再爬过去', level: 2 },
  { en: 'Forward Fold → Side Lie', label: 'Fold and Rest', zh: '前弯 → 侧躺', body: '从站姿慢慢蹲下，再侧躺，完全放松', level: 1 },
  { en: 'Forward Fold → Squat → Crawl', label: 'Squat Crawl', zh: '前弯 → 蹲 → 爬', body: '弯腰，低头，屈膝，钻过去', level: 1 },
  { en: 'Garland Pose (Malasana)', label: 'Garland Pose', zh: '花环式', body: '蹲姿，膝盖向外打开，手放膝上', level: 1 },
  { en: 'Half Forward Fold (Dynamic)', label: 'Half Forward Fold', zh: '半前弯（动态）', body: '身体前倾，双手撑膝，一步步迈', level: 1 },
  { en: 'Half Moon Pose', label: 'Half Moon Pose', zh: '半月式', body: '站姿，身体向一侧弯成弧形，手臂过头', level: 2 },
  { en: 'Lion Pose', label: 'Lion Pose', zh: '狮式', body: '跪坐，张嘴伸舌，眼睛睁大', level: 1 },
  { en: 'Mountain Pose', label: 'Mountain Pose', zh: '山式', body: '站姿挺拔，双脚并拢，双手合十胸前', level: 1 },
  { en: 'Mountain Pose → Arms Out', label: 'Arms Out', zh: '山式 → 展臂', body: '站姿，手臂从胸前合十慢慢向外展开', level: 1 },
  { en: 'Mountain Pose → Arms Out + Spin', label: 'Arms Out Spin', zh: '山式 → 展臂 + 旋转', body: '站直，深吸气，呼气时手臂向外展开，身体旋转', level: 1 },
  { en: 'Mountain Pose → Forward Lean', label: 'Forward Lean', zh: '山式 → 前倾', body: '站直，双手拢在嘴边，身体前倾', level: 1 },
  { en: 'Mountain Pose → Upward Salute → Mountain Pose', label: 'Mountain Salute', zh: '山式 → 向上致敬 → 山式', body: '站直，手臂上举→合十胸前', level: 1 },
  { en: 'Savasana', label: 'Savasana', zh: '摊尸式', body: '仰卧，四肢完全放松，闭眼', level: 1 },
  { en: 'Seated Forward Fold (Gentle)', label: 'Seated Forward Fold', zh: '坐姿前弯（简易）', body: '坐姿，双手掌心贴地，深呼吸', level: 1 },
  { en: 'Seated Mountain Pose', label: 'Seated Mountain Pose', zh: '坐姿山式', body: '坐姿，双手合十胸前，闭眼', level: 1 },
  { en: 'Seated Spinal Twist', label: 'Seated Spinal Twist', zh: '坐姿扭转式', body: '坐下，身体轻轻左右扭动；或坐姿身体从一侧扭到另一侧，手臂随身体画弧', level: 1 },
  { en: 'Side Bend', label: 'Side Bend', zh: '侧弯式', body: '站姿，身体向一侧弯曲，手臂随身体弧形伸展', level: 1 },
  { en: 'Side Bend (Deep)', label: 'Side Bend', zh: '侧弯式（深度）', body: '站姿，身体向左右交替深度侧弯', level: 2 },
  { en: 'Side Reach (Slow)', label: 'Side Reach', zh: '侧伸展（慢速）', body: '站姿，身体向左右轻柔侧弯', level: 1 },
  { en: 'Side Reach (Fast Alternating)', label: 'Side Reach', zh: '侧伸展（快速交替）', body: '站姿，左右交替快速侧伸展', level: 1 },
  { en: 'Standing Balance', label: 'Standing Balance', zh: '单腿站立平衡', body: '单脚踩上，另一脚跟上，双臂展开找平衡', level: 2 },
  { en: 'Standing Balance (Dynamic)', label: 'Standing Balance', zh: '单腿站立平衡（动态）', body: '单腿站立，身体摇晃，手臂摆动保持平衡', level: 2 },
  { en: 'Standing Forward Fold', label: 'Standing Forward Fold', zh: '站姿前弯式', body: '从站姿慢慢蹲下，手臂从高处缓缓降到地面；或站直手臂从头顶快速向下挥身体前弯', level: 1 },
  { en: 'Standing Forward Fold → Roll Up', label: 'Fold and Roll Up', zh: '站姿前弯 → 卷起', body: '站立，身体像水一样前后波动', level: 1 },
  { en: 'Standing Knee Raise', label: 'Knee Raise', zh: '站姿提膝式', body: '站立，交替抬膝，手臂向上抓或摆动', level: 1 },
  { en: 'Standing Push (Chair Variant)', label: 'Standing Push', zh: '站姿推墙（椅子式变体）', body: '站姿，双手前推，身体前倾', level: 1 },
  { en: 'Standing Side Bend + Arm Waves', label: 'Side Bend Waves', zh: '站姿侧弯 + 手臂波浪', body: '站姿，身体大幅侧弯+转体，手臂波浪式摆动', level: 1 },
  { en: 'Standing Spinal Twist', label: 'Standing Twist', zh: '站姿扭转式', body: '站姿，身体旋转，手臂展开', level: 2 },
  { en: 'Standing Spiral Rise', label: 'Spiral Rise', zh: '站姿螺旋上升', body: '站姿，身体螺旋上升，手臂缠绕式上举', level: 2 },
  { en: 'Standing Twist (Slow)', label: 'Standing Twist', zh: '站姿扭转（慢速）', body: '站姿，身体随手臂方向从左转到右', level: 1 },
  { en: 'Star Pose', label: 'Star Pose', zh: '星式', body: '站姿，手臂从身体两侧开合，配合踮脚', level: 1 },
  { en: 'Tightrope Walk', label: 'Tightrope Walk', zh: '走钢索步', body: '双脚一前一后，小心走直线', level: 1 },
  { en: 'Tiptoe Walk → Mountain Pose', label: 'Tiptoe Walk', zh: '踮脚走 → 山式', body: '踮脚走，小心翼翼保持平衡', level: 1 },
  { en: 'Tree Pose', label: 'Tree Pose', zh: '树式', body: '单腿站立，另一脚贴腿内侧，手臂展开如树枝', level: 2 },
  { en: 'Upward Salute', label: 'Upward Salute', zh: '向上致敬式', body: '抬头，身体向上伸展，手臂笔直上举；或踮脚单臂向上极力伸展', level: 1 },
  { en: 'Upward Salute + Wrist Twist', label: 'Salute Wrist Twist', zh: '向上致敬 + 手腕转', body: '踮脚，手臂向上伸展，手腕转动', level: 1 },
  { en: 'Warrior I', label: 'Warrior I', zh: '战士一式', body: '大步向前跨，前腿屈膝，后腿伸直', level: 2 },
  { en: 'Warrior II', label: 'Warrior II', zh: '战士二式', body: '双脚分开，屈膝，手臂前伸', level: 2 },
];

const LEVEL_LABEL: Record<number, string> = { 1: '★', 2: '★★', 3: '★★★' };

/** 注入 LLM prompt 的体式库文本（英文全名｜中文名｜身体反应｜难度） */
export const YOGA_POSE_LIBRARY_TEXT = YOGA_POSES.map(
  (p) => `${p.en}（${p.zh}｜${p.body}｜${LEVEL_LABEL[p.level]}）`
).join(' / ');

/** 按英文名查体式（用于生图时取身体反应描述）；先精确后前缀 */
export function findYogaPose(en: string): YogaPose | undefined {
  const name = String(en || '').trim().toLowerCase();
  if (!name) return undefined;
  return (
    YOGA_POSES.find((p) => p.en.toLowerCase() === name) ||
    YOGA_POSES.find((p) => p.en.toLowerCase().startsWith(name) || name.startsWith(p.en.toLowerCase()))
  );
}
