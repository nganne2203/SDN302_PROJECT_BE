export const slugify = (value) => {
  if (!value) return '';
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces FIRST
    .replace(/[^a-z0-9-]+/g, '')    // KEPP -
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');         // Trim - from start and end
}

export const escapeRegex = (string = '') => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
