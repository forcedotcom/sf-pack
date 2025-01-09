import { CommandBase } from '../../helpers/command-base';
import SchemaOptions from '../../helpers/schema-options';
export default class Dictionary extends CommandBase {
    static description: string;
    static defaultReportPath: string;
    static examples: string[];
    static readonly flags: {
        report: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        namespaces: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        options: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        tmpFile: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    protected options: SchemaOptions;
    protected runInternal(): Promise<void>;
    private writeDictionary;
    private getSortedTypeNames;
    private entityDefinitionValues;
}
