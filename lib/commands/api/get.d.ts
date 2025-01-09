import { CommandBase } from '../../helpers/command-base';
export default class Get extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        metadata: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        ids: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        output: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        tooling: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    protected runInternal(): Promise<void>;
}
