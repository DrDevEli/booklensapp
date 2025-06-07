import express from 'express';
import CollectionController from '../controllers/collectionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware(), CollectionController.createCollection);
router.get('/', authMiddleware(), CollectionController.getUserCollections);
router.get('/:id', authMiddleware(), CollectionController.getCollectionById);
router.post('/:collectionId/books', authMiddleware(), CollectionController.addBookToCollection);
router.put('/:collectionId/books/:bookId', authMiddleware(), CollectionController.updateBookInCollection);
router.delete('/:collectionId/books/:bookId', authMiddleware(), CollectionController.removeBookFromCollection);

export default router;
