const About = {
  async init() {
    try {
      const [{ count }, topics, stages] = await Promise.all([
        Questions.fetch({ limit: 1 }),
        Questions.getTopics([]),
        Questions.getStages()
      ]);
      document.getElementById('stat-questions').textContent = count;
      document.getElementById('stat-topics').textContent = topics.length;
      document.getElementById('stat-stages').textContent = stages.length;
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => About.init());
