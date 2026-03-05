// KaTeX rendering helper
const renderMath = (element) => {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\(', right: '\)', display: false },
        { left: '\[', right: '\]', display: true }
      ],
      throwOnError: false
    });
  }
};
