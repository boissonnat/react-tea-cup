import { err, ok, Result } from '../Result';
import { just, Maybe, nothing } from '../Maybe';
import { TaskWithError } from './TaskWithError';
import { TaskWithoutError } from './TaskWithoutError';

export class TParallel<E, R, A, B> extends TaskWithError<E, R> {
  constructor(
    private readonly t1: TaskWithError<E, A>,
    private readonly t2: TaskWithError<E, B> | TaskWithoutError<B>,
    private readonly f: (a: A, b: B) => R,
  ) {
    super();
  }

  execute(callback: (r: Result<E, R>) => void): void {
    let ra: Maybe<A> = nothing;
    let rb: Maybe<B> = nothing;
    let error: Maybe<E> = nothing;

    const done = () => {
      if (error.type !== 'Nothing' || ra.type === 'Nothing' || rb.type === 'Nothing') {
        return;
      }
      callback(ok(this.f(ra.value, rb.value)));
    };

    function handle<X>(t: TaskWithError<E, X>, assign: (x: X) => void) {
      t.execute((r: Result<E, X>) => {
        if (error.isNothing()) {
          switch (r.tag) {
            case 'Err': {
              callback(err(r.err));
              error = just(r.err);
              break;
            }
            case 'Ok': {
              assign(r.value);
              done();
              break;
            }
          }
        }
      });
    }

    handle(this.t1, (x) => (ra = just(x)));
    if (this.t2 instanceof TaskWithoutError) {
      this.t2.execute(r => {
        rb = just(r);
        done();
      });
    } else if (this.t2 instanceof TaskWithError) {
      handle(this.t2, (x) => (rb = just(x)));
    }
  }
}


export class TParallelWithoutError<R, A, B> extends TaskWithoutError<R> {
  constructor(
      private readonly t1: TaskWithoutError<A>,
      private readonly t2: TaskWithoutError<B>,
      private readonly f: (a: A, b: B) => R,
  ) {
    super();
  }

  execute(callback: (r: R) => void): void {
    let ra: Maybe<A> = nothing;
    let rb: Maybe<B> = nothing;

    const done = () => {
      if (ra.type === 'Nothing' || rb.type === 'Nothing') {
        return;
      }
      callback(this.f(ra.value, rb.value));
    };

    function handle<X>(t: TaskWithoutError<X>, assign: (x: X) => void) {
      t.execute((r: X) => {
        assign(r);
        done();
      });
    }

    handle(this.t1, (x) => (ra = just(x)));
    handle(this.t2, (x) => (rb = just(x)));
  }
}
