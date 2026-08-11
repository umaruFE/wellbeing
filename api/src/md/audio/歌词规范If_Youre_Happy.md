---
AIGC:
    Label: "1"
    ContentProducer: 001191110102MACQD9K64018705
    ProduceID: 1870694363184624_0-data_volume/7651492870242763023-files/所有对话/主对话/歌词模板规范/If_Youre_Happy.md
    ReservedCode1: ""
    ContentPropagator: 001191110102MACQD9K64028705
    PropagateID: 1870694363184624#1786436106003
    ReservedCode2: ""
---
# 旋律四：If You're Happy and You Know It

## 旋律硬约束

```
行号  原词                                音节    旋律特征
─────────────────────────────────────────────────────────
L1    If you're happy and you know it        ~9      条件句，起句
L2    Clap your hands                        ~3      ★动作，短促有力
L3    If you're happy and you know it        ~9      重复 L1
L4    Clap your hands                        ~3      重复 L2
L5    If you're happy and you know it        ~9      重复 L1
L6    And you really want to show it         ~8      桥接句，过渡
L7    If you're happy and you know it        ~9      重复 L1
L8    Clap your hands                        ~3      重复 L2
```

| 约束 | 说明 |
|------|------|
| 结构 | 8 行 × N 段，原曲每段换动作，改编版固定 1 段，动作句设空 |
| 旋律本质 | 长条件句 → 短动作句，一问一答，互动型 |
| L1/L3/L5/L7 | 条件句，完全相同，~8-9 音节，按主题重写，**不设空** |
| L2/L4/L8 | 动作句，~3 音节，**含一个空**，承载语言目标 |
| L6 | 桥接句，~8 音节，可设空 |
| 旋律呼吸 | 条件句舒展，动作句短促有力，形成「呼—吸—呼—吸」节奏 |

## 与前三旋律的关键差异

| 维度 | Edelweiss | You're My Sunshine | Twinkle Twinkle | If You're Happy |
|------|-----------|-------------------|-----------------|-----------------|
| 行数 | 8 独立行 | 2×4 段落 | 6 行回环 | 8 行，条件-动作交替 |
| 旋律起伏 | 起→峰→落 | 双峰 | 均匀 | 长-短-长-短 交替 |
| 重复 | 无 | 无 | L5=L1, L6=L2 | L1=L3=L5=L7, L2=L4=L8 |
| 空位 | 2-4 行 | 每段 3 行，共 6 行 | 2-4 行 | 动作句 3 行 + 桥接句 |
| 句长 | 均匀 | 均匀 | 均匀 | 长句~9 + 短句~3 |

## 软空间

| 维度 | 自由范围 |
|------|---------|
| 空格位置 | L2/L4/L8（动作句，必设）+ L6（桥接句，可选） |
| 每行最多空格 | **1 个** |
| 空格总行数 | 3-4 行 |
| 空格位置规则 | 放在动作句内，不放在行末；L2/L4/L8 固定 2 音节 + 空 ≤ 1 音节 = 3 音节 |
| 预留音节 | 动作句 ≤1 音节；桥接句取 Word Bank 中位数 |
| L1/L3/L5/L7 条件句 | 按主题重写，~8-9 音节，不设空，四行完全相同 |
| L2/L4/L8 动作句 | 固定 2 音节 + 空 ≤1 = 3 音节，句式可不同 |
| L6 桥接句 | ~8 音节，可设空，承载语言目标或情感过渡 |
| 语言目标嵌入 | 动作句承载核心词汇，桥接句承载句型或情感 |
| Word Bank | 词汇量 = 空格数 + 2-3 个干扰词 |

## 设计流程

