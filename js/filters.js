// Filter cascade logic

const Filters = {
  courseEl: null,
  topicEl: null,
  subtopicEl: null,
  difficultyEl: null,
  searchEl: null,
  onChange: null,

  init({ courseId, topicId, subtopicId, difficultyId, searchId, onChange }) {
    this.courseEl = document.getElementById(courseId);
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
    [this.courseEl, this.topicEl, this.subtopicEl, this.difficultyEl].forEach(el => {
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

    this.populateMultiSelect(this.difficultyEl, ['Foundation', 'Development', 'Mastery', 'Challenge'], 'All Difficulties', () => this.fireChange());
    this.loadCourses();
    this.loadTopics();
  },

  async loadCourses() {
    const courses = await Questions.getCourses();
    this.populateMultiSelect(this.courseEl, courses, 'All Courses', () => this.fireChange());
  },

  async loadTopics() {
    const topics = await Questions.getTopics();
    this.populateMultiSelect(this.topicEl, topics, 'All Topics', () => this.onTopicChange());
    this.populateMultiSelect(this.subtopicEl, [], 'All Subtopics', () => this.fireChange());
  },

  async onTopicChange() {
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
      course: this.getSelected(this.courseEl),
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