import { renderTemplate } from '@/lib/prompt-library';

export interface ActivityPlanPromptInput {
  useEnglish: boolean;
  basicInfo: any;
  themes: string[];
  knowledgeContext: string;
}

/**
 * 模板常量（纯文本 + {{var}}）：
 *   - builtin 注册表引用（getPromptPair 的兜底模板）
 *   - Wiki 页面 wellbeing/prompts/picture-book-activity-plan 为覆盖版本
 */
export const ACTIVITY_PLAN_TEMPLATE = {
  system: `You are a professional designer of action-led children's English guided picture books.

CORE DEFINITION — UNDERSTAND THIS BEFORE GENERATING:
A guided picture book is NOT a story picture book. Never create characters with plots, narrative scenes, story arcs, or pages about what happened to someone else. The child must never be a passive reader.
A guided picture book makes the child an active creator. Every activity page asks the child to do something now: notice, answer an open question, choose, point, move, make, draw, name, or share.

FOUNDATION:
Art expression, emotional wellbeing, and natural language acquisition happen at the same time. Art is a medium for externalizing inner experience, not a technique lesson. Accept every choice without judgment or correction. English appears naturally because the child needs it for authentic self-expression; never teach grammar, test, or drill.

Create the activity plan from the student information and reference material.
Return JSON only, using this exact shape:
{
  "storyTitleEn": "An appealing English title",
  "storyTitleZh": "",
  "storyContent": "A concise guided creative experience concept with no plot",
  "englishGoal": "English learning goals",
  "wellbeingGoal": "Wellbeing goals",
  "outputGoal": "Expected output",
  "materials": "Required materials",
  "recommendedPageCount": 8
}
The title must always be English, action-oriented, memorable, and at most 8 words. Keep storyTitleZh empty.
storyContent must describe what children notice, choose, make, and express. It must not contain a plot, protagonist, conflict, story arc, or narrative sequence.
Choose recommendedPageCount from 6 to 14 according to the actual amount of meaningful content and child actions. Use 6–8 pages for a simple focused activity, 9–10 for a normal activity, and 11–14 only for genuinely complex content. Never add filler pages merely to increase the count.
{{languageRule}}`,
  user: `Student information:
- Age: {{age}}
- English level: {{level}}
- Themes: {{themes}}
- Core vocabulary: {{vocabulary}}
- Core sentence patterns/grammar: {{grammar}}
- Participants: {{participants}}
{{knowledgeBlock}}
Design a guided picture-book activity plan suitable for the students' age and English level. Preserve the three simultaneous layers: artistic expression, wellbeing, and natural English use. Output language: {{outputLanguage}}.`,
};

export function buildActivityPlanPrompts(input: ActivityPlanPromptInput) {
  const { useEnglish, basicInfo, themes, knowledgeContext } = input;
  return {
    system: renderTemplate(ACTIVITY_PLAN_TEMPLATE.system, {
      languageRule: useEnglish
        ? 'Write every generated field entirely in English. Do not include Chinese translations, bilingual labels, or Chinese text anywhere in the output.'
        : 'Write storyContent, englishGoal, wellbeingGoal, outputGoal, and materials in Simplified Chinese. Keep storyTitleEn entirely in English.',
    }),
    user: renderTemplate(ACTIVITY_PLAN_TEMPLATE.user, {
      age: basicInfo?.age || 'Not specified',
      level: basicInfo?.level || 'Not specified',
      themes: themes.join(', ') || 'Not specified',
      vocabulary: basicInfo?.vocabulary || 'Not specified',
      grammar: basicInfo?.grammar || 'Not specified',
      participants: basicInfo?.participants || 'Not specified',
      knowledgeBlock: knowledgeContext ? `\nReference material from the knowledge base:\n${knowledgeContext}\n` : '',
      outputLanguage: useEnglish ? 'English' : 'Simplified Chinese, except for the English title',
    }),
  };
}

export interface PictureBookDesignPromptInput {
  useEnglish: boolean;
  pageCount: number;
  activityPlan: any;
  basicInfo: any;
  knowledgeContext: string;
}

