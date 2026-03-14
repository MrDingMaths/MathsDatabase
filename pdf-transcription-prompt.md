# MathsBase — PDF Transcription Instructions

You are transcribing maths questions from a PDF into a JSON array for bulk import into MathsBase. Output the JSON array wrapped in a single ```json code block — no prose or explanation outside the code block.

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
  "markers_feedback":   null,
  "classifications": [
    { "course_id": "string — see course list below", "topic_id": null, "subtopic_id": null },
    { "course_id": null, "topic_id": 123, "subtopic_id": 456 }
  ]
}
```

### Field rules

- **`question_text`** — Required. Include the full question exactly as written. Do **not** include the question number (e.g. "Q12", "14b") — that information belongs in `source`. For multi-part questions, keep all parts together in a single question object. Format part labels in bold using KaTeX: `$\textbf{(i)}$`, `$\textbf{(ii)}$`, `$\textbf{(a)}$`, etc. In JSON strings this becomes `$\\textbf{(i)}$`.
- **`solution_text`** — Full worked solution with all steps. Use KaTeX. Set to `null` if no solution is provided. Always include units in the final answer where applicable (e.g. `$= 12 \text{ cm}$`, `$= 4.5 \text{ m}^2$`). For **multiple choice questions**, generate a full worked solution showing how to arrive at the correct answer, even if the PDF only states the answer letter.
- **`difficulty`** — Rate based on cognitive demand. For multi-part questions, use the difficulty of the **most challenging part**. Use your judgement:
  - `Foundation`: Routine textbook style problem
  - `Development`: Multistep routine problem
  - `Mastery`: Multistep non-routine problem
  - `Challenge`: Very hard question requiring extensive understanding, possibly beyond the scope of the syllabus
- **`marks`** — The mark value shown in the PDF. Default to `1` if not shown.
- **`source`** — The exam/book/worksheet name and question number, e.g. `"2022 HSC Advanced Q12b"` or `"2025 IGCSE 0580 P1 Q2"`. Set to `null` if unknown.
- **`tags`** — Leave as `[]` unless there are obvious keyword tags (e.g. `["proof", "surds"]`).
- **`calculator`** — Whether a calculator is permitted. Set to `true` (calculator allowed), `false` (non-calculator), or omit the field entirely if not specified by the exam or worksheet.
- **`markers_feedback`** — Examiner or marker commentary on common errors, misconceptions, or marking notes associated with this question (e.g. from an HSC Marking Guidelines document). Transcribe exactly as written in the source document, with one exception: when the feedback refers to a question by number and part (e.g. "Question 27 (a)"), omit the question number and retain only the part label (e.g. "(a)"). Set to `null` if not provided. If a **Criteria** section is present, place each criterion on its own line using a hyphen-space prefix (e.g. `- Provides correct solution: 3 marks`). Plain text — no KaTeX required unless the feedback itself contains maths expressions.
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
| Vector (arrow notation) | `\vec{AB}` | `$\vec{AB}$` |
| Vector (boldface) | `\mathbf{v}` | `$\mathbf{v}$` |
| Column vector | `\begin{pmatrix} a \\ b \end{pmatrix}` | `$\begin{pmatrix} 3 \\ 4 \end{pmatrix}$` |

**Vectors:** Always render named vectors (e.g. **a**, **u**, **v**) in boldface using `\mathbf{}`. Use `\vec{}` only for vectors named by two points (e.g. $\vec{AB}$).

**Currency:** Dollar amounts must **not** be wrapped in KaTeX delimiters. Escape the dollar sign with a backslash so it renders as literal text. Write `\$36`, not `$\$36$`.
| Inequalities | `\leq`, `\geq`, `\neq` | `$x \leq 5$` |
| Approximately | `\approx` | `$x \approx 3.14$` |
| Therefore | `\therefore` | `$\therefore x = 2$` |
| Newline in display | `\\` inside `$$...$$` | `$$x = 1 \\ y = 2$$` |

### Tables

Use the `array` environment inside `$$...$$` for any table in a question or solution. Column alignment options: `l` (left), `c` (centre), `r` (right). Add `|` between column letters for vertical borders, and use `\hline` for horizontal borders. Cell text must be wrapped in `\text{}`. Empty cells are left blank. Rows are separated by `\\`.

```
$$\begin{array}{|l|c|c|c|}
\hline
\text{Result of game} & \text{win} & \text{lose} & \text{draw} \\
\hline
\text{Probability} & 0.3 & 0.25 & \\
\hline
\end{array}$$
```

