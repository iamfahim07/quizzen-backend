/**
 * Generates a unique ID string.
 * @param {string} [prefix] Optional prefix to make the ID more readable.
 * @returns {string} Unique ID based on timestamp and random suffix.
 */
export function generateUniqueId(prefix = "") {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 11);
  const extraRandom = Math.random().toString(36).substring(2, 5); // Extra entropy
  return `${prefix}${timestamp}-${randomStr}${extraRandom}`;
}

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
