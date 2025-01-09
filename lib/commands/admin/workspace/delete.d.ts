import { CommandBase } from '../../../helpers/command-base';
export default class Delete extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        userList: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
