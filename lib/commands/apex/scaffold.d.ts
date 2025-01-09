import { CommandBase } from '../../helpers/command-base';
export default class Scaffold extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        sobjects: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        options: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    private static META_XML;
    private static MAX_CLASS_NAME_LENGTH;
    private schemas;
    private index;
    protected runInternal(): Promise<void>;
    private getSchema;
    private generateTestSetupCode;
    private generateFieldValue;
}
