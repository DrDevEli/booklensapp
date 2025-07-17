import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../api';

interface Collection {
  _id: string;
  name: string;
  description?: string;
  books: Array<{
    bookId: string;
    title: string;
    authors: string[];
    coverImage?: string;
    readStatus: 'to-read' | 'reading' | 'completed' | 'abandoned';
    rating?: number;
    notes?: string;
  }>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Collection name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean(),
});

type CreateCollectionForm = z.infer<typeof createCollectionSchema>;

export function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<CreateCollectionForm>({
    resolver: zodResolver(createCollectionSchema),
    defaultValues: {
      isPublic: false,
    },
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/collections');
      if (response.data.success) {
        setCollections(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateCollectionForm) => {
    try {
      setCreating(true);
      const response = await api.post('/collections', data);
      if (response.data.success) {
        setCollections([...collections, response.data.data]);
        setShowCreateForm(false);
        reset();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const getReadStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'abandoned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReadStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'reading': return 'Reading';
      case 'abandoned': return 'Abandoned';
      default: return 'To Read';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#dbcd90' }}>
            My Collections
          </h1>
          <p className="text-muted-foreground mt-2">
            Organize your books into personalized collections
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-primary to-teal text-white"
        >
          Create Collection
        </Button>
      </div>

      {/* Create Collection Form */}
      {showCreateForm && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Create New Collection</CardTitle>
            <CardDescription>
              Give your collection a name and description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name</Label>
                <Input
                  id="name"
                  placeholder="My Favorite Books"
                  {...register('name')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="A collection of my favorite books..."
                  {...register('description')}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  {...register('isPublic')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isPublic">Make this collection public</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? 'Creating...' : 'Create Collection'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first collection to start organizing your books
            </p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-primary to-teal text-white"
            >
              Create Your First Collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card key={collection._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{collection.name}</CardTitle>
                    <CardDescription>
                      {collection.description || 'No description'}
                    </CardDescription>
                  </div>
                  {collection.isPublic && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Public
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Books</span>
                    <span className="font-semibold">{collection.books.length}</span>
                  </div>
                  {collection.books.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Recent books:</p>
                      <div className="space-y-1">
                        {collection.books.slice(0, 3).map((book, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            {book.coverImage && (
                              <img 
                                src={book.coverImage} 
                                alt={book.title}
                                className="w-8 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">{book.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {book.authors.join(', ')}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getReadStatusColor(book.readStatus)}`}>
                              {getReadStatusText(book.readStatus)}
                            </span>
                          </div>
                        ))}
                        {collection.books.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{collection.books.length - 3} more books
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/collections/${collection._id}`}>
                    View Collection
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 