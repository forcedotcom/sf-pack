import { CommandBase } from '../../helpers/command-base';
export default class Permissions extends CommandBase {
    static packageFileName: string;
    static description: string;
    static examples: string[];
    static readonly flags: {
        package: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        metadata: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        namespaces: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    protected metaNames: Set<string>;
    protected namespaces: Set<string>;
    protected packageFileName: string;
    protected runInternal(): Promise<void>;
}
