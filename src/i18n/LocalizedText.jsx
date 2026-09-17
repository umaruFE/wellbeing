import { useTranslation } from 'react-i18next';

export function LocalizedText({ id }) {
  const { t } = useTranslation();
  return t(id);
}

// Preserve stable domain/API values while translating their displayed labels.
export function LocalizedValue({ value, catalog }) {
  const { t } = useTranslation();
  const labels = t(catalog, { returnObjects: true });
  return labels && typeof labels === 'object' ? labels[value] || value : value;
}
