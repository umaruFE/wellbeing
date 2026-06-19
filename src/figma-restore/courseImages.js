function parseMaybeJson(value) {
  if (!value || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function pickFirstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim()) || '';
}

const coverUrlKeys = new Set([
  'thumbnail',
  'thumbnail_url',
  'thumbnailUrl',
  'cover',
  'cover_url',
  'coverUrl',
  'cover_image',
  'cover_image_url',
  'coverImage',
  'coverImageUrl',
  'theme_image',
  'theme_image_url',
  'themeImage',
  'themeImageUrl',
  'image_url',
  'imageUrl',
]);

function findNestedCoverUrl(value, seen = new Set()) {
  const parsed = parseMaybeJson(value);
  if (!parsed || typeof parsed !== 'object' || seen.has(parsed)) return '';
  seen.add(parsed);

  for (const key of coverUrlKeys) {
    const direct = parsed[key];
    if (typeof direct === 'string' && direct.trim()) return direct;
  }

  for (const nested of Object.values(parsed)) {
    const found = findNestedCoverUrl(nested, seen);
    if (found) return found;
  }

  return '';
}

export function getCourseData(course = {}) {
  return parseMaybeJson(course.course_data || course.courseData || course.data) || {};
}

export function getCourseCoverUrl(course = {}) {
  const data = getCourseData(course);
  const overview = parseMaybeJson(data.courseOverview || data.overview) || {};
  const nestedData = parseMaybeJson(data.courseData || data.data) || {};

  return pickFirstString(
    course.thumbnail,
    course.thumbnail_url,
    course.thumbnailUrl,
    course.cover_url,
    course.coverUrl,
    course.cover_image_url,
    course.coverImageUrl,
    course.theme_image_url,
    course.themeImageUrl,
    course.image_url,
    course.imageUrl,
    data.thumbnail,
    data.thumbnailUrl,
    data.thumbnail_url,
    data.coverUrl,
    data.cover_url,
    data.coverImageUrl,
    data.cover_image_url,
    data.themeImageUrl,
    data.theme_image_url,
    data.imageUrl,
    data.image_url,
    overview.thumbnail,
    overview.thumbnailUrl,
    overview.coverUrl,
    overview.themeImageUrl,
    overview.theme_image_url,
    nestedData.thumbnail,
    nestedData.thumbnailUrl,
    nestedData.coverUrl,
    nestedData.themeImageUrl,
    findNestedCoverUrl(course),
  );
}

export function getCourseMapVariant(course = {}) {
  const seed = String(course.id || course.title || course.name || course.unit || 'course');
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  }
  return {
    tone: ['coral', 'blue', 'purple', 'green', 'gold', 'rose'][hash % 6],
    route: ['arc', 'wave', 'loop'][hash % 3],
  };
}
