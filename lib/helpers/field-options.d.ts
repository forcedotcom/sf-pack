import { Field } from '@jsforce/jsforce-node';
import { OptionsBase } from './options.js';
export declare abstract class FieldOptions extends OptionsBase {
    metaDataTypes: string[];
    excludeRules: Map<string, any>;
    loadDefaults(): Promise<void>;
    removeExcluded(fields: Field[]): Field[];
    isExcluded(field: Field): boolean;
    protected deserialize(serializedOptions: string): Promise<void>;
    protected serialize(): Promise<string>;
}
