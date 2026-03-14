# MathsBase — Project Context

## What It Is
A static web app for secondary maths education. Teachers browse and filter a question database, then generate printable worksheets with optional solution keys. An admin panel handles question CRUD with live KaTeX preview and image uploads.

## Tech Stack
- **Frontend:** Vanilla JS, HTML, CSS — no build step, no npm, no frameworks
- **Database:** Supabase (PostgreSQL + RLS + Storage + Auth)
- **Math rendering:** KaTeX 0.16.9 via CDN (auto-render on page load)
- **Hosting:** GitHub Pages (`main` branch), static files only

## Key Files

```
index.html          — Landing page (live stats via about.js)
worksheet.html      — Main app: browse + filter + generate worksheets
admin.html          — Admin dashboard (Supabase Auth, email/password)

js/
  config.js         — Supabase URL & anon key (gitignored; see config.example.js)
  supabase.js       — Supabase client init
  questions.js      — Data layer: ALL Supabase ops (fetch, CRUD, bulk import, images)
  filters.js        — Cascading filter UI (course→topic→subtopic + tag chips)
  worksheet.js      — Worksheet selection, preview, printing
  admin.js          — Admin form, validation, bulk JSON import, question table
  render.js         — KaTeX auto-render helper
  theme.js          — Dark/light mode toggle
  utils.js          — Shared helpers

css/
  main.css          — Global styles, CSS vars, dark mode, responsive (breakpoints: 768px, 480px)
  cards.css         — Question card components
  admin.css         — Admin-specific styles
  print.css         — Print stylesheet for worksheets
```

## Database Schema

| Table | Key Columns |
|---|---|
| `questions` | id (uuid), question_text, solution_text, difficulty, marks, question_image_url, solution_image_url, tags (array), has_katex, has_image |
| `courses` | id (text, e.g. "stage4"), label, sort_order |
| `topics` | id (serial), name |
| `subtopics` | id (serial), name, topic_id |
| `question_classifications` | question_id, course_id, topic_id, subtopic_id (many-to-many junction) |

**RPC functions:**
- `fetch_questions(p_course_ids, p_topic_names, p_sub_names, p_difficulty, p_search, p_source, p_tags, p_limit, p_offset)` — filtered + paginated, returns rows + `total_count`
- `get_question_classifications(p_question_id)` — all classifications for a single question

## Key Patterns

- **All data ops go through `js/questions.js`** — never query Supabase directly from page scripts
- **Taxonomy caching:** courses/topics/subtopics fetched once via `Questions.getTaxonomy()`, cached in localStorage for 10 min
- **Difficulty levels:** `foundation` / `development` / `mastery` / `challenge`
- **Math notation:** `$...$` inline, `$$...$$` display — KaTeX renders automatically on page load
- **Credentials:** `js/config.js` is gitignored; populate from `js/config.example.js`
- **Classifications:** a question can appear under multiple course/topic/subtopic paths
