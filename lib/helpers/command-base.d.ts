import { FlagOutput, ArgOutput, Input, ParserOutput } from '@oclif/core/lib/interfaces/parser';
import { Ux, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages, Org, Connection } from '@salesforce/core';
export declare class ConditionalError extends Error {
    isRethrown: boolean;
    constructor(message: string, isRethrown?: boolean);
}
export declare abstract class CommandBase extends SfCommand<void> {
    static messages: Messages<string>;
    static targetOrgFlagName: string;
    protected static commonFlags: {
        [x: string]: import("@oclif/core/lib/interfaces/parser").OptionFlag<Org, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
    };
    private static uxInst;
    org: Org;
    protected gotError: boolean;
    protected get orgAlias(): string;
    protected get orgId(): string;
    protected get connection(): Connection;
    protected get UX(): Ux;
    run(): Promise<void>;
    protected errorHandler(err: Error | unknown, throwErr?: boolean): void;
    protected raiseError(message?: string): void;
    protected parse<F extends FlagOutput, B extends FlagOutput, A extends ArgOutput>(options?: Input<F, B, A>, argv?: string[]): Promise<ParserOutput<F, B, A>>;
    protected abstract runInternal(): Promise<void>;
}
