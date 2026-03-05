# MrDingMaths Question Bank

A static web application for browsing, quizzing, and generating worksheets from a mathematics question database. Built with vanilla HTML/CSS/JS and powered by Supabase.

## Features

- **Browse** - Filter and search questions by stage, topic, subtopic, and difficulty
- **Quiz** - Practice mode with immediate feedback and score tracking
- **Worksheet** - Select questions and generate printable worksheets with optional answer keys
- **Admin** - Authenticated question entry with live KaTeX preview, image upload, and CRUD management

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript (no frameworks)
- Database: Supabase (PostgreSQL)
- Maths rendering: KaTeX via CDN
- Hosting: GitHub Pages

## Setup

1. **Clone the repository**

2. **Create a Supabase project** at [supabase.com](https://supabase.com)

3. **Create the `questions` table** using the schema in the project spec, or run `seed.sql` in the Supabase SQL Editor to create sample data.

4. **Configure credentials**
   - Copy `js/config.example.js` to `js/config.js`
   - Replace the placeholder values with your Supabase project URL and anon key

5. **Create a storage bucket** called `question-images` in Supabase Storage (for image uploads via the admin page)

6. **Set up authentication** - Create an admin user in Supabase Auth (email/password) for the admin page

7. **Serve the files** - Open `index.html` directly or use any static file server. For GitHub Pages, push to the `main` branch and enable Pages in repository settings.

## File Structure

```
MathsDatabase/
  index.html          - Question browser
  admin.html          - Admin question entry
  quiz.html           - Student practice mode
  worksheet.html      - Worksheet generator
  css/
    main.css          - Shared styles and variables
    cards.css         - Question card styles
    admin.css         - Admin form styles
    quiz.css          - Quiz mode styles
    print.css         - Worksheet print styles
  js/
    config.js         - Supabase credentials (gitignored)
    config.example.js - Credential placeholders
    supabase.js       - Supabase client init
    questions.js      - CRUD operations
    filters.js        - Filter cascade logic
    render.js         - KaTeX rendering helper
    admin.js          - Admin page logic
    quiz.js           - Quiz mode logic
    worksheet.js      - Worksheet generator logic
    app.js            - Question browser logic
  seed.sql            - Sample question data
```

## KaTeX Usage

Use `$...$` for inline maths and `$$...$$` for display maths in question and solution text. The auto-render extension processes these delimiters automatically after DOM insertion.
