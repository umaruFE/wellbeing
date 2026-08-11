---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 1870694363184624_0-data_volume/7651492870242763023-files/所有对话/主对话/歌词模板规范/Twinkle_Twinkle.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 1870694363184624#1786436125711
    ReservedCode2: ""
---
# 旋律三：Twinkle Twinkle Little Star

## 旋律硬约束

```
行号  原词                              音节    旋律特征
─────────────────────────────────────────────────────────
L1    Twinkle, twinkle, little star      7       起句，轻快跳跃
L2    How I wonder what you are          7       承接，上扬疑问
L3    Up above the world so high         7       展开，升高
L4    Like a diamond in the sky          7       回落，收束画面
L5    Twinkle, twinkle, little star      7       回归 L1
L6    How I wonder what you are          7       回归 L2，循环收尾
```

| 约束 | 说明 |
|------|------|
| 结构 | 6 行，A-B-C-D-A-B 循环式 |
| 每行音节 | ~7（含所填词），全曲节奏均匀，无高峰低谷 |
| L1 | 起句，通常包含歌名/核心意象 |
| L2 | 上扬疑问或号召，呼应 L1 |
| L3 | 展开画面，描述性或叙事性 |
| L4 | 回落收束，完成第一轮画面 |
| L5 | **完全重复 L1**，回环感 |
| L6 | **完全重复 L2**，回环感 |
| 旋律呼吸 | 轻快跳跃，无行内逗号停顿，每行是一个完整短语 |

## 与 Edelweiss / You're My Sunshine 的关键差异

| 维度 | Edelweiss | You're My Sunshine | Twinkle Twinkle |
|------|-----------|-------------------|-----------------|
| 行数 | 8 行独立 | 2×4 段落式 | 6 行 A-B-C-D-A-B 循环 |
| 旋律起伏 | 起→峰→落 | 起→峰→收→起→峰→落 | 全曲均匀，无高峰 |
| 重复 | 无 | 无 | L5=L1, L6=L2 |
| 旋律呼吸 | 行与行之间 | 行内逗号停顿 | 每行一个完整短语 |
| 点题句 | 1 个（L7） | 2 个（L4+L8） | 无独立点题句，核心隐喻由 L1/L2 承载 |

## 软空间

| 维度 | 自由范围 |
|------|---------|
| 空格位置 | 任意行，L3/L4 为展开画面，适合放描述性空格 |
| 每行最多空格 | **1 个** |
| 空格总行数 | 2-4 行 |
| 空格位置规则 | 不放在行末，保证固定尾词可押韵 |
| 空格预留音节 | 取 Word Bank 中位数 |
| L1 内容 | 核心意象，承载歌名，L5 必须完全相同 |
| L2 内容 | 号召/疑问/回应，L6 必须完全相同 |
| L3 内容 | 展开画面，描述性 |
| L4 内容 | 收束第一轮画面 |
| 语言目标嵌入 | 可嵌入名词、动词、句型——取决于教学目标 |
| 句式策略 | L1/L2 用不同句式，L3/L4 用不同句式，避免重复 |
| Word Bank | 词汇量 = 空格数 + 2-3 个干扰词 |

## 设计流程

1. **先定歌名 & L1 核心意象** → 这首歌的核心意象是什么？~7 音节，L5 完全相同
2. **再定 L2 号召/疑问** → 与 L1 呼应，L6 完全相同
3. **定 L3-L4 展开画面** → 描述性内容，承载语言目标
4. **分配空格** → 在 6 行中选 2-4 行，L1/L2 通常固定（因为要重复）
5. **逐行验算** → 固定音节 + 空音节 ≤ 7，标注每行音节数

## 范例一：All That I Am

