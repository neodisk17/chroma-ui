/**
 * Web Worker for PCA computation
 * Performs dimensionality reduction without blocking the main thread
 */

interface Point2D {
  x: number;
  y: number;
}

interface WorkerMessage {
  type: 'compute';
  embeddings: number[][];
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error';
  progress?: number;
  result?: Point2D[];
  error?: string;
}

// Compute mean of each dimension
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

// Center the data by subtracting the mean
function centerData(data: number[][], mean: number[]): number[][] {
  return data.map(vector =>
    vector.map((value, i) => (value || 0) - (mean[i] || 0))
  );
}

// Compute covariance matrix
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

// Power iteration method to find dominant eigenvector
function powerIteration(matrix: number[][], iterations: number = 100): { eigenvalue: number; eigenvector: number[] } {
  const n = matrix.length;
  let vector = Array(n).fill(1 / Math.sqrt(n));

  for (let iter = 0; iter < iterations; iter++) {
    const newVector = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newVector[i]! += (matrix[i]?.[j] || 0) * (vector[j] || 0);
      }
    }

    const magnitude = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) break;
    vector = newVector.map(val => val / magnitude);
  }

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

// Deflate matrix to find next eigenvector
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

// Find top 2 principal components
function findTop2Components(covarianceMatrix: number[][]): number[][] {
  const pc1 = powerIteration(covarianceMatrix);
  const deflated = deflateMatrix(covarianceMatrix, pc1.eigenvalue, pc1.eigenvector);
  const pc2 = powerIteration(deflated);
  return [pc1.eigenvector, pc2.eigenvector];
}

// Project data onto principal components
function projectData(centeredData: number[][], components: number[][]): Point2D[] {
  return centeredData.map(vector => {
    const x = vector.reduce((sum, val, i) => sum + (val || 0) * (components[0]?.[i] || 0), 0);
    const y = vector.reduce((sum, val, i) => sum + (val || 0) * (components[1]?.[i] || 0), 0);
    return { x, y };
  });
}

// Normalize coordinates to [0, 1] range
function normalizeCoordinates(points: Point2D[]): Point2D[] {
  if (points.length === 0) return [];

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  return points.map(point => ({
    x: (point.x - minX) / rangeX,
    y: (point.y - minY) / rangeY,
  }));
}

// Main PCA function
function reduceTo2D(embeddings: number[][], postProgress: (p: number) => void): Point2D[] {
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

  try {
    postProgress(10);

    // Step 1: Compute mean
    const mean = computeMean(embeddings);
    postProgress(20);

    // Step 2: Center data
    const centeredData = centerData(embeddings, mean);
    postProgress(30);

    // Step 3: Compute covariance matrix
    const covarianceMatrix = computeCovarianceMatrix(centeredData);
    postProgress(50);

    // Step 4: Find top 2 principal components
    const components = findTop2Components(covarianceMatrix);
    postProgress(80);

    // Step 5: Project data onto components
    const projectedData = projectData(centeredData, components);
    postProgress(90);

    // Step 6: Normalize to [0, 1] range
    const result = normalizeCoordinates(projectedData);
    postProgress(100);

    return result;
  } catch (error) {
    console.error('PCA computation failed:', error);
    // Fallback: return first two dimensions normalized
    return normalizeCoordinates(
      embeddings.map(v => ({ x: v[0] || 0, y: v[1] || 0 }))
    );
  }
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, embeddings } = event.data;

  if (type === 'compute') {
    try {
      const postProgress = (progress: number) => {
        const response: WorkerResponse = { type: 'progress', progress };
        self.postMessage(response);
      };

      const result = reduceTo2D(embeddings, postProgress);

      const response: WorkerResponse = { type: 'complete', result };
      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      self.postMessage(response);
    }
  }
};
