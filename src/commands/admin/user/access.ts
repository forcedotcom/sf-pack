import path = require('path');
import { Record } from 'jsforce';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base';
import { SfQuery } from '../../../helpers/sf-query';
import { Office } from '../../../helpers/office';

export default class Access extends CommandBase {
  public static description = CommandBase.messages.getMessage('admin.user.access.commandDescription');

  public static defaultReportPath = 'UserAccess-{ORG}.xlsx';

  public static examples = [
    `$ sf admin user access -u myOrgAlias
    Creates a report ${Access.defaultReportPath.replace(
      /\{ORG\}/,
      'myOrgAlias'
    )} on User access to all the Apps based on PermissionSets and Profiles.`,
    `$ sf admin user access -u myOrgAlias -l 'Sales','Platform'
    Creates a report ${Access.defaultReportPath.replace(
      /\{ORG\}/,
      'myOrgAlias'
    )} on User access to the specified Apps based on PermissionSets and Profiles.`,
  ];

  public static readonly flags = {
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
  };

  public static async getAppAccess(
    appMenuItems: any[],
    permissionSetMap: Map<string, any>,
    getSetupEntityAccessCallback: (id: string, label: string) => Promise<any[]>,
    getPermissionSetAssignmentCallback: (id: string, label: string) => Promise<any[]>
  ): Promise<Map<string, any[]>> {
    const permissionSetsById = new Map<string, any[]>();

    const appAccessByAppLabel = new Map<string, any[]>();

    for (const appMenuItem of appMenuItems) {
      const label = appMenuItem.Label as string;
      const setupEntityAccesses = await getSetupEntityAccessCallback(String(appMenuItem.ApplicationId), String(label));
      for (const setupEntityAccess of setupEntityAccesses) {
        const permissionSet = permissionSetMap.get(String(setupEntityAccess.ParentId));
        if (!permissionSet) {
          continue;
        }
        const id = permissionSet.Id as string;
        // Check and see if we have already gotten the assignments for this PermSet
        let permissionSetAssignments = permissionSetsById.get(id);
        if (!permissionSetAssignments) {
          permissionSetAssignments = await getPermissionSetAssignmentCallback(id, permissionSet.Label as string);
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

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Access);
    let apps: string[] = null;
    if (flags.appList) {
      apps = flags.appList.split(',');
    }

    this.UX.log('Getting PermissionSets...');
    const query3 = 'SELECT Id, Label FROM PermissionSet';
    const permissionSets = await SfQuery.queryOrg(this.org, query3);
    const permissionSetMap = new Map<string, any>();
    for (const permissionSet of permissionSets) {
      permissionSetMap.set(permissionSet.Id, permissionSet);
    }

    let query = 'SELECT Id, ApplicationId, Name, Label FROM AppMenuItem';
    if (apps?.length > 0) {
      const appsFilter = `'${apps.join("','")}'`;
      query += ` WHERE Label IN (${appsFilter})`;
      this.UX.log(`Getting Specific App Access: ${appsFilter}`);
    } else {
      this.UX.log('Getting All App Access');
    }
    const appMenuItems = await SfQuery.queryOrg(this.org, query);

    const getSetupEntityAccessCallBack = async (id: string, label: string): Promise<Record[]> => {
      this.UX.log(`Getting permissions for App: ${label}<${id}>`);
      const results = await SfQuery.queryOrg(
        this.org,
        'SELECT Id, SetupEntityId, ParentId ' +
          'FROM SetupEntityAccess ' +
          `WHERE SetupEntityType = 'TabSet' AND SetupEntityId = '${id}'`
      );
      return results;
    };

    const getPermissionSetAssignmentCallback = async (id: string, label: string): Promise<any[]> => {
      this.UX.log(`Getting Users for PermissionSet: ${label}<${id}>`);
      const results = await SfQuery.queryOrg(
        this.org,
        'SELECT Id, PermissionSetId, PermissionSet.Label, PermissionSet.ProfileId, ' +
          'PermissionSet.Profile.Name, AssigneeId, Assignee.Username, ExpirationDate ' +
          'FROM PermissionSetAssignment ' +
          `WHERE PermissionSetId = '${id}'`
      );
      return results;
    };

    const appAccessByAppLabel = await Access.getAppAccess(
      appMenuItems,
      permissionSetMap,
      getSetupEntityAccessCallBack,
      getPermissionSetAssignmentCallback
    );

    // create a workbook with a Tab for each App
    const workbookMap = new Map<string, string[][]>();
    try {
      const reportPath = path
        .resolve((flags.report) || Access.defaultReportPath)
        .replace(/\{ORG\}/, this.orgAlias);
      this.UX.log(`Writing Report: ${reportPath}`);
      for (const appLabel of appAccessByAppLabel.keys()) {
        const sheet: string[][] = [
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
            permissionSetAssignment.Assignee?.Username as string,
            permissionSetAssignment.AssigneeId as string,
            permissionSetAssignment.PermissionSet?.Label as string,
            permissionSetAssignment.PermissionSetId as string,
            permissionSetAssignment.PermissionSet?.Profile?.Name as string,
            permissionSetAssignment.ExpirationDate as string,
          ]);
        }
        workbookMap.set(appLabel, sheet);
      }
      Office.writeXlxsWorkbook(workbookMap, reportPath);
    } catch (err) {
      this.UX.log('Error Writing XLSX Report: ' + JSON.stringify(err.message));
      this.UX.log('Report: ' + JSON.stringify(workbookMap));
      throw err;
    }
  }
}
