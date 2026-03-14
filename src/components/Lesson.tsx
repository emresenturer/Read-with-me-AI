import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Bot, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Level } from '../data/levels';
import { LiveSession } from '../lib/gemini';

interface LessonProps {
  level: Level;
  onComplete: () => void;
  onExit: () => void;
}

export function Lesson({ level, onComplete, onExit }: LessonProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [teacherText, setTeacherText] = useState<string>('');
  const [displayWord, setDisplayWord] = useState<string | null>(null);
  const [displayOptions, setDisplayOptions] = useState<string[] | null>(null);
  
  const [micVolume, setMicVolume] = useState(0);
  const [isTeacherSpeaking, setIsTeacherSpeaking] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const sessionRef = useRef<LiveSession | null>(null);

  useEffect(() => {
    const initSession = async () => {
      setIsConnecting(true);
      setError(null);
      
      const session = new LiveSession({
        onConnect: () => {
          setIsConnected(true);
          setIsConnecting(false);
        },
        onDisconnect: () => {
          setIsConnected(false);
          setIsConnecting(false);
        },
        onError: (err) => {
          console.error(err);
          setError(err.message || 'Failed to connect to the teacher. Please try again.');
          setIsConnecting(false);
        },
        onTeacherSpeak: (text) => {
          setTeacherText(text);
        },
        onShowWord: (word) => {
          setDisplayWord(word);
          setDisplayOptions(null);
        },
        onShowOptions: (options) => {
          setDisplayOptions(options);
          setDisplayWord(null);
        },
        onCelebrate: () => {
          setIsCelebrating(true);
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#34d399', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa']
          });
          setTimeout(() => setIsCelebrating(false), 2000);
        },
        onEndLesson: () => {
          setTimeout(onComplete, 3000);
        }
      });
      
      const systemInstruction = `You are a cheerful, enthusiastic, and playful AI teacher for a 5-year-old child. 
The current lesson topic is: ${level.title} (${level.theme}).

HOW TO TEACH:
1. ALWAYS start by greeting the child warmly and introducing the topic.
2. You can ask the child to say something out loud (e.g., "Can you say COW?"). Listen to their response.
3. You can use the 'showOptions' tool to display buttons on the screen (e.g., ["Cow", "Pig", "Duck"]). Ask them to tap the correct one!
4. You can use the 'showWord' tool to display a big word on the screen for them to read.
5. When they get something right, ALWAYS use the 'celebrate' tool and praise them enthusiastically!
6. If they get it wrong, gently encourage them to try again.
7. Keep the lesson short (about 3-4 questions/interactions).
8. When the lesson is finished, use the 'endLesson' tool.

RULES:
- Keep your spoken responses VERY short, simple, and fun.
- Wait for the child to respond (either by speaking or tapping) before moving on.
- Start the lesson immediately by speaking!`;

      await session.connect(systemInstruction);
      sessionRef.current = session;
    };
    
    initSession();
    
    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
      }
    };
  }, [level, onComplete]);

  // Polling for volume and playing state
  useEffect(() => {
    let animationFrame: number;
    const updateAudioState = () => {
      if (sessionRef.current) {
        const vol = sessionRef.current.recorder?.getVolume() || 0;
        setMicVolume(vol);
        setIsTeacherSpeaking(sessionRef.current.streamer?.isPlaying() || false);
      }
      animationFrame = requestAnimationFrame(updateAudioState);
    };
    updateAudioState();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const handleOptionTap = (option: string) => {
    if (sessionRef.current) {
      sessionRef.current.sendText(`*The child tapped the option: "${option}"*`);
      setDisplayOptions(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-sky-100 to-indigo-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 z-10">
        <button onClick={onExit} className="p-3 bg-white/50 hover:bg-white text-gray-500 rounded-full shadow-sm backdrop-blur-sm transition-all">
          <X className="w-6 h-6" />
        </button>
        <div className="bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm font-bold text-sky-700 flex items-center">
          <span className="text-2xl mr-2">{level.icon}</span>
          {level.title}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-0">
        {error ? (
          <div className="text-center text-red-500 p-8 bg-white rounded-3xl shadow-xl max-w-md">
            <p className="font-black text-3xl mb-4">Oops!</p>
            <p className="text-lg mb-8">{error}</p>
            <button onClick={onExit} className="px-8 py-4 bg-red-500 text-white rounded-full font-bold text-xl hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1">
              Go Back
            </button>
          </div>
        ) : isConnecting ? (
          <div className="flex flex-col items-center text-sky-600">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-8 border-sky-200 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-sky-500 rounded-full border-t-transparent animate-spin"></div>
              <Bot className="absolute inset-0 m-auto w-10 h-10 text-sky-400 animate-pulse" />
            </div>
            <p className="font-black text-2xl animate-pulse">Waking up Teacher...</p>
          </div>
        ) : (
          <>
            {/* Teacher Avatar & Subtitles */}
            <div className="absolute top-4 w-full max-w-3xl px-4 flex flex-col items-center z-20">
              <motion.div 
                animate={{ 
                  y: isTeacherSpeaking ? [0, -15, 0] : (isCelebrating ? [0, -30, 0] : [0, -5, 0]),
                  scale: isTeacherSpeaking ? [1, 1.1, 1] : 1,
                  rotate: isCelebrating ? [0, -10, 10, -10, 0] : 0
                }}
                transition={{ 
                  repeat: isTeacherSpeaking || isCelebrating ? Infinity : Infinity, 
                  duration: isTeacherSpeaking ? 0.4 : (isCelebrating ? 0.5 : 3),
                  ease: "easeInOut"
                }}
                className={`p-5 rounded-full shadow-xl mb-6 border-4 relative
                  ${isCelebrating ? 'bg-yellow-400 border-yellow-200' : 'bg-white border-sky-200'}
                `}
              >
                {isCelebrating ? (
                  <Sparkles className="w-16 h-16 text-white" />
                ) : (
                  <Bot className={`w-16 h-16 ${isTeacherSpeaking ? 'text-sky-500' : 'text-sky-300'}`} />
                )}
                
                {/* Speaking indicator waves */}
                {isTeacherSpeaking && (
                  <motion.div 
                    className="absolute -inset-4 border-4 border-sky-300 rounded-full opacity-0"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}
              </motion.div>
              
              <AnimatePresence mode="wait">
                {teacherText && (
                  <motion.div
                    key={teacherText}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    className="bg-white/95 backdrop-blur-md px-8 py-5 rounded-3xl shadow-2xl text-center border-2 border-sky-100 max-w-2xl relative"
                  >
                    {/* Speech bubble pointer */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[20px] border-b-white"></div>
                    <p className="text-2xl font-bold text-gray-700 leading-snug">{teacherText}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Interactive Content Area */}
            <div className="mt-48 w-full flex flex-col items-center justify-center flex-1">
              
              {/* Display Word */}
              <AnimatePresence mode="wait">
                {displayWord && !displayOptions && (
                  <motion.div
                    key={displayWord}
                    initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 5 }}
                    className="text-[8rem] sm:text-[10rem] font-black tracking-tighter drop-shadow-2xl text-gray-800"
                  >
                    {displayWord}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Display Options */}
              <AnimatePresence mode="wait">
                {displayOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="grid grid-cols-2 gap-6 w-full max-w-2xl px-4"
                  >
                    {displayOptions.map((opt, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05, rotate: Math.random() * 4 - 2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOptionTap(opt)}
                        className="bg-white border-8 border-sky-200 text-sky-600 text-4xl sm:text-5xl font-black py-12 rounded-[2.5rem] shadow-xl hover:border-sky-400 hover:bg-sky-50 transition-colors flex items-center justify-center text-center leading-tight"
                      >
                        {opt}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Footer Mic Visualizer */}
      <div className="p-8 flex flex-col items-center justify-center relative z-10">
        {!isConnecting && !error && (
          <div className="relative flex items-center justify-center w-32 h-32">
            {/* Mic Visualizer Rings */}
            <motion.div 
              className="absolute inset-0 bg-emerald-200/50 rounded-full"
              animate={{ scale: 1 + (micVolume / 80) }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
            <motion.div 
              className="absolute inset-4 bg-emerald-300/60 rounded-full"
              animate={{ scale: 1 + (micVolume / 120) }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
            <div className={`
              relative z-10 p-6 rounded-full transition-colors duration-300 shadow-lg
              ${micVolume > 10 ? 'bg-emerald-500 text-white scale-110' : 'bg-emerald-400 text-white'}
            `}>
              <Mic className="w-10 h-10" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
