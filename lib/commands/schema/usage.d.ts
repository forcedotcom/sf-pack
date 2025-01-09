import { CommandBase } from '../../helpers/command-base';
export default class Usage extends CommandBase {
    static description: string;
    static defaultReportPath: string;
    static examples: string[];
    static readonly flags: {
        objects: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        report: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        namespaces: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
