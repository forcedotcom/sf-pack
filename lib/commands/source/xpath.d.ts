import { CommandBase } from '../../helpers/command-base';
export default class XPath extends CommandBase {
    static description: string;
    static defaultOptionsFileName: string;
    static examples: string[];
    static readonly flags: {
        options: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    protected runInternal(): Promise<void>;
}
