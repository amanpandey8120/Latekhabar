import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Article, Category } from '../../types';
import { newsService } from '../../services/newsService';
import { ArticleCard } from '../../components/news/ArticleCard';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import { Search, Filter } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { t } = useLanguage();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = query ? `Search: ${query} | Late Khabar` : "Search News | Late Khabar";
    async function initCategories() {
      const cats = await newsService.getCategories();
      setCategories(cats);
    }
    initCategories();
  }, []);

  useEffect(() => {
    async function executeSearch() {
      setLoading(true);
      const results = await newsService.getArticles({
        searchQuery: query.trim() || undefined,
        categorySlug: selectedCategory !== 'all' ? selectedCategory : undefined,
      });
      setArticles(results);
      setLoading(false);
    }
    executeSearch();
  }, [query, selectedCategory]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Search Header Form */}
      <div className="bg-white dark:bg-[#1c1c1c] rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <h1 className="text-2xl font-bold font-headline-md text-on-surface dark:text-white flex items-center gap-2">
          <Search className="text-primary" />
          {t('searchTitle')}
        </h1>

        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            className="flex-grow border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm bg-transparent dark:text-white outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container transition-colors shadow"
          >
            Search
          </button>
        </form>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-2">
          <Filter size={16} className="text-gray-400" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.slug
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat.nameEn}
            </button>
          ))}
        </div>
      </div>

      {/* Results grid */}
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
        <EmptyState title="No matching articles found" message="Try searching for another topic or clear filters." />
      )}
    </div>
  );
};
