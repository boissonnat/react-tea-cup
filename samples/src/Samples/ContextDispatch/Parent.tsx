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

import * as Child from './Child';
import {Dispatcher, Cmd, teaCupContext, DispatchProvider, noCmd, map, Tuple} from 'react-tea-cup';
import * as React from "react";
import {useContext} from "react";

export interface Model {
    readonly childModel: Child.Model
    readonly value: string;
}

export type Msg
    = { tag: "child-msg", msg: Child.Msg }
    | { tag: "parent-clicked" }

export function init(): [Model, Cmd<Msg>] {
    return Tuple.fromNative(Child.init())
        .mapBoth(
            childModel => ({
                value: "foo",
                childModel
            }),
            childCmd => childCmd.map(liftChildMsg)
        )
        .toNative();
}

export function update(msg:Msg, model:Model): [Model, Cmd<Msg>] {
    switch (msg.tag) {
        case "child-msg": {
            const mac = Child.update(msg.msg, model.childModel);
            return Tuple.fromNative(mac)
                .mapBoth(
                    childModel => ({
                        ...model,
                        childModel
                    }),
                    childCmd => childCmd.map(liftChildMsg)
                )
                .toNative()
        }
        case "parent-clicked": {
            return noCmd({
                ...model,
                value: model.value + "X"
            })
        }
    }
}


// init the dispatch context
const MyContext = teaCupContext<Msg>();

// view just sets the context, and then lets all rendering
// to be done by React FCs
export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <DispatchProvider dispatch={dispatch} context={MyContext}>
            <Parent {...model}/>
        </DispatchProvider>
    )
}

// Regular FCs below, using context for dispatch !

const Parent = (model: Model) => {
    const dispatch = useContext(MyContext);
    return (
        <div className="parent">
            Hey I am the parent. I have my own model and messages...
            My value is <em>{model.value}</em>
            <ParentButton label="Click me !"/>
            <br/>
            I also have a child :
            {Child.view(map(dispatch, liftChildMsg), model.childModel)}
        </div>
    );
};

interface ParentButtonProps {
    label: string;
}

const ParentButton = (props: ParentButtonProps) => {
    const dispatch = useContext(MyContext);
    return (
        <button
            onClick={() => dispatch({ tag: "parent-clicked" })}
        >
            {props.label}
        </button>
    )
};

// utility funcs...

function liftChildMsg(msg: Child.Msg): Msg {
    return {
        tag: "child-msg",
        msg
    }
}
