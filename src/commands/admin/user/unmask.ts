import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base.js';
import { SfQuery } from '../../../helpers/sf-query.js';
import { OptionsFactory } from '../../../helpers/options-factory.js';
import { SfClient } from '../../../helpers/sf-client.js';
import Utils from '../../../helpers/utils.js';
import { RestAction } from '../../../helpers/utils.js';
import { UnmaskOptions } from '../../../helpers/unmask-options.js';

export default class Unmask extends CommandBase {
  public static description = CommandBase.messages.getMessage('admin.user.unmask.commandDescription');

  public static examples = [
    `$ sf admin user unmask -u myOrgAlias -l 'user1@sf.com, user2@sf.com, user3@sf.com'
    Removes the .invalid extension from the email address associated to the list of specified users in the specified Org.`,
    `$ sf admin user unmask -u myOrgAlias -f qa-users.txt
    Removes the .invalid extension from the email address associated to the list of users in the specified file in the specified Org.`,
  ];

  public static readonly flags = {
    userList: Flags.string({
      char: 'l',
      description: CommandBase.messages.getMessage('admin.user.unmask.userListFlagDescription'),
    }),
    userFile: Flags.file({
      char: 'f',
      description: CommandBase.messages.getMessage('admin.user.unmask.userFileFlagDescription'),
    }),
    ...CommandBase.commonFlags,
    ...CommandBase.flags,
  };

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Unmask);
    this.UX.log('Unmasking users...');

    let usernames: string[] = null;
    let options = new UnmaskOptions();

    if (flags.userList) {
      usernames = flags.userList.split(',');
    } else if (flags.userFile) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      options = await OptionsFactory.get(UnmaskOptions, flags.userFile);
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
    } else {
      options.userQuery += 'AND';
    }
    const query = `${options.userQuery} Username ${SfQuery.getInClause(usernames)}`;

    this.UX.log('');
    this.UX.log('User Query:');
    this.UX.log(query);
    this.UX.log('');

    const foundMap = new Map<boolean, string[]>();
    foundMap.set(true, []);
    foundMap.set(false, []);
    const unmaskUsers = [];

    const users = await SfQuery.queryOrg(this.org, query);

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
      user.newEmail = Utils.unmaskEmail(user.Email as string);
      patchObj.records.push({
        attributes: { type: 'User' },
        id: user.Id,
        Email: user.newEmail,
      });
    }

    if (patchObj.records.length !== 0) {
      this.UX.log('Unmasking Users...');
      const sfClient = new SfClient(this.org);
      const results = await sfClient.doComposite(RestAction.PATCH, patchObj);
      for (const result of results.getContent()) {
        for (const user of unmaskUsers) {
          if (user.Id === result.id) {
            if (result.success) {
              this.UX.log(`${user.Username as string} ${user.Email as string} => ${user.newEmail as string}`);
            } else {
              this.UX.log(`${user.Username as string} ${user.Email as string}`);
              for (const error of result.errors) {
                this.UX.log(`\t=> ${error as string}`);
              }
            }
            break;
          }
        }
      }
    }
  }
}
