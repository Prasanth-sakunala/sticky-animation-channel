import type { CharacterExpression, CharacterPose } from './types';

export type SceneSetting =
  | 'hospital'
  | 'forest'
  | 'mountain'
  | 'city'
  | 'ocean'
  | 'desert'
  | 'laboratory'
  | 'cave'
  | 'bedroom'
  | 'interior'
  | 'night'
  | 'generic';

export type SubjectRole = 'child' | 'doctor' | 'investigator' | 'victim' | 'group' | 'narrator';

export interface SceneAnalysisInput {
  narrationText: string;
  background: string;
  objects: string[];
  mood: string;
  textOverlay?: string | null;
  pose: CharacterPose;
  expression: CharacterExpression;
}

export interface SceneAnalysisResult {
  setting: SceneSetting;
  subject: SubjectRole;
  palette: {
    sky: string;
    mid: string;
    ground: string;
    accent: string;
    glow: string;
  };
  character: {
    side: 'left' | 'center' | 'right';
    scale: number;
    role: SubjectRole;
  };
  extras: Array<'bed' | 'window' | 'monitor' | 'trees' | 'mountains' | 'cityline' | 'waves' | 'dunes' | 'lab' | 'rocks' | 'house' | 'moon'>;
}

const SETTING_KEYWORDS: Array<{ setting: SceneSetting; keywords: string[] }> = [
  { setting: 'hospital', keywords: ['hospital', 'ward', 'doctor', 'nurse', 'clinic', 'patient', 'bed'] },
  { setting: 'laboratory', keywords: ['lab', 'laboratory', 'experiment', 'scientist', 'chemical'] },
  { setting: 'forest', keywords: ['forest', 'woods', 'tree', 'jungle', 'trail'] },
  { setting: 'mountain', keywords: ['mountain', 'snow', 'peak', 'cliff', 'summit'] },
  { setting: 'city', keywords: ['city', 'street', 'apartment', 'building', 'traffic', 'urban'] },
  { setting: 'ocean', keywords: ['ocean', 'sea', 'coast', 'boat', 'island', 'shore'] },
  { setting: 'desert', keywords: ['desert', 'sand', 'dune'] },
  { setting: 'cave', keywords: ['cave', 'tunnel', 'mine'] },
  { setting: 'bedroom', keywords: ['bedroom', 'home', 'house', 'childhood', 'room'] },
  { setting: 'night', keywords: ['night', 'midnight', 'dark', 'moon'] },
];

const SUBJECT_KEYWORDS: Array<{ subject: SubjectRole; keywords: string[] }> = [
  { subject: 'child', keywords: ['child', 'kid', 'boy', 'girl', 'baby', 'teen'] },
  { subject: 'doctor', keywords: ['doctor', 'nurse', 'surgeon', 'medic'] },
  { subject: 'investigator', keywords: ['detective', 'police', 'investigator', 'officer', 'reporter', 'researcher'] },
  { subject: 'victim', keywords: ['victim', 'patient', 'woman', 'man', 'person', 'body'] },
  { subject: 'group', keywords: ['crowd', 'family', 'villagers', 'people', 'group', 'team'] },
];

