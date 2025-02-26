import { OptionsBase } from './options.js';
export declare class TemplateOptions extends OptionsBase {
    metaDataTypes: string[];
    excludeRules: Map<string, any>;
    loadDefaults(): Promise<void>;
    protected deserialize(serializedOptions: string): Promise<void>;
    protected serialize(): Promise<string>;
}
