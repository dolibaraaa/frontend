import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import './ManualQuestionForm.css';
import './common.css';

const ManualQuestionForm = ({ topics, onQuestionCreated, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    selectedTopic: topics[0] || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleOptionChange = (idx, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === idx ? value : opt)
    }));
  };

  const validateForm = () => {
    if (!formData.question.trim()) {
      return 'La pregunta es requerida';
    }
    if (formData.options.some(opt => !opt.trim())) {
      return 'Todas las opciones son requeridas';
    }
    return '';
  };

  useEffect(() => {
    const validationError = validateForm();
    setError(validationError);
  }, [formData, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Build payload and hand off to parent for saving. Parent will perform the network request.
      const payload = {
        text: formData.question,
        options: formData.options,
        correctAnswerIndex: formData.correctIndex,
        category: formData.selectedTopic,
        explanation: ''
      };

      setSuccessMessage('Guardando...');
      if (onQuestionCreated) {
        const result = await Promise.resolve(onQuestionCreated(payload));
        // If parent returns the saved question, show its text in the success message
        const savedText = result && result.text ? result.text : payload.text;
        setSuccessMessage(`Pregunta creada: "${savedText}"`);
      } else {
        setSuccessMessage('¡Pregunta preparada!');
      }
    } catch (err) {
      console.error('Error al preparar la pregunta:', err);
      setError(err.message || 'Error al guardar la pregunta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="manual-question-form" onSubmit={handleSubmit}>
      <h3>Escribe tu pregunta</h3>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className={`form-group ${loading ? 'disabled' : ''}`}>
        <label>
          Tema:
          <select 
            value={formData.selectedTopic} 
            onChange={e => setFormData(prev => ({ ...prev, selectedTopic: e.target.value }))}
            disabled={loading}
          >
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>

      <div className={`form-group ${loading ? 'disabled' : ''}`}>
        <label>
          Pregunta:
          <input
            type="text"
            value={formData.question}
            onChange={e => setFormData(prev => ({ ...prev, question: e.target.value }))}
            disabled={loading}
            required
          />
        </label>
      </div>

      <div className={`form-group ${loading ? 'disabled' : ''}`}>
        <label>Opciones:</label>
        <div className="manual-options-list">
          {formData.options.map((opt, idx) => (
            <div key={idx} className="manual-option-row">
              <input
                type="text"
                value={opt}
                onChange={e => handleOptionChange(idx, e.target.value)}
                disabled={loading}
                required
                placeholder={`Opción ${idx + 1}`}
              />
              <label className="radio-label">
                <input
                  type="radio"
                  name="correctOption"
                  checked={formData.correctIndex === idx}
                  onChange={() => setFormData(prev => ({ ...prev, correctIndex: idx }))}
                  disabled={loading}
                />
                <span>Correcta</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="manual-question-actions">
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="loading-indicator" />
              <span style={{ marginLeft: '8px' }}>Guardando...</span>
            </>
          ) : 'Guardar'}
        </button>
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onCancel} 
          disabled={loading}
        >
          Atrás
        </button>
      </div>
    </form>
  );
};

export default ManualQuestionForm;
