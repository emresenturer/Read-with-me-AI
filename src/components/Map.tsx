import { motion } from 'motion/react';
import { LEVELS } from '../data/levels';
import { Lock, Play } from 'lucide-react';

interface MapProps {
  unlockedLevelId: string;
  onSelectLevel: (levelId: string) => void;
}

export function Map({ unlockedLevelId, onSelectLevel }: MapProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-200 to-green-100 p-6 overflow-y-auto">
      <div className="max-w-md w-full flex flex-col items-center space-y-16 py-16">
        <motion.h1 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-5xl font-black text-sky-800 mb-8 text-center drop-shadow-lg"
        >
          Learning Adventure!
        </motion.h1>
        
        {LEVELS.map((level, index) => {
          const isUnlocked = parseInt(level.id) <= parseInt(unlockedLevelId);
          const isCurrent = level.id === unlockedLevelId;
          
          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, type: 'spring', bounce: 0.4 }}
              className="relative w-full flex justify-center"
            >
              {/* Path line connecting nodes */}
              {index < LEVELS.length - 1 && (
                <div className="absolute top-24 w-6 h-32 bg-white/50 -z-10 rounded-full shadow-inner" />
              )}
              
              <button
                onClick={() => isUnlocked && onSelectLevel(level.id)}
                disabled={!isUnlocked}
                className={`
                  relative group flex flex-col items-center justify-center
                  w-40 h-40 rounded-full border-b-[12px] transition-all duration-300 shadow-xl
                  ${isUnlocked ? level.color + ' border-black/20 hover:-translate-y-2 active:translate-y-3 active:border-b-0 hover:shadow-2xl' : 'bg-gray-300 border-gray-400'}
                `}
              >
                {isUnlocked ? (
                  <div className="flex flex-col items-center">
                    <span className="text-5xl mb-2">{level.icon}</span>
                    <Play className="w-8 h-8 text-white fill-white opacity-80" />
                  </div>
                ) : (
                  <Lock className="w-12 h-12 text-gray-500" />
                )}
                
                {isCurrent && (
                  <motion.div
                    animate={{ y: [0, -15, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -top-8 bg-white px-6 py-2 rounded-full shadow-xl text-lg font-black text-sky-600 border-4 border-sky-100"
                  >
                    Play!
                  </motion.div>
                )}
              </button>
              
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-3xl shadow-lg border-2 border-white/50">
                <p className="font-black text-xl text-gray-700">{level.title}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
