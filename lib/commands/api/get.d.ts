import { CommandBase } from '../../helpers/command-base.js';
export default class Get extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        metadata: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        ids: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        file: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        tooling: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    protected runInternal(): Promise<void>;
}
