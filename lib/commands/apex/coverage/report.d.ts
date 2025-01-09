import { CommandBase } from '../../../helpers/command-base';
export default class Report extends CommandBase {
    static defaultJobStatusWaitMax: number;
    static description: string;
    static defaultReportPath: string;
    static examples: string[];
    static readonly flags: {
        report: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        wait: import("@oclif/core/lib/interfaces").OptionFlag<number, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
