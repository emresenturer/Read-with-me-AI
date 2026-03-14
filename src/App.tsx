/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Map } from './components/Map';
import { Lesson } from './components/Lesson';
import { LEVELS } from './data/levels';

export default function App() {
  const [view, setView] = useState<'map' | 'lesson'>('map');
  const [unlockedLevelId, setUnlockedLevelId] = useState('1');
  const [currentLevelId, setCurrentLevelId] = useState<string | null>(null);

  const handleSelectLevel = (levelId: string) => {
    setCurrentLevelId(levelId);
    setView('lesson');
  };

  const handleLessonComplete = () => {
    // Unlock next level
    const currentIndex = LEVELS.findIndex(l => l.id === currentLevelId);
    if (currentIndex < LEVELS.length - 1) {
      const nextLevelId = LEVELS[currentIndex + 1].id;
      if (parseInt(nextLevelId) > parseInt(unlockedLevelId)) {
        setUnlockedLevelId(nextLevelId);
      }
    }
    setView('map');
    setCurrentLevelId(null);
  };

  const handleLessonExit = () => {
    setView('map');
    setCurrentLevelId(null);
  };

  const currentLevel = LEVELS.find(l => l.id === currentLevelId);

  return (
    <div className="font-sans text-gray-900 antialiased selection:bg-sky-200">
      {view === 'map' ? (
        <Map unlockedLevelId={unlockedLevelId} onSelectLevel={handleSelectLevel} />
      ) : currentLevel ? (
        <Lesson 
          level={currentLevel} 
          onComplete={handleLessonComplete} 
          onExit={handleLessonExit} 
        />
      ) : null}
    </div>
  );
}
