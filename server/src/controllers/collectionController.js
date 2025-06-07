import BookCollection from '../models/BookCollection.js';
import { ApiError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class CollectionController {
  static async createCollection(req, res, next) {
    try {
      const { name, description, isPublic } = req.body;
      const userId = req.user.id;

      if (!name) {
        throw new ApiError(400, 'Collection name is required');
      }

      // Check if collection with same name already exists for this user
      const existingCollection = await BookCollection.findOne({ user: userId, name });
      if (existingCollection) {
        throw new ApiError(400, 'Collection with this name already exists');
      }

      const newCollection = await BookCollection.create({
        user: userId,
        name,
        description,
        isPublic: !!isPublic,
        books: []
      });

      logger.info('Collection created', { userId, collectionId: newCollection._id });

      res.status(201).json({
        success: true,
        data: newCollection
      });
    } catch (error) {
      logger.error('Collection creation error', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  static async getUserCollections(req, res, next) {
    try {
      const userId = req.user.id;
      const collections = await BookCollection.find({ user: userId });

      res.status(200).json({
        success: true,
        count: collections.length,
        data: collections
      });
    } catch (error) {
      logger.error('Get collections error', { userId: req.user?.id, error: error.message });
      next(error);
    }
  }

  static async getCollectionById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const collection = await BookCollection.findOne({
        _id: id,
        $or: [
          { user: userId },
          { isPublic: true }
        ]
      });

      if (!collection) {
        throw new ApiError(404, 'Collection not found or access denied');
      }

      res.status(200).json({
        success: true,
        data: collection
      });
    } catch (error) {
      logger.error('Get collection by ID error', { 
        userId: req.user?.id, 
        collectionId: req.params.id, 
        error: error.message 
      });
      next(error);
    }
  }

  static async addBookToCollection(req, res, next) {
    try {
      const { collectionId } = req.params;
      const { bookId, title, authors, coverImage, notes, readStatus } = req.body;
      const userId = req.user.id;

      if (!bookId || !title) {
        throw new ApiError(400, 'Book ID and title are required');
      }

      const collection = await BookCollection.findOne({ _id: collectionId, user: userId });
      if (!collection) {
        throw new ApiError(404, 'Collection not found or access denied');
      }

      // Check if book already exists in collection
      const bookExists = collection.books.some(book => book.bookId === bookId);
      if (bookExists) {
        throw new ApiError(400, 'Book already exists in this collection');
      }

      collection.books.push({
        bookId,
        title,
        authors: authors || [],
        coverImage,
        notes,
        readStatus: readStatus || 'to-read'
      });

      await collection.save();

      logger.info('Book added to collection', { 
        userId, 
        collectionId, 
        bookId 
      });

      res.status(200).json({
        success: true,
        data: collection
      });
    } catch (error) {
      logger.error('Add book to collection error', { 
        userId: req.user?.id, 
        collectionId: req.params.collectionId, 
        error: error.message 
      });
      next(error);
    }
  }

  static async updateBookInCollection(req, res, next) {
    try {
      const { collectionId, bookId } = req.params;
      const { notes, rating, readStatus } = req.body;
      const userId = req.user.id;

      const collection = await BookCollection.findOne({ _id: collectionId, user: userId });
      if (!collection) {
        throw new ApiError(404, 'Collection not found or access denied');
      }

      const bookIndex = collection.books.findIndex(book => book.bookId === bookId);
      if (bookIndex === -1) {
        throw new ApiError(404, 'Book not found in collection');
      }

      // Update only the provided fields
      if (notes !== undefined) collection.books[bookIndex].notes = notes;
      if (rating !== undefined) collection.books[bookIndex].rating = rating;
      if (readStatus !== undefined) collection.books[bookIndex].readStatus = readStatus;

      await collection.save();

      logger.info('Book updated in collection', { 
        userId, 
        collectionId, 
        bookId 
      });

      res.status(200).json({
        success: true,
        data: collection
      });
    } catch (error) {
      logger.error('Update book in collection error', { 
        userId: req.user?.id, 
        collectionId: req.params.collectionId, 
        bookId: req.params.bookId,
        error: error.message 
      });
      next(error);
    }
  }

  static async removeBookFromCollection(req, res, next) {
    try {
      const { collectionId, bookId } = req.params;
      const userId = req.user.id;

      const collection = await BookCollection.findOne({ _id: collectionId, user: userId });
      if (!collection) {
        throw new ApiError(404, 'Collection not found or access denied');
      }

      const bookIndex = collection.books.findIndex(book => book.bookId === bookId);
      if (bookIndex === -1) {
        throw new ApiError(404, 'Book not found in collection');
      }

      collection.books.splice(bookIndex, 1);
      await collection.save();

      logger.info('Book removed from collection', { 
        userId, 
        collectionId, 
        bookId 
      });

      res.status(200).json({
        success: true,
        message: 'Book removed from collection',
        data: collection
      });
    } catch (error) {
      logger.error('Remove book from collection error', { 
        userId: req.user?.id, 
        collectionId: req.params.collectionId, 
        bookId: req.params.bookId,
        error: error.message 
      });
      next(error);
    }
  }
}

export default CollectionController;
