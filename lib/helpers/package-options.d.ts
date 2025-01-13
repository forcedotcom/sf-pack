import { OptionsBase } from './options.js';
export declare class PackageOptions extends OptionsBase {
    private static CURRENT_VERSION;
    excludeMetadataTypes: string[];
    mdapiMap: Map<string, string>;
    mdapiNotStar: string[];
    mdapiIgnore: string[];
    protected get currentVersion(): number;
    loadDefaults(): Promise<void>;
    protected deserialize(serializedOptions: string): Promise<void>;
    protected serialize(): Promise<string>;
}
