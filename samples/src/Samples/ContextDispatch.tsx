import {Dispatcher, Cmd, Sub, noCmd, DispatchProvider, teaCupContext} from 'react-tea-cup';
import * as React from 'react';
import {useContext} from "react";

export interface Item {
    readonly value: number
    readonly clickCount: number
}


export interface Model {
    readonly items: ReadonlyArray<Item>;
}

export type Msg
    = { tag: "inc", index: number }
    | { tag: "dec", index: number }
    | { tag: "add" }
    | { tag: "delete", index: number }

export function init(): [Model, Cmd<Msg>] {
    return [{ items: []}, Cmd.none()];
}

// We need to define a context ourselves because
// of templating : we dispatch our own Msg, not just
// anything.
// TODO children will need to use their own ?
const MyContext = teaCupContext<Msg>();

const MainView = (model: Model) => {
    // grab teacup dispatcher via useContext
    const { dispatch } = useContext(MyContext);
    return (
        <>
            <ul>
                {model.items.map((x,i) =>
                    <ItemView index={i} item={x}/>
                )}
            </ul>
            <button onClick={() =>
                dispatch({
                    tag: "add"
                })
            }>
                Add one
            </button>
        </>
    )
};

interface ItemViewProps {
    index: number;
    item: Item;
}

const ItemView = (props: ItemViewProps) => {
    const { item, index } = props;
    const { dispatch } = useContext(MyContext);
    return (
        <li key={index}>
            {item.value}
            <button onClick={() => dispatch({
                tag: "inc",
                index
            })}>
                Increment
            </button>
        </li>
    )
};

export interface ViewProps {
    dispatch: Dispatcher<Msg>;
    model: Model;
}

// teacup view is a FC that sets the dispatch func
// via context for its children...
export const View = (props: ViewProps) => {
    const { dispatch, model } = props;
    return (
        <DispatchProvider dispatch={dispatch} context={MyContext}>
            <MainView {...model}/>
        </DispatchProvider>
    );
};

export function update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
    switch (msg.tag) {
        case "delete": {
            return noCmd({
                ...model,
                items: model.items.filter((x, i) => i !== msg.index)
            })
        }
        case "add": {
            return noCmd({
                ...model,
                items: [...model.items, {value: 0, clickCount: 0}]
            })
        }
        case "dec": {
            return noCmd({
                ...model,
                items: model.items.map((x, i) => {
                    if (i === msg.index) {
                        return {
                            ...x,
                            value: x.value - 1,
                            clickCount: x.clickCount + 1
                        }
                    }
                    return x;
                })
            })
        }
        case "inc": {
            return noCmd({
                ...model,
                items: model.items.map((x, i) => {
                    if (i === msg.index) {
                        return {
                            ...x,
                            value: x.value + 1,
                            clickCount: x.clickCount + 1
                        }
                    }
                    return x;
                })
            })
        }
    }
}

export function subscriptions(model: Model): Sub<Msg> {
    return Sub.none();
}

