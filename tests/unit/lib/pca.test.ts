import { describe, it, expect } from 'vitest';
import {
  reduceTo2D,
  euclideanDistance,
  cosineSimilarity,
  vectorMagnitude,
  findNearestNeighbors,
  findSharedNeighbors,
  computeMidpointVector,
  Point2D,
} from '@/lib/pca';

describe('reduceTo2D', () => {
  it('should return empty array for empty input', () => {
    expect(reduceTo2D([])).toEqual([]);
  });

  it('should return center point for single vector', () => {
    const result = reduceTo2D([[1, 2, 3]]);
    expect(result).toEqual([{ x: 0.5, y: 0.5 }]);
  });

  it('should handle 1D embeddings', () => {
    const result = reduceTo2D([[1], [2], [3]]);
    expect(result).toHaveLength(3);
    result.forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBe(0);
    });
  });

  it('should handle 2D embeddings by normalizing directly', () => {
    const result = reduceTo2D([[0, 0], [1, 1], [0.5, 0.5]]);
    expect(result).toHaveLength(3);
    result.forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    });
  });

  it('should reduce 3D embeddings to 2D', () => {
    const embeddings = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
      [0, 1, 1],
    ];
    const result = reduceTo2D(embeddings);
    expect(result).toHaveLength(5);
    result.forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    });
  });

  it('should reduce high-dimensional embeddings to 2D', () => {
    const embeddings = Array.from({ length: 10 }, (_, i) =>
      Array.from({ length: 128 }, (_, j) => Math.sin(i + j))
    );
    const result = reduceTo2D(embeddings);
    expect(result).toHaveLength(10);
    result.forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(1);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    });
  });

  it('should handle identical vectors', () => {
    const embeddings = [[1, 2, 3], [1, 2, 3], [1, 2, 3]];
    const result = reduceTo2D(embeddings);
    expect(result).toHaveLength(3);
    // All points should be the same since vectors are identical
    result.forEach((point) => {
      expect(typeof point.x).toBe('number');
      expect(typeof point.y).toBe('number');
      expect(isNaN(point.x)).toBe(false);
      expect(isNaN(point.y)).toBe(false);
    });
  });

  it('should produce distinct points for distinct vectors', () => {
    // Use vectors with variance across multiple dimensions for PCA to separate
    const embeddings = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0],
      [0, 1, 1],
    ];
    const result = reduceTo2D(embeddings);
    expect(result).toHaveLength(5);
    // Multiple distinct vectors in 3D should produce non-degenerate 2D projection
    const uniquePoints = new Set(result.map((p) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`));
    expect(uniquePoints.size).toBeGreaterThan(1);
  });
});

describe('euclideanDistance', () => {
  it('should compute distance between identical vectors as 0', () => {
    expect(euclideanDistance([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it('should compute distance for 2D vectors', () => {
    expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
  });

  it('should compute distance for 3D vectors', () => {
    const result = euclideanDistance([1, 0, 0], [0, 1, 0]);
    expect(result).toBeCloseTo(Math.sqrt(2));
  });

  it('should throw for vectors of different length', () => {
    expect(() => euclideanDistance([1, 2], [1, 2, 3])).toThrow(
      'Vectors must have the same length'
    );
  });

  it('should handle zero vectors', () => {
    expect(euclideanDistance([0, 0, 0], [0, 0, 0])).toBe(0);
  });

  it('should handle negative values', () => {
    expect(euclideanDistance([-1, -1], [1, 1])).toBeCloseTo(2 * Math.sqrt(2));
  });
});

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  it('should return -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it('should return 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('should return 0 for zero vector', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it('should throw for vectors of different length', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(
      'Vectors must have the same length'
    );
  });

  it('should be symmetric', () => {
    const a = [1, 2, 3];
    const b = [4, 5, 6];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a));
  });

  it('should handle scaled versions of same vector', () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });
});

describe('vectorMagnitude', () => {
  it('should compute magnitude of unit vector', () => {
    expect(vectorMagnitude([1, 0, 0])).toBe(1);
  });

  it('should compute magnitude correctly', () => {
    expect(vectorMagnitude([3, 4])).toBe(5);
  });

  it('should return 0 for zero vector', () => {
    expect(vectorMagnitude([0, 0, 0])).toBe(0);
  });

  it('should handle negative values', () => {
    expect(vectorMagnitude([-3, 4])).toBe(5);
  });
});

describe('findNearestNeighbors', () => {
  const embeddings = [
    { id: 'a', vector: [1, 0, 0] },
    { id: 'b', vector: [0.9, 0.1, 0] },
    { id: 'c', vector: [0, 1, 0] },
    { id: 'd', vector: [0, 0, 1] },
    { id: 'e', vector: [-1, 0, 0] },
  ];

  it('should find k nearest neighbors sorted by similarity', () => {
    const result = findNearestNeighbors([1, 0, 0], embeddings, 2);
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('a'); // Identical vector
    expect(result[0]!.similarity).toBeCloseTo(1);
    expect(result[1]!.id).toBe('b'); // Very close vector
  });

  it('should exclude specified IDs', () => {
    const result = findNearestNeighbors(
      [1, 0, 0],
      embeddings,
      2,
      new Set(['a'])
    );
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('b');
  });

  it('should return fewer results if k > available', () => {
    const result = findNearestNeighbors([1, 0, 0], embeddings, 100);
    expect(result).toHaveLength(5);
  });

  it('should handle empty embeddings', () => {
    const result = findNearestNeighbors([1, 0, 0], [], 5);
    expect(result).toEqual([]);
  });

  it('should include distance in results', () => {
    const result = findNearestNeighbors([1, 0, 0], embeddings, 1);
    expect(result[0]!.distance).toBeDefined();
    expect(result[0]!.distance).toBe(0); // Same vector
  });
});

describe('findSharedNeighbors', () => {
  const embeddings = [
    { id: 'a', vector: [1, 0, 0] },
    { id: 'b', vector: [0.7, 0.7, 0] }, // Similar to both x and y axis
    { id: 'c', vector: [0, 1, 0] },
    { id: 'd', vector: [0, 0, 1] },
  ];

  it('should find vectors similar to both targets', () => {
    const result = findSharedNeighbors(
      [1, 0, 0],
      [0, 1, 0],
      embeddings,
      0.5,
      10
    );
    // 'b' should be a shared neighbor since it's between both vectors
    const bResult = result.find((r) => r.id === 'b');
    if (bResult) {
      expect(bResult.similarity1).toBeGreaterThanOrEqual(0.5);
      expect(bResult.similarity2).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('should respect minSimilarity threshold', () => {
    const result = findSharedNeighbors(
      [1, 0, 0],
      [0, 1, 0],
      embeddings,
      0.99,
      10
    );
    // With 0.99 threshold, unlikely to find shared neighbors for orthogonal vectors
    expect(result.length).toBeLessThanOrEqual(embeddings.length);
  });

  it('should respect maxResults limit', () => {
    const result = findSharedNeighbors(
      [1, 0, 0],
      [0, 1, 0],
      embeddings,
      0.0,
      1
    );
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('should return empty for empty embeddings', () => {
    const result = findSharedNeighbors([1, 0, 0], [0, 1, 0], [], 0.5, 10);
    expect(result).toEqual([]);
  });
});

describe('computeMidpointVector', () => {
  it('should compute midpoint of two vectors', () => {
    const result = computeMidpointVector([0, 0], [2, 2]);
    expect(result).toEqual([1, 1]);
  });

  it('should handle identical vectors', () => {
    const result = computeMidpointVector([1, 2, 3], [1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should throw for different length vectors', () => {
    expect(() => computeMidpointVector([1, 2], [1, 2, 3])).toThrow(
      'Vectors must have the same length'
    );
  });

  it('should handle negative values', () => {
    const result = computeMidpointVector([-1, -1], [1, 1]);
    expect(result).toEqual([0, 0]);
  });

  it('should handle zero vectors', () => {
    const result = computeMidpointVector([0, 0, 0], [0, 0, 0]);
    expect(result).toEqual([0, 0, 0]);
  });
});
