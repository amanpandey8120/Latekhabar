import React, { useState } from 'react';
import { Play, X } from 'lucide-react';
import type { Article } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface VideoCardProps {
  article: Article;
}

export const VideoCard: React.FC<VideoCardProps> = ({ article }) => {
  const { language } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  const title = language === 'hi' ? article.titleHi : article.titleEn;

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="relative group rounded-xl overflow-hidden cursor-pointer shadow-md bg-black border border-gray-800"
      >
        <img
          src={article.imageUrl}
          alt={title}
          className="w-full h-44 object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play size={22} className="ml-1 fill-current" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Video Report</span>
          <h4 className="text-xs font-bold text-white line-clamp-2 mt-0.5 leading-tight">{title}</h4>
        </div>
      </div>

      {/* Video Modal Player */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-white p-1 rounded-full bg-black/60 hover:bg-red-600 transition-colors z-10"
            >
              <X size={20} />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={article.videoUrl || 'https://www.youtube.com/embed/5qap5aO4i9A'}
                title={title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-[#121212]">
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-gray-400 mt-1">{article.excerptEn}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
