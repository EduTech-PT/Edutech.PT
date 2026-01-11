
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Hero from './components/Hero';
import Features from './components/Features';
import Courses from './components/Courses';
import AITutor from './components/AITutor';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar sempre presente no topo */}
      <Navbar 
        user={user} 
        onOpenLogin={() => setIsLoginOpen(true)} 
        onLogout={handleLogout} 
      />
      
      <main className="flex">
        {user?.role === 'admin' ? (
          <div className="flex w-full min-h-screen pt-20">
            {/* Sidebar Fixa à Esquerda para Admin */}
            <Sidebar user={user} activePage="dashboard" />
            
            {/* Área de Conteúdo Principal para Admin */}
            <div className="flex-1 overflow-auto bg-slate-50">
              <AdminDashboard />
            </div>
          </div>
        ) : (
          <div className="w-full">
            <Hero />
            <Features />
            <Courses />
            <AITutor />
          </div>
        )}
      </main>

      {/* Footer apenas visível fora do Dashboard denso ou como parte do scroll */}
      {user?.role !== 'admin' && <Footer />}

      {isLoginOpen && (
        <LoginModal 
          onClose={() => setIsLoginOpen(false)} 
          onLogin={handleLogin} 
        />
      )}
    </div>
  );
}

export default App;
