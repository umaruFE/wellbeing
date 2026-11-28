const firstText = (...values) => values.find(value => typeof value === 'string' && value.trim())?.trim() || '';

// Older saved books use img/subtitle; the editor writes imageUrl/text.
export function teachingButtonProps({ pages, title, music }, onPresent, emptyLabel) {
  const slides = Array.isArray(pages) ? pages.map(page => ({
    image: firstText(page?.imageUrl, page?.img),
    text: firstText(page?.subtitle, page?.text, page?.englishText),
  })).filter(slide => slide.image || slide.text) : [];

  if (!slides.length) return { disabled: true, title: emptyLabel };
  return {
    onClick: event => onPresent({ pages: slides, title, music, trigger: event.currentTarget }),
  };
}
