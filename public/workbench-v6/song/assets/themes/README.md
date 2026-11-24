# Classroom theme resources

`song/activity-themes.js` is the shared configuration for this activity only.
It exports the same `SongActivityThemes` interface in the browser and Node.

The current garden, moonlight and sunset scenes use `garden-v2.webp`,
`moon-v2.webp` and `beat-v2.webp`. These original backgrounds were generated with
the built-in `image_gen` tool on 2026-10-19, then converted to independent WebP
resources without semantic image editing. `generated-scenes-v2.json` records
their PNG sources, dimensions and hashes; the exact prompts are retained in
`doc/2026-10-19_场景差异化/image-prompts.json` from the project root.

The five original scene images remain available without overwriting the earlier
delivery. They were extracted from the user-supplied
`music-classroom-wrap-check.html` reference; `space.webp` and `beach.webp` remain
the active space and coast scenes. `source-manifest.json` retains the original
source, atlas cell, dimensions and hashes. The supplied reference does not
establish an additional external image licence; retain its provenance when
moving these original assets.

The separate Noto Sans regular and bold fonts supply real 400 and 700 weights.
The Noto Sans SC font is a Chinese subset with a declared 400–700 weight axis.
Keep `font-notices.txt` with the fonts. New Chinese interface text can use the
system fallback if a glyph is outside that subset.

Original educational object illustrations are embedded as small SVG paths in
`activity-themes.js`: 15 word cues, 15 currently listed instruments, one legacy
`claves` instrument and an unknown-word diamond. They use a shared 64 × 64 viewBox,
2.6-unit dark outlines, flat muted colours and simple identifying details, inspired
by the symbol/text presentation at https://widgitonline.com/en/home. The artwork
is original; no Widgit symbol files are copied or loaded. Keep the historical
`LUCIDE-LICENSE.txt` with the existing asset provenance.
There are no characters, faces, animals, emoji, runtime image services or new
icon-library dependencies in these illustrations. Do not tint paths with the
scene text colour. Words and instruments share this source in preparation,
composing and singing. Preparation adapts historical emoji storage values to
these symbols for display, while retaining uploaded pictures and removed images.
`song/symbols-preview.html` is the visual catalogue for reviewing both groups.

To add a theme:

1. Put an independently optimized scene image in this folder.
2. Add one `themes` entry with label, light/dark scheme, filename and the shared
   `--scene-*` token values. Keep text and its reading protection in the same
   configuration so they switch together.
3. Optionally add a metadata mapping in `resolve`; the manual selector can list
   `Object.entries(themes)` automatically. Unrecognized metadata uses `garden`.
4. Check both modes, long lyrics, narrow screens, backdrop-filter fallback,
   reduced motion, clear projection, and the final composited text contrast.

`apply` only changes visual-root data attributes and CSS variables. It does not
re-render content, store or modify teaching data, or access the audio player.
Any background fade belongs in the scoped scene CSS; foreground colors and
reading protection must not interpolate between light and dark palettes.

The header scrim spans the scene's actual width and fades vertically to zero.
The content uses `--scene-content-width` (normally 1440px, 1808px in the
Full HD layout) through header padding. Shared
page-gutter/top tokens keep the scrim flush at every breakpoint without `100vw`
scrollbar overflow. The protected portion extends below the title's supporting
text before fading. Its height grows with wrapped headings; avoid attaching a
partly opaque radial scrim to a limited-width box, which reveals vertical seams.
Material-selection status text has its own small theme-coloured reading surface;
this protects auxiliary instructions over detailed scenery without adding a
full-width panel or changing the fixed status region.

Singing uses separate `stage-shade`, `stage-wash` and `stage-clear-wash` tokens:
the first gently grades the whole scene, the other two control a soft radial
reading wash in normal / clear-projection modes. Keep these separate from the
composer glass and title wash. The scene stays fixed to the viewport as lyrics
grow, and `data-scene-transition` enables fading only when the theme changes.
The theme option `readingFade` supplies `--scene-stage-fade`, the radial gradient's
transparent end stop. It defaults to `74%`; garden and sunset use `100%` to keep
long lyrics protected farther from the centre. This changes only the soft wash,
not the lyric viewport, text size or footer position. Check the final composite
again when adjusting this value or replacing a background.

