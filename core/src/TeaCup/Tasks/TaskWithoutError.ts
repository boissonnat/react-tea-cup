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

import {TaskWithError} from "./TaskWithError";
import {Result} from "../Result";
import {Cmd} from "../Cmd";
import {Dispatcher} from "../Dispatcher";
import {TParallel, TParallelWithoutError} from "./TParallel";

export abstract class TaskWithoutError<R> {

  /**
   * To be implemented by concrete Tasks.
   * @param callback the callback to call when the task is ran
   */
  abstract execute(callback: (r: R) => void): void;

  /**
   * Map the ok result of this task
   * @param f the mapping function
   */
  map<R2>(f: (r: R) => R2): TaskWithoutError<R2> {
    return new TMapped(this, f);
  }

  /**
   * Chain this task with another task
   * @param f a function that accepts the result of this task, and yields a new task
   */
  andThen<R2>(f: (r: R) => TaskWithoutError<R2>): TaskWithoutError<R2> {
    return new TThen(this, f);
  }

  andThenWithError<E, R2>(f: (r: R) => TaskWithError<E, R2>): TaskWithError<E, R2> {
    return new TThenWithError(this, f);
  }

  /**
   * Turn this task into a Cmd
   * @param toMsg a function that turns the result of the task into a Msg
   */
  perform<M>(toMsg: (r: R) => M): Cmd<M> {
    return new TCmd(this, toMsg);
  }

  /**
   * Runs tasks in parallel
   * @param t the task to be run in parallel with this task
   * @param f a function that maps the results of the 2 parallel tasks
   */
  parallel<T2, R2>(t: TaskWithoutError<T2>, f: (a: R, b: T2) => R2): TaskWithoutError<R2> {
    return new TParallelWithoutError(this, t, f);
  }

  parallelWithError<E, T2, R2>(t: TaskWithError<E, T2>, f: (a: R, b: T2) => R2): TaskWithError<E, R2> {
    return new TParallel(this, t, f);
  }

}

class TCmd<R, M> extends Cmd<M> {
  readonly task: TaskWithoutError<R>;
  readonly toMsg: (r: R) => M;

  constructor(task: TaskWithoutError<R>, toMsg: (r: R) => M) {
    super();
    this.task = task;
    this.toMsg = toMsg;
  }

  execute(dispatch: Dispatcher<M>): void {
    this.task.execute((r: R) =>
      dispatch(this.toMsg(r))
    );
  }
}

class TMapped<E, R, R2> extends TaskWithoutError<R2> {
  private readonly task: TaskWithoutError<R>;
  private readonly mapper: (r: R) => R2;

  constructor(task: TaskWithoutError<R>, mapper: (r: R) => R2) {
    super();
    this.task = task;
    this.mapper = mapper;
  }

  execute(callback: (r: R2) => void): void {
    this.task.execute((r: R) => {
      callback(this.mapper(r));
    });
  }
}

class TThen<R, R2> extends TaskWithoutError<R2> {
  private readonly task: TaskWithoutError<R>;
  private readonly f: (r: R) => TaskWithoutError<R2>;

  constructor(task: TaskWithoutError<R>, f: (r: R) => TaskWithoutError<R2>) {
    super();
    this.task = task;
    this.f = f;
  }

  execute(callback: (r: R2) => void): void {
    this.task.execute((r: R) => {
        const next = this.f(r);
        next.execute(callback);
    });
  }
}

class TThenWithError<E, R, R2> extends TaskWithError<E, R2> {
  private readonly task: TaskWithoutError<R>;
  private readonly f: (r: R) => TaskWithError<E, R2>;

  constructor(task: TaskWithoutError<R>, f: (r: R) => TaskWithError<E, R2>) {
    super();
    this.task = task;
    this.f = f;
  }

  execute(callback: (r: Result<E, R2>) => void): void {
    this.task.execute((r: R) => {
        const next = this.f(r);
        next.execute(callback);
    });
  }
}
