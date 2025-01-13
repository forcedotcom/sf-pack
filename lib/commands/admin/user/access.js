import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base.js';
import { SfQuery } from '../../../helpers/sf-query.js';
import { Office } from '../../../helpers/office.js';
export default class Access extends CommandBase {
    static description = CommandBase.messages.getMessage('admin.user.access.commandDescription');
    static defaultReportPath = 'UserAccess-{ORG}.xlsx';
    static examples = [
        `$ sf admin user access -u myOrgAlias
    Creates a report ${Access.defaultReportPath.replace(/\{ORG\}/, 'myOrgAlias')} on User access to all the Apps based on PermissionSets and Profiles.`,
        `$ sf admin user access -u myOrgAlias -l 'Sales','Platform'
    Creates a report ${Access.defaultReportPath.replace(/\{ORG\}/, 'myOrgAlias')} on User access to the specified Apps based on PermissionSets and Profiles.`,
    ];
    static flags = {
        appList: Flags.string({
            char: 'l',
            description: CommandBase.messages.getMessage('admin.user.access.appListFlagDescription'),
        }),
        report: Flags.string({
            char: 'r',
            description: CommandBase.messages.getMessage('admin.user.access.reportFlagDescription', [
                Access.defaultReportPath,
            ]),
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    static async getAppAccess(appMenuItems, permissionSetMap, getSetupEntityAccessCallback, getPermissionSetAssignmentCallback) {
        const permissionSetsById = new Map();
        const appAccessByAppLabel = new Map();
        for (const appMenuItem of appMenuItems) {
            const label = appMenuItem.Label;
            const setupEntityAccesses = await getSetupEntityAccessCallback(String(appMenuItem.ApplicationId), String(label));
            for (const setupEntityAccess of setupEntityAccesses) {
                const permissionSet = permissionSetMap.get(String(setupEntityAccess.ParentId));
                if (!permissionSet) {
                    continue;
                }
                const id = permissionSet.Id;
                // Check and see if we have already gotten the assignments for this PermSet
                let permissionSetAssignments = permissionSetsById.get(id);
                if (!permissionSetAssignments) {
                    permissionSetAssignments = await getPermissionSetAssignmentCallback(id, permissionSet.Label);
                    permissionSetsById.set(id, permissionSetAssignments);
                }
                if (!appAccessByAppLabel.has(label)) {
                    appAccessByAppLabel.set(label, []);
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                appAccessByAppLabel.get(label).push(...permissionSetAssignments);
            }
        }
        return appAccessByAppLabel;
    }
    async runInternal() {
        const { flags } = await this.parse(Access);
        let apps = null;
        if (flags.appList) {
            apps = flags.appList.split(',');
        }
        this.UX.log('Getting PermissionSets...');
        const query3 = 'SELECT Id, Label FROM PermissionSet';
        const permissionSets = await SfQuery.queryOrg(this.org, query3);
        const permissionSetMap = new Map();
        for (const permissionSet of permissionSets) {
            permissionSetMap.set(permissionSet.Id, permissionSet);
        }
        let query = 'SELECT Id, ApplicationId, Name, Label FROM AppMenuItem';
        if (apps?.length > 0) {
            const appsFilter = `'${apps.join("','")}'`;
            query += ` WHERE Label IN (${appsFilter})`;
            this.UX.log(`Getting Specific App Access: ${appsFilter}`);
        }
        else {
            this.UX.log('Getting All App Access');
        }
        const appMenuItems = await SfQuery.queryOrg(this.org, query);
        const getSetupEntityAccessCallBack = async (id, label) => {
            this.UX.log(`Getting permissions for App: ${label}<${id}>`);
            const results = await SfQuery.queryOrg(this.org, 'SELECT Id, SetupEntityId, ParentId ' +
                'FROM SetupEntityAccess ' +
                `WHERE SetupEntityType = 'TabSet' AND SetupEntityId = '${id}'`);
            return results;
        };
        const getPermissionSetAssignmentCallback = async (id, label) => {
            this.UX.log(`Getting Users for PermissionSet: ${label}<${id}>`);
            const results = await SfQuery.queryOrg(this.org, 'SELECT Id, PermissionSetId, PermissionSet.Label, PermissionSet.ProfileId, ' +
                'PermissionSet.Profile.Name, AssigneeId, Assignee.Username, ExpirationDate ' +
                'FROM PermissionSetAssignment ' +
                `WHERE PermissionSetId = '${id}'`);
            return results;
        };
        const appAccessByAppLabel = await Access.getAppAccess(appMenuItems, permissionSetMap, getSetupEntityAccessCallBack, getPermissionSetAssignmentCallback);
        // create a workbook with a Tab for each App
        const workbookMap = new Map();
        try {
            const reportPath = path.resolve(flags.report || Access.defaultReportPath).replace(/\{ORG\}/, this.orgAlias);
            this.UX.log(`Writing Report: ${reportPath}`);
            for (const appLabel of appAccessByAppLabel.keys()) {
                const sheet = [
                    [
                        'Username',
                        'User Id',
                        'PermissionSet Label',
                        'PermissionSet Id',
                        'Profile Label',
                        'Profile Id',
                        'Expiration Date',
                    ],
                ];
                for (const permissionSetAssignment of appAccessByAppLabel.get(appLabel)) {
                    sheet.push([
                        permissionSetAssignment.Assignee?.Username,
                        permissionSetAssignment.AssigneeId,
                        permissionSetAssignment.PermissionSet?.Label,
                        permissionSetAssignment.PermissionSetId,
                        permissionSetAssignment.PermissionSet?.Profile?.Name,
                        permissionSetAssignment.ExpirationDate,
                    ]);
                }
                workbookMap.set(appLabel, sheet);
            }
            Office.writeXlxsWorkbook(workbookMap, reportPath);
        }
        catch (err) {
            this.UX.log('Error Writing XLSX Report: ' + JSON.stringify(err.message));
            this.UX.log('Report: ' + JSON.stringify(workbookMap));
            throw err;
        }
    }
}
//# sourceMappingURL=access.js.map