Singing has a viewport-height flex shell. The header, mode/theme controls and
footer do not grow with the current sentence. Only `.scene-lyrics-viewport`
scrolls; its stable scrollbar gutter prevents horizontal jumps. The feathered
wash belongs to `.scene-stage`, outside that scroll region. Never attach the
wash's oversized pseudo-element to scrollable lyrics. Long content keeps its
font size and wraps; the current group starts at its first word when it cannot
fit. Empty previous/next slots keep ordinary current lines centered. Singing
shows the selected instruments; instrument editing remains in composing mode.
Preserve internal scroll positions across re-renders and keep the active line
navigation button visible without scrolling the page.

Word cues follow a symbol-above-word layout, inspired by Widgit Online's
symbol/text association. Artwork is the shared original educational object-symbol system,
not the proprietary Widgit symbol library. All 15 default words have distinct
object cues; unknown words retain a neutral diamond. `cueHTML` wraps the symbol
in `lyric-cue-picture` and the word in `lyric-cue-word`. Actual fill-ins carry
`lyric-filled`; fixed words use `filled: false`. The controller retains this
distinction from the original blank IDs, including custom fill-in phrases.

The symbol and word wrap as one inline block, with the word on the sentence
baseline. Very long words can wrap within that block on small screens. Filled
words have a larger picture, an accent colour and an underline; they do not
depend on colour alone. New symbols must remain objects, without faces or emoji.

Each theme also supplies a `filled: { ink }` palette, exposed as
`--scene-filled`. Only actual filled words receive this colour and a thick
underline; fixed words inherit the lyric colour. Word and filled-slot backgrounds
remain transparent, including selected and hover states; keyboard focus outlines
and the current editing row retain their interaction feedback.
Keep these tokens separate from `hint`, which styles instruments and controls.
Light scenes use high-chroma jewel inks: coastal ultramarine, garden orchid and
sunset raspberry. Both dark scenes use warm gold for fill-ins; moonlight combines
it with ivory lyrics and lavender controls on purple glass, while space keeps
its blue palette. Do not desaturate the light-scene inks into grey-blue or
grey-purple: contrast against the background alone does not make a fill-in stand
out from the neighboring dark lyric. Keep at least 4.5:1 contrast against the
final composited reading area and visually check that distinction in the full
sentence. Space retains its warm gold. Do not add word-level plates.
Verify the colour in composing, current/neighboring singing lines and whole-song
view, including clear projection. Do not animate the foreground token. Underlines
use text decoration so a long word stays underlined when it wraps on narrow screens.

The three v2 scenes differ in composition as well as colour: the garden uses
close foliage, a path and morning light; moonlight uses a dark plum sky, clouds
and a crescent; sunset uses a warm open-air music terrace and curved stage steps.
Keep foreground objects at the edges and the lyric area quiet. Theme changes
reuse the same layout, controls, symbols and business state.


Full HD classroom layout uses a 1920 × 1080 CSS-pixel viewport as its reference,
with browser zoom at 100%. A screen's native resolution does not include the
space consumed by browser chrome; use browser fullscreen for that viewport.
The scoped CSS enables the fixed classroom shell at `min-width: 1600px` and
`min-height: 850px`. `--scene-content-width` and `--scene-stage-width` align the
header, composer, singing stage and controls without changing other modules.

The wide composer keeps controls outside its scrolling content. Lyric rows
retain natural height inside `.workspace-lines`; each material grid has its own
stable scrollbar gutter. The grid uses five columns from 1800px and four at
1600–1799px. Do not force arbitrary long lyrics or added words into a fixed row
height to make them fit. `activityScroll` preserves each visible region's offset
across redraws and mode switches, retains hidden banks' offsets, and binds those
offsets to the current interaction session rather than persisted activity data.
Keep the existing smaller-screen rules and singing scroll controller intact.

At the Full HD breakpoint, the expanded word-bank dialog has a 1120px width
limit and five columns, with 80px illustrations and 26px words. The normal
classroom-save notice occupies the header's spare right area; error notices
remain in normal content flow with their retry action. Long material-selection
status text scrolls within its fixed status region instead of covering lyrics.
