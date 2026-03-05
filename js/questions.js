// CRUD operations for questions

const Questions = {
  async fetch({ stage, topic, subtopic, difficulty, search, limit = 20, offset = 0 }) {
    try {
      let query = supabaseClient.from('questions').select('*', { count: 'exact' });

      if (stage) query = query.eq('stage', stage);
      if (topic) query = query.eq('topic', topic);
      if (subtopic) query = query.eq('subtopic', subtopic);
      if (difficulty) query = query.eq('difficulty', parseInt(difficulty));
      if (search) query = query.ilike('question_text', `%${search}%`);

      query = query.order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    } catch (err) {
      console.error('Error fetching questions:', err);
      throw err;
    }
  },

  async create(question) {
    try {
      question.has_katex = /\$/.test(question.question_text) || /\$/.test(question.solution_text || '');
      question.has_image = !!(question.question_image_url || question.solution_image_url);

      const { data, error } = await supabaseClient
        .from('questions')
        .insert(question)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating question:', err);
      throw err;
    }
  },

  async update(id, updates) {
    try {
      const { data, error } = await supabaseClient
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating question:', err);
      throw err;
    }
  },

  async delete(id) {
    try {
      const { error } = await supabaseClient
        .from('questions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting question:', err);
      throw err;
    }
  },

  async getStages() {
    try {
      const { data, error } = await supabaseClient
        .from('questions')
        .select('stage')
        .order('stage');
      if (error) throw error;
      return [...new Set(data.map(d => d.stage))];
    } catch (err) {
      console.error('Error fetching stages:', err);
      return [];
    }
  },

  async getTopics(stage) {
    try {
      let query = supabaseClient.from('questions').select('topic');
      if (stage) query = query.eq('stage', stage);
      const { data, error } = await query.order('topic');
      if (error) throw error;
      return [...new Set(data.map(d => d.topic))];
    } catch (err) {
      console.error('Error fetching topics:', err);
      return [];
    }
  },

  async getSubtopics(stage, topic) {
    try {
      let query = supabaseClient.from('questions').select('subtopic');
      if (stage) query = query.eq('stage', stage);
      if (topic) query = query.eq('topic', topic);
      const { data, error } = await query.order('subtopic');
      if (error) throw error;
      return [...new Set(data.map(d => d.subtopic).filter(Boolean))];
    } catch (err) {
      console.error('Error fetching subtopics:', err);
      return [];
    }
  },

  async uploadImage(file) {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabaseClient.storage
        .from('question-images')
        .upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabaseClient.storage
        .from('question-images')
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  }
};
