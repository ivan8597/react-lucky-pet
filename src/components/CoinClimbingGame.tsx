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
import { PauseContext } from "../App.tsx";
import { motion } from "framer-motion";

enum Stage {
  START = "start",
  GAME = "game",
  FINISH = "finish",
}

interface CoinClimbingGameProps {
  onComplete?: () => void;
}

const CoinClimbingGame: React.FC<CoinClimbingGameProps> = ({ onComplete }) => {
  const { isPaused } = useContext(PauseContext);
  const [stage, setStage] = useState<Stage>(Stage.START);
  const [climber, setClimber] = useState({ x: 50, y: 450, isJumping: false });
  const [lives, setLives] = useState(3);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [time, setTime] = useState<number>(49);
  const [coins, setCoins] = useState([
    { x: 100, y: 380, collected: false },
    { x: 200, y: 280, collected: false },
    { x: 400, y: 380, collected: false },
    { x: 500, y: 280, collected: false },
    { x: 600, y: 380, collected: false },
    { x: 700, y: 380, collected: false },
    { x: 800, y: 280, collected: false },
    { x: 900, y: 380, collected: false },
    { x: 300, y: 380, collected: false },
  ]);
  const [spiders, setSpiders] = useState([
    { x: 200, y: 450, speed: 1 },
    { x: 400, y: 450, speed: -1.5 },
    { x: 600, y: 450, speed: 1.2 },
  ]);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [pressedKeys, setPressedKeys] = useState(new Set<string>());
  const [audio] = useState(new Audio(gameMusic));
  const [logs, setLogs] = useState([
    { x: 200, y: 350 },
    { x: 500, y: 350 },
    { x: 800, y: 350 },
  ]);
  const [showFinishBear, setShowFinishBear] = useState(false);
  const grassBlades = React.useMemo(() => 
    Array.from({ length: 200 }).map(() => ({
      height: 20 + Math.random() * 30,
      rotation: -5 + Math.random() * 10
    })), []);
  
  // Создаем бабочек с разными траекториями
  const butterflies = React.useMemo(() => 
    Array.from({ length: 10 }).map(() => ({
      x: Math.random() * 900,
      y: 100 + Math.random() * 200,
      size: 20 + Math.random() * 15,
      speedX: (0.5 + Math.random() * 1) * (Math.random() > 0.5 ? 1 : -1),
      speedY: 0.3 + Math.random() * 0.7,
      flapSpeed: 0.1 + Math.random() * 0.3,
      rotation: Math.random() * 20 - 10,
      wingColor: ['#f0a9a9', '#f9d5e5', '#ffb8b8', '#d1b3ff', '#b3d9ff', '#f8e8a0'][Math.floor(Math.random() * 6)],
      bodyColor: ['#bf7c7c', '#a85e5e', '#8d4f4f', '#774444', '#5e3636'][Math.floor(Math.random() * 5)]
    })), []);
    
  // Состояние медвежонка
  const [bear, setBear] = useState({
    x: 50,
    direction: 'right',
    isWalking: true,
    lastHoneyTime: Date.now()
  });
  
  // Состояние бочонка меда
  const [honeyPot, setHoneyPot] = useState({
    x: 0,
    y: 0,
    active: false,
    verticalSpeed: 0
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || victory || isPaused) return;

      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.add(e.key);
        return newKeys;
      });
      setIsMoving(true);

      if (!climber.isJumping && pressedKeys.has("ArrowUp")) {
        setClimber(prev => ({ ...prev, isJumping: true }));
        let jumpHeight = 0;
        const jumpInterval = setInterval(() => {
          setClimber(prev => {
            jumpHeight += 15;
            const horizontalMove = pressedKeys.has("ArrowRight") ? 10 : pressedKeys.has("ArrowLeft") ? -10 : 0;
            const newX = Math.max(0, Math.min(950, prev.x + horizontalMove));
            let newY = prev.y;
            
            if (jumpHeight <= 300) {
              newY = prev.y - 30;
            } else {
              newY = prev.y + 15;
              
              if (newY >= 450) {
                clearInterval(jumpInterval);
                return { x: newX, y: 450, isJumping: false };
              }
            }

            const landedLog = logs.find(log => 
              Math.abs(newX - log.x) < 50 &&
              Math.abs(newY - log.y) < 30 &&
              newY < log.y
            );

            if (landedLog) {
              clearInterval(jumpInterval);
              return { x: newX, y: landedLog.y - 40, isJumping: false };
            }

            return {
              ...prev,
              x: newX,
              y: newY,
            };
          });
        }, 20);
      } else if (!climber.isJumping) {
        if (pressedKeys.has("ArrowRight")) {
          setClimber(prev => ({ ...prev, x: Math.min(prev.x + 20, 950) }));
        }
        if (pressedKeys.has("ArrowLeft")) {
          setClimber(prev => ({ ...prev, x: Math.max(prev.x - 20, 0) }));
        }
        if (pressedKeys.has("ArrowDown")) {
          const isOnLog = logs.some(log => 
            Math.abs(climber.x - log.x) < 50 && 
            Math.abs(climber.y - (log.y - 40)) < 30 &&
            climber.y === log.y - 40
          );
          if (isOnLog) {
            setClimber(prev => ({ ...prev, y: 450 }));
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key);
        return newKeys;
      });
      if (!pressedKeys.size) {
        setIsMoving(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [climber.isJumping, gameOver, victory, pressedKeys, isPaused]);

  useEffect(() => {
    if (gameOver || victory || isPaused) return;

    const gameLoop = setInterval(() => {
      // Обновляем пауков - двигаем их горизонтально и меняем направление у границ экрана
      setSpiders((prev) =>
        prev.map((spider) => {
          let newX = spider.x + spider.speed;
          if (newX <= 0 || newX >= 950) {
            return { ...spider, x: newX <= 0 ? 0 : 950, speed: -spider.speed };
          }
          return { ...spider, x: newX };
        })
      );

      if (!climber.isJumping) {
        const isOnLog = logs.some(log => 
          Math.abs(climber.x - log.x) < 50 && 
          Math.abs(climber.y - (log.y - 40)) < 30 &&
          climber.y <= log.y - 40
        );

        if (!isOnLog && climber.y < 450) {
          setClimber(prev => ({
            ...prev,
            y: Math.min(prev.y + 10, 450)
          }));
        }
      }

      const climberHitbox = 30;
      const spiderHitbox = 40;
      spiders.forEach((spider) => {
        if (
          !isInvulnerable &&
          Math.abs(climber.x - spider.x) < climberHitbox + spiderHitbox &&
          Math.abs(climber.y - spider.y) < climberHitbox + spiderHitbox
        ) {
          setLives(prev => Math.max(0, prev - 1));
          if (lives <= 1) {
          setGameOver(true);
            audio.pause();
            audio.currentTime = 0;
          } else {
            setIsInvulnerable(true);
            setTimeout(() => {
              setIsInvulnerable(false);
            }, 2000);
          }
        }
      });

      setCoins((prev) =>
        prev.map((coin) => {
          if (
            !coin.collected &&
            Math.abs(climber.x - coin.x) < 30 &&
            Math.abs(climber.y - coin.y) < 30
          ) {
            return { ...coin, collected: true };
          }
          return coin;
        })
      );

      // Перемещение медвежонка и логика бочонка меда
      setBear(prev => {
        let newX = prev.x;
        let newDirection = prev.direction;
        const currentTime = Date.now();
        let lastHoneyTime = prev.lastHoneyTime;
        
        // Случайная генерация бочонка меда каждые 15-25 секунд
        if (!honeyPot.active && currentTime - prev.lastHoneyTime > 15000 + Math.random() * 10000) {
          setHoneyPot({
            x: prev.x,
            y: 50, // Начальная позиция на уровне медвежонка
            active: true,
            verticalSpeed: -5 // Начальная скорость вверх (была -10, уменьшаем)
          });
          lastHoneyTime = currentTime;
        }

        if (prev.direction === 'right') {
          newX += 0.5;
          if (newX > 950) {
            newDirection = 'left';
          }
        } else {
          newX -= 0.5;
          if (newX < 50) {
            newDirection = 'right';
          }
        }

        return {
          ...prev,
          x: newX,
          direction: newDirection,
          lastHoneyTime
        };
      });
      
      // Обновление позиции бочонка меда
      if (honeyPot.active) {
        setHoneyPot(prev => {
          // Физика полета бочонка меда
          const newY = prev.y + prev.verticalSpeed;
          const newVerticalSpeed = prev.verticalSpeed + 0.15; // Гравитация (была 0.25, уменьшаем)
          
          // Проверка коллизии с альпинистом
          if (Math.abs(climber.x - prev.x) < 40 && Math.abs(climber.y - newY) < 40) {
            // Поймал бочонок - прибавляем жизнь
            setLives(l => Math.min(l + 1, 5)); // Максимум 5 жизней
            return { ...prev, active: false };
          }
          
          // Если бочонок упал ниже экрана или вылетел за верхнюю границу, деактивируем его
          if (newY > 500 || newY < -50) {
            return { ...prev, active: false };
          }
          
          return {
            ...prev,
            y: newY,
            verticalSpeed: newVerticalSpeed
          };
        });
      }
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [climber.x, climber.y, spiders, coins, gameOver, victory, lives, isInvulnerable, audio, honeyPot.active, showFinishBear, isPaused, onComplete]);

  useEffect(() => {
    if (stage === Stage.GAME) {
      if (audio) {
        audio.loop = true;
        audio.volume = 0.3;
        
        if (isPaused) {
          audio.pause();
        } else {
          audio.play().catch(err => {
            console.log("Аудио будет воспроизведено при следующем взаимодействии");
          });
        }
      }
    } else {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
    
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [stage, audio, isPaused]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | undefined;

    if (stage === Stage.GAME && time > 0 && !isPaused && !gameOver && !victory) {
      timerInterval = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    }

    if (time === 0) {
      setGameOver(true);
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [stage, time, isPaused, gameOver, victory, audio]);

  const collectedCoins = coins.filter((coin) => coin.collected).length;

  const handleStartClick = () => {
    setStage(Stage.GAME);
    setClimber({ x: 50, y: 450, isJumping: false });
    setLives(3);
    setTime(49);
    setIsInvulnerable(false);
    setGameOver(false);
    setVictory(false);
    setShowFinishBear(false);
    setIsMoving(false);
    setPressedKeys(new Set<string>());
    setSpiders([
      { x: 200, y: 450, speed: 1 },
      { x: 400, y: 450, speed: -1.5 },
      { x: 600, y: 450, speed: 1.2 },
    ]);
    setCoins([
      { x: 100, y: 380, collected: false },
      { x: 200, y: 280, collected: false },
      { x: 400, y: 380, collected: false },
      { x: 500, y: 280, collected: false },
      { x: 600, y: 380, collected: false },
      { x: 700, y: 380, collected: false },
      { x: 800, y: 280, collected: false },
      { x: 900, y: 380, collected: false },
      { x: 300, y: 380, collected: false },
    ]);
  };

  // Изменяем логику проверки победы
  useEffect(() => {
    // Проверяем, собраны ли все монеты
    const allCoinsCollected = coins.every(coin => coin.collected);
    
    // Если все монеты собраны, показываем финишного медвежонка
    if (allCoinsCollected && !showFinishBear && stage === Stage.GAME) {
      console.log("Все монеты собраны, показываем медвежонка с надписью Победа");
      setShowFinishBear(true);
    }
    
    // Победа только если показан медвежонок (все монеты собраны) и прошло некоторое время
    if (showFinishBear && stage === Stage.GAME && !victory) {
      // Даем игроку 3 секунды, чтобы насладиться надписью "Победа", затем показываем финальный экран
      setTimeout(() => {
        console.log("Победа! Игрок собрал все монеты");
        setVictory(true);
        
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
          
          // Проигрываем звук победы если он существует
          const victoryAudio = new Audio(victorySound);
          victoryAudio.volume = 0.5;
          victoryAudio.play().catch(() => console.log("Не удалось воспроизвести звук победы"));
        }
        
        // Вызываем onComplete, если он был передан
        if (onComplete) {
          onComplete();
        }
      }, 3000);
    }
  }, [coins, showFinishBear, victory, stage, audio, onComplete]);

  return (
    <div>
      <style>
        {`
          @keyframes balloon-sway {
            0% { transform: rotate(-5deg) translateY(0); }
            50% { transform: rotate(5deg) translateY(-5px); }
            100% { transform: rotate(-5deg) translateY(0); }
          }
          
          @keyframes rope-sway {
            0% { transform: rotate(-2deg); }
            50% { transform: rotate(2deg); }
            100% { transform: rotate(-2deg); }
          }
        `}
      </style>
      {stage === Stage.START ? (
        <div className="start-page">
          <h1 className="game-title">Сбор лучшего меда</h1>
          <button className="start-button" onClick={handleStartClick}>
            Начать игру
          </button>
        </div>
      ) : (
    <div
      style={{
            width: "100vw",
            height: "100vh",
            background: "linear-gradient(to bottom, #87CEEB, #1E90FF)",
        position: "relative",
        overflow: "hidden",
      }}
      tabIndex={0}
      autoFocus
        >
          <div className="sun-container" style={{ top: "20px", right: "100px" }}>
            <div className="sun" />
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="sun-ray"
                style={{
                  transform: `rotate(${index * 30}deg)`,
                  animation: `ray-pulse 2s infinite alternate ${index * 0.2}s`,
                }}
              />
            ))}
          </div>
          
          {/* Бабочки */}
          {butterflies.map((butterfly, index) => (
            <div
              key={`butterfly-${index}`}
              style={{
                position: "absolute",
                left: butterfly.x,
                top: butterfly.y,
                width: butterfly.size,
                height: butterfly.size * 0.8,
                zIndex: 5,
                transform: `rotate(${butterfly.rotation}deg)`,
                animation: `
                  butterfly-fly-x ${8 / Math.abs(butterfly.speedX)}s ease-in-out infinite alternate,
                  butterfly-fly-y ${6 / butterfly.speedY}s ease-in-out infinite alternate
                `,
                animationDelay: `${index * 0.7}s, ${index * 0.5}s`,
                pointerEvents: "none"
              }}
            >
              {/* Тело бабочки */}
              <div style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: butterfly.size * 0.1,
                height: butterfly.size * 0.6,
                background: butterfly.bodyColor,
                borderRadius: "50%",
                zIndex: 2
              }}>
                {/* Головка бабочки */}
                <div style={{
                  position: "absolute",
                  top: "-15%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: butterfly.size * 0.15,
                  height: butterfly.size * 0.15,
                  background: butterfly.bodyColor,
                  borderRadius: "50%"
                }}></div>
                
                {/* Усики */}
                <div style={{
                  position: "absolute",
                  top: "-20%",
                  left: "30%",
                  width: "1px",
                  height: butterfly.size * 0.2,
                  background: "#000",
                  transform: "rotate(-30deg)",
                  transformOrigin: "bottom center"
                }}></div>
                <div style={{
                  position: "absolute",
                  top: "-20%",
                  right: "30%",
                  width: "1px",
                  height: butterfly.size * 0.2,
                  background: "#000",
                  transform: "rotate(30deg)",
                  transformOrigin: "bottom center"
                }}></div>
              </div>
              
              {/* Левое крыло */}
              <div style={{
                position: "absolute",
                left: "0",
                top: "20%",
                width: butterfly.size * 0.5,
                height: butterfly.size * 0.7,
                borderRadius: "60% 40% 70% 30% / 70% 50% 50% 30%",
                background: `linear-gradient(45deg, ${butterfly.wingColor} 70%, rgba(255,255,255,0.8))`,
                transformOrigin: "right center",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                animation: `butterfly-wing-left ${1.2 / butterfly.flapSpeed}s ease-in-out infinite alternate`
              }}></div>
              
              {/* Правое крыло */}
              <div style={{
                position: "absolute",
                right: "0",
                top: "20%",
                width: butterfly.size * 0.5,
                height: butterfly.size * 0.7,
                borderRadius: "40% 60% 30% 70% / 50% 70% 30% 50%",
                background: `linear-gradient(-45deg, ${butterfly.wingColor} 70%, rgba(255,255,255,0.8))`,
                transformOrigin: "left center",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                animation: `butterfly-wing-right ${1.2 / butterfly.flapSpeed}s ease-in-out infinite alternate`,
                animationDelay: "0.1s"
              }}></div>
            </div>
          ))}
          
          {/* Медвежонок внизу */}
          <div 
            style={{
              position: 'absolute',
              bottom: '50px',
              left: `${bear.x}px`,
              width: '40px',
              height: '50px',
              zIndex: 4,
              transform: `scaleX(${bear.direction === 'right' ? 1 : -1})`,
              transition: 'transform 0.2s'
            }}
          >
            {/* Тело медвежонка */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '30px',
              height: '35px',
              background: '#8B4513',
              borderRadius: '50% 50% 40% 40%',
              zIndex: 2
            }} />
            
            {/* Голова медвежонка */}
            <div style={{
              position: 'absolute',
              bottom: '25px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '25px',
              height: '25px',
              background: '#8B4513',
              borderRadius: '50%',
              zIndex: 3
            }}>
              {/* Ушки */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '2px',
                width: '10px',
                height: '10px',
                background: '#8B4513',
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '2px',
                width: '10px',
                height: '10px',
                background: '#8B4513',
                borderRadius: '50%'
              }} />
              
              {/* Мордочка */}
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '15px',
                height: '10px',
                background: '#D2B48C',
                borderRadius: '30% 30% 50% 50%'
              }} />
              
              {/* Глаза */}
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '6px',
                width: '4px',
                height: '4px',
                background: 'black',
                borderRadius: '50%'
              }} />
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '6px',
                width: '4px',
                height: '4px',
                background: 'black',
                borderRadius: '50%'
              }} />
              
              {/* Нос */}
              <div style={{
                position: 'absolute',
                top: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '6px',
                height: '4px',
                background: 'black',
                borderRadius: '50%'
              }} />
            </div>
            
            {/* Лапки */}
            <div style={{
              position: 'absolute',
              bottom: '0px',
              left: '5px',
              width: '8px',
              height: '10px',
              background: '#8B4513',
              borderRadius: '30% 30% 50% 50%',
              animation: `${bear.isWalking ? 'bear-walk 1s infinite alternate' : 'none'}`
            }} />
            <div style={{
              position: 'absolute',
              bottom: '0px',
              right: '5px',
              width: '8px',
              height: '10px',
              background: '#8B4513',
              borderRadius: '30% 30% 50% 50%',
              animation: `${bear.isWalking ? 'bear-walk 1s infinite alternate-reverse' : 'none'}`
            }} />
      </div>

          {/* Бочонок меда */}
          {honeyPot.active && (
      <div
        style={{
                position: 'absolute',
                left: honeyPot.x,
                top: honeyPot.y,
                width: '30px',
                height: '35px',
                zIndex: 5,
                background: '#CD853F',
                borderRadius: '5px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transform: 'rotate(5deg)'
              }}
            >
              {/* Верхняя часть бочонка */}
              <div style={{
                position: 'absolute',
                top: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '25px',
                height: '5px',
                background: '#A0522D',
                borderRadius: '5px 5px 0 0'
              }} />
              
              {/* Полоски бочонка */}
              <div style={{
                position: 'absolute',
                top: '7px',
                left: 0,
                width: '100%',
                height: '3px',
                background: '#A0522D'
              }} />
              <div style={{
                position: 'absolute',
                top: '17px',
                left: 0,
                width: '100%',
                height: '3px',
                background: '#A0522D'
              }} />
              <div style={{
                position: 'absolute',
                top: '27px',
                left: 0,
                width: '100%',
                height: '3px',
                background: '#A0522D'
              }} />
              
              {/* Мед сверху */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '16px',
                height: '8px',
                background: '#FFD700',
                borderRadius: '40% 40% 0 0',
                boxShadow: 'inset 0 3px 2px rgba(255,150,0,0.5)'
              }} />
            </div>
          )}
          
          {/* Трава внизу */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "50px",
            background: "linear-gradient(to top, #2e7d32, #4caf50)",
            zIndex: 1
          }}>
            {grassBlades.map((blade, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: `${index * 10}px`,
                  width: "10px",
                  height: `${blade.height}px`,
                  background: "#4caf50",
                  borderTopLeftRadius: "50%",
                  borderTopRightRadius: "50%",
                  transformOrigin: "bottom center",
                  transform: `rotate(${blade.rotation}deg)`,
                  zIndex: 2
                }}
              />
            ))}
          </div>
          
          {/* Финишный медвежонок с воздушными шариками */}
          {showFinishBear && (
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -80%)',
              width: '45px',
              height: '55px',
              zIndex: 10 // Увеличиваем z-index чтобы быть уверенным что медвежонок поверх всего
            }}
          >
            {/* Надпись "Победа!" над медвежонком */}
            <motion.div
              style={{
                position: 'absolute',
                top: '-80px', // Размещаем над шариками
                left: '50%',
                transform: 'translateX(-50%)',
                width: '150px',
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
                color: '#228B22', // Зеленый цвет для надписи "Победа"
                textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255,255,255,0.8)',
                padding: '10px',
                zIndex: 12
              }}
              animate={{
                scale: [1, 1.2, 1],
                y: [0, -5, 0],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              Победа!
            </motion.div>
            
            {/* Воздушные шарики сверху */}
            <div style={{
              position: 'absolute',
              top: '-80px',
              left: '10px',
              width: '70px',
              height: '70px',
              zIndex: 3
            }}>
              {/* Шарик 1 (красный) */}
              <div style={{
                position: 'absolute',
                top: '0px',
                left: '0px',
                width: '25px',
                height: '30px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #ff6b6b, #ff0000)',
                boxShadow: '0 0 5px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.5)',
                animation: 'balloon-sway 3s ease-in-out infinite alternate'
              }}></div>
              
              {/* Шарик 2 (синий) */}
              <div style={{
                position: 'absolute',
                top: '5px',
                left: '20px',
                width: '30px',
                height: '35px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #6bb5ff, #0066ff)',
                boxShadow: '0 0 5px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.5)',
                animation: 'balloon-sway 2.5s ease-in-out infinite alternate-reverse'
              }}></div>
              
              {/* Шарик 3 (желтый) */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '45px',
                width: '25px',
                height: '30px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #fff06b, #ffcc00)',
                boxShadow: '0 0 5px rgba(0,0,0,0.3), inset 0 0 10px rgba(255,255,255,0.5)',
                animation: 'balloon-sway 2.8s ease-in-out infinite alternate'
              }}></div>
              
              {/* Верёвочки от шариков */}
              <div style={{
                position: 'absolute',
                top: '30px',
                left: '12px',
                width: '1px',
                height: '50px',
                background: '#333',
                transformOrigin: 'top center',
                animation: 'rope-sway 3s ease-in-out infinite alternate'
              }}></div>
              
              <div style={{
                position: 'absolute',
                top: '35px',
                left: '35px',
                width: '1px',
                height: '45px',
                background: '#333',
                transformOrigin: 'top center',
                animation: 'rope-sway 2.5s ease-in-out infinite alternate-reverse'
              }}></div>
              
              <div style={{
                position: 'absolute',
                top: '40px',
                left: '58px',
                width: '1px',
                height: '40px',
                background: '#333',
                transformOrigin: 'top center',
                animation: 'rope-sway 2.8s ease-in-out infinite alternate'
              }}></div>
            </div>
            
            {/* Тело медвежонка */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '35px',
              height: '38px',
              background: '#8B4513',
              borderRadius: '50% 50% 40% 40%',
              zIndex: 2
            }} />
            
            {/* Голова медвежонка */}
            <div style={{
              position: 'absolute',
              bottom: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '28px',
              height: '28px',
              background: '#8B4513',
              borderRadius: '50%',
              zIndex: 3
            }}>
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
              
              {/* Улыбка */}
              <div style={{
                position: 'absolute',
                bottom: '3px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '10px',
                height: '5px',
                border: 'none',
                borderBottom: '2px solid black',
                borderRadius: '0 0 100% 100%'
              }} />
            </div>
            
            {/* Руки вверх - держат веревочки */}
            <div style={{
              position: 'absolute',
              top: '25px',
              left: '2px',
              width: '12px',
              height: '20px',
              background: '#8B4513',
              borderRadius: '30%',
              transform: 'rotate(-45deg)',
              transformOrigin: 'top center'
            }} />
            <div style={{
              position: 'absolute',
              top: '25px',
              right: '2px',
              width: '12px',
              height: '20px',
              background: '#8B4513',
              borderRadius: '30%',
              transform: 'rotate(45deg)',
              transformOrigin: 'top center'
            }} />
            
            {/* Ноги */}
            <div style={{
              position: 'absolute',
              bottom: '0px',
              left: '7px',
              width: '10px',
              height: '12px',
              background: '#8B4513',
              borderRadius: '30% 30% 50% 50%'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '0px',
              right: '7px',
              width: '10px',
              height: '12px',
              background: '#8B4513',
              borderRadius: '30% 30% 50% 50%'
            }} />
          </div>
          )}
          
          <div style={{ 
            position: "absolute",
            top: 10, 
            left: 10, 
            color: "white", 
            fontSize: "24px",
            display: "flex",
            gap: "20px",
            background: "rgba(0,0,0,0.5)",
            padding: "10px",
            borderRadius: "10px",
            zIndex: 10
          }}>
            <div>Монеты: {collectedCoins}/9</div>
            <div>Жизни: {"❤️".repeat(Math.max(0, lives))}</div>
            <motion.div
              animate={{
                scale: time <= 10 ? [1, 1.2, 1] : 1,
                color: time <= 10 ? ["#fff", "#ff0000", "#fff"] : "#fff",
                transition: {
                  repeat: time <= 10 ? Infinity : 0,
                  duration: 0.5
                }
              }}
            >
              Время: {time}
            </motion.div>
          </div>

          <div
            className={`climber ${isMoving ? "moving" : ""} ${climber.isJumping ? "jumping" : ""} ${isInvulnerable ? "invulnerable" : ""}`}
            style={{
          left: climber.x,
          top: climber.y,
              opacity: isInvulnerable ? 0.5 : 1,
        }}
      />

      {coins.map((coin, index) =>
        !coin.collected ? (
          <div
            key={index}
                className={`coin ${coin.collected ? "collected" : ""}`}
            style={{
              left: coin.x,
              top: coin.y,
            }}
          />
        ) : null
      )}

      {/* Пауки */}
      {spiders.map((spider, index) => (
        <div
          key={`spider-${index}`}
          style={{
            position: 'absolute',
            left: `${spider.x}px`,
            top: `${spider.y - 40}px`, // Поднимаем паука выше, чтобы он был на линии грунта
            width: '40px',
            height: '40px',
            zIndex: 5,
            transform: `scaleX(${spider.speed > 0 ? 1 : -1})`,
            transition: 'transform 0.2s'
          }}
        >
          {/* Тело паука */}
          <div style={{
            position: 'absolute',
            bottom: '5px',
            left: '5px',
            width: '30px',
            height: '20px',
            borderRadius: '50%',
            background: 'black',
            zIndex: 2
          }} />
          
          {/* Голова паука */}
          <div style={{
            position: 'absolute',
            bottom: '15px',
            left: '15px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'black',
            zIndex: 3
          }}>
            {/* Глаза */}
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              background: 'red',
            }} />
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              background: 'red',
            }} />
          </div>
          
          {/* Ноги паука */}
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              <div style={{
                position: 'absolute',
                bottom: '15px',
                left: i < 2 ? '5px' : '25px',
                width: '2px',
                height: '12px',
                background: 'black',
                transformOrigin: 'bottom center',
                transform: `rotate(${i % 2 === 0 ? -45 : 45}deg) translateY(${Math.sin(Date.now() / 200 + i) * 3}px)`,
              }} />
              <div style={{
                position: 'absolute',
                bottom: '5px',
                left: i < 2 ? '5px' : '25px',
                width: '2px',
                height: '12px',
                background: 'black',
                transformOrigin: 'top center',
                transform: `rotate(${i % 2 === 0 ? -135 : 135}deg) translateY(${Math.sin(Date.now() / 200 + i + 2) * 3}px)`,
              }} />
            </React.Fragment>
          ))}
        </div>
      ))}

          {logs.map((log, index) => (
        <div
          key={index}
              className="log"
          style={{
            position: "absolute",
                left: log.x,
                top: log.y,
                width: "100px",
                height: "20px",
                background: "#8B4513",
                borderRadius: "5px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
          }}
        />
      ))}

          <div className="controls" style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            color: "white",
            textAlign: "right"
          }}>
            <p>Управление:</p>
            <p>← Влево</p>
            <p>→ Вправо</p>
            <p>↑ Прыжок</p>
          </div>

      {gameOver && (
            <div 
              style={{ 
                position: "absolute", 
                top: "50%", 
                left: "50%", 
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "red",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                padding: "20px",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "20px" }}>Игра окончена!</div>
          <button
            onClick={() => {
                  setStage(Stage.START);
                }}
                style={{
                  padding: "10px 20px",
                  fontSize: "18px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
            }}
          >
            Начать заново
          </button>
        </div>
      )}

      {victory && (
            <div 
              style={{ 
                position: "absolute", 
                top: "50%", 
                left: "50%", 
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "green",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                padding: "20px",
                borderRadius: "10px",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "20px" }}>Победа! Вы собрали все монеты!</div>
              <button
                onClick={() => {
                  setStage(Stage.START);
                }}
                style={{
                  padding: "10px 20px",
                  fontSize: "18px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Играть снова
              </button>
            </div>
          )}

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
        </div>
      )}
    </div>
  );
};

export default CoinClimbingGame;