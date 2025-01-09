import { CommandBase } from '../../helpers/command-base';
import { PermissionSet } from '../../helpers/sf-permission';
export default class Profile extends CommandBase {
    static defaultSourceFolder: string;
    static defaultPermissionsGlobs: string[];
    static description: string;
    static examples: string[];
    static readonly flags: {
        source: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
        modify: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        output: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces").CustomOptions>;
    };
    protected permissions: Map<string, PermissionSet>;
    protected runInternal(): Promise<void>;
}
