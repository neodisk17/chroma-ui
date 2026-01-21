/**
 * Principal Component Analysis (PCA) for dimensionality reduction
 * Reduces high-dimensional embeddings to 2D for visualization
 */

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Compute mean of each dimension
 */
function computeMean(data: number[][]): number[] {
  if (data.length === 0 || !data[0]) {
    return [];
  }

  const dimensions = data[0].length;
  const mean = new Array(dimensions).fill(0);

  for (const vector of data) {
    for (let i = 0; i < dimensions; i++) {
      mean[i] += vector[i] || 0;
    }
  }

  for (let i = 0; i < dimensions; i++) {
    mean[i] /= data.length;
  }

  return mean;
}

/**
 * Center the data by subtracting the mean
 */
function centerData(data: number[][], mean: number[]): number[][] {
  return data.map(vector =>
    vector.map((value, i) => (value || 0) - (mean[i] || 0))
  );
}

/**
 * Compute covariance matrix
 */
function computeCovarianceMatrix(centeredData: number[][]): number[][] {
  if (centeredData.length === 0 || !centeredData[0]) {
    return [];
  }

  const dimensions = centeredData[0].length;
  const n = centeredData.length;
  const covariance: number[][] = Array(dimensions).fill(0).map(() => Array(dimensions).fill(0));

  for (let i = 0; i < dimensions; i++) {
    for (let j = 0; j < dimensions; j++) {
      let sum = 0;
      for (const vector of centeredData) {
        sum += (vector[i] || 0) * (vector[j] || 0);
      }
      covariance[i]![j] = sum / (n - 1);
    }
  }

  return covariance;
}

/**
 * Power iteration method to find dominant eigenvector
 */
function powerIteration(matrix: number[][], iterations: number = 100): { eigenvalue: number; eigenvector: number[] } {
  const n = matrix.length;
  let vector = Array(n).fill(1 / Math.sqrt(n)); // Initialize with normalized vector

  for (let iter = 0; iter < iterations; iter++) {
    // Multiply matrix by vector
    const newVector = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newVector[i]! += (matrix[i]?.[j] || 0) * (vector[j] || 0);
      }
    }

    // Normalize
    const magnitude = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) break;
    vector = newVector.map(val => val / magnitude);
  }

  // Compute eigenvalue (Rayleigh quotient)
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    let matrixTimesVector = 0;
    for (let j = 0; j < n; j++) {
      matrixTimesVector += (matrix[i]?.[j] || 0) * (vector[j] || 0);
    }
    numerator += (vector[i] || 0) * matrixTimesVector;
    denominator += (vector[i] || 0) * (vector[i] || 0);
  }
  const eigenvalue = numerator / denominator;

  return { eigenvalue, eigenvector: vector };
}

/**
 * Deflate matrix to find next eigenvector
 */
function deflateMatrix(matrix: number[][], eigenvalue: number, eigenvector: number[]): number[][] {
  const n = matrix.length;
  const deflated: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      deflated[i]![j] = (matrix[i]?.[j] || 0) - eigenvalue * (eigenvector[i] || 0) * (eigenvector[j] || 0);
    }
  }

  return deflated;
}

/**
 * Find top 2 principal components using power iteration
 */
function findTop2Components(covarianceMatrix: number[][]): number[][] {
  // Find first principal component
  const pc1 = powerIteration(covarianceMatrix);

  // Deflate matrix and find second principal component
  const deflated = deflateMatrix(covarianceMatrix, pc1.eigenvalue, pc1.eigenvector);
  const pc2 = powerIteration(deflated);

  return [pc1.eigenvector, pc2.eigenvector];
}

/**
 * Project data onto principal components
 */
function projectData(centeredData: number[][], components: number[][]): Point2D[] {
  return centeredData.map(vector => {
    const x = vector.reduce((sum, val, i) => sum + (val || 0) * (components[0]?.[i] || 0), 0);
    const y = vector.reduce((sum, val, i) => sum + (val || 0) * (components[1]?.[i] || 0), 0);
    return { x, y };
  });
}

/**
 * Normalize coordinates to [0, 1] range for better visualization
 */
function normalizeCoordinates(points: Point2D[]): Point2D[] {
  if (points.length === 0) return [];

  // Find min and max
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  // Normalize
  const rangeX = maxX - minX || 1; // Avoid division by zero
  const rangeY = maxY - minY || 1;

  return points.map(point => ({
    x: (point.x - minX) / rangeX,
    y: (point.y - minY) / rangeY,
  }));
}

/**
 * Reduce high-dimensional embeddings to 2D using PCA
 *
 * @param embeddings - Array of embedding vectors
 * @returns Array of 2D points
 *
 * @example
 * const embeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]];
 * const points = reduceTo2D(embeddings);
 * // points = [{ x: 0.2, y: 0.8 }, { x: 0.7, y: 0.3 }]
 */
