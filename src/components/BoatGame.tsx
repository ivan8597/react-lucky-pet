import React, { useState, useEffect, useCallback } from "react";
import hitSound from "./audio/hit.mp3";
import victorySound from "./audio/p9.mp3";
import RainSound from "./audio/Rain.mp3";
import "../styles/Boat.css";
import "../styles/Sun.css";



enum Stage {
  START = "start",
  GAME = "game",
  FINISH = "finish",
}

interface BoatGameProps {
  onComplete?: () => void;
}

const BoatGame: React.FC<BoatGameProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<Stage>(Stage.START);
  const [climberPosition, setClimberPosition] = useState<{ x: number; y: number }>({ x: 0, y: 100 });
  const [logs, setLogs] = useState<{ x: number; y: number }[]>([]);
  const [fishes, setFishes] = useState<
    { x: number; y: number; direction: "up" | "down"; lastJumpTime: number; jumpInterval: number }[]
  >([]);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [time, setTime] = useState<number>(60);
  const [currentLogIndex, setCurrentLogIndex] = useState<number>(0);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [isHit, setIsHit] = useState<boolean>(false);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [audio] = useState(() => new Audio(RainSound));
  const [bearCelebrating, setBearCelebrating] = useState<boolean>(false);

  const hitAudioRef = React.createRef<HTMLAudioElement>();
  const victoryAudioRef = React.createRef<HTMLAudioElement>();

  const logPositions = Array.from({ length: 9 }, (_, i) => ({
    x: 100 + i * 200,
    y: 100,
  }));

  const startGame = useCallback(() => {
    setStage(Stage.GAME);
    setClimberPosition({ x: logPositions[0].x, y: logPositions[0].y });
    setLogs(logPositions);
    const initialFishes = logPositions.slice(3, -1).map((log, i) => ({
      x: (log.x + logPositions[i + 4].x) / 2,
      y: 150,
      direction: "up" as "up" | "down",
      lastJumpTime: Date.now() + i * 500,
      jumpInterval: 2000 + Math.random() * 2000,
    }));
    setFishes(initialFishes);
    setScore(0);
    setLives(3);
    setTime(60);
    setCurrentLogIndex(0);
    setIsJumping(false);
    setIsHit(false);
    setIsInvulnerable(false);
  }, []);

  const handleStartClick = () => {
    startGame();
  };

  const resetGame = useCallback(() => {
    setStage(Stage.START);
    setClimberPosition({ x: 0, y: 100 });
    setLogs([]);
    setFishes([]);
    setScore(0);
    setLives(3);
    setTime(60);
    setCurrentLogIndex(0);
    setIsJumping(false);
    setIsHit(false);
    setIsInvulnerable(false);
  }, []);

  const checkCollision = useCallback(() => {
    if (stage !== Stage.GAME || isHit) {
      console.log('Проверка отменена:', { stage, isHit });
      return;
    }

    const currentLog = logs[currentLogIndex];
    const distanceX = Math.abs(climberPosition.x - currentLog.x);
    const distanceY = Math.abs(climberPosition.y - currentLog.y);

    if (!isJumping && (distanceX > 25 || distanceY > 25)) {
      hitAudioRef.current?.play();
      setLives(prev => prev - 1);
      setIsHit(true);
      setTimeout(() => {
        setClimberPosition({ x: logs[currentLogIndex].x, y: logs[currentLogIndex].y });
        setIsHit(false);
      }, 500);
    }

    fishes.forEach((fish) => {
      const fishDistanceX = Math.abs(fish.x - climberPosition.x);
      const fishDistanceY = Math.abs(fish.y - climberPosition.y);
      const isPlayerOnLog = logs[currentLogIndex] && Math.abs(climberPosition.y - logs[currentLogIndex].y) < 10;
      const isVulnerable = !isPlayerOnLog && !isInvulnerable;
      const isFishAbovePlayer = fish.y > climberPosition.y;

      console.log('Проверка столкновения с рыбкой:', {
        fishX: fish.x,
        fishY: fish.y,
        climberX: climberPosition.x,
        climberY: climberPosition.y,
        fishDistanceX,
        fishDistanceY,
        isJumping,
        isInvulnerable,
        isPlayerOnLog,
        isVulnerable,
        isFishAbovePlayer,
        currentLogIndex,
        lives
      });

      if (fishDistanceX <= 50 && fishDistanceY <= 50 && isVulnerable && !isHit && !isFishAbovePlayer) {
        console.log('Столкновение с рыбкой!');
        hitAudioRef.current?.play();
        
        setLives(prev => {
          const newLives = Math.max(0, prev - 1);
          console.log('Жизни уменьшены:', { было: prev, стало: newLives });
          if (newLives <= 0) {
            console.log('Игра окончена - нет жизней');
            setStage(Stage.FINISH);
          }
          return newLives;
        });
        
        setIsHit(true);
        setIsInvulnerable(true);
        
        setTimeout(() => {
          console.log('Сброс состояния после попадания');
          setIsHit(false);
          setIsInvulnerable(false);
        }, 2000);
      }
    });
  }, [stage, climberPosition, logs, currentLogIndex, fishes, isJumping, isHit, isInvulnerable, hitAudioRef]);

  const moveFishes = useCallback(() => {
    const currentTime = Date.now();
    setFishes(prev =>
      prev.map(fish => {
        if (currentTime - fish.lastJumpTime >= fish.jumpInterval) {
          return {
            ...fish,
            y: 150,
            direction: "up",
            lastJumpTime: currentTime,
            jumpInterval: 2000 + Math.random() * 2000,
          };
        }

        const jumpTime = currentTime - fish.lastJumpTime;
        
        if (jumpTime < fish.jumpInterval / 2) {
          const newY = fish.direction === "up" ? fish.y + 4 : fish.y;
          const newDirection = newY >= 250 ? "down" : fish.direction;
          return { ...fish, y: newY, direction: newDirection };
        } else {
          const newY = fish.direction === "down" ? fish.y - 2 : fish.y;
          const newDirection = newY <= 150 ? "up" : fish.direction;
          return { ...fish, y: newY, direction: newDirection };
        }
      })
    );
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (stage !== Stage.GAME || isJumping || isHit) return;

      if (event.key === "ArrowRight" || event.key === "d") {
        if (currentLogIndex < logs.length - 1) {
          setIsJumping(true);
          const nextLog = logs[currentLogIndex + 1];
          setClimberPosition({ x: nextLog.x, y: nextLog.y + 100 });
          setTimeout(() => {
            setClimberPosition({ x: nextLog.x, y: nextLog.y });
            setCurrentLogIndex(prev => prev + 1);
            setScore(prev => prev + 10);
            setIsJumping(false);
          }, 300);
        }
      } else if (event.key === "ArrowLeft" || event.key === "a") {
        if (currentLogIndex > 0) {
          setIsJumping(true);
          const prevLog = logs[currentLogIndex - 1];
          setClimberPosition({ x: prevLog.x, y: prevLog.y + 100 });
          setTimeout(() => {
            setClimberPosition({ x: prevLog.x, y: prevLog.y });
            setCurrentLogIndex(prev => prev - 1);
            setIsJumping(false);
          }, 300);
        }
      }
    },
    [stage, currentLogIndex, logs, isJumping, isHit]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (stage === Stage.GAME) {
      interval = setInterval(() => {
        moveFishes();
        checkCollision();
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, moveFishes, checkCollision]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | undefined;

    if (stage === Stage.GAME && time > 0) {
      timerInterval = setInterval(() => {
        setTime(prev => prev - 1);
      }, 1000);
    }

    if (time === 0 || lives === 0) {
      setStage(Stage.FINISH);
      setTimeout(() => {
        resetGame(); // Только сброс игры при проигрыше
      }, 3000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [stage, time, lives, resetGame]);

  useEffect(() => {
    if (stage === Stage.GAME && currentLogIndex === logs.length - 1) {
      setBearCelebrating(true);
      setStage(Stage.FINISH);
      victoryAudioRef.current?.play();
      setTimeout(() => {
        onComplete?.(); // Переход на следующий уровень при победе
      }, 3000);
    }
  }, [stage, currentLogIndex, logs.length, onComplete]);

  useEffect(() => {
    if (stage === Stage.GAME && lives <= 1) {
      setIsInvulnerable(true);
      setTimeout(() => {
        setIsInvulnerable(false);
      }, 2000);
    }
  }, [stage, lives]);

  useEffect(() => {
    if (stage === Stage.GAME) {
      audio.loop = true;
      audio.volume = 0.3;
      audio.play();
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [stage, audio]);

  return (
    <>
      <style>
        {`
          @keyframes bubbleRise {
            0% { transform: translateY(0); opacity: 0.8; }
            100% { transform: translateY(-30px); opacity: 0; }
          }
          
          @keyframes bearJump {
            0% { transform: translateY(0) translateX(-50%); }
            40% { transform: translateY(-15px) translateX(-50%); }
            60% { transform: translateY(-15px) translateX(-50%); }
            100% { transform: translateY(0) translateX(-50%); }
          }
          
          @keyframes finsFlap {
            0% { transform: rotate(-10deg); }
            50% { transform: rotate(-30deg); }
            100% { transform: rotate(-10deg); }
          }
          
          @keyframes finsFlipRight {
            0% { transform: rotate(10deg); }
            50% { transform: rotate(30deg); }
            100% { transform: rotate(10deg); }
          }
          
          @keyframes celebrateWave {
            0% { transform: rotate(-25deg); }
            50% { transform: rotate(-45deg); }
            100% { transform: rotate(-25deg); }
          }
          
          @keyframes celebrateWaveRight {
            0% { transform: rotate(25deg); }
            50% { transform: rotate(45deg); }
            100% { transform: rotate(25deg); }
          }
          
          @keyframes moreBubbles {
            0% { transform: translateY(0); opacity: 0.9; }
            100% { transform: translateY(-40px); opacity: 0; }
          }
        `}
      </style>
      <audio ref={hitAudioRef} src={hitSound} preload="auto"></audio>
      <audio ref={victoryAudioRef} src={victorySound} preload="auto"></audio>
      {stage === Stage.START ? (
        <div className="start-page">
          <h1 className="game-title">Прыжки по бревнам</h1>
          <button className="start-button" onClick={handleStartClick}>
            Начать игру
          </button>
        </div>
      ) : (
        <div
          className="wrapper"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{ outline: "none" }}
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
          
          <div className="river-container">
            <div className="water-layer" style={{
              position: "absolute",
              bottom: "80px",
              left: "0",
              width: "100%",
              height: "120px",
              background: "linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%)",
              opacity: 0.8,
              zIndex: 1,
              borderRadius: "5px",
              overflow: "hidden"
            }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div 
                  key={i} 
                  style={{
                    position: "absolute",
                    bottom: `${10 + (i % 3) * 10}px`,
                    left: `${i * 50}px`,
                    width: "100px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.3)",
                    animation: `wave ${2 + (i % 3)}s ease-in-out infinite alternate-reverse ${i * 0.1}s`
                  }}
                />
              ))}
              {fishes.map((fish, index) => (
                fish.direction === "up" && fish.y > 180 && fish.y < 190 && (
                  <div 
                    key={`splash-up-${index}`} 
                    style={{
                      position: "absolute",
                      bottom: "110px",
                      left: `${fish.x - 15}px`,
                      width: "70px",
                      height: "20px",
                      background: "rgba(255, 255, 255, 0.7)",
                      borderRadius: "50%",
                      transform: "scale(1, 0.4)",
                      zIndex: 3,
                      animation: "splash 0.5s forwards"
                    }}
                  />
                )
              ))}
              {fishes.map((fish, index) => (
                fish.direction === "down" && fish.y > 150 && fish.y < 160 && (
                  <div 
                    key={`splash-down-${index}`} 
                    style={{
                      position: "absolute",
                      bottom: "110px",
                      left: `${fish.x - 15}px`,
                      width: "70px", 
                      height: "15px",
                      background: "rgba(255, 255, 255, 0.6)",
                      borderRadius: "50%",
                      transform: "scale(1, 0.3)",
                      zIndex: 3,
                      animation: "splash 0.4s forwards"
                    }}
                  />
                )
              ))}
            </div>
            
            {logs.map((log, index) => (
              <div
                key={index}
                className="log"
                style={{
                  left: `${log.x}px`,
                  bottom: `${log.y}px`,
                  zIndex: 2
                }}
              />
            ))}
            {fishes.map((fish, index) => (
              <div
                key={index}
                className={`fish ${fish.direction}`}
                style={{
                  left: `${fish.x}px`,
                  bottom: `${fish.y}px`,
                  zIndex: 3
                }}
              />
            ))}
            <div
              className={`climber ${isJumping ? "jumping" : ""} ${isHit ? "hit" : ""} ${isInvulnerable ? "invulnerable" : ""}`}
              style={{
                left: `${climberPosition.x}px`,
                bottom: `${climberPosition.y}px`,
                opacity: isInvulnerable ? 0.5 : 1,
                zIndex: 4
              }}
            />
            <div className="finish-line" style={{ left: `${logPositions[8].x + 50}px`, bottom: "150px" }}>
              🚩
            </div>
            
            {/* Медвежонок в подводной маске и трубке возле финишного флага */}
            {logs.length > 0 && (
              <div 
                style={{
                  position: "absolute",
                  left: `${logPositions[8].x}px`,
                  bottom: "150px",
                  width: "50px",
                  height: "60px",
                  zIndex: 5
                }}
              >
                {/* Тело медвежонка */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '35px',
                  background: '#8B4513',
                  borderRadius: '50% 50% 40% 40%',
                  zIndex: 2,
                  animation: bearCelebrating ? 'bearJump 0.6s infinite' : 'none'
                }} />
                
                {/* Голова медвежонка */}
                <div style={{
                  position: 'absolute',
                  bottom: '25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '30px',
                  height: '30px',
                  background: '#8B4513',
                  borderRadius: '50%',
                  zIndex: 3,
                  animation: bearCelebrating ? 'bearJump 0.6s infinite' : 'none'
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
                  
                  {/* Подводная маска */}
                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '25px',
                    height: '15px',
                    background: 'rgba(0, 200, 255, 0.4)',
                    border: '2px solid #555',
                    borderRadius: '50%',
                    boxShadow: 'inset 0 0 5px rgba(255, 255, 255, 0.6)'
                  }} />
                  
                  {/* Глаза через маску */}
                  <div style={{
                    position: 'absolute',
                    top: '9px',
                    left: '8px',
                    width: '4px',
                    height: '4px',
                    background: 'black',
                    borderRadius: '50%',
                    zIndex: 4
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '9px',
                    right: '8px',
                    width: '4px',
                    height: '4px',
                    background: 'black',
                    borderRadius: '50%',
                    zIndex: 4
                  }} />
                </div>
                
                {/* Трубка для дыхания */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '5px',
                  width: '5px',
                  height: '25px',
                  background: '#ff6a00',
                  borderRadius: '5px',
                  transform: 'rotate(-20deg)',
                  zIndex: 1
                }} />
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  right: '0',
                  width: '12px',
                  height: '8px',
                  background: '#ff6a00',
                  borderRadius: '5px',
                  zIndex: 1
                }} />
                
                {/* Пузырьки воздуха - больше пузырьков при праздновании */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '3px',
                  width: '4px',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '50%',
                  animation: bearCelebrating ? 'moreBubbles 1.5s infinite' : 'bubbleRise 3s infinite'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '8px',
                  width: '3px',
                  height: '3px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '50%',
                  animation: bearCelebrating ? 'moreBubbles 1s infinite 0.3s' : 'bubbleRise 2.5s infinite 0.5s'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '5px',
                  width: '5px',
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '50%',
                  animation: bearCelebrating ? 'moreBubbles 2s infinite 0.7s' : 'bubbleRise 4s infinite 1s'
                }} />
                
                {/* Дополнительные пузырьки при праздновании */}
                {bearCelebrating && (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: '-7px',
                      right: '10px',
                      width: '6px',
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '50%',
                      animation: 'moreBubbles 1.8s infinite 0.2s'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '2px',
                      width: '4px',
                      height: '4px',
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '50%',
                      animation: 'moreBubbles 1.3s infinite 0.5s'
                    }} />
                  </>
                )}
                
                {/* Руки */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '2px',
                  width: '12px',
                  height: '20px',
                  background: '#8B4513',
                  borderRadius: '30%',
                  transform: 'rotate(-25deg)',
                  zIndex: 1,
                  animation: bearCelebrating ? 'celebrateWave 0.4s infinite' : 'none'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '2px',
                  width: '12px',
                  height: '20px',
                  background: '#8B4513',
                  borderRadius: '30%',
                  transform: 'rotate(25deg)',
                  zIndex: 1,
                  animation: bearCelebrating ? 'celebrateWaveRight 0.4s infinite' : 'none'
                }} />
                
                {/* Ноги */}
                <div style={{
                  position: 'absolute',
                  bottom: '0px',
                  left: '7px',
                  width: '10px',
                  height: '12px',
                  background: '#8B4513',
                  borderRadius: '30% 30% 50% 50%',
                  animation: bearCelebrating ? 'bearJump 0.6s infinite' : 'none'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '7px',
                  width: '10px',
                  height: '12px',
                  background: '#8B4513',
                  borderRadius: '30% 30% 50% 50%',
                  animation: bearCelebrating ? 'bearJump 0.6s infinite' : 'none'
                }} />
                
                {/* Ласты */}
                <div style={{
                  position: 'absolute',
                  bottom: '-5px',
                  left: '2px',
                  width: '18px',
                  height: '8px',
                  background: '#4d94ff',
                  borderRadius: '0 0 50% 50%',
                  transform: 'rotate(-10deg)',
                  animation: bearCelebrating ? 'finsFlap 0.3s infinite' : 'none'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-5px',
                  right: '2px',
                  width: '18px',
                  height: '8px',
                  background: '#4d94ff',
                  borderRadius: '0 0 50% 50%',
                  transform: 'rotate(10deg)',
                  animation: bearCelebrating ? 'finsFlipRight 0.3s infinite' : 'none'
                }} />
              </div>
            )}
          </div>
          <div className="game-info">
            <div className="time">Time: {time}</div>
            <div className="score">Score: {score}</div>
            <div className="lives">Lives: {"❤️".repeat(Math.max(0, lives))}</div>
            <div className="logs">Logs: {currentLogIndex}/9</div>
          </div>
          <div className="controls">
            <p>Controls:</p>
            <p>← or A - Back</p>
            <p>→ or D - Forward</p>
          </div>
          {stage === Stage.FINISH && (
            <div className="youWin">
              <div>
                {currentLogIndex === logs.length - 1
                  ? `Поздравляем! Вы прошли уровень! Ваши очки: ${score}`
                  : `Игра окончена! Набрано очков: ${score}`}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default BoatGame;
