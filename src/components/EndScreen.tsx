import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Screens.css';

interface EndScreenProps {
  score: number;
  onRestart: () => void;
  savedScores: number;
  isWin: boolean;
}

export const EndScreen: React.FC<EndScreenProps> = ({ score, onRestart, savedScores, isWin }) => {
  return (
    <motion.div 
      className="end-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h1 
        className="game-title"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        {isWin ? "Победа!" : "Игра окончена!"}
      </motion.h1>
      
      <motion.div 
        className="scores"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p>Ваш счет: {score}</p>
        <p>Лучший счет: {savedScores}</p>
      </motion.div>
      
      <motion.button 
        className="restart-button"
        onClick={onRestart}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        Играть снова
      </motion.button>
    </motion.div>
  );
}; 