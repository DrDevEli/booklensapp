import express from 'express';
import BookController from '../controllers/bookController.js';

const router = express.Router();

// Search routes
router.get('/search', (req, res, next) => {
  if (typeof BookController.searchBooks === 'function') {
    return BookController.searchBooks(req, res, next);
  }
  res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/search/title', (req, res, next) => {
  if (typeof BookController.searchBooksByTitle === 'function') {
    return BookController.searchBooksByTitle(req, res, next);
  }
  res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/search/advanced', (req, res, next) => {
  if (typeof BookController.advancedSearch === 'function') {
    return BookController.advancedSearch(req, res, next);
  }
  res.status(501).json({ message: 'Not implemented yet' });
});

// Book detail route
router.get('/:id', (req, res, next) => {
  if (typeof BookController.getBookById === 'function') {
    return BookController.getBookById(req, res, next);
  }
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
