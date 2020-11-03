/*
 * MIT License
 *
 * Copyright (c) 2019 Rémi Van Keisbelck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import { TaskWithoutError } from './TaskWithoutError';
import { TaskWithError } from './TaskWithError';
import { TSuccess } from './TSuccess';
import { TError } from './TError';
import {TPromise} from "./TPromise";
import {TLambda, TLambdaWithError} from "./TLambda";

export abstract class Task {
  /**
   * Create a task that succeeds with a value
   * @param r the value
   */
  static succeed<R>(r: R): TaskWithoutError<R> {
    return new TSuccess(r);
  }

  /**
   * Create a task that fails with an error
   * @param e the error
   */
  static fail<E>(e: E): TaskWithError<E, never> {
    return new TError(e);
  }

  static fromPromise<R>(promiseSupplier: () => Promise<R>): TaskWithError<Error, R> {
    return new TPromise(promiseSupplier);
  }

  static fromLambdaWithError<R>(lambda: () => R): TaskWithError<Error, R> {
    return new TLambdaWithError(lambda);
  }

  static fromLambda<R>(lambda: () => R): TaskWithoutError<R> {
    return new TLambda(lambda);
  }
}

// class TParallel<E, R, A, B> extends Task<E, R> {
//   constructor(private readonly f: (a: A, b: B) => R, private readonly t1: Task<E, A>, private readonly t2: Task<E, B>) {
//     super();
//   }
//
//   execute(callback: (r: Result<E, R>) => void): void {
//     let ra: Maybe<A> = nothing;
//     let rb: Maybe<B> = nothing;
//     let error: Maybe<E> = nothing;
//
//     const done = () => {
//       if (error.type !== 'Nothing' || ra.type === 'Nothing' || rb.type === 'Nothing') {
//         return;
//       }
//       callback(ok(this.f(ra.value, rb.value)));
//     };
//
//     function handle<X>(t: Task<E, X>, assign: (x: X) => void) {
//       t.execute((r: Result<E, X>) => {
//         switch (r.tag) {
//           case 'Err': {
//             if (error?.isNothing()) {
//               callback(err(r.err));
//               error = just(r.err);
//             }
//             break;
//           }
//           case 'Ok': {
//             assign(r.value);
//             done();
//             break;
//           }
//         }
//       });
//     }
//
//     handle(this.t1, (x) => (ra = just(x)));
//     handle(this.t2, (x) => (rb = just(x)));
//   }
// }
