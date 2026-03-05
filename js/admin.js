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
    this.loadRecentQuestions();
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
      difficulty: parseInt(document.querySelector('input[name="difficulty"]:checked').value),
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
      await Questions.create(question);
      showToast('Question added successfully!');
      this.loadRecentQuestions();
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
  },

  async loadRecentQuestions() {
    try {
      const { data } = await Questions.fetch({ limit: 20, offset: 0 });
      const tbody = document.getElementById('recent-questions-body');

      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No questions yet.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(q => `
        <tr>
          <td>${escapeHtml((q.question_text || '').substring(0, 60))}...</td>
          <td>${escapeHtml(q.stage || '')}</td>
          <td>${escapeHtml(q.topic || '')}</td>
          <td>${q.difficulty || '-'}</td>
          <td class="questions-table__actions">
            <button class="btn btn--danger btn--small" onclick="Admin.deleteQuestion('${q.id}')">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading recent questions:', err);
    }
  },

  async deleteQuestion(id) {
    if (!confirm('Delete this question?')) return;
    try {
      await Questions.delete(id);
      showToast('Question deleted');
      this.loadRecentQuestions();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());