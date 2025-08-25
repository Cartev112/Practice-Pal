import React from 'react';
import { Link } from 'react-router-dom';

interface NavButtonProps {
  to: string;
  bgClass: string; // e.g. 'bg-indigo-600'
  hoverClass: string; // e.g. 'hover:bg-indigo-700'
  icon: string;
  label: string;
}

const commonHoverRing = 'hover:ring-4 hover:ring-indigo-400/70';

const NavButton: React.FC<NavButtonProps> = ({ to, bgClass, hoverClass, icon, label }) => (
  <Link
    to={to}
    className={`flex items-center justify-center py-4 text-lg font-semibold rounded-md ${bgClass} ${hoverClass} ${commonHoverRing} transition-colors`}
  >
    <span className="mr-2" role="img" aria-label={label}>{icon}</span>
    {label}
  </Link>
);

const LandingPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-indigo-700 text-white px-4">
    <h1 className="text-5xl md:text-7xl font-bold mb-8 text-center">
      Practice&nbsp;<span className="text-indigo-500">Pal</span>
    </h1>
    <p className="mb-8 text-lg text-gray-300 text-center max-w-lg">
      Your smart practice companion
    </p>
    <div className="w-full max-w-md grid gap-4">
      <NavButton to="/exercises" bgClass="bg-indigo-600" hoverClass="hover:bg-indigo-700" icon="🎼" label="Exercises" />
      <NavButton to="/analytics" bgClass="bg-teal-600" hoverClass="hover:bg-teal-700" icon="📊" label="Analytics" />
      <NavButton to="/sessions" bgClass="bg-amber-600" hoverClass="hover:bg-amber-700" icon="📜" label="Session History" />
      <NavButton to="/practice" bgClass="bg-rose-600" hoverClass="hover:bg-rose-700" icon="▶️" label="New Session" />
    </div>
  </div>
);

export default LandingPage;
