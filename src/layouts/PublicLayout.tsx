import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Ticker } from '../components/common/Ticker';
import { Header } from '../components/common/Header';
import { Footer } from '../components/common/Footer';
import type { Article } from '../types';
import { newsService } from '../services/newsService';

export const PublicLayout: React.FC = () => {
  const [breaking, setBreaking] = useState<Article[]>([]);

  useEffect(() => {
    document.title = "Late Khabar";
    newsService.getBreakingArticles().then(setBreaking);
  }, []);

  return (
    <div className="flex flex-col min-h-screen pt-28 bg-background dark:bg-[#121212] transition-colors duration-200">
      <Ticker breakingArticles={breaking} />
      <Header />
      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
