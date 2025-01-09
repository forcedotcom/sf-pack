import { CommandBase } from '../../helpers/command-base';
export default class Merge extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        source: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        destination: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        compare: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    protected runInternal(): Promise<void>;
}
