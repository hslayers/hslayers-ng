import {Injectable} from '@angular/core';

import queue from 'queue';

@Injectable({
  providedIn: 'root',
})
export class HsQueuesService {
  queues: {
    [usecase: string]: {
      q: any; // queueObject
    };
  } = {};
  ensureQueue(useCase: string, customConcurrency?: number): queue {
    if (this.queues[useCase]) {
      return this.queues[useCase].q;
    }
    const newQueue: {
      q: any;
    } = {
      q: queue({results: [], concurrency: customConcurrency || 5}),
    };
    this.queues[useCase] = newQueue;
    newQueue.q.autostart = true;
    newQueue.q.on('end', () => {
      delete this.queues[useCase];
    });
    return newQueue.q;
  }
}
