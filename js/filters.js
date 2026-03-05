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

    this.stageEl.addEventListener('change', () => this.onStageChange());
    this.topicEl.addEventListener('change', () => this.onTopicChange());
    this.subtopicEl.addEventListener('change', () => this.fireChange());
    this.difficultyEl.addEventListener('change', () => this.fireChange());

    if (this.searchEl) {
      let timeout;
      this.searchEl.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => this.fireChange(), 400);
      });
    }

    this.loadStages();
  },

  async loadStages() {
    const stages = await Questions.getStages();
    this.populateSelect(this.stageEl, stages, 'All Stages');
  },

  async onStageChange() {
    const stage = this.stageEl.value;
    const topics = await Questions.getTopics(stage);
    this.populateSelect(this.topicEl, topics, 'All Topics');
    this.populateSelect(this.subtopicEl, [], 'All Subtopics');
    this.fireChange();
  },

  async onTopicChange() {
    const stage = this.stageEl.value;
    const topic = this.topicEl.value;
    const subtopics = await Questions.getSubtopics(stage, topic);
    this.populateSelect(this.subtopicEl, subtopics, 'All Subtopics');
    this.fireChange();
  },

  populateSelect(el, items, defaultLabel) {
    el.innerHTML = `<option value="">${defaultLabel}</option>` +
      items.map(item => `<option value="${item}">${item}</option>`).join('');
  },

  getValues() {
    return {
      stage: this.stageEl.value,
      topic: this.topicEl.value,
      subtopic: this.subtopicEl.value,
      difficulty: this.difficultyEl.value,
      search: this.searchEl ? this.searchEl.value : ''
    };
  },

  fireChange() {
    if (this.onChange) this.onChange(this.getValues());
  }
};