const PALETTES: Record<SceneSetting, SceneAnalysisResult['palette']> = {
  hospital: { sky: '#d9ecf7', mid: '#bfd7e6', ground: '#eef5f9', accent: '#4da3c9', glow: 'rgba(120, 200, 255, 0.35)' },
  forest: { sky: '#20352b', mid: '#355846', ground: '#18271f', accent: '#8dbb6f', glow: 'rgba(146, 201, 128, 0.25)' },
  mountain: { sky: '#99b7d8', mid: '#5f7590', ground: '#dfe7f2', accent: '#d7f0ff', glow: 'rgba(255, 255, 255, 0.28)' },
  city: { sky: '#18253a', mid: '#324761', ground: '#11161d', accent: '#ffcf68', glow: 'rgba(255, 207, 104, 0.25)' },
  ocean: { sky: '#5da6d8', mid: '#2274a5', ground: '#0f4261', accent: '#d9f3ff', glow: 'rgba(217, 243, 255, 0.24)' },
  desert: { sky: '#dba96a', mid: '#c8833b', ground: '#7a4a1c', accent: '#ffe2a8', glow: 'rgba(255, 218, 164, 0.22)' },
  laboratory: { sky: '#a5bdd7', mid: '#7089a9', ground: '#324054', accent: '#89f0ff', glow: 'rgba(137, 240, 255, 0.22)' },
  cave: { sky: '#32343c', mid: '#1f222b', ground: '#111317', accent: '#d8c59a', glow: 'rgba(255, 220, 165, 0.14)' },
  bedroom: { sky: '#aa9cc0', mid: '#7f7396', ground: '#473e57', accent: '#ffd6b4', glow: 'rgba(255, 214, 180, 0.2)' },
  interior: { sky: '#b9b3ad', mid: '#7d7269', ground: '#413830', accent: '#f1d2a9', glow: 'rgba(241, 210, 169, 0.2)' },
  night: { sky: '#09111f', mid: '#17273f', ground: '#070a0f', accent: '#c3d3ff', glow: 'rgba(195, 211, 255, 0.18)' },
  generic: { sky: '#44526d', mid: '#2b3346', ground: '#1a1d2b', accent: '#f0c77a', glow: 'rgba(240, 199, 122, 0.18)' },
};

const BACKGROUND_TO_SETTING: Record<string, SceneSetting> = {
  snowy_mountain: 'mountain',
  dark_forest: 'forest',
  city_night: 'city',
  ocean: 'ocean',
  desert: 'desert',
  space: 'night',
  laboratory: 'laboratory',
  old_room: 'interior',
  cave: 'cave',
  generic_dark: 'generic',
  generic_light: 'interior',
};

export const analyzeScene = (input: SceneAnalysisInput): SceneAnalysisResult => {
  const searchableText = [
    input.narrationText,
    input.textOverlay || '',
    input.background,
    input.mood,
    input.objects.join(' '),
  ].join(' ').toLowerCase();

  const keywordSetting = SETTING_KEYWORDS.find(({ keywords }) => keywords.some((keyword) => searchableText.includes(keyword)))?.setting;
  const setting = keywordSetting || BACKGROUND_TO_SETTING[input.background] || 'generic';

  const subject = SUBJECT_KEYWORDS.find(({ keywords }) => keywords.some((keyword) => searchableText.includes(keyword)))?.subject || 'narrator';

  const side = input.pose === 'pointing_left' ? 'right' : input.pose === 'pointing_right' ? 'left' : subject === 'group' ? 'center' : setting === 'hospital' ? 'left' : 'right';
  const scale = subject === 'child' ? 0.72 : subject === 'group' ? 0.6 : setting === 'hospital' ? 0.84 : 0.92;

  return {
    setting,
    subject,
    palette: PALETTES[setting],
    character: {
      side,
      scale,
      role: subject,
    },
    extras: extrasForSetting(setting, searchableText),
  };
};

const extrasForSetting = (setting: SceneSetting, searchableText: string): SceneAnalysisResult['extras'] => {
  const extras = new Set<SceneAnalysisResult['extras'][number]>();

  if (setting === 'hospital') {
    extras.add('bed');
    extras.add('monitor');
    extras.add('window');
  }
  if (setting === 'forest') extras.add('trees');
  if (setting === 'mountain') extras.add('mountains');
  if (setting === 'city') extras.add('cityline');
  if (setting === 'ocean') extras.add('waves');
  if (setting === 'desert') extras.add('dunes');
  if (setting === 'laboratory') extras.add('lab');
  if (setting === 'cave') extras.add('rocks');
  if (setting === 'bedroom' || setting === 'interior') extras.add('house');
  if (setting === 'night' || searchableText.includes('moon')) extras.add('moon');

  return [...extras];
};