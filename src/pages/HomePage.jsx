import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Layout from '../components/Layout';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <Layout>
      <section className="mx-auto py-8 max-w-4xl text-center">
        <h1 className="mb-3 font-extrabold text-3xl md:text-5xl">⚡ BrainBlitz</h1>
        <p className="mb-6 text-white/80 text-sm md:text-lg">La experiencia definitiva de trivia multijugador</p>

        <div className="flex sm:flex-row flex-col justify-center items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="bg-bb-primary px-5 py-3 rounded-md font-semibold text-sm">Ir al panel</Link>
              <Link to="/profile" className="bg-white/5 px-5 py-3 rounded-md text-sm">Ver perfil</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="bg-bb-primary px-5 py-3 rounded-md font-semibold text-sm">Iniciar sesión</Link>
              <Link to="/register" className="bg-white/5 px-5 py-3 rounded-md text-sm">Registrarse</Link>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto py-6 max-w-6xl">
        <h2 className="mb-4 font-bold text-2xl">Características</h2>
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white/3 p-4 rounded-lg">
            <div className="mb-2 text-3xl">⚡</div>
            <h3 className="font-semibold">Juego en tiempo real</h3>
            <p className="text-white/80 text-sm">Juega con amigos con puntuación instantánea y rankings en vivo</p>
          </div>
          <div className="bg-white/3 p-4 rounded-lg">
            <div className="mb-2 text-3xl">🎮</div>
            <h3 className="font-semibold">Fácil de unirse</h3>
            <p className="text-white/80 text-sm">Únete con códigos de 6 dígitos o explora partidas públicas</p>
          </div>
          <div className="bg-white/3 p-4 rounded-lg">
            <div className="mb-2 text-3xl">🏆</div>
            <h3 className="font-semibold">Competitivo</h3>
            <p className="text-white/80 text-sm">Sigue tus estadísticas, sube en el ranking y sé el campeón de BrainBlitz</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}