In JSON (doubled backslashes):

```json
"$$\\begin{array}{|l|c|c|c|}\n\\hline\n\\text{Result of game} & \\text{win} & \\text{lose} & \\text{draw} \\\\\n\\hline\n\\text{Probability} & 0.3 & 0.25 & \\\\\n\\hline\n\\end{array}$$"
```

### Multi-line solutions — alignment at equals signs

All multi-step working must use the `align*` environment so equals signs are vertically aligned. Place `&` immediately before each `=` (or `\leq`, `\geq`, etc.) and separate lines with `\\`:

```
$$\\begin{align*}
3x + 1 &= 7 \\
3x &= 6 \\
x &= 2
\\end{align*}$$
```

In JSON this becomes (with doubled backslashes):

```json
"solution_text": "$$\\begin{align*}\n3x + 1 &= 7 \\\\\n3x &= 6 \\\\\nx &= 2\n\\end{align*}$$"
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

## Handling diagrams

When a question or solution includes a diagram (e.g. a geometric figure, graph, number line, tree diagram, or any visual element):

1. **Transcribe the question text as normal** — include all written text and maths exactly as it appears.
2. **Insert a placeholder** at the point where the diagram appears, using this exact format:

   - In `question_text`: `[DIAGRAM]`
   - In `solution_text`: `[DIAGRAM]`

3. The `[DIAGRAM]` placeholder marks where the diagram appears. No image URL is stored.

### Diagram answers in `solution_text`

When the **answer itself is a diagram** (e.g. draw lines of symmetry, shade a region, complete a shape), use your judgement:

- **Simple diagram answers — describe in words.** If the action is straightforward to describe unambiguously in plain text, write a clear description instead of a placeholder. Be as specific as possible.
  - *Examples:* "Draw a vertical line and a horizontal line through the centre of the shape.", "Shade the middle square in the second row.", "Draw a line from $A$ to $C$."
- **Complex diagram answers — use `[DIAGRAM]`.** If the answer requires a detailed visual (e.g. plotting a graph, drawing a geometric construction with multiple steps, shading a region on a coordinate plane), use the `[DIAGRAM]` placeholder as normal.

**Example:**

```json
{
  "question_text": "The diagram shows triangle $ABC$.\n\n[DIAGRAM]\n\nFind the value of $x$.",
  "solution_text": "[DIAGRAM]\n\n$$\\begin{align*}\nx &= 180 - 90 - 35 \\\\\n&= 55\n\\end{align*}$$",
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
- 53 Integers
- 54 FDP Conversions
- 55 Fraction and decimal operations
- 56 Percentage operations
- 57 Round decimals
- 58 Classify types of numbers
- 59 Ratios
- 60 Rates
- 61 Distance-time graphs
- 74 Metric prefixes
- 75 Measurement error
- 76 Significant figures and standard form
- 194 Recurring decimals
- 207 Place value
- 208 Factors and Multiples
- 209 Time

**Algebra** (topic_id: 40)
- 62 Basic algebra
- 63 Expand expressions
- 64 Factorise using HCF
- 77 Algebraic fractions simple
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
- 217 Exponential equations

**Equations** (topic_id: 42)
- 69 Linear equations
- 70 Formulas
- 71 Quadratics simple
- 126 Monic quadratics
- 127 Cubics simple
- 128 Inequalities linear
- 129 Rearrange formulas
- 130 Quadratics non-monic
- 131 Completing the square
- 132 Quadratic formula
- 133 Equations reducible to quadratics
- 134 Simultaneous equations
- 219 Discriminant
- 220 Quadratic inequalities

**Linear Relationships** (topic_id: 43)
- 72 Plot points
- 73 Plot lines
- 139 Gradient-intercept form
- 140 Horizontal and vertical lines
- 141 Point gradient form
- 142 Parallel and Perpendicular lines

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
- 213 Constructions

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
- 215 Volume of pyramids and cones
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
- 211 Box plots and quartiles
- 212 Standard deviation
- 218 Frequency density
- 233 Grouped data

**Probability** (topic_id: 47)
- 107 Simple probability and relative frequency
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
- 244 Annuities

**Coordinate Geometry** (topic_id: 49)
- 135 Gradient
- 136 Midpoint
- 137 Distance
- 138 Problems
- 204 Transformations

**Non-linear Relationships** (topic_id: 50)
- 143 Plotting parabolas
- 144 Plotting exponentials
- 216 Plotting hyperbolas
- 145 Identifying equation and graph

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
- 170 3D trigonometry
- 171 Sine rule
- 172 Cosine rule
- 173 SAS area rule
- 174 Unit circle concepts
- 175 Graphs of trigonometric functions
- 176 Tan and gradient
- 177 Solve basic trigonometric equations
- 178 Ambiguous case of sine rule
- 225 Radians
- 226 Basic identities

**Functions** (topic_id: 54)
- 146 Parabolas
- 147 Exponentials
- 148 Hyperbolas
- 149 Circles and semicircles
- 150 Cubic curves simple
- 151 Power curves
- 184 Function notation
- 185 Domain and range
- 199 Composite functions
- 200 Graph inequalities
- 210 Inverse functions
- 214 Points of intersection
- 221 Graph cubics in factored form
- 222 Odd and even
- 223 Piecewise-defined
- 224 Absolute value
- 229 Logarithmic functions
- 230 Transformations
- 231 Transformations of trigonometric functions

**Logarithms** (topic_id: 55)
- 186 Laws of logarithms
- 187 Equations using logarithms

**Polynomials** (topic_id: 56)
- 188 Terminology
- 189 Divide polynomials
- 190 Factor and remainder theorem
- 191 Graph polynomials in factored form
- 192 Factorise and graph polynomials
- 193 Multiplicity of roots and the graph

**Vectors** (topic_id: 57)
- 195 Vector operations
- 196 Basic vector proofs

**Sequences** (topic_id: 58)
- 197 Linear sequences
- 198 Non-linear sequences

**Differentiation** (topic_id: 59)
- 201 Power functions
- 202 Tangents and normals
- 203 Graphical applications
- 227 First principles
- 228 Motion
- 239 Curve sketching
- 240 Optimisation
- 241 Rates of change
- 245 Exponential logarithmic trigonometric

**Integration** (topic_id: 60)
- 236 Power functions
- 237 Exponential logarithmic trigonometric
- 238 Areas

**Sequences and Series** (topic_id: 61)
- 234 Arithmetic
- 235 Geometric

**Random variables** (topic_id: 62)
- 232 Discrete
- 242 Continuous

**Normal distribution** (topic_id: 63)

---

## Example output

```json
[
  {
    "question_text": "Find the equation of the tangent to $y = 5x^3 - \\frac{2}{x^2} - 9$ at the point $(1, -6)$.\n[3]",
    "solution_text": "$$\\begin{align*}\ny &= 5x^3 - \\frac{2}{x^2} - 9 \\\\\ny &= 5x^3 - 2x^{-2} - 9 \\\\\ny' &= 15x^2 + 4x^{-3} \\\\\ny' &= 15x^2 + \\frac{4}{x^3} \\\\\ny' &= 15(1) + \\frac{4}{(1)} \\\\\ny' &= 19 \\\\\n& \\quad \\\\\ny - y_1 &= m(x - x_1) \\\\\ny + 6 &= 19(x - 1) \\\\\ny + 6 &= 19x - 19 \\\\\ny &= 19x - 25\n\\end{align*}$$",
    "difficulty": "Development",
    "marks": 3,
    "source": "HSC.ADV.2025 Q12",
    "tags": [],
    "markers_feedback": "Criteria:\n- Provides correct solution: 3 marks\n- Finds the correct gradient of the tangent, or equivalent merit: 2 marks\n- Attempts to find the gradient of the tangent, or equivalent merit: 1 mark\n\nIn better responses, students were able to:\n- differentiate correctly, particularly the term with the negative index\n- find the equation of the tangent by collecting the like terms of the equation correctly\n- substitute the point and gradient into the equation of a straight line to find $y = 19x - 25$ using either form of the equation of a line.\n\nAreas for students to improve include:\n- identifying the most appropriate method of differentiation – working with negative indices\n- recognising the difference between finding the gradient of a tangent and locating a maximum or minimum point\n- knowing the difference between finding the derivative at a point ($f'(a) = m$) and solving to find value of $x$ that produces a particular derivative, $f'(x) = a$\n- correctly substituting values into $y - y_1 = m(x - x_1)$.",
    "classifications": [
      {
        "course_id": "stage6_advanced",
        "topic_id": null,
        "subtopic_id": null
      },
      {
        "course_id": null,
        "topic_id": 59,
        "subtopic_id": 202
      }
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
- [ ] Units are included in the final answer of `solution_text` wherever the question involves measurement or physical quantities
- [ ] Output is a single JSON array with no trailing comma on the last element
- [ ] Output is wrapped in a ```json code block with no prose outside it
