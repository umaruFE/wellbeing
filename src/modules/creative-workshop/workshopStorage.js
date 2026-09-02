const STORAGE_KEY = 'wellbeing:creative-works';

export const getCreativeWorks = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const createCreativeWork = ({ moduleId, moduleName, title, parameters }) => {
  const work = {
    id: `work-${Date.now()}`,
    moduleId,
    moduleName,
    title: title || `${moduleName} · 未命名作品`,
    parameters,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([work, ...getCreativeWorks()]));
  return work;
};

export const deleteCreativeWork = (id) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getCreativeWorks().filter((work) => work.id !== id)));
};

