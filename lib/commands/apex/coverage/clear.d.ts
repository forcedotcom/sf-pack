import { CommandBase } from '../../../helpers/command-base.js';
export default class Clear extends CommandBase {
    static defaultJobStatusWaitMax: number;
    static description: string;
    static defaultMetadataTypes: string[];
    static examples: string[];
    static readonly flags: {
        metadatas: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        classOrTriggerNames: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
