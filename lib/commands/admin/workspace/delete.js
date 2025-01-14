import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base.js';
import { RestAction } from '../../../helpers/utils.js';
import { SfTasks } from '../../../helpers/sf-tasks.js';
import { SfClient, ApiKind, NO_CONTENT_CODE } from '../../../helpers/sf-client.js';
import { SfQuery } from '../../../helpers/sf-query.js';
export default class Delete extends CommandBase {
    static description = CommandBase.messages.getMessage('admin.workspace.delete.commandDescription');
    static examples = [
        `$ sf admin workspace delete -u myOrgAlias
    Deletes the Developer Console IDEWorkspace objects for the specified target username (-u).`,
        `$ sf admin workspace delete -u myOrgAlias -l 'user1@sf.com, user2@sf.com, user3@sf.com'
    Deletes the Developer Console IDEWorkspace objects for the specified list of users (-l).`,
    ];
    static flags = {
        userList: Flags.string({
            char: 'l',
            description: CommandBase.messages.getMessage('admin.workspace.delete.userListFlagDescription'),
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    async runInternal() {
        const { flags } = await this.parse(Delete);
        const usernames = [];
        if (flags.userList) {
            for (const username of flags.userList.split(',')) {
                usernames.push(username.trim());
            }
        }
        else {
            const orgInfo = await SfTasks.getOrgInfo(this.org);
            usernames.push(orgInfo.username);
        }
        if (!usernames || usernames.length === 0) {
            this.raiseError('No usernames specified.');
        }
        this.UX.log('Deleting Workspaces for users:');
        this.UX.log(`\t${usernames.join(',')}`);
        // https://help.salesforce.com/articleView?id=000332898&type=1&mode=1
        const sfClient = new SfClient(this.org);
        for (const username of usernames) {
            const query = `SELECT Id FROM IDEWorkspace WHERE CreatedById IN (SELECT Id FROM User WHERE Username = '${username}')`;
            const workspaceRecords = await SfQuery.queryOrg(this.org, query, true);
            if (!workspaceRecords || workspaceRecords.length === 0) {
                this.UX.log(`No workspaces found for user: '${username}'.`);
                continue;
            }
            try {
                for await (const result of sfClient.do(RestAction.DELETE, 'IDEWorkspace', workspaceRecords, 'Id', ApiKind.TOOLING, [NO_CONTENT_CODE])) {
                    this.UX.log(`Deleted Workspace(${result.getContent()}) for user: '${username}'.`);
                }
            }
            catch (err) {
                this.UX.log(`Error Deleting Workspace(s) (${JSON.stringify(workspaceRecords)}) for user: '${username}'.`);
            }
        }
    }
}
//# sourceMappingURL=delete.js.map