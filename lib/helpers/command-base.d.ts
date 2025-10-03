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
        [x: string]: import("@oclif/core/interfaces").OptionFlag<Org, import("@oclif/core/interfaces").CustomOptions>;
    };
    private static uxInst;
    org: Org | undefined;
    protected gotError: boolean;
    protected get orgAlias(): string | undefined;
    protected get orgId(): string | undefined;
    protected get connection(): Connection | undefined;
    protected get UX(): Ux;
    static readIdsFromFlagOrFile(flagValue: string): Promise<string[]>;
    run(): Promise<void>;
    protected errorHandler(err: Error, throwErr?: boolean): void;
    protected raiseError(message: string): void;
    protected parse(options?: any, argv?: string[]): Promise<any>;
    protected abstract runInternal(): Promise<void>;
}