1. **先定主题 & 歌名** → 这首歌的核心场景是什么？
2. **定 L1 条件句** → ~8-9 音节，按主题原创，四行完全相同
3. **定 L2/L4/L8 动作句** → 各 2 固定音节 + 1 空 ≤ 1 音节 = 3 音节，三种句式
4. **定 L6 桥接句** → ~8 音节，可设空
5. **分配空格** → 动作句 3 个 + 桥接句 0-1 个
6. **逐行验算** → 动作句 = 3 音节，桥接句 ≤ 8 音节

## 范例：Show and Tell

```
🎵 Show and Tell 🎵
   旋律：If You're Happy and You Know It

L1: Let me show you what I have              [固定 7]
L2: Here's a ____                           [固定 2 + 空≤1 = 3]
L3: Let me show you what I have
L4: A ____ too                              [固定 2 + 空≤1 = 3]
L5: Let me show you what I have
L6: And I want to show my ____              [固定 6 + 空≤1 = 7]
L7: Let me show you what I have
L8: See my ____                             [固定 2 + 空≤1 = 3]
```

| 行 | 固定 | 空格 | 总计 | 约束 |
|----|------|------|------|------|
| L2 | 2 | 1×≤1 | 3 | 3 ✓ |
| L4 | 2 | 1×≤1 | 3 | 3 ✓ |
| L6 | 6 | 1×≤1 | 7 | ~8 ✓ |
| L8 | 2 | 1×≤1 | 3 | 3 ✓ |

| 要素 | 值 |
|------|----|
| 空格数 | 4 个 |
| Word Bank | ball, doll, boat, car, box, cap, map（7 词，3 干扰） |
| 语言目标 | Do you have …? Yes, I do. |
| 条件句 | `Let me show you what I have` 7 音节 |
| L2 句式 | 展示 → `Here's a ___` |
| L4 句式 | 补充 → `A ___ too` |
| L6 句式 | 分享 → `And I want to show my ___` |
| L8 句式 | 收尾 → `See my ___` |
| 歌名 | Show and Tell，课堂分享活动 |
## 范例二：Gather Round

```
🎵 Gather Round 🎵
   旋律：If You're Happy and You Know It

L1: Come and join me at the table            [固定 8]
L2: Have some ____                          [固定 2 + 空≤1 = 3]
L3: Come and join me at the table
L4: Try the ____                            [固定 2 + 空≤1 = 3]
L5: Come and join me at the table
L6: And I want to share my ____             [固定 6 + 空≤1 = 7]
L7: Come and join me at the table
L8: Share your ____                         [固定 2 + 空≤1 = 3]
```

| 行 | 固定 | 空格 | 总计 | 约束 |
|----|------|------|------|------|
| L2 | 2 | 1×≤1 | 3 | 3 ✓ |
| L4 | 2 | 1×≤1 | 3 | 3 ✓ |
| L6 | 6 | 1×≤1 | 7 | ~8 ✓ |
| L8 | 2 | 1×≤1 | 3 | 3 ✓ |

| 要素 | 值 |
|------|----|
| 空格数 | 4 个 |
| Word Bank | noodles, cake, bread, egg, juice, soup, rice（7 词） |
| 预留音节 | ≤1（中位数 1） |
| 语言目标 | 食物词汇 |
| 条件句 | `Come and join me at the table` 8 音节 |
| L2 句式 | 邀请 → `Have some ___` |
| L4 句式 | 推荐 → `Try the ___` |
| L6 句式 | 过渡 → `And I want to share my ___` |
| L8 句式 | 互动 → `Share your ___` |
| 歌名 | Gather Round，餐桌团聚分享 |

## 两范例句型对比

| | Show and Tell | Gather Round |
|------|------|------|
| 语言目标 | 玩具词 + Do you have…? | 食物词 |
| 场景 | 课堂展示 | 围桌分享 |
| 条件句 | Let me show you what I have（7） | Come and join me at the table（8） |
| 动作句链 | 展示→补充→分享→收尾 | 邀请→推荐→分享→互动 |
| 情感方向 | 我→你们（展示） | 我→你→我们（分享） |
| Word Bank | 7 词 | 7 词 |

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
