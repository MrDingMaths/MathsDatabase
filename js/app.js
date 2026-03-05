async function loadQuestions(filters = {}) {
  let query = supabase.from('questions').select('*');

  if (filters.stage)      query = query.eq('stage', filters.stage);
  if (filters.topic)      query = query.eq('topic', filters.topic);
  if (filters.subtopic)   query = query.eq('subtopic', filters.subtopic);
  if (filters.difficulty)  query = query.eq('difficulty', filters.difficulty);

  query = query.order('topic').order('difficulty').limit(50);

  const { data, error } = await query;
  if (error) { console.error(error); return; }

  renderQuestions(data);
}

function renderQuestions(questions) {
  const container = document.getElementById('questions-container');
  container.innerHTML = questions.map((q, i) => `
    <div class="question-card">
      <div class="question-header">
        <span class="q-number">${i + 1}</span>
        <span class="q-meta">${q.topic} · ${q.subtopic || ''} · Difficulty ${q.difficulty || '?'}</span>
      </div>
      <div class="question-text">${q.question_text}</div>
      ${q.question_image_url ? `<img src="${q.question_image_url}" alt="diagram">` : ''}
      <details class="solution">
        <summary>Show solution</summary>
        <div class="solution-text">${q.solution_text || 'No solution provided.'}</div>
        ${q.solution_image_url ? `<img src="${q.solution_image_url}" alt="solution diagram">` : ''}
      </details>
    </div>
  `).join('');

  // Render KaTeX in all question/solution text
  renderMathInElement(document.getElementById('questions-container'), {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true }
    ]
  });
}

// Initial load
loadQuestions();