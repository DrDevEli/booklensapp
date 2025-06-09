import axios from 'axios';
import { ApiError } from '../utils/errors.js';
import redis from '../config/redis.js';
import logger from '../config/logger.js';

const BOOK_API_ENDPOINT = process.env.BOOK_API_ENDPOINT;
const API_KEY = process.env.BOOK_API_KEY;
const ITEMS_PER_PAGE = parseInt(process.env.ITEMS_PER_PAGE || '10');
const CACHE_TTL = parseInt(process.env.SEARCH_CACHE_TTL || '3600');

class AdvancedSearchService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BOOK_API_ENDPOINT,
      timeout: parseInt(process.env.BOOK_API_TIMEOUT || '5000'),
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
  }

  /**
   * Perform advanced book search with multiple filters
   * @param {Object} params - Search parameters
   * @param {string} [params.title] - Title to search
   * @param {string} [params.author] - Author name 
   * @param {string} [params.genre] - Genre filter
   * @param {string} [params.publishedAfter] - Published after date (YYYY-MM-DD)
   * @param {string} [params.publishedBefore] - Published before date (YYYY-MM-DD) 
   * @param {string} [params.sortBy] - Sort field
   * @param {number} [params.page=1] - Page number
   * @returns {Promise<Object>} Search results with pagination
   */
  async advancedSearch({ title, author, genre, publishedAfter, publishedBefore, sortBy, page = 1 }) {
    try {
      // Create a cache key based on all search parameters
      const cacheKey = `search:advanced:${JSON.stringify({
        title, author, genre, publishedAfter, publishedBefore, sortBy, page
      })}`;

      // Check cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Advanced search cache hit', { cacheKey });
        return JSON.parse(cached);
      }

      logger.debug('Advanced search cache miss', { cacheKey });

      // Build query parameters
      const params = { page, itemsPerPage: ITEMS_PER_PAGE };
      if (title) params.title = title;
      if (author) params.author = author;
      if (genre) params.genre = genre;
      if (publishedAfter) params.publishedAfter = publishedAfter;
      if (publishedBefore) params.publishedBefore = publishedBefore;
      if (sortBy) params.sortBy = sortBy;

      const response = await this.axiosInstance.get('/books', { params });
      const formattedResponse = this.formatResponse(response, page);

      // Cache the response
      await redis.set(cacheKey, JSON.stringify(formattedResponse), 'EX', CACHE_TTL);

      return formattedResponse;
    } catch (error) {
      logger.error('Advanced search error', { 
        error: error.message,
        params: { title, author, genre, publishedAfter, publishedBefore, sortBy, page }
      });
      throw this.handleError(error);
    }
  }

  formatResponse(response, currentPage) {
    if (!response.data.items?.length) {
      throw new ApiError(404, 'No books found matching your search criteria');
    }

    return {
      data: response.data.items,
      pagination: {
        currentPage,
        totalPages: Math.ceil(response.data.totalItems / ITEMS_PER_PAGE),
        totalItems: response.data.totalItems
      }
    };
  }

  handleError(error) {
    return new ApiError(
      error.response?.status || 500,
      error.response?.data?.message || 'Advanced book search service unavailable'
    );
  }
}

export default new AdvancedSearchService();
