import React from 'react';
import './Ranking.css';

export default function Ranking({ players }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getRankClass = (index) => {
    switch (index) {
      case 0: return 'first';
      case 1: return 'second';
      case 2: return 'third';
      default: return '';
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <h3 className="mb-4 font-bold text-xl">🏆 Tabla de posiciones</h3>
      <div className="flex flex-col bg-white/3 rounded-md divide-y divide-white/5 overflow-hidden">
        {sortedPlayers.map((player, index) => (
          <div key={player.uid} className={`flex items-center gap-4 p-3 ${getRankClass(index)}`}>
            <div className="flex justify-center items-center bg-white/5 rounded-full w-10 h-10 text-lg">{getRankIcon(index)}</div>
            <div className="flex-1">
              <div className="font-medium">{player.displayName || player.email}</div>
              <div className="text-white/80 text-sm">{player.score} puntos</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}