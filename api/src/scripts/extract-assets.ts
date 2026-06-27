/**
 * Asset Extraction Script (Smart/Content-Aware)
 * 
 * 1. SMART GRID DETECTION — finds actual white gutters between poses (not blind 1/4 cuts)
 * 2. NUMBER REMOVAL — detects small isolated blobs (1,2,3... labels) and removes them
 * 3. CONTENT-AWARE CROP — finds the character's actual body bounds, crops with padding
 * 4. WHITE BG REMOVAL — makes white pixels transparent with edge feathering
 * 5. Copies backgrounds as-is (no processing needed)
 * 
 * Usage: npx tsx src/scripts/extract-assets.ts
 * 
 * Expected input structure:
 *   asset_input/male/        → 6 sheets (marcus_sheet.png, etc.)
 *   asset_input/female/      → 6 sheets
 *   asset_input/kids/        → 4 sheets
 *   asset_input/animals/     → 8 sheets
 *   asset_input/backgrounds/ → 46 individual PNGs
 *   asset_input/objects/     → 30 individual PNGs
 * 
 * Output structure:
 *   assets/characters/{name}/{pose_name}.png  (transparent, cropped to content)
 *   assets/backgrounds/{filename}.png         (as-is)
 *   assets/objects/{filename}.png             (transparent)
 */

import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..', '..', '..');
const INPUT_DIR = path.join(ROOT, 'asset_input');
const OUTPUT_DIR = path.join(ROOT, 'remotion', 'public', 'assets');

const GRID_COLS = 4;
const GRID_ROWS = 4;

// White background removal threshold (0-255)
// Pixels with R, G, B all above this value → transparent
// Set high (248) to only catch pure-white backgrounds, never skin/eye highlights
const WHITE_THRESHOLD = 248;

// PNG compression: 0 = no compression (fastest, largest), 6 = balanced, 9 = max compression
// Quality is LOSSLESS regardless of this setting — only affects file size vs speed
const PNG_COMPRESSION = 6;

// ─── POSE NAMING MAPS ─────────────────────────────────────────────────────────

// Maps grid position (0-15) to filename for human characters
const HUMAN_POSE_NAMES: string[] = [
  'standing_neutral',
  'standing_happy',
  'standing_angry',
  'standing_scared',
  'standing_side_neutral',
  'sitting_sad',
  'sitting_neutral',
  'walking_neutral',
  'running_scared',
  'pointing_excited',
  'arms_crossed_angry',
  'crouching_scared',
  'looking_back_scared',
  'hands_up_surprised',
  'hugging_self_sad',
  'jumping_happy',
];

// Jake (older boy/teen) has different pose names for some slots
const JAKE_POSE_NAMES: string[] = [
  'standing_neutral',
  'standing_happy',
  'standing_angry',
  'standing_scared',
  'standing_side_neutral',
  'sitting_sad',
  'sitting_neutral',
  'walking_neutral',
  'running_scared',
  'pointing_angry',
  'arms_crossed_angry',
  'crouching_scared',
  'looking_back_scared',
  'hands_up_surprised',
  'leaning_determined',
  'standing_withdrawn',
];

// Zoe (older girl/teen) has different pose names
const ZOE_POSE_NAMES: string[] = [
  'standing_neutral',
  'standing_happy',
  'standing_angry',
  'standing_scared',
  'standing_side_neutral',
  'sitting_sad',
  'sitting_neutral',
  'walking_neutral',
  'running_scared',
  'pointing_angry',
  'arms_crossed_suspicious',
  'crouching_scared',
  'looking_back_scared',
  'hands_up_surprised',
  'leaning_determined',
  'standing_confident',
];

// Animal pose names (same for all animals)
const ANIMAL_POSE_NAMES: string[] = [
  'sitting_neutral',
  'sitting_happy',
  'standing_aggressive',
  'standing_scared',
  'side_neutral',
  'lying_sad',
  'lying_sleeping',
  'walking_neutral',
  'running_aggressive',
  'running_scared',
  'sitting_alert',
  'crouching_stalking',
  'looking_back',
  'barking_howling',
  'playful_happy',
  'defensive_stance',
];

