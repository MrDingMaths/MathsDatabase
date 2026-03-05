// Question Browser - index.html logic

const App = {
  currentOffset: 0,
  pageSize: 20,
  totalCount: 0,

  init() {
    Filters.init({
      stageId: 'stage-filter',
      topicId: 'topic-filter',
      subtopicId: 'subtopic-filter',
      difficultyId: 'difficulty-filter',
      searchId: 'search-input',
      onChange: (values) => this.loadQuestions(values, true)
    });

    document.getElementById('load-more').addEventListener('click', () => {
      this.loadQuestions(Filters.getValues(), false);
    });

    this.loadQuestions({}, true);
  },

  async loadQuestions(filters, reset) {
    if (reset) this.currentOffset = 0;

    const container = document.getElementById('questions-container');
    if (reset) container.innerHTML = '<div class="loading">Loading questions...</div>';

    try {
      const { data, count } = await Questions.fetch({
        ...filters,
        limit: this.pageSize,
        offset: this.currentOffset
      });

      this.totalCount = count;

      if (reset) container.innerHTML = '';

      if (data.length === 0 && reset) {
        container.innerHTML = '<div class="empty-state">No questions found. Try adjusting your filters.</div>';
        document.getElementById('results-count').textContent = '';
        document.getElementById('load-more').style.display = 'none';
        return;
      }

      document.getElementById('results-count').textContent = `${count} question${count !== 1 ? 's' : ''} found`;

      data.forEach((q, i) => {
        const num = this.currentOffset + i + 1;
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = this.renderCard(q, num);
        container.appendChild(card);
      });

      this.currentOffset += data.length;

      const loadMore = document.getElementById('load-more');
      loadMore.style.display = this.currentOffset < this.totalCount ? '' : 'none';

      renderMath(container);
    } catch (err) {
      if (reset) container.innerHTML = '<div class="empty-state">Error loading questions. Please try again.</div>';
      showToast('Error loading questions', 'error');
    }
  },

  renderCard(q, num) {
    const tags = (q.tags || []).map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('');
    return `
      <details class="question-card__collapsible">
        <summary class="question-card__summary">
          <span class="question-card__number">${num}</span>
          <div class="question-card__meta">
            <span class="badge badge--stage">${escapeHtml(q.stage || '')}</span>
            <span class="badge badge--topic">${escapeHtml(q.topic || '')}</span>
            ${q.subtopic ? `<span class="badge badge--topic">${escapeHtml(q.subtopic)}</span>` : ''}
            ${q.difficulty ? `<span class="badge badge--difficulty">${escapeHtml(q.difficulty)}</span>` : ''}
            ${q.source ? `<span class="badge badge--source">${escapeHtml(q.source)}</span>` : ''}
          </div>
        </summary>
        <div class="question-card__body">
          ${q.question_text || ''}
          ${q.question_image_url ? `<br><img src="${escapeHtml(q.question_image_url)}" alt="Question diagram">` : ''}
        </div>
        <details class="question-card__solution">
          <summary>Show solution</summary>
          <div class="question-card__solution-content">
            ${q.solution_text || 'No solution provided.'}
            ${q.solution_image_url ? `<br><img src="${escapeHtml(q.solution_image_url)}" alt="Solution diagram">` : ''}
            ${q.answer ? `<p><strong>Answer:</strong> ${escapeHtml(q.answer)}</p>` : ''}
          </div>
        </details>
        ${tags ? `<div class="question-card__tags">${tags}</div>` : ''}
      </details>
    `;
  }
};

// Utility functions
const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

const showToast = (message, type = 'success') => {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;
  setTimeout(() => toast.classList.remove('toast--visible'), 3000);
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
