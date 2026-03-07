// CRUD operations for questions

const Questions = {
  async fetch({ stage, topic, subtopic, difficulty, search, limit = 20, offset = 0 }) {
    try {
      let query = supabaseClient.from('questions').select('*', { count: 'exact' });

      if (stage?.length) query = query.in('stage', stage);
      if (topic?.length) query = query.in('topic', topic);
      if (subtopic?.length) query = query.overlaps('subtopic', subtopic);
      if (difficulty?.length) query = query.in('difficulty', difficulty);
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
      updates.has_katex = /\$/.test(updates.question_text || '') || /\$/.test(updates.solution_text || '');
      updates.has_image = !!(updates.question_image_url || updates.solution_image_url);

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

  // Loads the full taxonomy in one batch for client-side filtering.
  // Returns { stages: [{id, label}], topics: [{id, name, stage_id}], subtopics: [{id, name, topic_id}] }
  async getTaxonomy() {
    try {
      const [{ data: stages, error: e1 }, { data: topics, error: e2 }, { data: subtopics, error: e3 }] =
        await Promise.all([
          supabaseClient.from('stages').select('id, label, sort_order').order('sort_order'),
          supabaseClient.from('topics').select('id, name, stage_id').order('name'),
          supabaseClient.from('subtopics').select('id, name, topic_id').order('name')
        ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      return { stages: stages || [], topics: topics || [], subtopics: subtopics || [] };
    } catch (err) {
      console.error('Error fetching taxonomy:', err);
      return { stages: [], topics: [], subtopics: [] };
    }
  },

  // Returns [{value, label}] -- used by filters.js for the stage multi-select
  async getStages() {
    try {
      const { data, error } = await supabaseClient
        .from('stages')
        .select('id, label')
        .order('sort_order');
      if (error) throw error;
      return (data || []).map(s => ({ value: s.id, label: s.label }));
    } catch (err) {
      console.error('Error fetching stages:', err);
      return [];
    }
  },

  // Returns topic name strings, filtered by stage IDs
  async getTopics(stageIds) {
    try {
      let query = supabaseClient.from('topics').select('name');
      if (stageIds?.length) query = query.in('stage_id', stageIds);
      const { data, error } = await query.order('name');
      if (error) throw error;
      return [...new Set((data || []).map(d => d.name))];
    } catch (err) {
      console.error('Error fetching topics:', err);
      return [];
    }
  },

  // Returns subtopic name strings, filtered by stage IDs and topic names
  async getSubtopics(stageIds, topicNames) {
    try {
      let topicQuery = supabaseClient.from('topics').select('id');
      if (stageIds?.length) topicQuery = topicQuery.in('stage_id', stageIds);
      if (topicNames?.length) topicQuery = topicQuery.in('name', topicNames);
      const { data: topicData, error: topicErr } = await topicQuery;
      if (topicErr) throw topicErr;

      const topicIds = (topicData || []).map(t => t.id);
      if (!topicIds.length) return [];

      const { data, error } = await supabaseClient
        .from('subtopics')
        .select('name')
        .in('topic_id', topicIds)
        .order('name');
      if (error) throw error;
      return [...new Set((data || []).map(d => d.name))];
    } catch (err) {
      console.error('Error fetching subtopics:', err);
      return [];
    }
  },

  async bulkCreate(questions) {
    try {
      const prepared = questions.map(q => ({
        ...q,
        has_katex: /\$/.test(q.question_text || '') || /\$/.test(q.solution_text || ''),
        has_image: !!(q.question_image_url || q.solution_image_url),
        marks: q.marks || 1,
        tags: q.tags || [],
        choices: q.choices || null
      }));

      const { data, error } = await supabaseClient
        .from('questions')
        .insert(prepared)
        .select();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error bulk creating questions:', err);
      throw err;
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
