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

import * as React from 'react';
import {Dispatcher, Cmd, teaCupContext, DispatchProvider, noCmd} from 'react-tea-cup';
import {useContext} from "react";

export interface Model {
    readonly value: number;
}

export type Msg
    = { tag: "inc" }
    | { tag: "dec" }
    | { tag: "reset" }

export function init(): [Model, Cmd<Msg>] {
    return noCmd({ value: 0});
}

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.tag) {
        case "dec": {
            return noCmd({
                ...model,
                value: model.value - 1
            })
        }
        case "inc": {
            return noCmd({
                ...model,
                value: model.value + 1
            })
        }
        case "reset": {
            return noCmd({
                ...model,
                value: 0
            })
        }
    }
}

const MyContext = teaCupContext<Msg>();

export function view(dispatch: Dispatcher<Msg>, model: Model) {
    return (
        <DispatchProvider dispatch={dispatch} context={MyContext}>
            <Child {...model}/>
        </DispatchProvider>
    );
}

// regular FCs below

const Child = (model: Model) => {
    const dispatch = useContext(MyContext);
    return (
        <div className="child">
            Child value = {model.value}
            <MyBtn label="Inc" onClick={() => ({ tag: "inc"})}/>
            <MyBtn label="Dec" onClick={() => ({ tag: "dec"})}/>
            <button onClick={() => dispatch({tag: "reset"})}>
                Reset !
            </button>
        </div>
    );
};

interface MyBtnProps {
    label: string;
    onClick: () => Msg;
}

const MyBtn = (props: MyBtnProps) => {
    const dispatch = useContext(MyContext);
    const { label, onClick } = props;
    return (
        <button onClick={() => dispatch(onClick())}>
            {label}
        </button>
    )
};
