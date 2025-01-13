import { CommandBase } from '../../helpers/command-base.js';
import { PermissionSet } from '../../helpers/sf-permission.js';
export default class Profile extends CommandBase {
    static defaultSourceFolder: string;
    static defaultPermissionsGlobs: string[];
    static description: string;
    static examples: string[];
    static readonly flags: {
        source: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        modify: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        output: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected permissions: Map<string, PermissionSet>;
    protected runInternal(): Promise<void>;
}
