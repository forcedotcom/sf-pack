import { OptionsBase } from './options.js';
export declare class UnmaskOptions extends OptionsBase {
    static defaultUserQuery: string;
    sandboxes: Map<string, string[]>;
    userQuery: string;
    constructor();
    deserialize(serializedOptions: string): Promise<void>;
    serialize(): Promise<string>;
    loadDefaults(): Promise<void>;
}
