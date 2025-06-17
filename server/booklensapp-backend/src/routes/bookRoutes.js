import express from 'express';
import BookController from '../controllers/bookController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { rateLimiterMiddleware } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * /books/search:
 *   get:
 *     tags: [Books]
 *     summary: Search for books
 *     description: Search books by title, author, or ISBN
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [title, author, isbn]
 *         description: Search type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of books matching the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/PaginatedResponse'
 *         headers:
 *           $ref: '#/definitions/RateLimitHeaders'
 *       400:
 *         description: Invalid search parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get('/search', rateLimiterMiddleware, BookController.searchBooks);

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

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Get book details
 *     description: Retrieve detailed information about a specific book
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Book'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get('/:id', rateLimiterMiddleware, BookController.getBookById);

export default router;
