import { DescribeSObjectResult } from '@jsforce/jsforce-node';
import { CommandBase } from '../../helpers/command-base.js';
import { ScaffoldOptions } from '../../helpers/scaffold-options.js';
export default class Scaffold extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        sobjects: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        options: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    private static META_XML;
    private static MAX_CLASS_NAME_LENGTH;
    private schemas;
    static generateObjectApex(schema: DescribeSObjectResult, options: ScaffoldOptions): Map<string, string>;
    private static formatValue;
    generateTestSetupCode(simpleName: string, schema: DescribeSObjectResult, options: ScaffoldOptions): any;
    protected runInternal(): Promise<void>;
    private getSchema;
}
