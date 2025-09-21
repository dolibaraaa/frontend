import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
const AIQuestionGenerator = React.lazy(() => import('../components/AIQuestionGenerator'));
import './DashboardPage.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [publicGames, setPublicGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchPublicGames();
  }, []);

  const fetchPublicGames = async () => {
    try {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/games`);
      const data = await response.json();
      const gamesArray = Array.isArray(data) ? data : [];
      setPublicGames(gamesArray);
    } catch (error) {
      console.error('Error fetching games:', error);
      setPublicGames([]);
    }
  };

  const handleCreateGame = async () => {
    if (!selectedTopic) {
      setErrorMessage('Por favor selecciona un tema antes de crear la partida.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    if (!generatedQuestions.length) {
      setErrorMessage('Primero debes generar preguntas con IA antes de crear la partida.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    // Forzar que todas las preguntas tengan el category igual al tema seleccionado
    const fixedQuestions = generatedQuestions.map(q => ({ ...q, category: selectedTopic }));
    setLoading(true);
    socket.connect();
    // Obtener el token de autenticación del usuario
    let token = null;
    if (user && user.getIdToken) {
      token = await user.getIdToken();
    }
    socket.emit('createGame', {
      hostId: user.uid,
      displayName: user.displayName || user.email,
      isPublic: true,
      token,
      topic: selectedTopic,
      questions: fixedQuestions,
      count: fixedQuestions.length
    });
    socket.on('gameCreated', ({ gameId, questions }) => {
      setLoading(false);
      setSuccessMessage(`¡Tu partida fue creada con ${questions?.length || 0} preguntas! Invita a tus amigos y disfruta. 🚀`);
      setTimeout(() => setSuccessMessage(''), 5000);
      setTimeout(() => navigate(`/lobby/${gameId}`), 1200);
    });
    socket.on('error', ({ error }) => {
  setLoading(false);
  setErrorMessage('Ocurrió un error al crear la partida: ' + error);
  setTimeout(() => setErrorMessage(''), 5000);
    });
  };

  const handleJoinGame = () => {
    if (!gameCode.trim()) {
      setErrorMessage('Por favor ingresa un código de partida.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    navigate(`/lobby/${gameCode}`);
  };

  const handleJoinPublicGame = (gameId) => {
  setSuccessMessage('¡Te uniste a la partida! Cargando sala...');
  setTimeout(() => setSuccessMessage(''), 4000);
  setTimeout(() => navigate(`/lobby/${gameId}`), 1200);
  };

  const handleQuestionsGenerated = (questions) => {
    setGeneratedQuestions(questions);
    if (questions && questions.length > 0 && questions[0].category) {
      setSelectedTopic(questions[0].category);
    }
    setSuccessMessage(`¡Listo! Se generaron ${questions.length} preguntas para el tema "${questions[0]?.category || ''}". 🎉`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <div className="dashboard-page">
      {(successMessage || errorMessage) && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          background: errorMessage ? 'rgba(239,68,68,0.97)' : 'rgba(99,102,241,0.95)',
          color: '#fff',
          padding: '1.1rem 2.2rem',
          borderRadius: 18,
          fontWeight: 700,
          fontSize: '1.15rem',
          boxShadow: '0 4px 24px rgba(42,122,228,0.18)',
          border: '2px solid #fff',
          letterSpacing: 0.5,
          textAlign: 'center',
          animation: 'fadeIn 0.5s',
        }}>
          {errorMessage || successMessage}
        </div>
      )}
      <header className="dashboard-header">
        <div className="user-info">
          <h2>¡Bienvenido, {user?.displayName || user?.email}!</h2>
          <div className="user-actions">
            <button onClick={() => navigate('/profile')} className="btn btn-secondary">
              Perfil
            </button>
            <button onClick={logout} className="btn btn-outline">
              Cerrar sesión
            </button>
          </div>
          <style>{`
            .btn, .btn-primary, .btn-secondary, .btn-outline, .btn-ai {
              min-width: 140px !important;
              font-size: 1.08rem !important;
              white-space: nowrap !important;
            }
          `}</style>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="game-actions">
          <div className="create-game-section">
            <h3>🎮 Crear nueva partida</h3>
            <p>Inicia una partida y invita a tus amigos</p>
            <div className="create-game-actions">
              <button
                onClick={handleCreateGame}
                className="btn btn-primary btn-large"
                disabled={loading}
                title="Primero genera preguntas con IA para que tu partida tenga contenido."
              >
                {loading ? 'Creando...' : 'Crear partida'}
              </button>
              <button 
                onClick={() => setShowAIGenerator(true)} 
                className="btn btn-ai btn-large"
                title="Genera preguntas personalizadas antes de crear tu partida."
              >
                🤖 Generar preguntas
              </button>
              <div style={{marginTop: 8, color: '#555', fontSize: 14}}>
                <strong>Ayuda:</strong> Antes de crear una partida, puedes generar preguntas automáticamente o agregar preguntas manuales personalizadas. Así tu juego tendrá contenido único, reciente y adaptado a tus necesidades.
              </div>
            </div>
          </div>

          <div className="join-game-section">
            <h3>🔗 Unirse a partida</h3>
            <p>Ingresa un código de 6 dígitos para unirte</p>
            <div className="join-form">
              <input
                type="text"
                placeholder="Ingresa el código de la partida"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                maxLength="6"
                className="game-code-input"
              />
              <button onClick={handleJoinGame} className="btn btn-secondary">
                Unirse
              </button>
            </div>
          </div>
        </div>

        <div className="public-games-section">
          <h3>🌐 Partidas públicas</h3>
          <p>Únete a partidas abiertas para todos</p>
          <div className="games-list">
            {!Array.isArray(publicGames) || publicGames.length === 0 ? (
              <p className="no-games">No hay partidas públicas disponibles por ahora</p>
            ) : (
              publicGames.map(game => (
                <div key={game.id} className="game-card">
                  <div className="game-info">
                    <h4>Partida #{game.id}</h4>
                    <p>Jugadores: {game.players?.length || 0}</p>
                    <p>Anfitrión: {game.players?.[0]?.displayName || 'Desconocido'}</p>
                  </div>
                  <button 
                    onClick={() => handleJoinPublicGame(game.id)}
                    className="btn btn-primary"
                  >
                    Unirse
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showAIGenerator && (
          <Suspense fallback={<div>Cargando generador de preguntas...</div>}>
        <AIQuestionGenerator
          onQuestionsGenerated={qs => {
            handleQuestionsGenerated(qs);
            setShowAIGenerator(false);
          }}
          onClose={() => setShowAIGenerator(false)}
        />
          </Suspense>
      )}
    </div>
  );
}