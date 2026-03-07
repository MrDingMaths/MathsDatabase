# MrDingMaths Question Bank

A static web application for browsing and generating worksheets from a mathematics question database. Built with vanilla HTML/CSS/JS and powered by Supabase.

## Features

- **Worksheet Generator** — Select questions via filters and checkboxes, then generate a printable worksheet with optional solution key. Print-optimised CSS ensures clean output.
- **Admin Panel** — Authenticated question management with live KaTeX preview, drag-and-drop image upload, bulk JSON import, and full CRUD operations. Classifications (Stage > Topic > Subtopic) are managed via a tag-based UI.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript (no build step, no frameworks) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (email/password for admin) |
| Storage | Supabase Storage (`question-images` bucket) |
| Maths rendering | KaTeX 0.16.9 via CDN (auto-render extension) |
| Fonts | Inter (Google Fonts) |
| Hosting | GitHub Pages (static files served from `main` branch) |

## Database Schema

### `questions` table

| Column | Type | Description |
|---|---|---|
| `id` | uuid (PK) | Auto-generated primary key |
| `question_text` | text | Question content (supports KaTeX `$...$` / `$$...$$`) |
| `solution_text` | text \| null | Full worked solution (supports KaTeX) |
| `difficulty` | text | `foundation` \| `development` \| `mastery` \| `challenge` |
| `marks` | integer | Mark value (default 1) |
| `question_image_url` | text \| null | Public URL to question diagram |
| `solution_image_url` | text \| null | Public URL to solution diagram |
| `source` | text \| null | Origin reference, e.g. "2023 HSC Q14b" |
| `tags` | text[] | Freeform labels, e.g. `["proof", "surds"]` |
| `has_katex` | boolean | Auto-set on save: `true` if `$` appears in text |
| `has_image` | boolean | Auto-set on save: `true` if any image URL is present |

### `stages` table

| Column | Type | Description |
|---|---|---|
| `id` | text (PK) | Stage identifier, e.g. `stage4` |
| `label` | text | Display name, e.g. "Stage 4" |
| `sort_order` | integer | Controls display ordering |

### `topics` table

| Column | Type | Description |
|---|---|---|
| `id` | serial (PK) | Auto-incrementing ID |
| `name` | text | Topic name, e.g. "Algebra" |

### `subtopics` table

| Column | Type | Description |
|---|---|---|
| `id` | serial (PK) | Auto-incrementing ID |
| `name` | text | Subtopic name, e.g. "Linear Equations" |
| `topic_id` | integer (FK) | References `topics.id` |

### `question_classifications` table (many-to-many)

| Column | Type | Description |
|---|---|---|
| `question_id` | uuid (FK) | References `questions.id` |
| `stage_id` | text (FK) | References `stages.id` |
| `topic_id` | integer (FK, nullable) | References `topics.id` |
| `subtopic_id` | integer (FK, nullable) | References `subtopics.id` |

A question can have multiple classifications, allowing it to appear under different Stage > Topic > Subtopic paths.

### Supabase RPC functions

- **`fetch_questions`** — Server-side filtered query with pagination. Parameters: `p_stage_ids`, `p_topic_names`, `p_sub_names`, `p_difficulty`, `p_search`, `p_limit`, `p_offset`. Returns question rows with joined classification data and a `total_count` field.
- **`get_question_classifications`** — Returns all classification rows for a single question (used by the admin edit form). Parameter: `p_question_id`.

## File Structure

```
MathsDatabase/
  index.html              About / landing page with live stats
  admin.html              Admin question entry and management
  worksheet.html          Worksheet generator with print support
  css/
    main.css              Shared styles, CSS custom properties, layout
    cards.css             Question card components (collapsible, badges, tags)
    admin.css             Admin form, preview pane, drop zone, table styles
    print.css             Worksheet print preview and @media print rules
  js/
    config.js             Supabase credentials (gitignored)
    config.example.js     Credential placeholders for setup
    supabase.js           Supabase client initialisation
    questions.js          Data layer: fetch, create, update, delete, bulk import, image upload, taxonomy loading, classification management
    filters.js            Reusable multi-select filter cascade (stage > topic > subtopic > difficulty)
    render.js             KaTeX auto-render helper
    admin.js              Admin page: form handling, live preview, image drag-and-drop, bulk JSON import with validation, question table with pagination
    worksheet.js          Worksheet generator: question selection, print preview, solution key generation
    app.js                Question browser: paginated card list with filter integration
    about.js              Landing page: fetches and displays live question/topic/stage counts
```

## Architecture

### Pages and their JS modules

| Page | Primary JS | Shared JS |
|---|---|---|
| `index.html` (About) | `about.js` | `questions.js`, `supabase.js`, `config.js` |
| `worksheet.html` | `worksheet.js` | `filters.js`, `questions.js`, `render.js`, `supabase.js`, `config.js` |
| `admin.html` | `admin.js` | `questions.js`, `render.js`, `supabase.js`, `config.js` |

### Data flow

1. **Supabase client** (`supabase.js`) is initialised with credentials from `config.js`
2. **`questions.js`** provides the data layer — all database operations go through this module
3. **`filters.js`** manages cascading multi-select dropdowns that call `Questions.getStages()`, `Questions.getTopics()`, and `Questions.getSubtopics()` to populate options, then passes selected values to the page's `onChange` callback
4. **Page modules** (`worksheet.js`, `admin.js`, `app.js`) call `Questions.fetch()` with filter parameters and render the results
5. **`render.js`** runs KaTeX auto-render on any container after HTML insertion

### Styling approach

- CSS custom properties defined in `main.css :root` for consistent theming
- BEM-inspired class naming: `.block__element--modifier`
- Responsive breakpoints at 768px and 480px
- Print stylesheet hides all UI chrome, showing only the worksheet content

## Setup

1. **Clone the repository**

2. **Create a Supabase project** at [supabase.com](https://supabase.com)

3. **Create the database tables** as described in the Database Schema section above. Set up the `fetch_questions` and `get_question_classifications` RPC functions.

4. **Configure credentials**
   - Copy `js/config.example.js` to `js/config.js`
   - Replace the placeholder values with your Supabase project URL and anon key

5. **Create a storage bucket** called `question-images` in Supabase Storage (for image uploads via the admin page). Set the bucket to public access.

6. **Set up authentication** — Create an admin user in Supabase Auth (email/password) for the admin page

7. **Serve the files** — Open `index.html` directly or use any static file server. For GitHub Pages, push to the `main` branch and enable Pages in repository settings.

## KaTeX Usage

Use `$...$` for inline maths and `$$...$$` for display maths in question and solution text fields. The KaTeX auto-render extension processes these delimiters automatically after DOM insertion via the `renderMath()` helper.

## Bulk Import Format

The admin panel supports bulk importing questions via JSON. Each object in the array requires:

```json
[
  {
    "question_text": "Solve $2x + 3 = 7$",
    "solution_text": "$2x = 4$, so $x = 2$",
    "difficulty": "foundation",
    "marks": 1,
    "classifications": [
      { "stage_id": "stage4", "topic_id": 1, "subtopic_id": 3 }
    ]
  }
]
```

Required fields: `question_text`, `difficulty`, and either a `classifications` array or legacy `stage` + `topic` fields. Optional fields: `solution_text`, `marks`, `tags`, `source`, `question_image_url`, `solution_image_url`.
