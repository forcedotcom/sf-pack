import { OptionsBase } from './options.js';
export declare class XPathRule {
    name: string | undefined;
    xPath: string | undefined;
    values: string[] | undefined;
}
export declare class XPathOptions extends OptionsBase {
    rules: Map<string, XPathRule[]>;
    constructor();
    loadDefaults(): Promise<void>;
    protected deserialize(serializedOptions: string): Promise<void>;
    protected serialize(): Promise<string>;
}
