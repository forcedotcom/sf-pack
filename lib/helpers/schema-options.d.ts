import { OptionsBase } from './options';
export default class SchemaOptions extends OptionsBase {
    private static CURRENT_VERSION;
    excludeCustomObjectNames: string[];
    includeCustomObjectNames: string[];
    outputDefMap: Map<string, string[]>;
    excludeFieldIfTrueFilter: string;
    includeValidationRules: boolean;
    protected get currentVersion(): number;
    getDynamicCode(sheetName?: string): string;
    getEntityDefinitionFields(sheetName?: string): string[];
    getDefinitionHeaders(sheetName?: string): string[];
    getDefinitionMap(sheetName?: string): Map<string, string>;
    protected deserialize(serializedOptions: string): Promise<void>;
    protected serialize(): Promise<string>;
    protected loadDefaults(): Promise<void>;
}
