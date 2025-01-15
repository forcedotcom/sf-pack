import { Ux, SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
// Initialize Messages with the current plugin directory
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
export class ConditionalError extends Error {
    isRethrown = false;
    constructor(message, isRethrown = false) {
        super(message);
        this.isRethrown = isRethrown;
    }
}
// SF Plugins have migrated to ESM
// https://github.com/salesforcecli/cli/wiki/Migrate-Your-Plugin-to-ESM
//
export class CommandBase extends SfCommand {
    // Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
    // or any library that is using the messages framework can also be loaded this way.
    static messages = Messages.loadMessages('@salesforce/sf-pack', 'sf-pack');
    static targetOrgFlagName = 'target-org';
    static commonFlags = {
        [CommandBase.targetOrgFlagName]: Flags.requiredOrg({
            aliases: ['username', 'u'],
        })
    };
    static uxInst;
    org;
    gotError = false;
    get orgAlias() {
        this.debug('Start orgAlias');
        return this.org?.getUsername();
    }
    get orgId() {
        this.debug('Start orgId');
        return this.org?.getOrgId();
    }
    get connection() {
        this.debug('Start connection');
        return this.org?.getConnection();
    }
    get UX() {
        if (CommandBase.uxInst == null) {
            CommandBase.uxInst = new Ux({ jsonEnabled: this.jsonEnabled() });
        }
        return CommandBase.uxInst;
    }
    async run() {
        this.debug('Start run');
        try {
            this.debug('Start runInternal');
            await this.runInternal();
            this.debug('End runInternal');
        }
        catch (err) {
            this.errorHandler(err);
        }
        finally {
            this.log('Done.');
            process.exitCode = this.gotError ? 1 : 0;
        }
    }
    errorHandler(err, throwErr = false) {
        this.debug('Start errorHandler');
        this.gotError = true;
        let message = null;
        let error = null;
        if (err instanceof ConditionalError) {
            this.debug(err.stack);
            message = err.message;
            // Obey the re-thrown 
            error = throwErr && err.isRethrown ? err : null;
        }
        else if (err instanceof Error) {
            this.debug(err.stack);
            message = err.message;
            error = throwErr ? err : null;
        }
        else {
            message = `Error: ${JSON.stringify(err)}`;
            error = throwErr ? new Error(message) : null;
        }
        this.warn(message);
        if (error) {
            throw error;
        }
    }
    raiseError(message) {
        throw new ConditionalError(message, false);
    }
    async parse(options, argv) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const flags = await super.parse(options, argv);
        this.org = flags.flags[CommandBase.targetOrgFlagName];
        return flags;
    }
}
//# sourceMappingURL=command-base.js.map