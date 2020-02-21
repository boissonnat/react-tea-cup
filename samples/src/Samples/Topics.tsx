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

import * as React from "react";
import {Dispatcher, Cmd, Sub, noCmd, Task, Topic} from "react-tea-cup";

const topic: Topic<number> = new Topic<number>();

export type Model = number;

export type Msg
    = { tag: "send" }
    | { tag: "sent" }
    | { tag: "received", t: number }

export function init(): [Model, Cmd<Msg>] {
    return noCmd(0)
}

export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <div className="topic-simple">
            <h2>Simple topic counter</h2>
            <button onClick={_ => dispatch({tag: "send"})}>inc with topic</button>
            <span>{model}</span>
        </div>
    )
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.tag) {
        case "send": {
            return [
                model,
                Task.perform(topic.sendTask(3), (r:number) => ({ tag: "sent" } as Msg))
            ]
        }
        case "sent": {
            return noCmd(model)
        }
        case "received": {
            return noCmd(model + msg.t)
        }
    }
}


export function subscriptions(model: Model): Sub<Msg> {
    return topic.listen((t: number) => ({ tag: "received", t } as Msg))
}
