import express from "express";
import CollectionController from "../controllers/collectionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { rateLimiterMiddleware } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * /collections:
 *   post:
 *     tags: [Collections]
 *     summary: Create a new collection
 *     description: Create a new book collection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Favorite Books
 *               description:
 *                 type: string
 *                 example: A collection of my favorite books
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Collection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/BookCollection'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.post(
  "/",
  authMiddleware(),
  rateLimiterMiddleware,
  CollectionController.createCollection
);

/**
 * @swagger
 * /collections:
 *   get:
 *     tags: [Collections]
 *     summary: Get user's collections
 *     description: Retrieve all collections for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of collections
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/PaginatedResponse'
 *         headers:
 *           $ref: '#/definitions/RateLimitHeaders'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get(
  "/",
  authMiddleware(),
  rateLimiterMiddleware,
  CollectionController.getUserCollections
);

/**
 * @swagger
 * /collections/{id}:
 *   get:
 *     tags: [Collections]
 *     summary: Get collection details
 *     description: Retrieve detailed information about a specific collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     responses:
 *       200:
 *         description: Collection details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/BookCollection'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Collection not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get(
  "/:id",
  authMiddleware(),
  rateLimiterMiddleware,
  CollectionController.getCollectionById
);

router.post(
  "/:collectionId/books",
  authMiddleware(),
  CollectionController.addBookToCollection
);
router.put(
  "/:collectionId/books/:bookId",
  authMiddleware(),
  CollectionController.updateBookInCollection
);
router.delete(
  "/:collectionId/books/:bookId",
  authMiddleware(),
  CollectionController.removeBookFromCollection
);

export default router;
