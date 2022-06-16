import queue from 'queue';

import {Injectable} from '@angular/core';

type Queues = {
  [useCase: string]: {
    q: any; // queueObject
  };
};
@Injectable({
  providedIn: 'root',
})
export class HsQueuesService {
  apps: {
    [key: string]: {
      queues: Queues;
    };
  } = {
    default: {queues: {}},
  };

  /**
   * Get the params saved by the queues service for the current app
   * @param app - App identifier
   */
  get(app: string): {queues: Queues} {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = {
        queues: {},
      };
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Get the params saved by the queues service for the current app
   * @param useCase - Queue for
   * @param app - App identifier
   * @param customConcurrency - (Optional) custom concurrency
   */
  ensureQueue(useCase: string, app: string, customConcurrency?: number): queue {
    const appRef = this.get(app);
    if (appRef.queues[useCase]) {
      return appRef.queues[useCase].q;
    }
    const newQueue: {
      q: any;
    } = {
      q: queue({results: [], concurrency: customConcurrency || 5}),
    };
    appRef.queues[useCase] = newQueue;
    newQueue.q.autostart = true;
    newQueue.q.on('end', () => {
      delete appRef.queues[useCase];
    });
    return newQueue.q;
  }
}
