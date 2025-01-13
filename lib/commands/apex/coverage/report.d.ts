import { CommandBase } from '../../../helpers/command-base.js';
export default class Report extends CommandBase {
    static defaultJobStatusWaitMax: number;
    static description: string;
    static defaultReportPath: string;
    static examples: string[];
    static readonly flags: {
        report: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        wait: import("@oclif/core/interfaces").OptionFlag<number, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
