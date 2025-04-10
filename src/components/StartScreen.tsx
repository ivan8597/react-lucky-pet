import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Screens.css';

interface StartScreenProps {
  onStart: () => void;
  savedScores: number;
}

const snowflakeVariants = {
  animate: {
    y: [0, 700],
    x: [-20, 20, -20],
    transition: {
      y: {
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      },
      x: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

export const StartScreen: React.FC<StartScreenProps> = ({ onStart, savedScores }) => {
  return (
    <motion.div 
      className="start-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        Подводные приключения
      </motion.h1>
      
      <motion.div 
        className="scores"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Лучший счет: {savedScores}
      </motion.div>
      
      <motion.div
        className="instructions"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <p>Используйте стрелки ← и → для перемещения между бревнами</p>
        <p>Избегайте рыб и собирайте монеты</p>
        <p>Соберите 9 монет и доберитесь до финиша, чтобы победить!</p>
        <p style={{ color: "#ff5555" }}>Внимание! Бревна 3, 5 и 7 исчезают каждые 3 секунды</p>
      </motion.div>
      
      <motion.button 
        className="start-button"
        onClick={onStart}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        Начать игру
      </motion.button>
    </motion.div>
  );
}; 