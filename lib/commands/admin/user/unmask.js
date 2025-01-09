"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../../helpers/command-base");
const sf_query_1 = require("../../../helpers/sf-query");
const options_factory_1 = require("../../../helpers/options-factory");
const sf_client_1 = require("../../../helpers/sf-client");
const utils_1 = require("../../../helpers/utils");
const utils_2 = require("../../../helpers/utils");
const unmask_options_1 = require("../../../helpers/unmask-options");
class Unmask extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Unmask);
        this.UX.log('Unmasking users...');
        let usernames = null;
        let options = new unmask_options_1.UnmaskOptions();
        if (flags.userList) {
            usernames = flags.userList.split(',');
        }
        else if (flags.userFile) {
            options = await options_factory_1.OptionsFactory.get(unmask_options_1.UnmaskOptions, flags.userFile);
            if (!options) {
                this.raiseError(`Unable to read user file: ${flags.userFile}.`);
            }
            for (const [org, orgUsers] of options.sandboxes) {
                if (this.orgAlias.toUpperCase() === org.toUpperCase()) {
                    usernames = orgUsers;
                    break;
                }
            }
        }
        if (!options.userQuery) {
            this.raiseError('No userQuery defined.');
        }
        if (!usernames || usernames.length === 0) {
            this.raiseError('No usernames specified.');
        }
        this.UX.log('Retrieving Users...');
        if (!options.userQuery.endsWith(' ')) {
            options.userQuery += ' ';
        }
        if (!options.userQuery.toUpperCase().includes('WHERE')) {
            options.userQuery += 'WHERE';
        }
        else {
            options.userQuery += 'AND';
        }
        const query = `${options.userQuery} Username ${sf_query_1.SfQuery.getInClause(usernames)}`;
        this.UX.log('');
        this.UX.log('User Query:');
        this.UX.log(query);
        this.UX.log('');
        const foundMap = new Map();
        foundMap.set(true, []);
        foundMap.set(false, []);
        const unmaskUsers = [];
        const users = await sf_query_1.SfQuery.queryOrg(this.org, query);
        this.UX.log('User Query Results:');
        for (const username of usernames) {
            let found = false;
            for (const user of users) {
                if (username === user.Username) {
                    found = true;
                    if (user.Email.endsWith('.invalid')) {
                        unmaskUsers.push(user);
                    }
                    break;
                }
            }
            foundMap.get(found).push(username);
        }
        for (const [found, names] of foundMap.entries()) {
            this.UX.log(`${found ? 'Found' : 'NOT Found'}:`);
            for (const name of names) {
                this.UX.log(`\t${name}`);
            }
        }
        if (!unmaskUsers || unmaskUsers.length === 0) {
            this.UX.log('No Masked Users Found.');
            return;
        }
        const patchObj = {
            allOrNone: false,
            records: [],
        };
        for (const user of unmaskUsers) {
            user.newEmail = utils_1.default.unmaskEmail(user.Email);
            patchObj.records.push({
                attributes: { type: 'User' },
                id: user.Id,
                Email: user.newEmail,
            });
        }
        if (patchObj.records.length !== 0) {
            this.UX.log('Unmasking Users...');
            const sfClient = new sf_client_1.SfClient(this.org);
            const results = await sfClient.doComposite(utils_2.RestAction.PATCH, patchObj);
            for (const result of results.getContent()) {
                for (const user of unmaskUsers) {
                    if (user.Id === result.id) {
                        if (result.success) {
                            this.UX.log(`${user.Username} ${user.Email} => ${user.newEmail}`);
                        }
                        else {
                            this.UX.log(`${user.Username} ${user.Email}`);
                            for (const error of result.errors) {
                                this.UX.log(`\t=> ${error}`);
                            }
                        }
                        break;
                    }
                }
            }
        }
    }
}
Unmask.description = command_base_1.CommandBase.messages.getMessage('admin.user.unmask.commandDescription');
Unmask.examples = [
    `$ sf admin user unmask -u myOrgAlias -l 'user1@sf.com, user2@sf.com, user3@sf.com'
    Removes the .invalid extension from the email address associated to the list of specified users in the specified Org.`,
    `$ sf admin user unmask -u myOrgAlias -f qa-users.txt
    Removes the .invalid extension from the email address associated to the list of users in the specified file in the specified Org.`,
];
Unmask.flags = {
    userList: sf_plugins_core_1.Flags.string({
        char: 'l',
        description: command_base_1.CommandBase.messages.getMessage('admin.user.unmask.userListFlagDescription'),
    }),
    userFile: sf_plugins_core_1.Flags.file({
        char: 'f',
        description: command_base_1.CommandBase.messages.getMessage('admin.user.unmask.userFileFlagDescription'),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Unmask;
//# sourceMappingURL=unmask.js.map