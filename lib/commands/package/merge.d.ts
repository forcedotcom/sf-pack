import { CommandBase } from '../../helpers/command-base.js';
export default class Merge extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        source: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        destination: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        compare: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    protected runInternal(): Promise<void>;
}
