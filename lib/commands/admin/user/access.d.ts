import { CommandBase } from '../../../helpers/command-base.js';
export default class Access extends CommandBase {
    static description: string;
    static defaultReportPath: string;
    static examples: string[];
    static readonly flags: {
        appList: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        report: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    static getAppAccess(appMenuItems: any[], permissionSetMap: Map<string, any>, getSetupEntityAccessCallback: (id: string, label: string) => Promise<any[]>, getPermissionSetAssignmentCallback: (id: string, label: string) => Promise<any[]>): Promise<Map<string, any[]>>;
    protected runInternal(): Promise<void>;
}
