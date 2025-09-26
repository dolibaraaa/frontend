import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import ManualQuestionForm from './ManualQuestionForm';
import { fetchTopics, fetchDifficultyLevels, fetchWithRetry } from '../services/api';
import './AIQuestionGenerator.css';
import './common.css';

const AIQuestionGenerator = ({ onQuestionsGenerated, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [difficultyLevels, setDifficultyLevels] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [useAI, setUseAI] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualCount, setManualCount] = useState(3);
  const [manualStep, setManualStep] = useState(0);
  const [manualQuestions, setManualQuestions] = useState([]);
  const [manualTopic, setManualTopic] = useState('');
  const [loading, setLoading] = useState(false);
  
  // No necesitamos monitorear este cambio de estado
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [canCreateGame, setCanCreateGame] = useState(false);

  useEffect(() => {
    loadTopics();
    loadDifficultyLevels();
  }, []);

  const loadTopics = async () => {
    try {
      const topics = await fetchTopics();
      setTopics(topics);
      if (topics.length > 0) {
        setSelectedTopic(topics[0]);
      }
    } catch (error) {
      setError('Error obteniendo temas. Por favor intenta de nuevo.');
    }
  };

  const loadDifficultyLevels = async () => {
    try {
      const levels = await fetchDifficultyLevels();
      setDifficultyLevels(levels);
    } catch (error) {
      setError('No se pudieron cargar los niveles de dificultad. Por favor, intenta de nuevo más tarde.');
    }
  };

  const generateQuestions = async () => {
    if (!selectedTopic) {
      setError('Por favor selecciona un tema válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const apiBase = import.meta.env.VITE_API_URL;
      if (!apiBase) {
        setError('Error de configuración: URL del API no definida');
        return;
      }
      const token = user && user.getIdToken ? await user.getIdToken() : null;
      const response = await fetch(`${apiBase}/api/ai/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: selectedDifficulty,
          count: questionCount,
          useAI: useAI
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Guardar preguntas en Firestore y esperar confirmación exitosa antes de crear la partida
        const questionsWithMeta = data.questions.map(q => ({
          // Si las opciones existen, barajarlas y actualizar el índice de la respuesta correcta de forma robusta
          ...(() => {
            if (!Array.isArray(q.options) || typeof q.correctAnswerIndex !== 'number') return q;
            // Asociar cada opción con su índice original
            const optionsWithIndex = q.options.map((opt, idx) => ({ opt, origIdx: idx }));
            // Barajar
            for (let i = optionsWithIndex.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
            }
            // Buscar la nueva posición de la opción que era la correcta
            const newCorrectIndex = optionsWithIndex.findIndex(o => o.origIdx === q.correctAnswerIndex);
            return {
              ...q,
              options: optionsWithIndex.map(o => o.opt),
              correctAnswerIndex: newCorrectIndex
            };
          })(),
          createdBy: user?.uid || 'anon',
          createdAt: Date.now(),
          category: selectedTopic,
          difficulty: selectedDifficulty
        }));
        let saveOk = false;
        try {
          const bulkToken = user && user.getIdToken ? await user.getIdToken() : null;
          const response = await fetch(`${apiBase}/api/questions/bulk`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(bulkToken ? { Authorization: `Bearer ${bulkToken}` } : {})
            },
            body: JSON.stringify({ questions: questionsWithMeta })
          });
          const result = await response.json();
          if (!result.success) {
            setError((prev) => (prev ? prev + ' | ' : '') + (result.error || 'Error guardando preguntas en Firestore'));
            setError('No se pudieron guardar las preguntas. ' + (result.error || 'Por favor, intenta de nuevo.'));
          } else {
            saveOk = true;
          }
        } catch (e) {
          setError('Ocurrió un error al guardar las preguntas. Por favor, verifica tu conexión e intenta de nuevo.');
        }
        if (!saveOk) {
          setLoading(false);
          return;
        }
        // Redirigir al usuario a la pantalla principal para que pueda crear la partida manualmente
        onQuestionsGenerated(data.questions);
        setLoading(false);
        // No navegues ni cierres aquí, deja que el Dashboard controle el cierre
      } else {
        setError(data.error || 'Error generando preguntas');
        setError('No se pudieron generar las preguntas: ' + (data.error || 'Por favor, intenta de nuevo.'));
      }
    } catch (error) {
      setError('Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Reinicia el contador de preguntas al cerrar el generador para evitar confusión
  useEffect(() => {
    if (!loading && !error && generatedQuestions.length === 0) {
      setQuestionCount(5);
    }
  }, [loading, error, generatedQuestions]);

  return (
    <div className="ai-generator-overlay">
      <div className="ai-generator-modal">
        <div className="ai-generator-header">
          <h2>🤖 Generador de Preguntas</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {/* Selección de método de generación */}
        {!showManualForm && !useAI && (
          <div className="ai-generator-method-select">
            <button 
              type="button"
              className="btn btn-primary" 
              onClick={() => setUseAI(true)} 
              style={{ marginRight: 12, minWidth: 140, fontSize: '1.08rem', whiteSpace: 'nowrap' }}
            >
              Crear con IA
            </button>
            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={() => {
                setShowManualForm(true);
                setUseAI(false);
                setManualStep(0);
                setManualQuestions([]);
                // Activando modo manual sin necesidad de log
              }} 
              style={{ minWidth: 140, fontSize: '1.08rem', whiteSpace: 'nowrap' }}
            >
              Escribir preguntas
            </button>
          </div>
        )}
        {/* Formulario de generación con IA */}
        {useAI && !showManualForm && (
          <form className="ai-generator-form" onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            setError('');
            try {
              await generateQuestions();
              setError('');
            } catch (err) {
              setError('Error al generar preguntas. Por favor, inténtalo de nuevo.');
            } finally {
              setLoading(false);
            }
          }}>
            <div className="form-group">
              <label htmlFor="topic">Tema</label>
              <select
                id="topic"
                className="form-select"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                disabled={topics.length === 0}
              >
                {topics.length === 0 ? (
                  <option value="">No hay temas disponibles</option>
                ) : (
                  topics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))
                )}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="difficulty">Dificultad</label>
              <select
                id="difficulty"
                className="form-select"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                <option value="easy">Fácil</option>
                <option value="medium">Media</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="numQuestions">Cantidad de Preguntas</label>
              <input
                type="number"
                id="numQuestions"
                className="form-input"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), 20))}
                min="1"
                max="20"
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="ai-generator-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: 140, fontSize: '1.08rem', whiteSpace: 'nowrap' }}
              >
                {loading ? (
                  <>
                    <div className="loading-indicator"></div>
                    <span>Creando...</span>
                  </>
                ) : 'Crear preguntas'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setUseAI(false)}
                disabled={loading}
                style={{ marginLeft: 8, minWidth: 100, fontSize: '1.08rem', whiteSpace: 'nowrap' }}
              >
                Atrás
              </button>
            </div>
          </form>
        )}
        {/* Formulario manual */}
        {showManualForm && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 380, padding: '32px 0 12px 0' }}>
            {manualStep === 0 ? (
              <form
                className="manual-question-form"
                style={{ maxWidth: 420, margin: '0 auto', marginBottom: 24, boxShadow: '0 8px 32px rgba(42,122,228,0.13)', background: 'rgba(26,26,46,0.97)', borderRadius: 24, padding: '36px 32px 28px 32px', border: '2.5px solid var(--bb-primary)', backdropFilter: 'blur(14px) saturate(1.2)' }}
                onSubmit={e => { e.preventDefault(); setManualStep(1); setManualQuestions([]); setManualTopic(selectedTopic); }}
              >
                <h3 style={{ textAlign: 'center', marginBottom: 24, fontWeight: 900, fontSize: '1.35rem', letterSpacing: 1.2, color: 'var(--bb-primary)', background: 'var(--bb-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  ¿Cuántas preguntas quieres agregar manualmente?
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <label style={{ fontSize: '1.08rem', fontWeight: 600 }}>
                    Tema:
                    <select
                      value={selectedTopic}
                      onChange={e => setSelectedTopic(e.target.value)}
                      style={{ marginLeft: 8, minWidth: 120, padding: '10px 16px', borderRadius: 10, fontSize: '1.08rem', border: '2px solid var(--bb-primary-light)', background: 'rgba(22,33,62,0.7)', color: 'var(--bb-text-primary)' }}
                    >
                      {topics.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: '1.08rem', fontWeight: 600 }}>
                    ¿Cuántas preguntas?
                    <input
                      type="number"
                      value={manualCount}
                      onChange={e => setManualCount(Math.min(Math.max(1, parseInt(e.target.value) || 1), 20))}
                      style={{ marginLeft: 8, width: 80, padding: '10px 16px', borderRadius: 10, fontSize: '1.08rem', border: '2px solid var(--bb-primary-light)', background: 'rgba(22,33,62,0.7)', color: 'var(--bb-text-primary)' }}
                      min="1"
                      max="20"
                      required
                    />
                  </label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 10 }}>
                    <button type="submit" className="btn btn-primary" style={{ minWidth: 120, fontSize: '1.08rem' }}>Empezar</button>
                    <button type="button" className="btn btn-secondary" style={{ minWidth: 120, fontSize: '1.08rem' }} onClick={() => setShowManualForm(false)}>Volver</button>
                  </div>
                </div>
              </form>
              ) : (
              <div style={{ width: '100%', maxWidth: 650, margin: '0 auto', background: 'rgba(26,26,46,0.97)', borderRadius: 28, boxShadow: '0 8px 32px rgba(42,122,228,0.13)', border: '2.5px solid var(--bb-primary)', padding: '36px 32px 28px 32px', backdropFilter: 'blur(14px) saturate(1.2)' }}>
                <div style={{ textAlign: 'center', marginBottom: 18, fontWeight: 900, fontSize: '1.25rem', letterSpacing: 1.1, color: 'var(--bb-primary)', background: 'var(--bb-gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  ¡Vamos! Pregunta {manualQuestions.length + 1} de {manualCount}
                </div>
                                <ManualQuestionForm
                                  topics={[manualTopic]}
                                  onQuestionCreated={async (q) => {
                                    // q is the payload prepared by the child
                                    try {
                                      setLoading(true);
                                      setError('');

                                      const apiBase = import.meta.env.VITE_API_URL;
                                      if (!apiBase) {
                                        throw new Error('Error de configuración: URL del API no definida');
                                      }
                                      if (!user || !user.getIdToken) {
                                        throw new Error('Debes iniciar sesión para crear preguntas');
                                      }
                                      const token = await user.getIdToken();

                                      // Save single question
                                      const response = await fetch(`${apiBase}/api/questions`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify(q)
                                      });

                                      const data = await response.json();
                                      if (!response.ok) {
                                        throw new Error(data.error || 'Error al guardar la pregunta');
                                      }

                                      const saved = data.question || { ...q };
                                      const next = [...manualQuestions, { ...saved, category: manualTopic }];

                                      // If last question, bulk save (server may already store them individually, but keep compatibility)
                                      if (next.length === manualCount) {
                                        // Do a bulk save to keep existing API usage
                                        const bulkResp = await fetch(`${apiBase}/api/questions/bulk`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${token}`
                                          },
                                          body: JSON.stringify({ questions: next })
                                        });
                                        const bulkData = await bulkResp.json();
                                        if (!bulkResp.ok) {
                                          throw new Error(bulkData.error || 'Error al guardar las preguntas en lote');
                                        }

                                        if (onQuestionsGenerated) {
                                          onQuestionsGenerated(next);
                                        }

                                        setStatusMessage('¡Todas las preguntas han sido guardadas exitosamente!');
                                        setTimeout(() => {
                                          setShowManualForm(false);
                                          setStatusMessage('');
                                        }, 1500);
                                        return next;
                                      } else {
                                        setManualQuestions(next);
                                        setManualStep(prev => prev + 1);
                                        setStatusMessage(`¡Pregunta ${next.length} de ${manualCount} guardada exitosamente!`);
                                        setTimeout(() => setStatusMessage(''), 1500);
                                        return saved;
                                      }
                                    } catch (error) {
                                      setError('No se pudo guardar la pregunta: ' + (error.message || 'Por favor, intenta de nuevo.'));
                                    } finally {
                                      setLoading(false);
                                    }
                                  }}
                                  onCancel={() => {
                                    setShowManualForm(false);
                                  }}
                                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIQuestionGenerator;