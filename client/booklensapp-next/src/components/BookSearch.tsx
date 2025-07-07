import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import api from '../api';

interface BookSearchForm {
  title: string;
  author: string;
}

interface Book {
  id: string;
  title: string;
  authors: string[];
  firstPublishYear?: number;
  coverImage?: string;
  editionCount?: number;
  hasFullText?: boolean;
  ratingsAverage?: number;
  ratingsCount?: number;
  openLibraryKey: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function BookSearch() {
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<BookSearchForm>();

  const onSubmit = async (data: BookSearchForm) => {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    setPagination(null);
    
    try {
      const params = new URLSearchParams();
      if (data.title) params.append('title', data.title);
      if (data.author) params.append('author', data.author);

      const response = await api.get(`/books/search?${params.toString()}`);
      
      if (response.data.success) {
        setSearchResults(response.data.data || []);
        setPagination(response.data.pagination || null);

        if (!response.data.data || response.data.data.length === 0) {
          setError("No books found matching your search.");
        }
      } else {
        setError("Search failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Search error:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || "Error fetching books.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!pagination) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Re-construct search parameters (you might want to store these in state)
      params.append('page', page.toString());
      
      const response = await api.get(`/books/search?${params.toString()}`);
      
      if (response.data.success) {
        setSearchResults(response.data.data || []);
        setPagination(response.data.pagination || null);
      }
    } catch (err: any) {
      console.error("Page change error:", err);
      setError("Failed to load page. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Book Search</CardTitle>
          <CardDescription>
            Search for books by title or author using Open Library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                placeholder="Enter book title"
                {...register("title")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="Enter author name"
                {...register("author")}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Searching..." : "Search Books"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="text-center text-sm text-gray-600">
            Found {pagination?.totalResults || searchResults.length} results
          </div>
          
          {searchResults.map((book) => (
            <Card key={book.id} className="overflow-hidden">
              <div className="flex">
                {book.coverImage && (
                  <div className="w-24 h-32 flex-shrink-0">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-lg">{book.title}</CardTitle>
                    <CardDescription>
                      By {book.authors.join(', ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 pb-2">
                    <div className="space-y-1 text-sm text-gray-600">
                      {book.firstPublishYear && (
                        <p>Published: {book.firstPublishYear}</p>
                      )}
                      {book.editionCount && (
                        <p>Editions: {book.editionCount}</p>
                      )}
                      {book.ratingsAverage && (
                        <p>Rating: {book.ratingsAverage.toFixed(1)} ({book.ratingsCount} ratings)</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="p-0">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
          
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage || loading}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 