// Character name → pose name override map
const POSE_OVERRIDES: Record<string, string[]> = {
  jake: JAKE_POSE_NAMES,
  zoe: ZOE_POSE_NAMES,
};

// ─── CHARACTER SHEET DEFINITIONS ──────────────────────────────────────────────

interface SheetConfig {
  inputFolder: string;
  filename: string;
  characterName: string;
  poseNames: string[];
}

const CHARACTER_SHEETS: SheetConfig[] = [
  // Males
  { inputFolder: 'male', filename: 'marcus_sheet.png', characterName: 'marcus', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'male', filename: 'victor_sheet.png', characterName: 'victor', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'male', filename: 'leo_sheet.png', characterName: 'leo', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'male', filename: 'frank_sheet.png', characterName: 'frank', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'male', filename: 'rex_sheet.png', characterName: 'rex_male', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'male', filename: 'dev_sheet.png', characterName: 'dev', poseNames: HUMAN_POSE_NAMES },
  // Females
  { inputFolder: 'female', filename: 'sara_sheet.png', characterName: 'sara', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'female', filename: 'diana_sheet.png', characterName: 'diana', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'female', filename: 'mia_sheet.png', characterName: 'mia', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'female', filename: 'ruth_sheet.png', characterName: 'ruth', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'female', filename: 'jade_sheet.png', characterName: 'jade', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'female', filename: 'priya_sheet.png', characterName: 'priya', poseNames: HUMAN_POSE_NAMES },
  // Kids
  { inputFolder: 'kids', filename: 'tommy_sheet.png', characterName: 'tommy', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'kids', filename: 'jake_sheet.png', characterName: 'jake', poseNames: JAKE_POSE_NAMES },
  { inputFolder: 'kids', filename: 'lily_sheet.png', characterName: 'lily', poseNames: HUMAN_POSE_NAMES },
  { inputFolder: 'kids', filename: 'zoe_sheet.png', characterName: 'zoe', poseNames: ZOE_POSE_NAMES },
  // Animals
  { inputFolder: 'animals', filename: 'buddy_sheet.png', characterName: 'buddy', poseNames: ANIMAL_POSE_NAMES },
  { inputFolder: 'animals', filename: 'shadow_sheet.png', characterName: 'shadow', poseNames: ANIMAL_POSE_NAMES },
  { inputFolder: 'animals', filename: 'rex_sheet.png', characterName: 'rex_dog', poseNames: ANIMAL_POSE_NAMES },
  { inputFolder: 'animals', filename: 'whiskers_sheet.png', characterName: 'whiskers', poseNames: ANIMAL_POSE_NAMES },
  { inputFolder: 'animals', filename: 'bear_sheet.png', characterName: 'bear', poseNames: ANIMAL_POSE_NAMES },
  { inputFolder: 'animals', filename: 'fang_sheet.png', characterName: 'fang', poseNames: ANIMAL_POSE_NAMES },
  { inputFolder: 'animals', filename: 'patches_sheet.png', characterName: 'patches', poseNames: ANIMAL_POSE_NAMES },
  { inputFolder: 'animals', filename: 'crow_sheet.png', characterName: 'crow', poseNames: ANIMAL_POSE_NAMES },
];

// ─── CORE FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Check if a pixel at given index is "white-ish" (background)
 */
function isWhitePixel(pixels: Uint8Array, idx: number): boolean {
  return (
    pixels[idx] >= WHITE_THRESHOLD &&
    pixels[idx + 1] >= WHITE_THRESHOLD &&
    pixels[idx + 2] >= WHITE_THRESHOLD
  );
}

/**
 * Scan image for white "gutters" — finds the best split lines for grid
 * Returns array of split positions (3 for a 4-cell split)
 */
