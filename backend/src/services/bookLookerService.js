import axios from "axios";
import logger from "../config/logger.js";
import { ApiError } from "../utils/errors.js";

const BOOKLOOKER_API_URL = "https://api.booklooker.de";
const BOOKLOOKER_API_KEY = process.env.BOOKLOOKER_API_KEY;

class BooklookerService {
  /**
   * Search for books using Booklooker API
   * @param {Object} params - Search parameters
   * @param {string} [params.title] - Title to search
   * @param {string} [params.author] - Author name
   * @param {number} [params.page=1] - Page number
   * @returns {Promise<Array>} Search results
   */
  async searchBooklooker({ title, author, page = 1 }){
    try{
	if (!BOOKLOOKER_API_KEY) {
		logger.warn("Booklooker API key not configured");
		throw new ApiError("Booklooker API key not configured", 500);
	}

	// Build search query
	let query = "";
	if (title && author) {
		query = `${title} ${author}`;
	} else if (title) {
		query = title;
	} else if (author) {
		query = author;
	} else {
		return [];
	}

	const params = {
		q: query,
		page: page,
		limit: 20,
		key: BOOKLOOKER_API_KEY
	};

	logger.info("Searching Booklooker API", {
		title, 
		author, 
		page,
		query,
		apiUrl: BOOKLOOKER_API_URL
	});

	const res = await axios.get(`${BOOKLOOKER_API_URL}/search`, {
		params,
		timeout: 10000,
		headers: {
			'Accept': 'application/json',
			'User-Agent': 'BookPath/1.0'
		}
	});

	if (!res.data || !res.data.results) {
		logger.warn("Invalid response from Booklooker API");
		return [];
	}

	// Map Booklooker data to our internal format
	const transformedData = res.data.results.map(book => ({
		id: `booklooker-${book.id}`,
		title: book.title || "Unknown Title",
		authors: book.author ? [book.author] : [],
		firstPublishYear: book.published_year || null,
		coverImage: book.cover_image || null,
		editionCount: book.edition_count || 1,
		hasFullText: false, // Booklooker doesn't provide full text
		ratingsAverage: book.rating_average || null,
		ratingsCount: book.rating_count || null,
		openLibraryKey: null,
		source: "booklooker",
		price: book.price || null,
		currency: book.currency || 'EUR',
		condition: book.condition || null,
		seller: book.seller || null,
		isbn: book.isbn || null,
		language: book.language || null,
		publisher: book.publisher || null,
		format: book.format || null, // hardcover, paperback, etc.
		availability: book.availability || null
	}));

	logger.info("Booklooker search completed successfully", {
		resultCount: transformedData.length,
		totalResults: res.data.total_results || 0
	});

	return transformedData;
    } catch (error) {
      logger.error("Booklooker search error", {
        error: error.message,
        title,
        author,
        page,
        apiUrl: BOOKLOOKER_API_URL,
        response: error.response?.data
      });

      if (error.response?.status === 401) {
		logger.warn("Booklooker API key invalid");
		return [];
	}
      if (error.response?.status === 429) {
		logger.warn("Booklooker API rate limit exceeded");
		return [];
	}
      if (error.code === "ECONNREFUSED") {
		logger.warn("Cannot connect to Booklooker API");
		return [];
	}

      // Return empty array instead of throwing error to not break the entire search
      return [];
    }
  }

  /**
   * Get book details by Booklooker ID
   * @param {string} bookId - Booklooker book ID
   * @returns {Promise<Object|null>} Book details or null
   */
  async getBookDetails(bookId){
    try{
      if (!BOOKLOOKER_API_KEY) {
        return null;
      }

      logger.info("Fetching book details from Booklooker", { bookId });

      const res = await axios.get(`${BOOKLOOKER_API_URL}/books/${bookId}`, {
        params: { key: BOOKLOOKER_API_KEY },
        timeout: 10000,
        headers: {
			'Accept': 'application/json',
			'User-Agent': 'BookPath/1.0'
		}
      });

      if (!res.data) {
        return null;
      }

      const bookData = {
        id: `booklooker-${res.data.id}`,
        title: res.data.title,
        authors: res.data.author ? [res.data.author] : [],
        firstPublishYear: res.data.published_year,
        coverImage: res.data.cover_image,
        price: res.data.price,
        currency: res.data.currency,
        condition: res.data.condition,
        seller: res.data.seller,
        isbn: res.data.isbn,
        language: res.data.language,
        publisher: res.data.publisher,
        format: res.data.format,
        availability: res.data.availability,
        source: "booklooker"
      };

      logger.info("Booklooker book details fetched successfully", { bookId });
      return bookData;
    } catch (error) {
      logger.error("Error fetching Booklooker book details", {
        error: error.message,
        bookId
      });
      return null;
    }
  }
}

export default new BooklookerService();