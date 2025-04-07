import React, { useState, useEffect, useMemo, useCallback } from "react";
import gameMusic from "./audio/Rain.mp3";
import hitSound from "./audio/hit.mp3";
import victorySound from "./audio/p9.mp3";
import "../styles/Birds.css";
import "../styles/Climber.css";
import "../styles/Rocks.css";
import "../styles/Sun.css";
import "../styles/Obstacles.css";
import "../styles/StartPage.css";

enum Stage {
  START = "start",
  GAME = "game",
  FINISH = "finish",
}

interface ClimbingGameProps {
  onComplete: (finalScore: number) => void;
}

const ClimbingGame: React.FC<ClimbingGameProps> = ({ onComplete }) => {
  const lineStep: number = 129;

  const [stage, setStage] = useState<Stage>(Stage.START);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [fallingRocks, setFallingRocks] = useState<number[]>([]);
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
  const [rockSizes, setRockSizes] = useState<string[]>([]);
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
    setRockSizes([]);
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
    setRockSizes([]);
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

    fallingRocks.forEach((rockIndex) => {
      const rockPosition = topValues[rockIndex];
      const distanceY = Math.abs(
        rockPosition - (window.innerHeight - playerPosition.bottom)
      );
      const distanceX = Math.abs(400 + rockIndex * 190 - playerPosition.left);
      
      if (distanceY <= 29 && distanceX <= 29) {
        hitAudioRef.current?.play();
        setLives(lives - 1);
        setCurrentLineIndex(0);
        setTopValues(topValues.map((topValue, index) => 
          rockIndex === index ? 0 : topValue
        ));
      }
    });
  };

  const fallingRockhjh = () => {
    setTopValues(topValues.map((value, index) => {
      if (fallingRocks.includes(index)) {
        if (window.innerHeight <= value) {
          setScore(prevScore => prevScore + 5);
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
    if (stage !== Stage.GAME) return;

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
    
    if (!fallingRocks.includes(randomLineIndex)) {
      setFallingRocks([...fallingRocks, randomLineIndex]);
      setRockSizes([...rockSizes, randomSize]);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (stage === Stage.GAME) {
      interval = setInterval(() => {
        generateRandomRock();
        fallingRockhjh();
      }, 90);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [stage, fallingRocks, topValues]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (stage === Stage.GAME) {
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

      interval = setInterval(toggleVisibility, 990);
      return () => clearInterval(interval);
    }
  }, [stage, IsThirdLineVisible, isSecondLineVisible, isFirstLineVisible, currentLineIndex]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (stage === Stage.GAME && time > 0) {
      timerInterval = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    }

    if (time === 0 && stage === Stage.GAME) {
      let finalScore = score;
      setIsFinalScore(finalScore);
      if (finalScore > savedScores) {
        setSavedScores(finalScore);
      }
      setStage(Stage.FINISH);
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setTimeout(() => {
        onComplete(finalScore); // Передаём финальный счёт
        resetGame();
      }, 3000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [stage, time, score, savedScores, onComplete]);

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
      {stage === Stage.START ? (
        <div className="start-page">
          <div className="floating-snowflakes">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="start-snowflake"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              >
                ❄️
              </div>
            ))}
          </div>
          <h1 className="game-title">Восхождение на вершину</h1>
          <div className="scores">Лучший счет: {savedScores}</div>
          <button className="start-button" onClick={handleStartClick}>
            Начать игру
          </button>
        </div>
      ) : (
        <div
          className="wrapper"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          autoFocus
          style={{ outline: 'none' }}
        >
          <div className="snow-container">
            {Array.from({ length: 19 }).map((_, index) => (
              <div key={index} className="snowflake">
                ❄️
              </div>
            ))}
          </div>
          <div className="sun-container">
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
          <div className="birds-container">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bird" />
            ))}
          </div>
          <img className="mountains" src="/img/mountains.png" alt="mountains" />
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
          <div 
            style={{
              position: "absolute",
              left: `${400 + 4 * 190 - 50}px`,
              bottom: `${4 * lineStep + 30}px`,
              width: "45px",
              height: "55px",
              zIndex: 2,
            }}
          >
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
              zIndex: 2,
              animation: bearJumping ? 'bearJump 0.6s infinite' : 'none'
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
              zIndex: 3,
              animation: bearJumping ? 'bearJump 0.6s infinite' : 'none'
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
            </div>
            
            {/* Руки */}
            <div style={{
              position: 'absolute',
              top: '25px',
              left: '2px',
              width: '12px',
              height: '20px',
              background: '#8B4513',
              borderRadius: '30%',
              transform: 'rotate(-20deg)',
              animation: bearJumping ? 'bearArmsWave 0.3s infinite' : 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: '25px',
              right: '2px',
              width: '12px',
              height: '20px',
              background: '#8B4513',
              borderRadius: '30%',
              transform: 'rotate(20deg)',
              animation: bearJumping ? 'bearArmsWaveRight 0.3s infinite' : 'none'
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
              animation: bearJumping ? 'bearJump 0.6s infinite' : 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '0px',
              right: '7px',
              width: '10px',
              height: '12px',
              background: '#8B4513',
              borderRadius: '30% 30% 50% 50%',
              animation: bearJumping ? 'bearJump 0.6s infinite' : 'none'
            }} />
          </div>
          
          <div className="list">z вперед, x назад</div>
          <div className="colnse"></div>

          {fallingRocks.map((rockIndex, index) => (
            <div
              key={index}
              className={`falling-rock ${rockSizes[index] || 'medium'}`}
              style={{
                left: `${400 + rockIndex * 190}px`,
                top: `${topValues[rockIndex]}px`,
              }}
            >
              <div className="rock-shadow" />
            </div>
          ))}

          {!IsThirdLineVisible && (
            <div
              className="obstacle"
              style={{
                left: `${400 + 2 * 190}px`,
                bottom: `${2 * lineStep}px`,
              }}
            >
              <div className="obstacle-warning">Опасно</div>
            </div>
          )}
          {!isSecondLineVisible && (
            <div
              className="obstacle"
              style={{
                left: `${400 + 1 * 190}px`,
                bottom: `${1 * lineStep}px`,
              }}
            >
              <div className="obstacle-warning">Опасно</div>
            </div>
          )}
          {!isFirstLineVisible && (
            <div
              className="obstacle"
              style={{
                left: `${400 + 3 * 190}px`,
                bottom: `${3 * lineStep}px`,
              }}
            >
              <div className="obstacle-warning">Опасно</div>
            </div>
          )}
          <div
            className={`climber ${isMoving ? 'moving' : ''}`}
            style={{
              left: `${playerPosition.left}px`,
              bottom: `${playerPosition.bottom}px`,
            }}
          />

          {stage === Stage.FINISH && (
            <div className="youWin">
              <div>
                {currentLineIndex === 4
                  ? `Вы победитель! Ваши очки: ${isFinalScore}`
                  : `Игра окончена! Набрано очков: ${isFinalScore}`}
              </div>
            </div>
          )}
          <div
            className="time"
            style={{ top: "49px", left: "68px", color: "orange", fontSize: "24px" }}
          >
            Time: {time}
          </div>
          <div
            className="score"
            style={{ top: "49px", right: "30px", color: "orange", fontSize: "24px" }}
          >
            Score: {stage === Stage.FINISH ? isFinalScore : score}
          </div>
          <div
            className="lives"
            style={{ top: "49px", right: "30px", color: "orange", fontSize: "24px" }}
          >
            Lives: {lives}
          </div>
        </div>
      )}
    </>
  );
};

export default ClimbingGame;
