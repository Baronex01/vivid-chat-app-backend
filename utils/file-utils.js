export function sanitizeFilename(original) {
  if (!original) return 'file';
  // Trim, replace spaces with underscores, remove unsafe chars except dot and dash and underscore
  const trimmed = String(original).trim();
  // Replace spaces and consecutive spaces
  const noSpaces = trimmed.replace(/\s+/g, '_');
  // Remove characters other than letters, numbers, dot, underscore, and dash
  const cleaned = noSpaces.replace(/[^A-Za-z0-9._-]/g, '');
  // Limit length to avoid extremely long filenames
  const maxLen = 200;
  return cleaned.length > maxLen ? cleaned.slice(0, maxLen) : cleaned;
}
