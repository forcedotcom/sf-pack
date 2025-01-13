import { CommandBase } from '../../helpers/command-base.js';
export default class XPath extends CommandBase {
    static description: string;
    static defaultOptionsFileName: string;
    static examples: string[];
    static readonly flags: {
        options: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
