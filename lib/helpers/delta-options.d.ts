import { OptionsBase } from './options.js';
export declare class DeltaOptions extends OptionsBase {
    private static CURRENT_VERSION;
    deltaFilePath: string;
    source: string;
    destination: string;
    deleteReportFile: string;
    forceFile: string;
    ignoreFile: string;
    isDryRun: boolean;
    fullCopyDirNames: string[];
    logAllMessagesToConsole: boolean;
    constructor(init?: Partial<DeltaOptions>);
    protected get currentVersion(): number;
    normalize(): void;
    loadDefaults(): Promise<void>;
}
