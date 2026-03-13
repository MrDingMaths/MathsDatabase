// Admin page logic

const stripKaTeX = (str) => str.replace(/\$\$?[^$]*\$\$?/g, String.fromCharCode(8230)).replace(/\\[a-zA-Z]+/g, String.fromCharCode(32));

const Admin = {
  editingId: null,
  taxonomy: { courses: [], topics: [], subtopics: [] },
  currentOffset: 0,
  currentTotal: 0,
  loadedQuestions: [],
  PAGE_SIZE: 30,
  PREFETCH_SIZE: 10,
  _prefetchedData: null,
  _prefetchedOffset: -1,
  pendingCourseIds: new Set(),
  pendingTopicCls: [],
  sortBy: 'source',
  cardsExpanded: false,
  solutionsExpanded: false,

  init() {
    this.setupLogin();
    this.checkSession();
  },

  setupLogin() {
    document.getElementById('login-btn').addEventListener('click', async () => {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');
      errorEl.textContent = '';

      try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.showAdmin();
      } catch (err) {
        errorEl.textContent = err.message || 'Login failed';
      }
    });
  },

  async checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) this.showAdmin();
  },

  showAdmin() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-section').style.display = '';
    this.setupForm();
    this.setupPreviews();
    this.setupBulkImport();
    this.loadTaxonomy();
    Filters.init({
      courseId: 'course-filter',
      topicId: 'topic-filter',
      subtopicId: 'subtopic-filter',
      difficultyId: 'difficulty-filter',
      searchId: 'search-filter',
      onChange: () => this.loadQuestions(true)
    });
    this.setupSortAndToggle();
    this.loadQuestions(true);
  },

  async loadTaxonomy() {
    this.taxonomy = await Questions.getTaxonomy();
    this.populateClsCourseCheckboxes();
    // Populate topic select once (independent of course)
    const topicEl = document.getElementById('cls-topic-select');
    topicEl.innerHTML = '<option value="">Select topic</option>' +
      this.taxonomy.topics.map(t => '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>').join('');
    document.getElementById('cls-topic-select').addEventListener('change', () => this.onClsTopicChange());
    document.getElementById('add-cls-btn').addEventListener('click', () => this.addTopicCls());
  },

  populateClsCourseCheckboxes() {
    const el = document.getElementById('cls-courses-checkboxes');
    el.innerHTML = this.taxonomy.courses.map(c =>
      '<label style="display:inline-flex;align-items:center;gap:0.3rem;margin-right:1rem;font-size:0.85rem;">' +
      '<input type="checkbox" value="' + c.id + '" onchange="Admin.onCourseCheckboxChange()"> ' +
      escapeHtml(c.label) + '</label>'
    ).join('');
  },

  onCourseCheckboxChange() {
    const checkboxes = document.querySelectorAll('#cls-courses-checkboxes input[type="checkbox"]');
    this.pendingCourseIds = new Set([...checkboxes].filter(cb => cb.checked).map(cb => cb.value));
  },

  onClsTopicChange() {
    const topicId = parseInt(document.getElementById('cls-topic-select').value, 10);
    const subtopics = this.taxonomy.subtopics.filter(s => !topicId || s.topic_id === topicId);
    const subtopicEl = document.getElementById('cls-subtopic-select');
    subtopicEl.innerHTML = '<option value="">None</option>' +
      subtopics.map(s => '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>').join('');
  },

  addTopicCls() {
    const topicEl = document.getElementById('cls-topic-select');
    const topicId = topicEl.value ? parseInt(topicEl.value, 10) : null;
    const subtopicEl = document.getElementById('cls-subtopic-select');
    const subtopicId = subtopicEl.value ? parseInt(subtopicEl.value, 10) : null;

    if (!topicId) { showToast('Please select a topic', 'error'); return; }

    const topic = this.taxonomy.topics.find(t => t.id === topicId);
    const subtopic = subtopicId ? this.taxonomy.subtopics.find(s => s.id === subtopicId) : null;

    const isDupe = this.pendingTopicCls.some(c =>
      c.topic_id === topicId && c.subtopic_id === subtopicId
    );
    if (isDupe) { showToast('Classification already added', 'error'); return; }

    this.pendingTopicCls.push({
      topic_id:      topicId,
      topic_name:    topic?.name || null,
      subtopic_id:   subtopicId,
      subtopic_name: subtopic?.name || null
    });
    this.renderTopicCls();
  },

  removeTopicCls(index) {
    this.pendingTopicCls.splice(index, 1);
    this.renderTopicCls();
  },

  renderTopicCls() {
    const el = document.getElementById('classifications-list');
    if (!this.pendingTopicCls.length) {
      el.innerHTML = '<div style="font-size:0.85rem;color:var(--color-text-light);padding:0.25rem 0;">No topic classifications added.</div>';
      return;
    }
    el.innerHTML = this.pendingTopicCls.map((c, i) => {
      const parts = [c.topic_name, c.subtopic_name].filter(Boolean);
      return '<div class="classification-tag">' +
        escapeHtml(parts.join(' › ')) +
        '<button type="button" class="classification-tag__remove" onclick="Admin.removeTopicCls(' + i + ')" title="Remove">×</button>' +
        '</div>';
    }).join('');
  },

  setupForm() {
    document.getElementById('question-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitQuestion();
    });

    document.getElementById('clear-form-btn').addEventListener('click', () => this.clearForm());
    document.getElementById('cancel-edit-btn').addEventListener('click', () => this.cancelEdit());
    document.getElementById('load-more-btn').addEventListener('click', () => this.loadQuestions(false));
    document.getElementById('question-insert-img-btn').addEventListener('click', () => this.insertInlineImage('question-text'));
    document.getElementById('solution-insert-img-btn').addEventListener('click', () => this.insertInlineImage('solution-text'));

    document.getElementById('question-text').addEventListener('paste', (e) => this.handleImagePaste(e, 'question-text'));
    document.getElementById('solution-text').addEventListener('paste', (e) => this.handleImagePaste(e, 'solution-text'));
    document.getElementById('feedback-insert-img-btn').addEventListener('click', () => this.insertInlineImage('markers-feedback'));
    document.getElementById('markers-feedback').addEventListener('paste', (e) => this.handleImagePaste(e, 'markers-feedback'));
  },

  setupPreviews() {
    let qTimeout, sTimeout, fTimeout;

    document.getElementById('question-text').addEventListener('input', (e) => {
      clearTimeout(qTimeout);
      qTimeout = setTimeout(() => {
        const preview = document.getElementById('question-preview');
        preview.innerHTML = renderTextWithImages(e.target.value);
        renderMath(preview);
      }, 300);
    });

    document.getElementById('solution-text').addEventListener('input', (e) => {
      clearTimeout(sTimeout);
      sTimeout = setTimeout(() => {
        const preview = document.getElementById('solution-preview');
        preview.innerHTML = renderTextWithImages(e.target.value);
        renderMath(preview);
      }, 300);
    });

    document.getElementById('markers-feedback').addEventListener('input', (e) => {
      clearTimeout(fTimeout);
      fTimeout = setTimeout(() => {
        const preview = document.getElementById('feedback-preview');
        preview.innerHTML = renderTextWithImages(e.target.value);
        renderMath(preview);
      }, 300);
    });
  },

  insertInlineImage(textareaId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (!input.files.length) return;
      const textarea = document.getElementById(textareaId);
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const placeholder = '[uploading...]';
      textarea.value = textarea.value.slice(0, start) + placeholder + textarea.value.slice(end);
      textarea.dispatchEvent(new Event('input'));
      try {
        const url = await Questions.uploadImage(input.files[0]);
        textarea.value = textarea.value.replace(placeholder, `\n[img:${url}]\n`);
      } catch (err) {
        textarea.value = textarea.value.replace(placeholder, '');
        showToast('Image upload failed: ' + err.message, 'error');
      }
      textarea.dispatchEvent(new Event('input'));
    };
    input.click();
  },

  handleImagePaste(e, textareaId) {
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'));
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    const textarea = document.getElementById(textareaId);
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const placeholder = '[uploading...]';
    textarea.value = textarea.value.slice(0, start) + placeholder + textarea.value.slice(end);
    textarea.dispatchEvent(new Event('input'));
    Questions.uploadImage(file).then(url => {
      textarea.value = textarea.value.replace(placeholder, `\n[img:${url}]\n`);
      textarea.dispatchEvent(new Event('input'));
    }).catch(err => {
      textarea.value = textarea.value.replace(placeholder, '');
      textarea.dispatchEvent(new Event('input'));
      showToast('Image upload failed: ' + err.message, 'error');
    });
  },

  async submitQuestion() {
    if (this.pendingCourseIds.size === 0 && this.pendingTopicCls.length === 0) {
      showToast('Please add at least one course or topic classification', 'error');
      return;
    }

    const calcVal = (document.querySelector('input[name="calculator"]:checked') || {}).value;
    const question = {
      question_text:      document.getElementById('question-text').value,
      solution_text:      document.getElementById('solution-text').value || null,
      markers_feedback:   document.getElementById('markers-feedback').value || null,
      difficulty:         (document.querySelector('input[name="difficulty"]:checked') || {}).value || 'Development',
      marks:              parseInt(document.getElementById('marks-input').value, 10) || 1,
      source:             document.getElementById('source-input').value || null,
      calculator:         calcVal === 'true' ? true : calcVal === 'false' ? false : null,
      tags:               document.getElementById('tags-input').value
        ? document.getElementById('tags-input').value.split(',').map(t => t.trim()).filter(Boolean)
        : []
    };

    if (!question.question_text) {
      showToast('Please fill in the question text', 'error');
      return;
    }

    try {
      let questionId;
      let updatedData = null;
      const wasEditing = !!this.editingId;
      if (this.editingId) {
        updatedData = await Questions.update(this.editingId, question);
        questionId = this.editingId;
        showToast('Question updated successfully!');
      } else {
        const created = await Questions.create(question);
        questionId = created.id;
        showToast('Question added successfully!');
        this.clearFormKeepContext();
      }

      const clsToSave = [
        ...[...this.pendingCourseIds].map(id => ({ course_id: id, topic_id: null, subtopic_id: null })),
        ...this.pendingTopicCls.map(c => ({ course_id: null, topic_id: c.topic_id, subtopic_id: c.subtopic_id }))
      ];
      await Questions.saveClassifications(questionId, clsToSave);

      if (wasEditing) {
        const courseClasses = [...this.pendingCourseIds].map(id => {
          const course = this.taxonomy.courses.find(c => c.id === id);
          return { course_id: id, course_label: course?.label || id, topic_id: null };
        });
        const topicClasses = this.pendingTopicCls.map(c => ({
          course_id: null,
          topic_id: c.topic_id,
          topic_name: c.topic_name,
          subtopic_id: c.subtopic_id || null,
          subtopic_name: c.subtopic_name || null
        }));
        const merged = { ...updatedData, classifications: [...courseClasses, ...topicClasses] };
        const idx = this.loadedQuestions.findIndex(q => q.id === questionId);
        this.cancelEdit();
        if (idx !== -1) {
          this.loadedQuestions[idx] = merged;
          this.renderAllLoaded();
        } else {
          this.loadQuestions(true);
        }
      } else {
        this.loadQuestions(true);
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },

  clearForm() {
    document.getElementById('question-form').reset();
    // reset() doesn't reliably clear radio groups with empty-string values
    const calcNone = document.querySelector('input[name="calculator"][value=""]');
    if (calcNone) calcNone.checked = true;
    document.getElementById('question-preview').innerHTML = '';
    document.getElementById('solution-preview').innerHTML = '';
    document.getElementById('feedback-preview').innerHTML = '';
    this.editingId = null;
    this.pendingCourseIds = new Set();
    this.pendingTopicCls = [];
    document.querySelectorAll('#cls-courses-checkboxes input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    this.renderTopicCls();
    document.getElementById('form-title').textContent = 'Add New Question';
    document.getElementById('submit-btn').textContent = 'Submit Question';
    document.getElementById('cancel-edit-btn').style.display = 'none';
  },

  clearFormKeepContext() {
    const savedCourseIds = new Set(this.pendingCourseIds);
    const savedTopicCls = [...this.pendingTopicCls];
    const diffChecked = document.querySelector('input[name="difficulty"]:checked');
    const diffVal = diffChecked ? diffChecked.value : null;

    document.getElementById('question-text').value = '';
    document.getElementById('solution-text').value = '';
    document.getElementById('markers-feedback').value = '';
    document.getElementById('marks-input').value = '1';
    document.getElementById('tags-input').value = '';
    document.getElementById('source-input').value = '';
    document.getElementById('question-preview').innerHTML = '';
    document.getElementById('solution-preview').innerHTML = '';
    document.getElementById('feedback-preview').innerHTML = '';
    this.editingId = null;

    this.pendingCourseIds = savedCourseIds;
    this.pendingTopicCls = savedTopicCls;
    document.querySelectorAll('#cls-courses-checkboxes input[type="checkbox"]').forEach(cb => {
      cb.checked = this.pendingCourseIds.has(cb.value);
    });
    this.renderTopicCls();

    if (diffVal) {
      const radio = document.querySelector('input[name="difficulty"][value="' + diffVal + '"]');
      if (radio) radio.checked = true;
    }

    document.getElementById('form-title').textContent = 'Add New Question';
    document.getElementById('submit-btn').textContent = 'Submit Question';
    document.getElementById('cancel-edit-btn').style.display = 'none';
  },

  cancelEdit() {
    this.clearForm();
  },

  editQuestion(id) {
    const question = this.loadedQuestions.find(q => q.id === id);
    if (!question) { showToast('Question not found', 'error'); return; }
    this.loadQuestionIntoForm(question);
  },

  duplicateQuestion(id) {
    const question = this.loadedQuestions.find(q => q.id === id);
    if (!question) { showToast('Question not found', 'error'); return; }
    this.loadQuestionIntoForm(question, true);
  },

  async loadQuestionIntoForm(question, isDuplicate = false) {
    document.getElementById('question-text').value = question.question_text || '';
    document.getElementById('solution-text').value = question.solution_text || '';
    document.getElementById('markers-feedback').value = question.markers_feedback || '';
    document.getElementById('marks-input').value = question.marks || 1;
    document.getElementById('tags-input').value = Array.isArray(question.tags) ? question.tags.join(', ') : (question.tags || '');
    document.getElementById('source-input').value = question.source || '';

    const diffRadio = document.querySelector(`input[name="difficulty"][value="${question.difficulty || 'Development'}"]`);
    if (diffRadio) diffRadio.checked = true;

    const calcRadioVal = question.calculator === true ? 'true' : question.calculator === false ? 'false' : '';
    const calcRadio = document.querySelector(`input[name="calculator"][value="${calcRadioVal}"]`);
    if (calcRadio) calcRadio.checked = true;


    const qPrev = document.getElementById('question-preview');
    qPrev.innerHTML = renderTextWithImages(question.question_text || '');
    renderMath(qPrev);
    const sPrev = document.getElementById('solution-preview');
    sPrev.innerHTML = renderTextWithImages(question.solution_text || '');
    renderMath(sPrev);
    const fPrev = document.getElementById('feedback-preview');
    fPrev.innerHTML = renderTextWithImages(question.markers_feedback || '');
    renderMath(fPrev);

    // Load classifications — use the data already fetched if available, otherwise fetch from DB
    const rawCls = question.classifications?.length
      ? question.classifications
      : await Questions.getClassifications(question.id);

    // Split into course rows and topic classification rows
    this.pendingCourseIds = new Set(
      rawCls.filter(c => c.course_id && !c.topic_id).map(c => c.course_id)
    );
    this.pendingTopicCls = rawCls
      .filter(c => c.topic_id)
      .map(c => ({
        topic_id:      c.topic_id,
        topic_name:    c.topic_name || null,
        subtopic_id:   c.subtopic_id   || null,
        subtopic_name: c.subtopic_name || null
      }));
    document.querySelectorAll('#cls-courses-checkboxes input[type="checkbox"]').forEach(cb => {
      cb.checked = this.pendingCourseIds.has(cb.value);
    });
    this.renderTopicCls();

    if (isDuplicate) {
      this.editingId = null;
      document.getElementById('form-title').textContent = 'Duplicate Question';
      document.getElementById('submit-btn').textContent = 'Submit Question';
    } else {
      this.editingId = question.id;
      document.getElementById('form-title').textContent = 'Edit Question';
      document.getElementById('submit-btn').textContent = 'Update Question';
    }
    document.getElementById('cancel-edit-btn').style.display = '';
    document.getElementById('form-title').scrollIntoView({ behavior: 'smooth' });
  },

  setupSortAndToggle() {
    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderAllLoaded();
    });

    document.getElementById('toggle-cards-btn').addEventListener('click', () => this.toggleAllCards());
    document.getElementById('toggle-solutions-display-btn').addEventListener('click', () => this.toggleAllSolutions());
  },

  renderAllLoaded() {
    const container = document.getElementById('questions-container');
    const openIds = new Set(
      [...container.querySelectorAll('.question-card__collapsible[open]')]
        .map(d => d.dataset.id)
    );
    container.innerHTML = '';
    this.appendQuestionRows(getSortedQuestions(this.loadedQuestions, this.sortBy));
    if (openIds.size) {
      container.querySelectorAll('.question-card__collapsible').forEach(d => {
        if (openIds.has(d.dataset.id)) d.open = true;
      });
    }
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

  async loadQuestions(reset) {
    if (reset) {
      this.currentOffset = 0;
      this.loadedQuestions = [];
      this._prefetchedData = null;
      this._prefetchedOffset = -1;
      document.getElementById('questions-container').innerHTML = '';
    }

    const { course, topic, subtopic, difficulty, search } = Filters.getValues();
    const filters = {
      search:     search || undefined,
      course:     course.length    ? course    : undefined,
      topic:      topic.length     ? topic     : undefined,
      subtopic:   subtopic.length  ? subtopic  : undefined,
      difficulty: difficulty.length? difficulty : undefined,
    };

    try {
      let data, count;

      // Use prefetched data if it matches current offset
      if (!reset && this._prefetchedData && this._prefetchedOffset === this.currentOffset) {
        data  = this._prefetchedData;
        count = this.currentTotal;
        this._prefetchedData   = null;
        this._prefetchedOffset = -1;
      } else {
        ({ data, count } = await Questions.fetch({ ...filters, limit: this.PAGE_SIZE, offset: this.currentOffset }));
        this.currentTotal = count || 0;
      }

      if (data && data.length > 0) {
        this.loadedQuestions.push(...data);
        this.currentOffset += data.length;
        if (reset) {
          this.appendQuestionRows(getSortedQuestions(this.loadedQuestions, this.sortBy));
        } else {
          // Re-render all loaded in sorted order when more are added
          this.renderAllLoaded();
        }
      }

      const container = document.getElementById('questions-container');
      if (this.loadedQuestions.length === 0) {
        container.innerHTML = '<div class="empty-state">No questions found.</div>';
      }

      document.getElementById('q-count').textContent =
        `Showing ${this.loadedQuestions.length} of ${this.currentTotal} questions`;

      const loadMoreBtn = document.getElementById('load-more-btn');
      loadMoreBtn.style.display = this.loadedQuestions.length < this.currentTotal ? '' : 'none';

      // Silently prefetch next batch if more questions exist
      if (this.loadedQuestions.length < this.currentTotal) {
        this._prefetchNext(filters, this.currentOffset);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  },

  async _prefetchNext(filters, offset) {
    try {
      const { data } = await Questions.fetch({ ...filters, limit: this.PREFETCH_SIZE, offset });
      this._prefetchedData   = data;
      this._prefetchedOffset = offset;
    } catch (_) {
      // Prefetch failure is non-critical — next manual fetch will recover
    }
  },

  appendQuestionRows(questions) {
    const container = document.getElementById('questions-container');
    const html = questions.map(q => {
      const courseBadges = (q.classifications || [])
        .filter(c => !c.topic_id)
        .map(c => `<span class="badge badge--stage">${escapeHtml(c.course_label)}</span>`)
        .join('');
      const topicBadges = (q.classifications || [])
        .filter(c => c.topic_id)
        .map(c => {
          const parts = [c.topic_name, c.subtopic_name].filter(Boolean);
          return `<span class="badge ${topicBadgeClass(c.topic_name)}">${escapeHtml(parts.join(' › '))}</span>`;
        }).join('');
      return `<div class="question-card">
        <details class="question-card__collapsible" data-id="${q.id}">
          <summary class="question-card__summary">
            <div class="question-card__rows">
              <div class="question-card__row">
                <div class="question-card__meta">
                  ${q.source ? `<span class="badge badge--source">${escapeHtml(q.source)}</span>` : ''}
                  ${courseBadges}
                </div>
                <div class="question-card__meta-right">
                  ${q.difficulty ? `<span class="badge badge--difficulty ${difficultyBadgeClass(q.difficulty)}">${escapeHtml(q.difficulty)}</span>` : ''}
                  ${calcIcon(q.calculator)}
                </div>
              </div>
              <div class="question-card__row">
                <div class="question-card__meta">
                  ${topicBadges}
                </div>
                <div class="question-card__meta-right">
                  ${q.marks ? `<span class="badge">${q.marks} mark${q.marks !== 1 ? 's' : ''}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="question-card__actions" onclick="event.stopPropagation()">
              <button class="btn btn--secondary btn--small" onclick="Admin.editQuestion('${q.id}')">Edit</button>
              <button class="btn btn--secondary btn--small" onclick="Admin.duplicateQuestion('${q.id}')">Dup</button>
              <button class="btn btn--danger btn--small" onclick="Admin.deleteQuestion('${q.id}')">Del</button>
            </div>
          </summary>
          <div class="question-card__body">
            ${renderTextWithImages(q.question_text || '')}
          </div>
          ${q.solution_text ? `<details class="question-card__solution">
            <summary>Show solution</summary>
            <div class="question-card__solution-content">
              ${renderTextWithImages(q.solution_text)}
            </div>
          </details>` : ''}
          ${q.markers_feedback ? `<details class="question-card__solution">
            <summary>Show feedback</summary>
            <div class="question-card__solution-content" style="border-left:3px solid #f59e0b;padding-left:0.75rem;">
              ${renderTextWithImages(q.markers_feedback)}
            </div>
          </details>` : ''}
        </details>
      </div>`;
    }).join('');
    container.insertAdjacentHTML('beforeend', html);
    renderMath(container);
  },

  async deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    try {
      await Questions.delete(id);
      showToast('Question deleted');
      if (this.editingId === id) this.cancelEdit();
      this.loadQuestions(true);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },

  // Bulk Import

  setupBulkImport() {
    const toggle = document.getElementById('bulk-import-toggle');
    const section = document.getElementById('bulk-import-section');
    if (!toggle || !section) return;

    toggle.addEventListener('click', () => {
      const visible = section.style.display !== 'none';
      section.style.display = visible ? 'none' : '';
      toggle.textContent = visible ? 'Show Bulk Import' : 'Hide Bulk Import';
    });

    document.getElementById('bulk-import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { document.getElementById('bulk-import-json').value = reader.result; };
      reader.readAsText(file);
    });

    document.getElementById('bulk-validate-btn').addEventListener('click', () => this.validateBulkImport());
    document.getElementById('bulk-submit-btn').addEventListener('click', () => this.submitBulkImport());
  },

  validateBulkImport() {
    const textarea = document.getElementById('bulk-import-json');
    const resultsEl = document.getElementById('bulk-import-results');
    const submitBtn = document.getElementById('bulk-submit-btn');
    submitBtn.style.display = 'none';
    resultsEl.innerHTML = '';

    let parsed;
    try {
      parsed = JSON.parse(textarea.value);
    } catch (e) {
      resultsEl.innerHTML = '<p style="color:var(--color-danger)">Invalid JSON: ' + escapeHtml(e.message) + '</p>';
      return;
    }

    if (!Array.isArray(parsed)) {
      resultsEl.innerHTML = '<p style="color:var(--color-danger)">JSON must be an array of question objects.</p>';
      return;
    }

    const required = ['question_text', 'difficulty'];
    const validDiffs = ['Foundation', 'Development', 'Mastery', 'Challenge'];
    const validCourses = this.taxonomy.courses.map(s => s.id);
    const errors = [];
    let validCount = 0;

    parsed.forEach((q, i) => {
      const rowErrors = [];
      required.forEach(f => {
        if (!q[f]) rowErrors.push('missing "' + f + '"');
      });
      // Must have either a classifications array or a course+topic
      const hasClassifications = Array.isArray(q.classifications) && q.classifications.length > 0;
      const hasLegacy = q.course && q.topic;
      if (!hasClassifications && !hasLegacy) {
        rowErrors.push('must have "classifications" array or "course"+"topic" fields');
      }
      if (q.difficulty && !validDiffs.includes(q.difficulty)) rowErrors.push('invalid difficulty');
      if (q.course && !validCourses.includes(q.course)) rowErrors.push('invalid course "' + q.course + '"');

      if (rowErrors.length) {
        errors.push('Row ' + (i + 1) + ': ' + rowErrors.join(', '));
      } else {
        validCount++;
      }
    });

    let html = '<p><strong>' + validCount + '</strong> valid, <strong>' + errors.length + '</strong> with errors out of ' + parsed.length + ' questions.</p>';
    if (errors.length) {
      html += '<ul style="color:var(--color-danger);font-size:0.85rem;">' +
        errors.map(e => '<li>' + escapeHtml(e) + '</li>').join('') + '</ul>';
    }
    if (validCount > 0) {
      submitBtn.style.display = '';
      submitBtn.textContent = 'Import ' + validCount + ' Valid Questions';
    }
    resultsEl.innerHTML = html;
    this._bulkParsed = parsed;
  },

  async submitBulkImport() {
    if (!this._bulkParsed) return;
    const submitBtn = document.getElementById('bulk-submit-btn');
    const resultsEl = document.getElementById('bulk-import-results');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Importing...';

    const required = ['question_text', 'difficulty'];
    const valid = this._bulkParsed.filter(q => required.every(f => q[f]));

    try {
      // Insert base question rows (without course/topic/subtopic)
      const toInsert = valid.map(({ classifications: _c, course: _co, topic: _t, subtopic: _st, ...rest }) => rest);
      const result = await Questions.bulkCreate(toInsert);

      // Save classifications for each created question
      const clsPromises = result.map((created, i) => {
        const src = valid[i];
        let clsRows = [];
        if (Array.isArray(src.classifications) && src.classifications.length) {
          // New format: [{course_id, topic_id, subtopic_id}]
          // Split any combined rows into separate course and topic rows
          src.classifications.forEach(c => {
            if (c.course_id) clsRows.push({ course_id: c.course_id, topic_id: null, subtopic_id: null });
            if (c.topic_id)  clsRows.push({ course_id: null, topic_id: c.topic_id, subtopic_id: c.subtopic_id || null });
          });
        } else if (src.course) {
          // Legacy format: resolve topic/subtopic by name
          const topic = this.taxonomy.topics.find(t => t.name === src.topic);
          const subtopicName = Array.isArray(src.subtopic) ? src.subtopic[0] : src.subtopic;
          const subtopic = subtopicName && topic
            ? this.taxonomy.subtopics.find(s => s.topic_id === topic.id && s.name === subtopicName)
            : null;
          clsRows = [
            { course_id: src.course, topic_id: null, subtopic_id: null },
            ...(topic ? [{ course_id: null, topic_id: topic.id, subtopic_id: subtopic?.id || null }] : [])
          ];
        }
        return clsRows.length ? Questions.saveClassifications(created.id, clsRows) : Promise.resolve();
      });
      await Promise.all(clsPromises);

      showToast('Successfully imported ' + result.length + ' questions!');
      resultsEl.innerHTML = '<p style="color:var(--color-success)">Imported ' + result.length + ' questions successfully.</p>';
      document.getElementById('bulk-import-json').value = '';
      this._bulkParsed = null;
      submitBtn.style.display = 'none';
      this.loadQuestions(true);
    } catch (err) {
      resultsEl.innerHTML += '<p style="color:var(--color-danger)">Import error: ' + escapeHtml(err.message) + '</p>';
    }
    submitBtn.disabled = false;
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
