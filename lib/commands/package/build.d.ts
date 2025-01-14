import { CommandBase } from '../../helpers/command-base.js';
import { PackageOptions } from '../../helpers/package-options.js';
export default class Build extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        package: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        metadata: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        options: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        namespaces: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        folder: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        append: import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    protected getMetadataMapFromOrg(options: PackageOptions, flags: any): Promise<Map<string, string[]>>;
    protected getMetadataMapFromFolder(folder: string, options: PackageOptions): Promise<Map<string, string[]>>;
    protected getMDAPIFiles(xmlName: string, folder: string, isDocument?: boolean): AsyncGenerator<string, void, void>;
    protected runInternal(): Promise<void>;
}
