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
    throw "feck";
  }

  /**
   * Chain this task with another task
   * @param f a function that accepts the result of this task, and yields a new task
   */
  andThen<R2>(f: (r: R) => TaskWithoutError<R2>): TaskWithoutError<R2> {
    throw "feck";
  }

  andThenWithError<E, R2>(f: (r: R) => TaskWithError<E, R2>): TaskWithError<E, R2> {
    throw "feck";
  }

}
