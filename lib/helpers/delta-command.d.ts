import { CommandBase } from './command-base.js';
import { DeltaOptions } from './delta-options.js';
export declare abstract class DeltaCommandBase extends CommandBase {
    static defaultCopyDirList: string[];
    static getFlagsConfig(flagsConfig: any): any;
    static getDeltaOptions(flags: any): Promise<DeltaOptions>;
}
