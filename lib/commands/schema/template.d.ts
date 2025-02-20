import { CommandBase } from '../../helpers/command-base.js';
import { TemplateOptions } from '../../helpers/template-options.js';
export default class Template extends CommandBase {
    static description: string;
    static defaultReportPath: string;
    static examples: string[];
    static readonly flags: {
        report: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        namespaces: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        options: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected options: TemplateOptions;
    protected runInternal(): Promise<void>;
}
