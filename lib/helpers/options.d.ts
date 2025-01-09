export declare class OptionsSettings {
    ignoreVersion: boolean;
    blockExternalConnections: boolean;
}
export declare abstract class OptionsBase {
    version: number;
    private prvSettings;
    constructor(init?: Partial<OptionsBase>);
    get isCurrentVersion(): boolean;
    get settings(): OptionsSettings;
    set settings(optionSettings: OptionsSettings);
    protected get currentVersion(): number;
    load(optionsPath: string): Promise<void>;
    save(optionsPath: string): Promise<void>;
    protected ignoreField(fieldName: string): boolean;
    protected deserialize(serializedOptionBase: string): Promise<void>;
    protected serialize(): Promise<string>;
    protected readFile(optionsPath: string): Promise<string>;
    protected setCurrentVersion(): void;
    protected abstract loadDefaults(): Promise<void>;
}
