import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { BookCardSkeletonGrid } from './BookCardSkeleton';
import api from '../api';
import { isAuthenticated } from '../auth';

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
  price?: number; // <-- Add this line
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Collection {
  _id: string;
  name: string;
  description?: string;
}

const addToCollectionSchema = z.object({
  collectionId: z.string().min(1, 'Please select a collection'),
  notes: z.string().max(500, 'Notes too long').optional(),
  readStatus: z.enum(['to-read', 'reading', 'completed', 'abandoned']),
});

type AddToCollectionForm = z.infer<typeof addToCollectionSchema>;

export function BookSearch() {
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showAddToCollection, setShowAddToCollection] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const isLoggedIn = isAuthenticated();
  const { toast } = useToast();

  const { register, handleSubmit } = useForm<BookSearchForm>();
  const {
    register: registerCollection,
    handleSubmit: handleCollectionSubmit,
    formState: { errors: collectionErrors },
    reset: resetCollection,
  } = useForm<AddToCollectionForm>({
    resolver: zodResolver(addToCollectionSchema),
    defaultValues: {
      readStatus: 'to-read',
    },
  });

  useEffect(() => {
    if (isLoggedIn) {
      fetchCollections();
    }
  }, [isLoggedIn]);

  const fetchCollections = async () => {
    try {
      const response = await api.get('/collections');
      if (response.data.success) {
        setCollections(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch collections:', err);
    }
  };

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
          toast({
            variant: "info",
            title: "No Results",
            description: "No books found matching your search criteria.",
          });
        } else {
          toast({
            variant: "success",
            title: "Search Complete",
            description: `Found ${response.data.data.length} books matching your search.`,
          });
        }
      } else {
        setError("Search failed. Please try again.");
        toast({
          variant: "destructive",
          title: "Search Failed",
          description: "Unable to complete your search. Please try again.",
        });
      }
    } catch (err: any) {
      console.error("Search error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Error fetching books.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: errorMessage,
      });
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
      toast({
        variant: "destructive",
        title: "Page Load Error",
        description: "Failed to load the requested page.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (book: Book, data: AddToCollectionForm) => {
    try {
      setAdding(true);
      const response = await api.post(`/collections/${data.collectionId}/books`, {
        bookId: book.id,
        title: book.title,
        authors: book.authors,
        coverImage: book.coverImage,
        notes: data.notes,
        readStatus: data.readStatus,
      });

      if (response.data.success) {
        setShowAddToCollection(null);
        resetCollection();
        setError(null);
        toast({
          variant: "success",
          title: "Book Added",
          description: `${book.title} has been added to your collection.`,
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add book to collection';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Add Failed",
        description: errorMessage,
      });
    } finally {
      setAdding(false);
    }
  };

  const toggleFavorite = (bookId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(bookId)) {
        newFavorites.delete(bookId);
        toast({
          variant: "info",
          title: "Removed from Favorites",
          description: "Book removed from your favorites.",
        });
      } else {
        newFavorites.add(bookId);
        toast({
          variant: "success",
          title: "Added to Favorites",
          description: "Book added to your favorites!",
        });
      }
      return newFavorites;
    });
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return 'No rating';
    return '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <Card className="w-full max-w-2xl mx-auto mb-8 bg-surface shadow-lg rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-primary text-2xl font-bold">Book Search</CardTitle>
          <CardDescription className="text-text-secondary">
            Search for books by title or author using Open Library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-text-primary">Book Title</Label>
              <Input
                id="title"
                placeholder="Enter book title"
                {...register("title")}
                disabled={loading}
                className="bg-muted border-0 focus:ring-2 focus:ring-primary text-text-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author" className="text-text-primary">Author</Label>
              <Input
                id="author"
                placeholder="Enter author name"
                {...register("author")}
                disabled={loading}
                className="bg-muted border-0 focus:ring-2 focus:ring-primary text-text-primary"
              />
            </div>
            <Button type="submit" className="w-full bg-primary text-white hover:bg-secondary transition-colors duration-200 shadow-md rounded-lg" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </div>
              ) : (
                "Search Books"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-md">
          <p className="text-error text-center">{error}</p>
        </div>
      )}

      {loading && <BookCardSkeletonGrid count={6} />}

      {searchResults.length > 0 && !loading && (
        <div className="mt-12 space-y-6">
          <div className="text-center text-base text-text-secondary font-medium">
            Found {pagination?.totalResults || searchResults.length} results
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {searchResults.map((book) => (
            <Card key={book.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 bg-surface rounded-xl shadow-md flex flex-col min-h-[260px]">
              {/* Card content */}
              <div className="flex-shrink-0 w-full h-[160px] relative group">
                {book.coverImage && (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-t-xl"
                  />
                )}
                {/* Gradient overlay at the bottom, only on hover */}
                <div className="absolute left-0 bottom-0 w-full h-1/4 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <button
                  onClick={() => toggleFavorite(book.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label={favorites.has(book.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <span className={`text-lg transition-all duration-300 ${favorites.has(book.id) ? 'text-error scale-110' : 'text-gray-400'}`}> 
                    {favorites.has(book.id) ? '❤️' : '🤍'}
                  </span>
                </button>
              </div>
              <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden">
                <CardHeader className="p-0 pb-1 truncate">
                  <CardTitle className="text-base group-hover:text-primary transition-colors duration-300 truncate font-semibold" title={book.title}>{book.title}</CardTitle>
                  <CardDescription className="text-xs group-hover:text-text-secondary transition-colors duration-300 truncate" title={book.authors.join(', ')}>
                    By {book.authors.join(', ')}
                  </CardDescription>
                  {typeof book.price === 'number' && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-secondary text-white text-xs font-bold rounded-full shadow-sm border border-yellow-300">
                      ${book.price.toFixed(2)}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="p-0 pb-1">
                  <div className="space-y-1 text-xs text-text-secondary truncate">
                    {book.firstPublishYear && (
                      <p>Year: {book.firstPublishYear}</p>
                    )}
                    {book.editionCount && (
                      <p>Editions: {book.editionCount}</p>
                    )}
                    {book.ratingsAverage && (
                      <p>Rating: {getRatingStars(book.ratingsAverage)}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-0 mt-auto">
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" asChild className="transition-all duration-300 hover:scale-105 text-xs px-2 py-1 h-8 min-h-0 w-full border-primary text-primary font-semibold">
                      <Link to={`/books/${book.id}`}>View</Link>
                    </Button>
                    {isLoggedIn && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAddToCollection(book.id)}
                        className="transition-all duration-300 hover:scale-105 text-xs px-2 py-1 h-8 min-h-0 w-full border-secondary text-secondary font-semibold"
                      >
                        +
                      </Button>
                    )}
                  </div>
                </CardFooter>
                {/* Add to Collection Modal (move inside Card) */}
                {showAddToCollection === book.id && (
                  <div className="border-t p-4 bg-muted animate-in slide-in-from-top-2 duration-300 rounded-b-xl">
                    <form onSubmit={handleCollectionSubmit((data) => handleAddToCollection(book, data))} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="collectionId">Collection</Label>
                        <select
                          {...registerCollection('collectionId')}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                        >
                          <option value="">Select a collection</option>
                          {collections.map((collection) => (
                            <option key={collection._id} value={collection._id}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                        {collectionErrors.collectionId && (
                          <p className="text-sm text-error">{collectionErrors.collectionId.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="readStatus">Reading Status</Label>
                        <select
                          {...registerCollection('readStatus')}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                        >
                          <option value="to-read">To Read</option>
                          <option value="reading">Currently Reading</option>
                          <option value="completed">Completed</option>
                          <option value="abandoned">Abandoned</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          {...registerCollection('notes')}
                          placeholder="Add your thoughts about this book..."
                          className="focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-surface"
                        />
                        {collectionErrors.notes && (
                          <p className="text-sm text-error">{collectionErrors.notes.message}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={adding} className="flex-1 transition-all duration-300 hover:scale-105 bg-primary text-white rounded-lg">
                          {adding ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              Adding...
                            </div>
                          ) : (
                            'Add to Collection'
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setShowAddToCollection(null);
                            resetCollection();
                          }}
                          className="transition-all duration-300 hover:scale-105 border-muted text-text-secondary rounded-lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </Card>
          ))}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPreviousPage || loading}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="transition-all duration-300 hover:scale-105 border-primary text-primary font-semibold"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-base text-text-secondary">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className="transition-all duration-300 hover:scale-105 border-primary text-primary font-semibold"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {!isLoggedIn && searchResults.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-7xl mb-6">📚</div>
          <h3 className="text-2xl font-bold mb-2 text-primary">Start searching for books</h3>
          <p className="text-text-secondary mb-4">
            Use the search form above to find your next favorite book
          </p>
          <div className="text-base text-text-secondary">
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>{' '}
            to save books to your collections
          </div>
        </div>
      )}
    </div>
  );
} 