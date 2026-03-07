// Worksheet generator logic

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

const topicBadgeClass = (topicName) => {
  if (!topicName) return 'badge--topic-blue';
  if (/number|algebra|financial/i.test(topicName)) return 'badge--topic-blue';
  if (/geometry|measurement/i.test(topicName)) return 'badge--topic-green';
  if (/data|probability/i.test(topicName)) return 'badge--topic-red';
  return 'badge--topic-blue';
};

const difficultyBadgeClass = (difficulty) => {
  const map = { Foundation: 'badge--foundation', Development: 'badge--development', Mastery: 'badge--mastery', Challenge: 'badge--challenge' };
  return map[difficulty] || '';
};

const Worksheet = {
  allQuestions: [],
  selectedIds: new Set(),
  selectedQuestions: new Map(),
  searchTerm: '',
  sortBy: 'source',
  showSolutions: false,
  cardsExpanded: false,
  solutionsExpanded: false,

  async init() {
    Filters.init({
      courseId: 'course-filter',
      topicId: 'topic-filter',
      subtopicId: 'subtopic-filter',
      difficultyId: 'difficulty-filter',
      onChange: (values) => this.loadQuestions(values),
      chips: true
    });

    document.getElementById('search-filter').addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.renderQuestionList();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderQuestionList();
    });

    document.getElementById('toggle-cards-btn').addEventListener('click', () => this.toggleAllCards());
    document.getElementById('toggle-solutions-display-btn').addEventListener('click', () => this.toggleAllSolutions());

    document.getElementById('select-all').addEventListener('click', () => this.selectAll());
    document.getElementById('delect-all').addEventListener('click', () => this.deselectAll());
    document.getElementById('random-question-btn').addEventListener('click', () => this.addRandom());
    document.getElementById('generate-worksheet').addEventListener('click', () => this.generate());
    document.getElementById('toggle-solutions-btn').addEventListener('click', () => this.toggleSolutions());
    document.getElementById('print-btn').addEventListener('click', () => window.print());

    this.loadQuestions({});
  },

  async loadQuestions(filters) {
    try {
      const { data } = await Questions.fetch({ ...filters, limit: 50, offset: 0 });
      this.allQuestions = data || [];
      this.renderQuestionList();
    } catch (err) {
      showToast('Error loading questions', 'error');
    }
  },

  getSortedQuestions(questions) {
    const sorted = [...questions];
    if (this.sortBy === 'source') {
      sorted.sort((a, b) => naturalSort(a.source, b.source));
    } else if (this.sortBy === 'difficulty') {
      sorted.sort((a, b) => {
        const da = DIFFICULTY_ORDER[a.difficulty] ?? 99;
        const db = DIFFICULTY_ORDER[b.difficulty] ?? 99;
        return da - db;
      });
    } else if (this.sortBy === 'topic') {
      sorted.sort((a, b) => {
        const ta = (a.classifications || []).find(c => c.topic_id)?.topic_name || '';
        const tb = (b.classifications || []).find(c => c.topic_id)?.topic_name || '';
        return ta.localeCompare(tb);
      });
    } else if (this.sortBy === 'marks') {
      sorted.sort((a, b) => (a.marks || 0) - (b.marks || 0));
    }
    return sorted;
  },

  renderQuestionList() {
    const container = document.getElementById('questions-container');

    const filtered = this.searchTerm
      ? this.allQuestions.filter(q => {
          const text = [
            q.question_text,
            q.source,
            ...(q.tags || []),
            ...(q.classifications || []).flatMap(c => [c.course_label, c.topic_name, c.subtopic_name])
          ].filter(Boolean).join(' ').toLowerCase();
          return text.includes(this.searchTerm);
        })
      : this.allQuestions;

    const sorted = this.getSortedQuestions(filtered);

    if (sorted.length === 0) {
      container.innerHTML = '<div class="empty-state">No questions found.</div>';
      return;
    }

    container.innerHTML = sorted.map((q) => {
      const checked = this.selectedIds.has(q.id) ? 'checked' : '';
      return `<div class="question-card">
        <details class="question-card__collapsible">
          <summary class="question-card__summary">
            <label class="question-card__checkbox" onclick="event.stopPropagation()">
              <input type="checkbox" ${checked} onchange="Worksheet.toggleQuestion('${q.id}')">
            </label>
            <div class="question-card__meta">
              ${(q.classifications || []).filter(c => !c.topic_id).map(c =>
                `<span class="badge badge--stage">${escapeHtml(c.course_label)}</span>`
              ).join('')}
              ${q.source ? `<span class="badge badge--source">${escapeHtml(q.source)}</span>` : ''}
              ${(q.classifications || []).filter(c => c.topic_id).map(c => {
                const parts = [c.topic_name, c.subtopic_name].filter(Boolean);
                return `<span class="badge ${topicBadgeClass(c.topic_name)}">${escapeHtml(parts.join(' › '))}</span>`;
              }).join('')}
            </div>
            <div class="question-card__meta-right">
              ${calcIcon(q.calculator)}
              ${q.difficulty ? `<span class="badge badge--difficulty ${difficultyBadgeClass(q.difficulty)}">${escapeHtml(q.difficulty)}</span>` : ''}
              ${q.marks ? `<span class="badge">${q.marks} mark${q.marks !== 1 ? 's' : ''}</span>` : ''}
            </div>
          </summary>
          <div class="question-card__body">
            ${renderTextWithImages(q.question_text || '')}
            ${q.question_image_url ? `<br><img src="${escapeHtml(q.question_image_url)}" alt="Question diagram">` : ''}
          </div>
          <details class="question-card__solution">
            <summary>Show solution</summary>
            <div class="question-card__solution-content">
              ${renderTextWithImages(q.solution_text || '')}
              ${q.solution_image_url ? `<br><img src="${escapeHtml(q.solution_image_url)}" alt="Solution diagram">` : ''}
            </div>
          </details>
        </details>
      </div>`;
    }).join('');

    renderMath(container);
    this.updateCount();
  },

  toggleAllCards() {
    this.cardsExpanded = !this.cardsExpanded;
    document.querySelectorAll('#questions-container .question-card__collapsible').forEach(d => {
      d.open = this.cardsExpanded;
    });
    document.getElementById('toggle-cards-btn').textContent = this.cardsExpanded ? 'Collapse All' : 'Expand All';
  },

  toggleAllSolutions() {
    this.solutionsExpanded = !this.solutionsExpanded;
    document.querySelectorAll('#questions-container .question-card__solution').forEach(d => {
      d.open = this.solutionsExpanded;
    });
    document.getElementById('toggle-solutions-display-btn').textContent = this.solutionsExpanded ? 'Hide Solutions' : 'Show Solutions';
  },

  toggleQuestion(id) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
      this.selectedQuestions.delete(id);
    } else {
      this.selectedIds.add(id);
      const q = this.allQuestions.find(q => q.id === id);
      if (q) this.selectedQuestions.set(id, q);
    }
    this.updateCount();
    this.generate(true);
  },

  selectAll() {
    this.allQuestions.forEach(q => {
      this.selectedIds.add(q.id);
      this.selectedQuestions.set(q.id, q);
    });
    this.renderQuestionList();
    this.generate(true);
  },

  deselectAll() {
    this.selectedIds.clear();
    this.selectedQuestions.clear();
    this.renderQuestionList();
    this.generate(true);
  },

  removeQuestion(id) {
    this.selectedIds.delete(id);
    this.selectedQuestions.delete(id);
    this.renderQuestionList();
    this.generate(true);
  },

  addRandom() {
    const unselected = this.allQuestions.filter(q => !this.selectedIds.has(q.id));
    if (unselected.length === 0) {
      showToast('All filtered questions are already selected', 'error');
      return;
    }
    const q = unselected[Math.floor(Math.random() * unselected.length)];
    this.selectedIds.add(q.id);
    this.selectedQuestions.set(q.id, q);
    this.renderQuestionList();
    this.generate(true);
  },

  updateCount() {
    document.getElementById('selected-count').textContent =
      `${this.selectedIds.size} question${this.selectedIds.size !== 1 ? 's' : ''} selected`;
  },

  toggleSolutions() {
    this.showSolutions = !this.showSolutions;
    const btn = document.getElementById('toggle-solutions-btn');
    btn.textContent = this.showSolutions ? 'Remove Solutions' : 'Show Solutions';
    btn.classList.toggle('btn--primary', this.showSolutions);
    btn.classList.toggle('btn--success', !this.showSolutions);

    const preview = document.getElementById('worksheet-preview');
    if (preview.style.display !== 'none') {
      this.generate();
    }
  },

  generate(silent = false) {
    if (this.selectedIds.size === 0) {
      const preview = document.getElementById('worksheet-preview');
      preview.style.display = 'none';
      document.getElementById('worksheet-layout').classList.remove('worksheet-layout--split');
      if (!silent) showToast('Please select at least one question', 'error');
      return;
    }

    const selected = Array.from(this.selectedQuestions.values());

    // Sort by difficulty for worksheet output
    const ordered = [...selected].sort((a, b) => {
      const da = DIFFICULTY_ORDER[a.difficulty] ?? 99;
      const db = DIFFICULTY_ORDER[b.difficulty] ?? 99;
      return da - db;
    });

    const preview = document.getElementById('worksheet-preview');
    preview.style.display = '';
    document.getElementById('worksheet-layout').classList.add('worksheet-layout--split');

    const totalMarks = ordered.reduce((sum, q) => sum + (q.marks || 0), 0);
    let html = `<div class="worksheet-header">
      <div class="worksheet-header__top">
        <span class="worksheet-header__questions">${ordered.length} question${ordered.length !== 1 ? 's' : ''}</span>
        <span class="worksheet-header__marks">............... out of ${totalMarks} mark${totalMarks !== 1 ? 's' : ''}</span>
      </div>
      <div class="worksheet-header__subtitle">Worksheet generated at database.MrDingMaths.com</div>
    </div>`;

    ordered.forEach((q, i) => {
      html += `<div class="worksheet-question">
        <button class="worksheet-question__remove no-print" onclick="Worksheet.removeQuestion('${q.id}')" title="Remove question">✕</button>
        <p><span class="worksheet-question__number">${i + 1}.</span>${calcIcon(q.calculator)}
        <span class="worksheet-question__text">${renderTextWithImages(q.question_text || '')}</span></p>
        ${q.question_image_url ? `<img src="${escapeHtml(q.question_image_url)}" alt="Diagram" style="max-width:80%">` : ''}
        <div class="worksheet-question__answer-space"></div>
      </div>`;
    });

    if (this.showSolutions) {
      html += `<div class="answer-key">
        <div class="answer-key__title">Answers</div>`;
      ordered.forEach((q, i) => {
        html += `<div class="answer-key__item">
          <p><strong>${i + 1}.</strong></p>
          ${q.solution_text ? `<div>${renderTextWithImages(q.solution_text)}</div>` : '<p>No solution provided.</p>'}
        </div>`;
      });
      html += '</div>';
    }

    preview.innerHTML = html;
    renderMath(preview);
    if (!silent) showToast(this.showSolutions ? 'Worksheet with solutions generated' : 'Worksheet generated');
  }
};

document.addEventListener('DOMContentLoaded', () => Worksheet.init());
