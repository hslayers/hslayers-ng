import Queue from 'queue';

import {Injectable} from '@angular/core';

type Queues = {
  [useCase: string]: {
    q: Queue;
  };
};

@Injectable({
  providedIn: 'root',
})
export class HsQueuesService {
  queues: Queues = {};

  /**
   * Get the params saved by the queues service for the current app
   * @param useCase - Queue for
   * @param customConcurrency - (Optional) custom concurrency
   * @param timeout - (Optional) Timeout of one queue item
   */
  ensureQueue(
    useCase: string,
    customConcurrency?: number,
    timeout?: number
  ): Queue {
    if (this.queues[useCase]) {
      return this.queues[useCase].q;
    }
    const newQueue: {
      q: Queue;
    } = {
      q: new Queue({
        results: [],
        concurrency: customConcurrency || 5,
        autostart: true,
        timeout,
      }),
    };
    this.queues[useCase] = newQueue;
    newQueue.q.addEventListener('end', () => {
      delete this.queues[useCase];
    });
    return newQueue.q;
  }
}
