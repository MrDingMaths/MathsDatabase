// Worksheet generator logic

const Worksheet = {
  PAGE_SIZE: 50,
  allQuestions: [],
  totalCount: 0,
  currentOffset: 0,
  currentFilters: {},
  selectedIds: new Set(),
  selectedQuestions: new Map(),
  searchTerm: '',
  sortBy: 'source',
  sortDir: 'asc',
  showSolutions: false,
  showFeedback: false,
  cardsExpanded: false,
  solutionsExpanded: false,

  async init() {
    Filters.init({
      courseId: 'course-filter',
      topicId: 'topic-filter',
      subtopicId: 'subtopic-filter',
      difficultyId: 'difficulty-filter',
      onChange: (values) => {
        if (!values.course.length) { this.showCoursePlaceholder(); return; }
        this.loadQuestions(values);
      },
      chips: true,
      hideTopicUntilCourse: true
    });

    document.getElementById('search-filter').addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.renderQuestionList();
    });

    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderQuestionList();
    });

    document.getElementById('sort-dir-btn').addEventListener('click', () => {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      document.getElementById('sort-dir-btn').textContent = this.sortDir === 'asc' ? '↑ Asc' : '↓ Desc';
      this.renderQuestionList();
    });

    document.getElementById('toggle-cards-btn').addEventListener('click', () => this.toggleAllCards());
    document.getElementById('toggle-solutions-display-btn').addEventListener('click', () => this.toggleAllSolutions());

    document.getElementById('select-all').addEventListener('click', () => this.selectAll());
    document.getElementById('delect-all').addEventListener('click', () => this.deselectAll());
    document.getElementById('random-question-btn').addEventListener('click', () => this.addRandom());
    document.getElementById('generate-worksheet').addEventListener('click', () => this.generate());
    document.getElementById('toggle-solutions-btn').addEventListener('click', () => this.toggleSolutions());
    document.getElementById('toggle-feedback-btn').addEventListener('click', () => this.toggleFeedback());
    document.getElementById('print-btn').addEventListener('click', () => window.print());
    document.getElementById('load-more-btn').addEventListener('click', () => this.loadMore());

    this.showCoursePlaceholder();
  },

  showCoursePlaceholder() {
    this.allQuestions = [];
    this.totalCount = 0;
    this.currentOffset = 0;
    const container = document.getElementById('questions-container');
    container.innerHTML = '<div class="empty-state">Select a course to view questions.</div>';
    const loadMoreContainer = document.getElementById('load-more-container');
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    const qCountEl = document.getElementById('q-count');
    if (qCountEl) qCountEl.textContent = '';
  },

  async loadQuestions(filters, reset = true) {
    try {
      if (reset) {
        this.currentFilters = filters;
        this.currentOffset = 0;
        this.allQuestions = [];
      }
      const { data, count } = await Questions.fetch({ ...this.currentFilters, limit: this.PAGE_SIZE, offset: this.currentOffset });
      this.allQuestions = reset ? (data || []) : [...this.allQuestions, ...(data || [])];
      this.totalCount = count || 0;
      this.currentOffset = this.allQuestions.length;
      const loadMoreContainer = document.getElementById('load-more-container');
      if (loadMoreContainer) loadMoreContainer.style.display = this.allQuestions.length < this.totalCount ? '' : 'none';
      this.renderQuestionList();
    } catch (err) {
      showToast('Error loading questions', 'error');
    }
  },

  loadMore() {
    this.loadQuestions(this.currentFilters, false);
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

    const sorted = getSortedQuestions(filtered, this.sortBy, this.sortDir);

    const qCountEl = document.getElementById('q-count');
    if (qCountEl) qCountEl.textContent = `Showing ${sorted.length} of ${this.totalCount} questions`;

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
            <div class="question-card__rows">
              <div class="question-card__row">
                <div class="question-card__meta">
                  ${q.source ? `<span class="badge badge--source">${escapeHtml(q.source)}</span>` : ''}
                  ${(q.classifications || []).filter(c => !c.topic_id).map(c =>
                    `<span class="badge badge--stage">${escapeHtml(c.course_label)}</span>`
                  ).join('')}
                </div>
                <div class="question-card__meta-right">
                  ${q.difficulty ? `<span class="badge badge--difficulty ${difficultyBadgeClass(q.difficulty)}">${escapeHtml(q.difficulty)}</span>` : ''}
                  ${calcIcon(q.calculator)}
                </div>
              </div>
              <div class="question-card__row">
                <div class="question-card__meta">
                  ${(q.classifications || []).filter(c => c.topic_id).map(c => {
                    const parts = [c.topic_name, c.subtopic_name].filter(Boolean);
                    return `<span class="badge ${topicBadgeClass(c.topic_name)}">${escapeHtml(parts.join(' › '))}</span>`;
                  }).join('')}
                </div>
                <div class="question-card__meta-right">
                  ${q.marks ? `<span class="badge">${q.marks} mark${q.marks !== 1 ? 's' : ''}</span>` : ''}
                </div>
              </div>
            </div>
          </summary>
          <div class="question-card__body">
            ${renderTextWithImages(q.question_text || '')}
          </div>
          <details class="question-card__solution">
            <summary>Show solution</summary>
            <div class="question-card__solution-content">
              ${renderTextWithImages(q.solution_text || '')}
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

  async addRandom() {
    let pool = this.allQuestions;
    if (this.allQuestions.length < this.totalCount) {
      const { data } = await Questions.fetch({ ...this.currentFilters, limit: this.totalCount, offset: 0 });
      pool = data || [];
    }
    const unselected = pool.filter(q => !this.selectedIds.has(q.id));
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

    if (this.selectedIds.size > 0) {
      this.generate();
    }
  },

  toggleFeedback() {
    this.showFeedback = !this.showFeedback;
    const btn = document.getElementById('toggle-feedback-btn');
    btn.textContent = this.showFeedback ? 'Remove Feedback' : 'Show Feedback';
    btn.classList.toggle('btn--primary', this.showFeedback);
    btn.classList.toggle('btn--success', !this.showFeedback);

    if (this.selectedIds.size > 0) {
      this.generate();
    }
  },

  generate(silent = false) {
    if (this.selectedIds.size === 0) {
      document.getElementById('worksheet-preview-outer').style.display = 'none';
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

    document.getElementById('worksheet-preview-outer').style.display = '';
    document.getElementById('worksheet-layout').classList.add('worksheet-layout--split');
    const preview = document.getElementById('worksheet-preview');

    const totalMarks = ordered.reduce((sum, q) => sum + (q.marks || 0), 0);
    let html = `<div class="worksheet-header">
      <div class="worksheet-header__brand">
        <img src="favicon.ico" alt="MathsBase logo" class="worksheet-header__logo">
        <div class="worksheet-header__brand-text">
          <span class="worksheet-header__brand-name">MathsBase Worksheet Generator</span>
          <span class="worksheet-header__brand-url">https://mathsbase.mrdingmaths.com/</span>
        </div>
      </div>
      <div class="worksheet-header__top">
        <span class="worksheet-header__questions">${ordered.length} question${ordered.length !== 1 ? 's' : ''}</span>
        <span class="worksheet-header__marks"><span class="worksheet-header__score-box"></span> out of ${totalMarks} mark${totalMarks !== 1 ? 's' : ''}</span>
      </div>
    </div>`;

    ordered.forEach((q, i) => {
      html += `<div class="worksheet-question">
        <button class="worksheet-question__remove no-print" onclick="Worksheet.removeQuestion('${q.id}')" title="Remove question">✕</button>
        <div class="worksheet-question__meta">
          <span class="worksheet-question__number">${i + 1}.</span>
          ${calcIcon(q.calculator)}
          ${q.source ? `<span class="badge badge--source">${escapeHtml(q.source)}</span>` : ''}
          ${q.difficulty ? `<span class="badge badge--difficulty ${difficultyBadgeClass(q.difficulty)}">${escapeHtml(q.difficulty)}</span>` : ''}
        </div>
        <span class="worksheet-question__text">${renderTextWithImages(q.question_text || '')}</span>
        <div class="worksheet-question__answer-space"></div>
      </div>`;
    });

    if (this.showSolutions || this.showFeedback) {
      html += `<div class="answer-key">
        <div class="answer-key__title">Solutions</div>`;
      ordered.forEach((q, i) => {
        html += `<div class="answer-key__item">
          <p><strong>${i + 1}.</strong></p>`;
        if (this.showSolutions) {
          html += q.solution_text ? `<div>${renderTextWithImages(q.solution_text)}</div>` : '<p>No solution provided.</p>';
        }
        if (this.showFeedback && q.markers_feedback) {
          html += `<div class="answer-key__feedback">
            <p class="answer-key__feedback-label">Feedback</p>
            <div>${renderTextWithImages(q.markers_feedback)}</div>
          </div>`;
        }
        html += '</div>';
      });
      html += '</div>';
    }

    html += `<div class="worksheet-footer">
      <span class="worksheet-footer__url">https://mathsbase.mrdingmaths.com/</span>
    </div>`;

    preview.innerHTML = html;
    renderMath(preview);
    const parts = [];
    if (this.showSolutions) parts.push('solutions');
    if (this.showFeedback) parts.push('feedback');
    if (!silent) showToast(parts.length ? `Worksheet with ${parts.join(' and ')} generated` : 'Worksheet generated');
  }
};

document.addEventListener('DOMContentLoaded', () => Worksheet.init());
