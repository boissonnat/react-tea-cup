import {Task} from "./Task";
import {Sub} from "./Sub";
import {just, Maybe, nothing} from "./Maybe";
import {ok, Result} from "./Result";

type Observer<T> = (t: T) => void

export class Topic<T> {

    private observers: Observer<T>[] = [];

    send(t: T): void {
        this.observers.forEach(o => o(t));
    }

    sendTask(t: T): Task<never, T> {
        return new SendTask(this, t);
    }

    listen<M>(toMsg: (t: T) => M): Sub<M> {
        return new ListenSub(this, toMsg);
    }

    addObserver(o: Observer<T>): void {
        this.observers.push(o);
    }

    removeObserver(o: Observer<T>): void {
        this.observers = this.observers.filter(o2 => o !== o2);
    }
}

class SendTask<T> extends Task<never, T> {

    private readonly topic: Topic<T>;
    private readonly obj: T;

    constructor(topic: Topic<T>, obj: T) {
        super();
        this.topic = topic;
        this.obj = obj;
    }

    execute(callback: (r: Result<never, T>) => void): void {
        this.topic.send(this.obj);
        callback(ok(this.obj));
    }

}

class ListenSub<T, Msg> extends Sub<Msg> {

    private readonly topic: Topic<T>;
    private readonly toMsg: (obj: T) => Msg;
    private observer: Maybe<Observer<T>> = nothing;

    constructor(topic: Topic<T>, toMsg: (obj: T) => Msg) {
        super();
        this.topic = topic;
        this.toMsg = toMsg;
    }

    protected onInit(): void {
        super.onInit();
        const o: Observer<T> = t => {
            this.dispatch(this.toMsg(t));
        };
        this.topic.addObserver(o);
        this.observer = just(o);
    }

    protected onRelease(): void {
        super.onRelease();
        this.observer.forEach(o => {
            this.topic.removeObserver(o);
            this.observer = nothing;
        })
    }

}
