import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Ranking from '../components/Ranking';
import './GameSummaryPage.css';

export default function GameSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const players = location.state?.players || [];

  return (
    <div className="game-summary-container">
      <div className="game-summary-card">
        <h2 className="game-summary-title">¡Juego finalizado!</h2>
        <div className="game-summary-subtitle">
          <span>¡Felicidades a todos los participantes!</span>
        </div>
        <Ranking players={players} />
        <button
          className="btn"
          style={{ marginTop: '1.5rem', minWidth: 180 }}
          onClick={() => navigate('/dashboard')}
        >
          Volver al Panel Principal
        </button>
      </div>
    </div>
  );
}