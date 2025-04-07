import React, { useState } from "react";
import ClimbingGame from "./components/ClimbingGame.tsx";
import BoatGame from "./components/BoatGame.tsx";
import CoinClimbingGame from "./components/CoinClimbingGame.tsx"; // Новый компонент
import "./App.css";

enum Level {
  LEVEL1 = "level1",
  LEVEL2 = "level2",
  LEVEL3 = "level3", // Добавляем третий уровень
}

function App() {
  const [currentLevel, setCurrentLevel] = useState<Level>(Level.LEVEL1);
  const [level1Score, setLevel1Score] = useState<number>(0);
  const [level2Complete, setLevel2Complete] = useState<boolean>(false); // Отслеживаем завершение второго уровня

  const handleLevel1Complete = (finalScore: number) => {
    setLevel1Score(finalScore);
    if (finalScore >= 90) {
      setCurrentLevel(Level.LEVEL2);
    }
  };

  const handleLevel2Complete = () => {
    setLevel2Complete(true);
    setCurrentLevel(Level.LEVEL3); // Переход на третий уровень
  };

  return (
    <div className="App">
      {currentLevel === Level.LEVEL1 ? (
        <ClimbingGame onComplete={handleLevel1Complete} />
      ) : currentLevel === Level.LEVEL2 ? (
        <BoatGame onComplete={handleLevel2Complete} />
      ) : (
        <CoinClimbingGame />
      )}
    </div>
  );
}

export default App;