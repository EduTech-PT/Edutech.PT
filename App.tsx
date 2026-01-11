
import React, { useState } from 'react';
import Navbar from './components/Navbar';
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
    <div className="min-h-screen">
      <Navbar 
        user={user} 
        onOpenLogin={() => setIsLoginOpen(true)} 
        onLogout={handleLogout} 
      />
      
      <main>
        {user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <>
            <Hero />
            <Features />
            <Courses />
            <AITutor />
          </>
        )}
      </main>

      <Footer />

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
