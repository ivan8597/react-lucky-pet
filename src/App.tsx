import React, { useState, createContext } from "react";
import ClimbingGame from "./components/ClimbingGame.tsx";
import BoatGame from "./components/BoatGame.tsx";
import CoinClimbingGame from "./components/CoinClimbingGame.tsx"; // Новый компонент
import "./App.css";

// Создаем контекст паузы
export const PauseContext = createContext<{
  isPaused: boolean;
  togglePause: () => void;
}>({
  isPaused: false,
  togglePause: () => {},
});

enum Level {
  LEVEL1 = "level1",
  LEVEL2 = "level2",
  LEVEL3 = "level3", // Добавляем третий уровень
}

function App() {
  const [currentLevel, setCurrentLevel] = useState<Level>(Level.LEVEL1);
  const [level1Score, setLevel1Score] = useState<number>(0);
  const [level2Complete, setLevel2Complete] = useState<boolean>(false); // Отслеживаем завершение второго уровня
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

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
    <PauseContext.Provider value={{ isPaused, togglePause }}>
      <div className="App">
        {currentLevel === Level.LEVEL1 ? (
          <ClimbingGame onComplete={handleLevel1Complete} />
        ) : currentLevel === Level.LEVEL2 ? (
          <BoatGame onComplete={handleLevel2Complete} />
        ) : (
          <CoinClimbingGame />
        )}
        
        {/* Кнопка паузы */}
        <button 
          className="pause-button" 
          onClick={togglePause}
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            zIndex: 1000
          }}
        >
          {isPaused ? 'Продолжить' : 'Пауза'}
        </button>
      </div>
    </PauseContext.Provider>
  );
}

export default App;