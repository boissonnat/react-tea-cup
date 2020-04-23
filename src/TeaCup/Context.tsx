import {Dispatcher} from "./Dispatcher";
import * as React from 'react';
import {Context, useContext} from "react";

export interface TeaCupData<Msg> {
    readonly dispatch: Dispatcher<Msg>;
}

const defaultData: TeaCupData<any> = {
    dispatch: m => { throw new Error("This should never be called, it's supposed to be ser by a provider. m=" + m)}
};

export function teaCupContext<Msg>(): React.Context<TeaCupData<Msg>> {
    return React.createContext(defaultData);
}

export interface DispatchProviderProps<Msg> {
    dispatch: Dispatcher<Msg>;
    context: Context<TeaCupData<Msg>>;
    children: React.ReactNode;
}

export function DispatchProvider<Msg>(props: DispatchProviderProps<Msg>) {
    const { dispatch, context, children } = props;
    return (
        <context.Provider value={{dispatch}}>
            {children}
        </context.Provider>
    )

}
