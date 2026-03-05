// Quiz mode logic

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

const Quiz = {
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: 0,
  hasAnswered: false,
  incorrectQuestions: [],
  selectedChoiceIndex: null,

  async init() {
    await this.loadStages();

    document.getElementById('quiz-stage').addEventListener('change', async () => {
      const stage = document.getElementById('quiz-stage').value;
      const topics = await Questions.getTopics(stage);
      const topicEl = document.getElementById('quiz-topic');
      topicEl.innerHTML = '<option value="">All Topics</option>' +
        topics.map(t => `<option value="${t}">${t}</option>`).join('');
    });

    document.getElementById('start-quiz').addEventListener('click', () => this.startQuiz());
    document.getElementById('quiz-next').addEventListener('click', () => this.nextQuestion());
  },

  async loadStages() {
    const stages = await Questions.getStages();
    const el = document.getElementById('quiz-stage');
    el.innerHTML = '<option value="">All Stages</option>' +
      stages.map(s => `<option value="${s}">${s}</option>`).join('');
  },

  async startQuiz() {
    const stage = document.getElementById('quiz-stage').value;
    const topic = document.getElementById('quiz-topic').value;

    try {
      const { data } = await Questions.fetch({ stage, topic, limit: 50, offset: 0 });
      if (!data || data.length === 0) {
        showToast('No questions found for this selection', 'error');
        return;
      }

      this.questions = data.sort(() => Math.random() - 0.5);
      this.currentIndex = 0;
      this.score = 0;
      this.answered = 0;
      this.incorrectQuestions = [];

      document.getElementById('quiz-setup').style.display = 'none';
      document.getElementById('quiz-area').style.display = '';
      document.getElementById('quiz-end').style.display = 'none';

      this.showQuestion();
    } catch (err) {
      showToast('Error loading quiz questions', 'error');
    }
  },

  showQuestion() {
    this.hasAnswered = false;
    this.selectedChoiceIndex = null;
    const q = this.questions[this.currentIndex];

    document.getElementById('quiz-progress-text').textContent =
      `Question ${this.currentIndex + 1} of ${this.questions.length}`;
    document.getElementById('quiz-score').textContent =
      `Score: ${this.score}/${this.answered}`;

    const questionEl = document.getElementById('quiz-question');
    let html = `<div class="quiz-question__text">
      ${q.question_text || ''}
      ${q.question_image_url ? `<br><img src="${escapeHtml(q.question_image_url)}" alt="Question diagram">` : ''}
    </div>`;

    if (q.answer_type === 'multiple_choice' && q.choices) {
      const labels = ['A', 'B', 'C', 'D'];
      html += '<div class="quiz-choices">';
      q.choices.forEach((choice, i) => {
        html += `<div class="quiz-choice" data-index="${i}" onclick="Quiz.selectChoice(${i})">
          <span class="quiz-choice__label">${labels[i]}</span>
          <span>${choice}</span>
        </div>`;
      });
      html += '</div>';
      html += '<button class="btn btn--primary" onclick="Quiz.submitMC()">Submit</button>';
    } else {
      html += `<div class="quiz-answer-input">
        <input type="text" id="quiz-answer" placeholder="Enter your answer..." onkeydown="if(event.key==='Enter')Quiz.submitExact()">
        <button class="btn btn--primary" onclick="Quiz.submitExact()">Submit</button>
      </div>`;
    }

    questionEl.innerHTML = html;
    document.getElementById('quiz-feedback').style.display = 'none';
    document.getElementById('quiz-next').style.display = 'none';

    renderMath(questionEl);
  },

  selectChoice(index) {
    if (this.hasAnswered) return;
    this.selectedChoiceIndex = index;
    document.querySelectorAll('.quiz-choice').forEach((el, i) => {
      el.classList.toggle('quiz-choice--selected', i === index);
    });
  },

  submitMC() {
    if (this.hasAnswered || this.selectedChoiceIndex === null) return;
    const q = this.questions[this.currentIndex];
    const labels = ['A', 'B', 'C', 'D'];
    const selectedAnswer = labels[this.selectedChoiceIndex];
    const isCorrect = selectedAnswer === q.answer ||
      q.choices[this.selectedChoiceIndex] === q.answer;

    this.showFeedback(isCorrect, q);

    document.querySelectorAll('.quiz-choice').forEach((el, i) => {
      const choiceLabel = labels[i];
      if (choiceLabel === q.answer || q.choices[i] === q.answer) {
        el.classList.add('quiz-choice--correct');
      } else if (i === this.selectedChoiceIndex && !isCorrect) {
        el.classList.add('quiz-choice--incorrect');
      }
    });
  },

  submitExact() {
    if (this.hasAnswered) return;
    const input = document.getElementById('quiz-answer');
    if (!input || !input.value.trim()) return;

    const q = this.questions[this.currentIndex];
    const userAnswer = input.value.trim();
    let isCorrect = false;

    if (q.answer_type === 'numeric_tolerance') {
      const expected = parseFloat(q.answer);
      const given = parseFloat(userAnswer);
      isCorrect = !isNaN(expected) && !isNaN(given) && Math.abs(expected - given) < 0.01;
    } else {
      isCorrect = userAnswer.toLowerCase() === (q.answer || '').toLowerCase();
    }

    this.showFeedback(isCorrect, q);
  },

  showFeedback(isCorrect, q) {
    this.hasAnswered = true;
    this.answered++;
    if (isCorrect) this.score++;
    else this.incorrectQuestions.push(q);

    document.getElementById('quiz-score').textContent =
      `Score: ${this.score}/${this.answered}`;

    const feedbackEl = document.getElementById('quiz-feedback');
    feedbackEl.style.display = '';
    feedbackEl.className = `quiz-feedback quiz-feedback--${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackEl.innerHTML = `
      <strong>${isCorrect ? 'Correct!' : 'Incorrect'}</strong>
      ${!isCorrect && q.answer ? `<br>The answer is: ${escapeHtml(q.answer)}` : ''}
      ${q.solution_text ? `<div class="quiz-feedback__solution">${q.solution_text}</div>` : ''}
    `;
    renderMath(feedbackEl);

    const isLast = this.currentIndex >= this.questions.length - 1;
    const nextBtn = document.getElementById('quiz-next');
    nextBtn.style.display = '';
    nextBtn.textContent = isLast ? 'Finish Quiz' : 'Next';
  },

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex >= this.questions.length) {
      this.showEndScreen();
    } else {
      this.showQuestion();
    }
  },

  showEndScreen() {
    document.getElementById('quiz-area').style.display = 'none';
    const endEl = document.getElementById('quiz-end');
    endEl.style.display = '';

    const pct = this.answered > 0 ? Math.round((this.score / this.answered) * 100) : 0;

    let html = `
      <div class="quiz-end__score">${this.score} / ${this.answered}</div>
      <div class="quiz-end__summary">${pct}% correct</div>
      <button class="btn btn--primary" onclick="Quiz.restart()">Try Again</button>
    `;

    if (this.incorrectQuestions.length > 0) {
      html += `<div class="quiz-end__incorrect">
        <h3 class="quiz-end__incorrect-title">Questions to review:</h3>`;
      this.incorrectQuestions.forEach((q) => {
        html += `<div class="question-card" style="margin-bottom:1rem;padding:1rem;">
          <div class="question-card__body">${q.question_text || ''}</div>
          <p style="margin-top:0.5rem;"><strong>Answer:</strong> ${escapeHtml(q.answer || '')}</p>
          ${q.solution_text ? `<div style="margin-top:0.5rem;color:var(--color-text-light);">${q.solution_text}</div>` : ''}
        </div>`;
      });
      html += '</div>';
    }

    endEl.innerHTML = html;
    renderMath(endEl);
  },

  restart() {
    document.getElementById('quiz-end').style.display = 'none';
    document.getElementById('quiz-setup').style.display = '';
  }
};

document.addEventListener('DOMContentLoaded', () => Quiz.init());