// Admin page logic

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

const Admin = {
  questionImageUrl: null,
  solutionImageUrl: null,
  editingId: null,
  currentOffset: 0,
  currentTotal: 0,
  loadedQuestions: [],
  PAGE_SIZE: 20,

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
    this.setupDropZones();
    this.setupQuestionSearch();
    this.loadQuestions(true);
  },

  setupForm() {
    const answerType = document.getElementById('answer-type');
    answerType.addEventListener('change', () => {
      document.getElementById('choices-section').style.display =
        answerType.value === 'multiple_choice' ? '' : 'none';
    });

    document.getElementById('question-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitQuestion();
    });

    document.getElementById('clear-form-btn').addEventListener('click', () => this.clearForm());
    document.getElementById('cancel-edit-btn').addEventListener('click', () => this.cancelEdit());
    document.getElementById('load-more-btn').addEventListener('click', () => this.loadQuestions(false));
  },

  setupPreviews() {
    let qTimeout, sTimeout;

    document.getElementById('question-text').addEventListener('input', (e) => {
      clearTimeout(qTimeout);
      qTimeout = setTimeout(() => {
        const preview = document.getElementById('question-preview');
        preview.innerHTML = e.target.value;
        renderMath(preview);
      }, 300);
    });

    document.getElementById('solution-text').addEventListener('input', (e) => {
      clearTimeout(sTimeout);
      sTimeout = setTimeout(() => {
        const preview = document.getElementById('solution-preview');
        preview.innerHTML = e.target.value;
        renderMath(preview);
      }, 300);
    });
  },

  setupDropZones() {
    this.initDropZone('question-drop-zone', 'question-image-input', 'question-image-preview-container', 'question');
    this.initDropZone('solution-drop-zone', 'solution-image-input', 'solution-image-preview-container', 'solution');
  },

  setupQuestionSearch() {
    let searchTimeout;
    const triggerSearch = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this.loadQuestions(true), 300);
    };
    document.getElementById('q-search').addEventListener('input', triggerSearch);
    document.getElementById('q-stage-filter').addEventListener('change', () => this.loadQuestions(true));
    document.getElementById('q-topic-filter').addEventListener('input', triggerSearch);
    document.getElementById('q-difficulty-filter').addEventListener('change', () => this.loadQuestions(true));
  },

  initDropZone(zoneId, inputId, previewId, type) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drop-zone--active'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drop-zone--active'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drop-zone--active');
      if (e.dataTransfer.files.length) this.handleImageFile(e.dataTransfer.files[0], preview, type);
    });
    input.addEventListener('change', () => {
      if (input.files.length) this.handleImageFile(input.files[0], preview, type);
    });
  },

  async handleImageFile(file, previewContainer, type) {
    try {
      previewContainer.innerHTML = '<span style="color:var(--color-text-light);font-size:0.85rem;">Uploading...</span>';
      const url = await Questions.uploadImage(file);
      if (type === 'question') this.questionImageUrl = url;
      else this.solutionImageUrl = url;
      previewContainer.innerHTML = `<img src="${url}" class="drop-zone__preview" alt="Uploaded image">`;
    } catch (err) {
      previewContainer.innerHTML = '';
      showToast('Image upload failed: ' + err.message, 'error');
    }
  },

  async submitQuestion() {
    const question = {
      question_text: document.getElementById('question-text').value,
      solution_text: document.getElementById('solution-text').value || null,
      stage: document.getElementById('stage-select').value,
      topic: document.getElementById('topic-input').value,
      subtopic: document.getElementById('subtopic-input').value || null,
      difficulty: document.querySelector('input[name="difficulty"]:checked').value,
      answer: document.getElementById('answer-input').value,
      answer_type: document.getElementById('answer-type').value,
      question_image_url: this.questionImageUrl,
      solution_image_url: this.solutionImageUrl,
      source: document.getElementById('source-input').value || null,
      tags: document.getElementById('tags-input').value
        ? document.getElementById('tags-input').value.split(',').map(t => t.trim()).filter(Boolean)
        : [],
      choices: null
    };

    if (question.answer_type === 'multiple_choice') {
      question.choices = [
        document.getElementById('choice-a').value,
        document.getElementById('choice-b').value,
        document.getElementById('choice-c').value,
        document.getElementById('choice-d').value
      ];
    }

    if (!question.question_text || !question.stage || !question.topic) {
      showToast('Please fill in question text, stage, and topic', 'error');
      return;
    }

    try {
      if (this.editingId) {
        await Questions.update(this.editingId, question);
        showToast('Question updated successfully!');
        this.cancelEdit();
      } else {
        await Questions.create(question);
        showToast('Question added successfully!');
        this.clearForm();
      }
      this.loadQuestions(true);
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  },

  clearForm() {
    document.getElementById('question-form').reset();
    document.getElementById('question-preview').innerHTML = '';
    document.getElementById('solution-preview').innerHTML = '';
    document.getElementById('question-image-preview-container').innerHTML = '';
    document.getElementById('solution-image-preview-container').innerHTML = '';
    document.getElementById('choices-section').style.display = 'none';
    this.questionImageUrl = null;
    this.solutionImageUrl = null;
    this.editingId = null;
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

  loadQuestionIntoForm(question) {
    document.getElementById('question-text').value = question.question_text || '';
    document.getElementById('solution-text').value = question.solution_text || '';
    document.getElementById('stage-select').value = question.stage || '';
    document.getElementById('topic-input').value = question.topic || '';
    document.getElementById('subtopic-input').value = question.subtopic || '';
    document.getElementById('answer-input').value = question.answer || '';
    document.getElementById('answer-type').value = question.answer_type || 'exact';
    document.getElementById('tags-input').value = Array.isArray(question.tags) ? question.tags.join(', ') : (question.tags || '');
    document.getElementById('source-input').value = question.source || '';

    const diffRadio = document.querySelector(`input[name="difficulty"][value="${question.difficulty || 'C'}"]`);
    if (diffRadio) diffRadio.checked = true;

    const isMultiChoice = question.answer_type === 'multiple_choice';
    document.getElementById('choices-section').style.display = isMultiChoice ? '' : 'none';
    if (isMultiChoice && Array.isArray(question.choices)) {
      document.getElementById('choice-a').value = question.choices[0] || '';
      document.getElementById('choice-b').value = question.choices[1] || '';
      document.getElementById('choice-c').value = question.choices[2] || '';
      document.getElementById('choice-d').value = question.choices[3] || '';
    }

    this.questionImageUrl = question.question_image_url || null;
    this.solutionImageUrl = question.solution_image_url || null;
    const qImgPreview = document.getElementById('question-image-preview-container');
    const sImgPreview = document.getElementById('solution-image-preview-container');
    qImgPreview.innerHTML = this.questionImageUrl ? `<img src="${this.questionImageUrl}" class="drop-zone__preview" alt="Question image">` : '';
    sImgPreview.innerHTML = this.solutionImageUrl ? `<img src="${this.solutionImageUrl}" class="drop-zone__preview" alt="Solution image">` : '';

    const qPrev = document.getElementById('question-preview');
    qPrev.innerHTML = question.question_text || '';
    renderMath(qPrev);
    const sPrev = document.getElementById('solution-preview');
    sPrev.innerHTML = question.solution_text || '';
    renderMath(sPrev);

    this.editingId = question.id;
    document.getElementById('form-title').textContent = 'Edit Question';
    document.getElementById('submit-btn').textContent = 'Update Question';
    document.getElementById('cancel-edit-btn').style.display = '';

    document.getElementById('form-title').scrollIntoView({ behavior: 'smooth' });
  },

  async loadQuestions(reset) {
    if (reset) {
      this.currentOffset = 0;
      this.loadedQuestions = [];
      document.getElementById('recent-questions-body').innerHTML = '';
    }

    const filters = {
      search: document.getElementById('q-search').value || undefined,
      stage: document.getElementById('q-stage-filter').value || undefined,
      topic: document.getElementById('q-topic-filter').value || undefined,
      difficulty: document.getElementById('q-difficulty-filter').value || undefined,
      limit: this.PAGE_SIZE,
      offset: this.currentOffset
    };

    try {
      const { data, count } = await Questions.fetch(filters);
      this.currentTotal = count || 0;

      if (data && data.length > 0) {
        this.loadedQuestions.push(...data);
        this.currentOffset += data.length;
        this.appendQuestionRows(data);
      }

      const tbody = document.getElementById('recent-questions-body');
      if (this.loadedQuestions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No questions found.</td></tr>';
      }

      document.getElementById('q-count').textContent =
        `Showing ${this.loadedQuestions.length} of ${this.currentTotal} questions`;

      const loadMoreBtn = document.getElementById('load-more-btn');
      loadMoreBtn.style.display = this.loadedQuestions.length < this.currentTotal ? '' : 'none';
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  },

  appendQuestionRows(questions) {
    const tbody = document.getElementById('recent-questions-body');
    const rows = questions.map(q => `
      <tr>
        <td>${escapeHtml((q.question_text || '').substring(0, 60))}${q.question_text && q.question_text.length > 60 ? '...' : ''}</td>
        <td>${escapeHtml(q.stage || '')}</td>
        <td>${escapeHtml(q.topic || '')}</td>
        <td>${q.difficulty || '-'}</td>
        <td class="questions-table__actions">
          <button class="btn btn--secondary btn--small" onclick="Admin.editQuestion('${q.id}')">Edit</button>
          <button class="btn btn--danger btn--small" onclick="Admin.deleteQuestion('${q.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
    tbody.insertAdjacentHTML('beforeend', rows);
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
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
