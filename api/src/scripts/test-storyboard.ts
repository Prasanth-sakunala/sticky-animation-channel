import dotenv from 'dotenv';
import path from 'node:path';

// Load env variables (required for GEMINI_API_KEY)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runTest() {
  console.log('Starting Storyboard Engine Test...\n');
  const { generateStoryboard } = await import('../services/storyboard-engine.js');

  const testScript = `
    Emily, a curious nineteen-year-old girl, walked into the cozy interior of the antique shop. 
    Behind the counter, an elderly man named Mr. Miller smiled warmly. 
    He reached down and handed her an intricate wooden music box that had been sitting on the counter. 
    Just then, Detective Miller entered, holding a vintage newspaper with a shocking headline. 
    A mysterious stranger watched them from the shadow of the door. 
    Emily took the music box and ran out into the deep woods, passing a carved bird on a fence. 
    She finally stopped by the rushing river, gasping for breath, clutching the wooden music box tightly.
  `;

  try {
    const storyboard = await generateStoryboard(testScript, 'The Secret Music Box', 'mystery');
    
    console.log('=== ACT STRUCTURE ===');
    console.log(JSON.stringify(storyboard.act_structure, null, 2));
    
    console.log('\n=== ENEMY / CHARACTER MAP ===');
    console.log(storyboard.scenes[0] && (storyboard.scenes as any).character_map);
    
    console.log('\n=== SCENES BREAKDOWN ===');
    storyboard.scenes.forEach((scene: any) => {
      console.log(`Scene ${scene.scene_id}:`);
      console.log(`  Narration: "${scene.narration_text.trim()}"`);
      console.log(`  Character: ${scene.character_name} (${scene.character?.pose || 'none'}, ${scene.character?.expression || 'none'})`);
      console.log(`  Background: ${scene.background_asset}`);
      console.log(`  Objects: [${scene.scene_objects.join(', ')}]`);
      console.log(`  Camera: ${scene.camera?.movement} (${scene.camera?.intensity})`);
      console.log(`  Transition: ${scene.transition}`);
      console.log(`  Mood: ${scene.mood}`);
      console.log('-------------------------------------------');
    });

  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();
