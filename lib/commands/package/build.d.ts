import { CommandBase } from '../../helpers/command-base.js';
export default class Build extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        [x: string]: import("@oclif/core/interfaces").OptionFlag<import("@salesforce/core").Org, import("@oclif/core/interfaces").CustomOptions> | import("@oclif/core/interfaces").Flag<any>;
    };
    protected runInternal(): Promise<void>;
}
