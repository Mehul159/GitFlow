interface QueuedRequest<T> {
  id: string;
  requestFn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

const MAX_CONCURRENT = 2;
let currentRequests = 0;
const queue: QueuedRequest<unknown>[] = [];

export function queueAIRequest<T>(
  requestFn: () => Promise<T>,
  priority: "high" | "normal" = "normal"
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request: QueuedRequest<T> = {
      id: crypto.randomUUID(),
      requestFn,
      resolve,
      reject,
    };

    if (priority === "high") {
      queue.unshift(request as QueuedRequest<unknown>);
    } else {
      queue.push(request as QueuedRequest<unknown>);
    }

    processQueue();
  });
}

function processQueue(): void {
  while (currentRequests < MAX_CONCURRENT && queue.length > 0) {
    const request = queue.shift();
    if (!request) break;

    currentRequests++;
    executeRequest(request);
  }
}

async function executeRequest<T>(request: QueuedRequest<T>): Promise<void> {
  try {
    const result = await request.requestFn();
    request.resolve(result);
  } catch (error) {
    request.reject(error as Error);
  } finally {
    currentRequests--;
    processQueue();
  }
}

export function getQueueLength(): number {
  return queue.length;
}

export function getActiveRequests(): number {
  return currentRequests;
}
