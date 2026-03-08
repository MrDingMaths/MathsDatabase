// Shared utility functions

const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

const renderTextWithImages = (text) => {
  const parts = text.split(/(\[img:[^\]]+\])/g);
  return parts.map(part => {
    const match = part.match(/^\[img:([^\]]+)\]$/);
    if (match) {
      return `<img src="${escapeHtml(match[1])}" style="max-width:100%;display:block;margin:0.5rem 0;" alt="diagram">`;
    }
    // Preserve newlines inside $$...$$ blocks so KaTeX auto-render can find them
    return part.split(/(\$\$[\s\S]*?\$\$)/g).map((segment, i) => {
      if (i % 2 === 1) return escapeHtml(segment); // inside display math — keep newlines
      return escapeHtml(segment)
        .replace(/\n(\[\d+\])/g, '<br><span style="display:block;text-align:right">$1</span>')
        .replace(/\n/g, '<br>');
    }).join('');
  }).join('');
};

const showToast = (message, type = 'success') => {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;
  setTimeout(() => toast.classList.remove('toast--visible'), 3000);
};

const naturalSort = (a, b) => {
  const pad = (v) => (v || '').replace(/(\d+)/g, n => n.padStart(10, '0'));
  return pad(a).localeCompare(pad(b));
};

const DIFFICULTY_ORDER = { Foundation: 0, Development: 1, Mastery: 2, Challenge: 3 };

const getSortedQuestions = (questions, sortBy) => {
  const sorted = [...questions];
  if (sortBy === 'source') {
    sorted.sort((a, b) => naturalSort(a.source, b.source));
  } else if (sortBy === 'difficulty') {
    sorted.sort((a, b) => {
      const da = DIFFICULTY_ORDER[a.difficulty] ?? 99;
      const db = DIFFICULTY_ORDER[b.difficulty] ?? 99;
      return da - db;
    });
  } else if (sortBy === 'topic') {
    sorted.sort((a, b) => {
      const ta = (a.classifications || []).find(c => c.topic_id)?.topic_name || '';
      const tb = (b.classifications || []).find(c => c.topic_id)?.topic_name || '';
      return ta.localeCompare(tb);
    });
  } else if (sortBy === 'marks') {
    sorted.sort((a, b) => (a.marks || 0) - (b.marks || 0));
  }
  return sorted;
};
