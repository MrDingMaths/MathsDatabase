-- Taxonomy tables: stages, topics, subtopics
-- Run this in the Supabase SQL Editor

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS stages (
  id         TEXT PRIMARY KEY,          -- e.g. 'stage4', 'stage6_ext1'
  label      TEXT NOT NULL,             -- e.g. 'Stage 4', 'Stage 6 Extension 1'
  sort_order INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  stage_id   TEXT NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  sort_order INT  NOT NULL DEFAULT 0,
  UNIQUE(name, stage_id)
);

CREATE TABLE IF NOT EXISTS subtopics (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  topic_id   INT  NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  sort_order INT  NOT NULL DEFAULT 0,
  UNIQUE(name, topic_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE stages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics    ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Public read stages"    ON stages    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read topics"    ON topics    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read subtopics" ON subtopics FOR SELECT TO anon, authenticated USING (true);

-- Authenticated users (admins) can manage
CREATE POLICY "Auth manage stages"    ON stages    FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage topics"    ON topics    FOR ALL TO authenticated USING (true);
CREATE POLICY "Auth manage subtopics" ON subtopics FOR ALL TO authenticated USING (true);

-- ============================================================
-- Seed: Stages
-- ============================================================

INSERT INTO stages (id, label, sort_order) VALUES
  ('stage4',          'Stage 4',             1),
  ('stage5',          'Stage 5',             2),
  ('stage6_standard', 'Stage 6 Standard',    3),
  ('stage6_advanced', 'Stage 6 Advanced',    4),
  ('stage6_ext1',     'Stage 6 Extension 1', 5),
  ('stage6_ext2',     'Stage 6 Extension 2', 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Seed: Topics
-- ============================================================

INSERT INTO topics (name, stage_id) VALUES
  -- Stage 4
  ('Algebra',               'stage4'),
  ('Geometry',              'stage4'),
  ('Measurement',           'stage4'),
  ('Number',                'stage4'),
  ('Probability',           'stage4'),
  ('Statistics',            'stage4'),

  -- Stage 5
  ('Algebra',               'stage5'),
  ('Financial Mathematics', 'stage5'),
  ('Functions',             'stage5'),
  ('Geometry',              'stage5'),
  ('Measurement',           'stage5'),
  ('Networks',              'stage5'),
  ('Probability',           'stage5'),
  ('Statistics',            'stage5'),
  ('Trigonometry',          'stage5'),

  -- Stage 6 Standard
  ('Algebra',               'stage6_standard'),
  ('Calculus',              'stage6_standard'),
  ('Financial Mathematics', 'stage6_standard'),
  ('Functions',             'stage6_standard'),
  ('Networks',              'stage6_standard'),
  ('Probability',           'stage6_standard'),
  ('Statistics',            'stage6_standard'),
  ('Trigonometry',          'stage6_standard'),

  -- Stage 6 Advanced
  ('Calculus',              'stage6_advanced'),
  ('Functions',             'stage6_advanced'),
  ('Probability',           'stage6_advanced'),
  ('Statistics',            'stage6_advanced'),
  ('Trigonometry',          'stage6_advanced'),

  -- Stage 6 Extension 1
  ('Algebra',               'stage6_ext1'),
  ('Calculus',              'stage6_ext1'),
  ('Functions',             'stage6_ext1'),
  ('Trigonometry',          'stage6_ext1'),
  ('Vectors',               'stage6_ext1'),

  -- Stage 6 Extension 2
  ('Algebra',               'stage6_ext2'),
  ('Calculus',              'stage6_ext2'),
  ('Complex Numbers',       'stage6_ext2'),
  ('Proof',                 'stage6_ext2'),
  ('Vectors',               'stage6_ext2')
ON CONFLICT (name, stage_id) DO NOTHING;

-- ============================================================
-- Seed: Subtopics  (extend this list as needed)
-- ============================================================

-- Helper: insert subtopics for a given topic name + stage
-- Stage 4 — Algebra
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Algebraic Techniques'),
  ('Equations and Inequalities'),
  ('Linear Equations'),
  ('Linear Relationships'),
  ('Number Patterns')
) AS v(name)
JOIN topics t ON t.name = 'Algebra' AND t.stage_id = 'stage4'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 4 — Measurement
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Area'),
  ('Perimeter'),
  ('Surface Area'),
  ('Volume')
) AS v(name)
JOIN topics t ON t.name = 'Measurement' AND t.stage_id = 'stage4'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 4 — Geometry
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Angle Relationships'),
  ('Properties of Shapes'),
  ('Pythagoras Theorem'),
  ('Transformations')
) AS v(name)
JOIN topics t ON t.name = 'Geometry' AND t.stage_id = 'stage4'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 4 — Probability
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Counting'),
  ('Experimental Probability'),
  ('Simple Probability'),
  ('Theoretical Probability')
) AS v(name)
JOIN topics t ON t.name = 'Probability' AND t.stage_id = 'stage4'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 5 — Algebra
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Binomial Products'),
  ('Exponentials'),
  ('Factorisation'),
  ('Indices'),
  ('Logarithms'),
  ('Quadratics'),
  ('Simultaneous Equations'),
  ('Surds')
) AS v(name)
JOIN topics t ON t.name = 'Algebra' AND t.stage_id = 'stage5'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 5 — Trigonometry
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Exact Values'),
  ('Sine and Cosine Rule'),
  ('Trigonometric Ratios')
) AS v(name)
JOIN topics t ON t.name = 'Trigonometry' AND t.stage_id = 'stage5'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 5 — Probability
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Counting'),
  ('Multi-step Probability'),
  ('Venn Diagrams')
) AS v(name)
JOIN topics t ON t.name = 'Probability' AND t.stage_id = 'stage5'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 6 Standard — Calculus
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Applications of Calculus'),
  ('Differentiation'),
  ('Integration')
) AS v(name)
JOIN topics t ON t.name = 'Calculus' AND t.stage_id = 'stage6_standard'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 6 Advanced — Calculus
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Applications of Calculus'),
  ('Differentiation'),
  ('Exponential and Log Functions'),
  ('Integration'),
  ('Trigonometric Functions')
) AS v(name)
JOIN topics t ON t.name = 'Calculus' AND t.stage_id = 'stage6_advanced'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 6 Extension 1 — Algebra
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Binomial Theorem'),
  ('Inequalities'),
  ('Polynomials')
) AS v(name)
JOIN topics t ON t.name = 'Algebra' AND t.stage_id = 'stage6_ext1'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 6 Extension 1 — Calculus
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Applications of Calculus'),
  ('Differential Equations'),
  ('Further Integration'),
  ('Further Differentiation')
) AS v(name)
JOIN topics t ON t.name = 'Calculus' AND t.stage_id = 'stage6_ext1'
ON CONFLICT (name, topic_id) DO NOTHING;

-- Stage 6 Extension 2 — Complex Numbers
INSERT INTO subtopics (name, topic_id)
SELECT v.name, t.id FROM (VALUES
  ('Argument'),
  ('Conjugates'),
  ('De Moivre''s Theorem'),
  ('Locus'),
  ('Modulus'),
  ('Polar Form')
) AS v(name)
JOIN topics t ON t.name = 'Complex Numbers' AND t.stage_id = 'stage6_ext2'
ON CONFLICT (name, topic_id) DO NOTHING;

-- ============================================================
-- Add marks column to questions
-- ============================================================

ALTER TABLE questions ADD COLUMN IF NOT EXISTS marks INT NOT NULL DEFAULT 1;
