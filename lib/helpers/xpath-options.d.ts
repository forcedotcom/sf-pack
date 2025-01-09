import { OptionsBase } from './options';
export declare class XPathRule {
    name: string;
    xPath: string;
    values: string[];
}
export declare class XPathOptions extends OptionsBase {
    rules: Map<string, XPathRule[]>;
    constructor();
    loadDefaults(): Promise<void>;
    protected deserialize(serializedOptions: string): Promise<void>;
    protected serialize(): Promise<string>;
}
