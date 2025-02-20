import { OptionsBase } from './options.js';
export declare class TemplateOptions extends OptionsBase {
    metaDataTypes: string[];
    excludeFieldTypes: string[];
    loadDefaults(): Promise<void>;
}
