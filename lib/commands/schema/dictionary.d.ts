import { CommandBase } from '../../helpers/command-base.js';
import SchemaOptions from '../../helpers/schema-options.js';
export default class Dictionary extends CommandBase {
    static description: string;
    static defaultReportPath: string;
    static examples: string[];
    static readonly flags: {
        report: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        namespaces: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        options: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        tmpFile: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected options: SchemaOptions;
    protected runInternal(): Promise<void>;
    private writeDictionary;
    private getSortedTypeNames;
    private entityDefinitionValues;
}
