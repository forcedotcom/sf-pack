import { CommandBase } from '../../helpers/command-base.js';
export default class Permissions extends CommandBase {
    static packageFileName: string;
    static description: string;
    static examples: string[];
    static readonly flags: {
        package: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        metadata: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        namespaces: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected metaNames: Set<string>;
    protected namespaces: Set<string>;
    protected packageFileName: string;
    protected runInternal(): Promise<void>;
}
