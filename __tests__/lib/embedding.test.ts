// Mock @xenova/transformers to avoid loading heavy dependencies in tests
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
  env: { cacheDir: '' },
}));

import { cosineSimilarity } from '@/lib/embedding';

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const vec1 = [1, 2, 3];
    const vec2 = [1, 2, 3];
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(1.0);
  });

  it('should return 0 for orthogonal vectors', () => {
    const vec1 = [1, 0];
    const vec2 = [0, 1];
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0.0);
  });

  it('should return -1 for opposite vectors', () => {
    const vec1 = [1, 0];
    const vec2 = [-1, 0];
    expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(-1.0);
  });
});
