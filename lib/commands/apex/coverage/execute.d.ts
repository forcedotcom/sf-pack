import { CommandBase } from '../../../helpers/command-base';
export default class Execute extends CommandBase {
    static defaultJobStatusWaitMax: number;
    static description: string;
    static examples: string[];
    static readonly flags: {
        wait: import("@oclif/core/lib/interfaces").OptionFlag<number, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
