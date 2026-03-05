-- Seed data for MrDingMaths Question Bank
-- Run this in Supabase SQL Editor to populate sample questions

INSERT INTO questions (question_text, solution_text, answer, answer_type, stage, topic, subtopic, difficulty, source, tags, has_katex, has_image, choices) VALUES

-- 1. Simple algebra (exact)
('Solve for $x$: $3x + 7 = 22$',
 '$3x + 7 = 22$\n$3x = 15$\n$x = 5$',
 '5', 'exact', 'stage4', 'Algebra', 'Linear Equations', 1, NULL,
 ARRAY['algebra', 'linear'], true, false, NULL),

-- 2. Quadratic (exact)
('Factorise $x^2 - 5x + 6$.',
 '$x^2 - 5x + 6 = (x - 2)(x - 3)$',
 '(x-2)(x-3)', 'exact', 'stage5', 'Algebra', 'Quadratics', 2, NULL,
 ARRAY['algebra', 'quadratic', 'factorise'], true, false, NULL),

-- 3. Multiple choice trigonometry
('What is the exact value of $\sin 60°$?',
 '$\sin 60° = \frac{\sqrt{3}}{2}$',
 'C', 'multiple_choice', 'stage5', 'Trigonometry', 'Exact Values', 2, NULL,
 ARRAY['trigonometry', 'exact values'],
 true, false, '["1/2", "1/\\sqrt{2}", "\\sqrt{3}/2", "\\sqrt{3}"]'),

-- 4. Calculus differentiation (exact)
('Differentiate $y = 3x^4 - 2x^2 + 7x$.',
 '$\\frac{dy}{dx} = 12x^3 - 4x + 7$',
 '12x^3 - 4x + 7', 'exact', 'stage6_standard', 'Calculus', 'Differentiation', 2,
 '2022 Trial Q3', ARRAY['calculus', 'differentiation', 'polynomial'], true, false, NULL),

-- 5. Integration (exact)
('Find $\int (6x^2 + 4x - 1)\, dx$.',
 '$\int (6x^2 + 4x - 1)\, dx = 2x^3 + 2x^2 - x + C$',
 '2x^3 + 2x^2 - x + C', 'exact', 'stage6_standard', 'Calculus', 'Integration', 2, NULL,
 ARRAY['calculus', 'integration'], true, false, NULL),

-- 6. Probability MC
('A fair die is rolled twice. What is the probability of getting a sum of 7?',
 'There are 36 equally likely outcomes. The pairs that sum to 7 are: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1). That is 6 outcomes.\n$P = \\frac{6}{36} = \\frac{1}{6}$',
 'B', 'multiple_choice', 'stage5', 'Probability', 'Counting', 3, NULL,
 ARRAY['probability', 'dice'],
 true, false, '["1/12", "1/6", "1/4", "1/3"]'),

-- 7. Geometry (numeric tolerance)
('Find the area of a circle with radius $5$ cm. Give your answer to 2 decimal places.',
 '$A = \\pi r^2 = \\pi(5)^2 = 25\\pi \\approx 78.54$ cm$^2$',
 '78.54', 'numeric_tolerance', 'stage4', 'Measurement', 'Area', 1, NULL,
 ARRAY['geometry', 'circle', 'area'], true, false, NULL),

-- 8. Exponentials and Logarithms
('Solve $2^x = 32$.',
 '$2^x = 32$\n$2^x = 2^5$\n$x = 5$',
 '5', 'exact', 'stage5', 'Algebra', 'Exponentials', 2, NULL,
 ARRAY['algebra', 'exponentials', 'indices'], true, false, NULL),

-- 9. Extension 1 - Binomial theorem
('Find the coefficient of $x^3$ in the expansion of $(2 + x)^5$.',
 'Using the binomial theorem:\n$\\binom{5}{3}(2)^2(x)^3 = 10 \\cdot 4 \\cdot x^3 = 40x^3$\nThe coefficient is 40.',
 '40', 'exact', 'stage6_ext1', 'Algebra', 'Binomial Theorem', 3,
 '2021 HSC Q12', ARRAY['binomial', 'extension1', 'HSC'], true, false, NULL),

-- 10. Extension 2 - Complex numbers MC
('If $z = 3 + 4i$, what is $|z|$?',
 '$|z| = \\sqrt{3^2 + 4^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$',
 'A', 'multiple_choice', 'stage6_ext2', 'Complex Numbers', 'Modulus', 3,
 NULL, ARRAY['complex', 'modulus', 'extension2'],
 true, false, '["5", "7", "\\sqrt{7}", "25"]');
