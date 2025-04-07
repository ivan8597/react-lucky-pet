import React, { useState, useEffect } from "react";
import "../styles/Climber.css";
import "../styles/Obstacles.css";
import "../styles/Sun.css";
import RainSound from "../components/audio/Rain.mp3";

enum Stage {
  START = "start",
  GAME = "game",
  FINISH = "finish",
}

interface CoinClimbingGameProps {
  onComplete?: () => void;
}

const CoinClimbingGame: React.FC<CoinClimbingGameProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<Stage>(Stage.START);
  const [climber, setClimber] = useState({ x: 50, y: 450, isJumping: false });
  const [lives, setLives] = useState(3);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
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
  const [audio] = useState(new Audio(RainSound));
  const [logs, setLogs] = useState([
    { x: 200, y: 350 },
    { x: 500, y: 350 },
    { x: 800, y: 350 },
  ]);
  const grassBlades = React.useMemo(() => 
    Array.from({ length: 100 }).map(() => ({
      height: 20 + Math.random() * 30,
      rotation: -5 + Math.random() * 10
    })), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || victory) return;

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
            
            if (jumpHeight <= 200) {
              newY = prev.y - 20;
            } else {
              newY = prev.y + 10;
              
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
  }, [climber.isJumping, gameOver, victory, pressedKeys]);

  useEffect(() => {
    if (gameOver || victory) return;

    const gameLoop = setInterval(() => {
      setSpiders((prev) =>
        prev.map((spider) => {
          let newX = spider.x + spider.speed;
          if (newX <= 0 || newX >= 950) {
            return { ...spider, x: newX, speed: -spider.speed };
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

      if (coins.every((coin) => coin.collected)) {
        setVictory(true);
        audio.pause();
        audio.currentTime = 0;
      }
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [climber.x, climber.y, spiders, coins, gameOver, victory, lives, isInvulnerable, audio]);

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

  const collectedCoins = coins.filter((coin) => coin.collected).length;

  const handleStartClick = () => {
    setStage(Stage.GAME);
    setClimber({ x: 50, y: 450, isJumping: false });
    setLives(3);
    setIsInvulnerable(false);
    setGameOver(false);
    setVictory(false);
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

  return (
    <div>
      {stage === Stage.START ? (
        <div className="start-page">
          <h1 className="game-title">Сбор монет</h1>
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
          
          <div style={{ 
            position: "absolute", 
            top: 10, 
            left: 10, 
            color: "white", 
            fontSize: "24px",
            display: "flex",
            gap: "20px"
          }}>
            <div>Монеты: {collectedCoins}/9</div>
            <div>Жизни: {"❤️".repeat(Math.max(0, lives))}</div>
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

          {spiders.map((spider, index) => (
            <div
              key={index}
              className="spider"
              style={{
                left: spider.x,
                top: spider.y,
              }}
            />
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
        </div>
      )}
    </div>
  );
};

export default CoinClimbingGame;