// Filter cascade logic

const Filters = {
  courseEl: null,
  topicEl: null,
  subtopicEl: null,
  difficultyEl: null,
  searchEl: null,
  onChange: null,
  chipsMode: false,
  labels: {},

  init({ courseId, topicId, subtopicId, difficultyId, searchId, onChange, chips = false }) {
    this.courseEl = document.getElementById(courseId);
    this.topicEl = document.getElementById(topicId);
    this.subtopicEl = document.getElementById(subtopicId);
    this.difficultyEl = document.getElementById(difficultyId);
    if (searchId) this.searchEl = document.getElementById(searchId);
    this.onChange = onChange;
    this.chipsMode = chips;
    this.labels = {
      [courseId]: 'Course',
      [topicId]: 'Topic',
      [subtopicId]: 'Subtopic',
      [difficultyId]: 'Difficulty'
    };

    if (!chips) {
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
    }

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
    if (topics.length === 0) {
      this.populateMultiSelect(this.subtopicEl, [], 'All Subtopics', () => this.fireChange());
      this.fireChange();
      return;
    }
    const subtopics = await Questions.getSubtopics(topics);
    this.populateMultiSelect(this.subtopicEl, subtopics, 'All Subtopics', () => this.fireChange());
    this.fireChange();
  },

  populateMultiSelect(el, items, placeholder, onChangeFn) {
    if (this.chipsMode) {
      this.populateChips(el, items, placeholder, onChangeFn);
      return;
    }
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

  populateChips(el, items, placeholder, onChangeFn) {
    const label = this.labels[el.id] || placeholder.replace('All ', '');
    const prevSelected = new Set(this.getSelected(el));
    el.innerHTML = `<span class="filter-row__label">${label}:</span>` +
      items.map(item => {
        const val = typeof item === 'object' ? item.value : item;
        const lbl = typeof item === 'object' ? item.label : item;
        const checked = prevSelected.has(val) ? 'checked' : '';
        const active = prevSelected.has(val) ? ' chip--active' : '';
        return `<label class="chip${active}"><input type="checkbox" value="${val}" ${checked}>${lbl}</label>`;
      }).join('');
    el.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('label').classList.toggle('chip--active', cb.checked);
        onChangeFn();
      });
    });
  },

  updateToggleLabel(el, placeholder) {
    if (this.chipsMode) return;
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