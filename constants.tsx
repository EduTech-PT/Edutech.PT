
import React from 'react';

export const APP_VERSION = "v1.1.0";

export const Logo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`relative ${className} flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 shadow-lg overflow-hidden`}>
    {/* Minimalist Graduation Cap Icon representing the provided image */}
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 z-10">
      <path d="M22 10L12 5L2 10L12 15L22 10Z" />
      <path d="M6 12.5V18C6 18 9 20 12 20C15 20 18 18 18 18V12.5" />
    </svg>
    <div className="absolute inset-0 bg-white/10 opacity-50 blur-sm"></div>
  </div>
);

export const COURSES = [
  {
    id: '1',
    title: 'Inteligência Artificial Aplicada',
    description: 'Aprenda os fundamentos de IA e como integrar LLMs em projetos reais de software.',
    category: 'Tecnologia',
    image: 'https://picsum.photos/seed/tech1/800/600',
    duration: '40h'
  },
  {
    id: '2',
    title: 'Desenvolvimento Web Moderno',
    description: 'Domine React, Next.js e Tailwind CSS para criar interfaces de alto impacto.',
    category: 'Programação',
    image: 'https://picsum.photos/seed/dev2/800/600',
    duration: '60h'
  },
  {
    id: '3',
    title: 'Data Science para Negócios',
    description: 'Transforme dados brutos em decisões estratégicas utilizando Python e SQL.',
    category: 'Dados',
    image: 'https://picsum.photos/seed/data3/800/600',
    duration: '45h'
  }
];
