import { CommandBase } from '../../helpers/command-base.js';
export default class Scaffold extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        sobjects: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        options: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
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
