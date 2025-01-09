import { CommandBase } from '../../../helpers/command-base';
export default class Clear extends CommandBase {
    static defaultJobStatusWaitMax: number;
    static description: string;
    static defaultMetadataTypes: string[];
    static examples: string[];
    static readonly flags: {
        metadatas: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        classOrTriggerNames: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