function findGridLines(
  pixels: Uint8Array,
  width: number,
  height: number,
  direction: 'horizontal' | 'vertical'
): number[] {
  const size = direction === 'horizontal' ? height : width;
  const perpSize = direction === 'horizontal' ? width : height;
  const numSplits = 3; // 4x4 grid needs 3 split lines

  // Score each row/column by percentage of white pixels
  const whiteScores: number[] = new Array(size).fill(0);

  for (let i = 0; i < size; i++) {
    let whiteCount = 0;
    for (let j = 0; j < perpSize; j++) {
      let px: number;
      if (direction === 'horizontal') {
        px = (i * width + j) * 4;
      } else {
        px = (j * width + i) * 4;
      }
      if (isWhitePixel(pixels, px)) {
        whiteCount++;
      }
    }
    whiteScores[i] = whiteCount / perpSize;
  }

  // Find the best split positions:
  // Divide into approximate thirds, then search for whitest band near each expected split
  const splits: number[] = [];
  const searchRadius = Math.floor(size * 0.08); // search ±8% around expected position

  for (let s = 1; s <= numSplits; s++) {
    const expectedPos = Math.floor((s / 4) * size);
    let bestPos = expectedPos;
    let bestScore = -1;

    // Find the whitest band (average of a few rows/cols) near expected position
    const bandSize = Math.max(3, Math.floor(size * 0.005));
    for (let pos = expectedPos - searchRadius; pos <= expectedPos + searchRadius; pos++) {
      if (pos < 0 || pos >= size) continue;

      let bandScore = 0;
      let bandCount = 0;
      for (let b = -Math.floor(bandSize / 2); b <= Math.floor(bandSize / 2); b++) {
        const p = pos + b;
        if (p >= 0 && p < size) {
          bandScore += whiteScores[p];
          bandCount++;
        }
      }
      bandScore /= bandCount;

      if (bandScore > bestScore) {
        bestScore = bandScore;
        bestPos = pos;
      }
    }

    splits.push(bestPos);
  }

  return splits;
}

/**
 * Remove white background from an image buffer → transparent PNG
 * Uses EDGE FLOOD-FILL: only removes white pixels connected to the image border.
 * This preserves interior white details (eyes, teeth, highlights, accessories).
 */
async function removeWhiteBackground(inputBuffer: Buffer): Promise<Buffer> {
  const image = sharp(inputBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data.buffer, data.byteOffset, data.length);
  const { width, height, channels } = info;

  if (channels !== 4) {
    throw new Error(`Expected 4 channels (RGBA), got ${channels}`);
  }

  // Flood-fill from ALL edge pixels to find background-connected white regions
  const isBackground = new Uint8Array(width * height); // 1 = background, 0 = content
  const stack: number[] = [];

  // Seed from all 4 edges
  for (let x = 0; x < width; x++) {
    seedIfWhite(x, 0, width, pixels, isBackground, stack);
    seedIfWhite(x, height - 1, width, pixels, isBackground, stack);
  }
  for (let y = 0; y < height; y++) {
    seedIfWhite(0, y, width, pixels, isBackground, stack);
    seedIfWhite(width - 1, y, width, pixels, isBackground, stack);
  }

  // Flood fill — expand from seeds to all connected white pixels
  while (stack.length > 0) {
    const idx = stack.pop()!;
    const x = idx % width;
    const y = Math.floor(idx / width);

    // Check 4 neighbors
    if (x > 0) seedIfWhite(x - 1, y, width, pixels, isBackground, stack);
    if (x < width - 1) seedIfWhite(x + 1, y, width, pixels, isBackground, stack);
    if (y > 0) seedIfWhite(x, y - 1, width, pixels, isBackground, stack);
    if (y < height - 1) seedIfWhite(x, y + 1, width, pixels, isBackground, stack);
  }

  // Make background pixels transparent
  for (let i = 0; i < width * height; i++) {
    if (isBackground[i]) {
      pixels[i * 4 + 3] = 0;
    }
  }

  // DILATE background by 3 pixels: eat into the white fringe that the flood-fill
  // missed (anti-aliased pixels between 220-247 that look white but weren't caught)
  for (let pass = 0; pass < 3; pass++) {
    const prevBackground = new Uint8Array(isBackground);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (prevBackground[idx]) continue; // already background

        // Check if this pixel borders a background pixel (8-connected for better coverage)
        const touchesBg =
          prevBackground[idx - 1] ||
          prevBackground[idx + 1] ||
          prevBackground[idx - width] ||
          prevBackground[idx + width] ||
          prevBackground[idx - width - 1] ||
          prevBackground[idx - width + 1] ||
          prevBackground[idx + width - 1] ||
          prevBackground[idx + width + 1];

        if (touchesBg) {
          const r = pixels[idx * 4];
          const g = pixels[idx * 4 + 1];
          const b = pixels[idx * 4 + 2];
          const brightness = (r + g + b) / 3;
          const saturation = Math.max(r, g, b) - Math.min(r, g, b);

          // Progressively stricter threshold per pass:
          // Pass 0: eat obvious fringe (>230, sat<35)
          // Pass 1: eat lighter fringe (>235, sat<30)
          // Pass 2: eat subtle fringe (>240, sat<25)
          const brightnessThreshold = 230 + pass * 5;
          const satThreshold = 35 - pass * 5;

          if (brightness > brightnessThreshold && saturation < satThreshold) {
            isBackground[idx] = 1;
            pixels[idx * 4 + 3] = 0;
          }
        }
      }
    }
  }

  // Final edge pass: any remaining near-white pixel touching transparency → remove
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (pixels[idx * 4 + 3] === 0) continue; // already transparent

      // 8-connected check for neighboring transparent pixels
      const hasTransparentNeighbor =
        pixels[(idx - 1) * 4 + 3] === 0 ||
        pixels[(idx + 1) * 4 + 3] === 0 ||
        pixels[(idx - width) * 4 + 3] === 0 ||
        pixels[(idx + width) * 4 + 3] === 0;

      if (hasTransparentNeighbor) {
        const r = pixels[idx * 4];
        const g = pixels[idx * 4 + 1];
        const b = pixels[idx * 4 + 2];
        const brightness = (r + g + b) / 3;
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);

        // Pure white fringe → fully transparent
        if (brightness > 235 && saturation < 20) {
          pixels[idx * 4 + 3] = 0;
        }
      }
    }
  }

  return sharp(Buffer.from(pixels.buffer), {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: PNG_COMPRESSION, effort: 10 })
    .toBuffer();
}

