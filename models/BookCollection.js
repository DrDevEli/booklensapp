import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const bookCollectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  books: [{
    bookId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    authors: [String],
    coverImage: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    readStatus: {
      type: String,
      enum: ['to-read', 'reading', 'completed', 'abandoned'],
      default: 'to-read'
    },
    dateStarted: {
      type: Date
    },
    dateFinished: {
      type: Date
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
bookCollectionSchema.index({ user: 1, name: 1 }, { unique: true });
bookCollectionSchema.index({ 'books.bookId': 1 });
bookCollectionSchema.index({ isPublic: 1 });

// Virtual for book count
bookCollectionSchema.virtual('bookCount').get(function() {
  return this.books.length;
});

// Method to add a book to collection
bookCollectionSchema.methods.addBook = function(book) {
  // Check if book already exists
  const exists = this.books.some(b => b.bookId === book.bookId);
  if (!exists) {
    this.books.push(book);
  }
  return this;
};

// Method to remove a book from collection
bookCollectionSchema.methods.removeBook = function(bookId) {
  this.books = this.books.filter(book => book.bookId !== bookId);
  return this;
};

// Logging middleware
bookCollectionSchema.post('save', function(doc) {
  logger.info('Collection saved', { 
    collectionId: doc._id, 
    userId: doc.user, 
    bookCount: doc.books.length 
  });
});

const BookCollection = mongoose.model('BookCollection', bookCollectionSchema);

export default BookCollection;
