// CRUD operations for questions

const TAXONOMY_CACHE_KEY = 'maths_db_taxonomy';
const TAXONOMY_TS_KEY    = 'maths_db_taxonomy_ts';
const TAXONOMY_TTL_MS    = 10 * 60 * 1000; // 10 minutes

const Questions = {
  async fetch({ course, topic, subtopic, difficulty, search, source, tags, limit = 20, offset = 0 }) {
    try {
      const { data, error } = await supabaseClient.rpc('fetch_questions', {
        p_course_ids:  course?.length    ? course    : null,
        p_topic_names: topic?.length     ? topic     : null,
        p_sub_names:   subtopic?.length  ? subtopic  : null,
        p_difficulty:  difficulty?.length? difficulty : null,
        p_search:      search || null,
        p_source:      source || null,
        p_tags:        tags?.length      ? tags      : null,
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

  // Loads the full taxonomy in one batch for client-side filtering.
  // Returns { courses: [{id, label}], topics: [{id, name}], subtopics: [{id, name, topic_id}] }
  // Results are cached in localStorage for 10 minutes to reduce DB load.
  async getTaxonomy() {
    // Cache read
    try {
      const ts  = localStorage.getItem(TAXONOMY_TS_KEY);
      const raw = localStorage.getItem(TAXONOMY_CACHE_KEY);
      if (ts && raw && (Date.now() - Number(ts)) < TAXONOMY_TTL_MS) {
        return JSON.parse(raw);
      }
    } catch (_) {
      // localStorage unavailable or JSON corrupt — fall through
    }

    // DB fetch
    try {
      const [{ data: courses, error: e1 }, { data: topics, error: e2 }, { data: subtopics, error: e3 }] =
        await Promise.all([
          supabaseClient.from('courses').select('id, label, sort_order').order('sort_order'),
          supabaseClient.from('topics').select('id, name').order('name'),
          supabaseClient.from('subtopics').select('id, name, topic_id').order('name')
        ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;
      const taxonomy = { courses: courses || [], topics: topics || [], subtopics: subtopics || [] };

      // Cache write (silent fail for private browsing / quota exceeded)
      try {
        localStorage.setItem(TAXONOMY_CACHE_KEY, JSON.stringify(taxonomy));
        localStorage.setItem(TAXONOMY_TS_KEY,    String(Date.now()));
      } catch (_) {}

      return taxonomy;
    } catch (err) {
      console.error('Error fetching taxonomy:', err);
      return { courses: [], topics: [], subtopics: [] };
    }
  },

  clearTaxonomyCache() {
    try {
      localStorage.removeItem(TAXONOMY_CACHE_KEY);
      localStorage.removeItem(TAXONOMY_TS_KEY);
    } catch (_) {}
  },

  // Returns [{value, label}] -- used by filters.js for the course multi-select
  async getCourses() {
    try {
      const { data, error } = await supabaseClient
        .from('courses')
        .select('id, label')
        .order('sort_order');
      if (error) throw error;
      return (data || []).map(s => ({ value: s.id, label: s.label }));
    } catch (err) {
      console.error('Error fetching courses:', err);
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

  // Returns subtopic name strings with questions in the given course(s) AND topic(s)
  async getSubtopicsForCourse(courseIds, topicNames) {
    try {
      const { data, error } = await supabaseClient.rpc('get_subtopics_for_courses', {
        p_course_ids: courseIds,
        p_topic_names: topicNames
      });
      if (error) throw error;
      return (data || []).map(r => r.subtopic_name);
    } catch (err) {
      console.error('Error fetching subtopics for course:', err);
      return [];
    }
  },

  // Replace all classifications for a question.
  // classifications: [{course_id, topic_id, subtopic_id}] (any field may be null)
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
          course_id:   c.course_id   || null,
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

  // Returns topic name strings that have questions in the given course(s)
  async getTopicsForCourse(courseIds) {
    try {
      const { data, error } = await supabaseClient.rpc('get_topics_for_courses', {
        p_course_ids: courseIds
      });
      if (error) throw error;
      return (data || []).map(r => r.topic_name);
    } catch (err) {
      console.error('Error fetching topics for course:', err);
      return [];
    }
  },

  async bulkCreate(questions) {
    try {
      const prepared = questions.map(q => ({
        ...q,
        marks: q.marks || 1,
        tags: q.tags || []
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
