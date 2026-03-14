export interface Level {
  id: string;
  title: string;
  theme: string;
  color: string;
  icon: string;
}

export const LEVELS: Level[] = [
  { id: '1', title: 'Animals', theme: 'Farm animals (cow, pig, duck, horse). Ask them to identify sounds or names.', color: 'bg-emerald-400', icon: '🐮' },
  { id: '2', title: 'Colors', theme: 'Basic colors (red, blue, yellow, green). Ask them to tap the right color word.', color: 'bg-blue-400', icon: '🎨' },
  { id: '3', title: 'Numbers', theme: 'Counting from 1 to 5. Show numbers and ask them to tap the right one.', color: 'bg-purple-400', icon: '1️⃣' },
  { id: '4', title: 'Fruits', theme: 'Common fruits (apple, banana, orange).', color: 'bg-red-400', icon: '🍎' },
  { id: '5', title: 'Emotions', theme: 'Happy, sad, angry, surprised.', color: 'bg-amber-400', icon: '😊' },
];
