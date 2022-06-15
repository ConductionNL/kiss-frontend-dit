import DOMPurify from "dompurify";
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
const headerRegex = /(<\/?h)([1-6])(>)/g;
const increaseHeadings = (s: string, level: HeadingLevel) =>
  s.replace(headerRegex, (_, open, l, close) => {
    const newLevel = Number.parseInt(l, 10) + level - 1;
    const classes = open.includes("/")
      ? ""
      : ` class="utrecht-heading-${newLevel}"`;
    return `${open}${newLevel}${classes}${close}`;
  });

export function cleanHtml(str: string, headingLevel: HeadingLevel = 1) {
  const safeString = DOMPurify.sanitize(str);
  return increaseHeadings(safeString, headingLevel);
}
