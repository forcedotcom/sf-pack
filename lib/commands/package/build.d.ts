import { OutputFlags } from '@oclif/core/lib/interfaces/parser';
import { CommandBase } from '../../helpers/command-base';
import { PackageOptions } from '../../helpers/package-options';
export default class Build extends CommandBase {
    static description: string;
    static examples: string[];
    static readonly flags: {
        package: import("@oclif/core/lib/interfaces/parser").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        metadata: import("@oclif/core/lib/interfaces/parser").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        options: import("@oclif/core/lib/interfaces/parser").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        namespaces: import("@oclif/core/lib/interfaces/parser").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        folder: import("@oclif/core/lib/interfaces/parser").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        append: import("@oclif/core/lib/interfaces/parser").BooleanFlag<boolean>;
    };
    protected getMetadataMapFromOrg(options: PackageOptions, flags: OutputFlags<any>): Promise<Map<string, string[]>>;
    protected getMetadataMapFromFolder(folder: string, options: PackageOptions): Promise<Map<string, string[]>>;
    protected getMDAPIFiles(xmlName: string, folder: string, isDocument?: boolean): AsyncGenerator<string, void, void>;
    protected runInternal(): Promise<void>;
}
