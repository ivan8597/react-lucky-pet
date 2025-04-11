import React, { useState, useEffect, useCallback, useContext, useRef, useMemo } from "react";
import { motion, AnimatePresence, Variants, useAnimation } from "framer-motion";
import hitSound from "./audio/hit.mp3";
import victorySound from "./audio/p9.mp3";
import RainSound from "./audio/Rain.mp3";
import coinSound from "./audio/monetyi.mp3";
import "../styles/Boat.css";
import "../styles/Sun.css";
import "../styles/StartPage.css";
import { PauseContext } from "../App.tsx";
import { StartScreen } from "./StartScreen.tsx";
import { EndScreen } from "./EndScreen.tsx";

enum Stage {
  START = "start",
  GAME = "game",
  FINISH = "finish",
}

interface BoatGameProps {
  onComplete?: () => void;
}

type Fish = {
  x: number;
  y: number;
  direction: "up" | "down";
  lastJumpTime: number;
  jumpInterval: number;
  isDangerous?: boolean;
  logIndex?: number;
  isSafeState?: boolean;
  lastStateChangeTime?: number;
};

type DecorativeFish = {
  id: number;
  x: number;
  y: number;
  direction: "left" | "right";
  speed: number;
  size: number;
  color: string;
  isDangerous?: boolean;
};

// Варианты анимаций для разных элементов
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

// Варианты анимации для альпиниста
const climberVariants: Variants = {
  idle: {
    y: [0, -3, 0],
    transition: {
      y: { 
        repeat: Infinity, 
        duration: 2, 
        ease: "easeInOut" 
      }
    }
  },
  jumping: {
    scale: [1, 1.15, 1],
    y: [0, 15, 0],
    transition: {
      duration: 0.6,
      times: [0, 0.5, 1],
      ease: ["easeOut", "easeIn"]
    }
  },
  falling: {
    rotate: [0, -10, 10, -10, 0],
    transition: {
      duration: 0.8,
      ease: "easeInOut"
    }
  },
  hit: {
    scale: [1, 0.8, 1],
    rotate: [0, 5, -5, 5, 0],
    transition: {
      duration: 0.5
    }
  }
};

