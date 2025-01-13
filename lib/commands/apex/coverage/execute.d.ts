import { CommandBase } from '../../../helpers/command-base.js';
export default class Execute extends CommandBase {
    static defaultJobStatusWaitMax: number;
    static description: string;
    static examples: string[];
    static readonly flags: {
        wait: import("@oclif/core/interfaces").OptionFlag<number, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
