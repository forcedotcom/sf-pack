import { CommandBase } from '../../helpers/command-base.js';
export default class Query extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        query: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
