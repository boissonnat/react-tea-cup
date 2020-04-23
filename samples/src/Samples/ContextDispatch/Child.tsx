import * as React from 'react';
import {Dispatcher, Cmd, teaCupContext, DispatchProvider, noCmd} from 'react-tea-cup';
import {useContext} from "react";

export interface Model {
    readonly value: number;
}

export type Msg
    = { tag: "inc" }
    | { tag: "dec" }

export function init(): [Model, Cmd<Msg>] {
    return noCmd({ value: 0});
}

export interface ViewProps {
    dispatch: Dispatcher<Msg>;
    model: Model;
}

const MyContext = teaCupContext<Msg>();

export const Child = (props: ViewProps) => {
    const { dispatch, model } = props;
    return (
        <DispatchProvider dispatch={dispatch} context={MyContext}>
            <ViewChild {...model}/>
        </DispatchProvider>
    );
};

const ViewChild = (model: Model) => {
    const { dispatch } = useContext(MyContext);
    return (
        <div className="child">
            Child value = {model.value}
            <button onClick={() => dispatch({
                tag: "inc"
            })}>
                Inc
            </button>
            <button onClick={() => dispatch({
                tag: "dec"
            })}>
                Dec
            </button>

        </div>
    );
};

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
    }
}
