const About = {
  async init() {
    try {
      const { count } = await Questions.fetch({ limit: 1, offset: 0 });
      const el = document.getElementById('question-count');
      if (el && count) el.textContent = `${count.toLocaleString()} questions available`;
    } catch (err) {
      console.error('Error fetching question count:', err);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => About.init());
