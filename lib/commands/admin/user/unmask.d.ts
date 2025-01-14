import { CommandBase } from '../../../helpers/command-base.js';
export default class Unmask extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        userList: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        userFile: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
