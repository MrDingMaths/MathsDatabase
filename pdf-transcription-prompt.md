# MathsDatabase — PDF Transcription Instructions

You are transcribing maths questions from a PDF into a JSON array for bulk import into MathsDatabase. Output the JSON array wrapped in a single ```json code block — no prose or explanation outside the code block.

---

## Output format

Each question is a JSON object. The full array looks like:

```json
[
  { ...question1... },
  { ...question2... }
]
```

---

## Question object schema

```json
{
  "question_text":      "string (required) — full question in KaTeX",
  "solution_text":      "string or null — full worked solution in KaTeX",
  "difficulty":         "Foundation | Development | Mastery | Challenge",
  "marks":              1,
  "source":             "string or null — e.g. '2023 HSC Q14b'",
  "tags":               [],
  "calculator":         true,
  "classifications": [
    { "course_id": "string — see course list below", "topic_id": null, "subtopic_id": null },
    { "course_id": null, "topic_id": 123, "subtopic_id": 456 }
  ]
}
```

### Field rules

- **`question_text`** — Required. Include the full question exactly as written. Do **not** include the question number (e.g. "Q12", "14b") — that information belongs in `source`. For multi-part questions, keep all parts together in a single question object. Format part labels in bold using KaTeX: `$\textbf{(i)}$`, `$\textbf{(ii)}$`, `$\textbf{(a)}$`, etc. In JSON strings this becomes `$\\textbf{(i)}$`.
- **`solution_text`** — Full worked solution with all steps. Use KaTeX. Set to `null` if no solution is provided.
- **`difficulty`** — Rate based on cognitive demand. For multi-part questions, use the difficulty of the **most challenging part**. Use your judgement:
  - `Foundation`: Routine textbook style problem
  - `Development`: Multistep routine problem
  - `Mastery`: Multistep non-routine problem
  - `Challenge`: Very hard question requiring extensive understanding, possibly beyond the scope of the syllabus
- **`marks`** — The mark value shown in the PDF. Default to `1` if not shown.
- **`source`** — The exam/book/worksheet name and question number, e.g. `"2022 HSC Advanced Q12b"` or `"2025 IGCSE 0580 P1 Q2"`. Set to `null` if unknown.
- **`tags`** — Leave as `[]` unless there are obvious keyword tags (e.g. `["proof", "surds"]`).
- **`calculator`** — Whether a calculator is permitted. Set to `true` (calculator allowed), `false` (non-calculator), or omit the field entirely if not specified by the exam or worksheet.
- **`classifications`** — Array of classification objects. **Courses and topics are separate rows** — always use one object for the course (with `topic_id: null, subtopic_id: null`) and a separate object for the topic/subtopic (with `course_id: null`). `course_id` must be a valid value from the course list below. `topic_id` and `subtopic_id` are integers from the taxonomy.

---

## KaTeX formatting rules

All maths must be wrapped in KaTeX delimiters:
- Inline maths: `$...$`  e.g. `$x^2 + 3x - 4$`
- Display/block maths: `$$...$$`  e.g. `$$\int_0^1 x^2 \, dx$$`

### Specific conventions

| Element | KaTeX syntax | Example |
|---|---|---|
| Powers (single) | `^` | `$x^2$`, `$5^3$` |
| Powers (multi-term) | `^{...}` | `$2^{k+1}$` |
| Fractions | `\frac{num}{den}` | `$\frac{2x+3}{3y-1}$` |
| Square root | `\sqrt{...}` | `$\sqrt{x+1}$` |
| nth root | `\sqrt[n]{...}` | `$\sqrt[3]{8}$` |
| Subscripts | `_` | `$S_n$`, `$a_1$` |
| Multiplication (implied) | no symbol | `$3(x+1)$` |
| Multiplication (dot) | `\times` or `\cdot` | `$3 \times 4$` |
| Log base n | `\log_n` | `$\log_5 125$` |
| Natural log | `\ln` | `$\ln x$` |
| Trig functions | `\sin`, `\cos`, `\tan` | `$\sin\theta$` |
| Inverse trig | `\sin^{-1}` | `$\sin^{-1}(0.5)$` |
| Degrees | `^\circ` | `$45^\circ$` |
| Pi | `\pi` | `$2\pi r$` |
| Infinity | `\infty` | `$x \to \infty$` |
| Absolute value | `\|...\|` | `$\|x - 3\|$` |
| Integral | `\int_a^b ... \, dx` | `$\int_1^5 x^2 \, dx$` |
| Sum | `\sum_{i=1}^{n}` | `$\sum_{i=1}^{n} i$` |
| Vector | `\vec{AB}` | `$\vec{AB}$` |
| Column vector | `\begin{pmatrix} a \\ b \end{pmatrix}` | `$\begin{pmatrix} 3 \\ 4 \end{pmatrix}$` |
| Inequalities | `\leq`, `\geq`, `\neq` | `$x \leq 5$` |
| Approximately | `\approx` | `$x \approx 3.14$` |
| Therefore | `\therefore` | `$\therefore x = 2$` |
| Newline in display | `\\` inside `$$...$$` | `$$x = 1 \\ y = 2$$` |

### Multi-line solutions — alignment at equals signs

All multi-step working must use the `align*` environment so equals signs are vertically aligned. Place `&` immediately before each `=` (or `\leq`, `\geq`, etc.) and separate lines with `\\`:

```
$$\\begin{align*}
3x + 1 &= 7 \\\\
3x &= 6 \\\\
x &= 2
\\end{align*}$$
```

In JSON this becomes (with doubled backslashes):

```json
"solution_text": "$$\\begin{align*}\n3x + 1 &= 7 \\\\\\\\\n3x &= 6 \\\\\\\\\nx &= 2\n\\end{align*}$$"
```

Rules:
- Use `align*` (with asterisk) — this suppresses equation numbering.
- Every intermediate line ends with `\\` (four backslashes in JSON: `\\\\`), except the last line.
- If a line has no equals sign (e.g. a plain statement), use `& \quad` to keep it indented: `& \quad \text{(using the quadratic formula)}`.
- Short single-line solutions that fit on one line may use plain `$...$` inline instead.
- For multi-part solutions, use a **separate** `align*` block for each part. Do not combine all parts into one environment.

**Important:** In JSON strings, backslashes must be doubled: `\frac` becomes `\\frac`, `\sin` becomes `\\sin`, etc.

---

## Marks notation

At the end of each question or question part, include the mark value in square brackets on a **new line, right-aligned**. Use the format `[n]` where `n` is the number of marks.

For a single-part question:

```
Find the area of this shape.

