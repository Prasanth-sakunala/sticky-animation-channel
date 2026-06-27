# Video Engagement Improvement Plan

This file is the source of truth for improving the mystery video pipeline. Use it before making implementation changes so the known gaps do not get lost or replaced by random visual effects.

## Current Problems Observed

- The final video looks like a narrated slideshow instead of a mystery unfolding.
- The narrator/avatar appears too often in the center of the frame.
- Many scenes use generic visual ideas instead of concrete case evidence.
- Mystery symbols such as `question_mark` and `exclamation` are overused.
- Strong available assets are underused: police station, courtroom, graveyard, rainy street, newspaper, photograph, diary, envelope, landline phone, suitcase, locked box, key, handprint, flashlight.
- There are too few text overlays for viewer orientation.
- Too many scenes are static.
- There is no real background music in `assets/music`, so the assembled video has narration only.

## Baseline From The Reviewed Video

Project reviewed: `unsolved_mystery_cases`

- Total scenes: `62`
- Characters in storyboard: `none` for all `62`
- Static camera scenes: `35`
- Transitions: `cut` in `54` scenes, `fade` in `8`
- Text overlays: `5`
- Scenes with no objects: `21`
- Common generic objects: `question_mark`, `exclamation`, `fire`, `clock`, `magnifying_glass`
- Common generic backgrounds: `generic_dark`, `generic_light`, `old_room`

## Implementation Rules

- Work one phase at a time.
- Do not add broad visual effects until storyboard quality is measurable.
- After each phase, generate scenes or a short render and compare metrics.
- Prefer concrete story assets over symbolic decorations.
- Keep changes scoped to the phase being implemented.
- Do not upload to YouTube during testing.
- Do not generate thumbnails during testing unless the current phase explicitly asks for it.

## Phase 1: Add Review Metrics

Goal: create a repeatable way to measure video/storyboard quality before changing visuals.

Build or use a script/report that measures:

- total scene count
- background usage counts
- fallback or generic background usage
- character usage counts
- pose usage counts
- object usage counts
- scenes with no objects
- text overlay count
- camera movement counts
- transition counts
- narrator-dominant scene count, if detectable

Suggested output:

- Console report for `output/scenes/{projectId}/input-props.json`
- Optional sampled review frames from `output/final/{projectId}/final_video.mp4`

Success criteria:

- We can compare old and new videos using the same metrics.
- The report clearly flags generic backgrounds, generic objects, missing overlays, and static scenes.

## Phase 2: Fix Storyboard Asset Selection

Goal: make the storyboard choose concrete visual assets for each mystery beat.

Replace generic scene choices such as:

- `generic_dark`
- `generic_light`
- `old_room`
- `question_mark`
- `exclamation`
- `none`

With concrete choices such as:

- `bg39_police_station`
- `bg38_courtroom`
- `bg37_graveyard_night`
- `bg41_rainy_street_night`
- `bg19_alley_night`
- `bg40_tunnel`
- `obj32_newspaper`
- `obj19_photograph`
- `obj18_diary`
- `obj13_envelope`
- `obj14_landline_phone`
- `obj22_suitcase`
- `obj20_locked_box`
- `obj16_key_ornate`
- `obj17_bloody_handprint`
- `obj15_flashlight`

Rules:

- Every scene should have at least one concrete visual anchor: location, evidence object, character, or overlay.
- Use generic symbols only as secondary accents, not primary objects.
- Select assets based on the narration text and scene type.
- A mystery scene should usually show evidence, location, suspect/witness, or timeline information.

Test:

- Generate scenes only.
- Inspect `output/scenes/{projectId}/input-props.json`.
- Run the Phase 1 metric report.

Success criteria:

- Generic backgrounds are sharply reduced.
- `question_mark` and `exclamation` are rare.
- Most scenes include concrete evidence/location objects.
- Text overlays increase from the baseline.

## Phase 3: Reduce Narrator Dominance

Goal: stop the video from looking like one centered avatar over different backgrounds.

Add or enforce scene types:

- `evidence_closeup`
- `location_establishing`
- `timeline_card`
- `case_board`
- `suspect_or_witness`
- `narrator_bridge`
- `reveal_or_twist`

Rules:

- Narrator should be used mostly for bridge scenes.
- Evidence closeups should foreground objects, not the narrator.
- Location scenes should emphasize setting and atmosphere.
- Timeline cards should emphasize dates, places, and short facts.
- Suspect/witness scenes should use relevant character poses or silhouettes when possible.

Test:

- Render a short 30-45 second preview.
- Sample frames every 5-10 seconds.
- Check whether the central narrator appears too often.

Success criteria:

- The video alternates between narrator, evidence, locations, and text cards.
- The first minute does not feel visually repetitive.

## Phase 4: Improve Pacing And Motion

Goal: make the story feel alive without adding random movement.

Rules:

- Add a new visual beat every 8-12 seconds.
- Use push-in or slow zoom for evidence reveals.
- Use slow zoom or drift for suspense.
- Use shake only for shock moments.
- Use stronger transitions only for chapter changes, reveals, or major time jumps.
- Avoid long runs of static scenes.

Target camera distribution:

- Static scenes should be less than 30 percent of the video.
- Slow zoom, push-in, pan, or drift should carry most normal scenes.
- Shake/glitch/whip effects should be rare and motivated.

Test:

- Run metric report.
- Render a short preview.
- Sample frames and check visual progression.

Success criteria:

- Static scene count is reduced.
- Motion matches story moments.
- The video does not feel chaotic.

## Phase 5: Add Music And Sound Design

Goal: improve tension and retention through audio.

Needed assets:

- mysterious ambient loop
- low tension bed
- subtle riser
- low impact hit
- soft transition whoosh

Rules:

- Music must stay under narration.
- Use sidechain ducking where possible.
- Use silence or near-silence before important reveals.
- Do not add loud effects that distract from narration.

Test:

- Assemble final video only.
- Listen to first minute and at least one reveal section.
- Confirm narration remains clear.

Success criteria:

- The assembled video includes music when music assets exist.
- Music supports mystery tone without overpowering voice.

## Phase 6: Full Comparison Render

Goal: prove the pipeline improved.

Generate:

- old metrics
- new metrics
- sampled frames
- final video only

Do not:

- upload to YouTube
- generate thumbnail unless requested

Success criteria:

- Fewer generic scenes
- More real evidence objects
- More useful text overlays
- Less narrator repetition
- Stronger first 10 seconds
- Clear visual escalation across the video

## First Recommended Implementation Order

1. Implement Phase 1 metric report.
2. Implement Phase 2 storyboard asset selection.
3. Generate scenes only and compare metrics.
4. Render a short preview.
5. Only then continue to narrator reduction and motion pacing.

