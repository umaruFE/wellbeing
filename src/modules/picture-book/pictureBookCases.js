// 来源：dev/visual-preview.mjs 中第一条 My Little Nature Garden。
// 这是原本地预览的自然主题示例，不是线上用户作品。
const cover = '/ppt/backgrounds/kids-storybook-forest.png';
const title = 'My Little Nature Garden';

function freezeRecursively(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeRecursively);
    Object.freeze(value);
  }
  return value;
}

export const pictureBookCases = freezeRecursively([
  {
    id: 'case-nature-garden',
    title,
    cover_url: cover,
    book_data: {
      step: 0,
      basicInfo: {
        age: '7-9岁',
        level: '初级（会字母和简单词）',
        participants: '班级（10+）',
        themes: ['自然探索'],
        themeOther: '',
        materials: ['画纸'],
        materialOther: '',
        vocabulary: 'leaf, tree, flower, green',
        grammar: 'I can see a ...',
      },
      activityPlan: {
        storyTitleEn: title,
        storyTitleZh: '我的自然小花园',
        storyContent: '孩子们观察一片树叶、一朵小花，合作画出心中的小花园。',
        englishGoal: '认识常见植物，用 I can see a ... 描述观察结果。',
        wellbeingGoal: '留意自然之美，练习友善表达与合作。',
        outputGoal: '每人完成一页自然观察绘本。',
        materials: '画纸、彩笔、树叶',
        recommendedPageCount: 4,
      },
      pages: [
        'I can see a tree.',
        'I can see a flower.',
        'The leaves are green.',
        'This is our little garden.',
      ].map((text, index) => ({
        id: `page-${index}`,
        page: index + 1,
        pageNumber: index + 1,
        title: `Page ${index + 1}`,
        text,
        englishText: text,
        imageUrl: cover,
        imagePrompt: 'A gentle forest garden, watercolor illustration.',
        imageDescription: '柔和的森林花园插画，孩子们观察身边的植物。',
      })),
      backgroundMusic: null,
    },
  },
]);

export function createPictureBookCaseDraft(book) {
  const draft = structuredClone(book.book_data);
  draft.step = 0;
  return draft;
}
