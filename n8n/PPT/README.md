# PPT English Content and Layout Generator

Import `PPT英文内容与布局生成.json` into n8n, select the existing `deepseek`
credential on the **PPT Content Model** node if n8n asks for it, then activate
the workflow.

## Webhook

`POST /webhook/ppt-content-generator`

The application calls this webhook through:

`POST /api/ai/generate-ppt-content`

Set `N8N_PPT_CONTENT_WORKFLOW` only if the webhook path is changed. Its default
value is `ppt-content-generator`.

## Picture book batch generator

Import `绘本批量生成.json` and activate it. The workflow exposes:

`POST /webhook/ppt-storybook-generator`

The B9 “Picture Book” tool sends one page per line. The workflow creates one
ComfyUI task per page, repeats the same global story/character bible across the
whole book, and returns an ordered `assets` array for polling.

The current workflow also accepts multiple reference documents:

```json
{
  "options": {
    "referenceDocuments": [
      { "name": "activity-case.docx", "type": "docx", "text": "extracted text" }
    ],
    "referenceNotes": "Client keywords and additional visual rules"
  }
}
```

Before submitting page images, the workflow uses the configured `deepseek`
credential to build one global story bible. It separates activity facts from
visual rules, defines immutable traits for recurring characters, and creates a
character/scene plan for every page. Poppy is not automatic; its LoRA is loaded
only when the resulting page plan explicitly includes Poppy.

The API uses this workflow automatically for B9. Override it only when needed:

`N8N_PPT_IMAGE_B9_WORKFLOW=ppt-storybook-generator`

## Input

```json
{
  "courseMeta": {},
  "lessonPlan": [
    {
      "key": "engage",
      "title": "Engage",
      "steps": [
        {
          "id": "e1",
          "title": "Source lesson step",
          "duration": "10 minutes",
          "objective": "Source objective",
          "activity": "Source activity",
          "flow": "Source teaching flow",
          "resources": "Source resources"
        }
      ]
    }
  ],
  "templateId": "blue-business",
  "totalSlides": 16,
  "outputLanguage": "English"
}
```

## Output guarantees

- Uses a compact deck-planning call followed by one bounded model call per
  slide, preventing large multi-slide JSON responses from being truncated.
- English-only user-facing content.
- Exactly the requested number of slides.
- At least one slide for every lesson step.
- Absolute element coordinates for a 940 × 529 canvas.
- Text size, weight, color and alignment for every editable element.
- English speaker notes and text-free visual prompts.
- Rejection of Chinese text, unknown step IDs, empty elements and invalid
  slide counts before the response reaches the application.
