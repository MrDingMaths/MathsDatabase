// Calculator/Non-calculator SVG icons
// calculator: true = calculator allowed, false = non-calculator, null/undefined = not set
const calcIcon = (calculator) => {
  if (calculator === true) {
    return `<svg class="calc-icon calc-icon--yes" viewBox="0 0 14 18" width="14" height="18" title="Calculator allowed" aria-label="Calculator allowed">
      <rect x="0.75" y="0.75" width="12.5" height="16.5" rx="1.5" fill="#e8f5e9" stroke="#388e3c" stroke-width="1.5"/>
      <rect x="2" y="2.5" width="10" height="3.5" rx="0.75" fill="#a5d6a7"/>
      <circle cx="3.5" cy="9" r="1" fill="#388e3c"/>
      <circle cx="7" cy="9" r="1" fill="#388e3c"/>
      <circle cx="10.5" cy="9" r="1" fill="#388e3c"/>
      <circle cx="3.5" cy="13" r="1" fill="#388e3c"/>
      <circle cx="7" cy="13" r="1" fill="#388e3c"/>
      <rect x="9.25" y="12" width="2.5" height="2" rx="0.5" fill="#388e3c"/>
    </svg>`;
  }
  if (calculator === false) {
    return `<svg class="calc-icon calc-icon--no" viewBox="0 0 14 18" width="14" height="18" title="No calculator" aria-label="No calculator">
      <rect x="0.75" y="0.75" width="12.5" height="16.5" rx="1.5" fill="#fce4ec" stroke="#c62828" stroke-width="1.5"/>
      <rect x="2" y="2.5" width="10" height="3.5" rx="0.75" fill="#ef9a9a"/>
      <circle cx="3.5" cy="9" r="1" fill="#c62828"/>
      <circle cx="7" cy="9" r="1" fill="#c62828"/>
      <circle cx="10.5" cy="9" r="1" fill="#c62828"/>
      <circle cx="3.5" cy="13" r="1" fill="#c62828"/>
      <circle cx="7" cy="13" r="1" fill="#c62828"/>
      <rect x="9.25" y="12" width="2.5" height="2" rx="0.5" fill="#c62828"/>
      <line x1="1.5" y1="1.5" x2="12.5" y2="16.5" stroke="#c62828" stroke-width="1.75" stroke-linecap="round"/>
    </svg>`;
  }
  return '';
};

// KaTeX rendering helper
const renderMath = (element) => {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    });
  }
};
