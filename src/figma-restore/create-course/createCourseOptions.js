export const createCourseSteps = [
  { titleKey: 'createCourse.step1Title', subtitle: 'Set the Course' },
  { titleKey: 'createCourse.step2Title', subtitle: 'Design the Adventure' },
  { titleKey: 'createCourse.step3Title', subtitle: 'Choose the Path' },
  { titleKey: 'createCourse.step4Title', subtitle: 'Add Your Magic' },
];

export const ageOptions = [
  { value: '3-6', labelKey: 'createCourse.age36' },
  { value: '7-9', labelKey: 'createCourse.age79' },
  { value: '9-12', labelKey: 'createCourse.age912' },
];

export const durationOptions = [
  { value: '40', labelKey: 'createCourse.dur40' },
  { value: '60', labelKey: 'createCourse.dur60' },
  { value: '120', labelKey: 'createCourse.dur120' },
];

export const classSizeOptions = [
  { value: '≤8', labelKey: 'createCourse.size8' },
  { value: '9-15', labelKey: 'createCourse.size915' },
  { value: '≥16', labelKey: 'createCourse.size16' },
];

export const languageSkillOptions = [
  { labelKey: 'createCourse.skillListening', value: 'listening' },
  { labelKey: 'createCourse.skillSpeaking', value: 'speaking' },
  { labelKey: 'createCourse.skillReading', value: 'reading' },
  { labelKey: 'createCourse.skillWriting', value: 'writing' },
];

export const atmosphereOptions = [
  { value: 'mystery', labelKey: 'createCourse.atmoMystery' },
  { value: 'drama', labelKey: 'createCourse.atmoDrama' },
  { value: 'warmth', labelKey: 'createCourse.atmoWarmth' },
  { value: 'teamwork', labelKey: 'createCourse.atmoTeamwork' },
];

export const experiencePaths = [
  {
    value: 'art',
    titleKey: 'createCourse.pathArt',
    tone: 'art',
    descriptionKey: 'createCourse.pathArtDesc',
  },
  {
    value: 'body',
    titleKey: 'createCourse.pathBody',
    tone: 'body',
    descriptionKey: 'createCourse.pathBodyDesc',
  },
  {
    value: 'music',
    titleKey: 'createCourse.pathMusic',
    tone: 'music',
    descriptionKey: 'createCourse.pathMusicDesc',
  },
];

export const adventureIdeas = [];

export const defaultCreateCourseValues = {
  courseTitle: '',
  age: '7-9',
  duration: '60',
  classSize: '9-15',
  vocabularies: [],
  grammars: [],
  languageSkills: [],
  taskName: '',
  storyContext: '',
  keyOutcome: '',
  experiencePath: '',
  experiencePaths: [],
  specialRequirements: '',
  attachments: [],
  atmosphere: '',
};
