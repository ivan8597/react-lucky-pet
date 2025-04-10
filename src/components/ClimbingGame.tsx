import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import gameMusic from "./audio/Rain.mp3";
import hitSound from "./audio/hit.mp3";
import victorySound from "./audio/p9.mp3";
import "../styles/Birds.css";
import "../styles/Climber.css";
import "../styles/Rocks.css";
import "../styles/Sun.css";
import "../styles/Obstacles.css";
import "../styles/StartPage.css";
import "../styles/FramerAnimations.css";
import { PauseContext } from "../App.tsx";
import { motion, AnimatePresence, Variants } from "framer-motion";

// Варианты анимаций для разных элементов
const climberVariants: Variants = {
  idle: {
    y: [0, -5, 0],
    transition: {
      y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
    }
  },
  moving: {
    x: [0, 5, 0, -5, 0],
    transition: {
      x: { repeat: Infinity, duration: 0.5, ease: "linear" }
    }
  },
  victory: {
    y: [0, -20, 0],
    scale: [1, 1.1, 1],
    transition: {
      repeat: Infinity,
      duration: 0.7
    }
  }
};

const rockVariants: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
};

const snowflakeVariants: Variants = {
  animate: (i: number) => ({
    y: [0, window.innerHeight],
    x: [0, Math.sin(i) * 50],
    opacity: [0.7, 1, 0.7, 1, 0.7, 0],
    rotate: [0, 360],
    transition: {
      y: { duration: 10 + Math.random() * 5, repeat: Infinity, ease: "linear" },
      x: { duration: 5 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" },
      opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" },
      rotate: { duration: 10, repeat: Infinity, ease: "linear" }
    }
  })
};

const cloudVariants: Variants = {
  initial: { opacity: 0.8 },
  animate: { opacity: 0.8 }
};

const bearVariants: Variants = {
  idle: {},
  happy: {
    y: [0, -15, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

enum Stage {
  START = "start",
  GAME = "game",
  FINISH = "finish",
}

interface ClimbingGameProps {
  onComplete: (finalScore: number) => void;
}

const ClimbingGame: React.FC<ClimbingGameProps> = ({ onComplete }) => {
  const { isPaused } = useContext(PauseContext);
  const lineStep: number = 129;

  const [stage, setStage] = useState<Stage>(Stage.START);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [fallingRocks, setFallingRocks] = useState<{ id: string; lineIndex: number }[]>([]);
  const [score, setScore] = useState<number>(0);
  const [topValues, setTopValues] = useState<number[]>([100, 0, 200, 0, 0]);
  const [IsThirdLineVisible, setIsThirdLineVisible] = useState<boolean>(false); // Исправлено имя
  const [isSecondLineVisible, setIsSecondLineVisible] = useState<boolean>(false);
  const [isFirstLineVisible, setIsFirstLineVisible] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [time, setTime] = useState<number>(49);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [savedScores, setSavedScores] = useState<number>(0);
  const [isFinalScore, setIsFinalScore] = useState<number>(0);
  const [rockSizes, setRockSizes] = useState<{ [id: string]: string }>({});
  const [bearJumping, setBearJumping] = useState<boolean>(false);

  const audioRef = React.createRef<HTMLAudioElement>();
  const hitAudioRef = React.createRef<HTMLAudioElement>();
  const victoryAudioRef = React.createRef<HTMLAudioElement>();

  const playerPosition = useMemo(() => {
    return {
      bottom: (currentLineIndex + 1) * lineStep,
      left: 400 + currentLineIndex * 190,
    };
  }, [currentLineIndex]);

  const startGame = useCallback(() => {
    setStage(Stage.GAME);
    setCurrentLineIndex(0);
    setFallingRocks([]);
    setScore(0);
    setTopValues([100, 0, 200, 0, 0]);
    setIsThirdLineVisible(false);
    setIsSecondLineVisible(false);
    setIsFirstLineVisible(false);
    setLives(3);
    setTime(49);
    setIsFinalScore(0);
    setRockSizes({});
  }, []);

  const handleStartClick = () => {
    startGame();
    audioRef.current?.play().catch(() => {
      console.log('Музыка будет воспроизведена при следующем взаимодействии');
    });
  };

  const resetGame = useCallback(() => {
    setStage(Stage.START);
    setCurrentLineIndex(0);
    setFallingRocks([]);
    setScore(0);
    setTopValues([100, 0, 200, 0, 0]);
    setIsThirdLineVisible(false);
    setIsSecondLineVisible(false);
    setIsFirstLineVisible(false);
    setLives(3);
    setTime(49);
    setIsFinalScore(0);
    setRockSizes({});
  }, []);

  useEffect(() => {
    if (stage === Stage.GAME) {
      requestAnimationFrame(() => {
        const wrapper = document.querySelector('.wrapper') as HTMLElement;
        if (wrapper) {
          wrapper.focus();
        }
      });
    }
  }, [stage, currentLineIndex, lives, time]);

  const checkPlayerCollisionWithRock = () => {
    if (stage !== Stage.GAME) return;

    fallingRocks.forEach((rock) => {
      const rockPosition = topValues[rock.lineIndex];
      const distanceY = Math.abs(
        rockPosition - (window.innerHeight - playerPosition.bottom)
      );
      const distanceX = Math.abs(400 + rock.lineIndex * 190 - playerPosition.left);
      
      if (distanceY <= 29 && distanceX <= 29) {
        hitAudioRef.current?.play();
        setLives(lives - 1);
        setCurrentLineIndex(0);
        setTopValues(topValues.map((topValue, index) => 
          rock.lineIndex === index ? 0 : topValue
        ));
        setFallingRocks(prev => prev.filter(r => r.id !== rock.id));
      }
    });
  };

  const fallingRockhjh = () => {
    setTopValues(topValues.map((value, index) => {
      const rockOnThisLine = fallingRocks.find(rock => rock.lineIndex === index);
      if (rockOnThisLine) {
        if (window.innerHeight <= value) {
          setScore(prevScore => prevScore + 5);
          setFallingRocks(prev => prev.filter(rock => rock.id !== rockOnThisLine.id));
          return 0;
        }
        return value + 29;
      } else {
        return 0;
      }
    }));
    checkPlayerCollisionWithRock();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (stage !== Stage.GAME || isPaused) return;

    if (event.key === "x" || event.key === "ч") {
      if (currentLineIndex >= 4) return;
      if (
        (currentLineIndex === 2 && IsThirdLineVisible) ||
        (currentLineIndex === 1 && isSecondLineVisible) ||
        (currentLineIndex === 3 && isFirstLineVisible)
      ) return;
      setIsMoving(true);
      setCurrentLineIndex(currentLineIndex + 1);
      setScore(prevScore => prevScore + 10);
    } else if (event.key === "z" || event.key === "я") {
      if (currentLineIndex <= 0) return;
      setIsMoving(true);
      setCurrentLineIndex(currentLineIndex - 1);
    }
  };

  const handleKeyUp = () => {
    setIsMoving(false);
  };

  const generateRandomRock = () => {
    const randomLineIndex = Math.floor(Math.random() * 5);
    const sizes = ['small', 'medium', 'large'];
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
    const newRockId = `rock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (!fallingRocks.some(rock => rock.lineIndex === randomLineIndex)) {
      setFallingRocks(prev => [...prev, { id: newRockId, lineIndex: randomLineIndex }]);
      setRockSizes(prev => ({ ...prev, [newRockId]: randomSize }));
    }
  };

  useEffect(() => {
    if (stage !== Stage.GAME || isPaused) return;

    const gameLoop = setInterval(() => {
      generateRandomRock();
      fallingRockhjh();
    }, 90);

    return () => {
      if (gameLoop) clearInterval(gameLoop);
    };
  }, [stage, fallingRocks, topValues, isPaused, generateRandomRock, fallingRockhjh]);

  useEffect(() => {
    if (stage !== Stage.GAME || isPaused) return;

      const toggleVisibility = () => {
        if (
          (!IsThirdLineVisible && currentLineIndex === 2) ||
          (!isSecondLineVisible && currentLineIndex === 1) ||
          (!isFirstLineVisible && currentLineIndex === 3)
        ) {
          setCurrentLineIndex(0);
        }
      setIsThirdLineVisible(!IsThirdLineVisible);
      setIsSecondLineVisible(!isSecondLineVisible);
      setIsFirstLineVisible(!isFirstLineVisible);
    };

    const interval = setInterval(toggleVisibility, 990);
    return () => clearInterval(interval);
  }, [stage, IsThirdLineVisible, isSecondLineVisible, isFirstLineVisible, currentLineIndex, isPaused]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | undefined;

    if (stage === Stage.GAME && time > 0 && !isPaused) {
      timerInterval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    }

    if (time === 0 || lives === 0) {
      setIsFinalScore(score);
      setStage(Stage.FINISH);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [stage, time, lives, score, isPaused]);

  useEffect(() => {
    if (currentLineIndex === 4) {
      let finalScore = score;
      if (lives === 3) {
        finalScore = Math.floor(finalScore * 3);
      }
      setIsFinalScore(finalScore);
      if (finalScore > savedScores) {
        setSavedScores(finalScore);
      }
      setStage(Stage.FINISH);
      setBearJumping(true);
      victoryAudioRef.current?.play();
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setTimeout(() => {
        onComplete(finalScore); // Передаём финальный счёт
        resetGame();
      }, 3000);
    }
  }, [currentLineIndex, score, lives, savedScores, onComplete]);

  useEffect(() => {
    if (lives === 0) {
      setIsFinalScore(0);
      if (0 > savedScores) {
        setSavedScores(0);
      }
      setStage(Stage.FINISH);
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setTimeout(() => {
        onComplete(0); // Передаём 0 при проигрыше
        resetGame();
      }, 3000);
    }
  }, [lives, savedScores, onComplete]);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('highScore');
    if (savedHighScore) {
      setSavedScores(parseInt(savedHighScore));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('highScore', savedScores.toString());
  }, [savedScores]);

  useEffect(() => {
    if (stage === Stage.GAME) {
      if (audioRef.current) {
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
        
        if (isPaused) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {
            console.log('Музыка будет воспроизведена при следующем взаимодействии');
          });
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [stage, audioRef, isPaused]);

  return (
    <>
      <style>
        {`
          @keyframes bearJump {
            0% { transform: translateY(0) translateX(-50%); }
            40% { transform: translateY(-15px) translateX(-50%); }
            60% { transform: translateY(-15px) translateX(-50%); }
            100% { transform: translateY(0) translateX(-50%); }
          }
          @keyframes bearArmsWave {
            0% { transform: rotate(-20deg); }
            50% { transform: rotate(-40deg); }
            100% { transform: rotate(-20deg); }
          }
          @keyframes bearArmsWaveRight {
            0% { transform: rotate(20deg); }
            50% { transform: rotate(40deg); }
            100% { transform: rotate(20deg); }
          }
        `}
      </style>
      <audio ref={hitAudioRef} src={hitSound} preload="auto"></audio>
      <audio ref={audioRef} src={gameMusic} loop />
      <audio ref={victoryAudioRef} src={victorySound} preload="auto"></audio>
      <AnimatePresence mode="wait">
        {stage === Stage.START ? (
          <motion.div 
            className="start-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="floating-snowflakes">
              {Array.from({ length: 15 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="start-snowflake"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * -100}%`,
                  }}
                  custom={index}
                  animate="animate"
                  variants={snowflakeVariants}
                >
                  ❄️
                </motion.div>
              ))}
        </div>
            <motion.h1 
              className="game-title"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
            >
              Восхождение на вершину
            </motion.h1>
            <motion.div 
              className="scores"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Лучший счет: {savedScores}
            </motion.div>
            <motion.button 
              className="start-button" 
              onClick={handleStartClick}
              initial={{ scale: 0 }}
              animate={{ 
                scale: 1, 
                transition: { 
                  delay: 0.7, 
                  duration: 0.5, 
                  type: "spring", 
                  stiffness: 200 
                } 
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Начать игру
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="wrapper"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            autoFocus
            style={{ outline: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Снежинки */}
          <div className="snow-container">
            {Array.from({ length: 19 }).map((_, index) => (
                <motion.div 
                  key={index} 
                  className="snowflake"
                  custom={index}
                  variants={snowflakeVariants}
                  animate="animate"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * -100}%`,
                  }}
                >
                  ❄️
                </motion.div>
              ))}
            </div>
            
            {/* Солнце */}
            <div className="sun-container">
              <div className="sun" />
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="sun-ray"
                  style={{
                    transform: `rotate(${index * 30}deg)`,
                  }}
                />
              ))}
              </div>
            
            {/* Птицы */}
            <div className="birds-container">
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.div 
                  key={index} 
                  className="bird"
                  animate={{
                    x: [0, window.innerWidth],
                    y: [0, Math.sin(index) * 30],
                    transition: {
                      x: { 
                        duration: 20 + index * 5, 
                        repeat: Infinity, 
                        ease: "linear" 
                      },
                      y: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatType: "mirror"
                      }
                    }
                  }}
                />
            ))}
          </div>
            
          <img className="mountains" src="/img/mountains.png" alt="mountains" />

            {/* Флаг финиша */}
            <div
              style={{
                position: "absolute",
                left: `${400 + 4 * 190}px`,
                bottom: `${4 * lineStep + 50}px`,
                fontSize: "40px",
                zIndex: 2,
              }}
            >
              🚩
            </div>

            {/* Медвежонок у финиша */}
            <motion.div 
              style={{
                position: "absolute",
                left: `${400 + 4 * 190 - 50}px`,
                bottom: `${4 * lineStep + 30}px`,
                width: "45px",
                height: "55px",
                zIndex: 2,
              }}
              animate={bearJumping ? "happy" : "idle"}
              variants={bearVariants}
            >
              {/* Тело медвежонка */}
              <motion.div 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '35px',
                  height: '38px',
                  background: '#8B4513',
                  borderRadius: '50% 50% 40% 40%',
                  zIndex: 2,
                  transformOrigin: "center bottom"
                }}
              />
              
              {/* Голова медвежонка */}
              <motion.div 
                style={{
                  position: 'absolute',
                  bottom: '28px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '28px',
                  height: '28px',
                  background: '#8B4513',
                  borderRadius: '50%',
                  zIndex: 3
                }}
                animate={bearJumping ? {
                  rotate: [0, -5, 5, 0],
                  transition: {
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                } : {}}
              >
                {/* Ушки */}
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '2px',
                  width: '12px',
                  height: '12px',
                  background: '#8B4513',
                  borderRadius: '50%'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '2px',
                  width: '12px',
                  height: '12px',
                  background: '#8B4513',
                  borderRadius: '50%'
                }} />
                
                {/* Мордочка */}
                <div style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '18px',
                  height: '12px',
                  background: '#D2B48C',
                  borderRadius: '30% 30% 50% 50%'
                }} />
                
                {/* Глаза */}
                <div style={{
                  position: 'absolute',
                  top: '9px',
                  left: '7px',
                  width: '4px',
                  height: '4px',
                  background: 'black',
                  borderRadius: '50%'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '9px',
                  right: '7px',
                  width: '4px',
                  height: '4px',
                  background: 'black',
                  borderRadius: '50%'
                }} />
                
                {/* Нос */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '7px',
                  height: '5px',
                  background: 'black',
                  borderRadius: '50%'
                }} />
                
                {/* Улыбка (видна только когда медвежонок радуется) */}
                {bearJumping && (
                  <motion.div 
                    style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '14px',
                      height: '6px',
                      border: 'none',
                      borderBottom: '2px solid black',
                      borderRadius: '0 0 100% 100%'
                    }}
                  />
                )}
              </motion.div>
              
              {/* Руки */}
              <motion.div 
                style={{
                  position: 'absolute',
                  top: '25px',
                  left: '2px',
                  width: '12px',
                  height: '20px',
                  background: '#8B4513',
                  borderRadius: '30%',
                  transformOrigin: "top center"
                }}
                animate={bearJumping ? {
                  rotate: [-20, -70, -20],
                  transition: {
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                } : {
                  rotate: -20
                }}
              />
              <motion.div 
                style={{
                  position: 'absolute',
                  top: '25px',
                  right: '2px',
                  width: '12px',
                  height: '20px',
                  background: '#8B4513',
                  borderRadius: '30%',
                  transformOrigin: "top center"
                }}
                animate={bearJumping ? {
                  rotate: [20, 70, 20],
                  transition: {
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                } : {
                  rotate: 20
                }}
              />
              
              {/* Ноги */}
              <motion.div 
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  left: '7px',
                  width: '10px',
                  height: '12px',
                  background: '#8B4513',
                  borderRadius: '30% 30% 50% 50%',
                }}
                animate={bearJumping ? {
                  rotate: [-5, 5, -5],
                  transition: {
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                } : {}}
              />
              <motion.div 
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '7px',
                  width: '10px',
                  height: '12px',
                  background: '#8B4513',
                  borderRadius: '30% 30% 50% 50%',
                }}
                animate={bearJumping ? {
                  rotate: [5, -5, 5],
                  transition: {
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                } : {}}
              />
            </motion.div>
            
            <div className="list">z вперед, x назад</div>
            <div className="colnse"></div>

            {/* Падающие камни */}
            <AnimatePresence>
              {fallingRocks.map((rock) => (
                <motion.div
                  key={rock.id}
                  className={`falling-rock ${rockSizes[rock.id] || 'medium'}`}
                  style={{
                    left: `${400 + rock.lineIndex * 190}px`,
                    top: `${topValues[rock.lineIndex]}px`,
                  }}
                  variants={rockVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="rock-shadow" />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Препятствия */}
            <AnimatePresence>
              {!IsThirdLineVisible && (
                <motion.div
                  className="obstacle"
                  style={{
                    left: `${400 + 2 * 190}px`,
                    bottom: `${2 * lineStep}px`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="obstacle-warning"
                    animate={{
                      scale: [1, 1.1, 1],
                      color: ["#ff0000", "#ff5500", "#ff0000"],
                      transition: {
                        repeat: Infinity,
                        duration: 1
                      }
                    }}
                  >
                    Опасно
                  </motion.div>
                </motion.div>
          )}
          {!isSecondLineVisible && (
                <motion.div
                  className="obstacle"
              style={{
                left: `${400 + 1 * 190}px`,
                bottom: `${1 * lineStep}px`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="obstacle-warning"
                    animate={{
                      scale: [1, 1.1, 1],
                      color: ["#ff0000", "#ff5500", "#ff0000"],
                      transition: {
                        repeat: Infinity,
                        duration: 1
                      }
                    }}
                  >
                    Опасно
                  </motion.div>
                </motion.div>
          )}
          {!isFirstLineVisible && (
                <motion.div
                  className="obstacle"
              style={{
                left: `${400 + 3 * 190}px`,
                bottom: `${3 * lineStep}px`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="obstacle-warning"
                    animate={{
                      scale: [1, 1.1, 1],
                      color: ["#ff0000", "#ff5500", "#ff0000"],
                      transition: {
                        repeat: Infinity,
                        duration: 1
                      }
                    }}
                  >
                    Опасно
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Альпинист */}
            <motion.div
              className={`climber ${isMoving ? 'moving' : ''}`}
              style={{
                left: `${playerPosition.left}px`,
                bottom: `${playerPosition.bottom}px`,
              }}
              variants={climberVariants}
              animate={
                stage === Stage.FINISH && currentLineIndex === 4 
                  ? "victory" 
                  : isMoving ? "moving" : "idle"
              }
            />

            {/* Финиш игры */}
          {stage === Stage.FINISH && (
              <motion.div 
                className="finish-screen"
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                  zIndex: 1000
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.h1
                  style={{
                    color: "#FFD700",
                    fontSize: "48px",
                    textAlign: "center",
                    margin: "0 0 30px 0",
                    textShadow: "0 0 20px rgba(255, 215, 0, 0.8)",
                    padding: "0 20px",
                    maxWidth: "90%"
                  }}
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  {currentLineIndex === 4 ? "Вы победитель!" : "Игра окончена!"}
                </motion.h1>
                
                <motion.h2
                  style={{
                    color: "white",
                    fontSize: "32px",
                    textAlign: "center",
                    margin: "0 0 40px 0"
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {`Набрано очков: ${isFinalScore}`}
                </motion.h2>
                
                <motion.button
                  style={{
                    padding: "15px 30px",
                    fontSize: "24px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.1, backgroundColor: "#45a049" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetGame}
                >
                  Играть снова
                </motion.button>
              </motion.div>
            )}
            
            {/* Элементы интерфейса */}
            <motion.div
            className="time"
              style={{ top: "49px", left: "68px", color: "orange", fontSize: "24px" }}
              animate={{ 
                scale: time <= 10 ? [1, 1.2, 1] : 1,
                color: time <= 10 ? ["orange", "red", "orange"] : "orange",
                transition: {
                  repeat: time <= 10 ? Infinity : 0,
                  duration: 0.5
                }
            }}
          >
            Time: {time}
            </motion.div>
            <motion.div
            className="score"
              style={{ top: "49px", right: "30px", color: "orange", fontSize: "24px" }}
              animate={{
                scale: score % 50 === 0 && score > 0 ? [1, 1.2, 1] : 1,
                transition: {
                  duration: 0.5
                }
            }}
          >
            Score: {stage === Stage.FINISH ? isFinalScore : score}
            </motion.div>
            <motion.div
            className="lives"
              style={{ top: "49px", right: "30px", color: "orange", fontSize: "24px" }}
              animate={{
                scale: lives === 1 ? [1, 1.2, 1] : 1,
                color: lives === 1 ? ["orange", "red", "orange"] : "orange",
                transition: {
                  repeat: lives === 1 ? Infinity : 0,
                  duration: 1
                }
            }}
          >
            Lives: {lives}
            </motion.div>

            {/* Экран паузы */}
            {isPaused && stage === Stage.GAME && (
              <motion.div 
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 999
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.h1 
                  style={{
                    color: "white",
                    fontSize: "48px",
                    textShadow: "0 0 10px #00ffff"
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                    transition: {
                      repeat: Infinity,
                      duration: 1.5
                    }
                  }}
                >
                  ПАУЗА
                </motion.h1>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClimbingGame;
