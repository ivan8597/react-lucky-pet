import React, { useState, useEffect, useMemo } from "react";
import gameMusic from "./audio/Rain.mp3";
import hitSound from "./audio/hit.mp3";
import victorySound from "./audio/p9.mp3";
enum Stage {
  START = "start",
  GAME = "game",
  FINISH = "finish",
}
const ClimbingGame: React.FC = () => {
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0); // Индекс текущей видимой линии
  const [fallingRocks, setFallingRocks] = useState<number[]>([]); // Список падающих камней
  const [score, setScore] = useState<number>(0);
  const [topValues, setTopValues] = useState<number[]>([100, 0, 200, 0, 0]); // Список вертикальных позиций камней
  const [IsThirdLineVisible, setIsThirdLineVisible] = useState<boolean>(false);
  const [isSecondLineVisible, setIsSecondLineVisible] =
    useState<boolean>(false);
  const [isFirstLineVisible, setIsFirstLineVisible] = useState<boolean>(false);
  // const [isFinished, setIsFinished] = useState<boolean>(false);
  const lineStep: number = 129; // Расстояние между линиями
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [savedScores, setSavedScores] = useState<number>(0);
  const [stage, setStage] = useState<Stage>(Stage.START);
  const [isFinalScore, setIsFinalScore] = useState<number>(0);
  const [time, setTime] = useState<number>(49);

  const [lives, setLives] = useState<number>(3);

  const audioRef = React.createRef<HTMLAudioElement>();
  const hitAudioRef = React.createRef<HTMLAudioElement>();
  const victoryAudioRef = React.createRef<HTMLAudioElement>();
  const playerPosition = useMemo(() => {
    return {
      bottom: (currentLineIndex + 1) * lineStep,
      left: 400 + currentLineIndex * 190,
    };
  }, [currentLineIndex]);

  ////////////////////////////////

  const resetGame = () => {
    setCurrentLineIndex(0);
    setFallingRocks([]);
    setTopValues([100, 0, 200, 0, 0]);
    // setIsFinished(false);
    setStage(Stage.START);
    setScore(0);
    setIsGameStarted(false);
    setIsFinalScore(0);
    setTime(49);
    setLives(3);
    setIsThirdLineVisible(false);
    setIsSecondLineVisible(false);
    setIsFirstLineVisible(false);
  };

  const handleStart = () => {
    resetGame();
    setIsGameStarted(true);
    setTimeout(() => {
      setStage(Stage.GAME);
    }, 300);
    // setTime(49);
  };

  const checkPlayerCollisionWithRock = () => {
    // Проверяем столкновение игрока с камнями
    fallingRocks.forEach((rockIndex) => {
      const rockPosition = topValues[rockIndex];

      const distanceY = Math.abs(
        rockPosition - (window.innerHeight - playerPosition.bottom)
      );
      const distanceX = Math.abs(400 + rockIndex * 190 - playerPosition.left);
      if (distanceY <= 29 && distanceX <= 29) {
        hitAudioRef.current?.play();

        setLives((prevLives) => {
          if (prevLives === 0) {
            resetGame();
            audioRef.current?.pause();
            return 0;
          }

          return prevLives - 1; // Уменьшаем количество жизней
        });

        setCurrentLineIndex(0); // Возвращаем игрока в начало

        setTopValues(
          // Обновляем вертикальные позиции камней
          topValues.map((topValue, index) => {
            if (rockIndex === index) {
              return 0;
            } else {
              return topValue;
            }
          })
        );
      }
    });
  };

  const fallingRockhjh = () => {
    // Падение камней
    setTopValues((topValues) => {
      const updatedTopValues = topValues.map((value, index) => {
        if (fallingRocks.includes(index)) {
          if (window.innerHeight <= value) {
            return 0;
          }
          return value + 29;
        } else {
          return 0;
        }
      });

      fallingRocks.forEach((rockIndex) => {
        const rockPosition = updatedTopValues[rockIndex];
        const distanceY = Math.abs(400 + rockIndex * 190 - playerPosition.left);
        if (distanceY <= 29 && rockPosition === 0) {
          setScore((prevscore) => prevscore + 1);
        }
      });
      return updatedTopValues;
    });
    checkPlayerCollisionWithRock();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "x" || (event.key === "ч" && currentLineIndex < 4)) {
      if (
        (currentLineIndex === 2 && IsThirdLineVisible) ||
        (currentLineIndex === 1 && isSecondLineVisible) ||
        (currentLineIndex === 3 && isFirstLineVisible)
      ) {
        return;
      }
      setCurrentLineIndex(currentLineIndex + 1);
    } else if (
      event.key === "z" ||
      (event.key === "я" && currentLineIndex > 0)
    ) {
      setCurrentLineIndex(currentLineIndex - 1);
    }
  };

  const generateRandomRock = () => {
    // Генерация случайных камней
    const randomLineIndex = Math.floor(Math.random() * 5);
    setFallingRocks((fallingRocks) =>
      fallingRocks.includes(randomLineIndex)
        ? fallingRocks
        : [...fallingRocks, randomLineIndex]
    );
  };
  ////////////////////////////
  useEffect(() => {
    // Сброс игры

    resetGame();
  }, []);

  // useEffect(() => {
  //   const saved = localStorage.getItem("score");
  //   if (saved && stage === Stage.FINISH) {
  //     setSavedScores(JSON.parse(saved));
  //   } else if (saved && stage === Stage.GAME) {
  //     setSavedScores(0);
  //   }
  // }, [stage]);

  useEffect(() => {
    const saved = localStorage.getItem("score");
    if (saved && stage === Stage.FINISH) {
        let finalSavedScore = JSON.parse(saved);
        if (lives === 3) {
            finalSavedScore = Math.floor(finalSavedScore * 3); 
        }
        setSavedScores(finalSavedScore); 
    } else if (saved && stage === Stage.GAME) {
        setSavedScores(0); 
    }
}, [stage, lives]);

  useEffect(() => {
    localStorage.setItem("score", JSON.stringify(score));
  }, [score]);
  useEffect(() => {
    //Таймер
    let timer: NodeJS.Timeout;
    if (stage === Stage.GAME && time > 0) {
      timer = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
      audioRef.current?.play();
    } else if (time === 0 || stage === Stage.FINISH) {
      setStage(Stage.FINISH);
      audioRef.current?.pause();
      setTimeout(() => {
        resetGame();
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [stage]);
  useEffect(() => {
    if (stage === Stage.START) {
      return;
    }
    let interval = setInterval(() => {
      if (stage === Stage.FINISH) {
        clearInterval(interval);
        setFallingRocks([]);
        return;
      }
      generateRandomRock();
      fallingRockhjh();
    }, 90); // Измените интервал по необходимости

    return () => clearInterval(interval);
  }, [generateRandomRock, stage]);

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
        setIsThirdLineVisible((prev) => !prev); // Переключение видимости
        setIsSecondLineVisible((prev) => !prev);
        setIsFirstLineVisible((prev) => !prev);
      };

      interval = setInterval(toggleVisibility, 990); // Каждые 9 секунд переключаем видимость

      return () => clearInterval(interval); // Очистка интервала при размонтировании или изменении состояния
    }
  }, [
    stage,
    IsThirdLineVisible,
    isSecondLineVisible,
    isFirstLineVisible,
    currentLineIndex,
  ]);

  useEffect(() => {
    // Проверка окончания игры
    if (currentLineIndex === 4) {
      let finalScore = score;
      if (lives === 3) {
        finalScore = Math.floor(finalScore * 3);
      }
      setIsFinalScore(finalScore);
      setStage(Stage.FINISH);
      victoryAudioRef.current?.play();
    }
  }, [currentLineIndex, score]);

  ////////////////////////////////////////////////////
  const climberStyle: React.CSSProperties = {
    left: `${playerPosition.left}px`,
    bottom: `${playerPosition.bottom}px`,
    position: "absolute",
  };

  return (
    <>
      <audio
        ref={hitAudioRef}
        src={hitSound}
        preload="auto"
        autoPlay={false}
      ></audio>
      <audio ref={audioRef} src={gameMusic} autoPlay={false} loop />
      {!isGameStarted ? (
        <div className="start-page">
          <div className="scores">Scores:{savedScores} </div>
          <button onClick={handleStart}>Start</button>
        </div>
      ) : (
        <div className="wrapper" tabIndex={0} onKeyDown={handleKeyDown}>
          <audio
            ref={victoryAudioRef}
            src={victorySound}
            preload="auto"
            autoPlay={false}
          ></audio>

          <div className="snow-container">
            {Array.from({ length: 19 }).map((_, index) => (
              <div key={index} className="snowflake">
                ❄️
              </div>
            ))}
          </div>
          <img className="mountains" src="/img/mountains.png" alt="mountains" />
          <div className="list">z вперед, x назад</div>
          <div className="colnse"></div>

          {fallingRocks.map((rockIndex, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${400 + rockIndex * 190}px`,
                top: `${topValues[rockIndex]}px`,
                backgroundColor: "brown",
                width: "50px",
                height: "50px",
              }}
            >
              Камень
            </div>
          ))}

          {!IsThirdLineVisible && (
            <div
              style={{
                left: `${400 + 2 * 190}px`,
                bottom: `${2 * lineStep}px`,
                backgroundColor: "yellow",
                position: "absolute",
              }}
            >
              Препятствие
            </div>
          )}
          {!isSecondLineVisible && (
            <div
              style={{
                left: `${400 + 1 * 190}px`,
                bottom: `${1 * lineStep}px`,
                backgroundColor: "yellow",
                position: "absolute",
              }}
            >
              Препятствие
            </div>
          )}
          {!isFirstLineVisible && (
            <div
              style={{
                left: `${400 + 3 * 190}px`,
                bottom: `${3 * lineStep}px`,
                backgroundColor: "yellow",
                position: "absolute",
              }}
            >
              Препятствие
            </div>
          )}
          <img
            className="climber"
            src="/img/climber.png"
            alt="climber"
            style={climberStyle}
          />

          {stage === Stage.FINISH && (
            <div className="youWin">
              Вы победитель! Ваши очки:{isFinalScore}
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
