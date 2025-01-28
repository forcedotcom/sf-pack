import { OptionsBase } from './options.js';
export declare class EventLogOptions extends OptionsBase {
    private static CURRENT_VERSION;
    private static DEFAULT_QUERY;
    private static DEFAULT_OUTPUT_DIR;
    soqlQuery: string;
    outputFolder: string;
    protected get currentVersion(): number;
    loadDefaults(): Promise<void>;
    protected deserialize(serializedOptions: string): Promise<void>;
    protected serialize(): Promise<string>;
}
