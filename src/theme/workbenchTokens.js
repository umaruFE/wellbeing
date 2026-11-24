// Visual source: 小星星总集成 V6, 2026-11-18. Data and gameplay stay with their modules.
export const workbenchTokens = Object.freeze({
  primary: '#7053c1',
  'primary-hover': '#563a9e',
  'primary-active': '#493083',
  page: '#f7f6fa',
  surface: '#ffffff',
  text: '#302b3b',
  muted: '#70697c',
  placeholder: '#7b7187',
  border: '#ded6e9',
  'border-soft': '#e5e0ec',
  selected: '#f1ecfc',
  'selected-border': '#b9a1ef',
  font: 'Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  'control-radius': '10px',
  'card-radius': '14px',
  'modal-radius': '18px',
  'shadow-hover': '0 8px 20px rgba(48, 43, 59, 0.07)',
  'shadow-dialog': '0 18px 56px rgba(48, 43, 59, 0.16)',
});

export function applyWorkbenchTokens(element) {
  for (const [name, value] of Object.entries(workbenchTokens)) {
    element.style.setProperty(`--wb-${name}`, value);
  }
}
