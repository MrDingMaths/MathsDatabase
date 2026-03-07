// Filter cascade logic

const Filters = {
  stageEl: null,
  topicEl: null,
  subtopicEl: null,
  difficultyEl: null,
  searchEl: null,
  onChange: null,

  init({ stageId, topicId, subtopicId, difficultyId, searchId, onChange }) {
    this.stageEl = document.getElementById(stageId);
    this.topicEl = document.getElementById(topicId);
    this.subtopicEl = document.getElementById(subtopicId);
    this.difficultyEl = document.getElementById(difficultyId);
    if (searchId) this.searchEl = document.getElementById(searchId);
    this.onChange = onChange;

    // Close all panels when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.multi-select')) {
        document.querySelectorAll('.multi-select.open').forEach(el => el.classList.remove('open'));
      }
    });

    // Toggle open/close on button click
    [this.stageEl, this.topicEl, this.subtopicEl, this.difficultyEl].forEach(el => {
      if (!el) return;
      el.querySelector('.multi-select__toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = el.classList.contains('open');
        document.querySelectorAll('.multi-select.open').forEach(x => x.classList.remove('open'));
        if (!isOpen) el.classList.add('open');
      });
    });

    if (this.searchEl) {
      let timeout;
      this.searchEl.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => this.fireChange(), 400);
      });
    }

    this.populateMultiSelect(this.difficultyEl, ['A', 'B', 'C', 'D', 'E'], 'All Difficulties', () => this.fireChange());
    this.loadStages();
    this.loadTopics([]);
  },

  async loadStages() {
    const stages = await Questions.getStages();
    this.populateMultiSelect(this.stageEl, stages, 'All Stages', () => this.onStageChange());
  },

  async loadTopics(stages) {
    const topics = await Questions.getTopics(stages);
    this.populateMultiSelect(this.topicEl, topics, 'All Topics', () => this.onTopicChange());
    this.populateMultiSelect(this.subtopicEl, [], 'All Subtopics', () => this.fireChange());
  },

  async onStageChange() {
    const stages = this.getSelected(this.stageEl);
    await this.loadTopics(stages);
    this.fireChange();
  },

  async onTopicChange() {
    const stages = this.getSelected(this.stageEl);
    const topics = this.getSelected(this.topicEl);
    const subtopics = await Questions.getSubtopics(topics);
    this.populateMultiSelect(this.subtopicEl, subtopics, 'All Subtopics', () => this.fireChange());
    this.fireChange();
  },

  populateMultiSelect(el, items, placeholder, onChangeFn) {
    const panel = el.querySelector('.multi-select__panel');
    // items can be strings or {value, label} objects
    panel.innerHTML = items.map(item => {
      const val = typeof item === 'object' ? item.value : item;
      const lbl = typeof item === 'object' ? item.label : item;
      return `<label><input type="checkbox" value="${val}"> ${lbl}</label>`;
    }).join('');
    panel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        this.updateToggleLabel(el, placeholder);
        onChangeFn();
      });
    });
    this.updateToggleLabel(el, placeholder);
  },

  updateToggleLabel(el, placeholder) {
    const selected = this.getSelected(el);
    el.querySelector('.multi-select__toggle').textContent =
      selected.length === 0 ? placeholder : selected.join(', ');
  },

  getSelected(el) {
    return Array.from(el.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
  },

  getValues() {
    return {
      stage: this.getSelected(this.stageEl),
      topic: this.getSelected(this.topicEl),
      subtopic: this.getSelected(this.subtopicEl),
      difficulty: this.getSelected(this.difficultyEl),
      search: this.searchEl ? this.searchEl.value : ''
    };
  },

  fireChange() {
    if (this.onChange) this.onChange(this.getValues());
  }
};