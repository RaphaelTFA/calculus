# Slide JSON Format Specification

## Overview
Slides are stored as JSON in the database. Each step contains multiple slides, and each slide contains multiple blocks.

## Slide Structure

```json
{
  "id": 1,
  "step_id": 1,
  "slide_number": 1,
  "title": "Introduction to Limits",
  "transition_type": "fade",
  "background_color": "#ffffff",
  "background_image_url": null,
  "blocks": []
}
```

## Block Types

### 1. Text Block
```json
{
  "block_type": "text",
  "block_data": {
    "content": "# Heading\n\nThis is a **bold** paragraph with _italic_ text.",
    "format": "markdown",
    "text_align": "left",
    "font_size": "base",
    "text_color": "#333333"
  },
  "position_x": 5,
  "position_y": 10,
  "width": 90,
  "height": null,
  "animation_type": "fadeIn",
  "animation_delay": 0,
  "sort_order": 1
}
```

**Format options:** `markdown`, `plain`, `html`
**Font sizes:** `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`, `4xl`
**Text align:** `left`, `center`, `right`, `justify`

### 2. Image Block
```json
{
  "block_type": "image",
  "block_data": {
    "src": "/images/lessons/limit-graph.png",
    "alt": "Graph showing limit approaching",
    "caption": "Figure 1: Visual representation of a limit",
    "object_fit": "contain",
    "border_radius": 8,
    "shadow": true
  },
  "position_x": 10,
  "position_y": 30,
  "width": 80,
  "height": 40,
  "animation_type": "zoomIn",
  "animation_delay": 300,
  "sort_order": 2
}
```

**Object fit:** `contain`, `cover`, `fill`, `none`

### 3. Math Block (LaTeX)
```json
{
  "block_type": "math",
  "block_data": {
    "latex": "\\lim_{x \\to a} f(x) = L",
    "display_mode": "block",
    "font_size": "xl",
    "color": "#1a1a1a"
  },
  "position_x": 10,
  "position_y": 20,
  "width": 80,
  "animation_type": "fadeIn",
  "animation_delay": 0,
  "sort_order": 1
}
```

**Display modes:** `block` (centered, large), `inline` (within text)

### 4. Code Block
```json
{
  "block_type": "code",
  "block_data": {
    "code": "def limit(f, a, epsilon=0.0001):\n    return (f(a + epsilon) + f(a - epsilon)) / 2",
    "language": "python",
    "show_line_numbers": true,
    "highlight_lines": [2],
    "editable": false,
    "runnable": true
  },
  "position_x": 5,
  "position_y": 40,
  "width": 90,
  "animation_type": "slideUp",
  "animation_delay": 200,
  "sort_order": 3
}
```

**Languages:** `python`, `javascript`, `cpp`, `java`, `latex`, `pseudocode`

### 5. Video Block
```json
{
  "block_type": "video",
  "block_data": {
    "src": "/videos/limit-explanation.mp4",
    "poster": "/images/video-poster.png",
    "autoplay": false,
    "loop": false,
    "muted": false,
    "controls": true,
    "caption": "Video explanation of limits"
  },
  "position_x": 10,
  "position_y": 20,
  "width": 80,
  "height": 45,
  "animation_type": "fadeIn",
  "sort_order": 1
}
```

### 6. Quiz Block (Multiple Choice)
```json
{
  "block_type": "quiz",
  "block_data": {
    "quiz_type": "multiple_choice",
    "question": "What is $\\lim_{x \\to 2} x^2$?",
    "question_format": "markdown",
    "options": [
      { "id": 1, "text": "2", "is_correct": false },
      { "id": 2, "text": "4", "is_correct": true },
      { "id": 3, "text": "8", "is_correct": false },
      { "id": 4, "text": "Undefined", "is_correct": false }
    ],
    "multiple_select": false,
    "shuffle_options": true,
    "explanation": "When x approaches 2, x² approaches 2² = 4",
    "hint": "Remember: for polynomial functions, just substitute the value!",
    "points": 1,
    "max_attempts": 3
  },
  "position_x": 5,
  "position_y": 20,
  "width": 90,
  "animation_type": "fadeIn",
  "sort_order": 1
}
```

### 7. Quiz Block (Text Input)
```json
{
  "block_type": "quiz",
  "block_data": {
    "quiz_type": "text_input",
    "question": "Calculate $\\lim_{x \\to 3} (2x + 1)$",
    "question_format": "markdown",
    "input_type": "number",
    "placeholder": "Enter your answer",
    "correct_answers": ["7", "7.0", "7.00"],
    "case_sensitive": false,
    "explanation": "2(3) + 1 = 6 + 1 = 7",
    "hint": "Substitute x = 3 into the expression",
    "points": 2,
    "max_attempts": 2
  },
  "position_x": 5,
  "position_y": 20,
  "width": 90,
  "sort_order": 1
}
```

