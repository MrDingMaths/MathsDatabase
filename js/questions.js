// CRUD operations for questions

const Questions = {
  async fetch({ stage, topic, subtopic, difficulty, search, limit = 20, offset = 0 }) {
    try {
      const { data, error } = await supabaseClient.rpc('fetch_questions', {
        p_stage_ids:   stage?.length     ? stage     : null,
        p_topic_names: topic?.length     ? topic     : null,
        p_sub_names:   subtopic?.length  ? subtopic  : null,
        p_difficulty:  difficulty?.length? difficulty : null,
        p_search:      search || null,
        p_limit:       limit,
        p_offset:      offset
      });
      if (error) throw error;
      const count = data?.[0]?.total_count ?? 0;
      const rows  = (data || []).map(({ total_count, ...rest }) => rest);
      return { data: rows, count };
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
  // Returns { stages: [{id, label}], topics: [{id, name}], subtopics: [{id, name, topic_id}] }
  async getTaxonomy() {
    try {
      const [{ data: stages, error: e1 }, { data: topics, error: e2 }, { data: subtopics, error: e3 }] =
        await Promise.all([
          supabaseClient.from('stages').select('id, label, sort_order').order('sort_order'),
          supabaseClient.from('topics').select('id, name').order('name'),
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

  // Returns topic name strings (universal — not filtered by stage)
  async getTopics() {
    try {
      const { data, error } = await supabaseClient.from('topics').select('name').order('name');
      if (error) throw error;
      return [...new Set((data || []).map(d => d.name))];
    } catch (err) {
      console.error('Error fetching topics:', err);
      return [];
    }
  },

  // Returns subtopic name strings, filtered by topic names
  async getSubtopics(topicNames) {
    try {
      let topicQuery = supabaseClient.from('topics').select('id');
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

  // Replace all classifications for a question.
  // classifications: [{stage_id, topic_id, subtopic_id}] (topic_id/subtopic_id may be null)
  async saveClassifications(questionId, classifications) {
    try {
      const { error: delErr } = await supabaseClient
        .from('question_classifications')
        .delete()
        .eq('question_id', questionId);
      if (delErr) throw delErr;

      if (classifications.length) {
        const rows = classifications.map(c => ({
          question_id: questionId,
          stage_id:    c.stage_id,
          topic_id:    c.topic_id    || null,
          subtopic_id: c.subtopic_id || null
        }));
        const { error: insErr } = await supabaseClient
          .from('question_classifications')
          .insert(rows);
        if (insErr) throw insErr;
      }
    } catch (err) {
      console.error('Error saving classifications:', err);
      throw err;
    }
  },

  // Load all classifications for a question (used by admin edit form).
  async getClassifications(questionId) {
    try {
      const { data, error } = await supabaseClient.rpc('get_question_classifications', {
        p_question_id: questionId
      });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error loading classifications:', err);
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
