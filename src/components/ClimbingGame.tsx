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

const ClimbingGame: React.FC = () => {
  const lineStep: number = 129;

  const [stage, setStage] = useState<Stage>(Stage.START);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [fallingRocks, setFallingRocks] = useState<number[]>([]);
  const [score, setScore] = useState<number>(0);
  const [topValues, setTopValues] = useState<number[]>([100, 0, 200, 0, 0]);
  const [isThirdLineVisible, setIsThirdLineVisible] = useState<boolean>(false);
  const [isSecondLineVisible, setIsSecondLineVisible] = useState<boolean>(false);
  const [isFirstLineVisible, setIsFirstLineVisible] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [time, setTime] = useState<number>(49);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [savedScores, setSavedScores] = useState<number>(0);
  const [isFinalScore, setIsFinalScore] = useState<number>(0);
  const [rockSizes, setRockSizes] = useState<string[]>([]);

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
    if (stage !== Stage.GAME) {
      return;
    }

    if (event.key === "x" || event.key === "ч") {
      if (currentLineIndex >= 4) {
        return;
      }
      if (
        (currentLineIndex === 2 && isThirdLineVisible) ||
        (currentLineIndex === 1 && isSecondLineVisible) ||
        (currentLineIndex === 3 && isFirstLineVisible)
      ) {
        return;
      }
      setIsMoving(true);
      setCurrentLineIndex(currentLineIndex + 1);
      setScore(prevScore => prevScore + 10);
    } else if (event.key === "z" || event.key === "я") {
      if (currentLineIndex <= 0) {
        return;
      }
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
          (!isThirdLineVisible && currentLineIndex === 2) ||
          (!isSecondLineVisible && currentLineIndex === 1) ||
          (!isFirstLineVisible && currentLineIndex === 3)
        ) {
          setCurrentLineIndex(0);
        }
        setIsThirdLineVisible(!isThirdLineVisible);
        setIsSecondLineVisible(!isSecondLineVisible);
        setIsFirstLineVisible(!isFirstLineVisible);
      };

      interval = setInterval(toggleVisibility, 990);

      return () => clearInterval(interval);
    }
  }, [stage, isThirdLineVisible, isSecondLineVisible, isFirstLineVisible, currentLineIndex]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;

    if (stage === Stage.GAME && time > 0) {
      timerInterval = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    }

    if (time === 0 && stage === Stage.GAME) {
      let finalScore = score; // Сохраняем очки при истечении времени
      setIsFinalScore(finalScore);
      if (finalScore > savedScores) {
        setSavedScores(finalScore);
      }
      setStage(Stage.FINISH);
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setTimeout(() => {
        resetGame();
      }, 3000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [stage, time, score, savedScores]);

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
      victoryAudioRef.current?.play();
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      
      setTimeout(() => {
        resetGame();
      }, 3000);
    }
  }, [currentLineIndex, score, lives, savedScores]);

  useEffect(() => {
    if (lives === 0) {
      setIsFinalScore(0); // Обнуляем очки при потере всех жизней
      if (0 > savedScores) { // Сравниваем с 0, так как очки обнуляются
        setSavedScores(0);
      }
      setStage(Stage.FINISH);
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setTimeout(() => {
        resetGame();
      }, 3000);
    }
  }, [lives, savedScores]);

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
      <audio
        ref={hitAudioRef}
        src={hitSound}
        preload="auto"
      ></audio>
      <audio 
        ref={audioRef} 
        src={gameMusic} 
        loop 
      />
      <audio
        ref={victoryAudioRef}
        src={victorySound}
        preload="auto"
      ></audio>
      {stage === Stage.START ? (
        <div className="start-page">
          <div className="floating-snowflakes">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="start-snowflake"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`
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
                  animation: `ray-pulse 2s infinite alternate ${index * 0.2}s`
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
              zIndex: 2
            }}
          >
            🚩
          </div>
          <div className="list">z вперед, x назад</div>
          <div className="colnse"></div>

          {fallingRocks.map((rockIndex, index) => (
            <div key={index} className={`falling-rock ${rockSizes[index] || 'medium'}`}
              style={{
                left: `${400 + rockIndex * 190}px`,
                top: `${topValues[rockIndex]}px`,
              }}
            >
              <div className="rock-shadow" />
            </div>
          ))}

          {!isThirdLineVisible && (
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
                  : `Игра окончена! Набрано очков: ${isFinalScore}`
                }
              </div>
            </div>
          )}
          <div
            className="time"
            style={{
              top: "49px",
              left: "68px",
              color: "orange",
              fontSize: "24px",
            }}
          >
            Time: {time}
          </div>

          <div
            className="score"
            style={{
              top: "49px",
              right: "30px",
              color: "orange",
              fontSize: "24px",
            }}
          >
            Score: {stage === Stage.FINISH ? isFinalScore : score}
          </div>

          <div
            className="lives"
            style={{
              top: "49px",
              right: "30px",
              color: "orange",
              fontSize: "24px",
            }}
          >
            Lives: {lives}
          </div>
        </div>
      )}
    </>
  );
};

export default ClimbingGame;