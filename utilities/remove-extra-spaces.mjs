const removeExtraSpaces = (str) => {
  return str
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .join(" ");
};

export default removeExtraSpaces;
