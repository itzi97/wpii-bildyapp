// tests/upload.test.js
import { jest } from '@jest/globals';
import { uploadMemory, uploadDisk, upload, imageFilter } from '../src/middleware/upload.js';
import AppError from '../src/utils/AppError.js';

describe('upload middleware exports', () => {
  it('exports uploadMemory, uploadDisk, and compatibility upload', () => {
    expect(uploadMemory).toBeDefined();
    expect(uploadDisk).toBeDefined();
    expect(upload).toBe(uploadMemory);
  });

  it('has multer middleware functions', () => {
    expect(typeof uploadMemory.single).toBe('function');
    expect(typeof uploadDisk.single).toBe('function');
  });

  it('rejects non-image mimetypes via fileFilter', () => {
    const cb = jest.fn();

    imageFilter({}, { mimetype: 'text/plain', originalname: 'test.txt' }, cb);

    expect(cb.mock.calls[0][0]).toBeInstanceOf(AppError);
  });
});

describe('upload fileFilter error path', () => {
  it('rejects non-image mimetypes via fileFilter', (done) => {
    const cb = jest.fn();

    uploadMemory.fileFilter(
      {},
      { mimetype: 'text/plain', originalname: 'test.txt' },
      cb
    );

    expect(cb.mock.calls[0][0]).toBeInstanceOf(AppError);
    done();
  });
});


