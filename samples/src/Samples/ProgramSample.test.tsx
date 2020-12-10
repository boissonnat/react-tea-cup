import { mount, ReactWrapper } from 'enzyme';
import { extendJest, Cmd, Sub, Task, Program, ProgramProps } from "react-tea-cup";
import React, { ReactNode } from 'react';
import { Dispatcher } from 'tea-cup-core';
import { view } from './Counter';
import { ReactElement } from 'react';
// import 'jest-enzyme';

extendJest(expect);

const init1: () => [number, Cmd<string>] = () => {
    return [0, toCmd('go')];
}

const view1: (dispatch: Dispatcher<string>, model: number) => React.ReactNode = (dispatch: Dispatcher<string>, model: number) => {
    return (<div className={'count'}>{model}</div>);
}

const update1: (msg: string, model: number) => [number, Cmd<string>] = (msg: string, model: number) => {
    return [model + 1, model < 5 ? toCmd('go') : Cmd.none()];
}

// const toCmd = (msg: string) => Task.perform(Time.in(0), () => msg);
const toCmd = (msg: string) => Task.perform(Task.succeed(0), () => msg);

describe('Test Program', () => {

    it('first', () => {
        const props: ProgramProps<number, string> = {
            init: init1,
            view: view1,
            update: update1,
            subscriptions: () => Sub.none<string>()
        }
        return mountWhenIdle(props).then(([model, wrapper]) => {
            expect(model).toEqual(6)
            // expect(wrapper).toHaveHTML('')
            expect(wrapper.find('.count')).toHaveText('6')
        })
    })

    it('alternative', () => {
        const props: ProgramProps<number, string> = {
            init: init1,
            view: view1,
            update: update1,
            subscriptions: () => Sub.none<string>()
        }
        return updateUntilIdle(props, mount).then(([model, wrapper]) => {
            expect(model).toEqual(6)
            // expect(wrapper).toHaveHTML('')
            expect(wrapper.find('.count')).toHaveText('6')
        })
    })
})

function mountWhenIdle<Model, Msg>(props: ProgramProps<Model, Msg>) {
    const testable = new Testable(props);
    // return Promise.resolve(mount(<Program {...testable.programProps} />));
    return testable.mountWhenIdle()
}

type Trigger<Model, Msg, T> = (node: ReactElement<ProgramProps<Model, Msg>>) => T
// type WrapperType<Model, Msg> = ReactWrapper<Program<Model, Msg>, ProgramProps<Model, Msg>, never>
type ResolveType<Model, T> = (idle: [Model, T]) => void;

function updateUntilIdle<Model, Msg, T>(props: ProgramProps<Model, Msg>, fun: Trigger<Model, Msg, T>): Promise<[Model, T]> {
    return new Promise(resolve => {
        fun(<Program {...testableProps(resolve, props, fun)} />)
    })
}

function testableProps<Model, Msg, T>(resolve: ResolveType<Model, T>, props: ProgramProps<Model, Msg>, fun: Trigger<Model, Msg, T>) {
    const tprops: ProgramProps<TestableModel<Model, Msg, T>, Msg> = {
        init: initTestable(resolve, props.init),
        view: viewTestable(props.view),
        update: updateTestable((props.update)),
        subscriptions: suscriptionsTestable(props, fun)
    }
    return tprops
}

type TestableModel<Model, Msg, T> = {
    readonly resolve: ResolveType<Model, T>;
    readonly cmds: Cmd<Msg>[];
    readonly model: Model;
}

function initTestable<Model, Msg, T>(resolve: ResolveType<Model, T>, init: ProgramProps<Model, Msg>['init']): ProgramProps<TestableModel<Model, Msg, T>, Msg>['init'] {
    const mac = init();
    return () => [{
        resolve,
        cmds: [mac[1]],
        model: mac[0]
    }, Cmd.none()];
}

function viewTestable<Model, Msg, T>(view: ProgramProps<Model, Msg>['view']): ProgramProps<TestableModel<Model, Msg, T>, Msg>['view'] {
    return (dispatch: Dispatcher<Msg>, model: TestableModel<Model, Msg, T>) => view(dispatch, model.model);
}

function updateTestable<Model, Msg, T>(update: ProgramProps<Model, Msg>['update']): ProgramProps<TestableModel<Model, Msg, T>, Msg>['update'] {
    return (msg: Msg, model: TestableModel<Model, Msg, T>) => {
        const [model1, cmd1] = update(msg, model.model);
        const cmds = [cmd1].filter(cmd => cmd.constructor.name !== 'CmdNone')
        return [{
            ...model,
            cmds,
            model: model1,
        }, Cmd.none()];
    }
}

function suscriptionsTestable<Model, Msg, T>(props: ProgramProps<Model, Msg>, fun: Trigger<Model, Msg, T>): ProgramProps<TestableModel<Model, Msg, T>, Msg>['subscriptions'] {
    return (model: TestableModel<Model, Msg, T>) => {
        const subs = props.subscriptions(model.model);
        if (model.cmds.length === 0) {
            const result = fun(<Program
                init={() => [model.model, Cmd.none()]}
                update={(msg, model) => [model, Cmd.none()]}
                view={(d, m) => props.view(d, m)}
                subscriptions={(d) => Sub.none()}
            />)
            model.resolve([model.model, result]);
            return subs;
        }
        return Sub.batch([new TestableSub(model.cmds), subs]);
    }
}

class TestableSub<Msg> extends Sub<Msg> {
    constructor(private readonly cmds: readonly Cmd<Msg>[]) {
        super();
    }

    protected onInit(): void {
        setTimeout(() => {
            if (this.dispatcher !== undefined) {
                const d = this.dispatcher.bind(this);
                this.cmds.map(cmd => cmd.execute(d));
            }
        }, 0)
    }
}

class Testable<Model, Msg>{
    private resolve?: (idle: [Model, ReactWrapper<Program<Model, Msg>, ProgramProps<Model, Msg>, never>]) => void;
    private cmds: Cmd<Msg>[] = [];
    private dispatch?: Dispatcher<Msg>;
    private model?: Model;
    private viewed?: ReactNode;

    constructor(private readonly props: ProgramProps<Model, Msg>) {
    }

    get programProps() {
        const props: ProgramProps<Model, Msg> = {
            init: this.props.init,
            view: (dispatch: Dispatcher<Msg>, model: Model) => this.view(dispatch, model),
            update: (msg: Msg, model: Model) => this.update(msg, model),
            subscriptions: this.props.subscriptions
        }
        return props
    }

    private view(dispatch: Dispatcher<Msg>, model: Model) {
        this.dispatch = dispatch;
        this.viewed = this.props.view(dispatch, model);
        return this.viewed;
    }

    private update(msg: Msg, model: Model): [Model, Cmd<Msg>] {
        const [model1, cmd1] = this.props.update(msg, model);
        this.model = model1;
        this.cmds.push(cmd1);
        setTimeout(() => {
            this.process();
        }, 0);
        return [model1, Cmd.none()];
    }

    private process() {
        this.cmds = this.cmds.filter(cmd => cmd.constructor.name !== 'CmdNone')
        if (this.cmds.length === 0) {
            this.resolve?.([this.model!, mount(<>{this.viewed}</>)]);
            return;
        }
        const first = this.cmds[0]
        this.cmds = this.cmds.slice(1)
        first.execute(this.dispatch!)
    }

    mountWhenIdle(): Promise<[Model, ReactWrapper<Program<Model, Msg>, ProgramProps<Model, Msg>, never>]> {
        mount(<Program {...this.programProps} />)
        return new Promise(resolve => {
            this.resolve = resolve;
        });
    }
}