**Input types:** `text`, `number`, `expression` (math expression)

### 8. Quiz Block (True/False)
```json
{
  "block_type": "quiz",
  "block_data": {
    "quiz_type": "true_false",
    "question": "If $\\lim_{x \\to a} f(x)$ exists, then $f(a)$ must be defined.",
    "question_format": "markdown",
    "correct_answer": false,
    "explanation": "A limit can exist even if the function is not defined at that point. For example, $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$ even though the function is undefined at x=0.",
    "points": 1
  },
  "position_x": 5,
  "position_y": 20,
  "width": 90,
  "sort_order": 1
}
```

### 9. Drag and Drop Block
```json
{
  "block_type": "drag_drop",
  "block_data": {
    "instruction": "Match each limit property with its formula:",
    "items": [
      { "id": "item_1", "content": "Sum Rule", "content_type": "text" },
      { "id": "item_2", "content": "Product Rule", "content_type": "text" },
      { "id": "item_3", "content": "Quotient Rule", "content_type": "text" }
    ],
    "zones": [
      { 
        "id": "zone_1", 
        "label": "$\\lim [f(x) + g(x)] = \\lim f(x) + \\lim g(x)$",
        "correct_item": "item_1"
      },
      { 
        "id": "zone_2", 
        "label": "$\\lim [f(x) \\cdot g(x)] = \\lim f(x) \\cdot \\lim g(x)$",
        "correct_item": "item_2"
      },
      { 
        "id": "zone_3", 
        "label": "$\\lim \\frac{f(x)}{g(x)} = \\frac{\\lim f(x)}{\\lim g(x)}$",
        "correct_item": "item_3"
      }
    ],
    "explanation": "These are the basic limit laws that allow us to break down complex limits.",
    "points": 3
  },
  "position_x": 5,
  "position_y": 10,
  "width": 90,
  "sort_order": 1
}
```

### 10. Interactive Graph Block
```json
{
  "block_type": "interactive_graph",
  "block_data": {
    "graph_type": "function_plot",
    "functions": [
      {
        "expression": "x^2",
        "color": "#2196F3",
        "label": "f(x) = x²"
      }
    ],
    "x_range": [-5, 5],
    "y_range": [-2, 25],
    "show_grid": true,
    "show_axes": true,
    "interactive": true,
    "features": {
      "show_point": { "x": 2, "label": "Point of interest" },
      "draggable_point": true,
      "show_tangent": false,
      "show_limit_approach": {
        "enabled": true,
        "target_x": 2,
        "animation": true
      }
    }
  },
  "position_x": 10,
  "position_y": 20,
  "width": 80,
  "height": 50,
  "sort_order": 1
}
```

### 11. Fill in the Blank Block
```json
{
  "block_type": "fill_blank",
  "block_data": {
    "template": "The limit of f(x) as x approaches {{blank_1}} equals {{blank_2}}.",
    "blanks": [
      {
        "id": "blank_1",
        "correct_answers": ["a", "A"],
        "placeholder": "?",
        "width": 60
      },
      {
        "id": "blank_2",
        "correct_answers": ["L"],
        "placeholder": "?",
        "width": 60
      }
    ],
    "explanation": "The standard notation is: lim(x→a) f(x) = L",
    "points": 2
  },
  "position_x": 5,
  "position_y": 30,
  "width": 90,
  "sort_order": 1
}
```

### 12. Ordering/Sequence Block
```json
{
  "block_type": "ordering",
  "block_data": {
    "instruction": "Arrange the steps to evaluate $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$ in correct order:",
    "items": [
      { "id": 1, "content": "Factor the numerator: $(x+2)(x-2)$" },
      { "id": 2, "content": "Cancel common factor $(x-2)$" },
      { "id": 3, "content": "Substitute $x = 2$ into simplified expression" },
      { "id": 4, "content": "Get final answer: $4$" }
    ],
    "correct_order": [1, 2, 3, 4],
    "explanation": "Always try to factor and simplify before substituting!",
    "points": 4
  },
  "position_x": 5,
  "position_y": 15,
  "width": 90,
  "sort_order": 1
}
```

### 13. Callout/Highlight Block
```json
{
  "block_type": "callout",
  "block_data": {
    "type": "tip",
    "title": "Pro Tip",
    "content": "When you see $\\frac{0}{0}$ form, always try to factor and simplify first!",
    "icon": "lightbulb",
    "collapsible": false
  },
  "position_x": 5,
  "position_y": 70,
  "width": 90,
  "sort_order": 5
}
```

