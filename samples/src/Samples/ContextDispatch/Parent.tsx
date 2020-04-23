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

export interface ViewProps {
    dispatch: Dispatcher<Msg>;
    model: Model;
}

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

const MyContext = teaCupContext<Msg>();

export const View = (props: ViewProps) => {
    const { dispatch, model } = props;
    return (
        <DispatchProvider dispatch={dispatch} context={MyContext}>
            <Parent {...model}/>
        </DispatchProvider>
    );
};

export const Parent = (model: Model) => {
    const { dispatch } = useContext(MyContext);
    return (
        <div className="parent">
            Hey I am the parent. I have my own model and messages...
            My value is <em>{model.value}</em>
            <button
                onClick={() => dispatch({ tag: "parent-clicked" })}
            >
                Click me
            </button>
            <br/>
            I also have a child :
            <Child.Child
                model={model.childModel}
                dispatch={map(dispatch, liftChildMsg)}
            />
        </div>
    );
};

function liftChildMsg(msg: Child.Msg): Msg {
    return {
        tag: "child-msg",
        msg
    }
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
