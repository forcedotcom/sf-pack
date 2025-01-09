"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandBase = exports.ConditionalError = void 0;
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const core_1 = require("@salesforce/core");
// Initialize Messages with the current plugin directory
core_1.Messages.importMessagesDirectory(__dirname);
class ConditionalError extends Error {
    constructor(message, isRethrown = false) {
        super(message);
        this.isRethrown = false;
        this.isRethrown = isRethrown;
    }
}
exports.ConditionalError = ConditionalError;
class CommandBase extends sf_plugins_core_1.SfCommand {
    constructor() {
        super(...arguments);
        this.gotError = false;
    }
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
            CommandBase.uxInst = new sf_plugins_core_1.Ux({ jsonEnabled: this.jsonEnabled() });
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
        const flags = await super.parse(options, argv);
        this.org = flags.flags[CommandBase.targetOrgFlagName];
        return flags;
    }
}
exports.CommandBase = CommandBase;
// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
CommandBase.messages = core_1.Messages.loadMessages('@salesforce/sf-pack', 'sf-pack');
CommandBase.targetOrgFlagName = 'target-org';
CommandBase.commonFlags = {
    [CommandBase.targetOrgFlagName]: sf_plugins_core_1.Flags.requiredOrg({
        aliases: ['username', 'u'],
    })
};
//# sourceMappingURL=command-base.js.map