**Callout types:** `tip`, `warning`, `info`, `note`, `example`, `definition`, `theorem`

### 14. Reveal Block (Step-by-step)
```json
{
  "block_type": "reveal",
  "block_data": {
    "title": "Solution",
    "button_text": "Show Solution",
    "content": [
      {
        "step": 1,
        "text": "First, factor the numerator",
        "math": "x^2 - 4 = (x+2)(x-2)"
      },
      {
        "step": 2,
        "text": "Cancel common factors",
        "math": "\\frac{(x+2)(x-2)}{x-2} = x + 2"
      },
      {
        "step": 3,
        "text": "Substitute x = 2",
        "math": "2 + 2 = 4"
      }
    ],
    "reveal_mode": "step_by_step"
  },
  "position_x": 5,
  "position_y": 50,
  "width": 90,
  "sort_order": 4
}
```

**Reveal modes:** `all_at_once`, `step_by_step`

---

## Animation Types
- `none` - No animation
- `fadeIn` - Fade in
- `fadeInUp` - Fade in from below
- `fadeInDown` - Fade in from above
- `slideUp` - Slide up
- `slideDown` - Slide down
- `slideLeft` - Slide from right
- `slideRight` - Slide from left
- `zoomIn` - Zoom in
- `bounce` - Bounce effect
- `pulse` - Pulse effect

## Transition Types (Between Slides)
- `none` - Instant transition
- `fade` - Crossfade
- `slide` - Slide horizontally
- `slideUp` - Slide vertically
- `zoom` - Zoom transition

---

## Complete Slide Example

```json
{
  "slides": [
    {
      "slide_number": 1,
      "title": "What is a Limit?",
      "transition_type": "fade",
      "background_color": "#f8fafc",
      "blocks": [
        {
          "block_type": "text",
          "block_data": {
            "content": "# What is a Limit?",
            "format": "markdown",
            "text_align": "center",
            "font_size": "3xl"
          },
          "position_x": 5,
          "position_y": 5,
          "width": 90,
          "animation_type": "fadeInDown",
          "animation_delay": 0,
          "sort_order": 1
        },
        {
          "block_type": "text",
          "block_data": {
            "content": "A **limit** describes the value that a function approaches as the input approaches some value.",
            "format": "markdown",
            "text_align": "center"
          },
          "position_x": 10,
          "position_y": 20,
          "width": 80,
          "animation_type": "fadeIn",
          "animation_delay": 300,
          "sort_order": 2
        },
        {
          "block_type": "math",
          "block_data": {
            "latex": "\\lim_{x \\to a} f(x) = L",
            "display_mode": "block",
            "font_size": "2xl"
          },
          "position_x": 20,
          "position_y": 35,
          "width": 60,
          "animation_type": "zoomIn",
          "animation_delay": 600,
          "sort_order": 3
        },
        {
          "block_type": "interactive_graph",
          "block_data": {
            "graph_type": "function_plot",
            "functions": [
              { "expression": "1/x", "color": "#2196F3" }
            ],
            "x_range": [-5, 5],
            "y_range": [-5, 5],
            "show_grid": true,
            "interactive": true
          },
          "position_x": 15,
          "position_y": 50,
          "width": 70,
          "height": 40,
          "animation_type": "fadeIn",
          "animation_delay": 900,
          "sort_order": 4
        }
      ]
    },
    {
      "slide_number": 2,
      "title": "Quick Check",
      "transition_type": "slide",
      "background_color": "#ffffff",
      "blocks": [
        {
          "block_type": "text",
          "block_data": {
            "content": "## Let's check your understanding!",
            "format": "markdown",
            "text_align": "center"
          },
          "position_x": 5,
          "position_y": 5,
          "width": 90,
          "animation_type": "fadeIn",
          "sort_order": 1
        },
        {
          "block_type": "quiz",
          "block_data": {
            "quiz_type": "multiple_choice",
            "question": "What does $\\lim_{x \\to 3} x^2$ equal?",
            "question_format": "markdown",
            "options": [
              { "id": 1, "text": "3", "is_correct": false },
              { "id": 2, "text": "6", "is_correct": false },
              { "id": 3, "text": "9", "is_correct": true },
              { "id": 4, "text": "27", "is_correct": false }
            ],
            "shuffle_options": true,
            "explanation": "As x approaches 3, x² approaches 3² = 9",
            "points": 1,
            "max_attempts": 2
          },
          "position_x": 10,
          "position_y": 20,
          "width": 80,
          "animation_type": "slideUp",
          "animation_delay": 200,
          "sort_order": 2
        }
      ]
    }
  ]
}
```
