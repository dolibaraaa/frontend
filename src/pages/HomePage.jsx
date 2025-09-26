import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Layout from '../components/Layout';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="home-page">
        <section className="hero-section">
          <div className="hero-section-content">
            <h1 className="hero-title">⚡ BrainBlitz</h1>
            <p className="hero-subtitle">La experiencia definitiva de trivia multijugador</p>

            <div className="auth-actions">
              {user ? (
                <Link to="/dashboard" className="bg-bb-primary px-8 py-4 rounded-lg font-bold text-lg">Ir al panel</Link>
              ) : (
                <>
                  <Link to="/login" className="bg-bb-primary px-8 py-4 rounded-lg font-bold text-lg">Iniciar sesión</Link>
                  <Link to="/register" className="bg-white/5 px-8 py-4 rounded-lg text-lg">Registrarse</Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="features-section">
          <h2>Características</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Juego en tiempo real</h3>
              <p>Juega con amigos con puntuación instantánea y partidas dinámicas</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <h3>Fácil de unirse</h3>
              <p>Únete con códigos de 6 dígitos o explora partidas públicas</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Compite con amigos</h3>
              <p>Sigue tus estadísticas y demuestra tus conocimientos</p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}