import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Article, Category } from '../../types';
import { newsService } from '../../services/newsService';
import { ArticleCard } from '../../components/news/ArticleCard';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguage } from '../../context/LanguageContext';

export const CategoryNews: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategoryArticles() {
      setLoading(true);
      const [arts, cats] = await Promise.all([
        newsService.getArticles({ categorySlug: slug }),
        newsService.getCategories(),
      ]);
      setArticles(arts);
      const matched = cats.find((c) => c.slug === slug);
      setCategory(matched || null);
      setLoading(false);
    }
    loadCategoryArticles();
  }, [slug]);

  useEffect(() => {
    if (category) {
      const catName = language === 'hi' ? category.nameHi : category.nameEn;
      document.title = `${catName} News | Late Khabar`;
    } else {
      document.title = "Late Khabar";
    }
    return () => {
      document.title = "Late Khabar";
    };
  }, [category, language]);

  const catTitle = category ? (language === 'hi' ? category.nameHi : category.nameEn) : slug;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-900 to-primary text-white rounded-xl p-8 shadow-md">
        <span className="text-xs uppercase tracking-widest text-red-200 font-bold font-metadata">Category</span>
        <h1 className="text-3xl md:text-4xl font-bold font-headline-md mt-1 capitalize">{catTitle}</h1>
        {category && (
          <p className="text-sm text-red-100 mt-2 font-article-body max-w-xl">
            {language === 'hi' ? category.descriptionHi : category.descriptionEn}
          </p>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <ArticleCard key={art.id} article={art} variant="grid" />
          ))}
        </div>
      ) : (
        <EmptyState title={`No stories found in ${catTitle}`} />
      )}
    </div>
  );
};