const BoatGame: React.FC<BoatGameProps> = ({ onComplete }): JSX.Element => {
  const { isPaused } = useContext(PauseContext);
  const [stage, setStage] = useState<Stage>(Stage.START);
  const [currentLogIndex, setCurrentLogIndex] = useState<number>(0);
  const [logs, setLogs] = useState<{ x: number; y: number; visible: boolean }[]>([]);
  const [climberPosition, setClimberPosition] = useState<{ x: number; y: number }>({ x: 0, y: 100 });
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [decorativeFishes, setDecorativeFishes] = useState<DecorativeFish[]>([]);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [time, setTime] = useState<number>(60);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [isHit, setIsHit] = useState<boolean>(false);
  const [isInvulnerable, setIsInvulnerable] = useState<boolean>(false);
  const [audio] = useState(() => new Audio(RainSound));
  const [bearCelebrating, setBearCelebrating] = useState<boolean>(false);
  const [boats, setBoats] = useState<{ x: number; y: number; direction: number; bananasThrown: number }[]>([]);
  const [bananas, setBananas] = useState<{ x: number; y: number; rotation: number }[]>([]);
  const [throwingTime, setThrowingTime] = useState<number>(9);
  const [lastThrowTime, setLastThrowTime] = useState<number>(0);
  const [coins, setCoins] = useState<{ x: number; y: number; rotation: number; collected: boolean }[]>([]);
  const [coinsCollected, setCoinsCollected] = useState<number>(0);
  const [lastCoinThrowTime, setLastCoinThrowTime] = useState<number>(0);
  const [savedScores, setSavedScores] = useState<number>(0);

  const hitAudioRef = React.createRef<HTMLAudioElement>();
  const victoryAudioRef = React.createRef<HTMLAudioElement>();
  const coinAudioRef = React.createRef<HTMLAudioElement>();

  const logPositions = Array.from({ length: 9 }, (_, i) => ({
    x: 100 + i * 200,
    y: 100,
  }));

  const gameContainerRef = useRef<HTMLDivElement>(null);

  const climberControls = useAnimation();

  const animateClimber = useCallback((position: { x: number; y: number }, options: any) =>
    climberControls.start({ left: `${position.x}px`, bottom: `${position.y}px`, ...options }), [climberControls]);

  // Вычисляем последнее бревно
  const lastLog = useMemo(() => 
    logs.length > 0 ? logs[logs.length - 1] : null
  , [logs]);

  const startGame = useCallback(() => {
    console.log("Начинаем игру с новой логикой исчезающих бревен");

    setStage(Stage.GAME);
    setClimberPosition({ x: 100, y: 100 });

    const initialLogs = logPositions.map((pos, index) => ({
      ...pos,
      visible: true
    }));
    console.log("Начальные бревна:", initialLogs);
    setLogs(initialLogs);
    
    // Создаем рыбок на бревнах, пропускаем первое и последнее бревно для безопасности
    const initialFishes = [];
    
    // Выбираем случайные бревна для размещения рыбок (исключая первое и последнее)
    const logIndicesForFish = Array.from({ length: logPositions.length - 2 }, (_, i) => i + 1);
    
    // Перемешиваем индексы, чтобы выбор был случайным
    for (let i = logIndicesForFish.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [logIndicesForFish[i], logIndicesForFish[j]] = [logIndicesForFish[j], logIndicesForFish[i]];
    }
    
    // Выбираем 3-4 бревна для опасных рыбок
    const dangerousFishCount = 3 + Math.floor(Math.random() * 2); // 3 или 4 опасные рыбки
    const logIndicesWithDangerousFish = logIndicesForFish.slice(0, dangerousFishCount);
    
    // Создаем рыбок на выбранных бревнах с новыми свойствами
    const currentTime = Date.now();
    logIndicesWithDangerousFish.forEach((logIndex) => {
      const log = logPositions[logIndex];
      // Случайно определяем начальное состояние (безопасное/опасное)
      const initialIsSafeState = Math.random() < 0.5;
      initialFishes.push({
        x: log.x,
        y: log.y + 25, // Размещаем рыбку чуть выше бревна
        direction: "up" as "up" | "down",
        lastJumpTime: currentTime + Math.random() * 1000,
        jumpInterval: 1500 + Math.random() * 1500,
        isDangerous: true,
        logIndex: logIndex, // Сохраняем индекс бревна, на котором находится рыбка
        isSafeState: initialIsSafeState, // Случайное начальное состояние
        lastStateChangeTime: currentTime - (initialIsSafeState 
          ? Math.random() * 9000 // Если сейчас безопасное, то оно длится уже какое-то время
          : Math.random() * 3000  // Если сейчас опасное, то оно тоже длится какое-то время
        )
      });
    });
    
    // Устанавливаем только рыбок на бревнах, убираем рыбок между бревнами
    setFishes(initialFishes);

    // Создаем декоративных рыбок в самой верхней части экрана
    const screenWidth = window.innerWidth || 1000;
    const screenHeight = window.innerHeight || 600;
    
    // Верхняя часть экрана для рыбок (от 5% до 25% высоты экрана)
    const topYStart = screenHeight * 0.05;
    const topYEnd = screenHeight * 0.25;

    const initialDecorativeFishes = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * screenWidth,
      y: topYStart + Math.random() * (topYEnd - topYStart),
      direction: Math.random() > 0.5 ? "left" as "left" : "right" as "right",
      speed: 0.5 + Math.random() * 1.5,  // Разная скорость для каждой рыбки
      size: 0.6 + Math.random() * 0.8,   // Разный размер для каждой рыбки (от 60% до 140%)
      color: ['#FF9800', '#E91E63', '#2196F3', '#4CAF50'][Math.floor(Math.random() * 4)], // Разные цвета рыбок
      isDangerous: Math.random() < 0.2,
    }));

    setDecorativeFishes(initialDecorativeFishes);
    setBoats([]);
    setBananas([]);
    setThrowingTime(9);
    setLastThrowTime(Date.now());
    setScore(0);
    setLives(3);
    setTime(60);
    setCurrentLogIndex(0);
    setIsJumping(false);
    setIsHit(false);
    setIsInvulnerable(false);

    // Дополнительная проверка
    console.log("После установки логов:", initialLogs.length);
  }, [logPositions]);

  const handleStartClick = () => {
    startGame();
  };

  const resetGame = useCallback(() => {
    setStage(Stage.START);
    setLogs([]);
    setFishes([]);
    setBoats([]);
    setBananas([]);
    setCoins([]);
    setCoinsCollected(0);
    setScore(0);
    setLives(3);
    setTime(60);
    setCurrentLogIndex(0);
    setIsJumping(false);
    setIsHit(false);
    setIsInvulnerable(false);
    setThrowingTime(9);
    setLastThrowTime(0);
  }, []);

  const checkCollision = useCallback(() => {
    if (stage !== Stage.GAME || isHit) return;

    const currentLog = logs[currentLogIndex];
    if (!currentLog) return;

    const distanceX = Math.abs(climberPosition.x - currentLog.x);
    const distanceY = Math.abs(climberPosition.y - currentLog.y);

    // Проверка падения с бревна
    if (!isJumping && (distanceX > 25 || distanceY > 25) && currentLog.visible) {
      hitAudioRef.current?.play();
      setLives(prev => prev - 1);
      setIsHit(true);
      setTimeout(() => {
        setIsHit(false);
      }, 500);
    }

    // Проверка столкновения с рыбками
    fishes.forEach((fish) => {
      const fishDistanceX = Math.abs(fish.x - climberPosition.x);
      const fishDistanceY = Math.abs(fish.y - climberPosition.y);
      const isPlayerOnLog = logs[currentLogIndex] && Math.abs(climberPosition.y - logs[currentLogIndex].y) < 10;
      const isVulnerable = !isPlayerOnLog && !isInvulnerable;
      const fishHeightThreshold = 150; // Уровень, выше которого рыбка не опасна

      // Столкновение в воде (рыбка на уровне альпиниста)
      if (
        fishDistanceX <= 50 &&
        fishDistanceY <= 50 &&
        isVulnerable &&
        !isHit &&
        fish.y <= fishHeightThreshold // Рыбка ниже или на уровне порога
      ) {
        hitAudioRef.current?.play();
        setLives(prev => {
          const newLives = Math.max(0, prev - 1);
          if (newLives <= 0) {
            setStage(Stage.FINISH);
          }
          return newLives;
        });
        setIsHit(true);
        setIsInvulnerable(true);
        setTimeout(() => {
          setIsHit(false);
          setIsInvulnerable(false);
        }, 2000);
      }

      // Столкновение при прыжке на бревно с рыбкой
      if (
        isJumping &&
        fishDistanceX <= 50 && // Рыбка близко по X
        Math.abs(fish.y - currentLog.y) < 20 && // Рыбка на уровне бревна
        fish.y <= fishHeightThreshold && // Рыбка не поднялась выше порога
        !isHit &&
        !isInvulnerable
      ) {
        hitAudioRef.current?.play();
        setLives(prev => {
          const newLives = Math.max(0, prev - 1);
          if (newLives <= 0) {
            setStage(Stage.FINISH);
          }
          return newLives;
        });
        setIsHit(true);
        setIsInvulnerable(true);
        setTimeout(() => {
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
        // Если у рыбки есть logIndex, значит она привязана к бревну
        if ('logIndex' in fish) {
          const log = logs[fish.logIndex];
          if (!log) return fish; // Защита от ошибок

          // Проверяем, нужно ли изменить состояние рыбки
          let isSafeState = fish.isSafeState;
          let lastStateChangeTime = fish.lastStateChangeTime || currentTime;
          
          if (fish.lastStateChangeTime) {
            const timeInCurrentState = currentTime - fish.lastStateChangeTime;
            
            // Если рыбка в безопасном состоянии более 9 секунд, переводим в опасное
            if (fish.isSafeState && timeInCurrentState > 9000) {
              isSafeState = false;
              lastStateChangeTime = currentTime;
            } 
            // Если рыбка в опасном состоянии более 3 секунд, переводим в безопасное
            else if (!fish.isSafeState && timeInCurrentState > 3000) {
              isSafeState = true;
              lastStateChangeTime = currentTime;
            }
          }
          
          // Рыбка всегда остается на своем бревне, но меняет высоту в зависимости от состояния
          const jumpTime = currentTime - fish.lastJumpTime;
          
          // В безопасном состоянии рыбка поднимается выше
          const baseY = log.y + 25; // Базовая высота над бревном
          const safetyOffset = isSafeState ? 40 : 0; // В безопасном состоянии рыбка поднимается выше
          
          // Амплитуда прыжков
          const jumpAmplitude = 15;
          
          if (jumpTime < fish.jumpInterval / 2) {
            // Фаза прыжка вверх
            const newY = baseY + safetyOffset + Math.sin(jumpTime / (fish.jumpInterval / 2) * Math.PI) * jumpAmplitude;
            return { 
              ...fish, 
              y: newY, 
              direction: "up", 
              isSafeState, 
              lastStateChangeTime
            };
          } else {
            // Фаза прыжка вниз
            const newY = baseY + safetyOffset + Math.sin(jumpTime / (fish.jumpInterval / 2) * Math.PI) * jumpAmplitude;
            return { 
              ...fish, 
              y: newY, 
              direction: "down", 
              isSafeState, 
              lastStateChangeTime
            };
          }
        } else {
          // Для рыбок не на бревнах - старая логика
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
        }
      })
    );
  }, [logs]);

  const moveBoats = useCallback(() => {
    setBoats(prev => prev.map(boat => {
      let newX = boat.x + boat.direction * 3;
      let newDirection = boat.direction;
      if (newX > window.innerWidth - 100) {
        newDirection = -1;
        newX = window.innerWidth - 100;
      } else if (newX < 100) {
        newDirection = 1;
        newX = 100;
      }
      return { ...boat, x: newX, direction: newDirection };
    }));
  }, []);

  // Функция для перемещения декоративных рыбок
  const moveDecorativeFishes = useCallback(() => {
    const screenWidth = window.innerWidth || 1000;
    
    setDecorativeFishes(prev => prev.map(fish => {
      // Вычисляем новую позицию в зависимости от направления и скорости
      let newX = fish.direction === "right" 
        ? fish.x + fish.speed 
        : fish.x - fish.speed;
      
      // Меняем направление, если рыбка достигла края экрана
      let newDirection = fish.direction;
      
      // Добавляем небольшую случайность для изменения направления
      if (Math.random() < 0.005) {
        newDirection = fish.direction === "left" ? "right" : "left";
      }
      
      // Проверяем, достигла ли рыбка края экрана
      if (newX > screenWidth + 50) {
        newX = -50; // Телепортируем на другую сторону экрана
      } else if (newX < -50) {
        newX = screenWidth + 50;
      }
      
      // Добавляем небольшое случайное движение по вертикали
      let newY = fish.y + (Math.random() * 2 - 1);
      
      // Ограничиваем движение по вертикали в самой верхней части экрана
      const topYStart = (window.innerHeight || 600) * 0.05;
      const topYEnd = (window.innerHeight || 600) * 0.25;
      
      newY = Math.max(topYStart, Math.min(topYEnd, newY));
      
      return {
        ...fish,
        x: newX,
        y: newY,
        direction: newDirection
      };
    }));
  }, []);

  const throwCoins = useCallback(() => {
    const currentTime = Date.now();
    const timeSinceLastThrow = (currentTime - lastCoinThrowTime) / 1000;
    const MAX_COINS = 19; // Максимальное количество монет

    // Логируем количество монет (для отладки)
    if (coins.length >= MAX_COINS) {
      console.log(`Достигнуто максимальное количество монет (${coins.length}/${MAX_COINS})`);
    }

    // Обновляем позиции существующих монет
    setCoins(prev => {
      // Проверяем, не превышает ли количество монет максимальное значение
      // Если превышает, удаляем самые старые (те, что внизу экрана)
      let movedCoins = prev.map(coin => ({
        ...coin,
        y: coin.y + (8 + Math.random() * 5) // Случайная скорость падения от 8 до 13
      }));
      
      // Отфильтровываем монеты за пределами экрана и собранные монеты
      movedCoins = movedCoins.filter(coin => coin.y < window.innerHeight && !coin.collected);
      
      // Если монет все еще слишком много, оставляем только MAX_COINS, сортируя по y (удаляем нижние)
      if (movedCoins.length > MAX_COINS) {
        movedCoins.sort((a, b) => a.y - b.y); // Сортируем по возрастанию y (сверху вниз)
        movedCoins = movedCoins.slice(0, MAX_COINS); // Оставляем только верхние монеты
      }
      
      return movedCoins;
    });

    // Создаем новые монеты каждые 1.5 секунды, если на экране меньше 19 монет
    if (timeSinceLastThrow >= 1.5 && coins.length < MAX_COINS) { // Уменьшаем время с 3 до 1.5 секунд
      setLastCoinThrowTime(currentTime);
      
      setCoins(prevCoins => {
        const newCoins = [...prevCoins];
        
        // Определяем, сколько можем добавить монет, чтобы не превысить MAX_COINS
        const coinsToAdd = Math.min(8, MAX_COINS - newCoins.length); // Увеличиваем с 5 до 8
        
        // Добавляем только нужное количество монет равномерно по экрану
        for (let i = 0; i < coinsToAdd; i++) {
          // Вместо использования позиций бревен, выбираем случайную позицию по ширине экрана
          const screenWidth = window.innerWidth || 1000;
          
          newCoins.push({
            x: 100 + Math.random() * (screenWidth - 200), // Отступаем от краев по 100px
            y: -50 - Math.random() * 100, // Разный начальный уровень по Y
            rotation: 0,
            collected: false
          });
        }
        
        return newCoins;
      });
    }
  }, [logs, lastCoinThrowTime, coins.length]);

  const checkCoinCollection = useCallback(() => {
    if (stage !== Stage.GAME) return;

    let collectedCount = 0;

    setCoins(prev => {
      const newCoins = prev.map(coin => {
        if (coin.collected) return coin;

        // Расчет расстояния между монетой и альпинистом
        const distanceX = Math.abs(coin.x - climberPosition.x);
        const distanceY = Math.abs(coin.y - climberPosition.y);
        const collisionDistance = 25; // Уменьшенный радиус столкновения для более точного касания

        if (distanceX < collisionDistance && distanceY < collisionDistance) {
          // Немедленное воспроизведение звука при касании
          if (coinAudioRef.current) {
            const coinSoundClone = new Audio(coinSound);
            coinSoundClone.volume = 0.5;
            coinSoundClone.play().catch(err => {
              console.log("Ошибка воспроизведения звука монеты:", err);
              coinAudioRef.current?.play().catch(e => 
                console.log("Не удалось воспроизвести звук:", e)
              );
            });
          }
          
          collectedCount++;
          return { ...coin, collected: true };
        }
        return coin;
      });

      // Обновляем счетчик и очки немедленно
      if (collectedCount > 0) {
        setCoinsCollected(prev => prev + collectedCount);
        setScore(prev => prev + collectedCount * 20);
      }

      // Фильтруем только несобранные монеты
      return newCoins;
    });
  }, [stage, climberPosition, coinAudioRef, coinSound]);

  // Функция для проверки столкновения с опасными рыбками
  const checkDangerousFishCollision = useCallback(() => {
    if (stage !== Stage.GAME || isHit || isInvulnerable) return;

    // Проверяем опасных рыбок в воде
    fishes.forEach((fish) => {
      if (fish.isDangerous && 
        Math.abs(climberPosition.x - fish.x) < 30 && 
        Math.abs(climberPosition.y - fish.y) < 30) {
        // Столкновение с опасной рыбкой
        hitAudioRef.current?.play();
        setIsHit(true);
        setIsInvulnerable(true);
        
        // Уменьшаем жизни
        setLives(prev => Math.max(0, prev - 1));

        // Сбрасываем состояние попадания через 1 секунду
        setTimeout(() => setIsHit(false), 1000);
        
        // Сбрасываем неуязвимость через 1 секунду после окончания состояния попадания
        setTimeout(() => setIsInvulnerable(false), 2000);
      }
    });

    // Проверяем декоративных опасных рыбок
    decorativeFishes.forEach((fish) => {
      if (fish.isDangerous && 
        Math.abs(climberPosition.x - fish.x) < 30 && 
        Math.abs(climberPosition.y - fish.y) < 40) {
        // Столкновение с опасной рыбкой-декорацией
        hitAudioRef.current?.play();
        setIsHit(true);
        setIsInvulnerable(true);
        
        // Уменьшаем жизни
        setLives(prev => Math.max(0, prev - 1));

        // Сбрасываем состояние попадания через 1 секунду
        setTimeout(() => setIsHit(false), 1000);
        
        // Сбрасываем неуязвимость через 1 секунду после окончания состояния попадания
        setTimeout(() => setIsInvulnerable(false), 2000);
      }
    });
  }, [stage, isHit, isInvulnerable, fishes, decorativeFishes, climberPosition.x, climberPosition.y]);

  useEffect(() => {
    if (stage !== Stage.GAME || isPaused) return;

    const interval = setInterval(() => {
      moveFishes();
      moveBoats();
      moveDecorativeFishes(); 
      checkCollision();
      throwCoins();
      checkCoinCollection(); 
      checkDangerousFishCollision(); 
    }, 100);

    return () => clearInterval(interval);
  }, [stage, moveFishes, moveBoats, moveDecorativeFishes, checkCollision, throwCoins, checkCoinCollection, checkDangerousFishCollision, isPaused]);

  // Обновляем варианты анимации для монет
  const coinVariants = {
    initial: { scale: 1, opacity: 1 },
    collected: {
      scale: [1, 1.3, 0], // Более плавное увеличение перед исчезновением
      opacity: [1, 1, 0],
      y: -15, // Небольшой подъем при сборе
      transition: { 
        duration: 0.25, // Ускоряем анимацию исчезновения
        ease: "easeOut"
      }
    }
  };

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (stage !== Stage.GAME) return;

      if (event.key === "Escape") {
        return;
      }

      if (isPaused || isJumping || isHit) return;

      if (event.key === "ArrowRight" || event.key === "d") {
        if (currentLogIndex < logs.length - 1) {
          const nextLog = logs[currentLogIndex + 1];
          if (nextLog.visible) {
            setIsJumping(true);

            setTimeout(() => {
              setClimberPosition({ x: nextLog.x, y: nextLog.y });
              setCurrentLogIndex(prev => prev + 1);
              setScore(prev => prev + 10);

              // Проверяем, есть ли опасная рыбка на бревне, на которое мы прыгнули
              const dangerousFishOnLog = fishes.find(
                fish => 'logIndex' in fish && 
                        fish.logIndex === currentLogIndex + 1 && 
                        fish.isDangerous &&
                        !fish.isSafeState // Проверяем, что рыбка в опасном состоянии
              );

              if (dangerousFishOnLog && !isInvulnerable) {
                hitAudioRef.current?.play();
                setLives(prev => {
                  const newLives = Math.max(0, prev - 1);
                  if (newLives <= 0) {
                    setStage(Stage.FINISH);
                  }
                  return newLives;
                });
                setIsHit(true);
                setIsInvulnerable(true);
                setTimeout(() => {
                  setIsHit(false);
                  setIsInvulnerable(false);
                }, 2000);
              }

              // Проверяем столкновение с прочими рыбками
              fishes.forEach(fish => {
                // Пропускаем рыбок, привязанных к бревнам - они проверяются отдельно выше
                if ('logIndex' in fish) return;
                
                const fishDistanceX = Math.abs(fish.x - nextLog.x);
                const fishDistanceY = Math.abs(fish.y - nextLog.y);
                const fishHeightThreshold = 150;

                if (
                  fishDistanceX <= 50 &&
                  fishDistanceY < 20 && // Рыбка на уровне бревна
                  fish.y <= fishHeightThreshold && // Рыбка не выше порога
                  !isInvulnerable
                ) {
                  hitAudioRef.current?.play();
                  setLives(prev => {
                    const newLives = Math.max(0, prev - 1);
                    if (newLives <= 0) {
                      setStage(Stage.FINISH);
                    }
                    return newLives;
                  });
                  setIsHit(true);
                  setIsInvulnerable(true);
                  setTimeout(() => {
                    setIsHit(false);
                    setIsInvulnerable(false);
                  }, 2000);
                }
              });

              setTimeout(() => {
                setIsJumping(false);
              }, 600);
            }, 300);
          } else {
            hitAudioRef.current?.play();
            setLives(prev => {
              const newLives = Math.max(0, prev - 1);
              if (newLives <= 0) {
                setStage(Stage.FINISH);
              }
              return newLives;
            });
            setIsHit(true);
            setTimeout(() => {
              setIsHit(false);
            }, 500);
          }
        }
      } else if (event.key === "ArrowLeft" || event.key === "a") {
        if (currentLogIndex > 0) {
          const prevLog = logs[currentLogIndex - 1];
          if (prevLog.visible) {
            setIsJumping(true);

            setTimeout(() => {
              setClimberPosition({ x: prevLog.x, y: prevLog.y });
              setCurrentLogIndex(prev => prev - 1);

              // Проверяем, есть ли опасная рыбка на бревне, на которое мы прыгнули
              const dangerousFishOnLog = fishes.find(
                fish => 'logIndex' in fish && 
                        fish.logIndex === currentLogIndex - 1 && 
                        fish.isDangerous &&
                        !fish.isSafeState // Проверяем, что рыбка в опасном состоянии
              );

              if (dangerousFishOnLog && !isInvulnerable) {
                hitAudioRef.current?.play();
                setLives(prev => {
                  const newLives = Math.max(0, prev - 1);
                  if (newLives <= 0) {
                    setStage(Stage.FINISH);
                  }
                  return newLives;
                });
                setIsHit(true);
                setIsInvulnerable(true);
                setTimeout(() => {
                  setIsHit(false);
                  setIsInvulnerable(false);
                }, 2000);
              }

              // Проверяем столкновение с прочими рыбками
              fishes.forEach(fish => {
                // Пропускаем рыбок, привязанных к бревнам - они проверяются отдельно выше
                if ('logIndex' in fish) return;
                
                const fishDistanceX = Math.abs(fish.x - prevLog.x);
                const fishDistanceY = Math.abs(fish.y - prevLog.y);
                const fishHeightThreshold = 150;

                if (
                  fishDistanceX <= 50 &&
                  fishDistanceY < 20 && // Рыбка на уровне бревна
                  fish.y <= fishHeightThreshold && // Рыбка не выше порога
                  !isInvulnerable
                ) {
                  hitAudioRef.current?.play();
                  setLives(prev => {
                    const newLives = Math.max(0, prev - 1);
                    if (newLives <= 0) {
                      setStage(Stage.FINISH);
                    }
                    return newLives;
                  });
                  setIsHit(true);
                  setIsInvulnerable(true);
                  setTimeout(() => {
                    setIsHit(false);
                    setIsInvulnerable(false);
                  }, 2000);
                }
              });

              setTimeout(() => {
                setIsJumping(false);
              }, 600);
            }, 300);
          } else {
            hitAudioRef.current?.play();
            setLives(prev => {
              const newLives = Math.max(0, prev - 1);
              if (newLives <= 0) {
                setStage(Stage.FINISH);
              }
              return newLives;
            });
            setIsHit(true);
            setTimeout(() => {
              setIsHit(false);
            }, 500);
          }
        }
      }
    },
    [stage, currentLogIndex, logs, isJumping, isHit, isPaused, fishes, isInvulnerable, hitAudioRef]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (stage !== Stage.GAME || isJumping || isHit || isPaused) return;

    const startX = e.touches[0].clientX;
    const handleTouchEnd = (endE: TouchEvent) => {
      const endX = endE.changedTouches[0].clientX;
      if (endX - startX > 50) {
        handleKeyDown({ key: "ArrowRight" } as React.KeyboardEvent<HTMLDivElement>);
      } else if (startX - endX > 50) {
        handleKeyDown({ key: "ArrowLeft" } as React.KeyboardEvent<HTMLDivElement>);
      }
      document.removeEventListener("touchend", handleTouchEnd);
    };
    document.addEventListener("touchend", handleTouchEnd);
  }, [stage, isJumping, isHit, isPaused, handleKeyDown]);

  useEffect(() => {
    if (stage !== Stage.GAME || isPaused) return;

    const disappearingLogIndices = [2, 4, 6];

    const logCycleInterval = setInterval(() => {
      setLogs(prevLogs => {
        const newLogs = [...prevLogs];
        disappearingLogIndices.forEach(index => {
          if (newLogs[index]) {
            newLogs[index] = { ...newLogs[index], visible: !newLogs[index].visible };
          }
        });

        if (
          disappearingLogIndices.includes(currentLogIndex) && 
          !newLogs[currentLogIndex].visible && 
          !isJumping
        ) {
          hitAudioRef.current?.play();
          setLives(prev => {
            const newLives = Math.max(0, prev - 1);
            if (newLives <= 0) {
              setStage(Stage.FINISH);
            }
            return newLives;
          });
          setIsHit(true);
          setTimeout(() => {
            const safeLogIndex = Math.max(0, currentLogIndex - 1);
            setCurrentLogIndex(safeLogIndex);
            setIsHit(false);
          }, 500);
        }
        
        return newLogs;
      });
    }, 3000);

    return () => clearInterval(logCycleInterval);
  }, [stage, isPaused, currentLogIndex, isJumping, hitAudioRef]);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout | undefined;

    if (stage === Stage.GAME && time > 0 && !isPaused) {
      timerInterval = setInterval(() => {
        setTime(prev => prev - 1);
      }, 1000);
    }

    if (time === 0 || lives === 0) {
      setStage(Stage.FINISH);
      setTimeout(() => {
        resetGame();
      }, 3000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [stage, time, lives, resetGame, isPaused]);

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
      if (isPaused) {
        audio.pause();
      } else {
        audio.loop = true;
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [stage, audio, isPaused]);

  useEffect(() => {
    if (stage === Stage.GAME && !isPaused && gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  }, [stage, isPaused]);

  useEffect(() => {
    if (stage !== Stage.GAME || isPaused || throwingTime <= 0) return;

    const bananaTimer = setInterval(() => {
      setThrowingTime(prev => prev - 1);
    }, 1000);

    return () => clearInterval(bananaTimer);
  }, [stage, isPaused, throwingTime]);

  useEffect(() => {
    if (stage === Stage.GAME && coinsCollected >= 9 && currentLogIndex === logs.length - 1) {
      console.log("Условие победы выполнено:", { coinsCollected, currentLogIndex, logLength: logs.length });
      setBearCelebrating(true);
      setStage(Stage.FINISH);
      victoryAudioRef.current?.play();
      setTimeout(() => {
        onComplete?.();
      }, 3000);
    }
  }, [stage, coinsCollected, currentLogIndex, logs.length, onComplete]);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('boatGameHighScore');
    if (savedHighScore) {
      setSavedScores(parseInt(savedHighScore));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('boatGameHighScore', savedScores.toString());
  }, [savedScores]);

  // Инициализация аудио
  useEffect(() => {
    // Функция для предзагрузки и инициализации аудио
    const initAudio = () => {
      // Загружаем все звуки при первом взаимодействии пользователя
      if (hitAudioRef.current) {
        hitAudioRef.current.load();
        hitAudioRef.current.volume = 0.5;
      }
      
      if (victoryAudioRef.current) {
        victoryAudioRef.current.load();
        victoryAudioRef.current.volume = 0.5;
      }
      
      if (coinAudioRef.current) {
        coinAudioRef.current.load();
        coinAudioRef.current.volume = 0.5;
      }
      
      console.log("Аудио инициализировано");
    };

    // Инициализируем звуки
    initAudio();
    
    // Также добавляем обработку событий для мобильных устройств
    const handleUserInteraction = () => {
      initAudio();
      // Удаляем обработчики после первого взаимодействия
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
    
    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [hitAudioRef, victoryAudioRef, coinAudioRef]);

  // Добавляем стили в начало файла после импортов
  const styles = `
    .start-page {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(180deg, #87CEEB 0%, #1E90FF 100%);
      color: white;
      text-align: center;
      padding: 20px;
    }

    .game-title {
      font-size: 48px;
      margin-bottom: 30px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    .scores {
      font-size: 24px;
      margin-bottom: 20px;
      color: #FFD700;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    }

    .instructions {
      margin-bottom: 30px;
      font-size: 18px;
      line-height: 1.5;
    }

    .instructions p {
      margin: 10px 0;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    }

    .start-button {
      padding: 15px 30px;
      font-size: 24px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }

    .start-button:hover {
      background: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
    }

    .floating-snowflakes {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }

    .start-snowflake {
      position: absolute;
      font-size: 24px;
      pointer-events: none;
      z-index: 2;
    }
    
    /* Стили для медвежонка */
    .bear {
      position: absolute;
      width: 80px;
      height: 100px;
      z-index: 10;
    }
    
    /* Голова медвежонка */
    .bear::before {
      content: '';
      position: absolute;
      width: 60px;
      height: 60px;
      background: #8B4513;
      border-radius: 50%;
      top: 10px;
      left: 10px;
    }
    
    /* Тело медвежонка */
    .bear::after {
      content: '';
      position: absolute;
      width: 50px;
      height: 60px;
      background: #8B4513;
      border-radius: 25px;
      bottom: 0;
      left: 15px;
    }
    
    /* Лапы медвежонка */
    .bear-paws::before,
    .bear-paws::after {
      content: '';
      position: absolute;
      width: 15px;
      height: 20px;
      background: #8B4513;
      border-radius: 8px;
      bottom: 5px;
    }
    
    .bear-paws::before {
      left: 8px;
      transform: rotate(-10deg);
    }
    
    .bear-paws::after {
      right: 8px;
      transform: rotate(10deg);
    }
    
    /* Верхние лапы (руки) */
    .bear-arms::before,
    .bear-arms::after {
      content: '';
      position: absolute;
      width: 12px;
      height: 25px;
      background: #8B4513;
      border-radius: 6px;
      top: 35px;
    }
    
    .bear-arms::before {
      left: 5px;
      transform: rotate(15deg);
    }
    
    .bear-arms::after {
      right: 5px;
      transform: rotate(-15deg);
    }
    
    /* Анимация плавания лапами */
    @keyframes swimPaws {
      0%, 100% { transform: rotate(-10deg); }
      50% { transform: rotate(10deg); }
    }
    
    @keyframes swimArms {
      0%, 100% { transform: rotate(15deg); }
    50% { transform: rotate(30deg); }
    }
    
    .bear-paws::before {
      animation: swimPaws 1.5s ease-in-out infinite;
    }
    
    .bear-paws::after {
      animation: swimPaws 1.5s ease-in-out infinite reverse;
    }
    
    .bear-arms::before {
      animation: swimArms 1.5s ease-in-out infinite;
    }
    
    .bear-arms::after {
      animation: swimArms 1.5s ease-in-out infinite reverse;
    }
    
    /* Уши */
    .bear-ears::before,
    .bear-ears::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background: #8B4513;
      border-radius: 50%;
      top: 5px;
    }
    
    .bear-ears::before {
      left: 15px;
    }
    
    .bear-ears::after {
      right: 15px;
    }
    
    /* Маска для плавания */
    .bear-mask {
      position: absolute;
      width: 50px;
      height: 30px;
      background: #00CED1;
      border: 3px solid #008B8B;
      border-radius: 15px;
      top: 25px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
    }
    
    /* Стекла маски */
    .bear-mask::before,
    .bear-mask::after {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      background: rgba(255, 255, 255, 0.6);
      border: 2px solid #008B8B;
      border-radius: 50%;
      top: 4px;
    }
    
    .bear-mask::before {
      left: 4px;
    }
    
    .bear-mask::after {
      right: 4px;
    }
    
    /* Мордочка медвежонка */
    .bear-face {
      position: absolute;
      width: 40px;
      height: 30px;
      background: #D2B48C;
      border-radius: 50%;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
    }
    
    /* Глаза медвежонка */
    .bear-face::before,
    .bear-face::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: #000;
      border-radius: 50%;
      top: 10px;
    }
    
    .bear-face::before {
      left: 10px;
    }
    
    .bear-face::after {
      right: 10px;
    }
    
    /* Нос */
    .bear-nose {
      position: absolute;
      width: 12px;
      height: 8px;
      background: #000;
      border-radius: 50%;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 3;
    }
    
    /* Трубка */
    .bear-snorkel {
      position: absolute;
      width: 8px;
      height: 40px;
      background: #FF6B6B;
      border-radius: 4px;
      top: 10px;
      right: 15px;
      transform: rotate(-15deg);
    }
    
    /* Загубник трубки */
    .bear-snorkel::after {
      content: '';
      position: absolute;
      width: 15px;
      height: 8px;
      background: #FF6B6B;
      border-radius: 4px;
      bottom: -2px;
      left: -3px;
      transform: rotate(15deg);
    }
    
    /* Пузырьки */
    @keyframes bubble {
      0% {
        transform: translateY(0) scale(1);
        opacity: 0;
      }
      50% {
        transform: translateY(-20px) scale(1.2);
        opacity: 1;
      }
      100% {
        transform: translateY(-40px) scale(1);
        opacity: 0;
      }
    }
    
    .bear-bubbles::before,
    .bear-bubbles::after {
      content: '○';
      position: absolute;
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;
      animation: bubble 2s infinite;
      top: 5px;
      right: 15px;
    }
    
    .bear-bubbles::after {
      top: -10px;
      right: 5px;
      animation-delay: 1s;
    }
  `;

  // Добавляем мониторинг изменений в массиве logs
  useEffect(() => {
    console.log("Массив logs изменился:", { 
      logsLength: logs.length, 
      lastLog: logs.length > 0 ? logs[logs.length - 1] : null 
    });
  }, [logs]);

  return (
    <div className="boat-game-container" ref={gameContainerRef}>
      <style>{styles}</style>
      <audio ref={hitAudioRef} src={hitSound} preload="auto" />
      <audio ref={victoryAudioRef} src={victorySound} preload="auto" />
      <audio ref={coinAudioRef} src={coinSound} preload="auto" />
      
      {stage === Stage.START && (
        <StartScreen
          onStart={handleStartClick}
          savedScores={savedScores}
        />
      )}
      
      {stage === Stage.GAME && (
        <>
          <div 
            className="game-container" 
            ref={gameContainerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            style={{ outline: 'none' }}
          >
            {/* Экран паузы */}
            {isPaused && (
              <motion.div 
                className="pause-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.h1
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
            
            {/* Элементы интерфейса - жизни, время, счетчик монет и очков */}
            <motion.div
              className="ui-container"
              style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                zIndex: 10
              }}
            >
              <div style={{ display: "flex", gap: "20px" }}>
                <motion.div 
                  className="lives-container"
                  style={{ 
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(0,0,0,0.5)",
                    padding: "10px",
                    borderRadius: "10px",
                    color: "white"
                  }}
                  animate={{
                    scale: lives === 1 ? [1, 1.2, 1] : 1,
                    color: lives === 1 ? ["#fff", "#ff0000", "#fff"] : "#fff",
                    transition: {
                      repeat: lives === 1 ? Infinity : 0,
                      duration: 1
                    }
                  }}
                >
                  <span style={{ marginRight: "5px", fontSize: "18px" }}>Жизни:</span>
                  {Array.from({ length: lives }).map((_, i) => (
                    <span key={i} style={{ fontSize: "24px", color: "red" }}>❤️</span>
                  ))}
                </motion.div>

                <motion.div
                  className="time-container"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    padding: "10px",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "18px"
                  }}
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

              <div style={{ display: "flex", gap: "20px" }}>
                <motion.div
                  className="coins-collected"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    padding: "10px",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center"
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    transition: {
                      duration: 0.5,
                      repeat: 0
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <span style={{ marginRight: "5px" }}>Монеты:</span>
                  <span style={{ color: "#FFD700", fontWeight: "bold" }}>{coinsCollected}</span>
                  <span style={{ marginLeft: "5px", fontSize: "20px", color: "#FFD700" }}>🪙</span>
                </motion.div>

                <motion.div
                  className="score-display"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    padding: "10px",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center"
                  }}
                  animate={{
                    scale: score % 50 === 0 && score > 0 ? [1, 1.2, 1] : 1,
                    transition: {
                      duration: 0.5
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <span style={{ marginRight: "5px" }}>Счет:</span>
                  <span style={{ color: "#87CEEB", fontWeight: "bold" }}>{score}</span>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Бревна */}
            {logs.map((log, index) => (
              <motion.div
                key={`log-${index}`}
                className="log"
                style={{
                  left: `${log.x}px`,
                  bottom: `${log.y}px`,
                  opacity: log.visible ? 1 : 0
                }}
                animate={{ opacity: log.visible ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            ))}

            {/* Альпинист */}
            <motion.div
              className={`climber ${isJumping ? 'jumping' : ''}`}
              style={{
                left: `${climberPosition.x}px`,
                bottom: `${climberPosition.y}px`
              }}
              animate={
                isHit 
                  ? "hit" 
                  : isJumping 
                    ? "jumping" 
                    : "idle"
              }
              variants={climberVariants}
              initial="idle"
            />

            {/* Монеты */}
            <AnimatePresence>
              {coins.map((coin, index) => (
                <motion.div
                  key={`coin-${index}`}
                  className="coin"
                  style={{
                    left: `${coin.x}px`,
                    top: `${coin.y}px`,
                    position: 'absolute',
                  }}
                  variants={coinVariants}
                  initial="initial"
                  animate={coin.collected ? "collected" : "initial"}
                  exit="collected"
                />
              ))}
            </AnimatePresence>

            {/* Медвежонок у финиша */}
            {lastLog ? (
              <motion.div 
                className="bear"
                style={{ 
                  left: `${lastLog.x}px`,
                  bottom: `${lastLog.y + 50}px`,
                  zIndex: 10
                }}
                animate={bearCelebrating ? {
                  y: [0, -20, 0],
                  transition: {
                    repeat: Infinity,
                    duration: 0.5
                  }
                } : {}}
              >
                <div className="bear-ears" />
                <div className="bear-face" />
                <div className="bear-nose" />
                <div className="bear-mask" />
                <div className="bear-snorkel" />
                <div className="bear-bubbles" />
                <div className="bear-arms" />
                <div className="bear-paws" />
              </motion.div>
            ) : (
              <div 
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "150px",
                  color: "red",
                  zIndex: 10,
                  background: "rgba(0,0,0,0.5)",
                  padding: "5px"
                }}
              >
                Медвежонок не отображается: lastLog отсутствует
              </div>
            )}

            {/* Рыбы */}
            {fishes.map((fish, index) => (
              <motion.div
                key={`fish-${index}`}
                className="fish"
                style={{
                  left: `${fish.x}px`,
                  bottom: `${fish.y}px`,
                  backgroundColor: fish.y > 150 ? '#00ff00' : 
                                 'logIndex' in fish ? 
                                    fish.isSafeState ? '#00BFFF' : '#FF0000' : 
                                    fish.isDangerous ? '#ff6600' : '#2196F3',
                  width: 'logIndex' in fish ? '30px' : '20px',
                  height: 'logIndex' in fish ? '30px' : '20px',
                  boxShadow: 'logIndex' in fish ? 
                             fish.isSafeState ? 
                               '0 0 10px #00BFFF, 0 0 20px #00BFFF' : // Голубое свечение для безопасных
                               '0 0 10px red, 0 0 20px red' :        // Красное свечение для опасных
                             'none',
                  borderRadius: '50%',
                  zIndex: 'logIndex' in fish ? 4 : 2,
                  transition: 'background-color 0.5s, box-shadow 0.5s, transform 0.5s',
                }}
                animate={
                  'logIndex' in fish ? {
                    scale: fish.isSafeState ? 
                            [1, 1.1, 1] :      // Мягкая пульсация для безопасной рыбки
                            [1, 1.3, 1],        // Более активная пульсация для опасной рыбки
                    y: fish.isSafeState ? [0, -5, 0] : [0, -8, 0], // Разная амплитуда движения
                    transition: {
                      repeat: Infinity,
                      duration: fish.isSafeState ? 2 : 1, // Разная скорость анимации
                      ease: "easeInOut"
                    }
                  } : {}
                }
              />
            ))}

            {/* Летающие рыбки в небе */}
            {decorativeFishes.map(fish => (
              <motion.div 
                key={`decorative-fish-${fish.id}`}
                className={`fish ${fish.direction === "left" ? "swimming-left" : ""}`}
                style={{
                  left: `${fish.x}px`,
                  top: `${fish.y}px`,
                  transform: `scale(${fish.size}) ${fish.direction === "left" ? "scaleX(-1)" : ""}`,
                  zIndex: 4,
                  filter: `hue-rotate(${fish.id * 30}deg) brightness(${1 + fish.id % 3 * 0.1})`,
                  backgroundColor: fish.isDangerous && fish.y < 150 ? '#ff6666' : undefined // Красноватый цвет для опасных рыбок ниже порога
                }}
                animate={{
                  y: [fish.y - 15, fish.y + 15],
                  rotate: [fish.direction === "left" ? -10 : 10, fish.direction === "left" ? 10 : -10],
                  transition: {
                    y: {
                      repeat: Infinity,
                      duration: 2 + Math.random() * 2,
                      repeatType: "reverse",
                      ease: "easeInOut"
                    },
                    rotate: {
                      repeat: Infinity,
                      duration: 2 + Math.random(),
                      repeatType: "reverse",
                      ease: "easeInOut"
                    }
                  }
                }}
                whileHover={{ scale: fish.size * 1.2, y: fish.y - 10 }}
              >
                <div 
                  className="fish-fin-top" 
                  style={{
                    background: `linear-gradient(to top, ${fish.color}, transparent)`,
                    transform: `rotate(${Math.sin(Date.now() / 500 + fish.id) * 20}deg)`
                  }} 
                />
                <div 
                  className="fish-fin-bottom" 
                  style={{
                    background: `linear-gradient(to bottom, ${fish.color}, transparent)`,
                    transform: `rotate(${Math.cos(Date.now() / 500 + fish.id) * 20}deg)`
                  }} 
                />
                <div className="fish-eye" />
                <div className="fish-bubbles" style={{ opacity: 0.7 + Math.sin(Date.now() / 300 + fish.id) * 0.3 }}>
                  <div className="fish-bubble" />
                  <div className="fish-bubble" />
                  <div className="fish-bubble" />
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
      
      {stage === Stage.FINISH && (
        <EndScreen
          onRestart={resetGame}
          score={score}
          savedScores={savedScores}
          isWin={coinsCollected >= 9 && currentLogIndex === logs.length - 1}
        />
      )}
    </div>
  );
};

export default BoatGame;