/** Helper: mark a pixel as background seed if it's white-ish */
function seedIfWhite(
  x: number,
  y: number,
  width: number,
  pixels: Uint8Array,
  isBackground: Uint8Array,
  stack: number[]
): void {
  const idx = y * width + x;
  if (isBackground[idx]) return; // already visited
  const px = idx * 4;
  if (
    pixels[px] >= WHITE_THRESHOLD &&
    pixels[px + 1] >= WHITE_THRESHOLD &&
    pixels[px + 2] >= WHITE_THRESHOLD
  ) {
    isBackground[idx] = 1;
    stack.push(idx);
  }
}

/**
 * After background removal, find and remove small isolated opaque blobs
 * (number labels like "1", "2", "3" that were drawn on the white background).
 * These are now tiny opaque islands floating in transparent space.
 */
async function removeFloatingLabels(inputBuffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data.buffer, data.byteOffset, data.length);
  const { width, height } = info;
  const totalPixels = width * height;

  // Find all opaque connected regions
  const visited = new Uint8Array(totalPixels);
  const blobMap = new Int32Array(totalPixels).fill(-1);
  const blobs: { size: number; id: number }[] = [];

  let blobId = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      if (pixels[idx * 4 + 3] === 0) continue; // transparent, skip

      // Flood fill this opaque region
      const stack: number[] = [idx];
      let size = 0;

      while (stack.length > 0) {
        const cur = stack.pop()!;
        if (visited[cur]) continue;
        if (pixels[cur * 4 + 3] === 0) continue;

        visited[cur] = 1;
        blobMap[cur] = blobId;
        size++;

        const cx = cur % width;
        const cy = Math.floor(cur / width);
        if (cx > 0) stack.push(cur - 1);
        if (cx < width - 1) stack.push(cur + 1);
        if (cy > 0) stack.push(cur - width);
        if (cy < height - 1) stack.push(cur + width);
      }

      blobs.push({ size, id: blobId });
      blobId++;
    }
  }

  // Find the largest blob (the character)
  let maxSize = 0;
  for (const blob of blobs) {
    if (blob.size > maxSize) maxSize = blob.size;
  }

  // Remove any blob smaller than 0.5% of the character — these are number labels
  const minKeepSize = maxSize * 0.005;
  for (const blob of blobs) {
    if (blob.size < minKeepSize) {
      for (let i = 0; i < totalPixels; i++) {
        if (blobMap[i] === blob.id) {
          pixels[i * 4 + 3] = 0; // make transparent
        }
      }
    }
  }

  return sharp(Buffer.from(pixels.buffer), {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: PNG_COMPRESSION, effort: 10 })
    .toBuffer();
}

