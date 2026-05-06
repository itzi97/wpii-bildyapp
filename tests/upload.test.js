// tests/upload.test.js
import { jest } from '@jest/globals';
import { uploadMemory, imageFilter } from '../src/middleware/upload.js';
import AppError from '../src/utils/AppError.js';

// Tests the in-memory multer upload configuration and the image file filter.

describe('uploadMemory middleware', () => {
  it('exports uploadMemory with multer middleware functions', () => {
    expect(uploadMemory).toBeDefined();
    expect(typeof uploadMemory.single).toBe('function');
    expect(typeof uploadMemory.array).toBe('function');
  });
});

describe('imageFilter', () => {
  it('accepts allowed image mimetypes', () => {
    const cb = jest.fn();
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (const mimetype of allowed) {
      imageFilter({}, { mimetype }, cb);
      expect(cb).toHaveBeenLastCalledWith(null, true);
    }
  });

  it('rejects non-image mimetypes with an AppError', () => {
    const cb = jest.fn();
    imageFilter({}, { mimetype: 'text/plain', originalname: 'test.txt' }, cb);

    const err = cb.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
  });

  it('rejects application/pdf with an AppError', () => {
    const cb = jest.fn();
    imageFilter({}, { mimetype: 'application/pdf', originalname: 'doc.pdf' }, cb);

    const err = cb.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
  });
});
