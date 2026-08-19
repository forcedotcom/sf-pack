import { CommandBase } from '../../helpers/command-base.js';

export default class Build extends CommandBase {
  public static description = CommandBase.messages.getMessage('package.build.commandDescription');

  public static examples = [Build.description];

  public static readonly flags = {
    ...CommandBase.commonFlags,
    ...CommandBase.flags,
  };

  // Comment this out if your command does not require an org username
  // protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  // protected static requiresProject = false;

  // eslint-disable-next-line complexity

  protected async runInternal(): Promise<void> {
    this.info(Build.description);
    return;
  }
}
