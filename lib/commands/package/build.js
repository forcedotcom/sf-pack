import { CommandBase } from '../../helpers/command-base.js';
export default class Build extends CommandBase {
    static description = CommandBase.messages.getMessage('package.build.commandDescription');
    static examples = [Build.description];
    static flags = {
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    // Comment this out if your command does not require an org username
    // protected static requiresUsername = true;
    // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
    // protected static requiresProject = false;
    // eslint-disable-next-line complexity
    async runInternal() {
        this.info(Build.description);
        return;
    }
}
//# sourceMappingURL=build.js.map