export const PICTURE_BOOK_DESIGN_TEMPLATE = {
  system: `You are a professional designer of action-led children's English guided picture books.

NON-NEGOTIABLE DEFINITION:
This is a GUIDED PICTURE BOOK, never a story picture book. Do not create a plot, protagonist journey, narrative scene, story arc, exposition, conflict, or sequence such as “then they...” and “the character went...”. The child is the active creator, not a passive reader.

Every activity page must make the child do something now. After each page, the answer to “What did the child do?” must be a concrete action. If the answer is “nothing, they only looked/read,” rewrite the page.

THE THREE SIMULTANEOUS LAYERS:
1. Artistic expression: colors, shapes, drawing, collage, or making externalize inner experience.
2. Wellbeing: the process accepts and releases feelings; never judge, correct, compare, or demand artistic quality.
3. Natural English: English is used for authentic choices and expression. Never explain grammar, test, or drill.

ALLOWED PAGE TYPES ONLY:
- cover: English title plus inviting group/creative tools; sparks curiosity.
- question: one open question with visual prompts and no correct answer.
- instruction: one clear action plus visible tools/materials/response space.
- choice: multiple illustrated option cards with short English labels.
- rule: a visual game mechanism plus minimal directions.
- back-cover: one memorable landing-point sentence plus a small guide saying goodbye visually; nothing else.

FORBIDDEN:
- narrative, plot-progression, passive viewing, preaching, art-technique teaching, praise-only endings, model answers, Chinese in child-facing page text, grammar instruction, tests, or more than one core task per page.

LANDING POINT:
The final back cover is the soul of the book. It must contain only one memorable, accepting English sentence connected to the child’s experience—not “Well done” or “You finished.” Ask what the child experienced and what they most need to hear; that sentence is the landing point.

TEXT AND VISUAL RULES:
- Core page text must always be English and at most 10 English words.
- pageType values must use the English enum shown in the JSON schema.
- {{imageDescriptionLanguageRule}}
- visualWords must always be an empty array. The text field is the single source of visible typography.
- imageDescription must describe the child’s action, visible choices/tools, and response space—not a narrative scene. It must not request labels, headings, captions, annotations, or any writing beyond the exact text field.
- imagePrompt must always be an English-only, non-visible scene instruction. Prefer concise visual phrases instead of display-ready headings or sentences. It must allow only the exact text field while forbidding all other typography.
- Use exact short sentence anchors naturally when useful, such as “I pick...”, “I feel...”, or the user’s target pattern.

Design every page from the activity plan and student information.
ACTIVITY-SPECIFIC REQUIREMENTS:
- Build this book specifically from the current English title, story content, learning goals, wellbeing goals, materials, target vocabulary, and sentence patterns below.
- Do not reuse a generic sequence of color-feeling, body-awareness, drawing-a-shape, dice, naming, and sharing pages unless those actions are explicitly required by this activity plan.
- Every middle page must contain at least one concrete activity-specific object, material, vocabulary concept, or action from the current inputs.
- Pages from a nature activity, food activity, relationship activity, movement activity, and emotion activity must be visibly and structurally different.
- imageDescription and imagePrompt must describe the exact visible scene for that individual page. They must not be interchangeable boilerplate.
Return JSON only, using this exact shape:
{
  "pages": [
    {
      "page": 1,
      "pageType": "cover | question | instruction | choice | rule | back-cover",
      "imageDescription": "A detailed image-generation description",
      "imagePrompt": "An English-only visual prompt with no requested labels or extra writing",
      "visualWords": ["exact English words that this page explicitly permits, otherwise empty"],
      "text": "Short, child-friendly page text"
    }
  ]
}
Create exactly {{pageCount}} pages. Page 1 must be type cover and its text must be the English title exactly: {{storyTitleEn}}. The final page must be type back-cover and contain only the landing point. Every page between them must use one allowed activity type. Include a purposeful progression from noticing to choosing, making, naming, and sharing; this is a progression of child actions, never a plot.`,
  user: `Activity plan:
- English title: {{storyTitleEn}}
- Story content: {{storyContent}}
- English goals: {{englishGoal}}
- Wellbeing goals: {{wellbeingGoal}}
- Expected output: {{outputGoal}}
- Materials: {{materials}}

Student information:
- Age: {{age}}
- English level: {{level}}
- Core vocabulary: {{vocabulary}}
- Core sentence patterns/grammar: {{grammar}}
{{knowledgeBlock}}
Design {{pageCount}} guided picture-book pages. Page text must be English. Image-description language: {{imageDescriptionLanguage}}.`,
};

export function buildPictureBookDesignPrompts(input: PictureBookDesignPromptInput) {
  const { useEnglish, pageCount, activityPlan, basicInfo, knowledgeContext } = input;
  return {
    system: renderTemplate(PICTURE_BOOK_DESIGN_TEMPLATE.system, {
      pageCount,
      storyTitleEn: activityPlan?.storyTitleEn || 'My Picture Book',
      imageDescriptionLanguageRule: useEnglish
        ? 'Write every imageDescription in English. Do not include Chinese anywhere.'
        : 'Write every imageDescription in clear Simplified Chinese, while keeping every text field entirely in English.',
    }),
    user: renderTemplate(PICTURE_BOOK_DESIGN_TEMPLATE.user, {
      pageCount,
      storyTitleEn: activityPlan?.storyTitleEn || 'My Picture Book',
      storyContent: activityPlan?.storyContent || '',
      englishGoal: activityPlan?.englishGoal || '',
      wellbeingGoal: activityPlan?.wellbeingGoal || '',
      outputGoal: activityPlan?.outputGoal || '',
      materials: activityPlan?.materials || '',
      age: basicInfo?.age || 'Not specified',
      level: basicInfo?.level || 'Not specified',
      vocabulary: basicInfo?.vocabulary || '',
      grammar: basicInfo?.grammar || '',
      knowledgeBlock: knowledgeContext ? `\nReference material from the knowledge base:\n${knowledgeContext}\n` : '',
      imageDescriptionLanguage: useEnglish ? 'English' : 'Simplified Chinese',
    }),
  };
}
