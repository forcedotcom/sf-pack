"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../../helpers/command-base");
const utils_1 = require("../../../helpers/utils");
const sf_tasks_1 = require("../../../helpers/sf-tasks");
const sf_client_1 = require("../../../helpers/sf-client");
const sf_query_1 = require("../../../helpers/sf-query");
class Delete extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Delete);
        const usernames = [];
        if (flags.userList) {
            for (const username of flags.userList.split(',')) {
                usernames.push((username).trim());
            }
        }
        else {
            const orgInfo = await sf_tasks_1.SfTasks.getOrgInfo(this.org);
            usernames.push(orgInfo.username);
        }
        if (!usernames || usernames.length === 0) {
            this.raiseError('No usernames specified.');
        }
        this.UX.log('Deleting Workspaces for users:');
        this.UX.log(`\t${usernames.join(',')}`);
        // https://help.salesforce.com/articleView?id=000332898&type=1&mode=1
        const sfClient = new sf_client_1.SfClient(this.org);
        for (const username of usernames) {
            const query = `SELECT Id FROM IDEWorkspace WHERE CreatedById IN (SELECT Id FROM User WHERE Username = '${username}')`;
            const workspaceRecords = await sf_query_1.SfQuery.queryOrg(this.org, query, true);
            if (!workspaceRecords || workspaceRecords.length === 0) {
                this.UX.log(`No workspaces found for user: '${username}'.`);
                continue;
            }
            try {
                for await (const result of sfClient.do(utils_1.RestAction.DELETE, 'IDEWorkspace', workspaceRecords, 'Id', sf_client_1.ApiKind.TOOLING, [sf_client_1.NO_CONTENT_CODE])) {
                    this.UX.log(`Deleted Workspace(${result.getContent()}) for user: '${username}'.`);
                }
            }
            catch (err) {
                this.UX.log(`Error Deleting Workspace(s) (${JSON.stringify(workspaceRecords)}) for user: '${username}'.`);
            }
        }
    }
}
Delete.description = command_base_1.CommandBase.messages.getMessage('admin.workspace.delete.commandDescription');
Delete.examples = [
    `$ sf admin workspace delete -u myOrgAlias
    Deletes the Developer Console IDEWorkspace objects for the specified target username (-u).`,
    `$ sf admin workspace delete -u myOrgAlias -l 'user1@sf.com, user2@sf.com, user3@sf.com'
    Deletes the Developer Console IDEWorkspace objects for the specified list of users (-l).`,
];
Delete.flags = {
    userList: sf_plugins_core_1.Flags.string({
        char: 'l',
        description: command_base_1.CommandBase.messages.getMessage('admin.workspace.delete.userListFlagDescription'),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Delete;
//# sourceMappingURL=delete.js.map