/**
 * Smart grid extraction: detects actual cell boundaries and extracts cells.
 * NO content-aware cropping — the grid cell IS the character's space.
 * White space becomes transparent later, so no need to crop tight.
 */
async function extractGridCells(sheetBuffer: Buffer): Promise<Buffer[]> {
  const image = sharp(sheetBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data.buffer, data.byteOffset, data.length);
  const { width, height } = info;

  // Step 1: Find grid lines (white gutters between cells)
  const hSplits = findGridLines(pixels, width, height, 'horizontal');
  const vSplits = findGridLines(pixels, width, height, 'vertical');

  // Build cell boundaries: [startX, endX] for each column, [startY, endY] for each row
  const colBounds = [
    [0, vSplits[0]],
    [vSplits[0], vSplits[1]],
    [vSplits[1], vSplits[2]],
    [vSplits[2], width],
  ];
  const rowBounds = [
    [0, hSplits[0]],
    [hSplits[0], hSplits[1]],
    [hSplits[1], hSplits[2]],
    [hSplits[2], height],
  ];

  const cells: Buffer[] = [];
  // Small inset to skip the gutter pixels themselves
  const GUTTER_SKIP = Math.floor(Math.min(width, height) * 0.005);

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      let left = colBounds[col][0] + GUTTER_SKIP;
      let top = rowBounds[row][0] + GUTTER_SKIP;
      let cellWidth = colBounds[col][1] - colBounds[col][0] - GUTTER_SKIP * 2;
      let cellHeight = rowBounds[row][1] - rowBounds[row][0] - GUTTER_SKIP * 2;

      // Clamp to image bounds
      left = Math.max(0, left);
      top = Math.max(0, top);
      cellWidth = Math.min(cellWidth, width - left);
      cellHeight = Math.min(cellHeight, height - top);

      if (cellWidth <= 0 || cellHeight <= 0) {
        // Fallback: equal division
        left = col * Math.floor(width / GRID_COLS);
        top = row * Math.floor(height / GRID_ROWS);
        cellWidth = Math.floor(width / GRID_COLS);
        cellHeight = Math.floor(height / GRID_ROWS);
      }

      // Extract the cell — NO resizing, NO cropping, preserves original pixel data
      const cellBuffer = await sharp(sheetBuffer)
        .extract({ left, top, width: cellWidth, height: cellHeight })
        .png({ compressionLevel: 0 })
        .toBuffer();

      cells.push(cellBuffer);
    }
  }

  return cells;
}

/**
 * Process a single character sheet: smart grid detect + slice + remove numbers + remove bg
 */
async function processCharacterSheet(config: SheetConfig): Promise<void> {
  const inputPath = path.join(INPUT_DIR, config.inputFolder, config.filename);

  if (!fs.existsSync(inputPath)) {
    console.warn(`  ⚠ SKIP: ${inputPath} not found`);
    return;
  }

  const outputFolder = path.join(OUTPUT_DIR, 'characters', config.characterName);
  fs.mkdirSync(outputFolder, { recursive: true });

  const sheetBuffer = fs.readFileSync(inputPath);
  const metadata = await sharp(sheetBuffer).metadata();
  console.log(`  Processing ${config.filename} (${metadata.width}x${metadata.height})...`);

  // Smart extraction: detect grid lines
  const cells = await extractGridCells(sheetBuffer);

  let extracted = 0;
  for (let i = 0; i < cells.length && i < config.poseNames.length; i++) {
    const poseName = config.poseNames[i];
    if (!poseName) continue;

    // Remove white background → transparent
    let transparentBuffer = await removeWhiteBackground(cells[i]);

    // Remove floating number labels (small isolated opaque blobs in corners)
    transparentBuffer = await removeFloatingLabels(transparentBuffer);

    // Trim: remove fully-transparent border pixels so the PNG is tight to content
    transparentBuffer = await sharp(transparentBuffer)
      .trim()
      .png({ compressionLevel: PNG_COMPRESSION, effort: 10 })
      .toBuffer();

    const outputPath = path.join(outputFolder, `${poseName}.png`);
    fs.writeFileSync(outputPath, transparentBuffer);
    extracted++;
  }

  console.log(`    ✓ ${extracted} poses extracted → ${outputFolder}`);
}

