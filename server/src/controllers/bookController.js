import bookSearchService from '../services/bookSearchService.js';
import advancedSearchService from '../services/advancedSearchService.js';
import { ApiError } from '../utils/errors.js';
import redis from '../utils/redis.js';
import logger from '../utils/logger.js';

class BookController {
  static async searchBooks(req, res, next) {
    try {
      const { q, page = 1 } = req.query;
      if (!q) throw new ApiError(400, 'Query parameter "q" is required');

      const cacheKey = `search:author:${q}:${page}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.render('books', {
          data: parsed.data,
          query: q,
          searchType: 'author',
          pagination: parsed.pagination
        });
      }

      const result = await bookSearchService.search({
        query: q,
        searchType: 'author',
        page: parseInt(page)
      });

      await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600); // cache 1 hour

      res.render('books', {
        data: result.data,
        query: q,
        searchType: 'author',
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async searchBooksByTitle(req, res) {
    try {
      const { title, page = 1 } = req.query;
      const cacheKey = `search:title:${title}:${page}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.render('books', {
          data: parsed.data,
          query: title,
          searchType: 'title'
        });
      }

      const result = await bookSearchService.search({
        query: title,
        searchType: 'title',
        page: parseInt(page)
      });

      await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600); // cache 1 hour

      res.render('books', {
        data: result.data,
        query: title,
        searchType: 'title'
      });
    } catch (error) {
      res.status(error.status || 500).render('books', {
        error: error.message || 'Title search failed'
      });
    }
  }

  static async advancedSearch(req, res, next) {
    try {
      const { 
        title, 
        author, 
        genre, 
        publishedAfter, 
        publishedBefore, 
        sortBy,
        page = 1 
      } = req.query;

      // Validate that at least one search parameter is provided
      if (!title && !author && !genre && !publishedAfter && !publishedBefore) {
        throw new ApiError(400, 'At least one search parameter is required');
      }

      const result = await advancedSearchService.advancedSearch({
        title,
        author,
        genre,
        publishedAfter,
        publishedBefore,
        sortBy,
        page: parseInt(page)
      });

      logger.info('Advanced search performed', { 
        params: { title, author, genre, publishedAfter, publishedBefore },
        resultsCount: result.data.length
      });

      return res.render('books', {
        data: result.data,
        pagination: result.pagination,
        query: { title, author, genre, publishedAfter, publishedBefore, sortBy }
      });
    } catch (error) {
      logger.error('Advanced search error', { error: error.message });
      next(error);
    }
  }
}

export default BookController;
