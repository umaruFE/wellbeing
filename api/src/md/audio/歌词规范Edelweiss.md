---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 1870694363184624_0-data_volume/7651492870242763023-files/所有对话/主对话/歌词模板规范/Edelweiss.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 1870694363184624#1786436013410
    ReservedCode2: ""
---
# 旋律一：Edelweiss

## 旋律硬约束

```
行号  原词                                  音节    旋律特征
─────────────────────────────────────────────────────────────
L1    Edelweiss, Edelweiss                  3+3     轻柔起句，下行收
L2    Every morning you greet me            ~7      流动铺展
L3    Small and white, clean and bright     3+3     呼应 L1，明亮上扬
L4    You look happy to meet me             ~7      呼应 L2，收束
L5    Blossom of snow may you bloom and grow ~10    ★旋律最高点，情感峰
L6    Bloom and grow forever                ~6      从高峰回落，舒缓
L7    Edelweiss, Edelweiss                  3+3     回归起句，仪式感收拢
L8    Bless my homeland forever             ~7      最终落定，余音
```

| 约束 | 说明 |
|------|------|
| 总行数 | 固定 8 行 |
| L1 音节 | 3+3 对仗结构，短促轻盈，定调 |
| L2 音节 | 6-8（含所填词），流动舒展 |
| L3 音节 | 3+3 对仗，与 L1 平行 |
| L4 音节 | 6-8（含所填词），与 L2 平行 |
| L5 音节 | 7-8（含所填词），全曲最长行，**旋律最高点** |
| L6 音节 | 6-8（含所填词），从 L5 回落 |
| L7 音节 | 3+3，回归 L1 结构，**点题句位置** |
| L8 音节 | 7-8，最终落定，**收束句位置** |

## 软空间

| 维度 | 自由范围 |
|------|---------|
| 空格位置 | 任意行，建议 L2/L4/L5/L6，L7/L8 固定 |
| 每行最多空格 | **1 个** |
| 空格总行数 | ≤ 4 行 |
| 空格位置规则 | **不放在行末**，保证固定尾词可押韵 |
| 空格预留音节 | 取 Word Bank 中位数，最坏情况允许略超 1 音节靠唱法调整 |
| L1 内容 | 3+3 对仗（形容词对、名词对、动词对均可） |
| L3 内容 | 3+3 对仗，与 L1 形成呼应或递进 |
| L5 内容 | 旋律最高点，适合放情感升华或完整句型 |
| L7 点题句 | 3+3，呼应歌名，承载核心隐喻 |
| L8 收束句 | 7-8 音节，一句总结，不设空格 |
| 语言目标嵌入 | 可嵌入介词、动词、形容词、句型——取决于教学目标 |
| 句式策略 | 避免同一句式重复出现，每行句式应有变化 |
| Word Bank | 词汇量 = 空格数 + 2-3 个干扰词 |

## 设计流程

1. **先定歌名 & L7 点题句** → 这首歌的核心隐喻是什么？用 3+3 写出来
2. **再定 L8 收束句** → 一句升华，7-8 音节，锚定情感
3. **定 L5 高潮行** → 旋律最高点放什么？承载语言目标的核心句型
4. **定 L1+L3 对仗策略** → 互相呼应还是递进？决定整首歌的语调
5. **分配空格** → 在 L2/L4/L5/L6 四行中选 3-4 行各设一个空，确保句式不重复，空不在行末
6. **逐行验算音节** → 固定音节 + 空格数 × 预留音节数 ≤ 旋律约束，标注每行音节数

## 范例：A Sky Inside

```
🎵 A Sky Inside 🎵
   旋律：Edelweiss

L1: Feelings come, feelings go            [固定 6]
L2: I am ___ , I will say                 [固定 6 + 空≤2 = 8]
L3: Big and small, fast and slow          [固定 6]
L4: When I'm ___ I sing a song            [固定 5 + 空≤2 = 7]
L5: Sometimes ___ and that's okay         [固定 5 + 空≤2 = 7] ★高潮
L6: Tell me, are you ___ today?           [固定 6 + 空≤2 = 8]
L7: Feelings come, feelings go            [固定 6 点题]
L8: Every feeling, let it show            [固定 8 收束]
```

| 要素 | 值 |
|------|----|
| 空格数 | 4 个 |
| Word Bank | happy, sad, angry, tired, shy, excited, bored（7 词） |
| 语言目标 | How do you feel? I feel… |
| 押韵 | A 韵 go/slow/go/show 贯穿首尾，B 韵 say/okay/today 中间三句 |
| 句式 | L2 陈述 / L4 条件 / L5 接纳 / L6 反问，四种不重复 |

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
