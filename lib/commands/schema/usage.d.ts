import { CommandBase } from '../../helpers/command-base.js';
export default class Usage extends CommandBase {
    static description: string;
    static defaultReportPath: string;
    static examples: string[];
    static readonly flags: {
        objects: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        report: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        namespaces: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