[DIAGRAM]
                                                                          [2]
```

In `question_text` (JSON string), this is written as:

```json
"question_text": "Find the area of this shape.\n\n[DIAGRAM]\n[2]"
```

For multi-part questions, add a mark label after each part:

```json
"question_text": "$\\textbf{(i)}$ Find the value of $x$.\n[1]\n\n$\\textbf{(ii)}$ Hence find $y$.\n[2]"
```

The total `marks` field should reflect the **sum of all parts** (or the mark value of a single-part question).

---

## Cloze questions

When a question requires students to fill in missing words or values inline (a cloze passage), preserve the blank spaces using dotted lines exactly as they appear. Do **not** replace blanks with underscores or leave them empty.

**Example source text:**
> This prism has ........... faces and .......... edges.

**Transcribed as:**
```json
"question_text": "This prism has ........... faces and .......... edges."
```

Use the same number of dots as shown in the PDF (approximately). If the exact count is unclear, use ten dots (`..........`) per blank as a default.

---

## Handling diagrams

When a question or solution includes a diagram (e.g. a geometric figure, graph, number line, tree diagram, or any visual element):

1. **Transcribe the question text as normal** — include all written text and maths exactly as it appears.
2. **Insert a placeholder** at the point where the diagram appears, using this exact format:

   - In `question_text`: `[DIAGRAM]`
   - In `solution_text`: `[DIAGRAM]`

3. The diagram image will be uploaded separately and linked to the question later.

### Diagram answers in `solution_text`

When the **answer itself is a diagram** (e.g. draw lines of symmetry, shade a region, complete a shape), use your judgement:

- **Simple diagram answers — describe in words.** If the action is straightforward to describe unambiguously in plain text, write a clear description instead of a placeholder. Be as specific as possible.
  - *Examples:* "Draw a vertical line and a horizontal line through the centre of the shape.", "Shade the middle square in the second row.", "Draw a line from $A$ to $C$."
- **Complex diagram answers — use `[DIAGRAM]`.** If the answer requires a detailed visual (e.g. plotting a graph, drawing a geometric construction with multiple steps, shading a region on a coordinate plane), use the `[DIAGRAM]` placeholder as normal.

**Example:**

```json
{
  "question_text": "The diagram shows triangle $ABC$.\n\n[DIAGRAM]\n\nFind the value of $x$.",
  "solution_text": "[DIAGRAM]\n\n$$\\begin{align*}\nx &= 180 - 90 - 35 \\\\\\\\\n&= 55\n\\end{align*}$$",
  ...
}
```

---

## Taxonomy reference

### Courses (`course_id`)

| course_id | Label |
|---|---|
| `"stage4"` | S4 (Year 7–8) |
| `"stage5"` | S5 (Year 9–10) |
| `"stage6_standard"` | STN (Year 11–12 Standard) |
| `"stage6_advanced"` | ADV (Year 11–12 Advanced) |
| `"stage6_ext1"` | X1 (Year 11–12 Extension 1) |
| `"stage6_ext2"` | X2 (Year 12 Extension 2) |
| `"IGCSE"` | IGCSE |

### Topics and subtopics (`topic_id` → `subtopic_id`)

**Number** (topic_id: 39)
- 53 Operate with integers
- 54 Simplify and convert FDP
- 55 Operate with fractions and decimals
- 56 Operate with percentages
- 57 Round decimals
- 58 Classify types of numbers
- 59 Ratios
- 60 Rates
- 61 Distance-time graphs
- 74 Metric prefixes
- 75 Measurement error
- 76 Significant figures and standard form
- 194 Recurring decimals

**Algebra** (topic_id: 40)
- 62 Basic algebra
- 63 Expand expressions
- 64 Factorise using HCF
- 77 Simple algebraic fractions
- 78 Expand binomial products
- 79 Factorise monic quadratic trinomials
- 114 Simplify algebraic fractions with binomial numerator
- 115 Special binomial expansions
- 116 Factorise special products
- 117 Factorise by grouping in pairs
- 118 Factorise non-monic quadratic trinomials
- 119 Simplify algebraic fractions by factorising

**Indices** (topic_id: 41)
- 65 Index notation
- 66 Divisibility
- 67 Prime factorisation
- 68 Squares cubes roots
- 120 Basic index laws
- 121 Index laws of products and quotients
- 122 Negative indices
- 123 Simplifying surds
- 124 Rationalise denominator
- 125 Fractional indices

**Equations** (topic_id: 42)
- 69 Linear equations
- 70 Formulas
- 71 Simple quadratics
- 126 Monic quadratics
- 127 Simple cubics
- 128 Linear inequalities
- 129 Rearrange formulas
- 130 Non-monic quadratics
- 131 Completing the square
- 132 Quadratic formula
- 133 Equations reducible to quadratics
- 134 Simultaneous equations

**Linear Relationships** (topic_id: 43)
- 72 Plot points
- 73 Plot lines
- 139 Gradient-intercept form
- 140 Horizontal and vertical lines
- 141 Point gradient form
- 142 Parallel and perpendicular lines

**Geometry** (topic_id: 44)
- 80 Conventions of Geometry
- 81 Angles at a point
- 82 Angles on transversals
- 83 Classify triangles
- 84 Properties of quadrilaterals
- 85 Angle sum of triangle and quadrilateral
- 155 Similar lengths
- 156 Similar areas and volume
- 157 Congruent triangles
- 158 Similar triangles
- 159 Interior and exterior angle sum
- 205 Line and rotational symmetry

**Measurement** (topic_id: 45)
- 86 Perimeter of simple shapes
- 87 Perimeter of simple composite shapes
- 88 Perimeter of circles and sectors
- 89 Perimeter of circular composite shapes
- 90 Length units
- 91 Pythagoras theorem
- 92 Area of rectangles triangles parallelograms
- 93 Area of circles and sectors
- 94 Area of trapeziums rhombuses kites
- 95 Area units
- 96 Nets of prisms
- 97 Volume of a prism
- 98 Volume of a cylinder
- 99 Volume of composite solids
- 100 Volume units
- 160 Surface area of prisms
- 161 Surface area of cylinders
- 162 Surface area of composite solids
- 163 Surface area of pyramids and cones
- 164 Surface area of spheres
- 165 3D Pythagoras

**Data** (topic_id: 46)
- 101 Mean median mode range
- 102 Summary statistics from a chart
- 103 Shape of data
- 104 Census and sample
- 105 Classify data
- 106 Interpret charts
- 206 Bivariate data

**Probability** (topic_id: 47)
- 107 Simple probability and relative frequency
- 179 Record outcomes in multistage probability
- 180 Multistage probability problems
- 181 Set notation
- 182 Compound events and Venn diagrams
- 183 Conditional probability

**Financial Maths** (topic_id: 48)
- 108 Earning money
- 109 Australian tax
- 110 Simple interest
- 111 Loan repayments
- 112 Compound interest
- 113 Depreciation declining balance

**Coordinate Geometry** (topic_id: 49)
- 135 Gradient
- 136 Midpoint
- 137 Distance
- 138 Problems
- 204 Transformations

**Non-linear Relationships** (topic_id: 50)
- 143 Plotting parabolas
- 144 Plotting exponentials
- 145 Identifying equation and graph
- 146 Parabolas
- 147 Exponentials
- 148 Hyperbolas
- 149 Circles and semicircles
- 150 Simple cubic curves
- 151 Power curves

**Variation** (topic_id: 51)
- 152 Direct variation
- 153 Inverse variation
- 154 Graphs of rates of change

**Circle Geometry** (topic_id: 52)
- 166 Angle and chord properties
- 167 Tangent and secant properties

**Trigonometry** (topic_id: 53)
- 168 Right-angled trigonometry
- 169 Bearings
- 170 3D Trigonometry
- 171 Sine rule
- 172 Cosine rule
- 173 SAS area rule
- 174 Unit circle concepts
- 175 Graphs of trigonometric functions
- 176 Tan and gradient
- 177 Solve basic trigonometric equations
- 178 Ambiguous case of sine rule

**Functions** (topic_id: 54)
- 184 Function notation
- 185 Domain and range
- 199 Composite functions
- 200 Graph inequalities

**Logarithms** (topic_id: 55)
- 186 Laws of logarithms
- 187 Solving equations using logarithms

**Polynomials** (topic_id: 56)
- 188 Terminology
- 189 Divide polynomials
- 190 Factor and remainder theorem
- 191 Graph polynomials in factored form
- 192 Factorise and graph polynomials
- 193 Multiplicity of roots and the graph

**Sequences** (topic_id: 58)
- 197 Linear sequences
- 198 Non-linear sequences

**Differentiation** (topic_id: 59)
- 201 Differentiation of polynomials
- 202 Equations of tangents and normals
- 203 Graphical applications of derivative

**Vectors** (topic_id: 57)
- 195 Vector operations
- 196 Basic vector proofs

---

## Example output

```json
[
  {
    "question_text": "Factorise fully: $6x^2 - 13x + 6$\n[2]",
    "solution_text": "Find two numbers that multiply to $6 \\times 6 = 36$ and add to $-13$: these are $-9$ and $-4$.\n$$\\begin{align*}\n6x^2 - 13x + 6 &= 6x^2 - 9x - 4x + 6 \\\\\\\\\n&= 3x(2x - 3) - 2(2x - 3) \\\\\\\\\n&= (3x - 2)(2x - 3)\n\\end{align*}$$",
    "difficulty": "Development",
    "marks": 2,
    "source": "HSC 2023 Adv Q5",
    "tags": [],
    "calculator": false,
    "classifications": [
      { "course_id": "stage5", "topic_id": null, "subtopic_id": null },
      { "course_id": null, "topic_id": 40, "subtopic_id": 118 }
    ]
  },
  {
    "question_text": "Find the exact value of $\\sin 30^\\circ + \\cos 60^\\circ$.\n[1]",
    "solution_text": "$$\\begin{align*}\n\\sin 30^\\circ + \\cos 60^\\circ &= \\frac{1}{2} + \\frac{1}{2} \\\\\\\\\n&= 1\n\\end{align*}$$",
    "difficulty": "Foundation",
    "marks": 1,
    "source": null,
    "tags": [],
    "calculator": false,
    "classifications": [
      { "course_id": "stage5", "topic_id": null, "subtopic_id": null },
      { "course_id": null, "topic_id": 53, "subtopic_id": 168 }
    ]
  }
]
```

---

## Checklist before outputting

- [ ] Every backslash is doubled in JSON strings (`\\frac`, `\\sin`, `\\sqrt`, etc.)
- [ ] All `$` delimiters are balanced (every `$` has a matching `$`)
- [ ] Every object has `question_text`, `difficulty`, and `classifications`
- [ ] `topic_id` and `subtopic_id` are integers (not strings)
- [ ] `course_id` is one of the valid string values from the course list (or `null` if not applicable)
- [ ] Course and topic are in **separate** classification objects (never combined in one object)
- [ ] `calculator` is `true`, `false`, or omitted (never a string)
- [ ] `marks` is an integer
- [ ] Output is a single JSON array with no trailing comma on the last element
- [ ] Output is wrapped in a ```json code block with no prose outside it
