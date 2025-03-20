import React, { ReactNode } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import Navigation, { Page } from './Navigation';

interface PageLayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  currentPage, 
  onNavigate 
}) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Practice Pal</h1>
          <div className="flex items-center gap-4">
            <Navigation currentPage={currentPage} onNavigate={onNavigate} />
            <ThemeToggle />
            <button className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md transition">
              Settings
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4 mb-16 md:mb-4">
        {children}
      </main>
      
      <footer className="bg-gray-200 dark:bg-gray-800 p-4 text-center text-gray-600 dark:text-gray-400">
        <p>Practice Pal &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default PageLayout; 