```
🎵 All That I Am 🎵
   旋律：Twinkle Twinkle Little Star

L1: All of me, my ____ and me              [固定 5 + 空≤2 = 7]
L2: These two ____ see who I am            [固定 5 + 空≤1 = 6]
L3: When I'm ____ I sing a song            [固定 6 + 空≤2 = 8]
L4: My beating ____ keeps me strong        [固定 6 + 空≤2 = 8]
L5: All of me, my ____ and me              [固定 5 + 空≤2 = 7]
L6: These two ____ see who I am            [固定 5 + 空≤1 = 6]
```

| 行 | 固定 | 空格 | 总计 | 约束 |
|----|------|------|------|------|
| L1 | 5 | 1×≤2 | 7 | ~7 ✓ |
| L2 | 5 | 1×≤1 | 6 | ~7 ✓ |
| L3 | 6 | 1×≤2 | 8 | ~7 略超 |
| L4 | 6 | 1×≤2 | 8 | ~7 略超 |
| L5 | 5 | 1×≤2 | 7 | ~7 ✓ |
| L6 | 5 | 1×≤1 | 6 | ~7 ✓ |

| 要素 | 值 |
|------|----|
| 空格数 | 4 个（L1/L5 同空，L2/L6 同空，L3/L4 各一空） |
| L1/L5 空 | 身体部位（≤2 音节：body, heart, head, hands, feet, eyes） |
| L2/L6 空 | 身体部位（≤1 音节：eyes, hands, ears, feet, nose, mouth） |
| L3 空 | 情绪词（≤2 音节：happy, sad, tired, calm, excited, shy, angry, bored） |
| L4 空 | 身体部位（≤2 音节：heart, hands, eyes, body, head, chest） |
| Word Bank | 身体部位 6 词 + 情绪词 8 词，共 14 词 |
| 语言目标 | 身体部位 + 情绪词 |
| 核心隐喻 | 我由身体和情绪共同组成 |
| 歌名 | All That I Am |

## 范例二：Treasure Box

```
🎵 Treasure Box 🎵
   旋律：Twinkle Twinkle Little Star

L1: I have a ____, I have two              [固定 5 + 空≤1 = 6]
L2: Do you have a ____? I do               [固定 6 + 空≤1 = 7]
L3: Treasures, treasures, small and bright  [固定 7]
L4: My ____ is here, come and see          [固定 5 + 空≤1 = 6]
L5: I have a ____, I have two              [固定 5 + 空≤1 = 6]
L6: Do you have a ____? I do               [固定 6 + 空≤1 = 7]
```

| 行 | 固定 | 空格 | 总计 | 约束 |
|----|------|------|------|------|
| L1 | 5 | 1×≤1 | 6 | ~7 ✓ |
| L2 | 6 | 1×≤1 | 7 | ~7 ✓ |
| L3 | 7 | 0 | 7 | ~7 ✓ |
| L4 | 5 | 1×≤1 | 6 | ~7 ✓ |
| L5 | 5 | 1×≤1 | 6 | ~7 ✓ |
| L6 | 6 | 1×≤1 | 7 | ~7 ✓ |

| 要素 | 值 |
|------|----|
| 空格数 | 4 个（L1/L5 同空，L2/L6 同空，L3 固定，L4 一空） |
| Word Bank | ball, doll, boat, car, box, cap, map（7 词，3 干扰） |
| 语言目标 | Do you have …? Yes, I do. |
| L2/L6 句式 | 提问 → `Do you have a ___?` |
| L1/L5 句式 | 陈述拥有 → `I have a ___` |
| L4 句式 | 展示 → `My ___ is here` |
| 核心隐喻 | 小物件是宝藏 |
| 歌名 | Treasure Box |

## 两范例句型对比

| | All That I Am | Treasure Box |
|------|------|------|
| 语言目标 | 身体部位 + 情绪词 | 玩具名词 + Do you have… |
| 空格数 | 4 个 | 4 个 |
| 空格分布 | L1/L5 + L2/L6 + L3 + L4 | L1/L5 + L2/L6 + L4 |
| 核心隐喻 | 我由身体和情绪组成 | 小物件是宝藏 |
| 歌名风格 | 哲学感 | 童话感 |

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