/**
 * Process objects: remove white background
 */
async function processObjects(): Promise<void> {
  const inputFolder = path.join(INPUT_DIR, 'objects');
  const outputFolder = path.join(OUTPUT_DIR, 'objects');

  if (!fs.existsSync(inputFolder)) {
    console.warn('  ⚠ SKIP: objects folder not found');
    return;
  }

  fs.mkdirSync(outputFolder, { recursive: true });

  const files = fs.readdirSync(inputFolder).filter((f: string) => f.endsWith('.png'));
  console.log(`  Processing ${files.length} objects...`);

  let processed = 0;
  for (const file of files) {
    const inputPath = path.join(inputFolder, file);
    const inputBuffer = fs.readFileSync(inputPath);
    const transparentBuffer = await removeWhiteBackground(inputBuffer);
    const outputPath = path.join(outputFolder, file);
    fs.writeFileSync(outputPath, transparentBuffer);
    processed++;
  }

  console.log(`    ✓ ${processed} objects processed → ${outputFolder}`);
}

/**
 * Process backgrounds: copy as-is (no bg removal needed)
 */
async function processBackgrounds(): Promise<void> {
  const inputFolder = path.join(INPUT_DIR, 'backgrounds');
  const outputFolder = path.join(OUTPUT_DIR, 'backgrounds');

  if (!fs.existsSync(inputFolder)) {
    console.warn('  ⚠ SKIP: backgrounds folder not found');
    return;
  }

  fs.mkdirSync(outputFolder, { recursive: true });

  const files = fs.readdirSync(inputFolder).filter((f: string) => f.endsWith('.png'));
  console.log(`  Copying ${files.length} backgrounds...`);

  let copied = 0;
  for (const file of files) {
    const inputPath = path.join(inputFolder, file);
    const outputPath = path.join(outputFolder, file);
    fs.copyFileSync(inputPath, outputPath);
    copied++;
  }

  console.log(`    ✓ ${copied} backgrounds copied → ${outputFolder}`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       ASSET EXTRACTION PIPELINE             ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║ Input:  ${INPUT_DIR}`);
  console.log(`║ Output: ${OUTPUT_DIR}`);
  console.log('╚══════════════════════════════════════════════╝\n');

  // Verify input directory exists
  if (!fs.existsSync(INPUT_DIR)) {
    console.error(`ERROR: Input directory not found: ${INPUT_DIR}`);
    console.error('Place your generated assets in the asset_input/ folder first.');
    process.exit(1);
  }

  const startTime = Date.now();

  // Step 1: Character Sheets (slice + remove bg)
  console.log('\n[1/3] CHARACTER SHEETS (slice 4x4 grid + remove white bg)\n');
  for (const sheet of CHARACTER_SHEETS) {
    await processCharacterSheet(sheet);
  }

  // Step 2: Objects (remove bg only)
  console.log('\n[2/3] OBJECTS (remove white background)\n');
  await processObjects();

  // Step 3: Backgrounds (copy as-is)
  console.log('\n[3/3] BACKGROUNDS (copy as-is)\n');
  await processBackgrounds();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n══════════════════════════════════════════════`);
  console.log(`✓ DONE in ${elapsed}s`);
  console.log(`  Output: ${OUTPUT_DIR}/`);
  console.log(`    characters/ → ${CHARACTER_SHEETS.length} characters × 16 poses`);
  console.log(`    objects/    → transparent PNGs`);
  console.log(`    backgrounds/→ ready to use`);
  console.log(`══════════════════════════════════════════════\n`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
