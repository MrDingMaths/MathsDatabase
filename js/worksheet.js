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

const Worksheet = {
  allQuestions: [],
  selectedIds: new Set(),
  searchTerm: '',

  async init() {
    Filters.init({
      courseId: 'course-filter',
      topicId: 'topic-filter',
      subtopicId: 'subtopic-filter',
      difficultyId: 'difficulty-filter',
      onChange: (values) => this.loadQuestions(values)
    });

    document.getElementById('search-filter').addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.renderQuestionList();
    });

    document.getElementById('select-all').addEventListener('click', () => this.selectAll());
    document.getElementById('delect-all').addEventListener('click', () => this.deselectAll());
    document.getElementById('generate-worksheet').addEventListener('click', () => this.generate(false));
    document.getElementById('generate-with-answers').addEventListener('click', () => this.generate(true));
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

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state">No questions found.</div>';
      return;
    }

    container.innerHTML = filtered.map((q) => {
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
                return `<span class="badge badge--stage">${escapeHtml(parts.join(' › '))}</span>`;
              }).join('')}
            </div>
            <div class="question-card__meta-right">
              ${calcIcon(q.calculator)}
              ${q.difficulty ? `<span class="badge badge--difficulty">${escapeHtml(q.difficulty)}</span>` : ''}
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

  toggleQuestion(id) {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
    this.updateCount();
  },

  selectAll() {
    this.allQuestions.forEach(q => this.selectedIds.add(q.id));
    this.renderQuestionList();
  },

  deselectAll() {
    this.selectedIds.clear();
    this.renderQuestionList();
  },

  updateCount() {
    document.getElementById('selected-count').textContent =
      `${this.selectedIds.size} question${this.selectedIds.size !== 1 ? 's' : ''} selected`;
  },

  generate(showAnswers) {
    if (this.selectedIds.size === 0) {
      showToast('Please select at least one question', 'error');
      return;
    }

    const selected = this.allQuestions.filter(q => this.selectedIds.has(q.id));
    const preview = document.getElementById('worksheet-preview');
    preview.style.display = '';

    let html = `<div class="worksheet-header">
      <div class="worksheet-header__title">MrDingMaths</div>
      <div class="worksheet-header__subtitle">Worksheet - ${selected.length} question${selected.length !== 1 ? 's' : ''}</div>
    </div>`;

    selected.forEach((q, i) => {
      html += `<div class="worksheet-question">
        <p><span class="worksheet-question__number">${i + 1}.</span>${calcIcon(q.calculator)}
        <span class="worksheet-question__text">${renderTextWithImages(q.question_text || '')}</span></p>
        ${q.question_image_url ? `<img src="${escapeHtml(q.question_image_url)}" alt="Diagram" style="max-width:80%">` : ''}
        <div class="worksheet-question__answer-space"></div>
      </div>`;
    });

    if (showAnswers) {
      html += `<div class="answer-key">
        <div class="answer-key__title">Answer Key</div>`;
      selected.forEach((q, i) => {
        html += `<div class="answer-key__item">
          <p><strong>${i + 1}.</strong></p>
          ${q.solution_text ? `<div>${renderTextWithImages(q.solution_text)}</div>` : '<p>No solution provided.</p>'}
        </div>`;
      });
      html += '</div>';
    }

    preview.innerHTML = html;
    renderMath(preview);
    showToast(showAnswers ? 'Worksheet with answer key generated' : 'Worksheet generated');
  }
};

document.addEventListener('DOMContentLoaded', () => Worksheet.init());
