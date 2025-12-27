'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchFormProps {
  initialQuery?: string;
}

export function SearchForm({ initialQuery = '' }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Preserve existing filters
    const params = new URLSearchParams(searchParams.toString());
    
    if (query.trim()) {
      params.set('query', query.trim());
    } else {
      params.delete('query');
    }
    
    // Reset to page 1 on new search
    params.delete('page');
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن نشاط تجاري، خدمة، أو فئة..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        dir="auto"
      />
      <button
        type="submit"
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        بحث
      </button>
    </form>
  );
}
