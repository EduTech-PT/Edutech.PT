
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar fixa no topo */}
      <Navbar 
        user={user} 
        onOpenLogin={() => setIsLoginOpen(true)} 
        onLogout={handleLogout} 
      />
      
      {user?.role === 'admin' ? (
        <div className="flex flex-1 pt-20">
          {/* Sidebar fixa abaixo da navbar */}
          <Sidebar user={user} activePage="dashboard" />
          
          {/* Dashboard ocupa o resto do ecrã */}
          <main className="flex-1 bg-slate-50 overflow-y-auto relative z-30">
            <AdminDashboard />
          </main>
        </div>
      ) : (
        <main className="flex-1">
          <Hero />
          <Features />
          <Courses />
          <AITutor />
        </main>
      )}

      {/* Footer visível apenas no site público */}
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
