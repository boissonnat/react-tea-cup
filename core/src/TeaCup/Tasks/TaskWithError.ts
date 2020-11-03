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

import { Cmd } from '../Cmd';
import { Dispatcher } from '../Dispatcher';
import { Err, Result } from '../Result';

export abstract class TaskWithError<E, R> {
  /**
   * To be implemented by concrete Tasks.
   * @param callback the callback to call when the task is ran
   */
  abstract execute(callback: (r: Result<E, R>) => void): void;

  /**
   * Map the ok result of this task
   * @param f the mapping function
   */
  map<R2>(f: (r: R) => R2): TaskWithError<E, R2> {
    return new TEMapped(this, f);
  }

  /**
   * Map the error result of this task
   * @param f the mapping function
   */
  mapError<E2>(f: (e: E) => E2): TaskWithError<E2, R> {
    return new TEMappedErr(this, f);
  }

  /**
   * Chain this task with another task
   * @param f a function that accepts the result of this task, and yields a new task
   */
  andThen<R2>(f: (r: R) => TaskWithError<E, R2>): TaskWithError<E, R2> {
    return new TEThen(this, f);
  }

  /**
   * Turn this task to a Cmd
   * @param toMsg a function that turns the result of the task into a Msg
   */
  attempt<M>(toMsg: (r: Result<E, R>) => M): Cmd<M> {
    return new TECmd(this, toMsg);
  }
}

class TECmd<E, R, M> extends Cmd<M> {
  readonly task: TaskWithError<E, R>;
  readonly toMsg: (r: Result<E, R>) => M;

  constructor(task: TaskWithError<E, R>, toMsg: (r: Result<E, R>) => M) {
    super();
    this.task = task;
    this.toMsg = toMsg;
  }

  execute(dispatch: Dispatcher<M>): void {
    this.task.execute((r: Result<E, R>) => {
      dispatch(this.toMsg(r));
    });
  }
}

class TEMapped<E, R, R2> extends TaskWithError<E, R2> {
  private readonly task: TaskWithError<E, R>;
  private readonly mapper: (r: R) => R2;

  constructor(task: TaskWithError<E, R>, mapper: (r: R) => R2) {
    super();
    this.task = task;
    this.mapper = mapper;
  }

  execute(callback: (r: Result<E, R2>) => void): void {
    this.task.execute((r: Result<E, R>) => {
      callback(r.map(this.mapper));
    });
  }
}

class TEMappedErr<E, R, E2> extends TaskWithError<E2, R> {
  private readonly task: TaskWithError<E, R>;
  private readonly mapper: (e: E) => E2;

  constructor(task: TaskWithError<E, R>, mapper: (e: E) => E2) {
    super();
    this.task = task;
    this.mapper = mapper;
  }

  execute(callback: (r: Result<E2, R>) => void): void {
    this.task.execute((r: Result<E, R>) => {
      callback(r.mapError(this.mapper));
    });
  }
}

class TEThen<E, R, R2> extends TaskWithError<E, R2> {
  private readonly task: TaskWithError<E, R>;
  private readonly f: (r: R) => TaskWithError<E, R2>;

  constructor(task: TaskWithError<E, R>, f: (r: R) => TaskWithError<E, R2>) {
    super();
    this.task = task;
    this.f = f;
  }

  execute(callback: (r: Result<E, R2>) => void): void {
    this.task.execute((r: Result<E, R>) => {
      r.match(
        (r: R) => {
          const next = this.f(r);
          next.execute(callback);
        },
        (e: E) => {
          callback(new Err(e));
        },
      );
    });
  }
}