export function reduceTo2D(embeddings: number[][]): Point2D[] {
  // Handle edge cases
  if (embeddings.length === 0) {
    return [];
  }

  if (embeddings.length === 1) {
    return [{ x: 0.5, y: 0.5 }];
  }

  const firstVector = embeddings[0];
  if (!firstVector) {
    return [];
  }

  const dimensions = firstVector.length;

  // If already 2D, just normalize
  if (dimensions === 2) {
    return normalizeCoordinates(
      embeddings.map(v => ({ x: v[0] || 0, y: v[1] || 0 }))
    );
  }

  // If 1D, pad with zeros
  if (dimensions === 1) {
    return normalizeCoordinates(
      embeddings.map(v => ({ x: v[0] || 0, y: 0 }))
    );
  }

  // Perform PCA
  try {
    // Step 1: Compute mean
    const mean = computeMean(embeddings);

    // Step 2: Center data
    const centeredData = centerData(embeddings, mean);

    // Step 3: Compute covariance matrix
    const covarianceMatrix = computeCovarianceMatrix(centeredData);

    // Step 4: Find top 2 principal components
    const components = findTop2Components(covarianceMatrix);

    // Step 5: Project data onto components
    const projectedData = projectData(centeredData, components);

    // Step 6: Normalize to [0, 1] range
    return normalizeCoordinates(projectedData);
  } catch (error) {
    console.error('PCA computation failed:', error);
    // Fallback: return first two dimensions normalized
    return normalizeCoordinates(
      embeddings.map(v => ({ x: v[0] || 0, y: v[1] || 0 }))
    );
  }
}

/**
 * Compute Euclidean distance between two vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Compute cosine similarity between two vectors
 * Returns a value between -1 and 1 (1 = identical, -1 = opposite, 0 = orthogonal)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    const valA = a[i] || 0;
    const valB = b[i] || 0;
    dotProduct += valA * valB;
    magnitudeA += valA * valA;
    magnitudeB += valB * valB;
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Compute vector magnitude (L2 norm)
 */
export function vectorMagnitude(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
}

/**
 * Result of nearest neighbor search
 */
export interface NeighborResult {
  id: string;
  index: number;
  similarity: number;
  distance: number;
}

/**
 * Find k nearest neighbors of a target vector using cosine similarity
 *
 * @param targetVector - The vector to find neighbors for
 * @param embeddings - Array of {id, vector} objects to search
 * @param k - Number of neighbors to return
 * @param excludeIds - Optional set of IDs to exclude from results
 * @returns Array of neighbor results sorted by similarity (highest first)
 */
export function findNearestNeighbors(
  targetVector: number[],
  embeddings: Array<{ id: string; vector: number[] }>,
  k: number,
  excludeIds?: Set<string>
): NeighborResult[] {
  const results: NeighborResult[] = [];

  for (let i = 0; i < embeddings.length; i++) {
    const embedding = embeddings[i];
    if (!embedding || (excludeIds && excludeIds.has(embedding.id))) {
      continue;
    }

    const similarity = cosineSimilarity(targetVector, embedding.vector);
    const distance = euclideanDistance(targetVector, embedding.vector);

    results.push({
      id: embedding.id,
      index: i,
      similarity,
      distance,
    });
  }

  // Sort by similarity (highest first) and return top k
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, k);
}

/**
 * Find documents that are similar to both target vectors (shared neighbors)
 *
 * @param vector1 - First target vector
 * @param vector2 - Second target vector
 * @param embeddings - Array of {id, vector} objects to search
 * @param minSimilarity - Minimum similarity threshold to both vectors
 * @param maxResults - Maximum number of results to return
 * @returns Array of neighbor results with combined similarity scores
 */
export function findSharedNeighbors(
  vector1: number[],
  vector2: number[],
  embeddings: Array<{ id: string; vector: number[] }>,
  minSimilarity: number = 0.5,
  maxResults: number = 10
): Array<NeighborResult & { similarity1: number; similarity2: number }> {
  const results: Array<NeighborResult & { similarity1: number; similarity2: number }> = [];

  for (let i = 0; i < embeddings.length; i++) {
    const embedding = embeddings[i];
    if (!embedding) continue;

    const similarity1 = cosineSimilarity(vector1, embedding.vector);
    const similarity2 = cosineSimilarity(vector2, embedding.vector);

    // Must meet minimum similarity to both vectors
    if (similarity1 >= minSimilarity && similarity2 >= minSimilarity) {
      const avgSimilarity = (similarity1 + similarity2) / 2;
      const distance = (euclideanDistance(vector1, embedding.vector) +
                       euclideanDistance(vector2, embedding.vector)) / 2;

      results.push({
        id: embedding.id,
        index: i,
        similarity: avgSimilarity,
        distance,
        similarity1,
        similarity2,
      });
    }
  }

  // Sort by average similarity (highest first) and return top results
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, maxResults);
}

/**
 * Compute the midpoint vector between two vectors
 */
export function computeMidpointVector(vector1: number[], vector2: number[]): number[] {
  if (vector1.length !== vector2.length) {
    throw new Error('Vectors must have the same length');
  }
  return vector1.map((val, i) => ((val || 0) + (vector2[i] || 0)) / 2);
}
