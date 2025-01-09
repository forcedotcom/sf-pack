"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../../helpers/command-base");
const utils_1 = require("../../../helpers/utils");
const delta_command_1 = require("../../../helpers/delta-command");
const delta_provider_1 = require("../../../helpers/delta-provider");
class Git extends command_base_1.CommandBase {
    constructor() {
        super(...arguments);
        this.name = 'git';
        this.deltas = new Map();
    }
    async runInternal() {
        const { flags } = await this.parse(Git);
        const deltaOptions = await delta_command_1.DeltaCommandBase.getDeltaOptions(flags);
        if (!deltaOptions.deltaFilePath) {
            deltaOptions.deltaFilePath = flags.git;
        }
        const provider = new Git.gitDeltaProvider();
        await provider.run(deltaOptions);
    }
}
Git.description = command_base_1.CommandBase.messages.getMessage('source.delta.git.commandDescription');
Git.examples = [
    `$ sf source delta git -g git.txt -s force-app -d deploy
    Reads the specified -(g)it diff file 'git.txt' and uses it to identify the deltas in
    -(s)ource 'force-app' and copies them to -(d)estination 'deploy'`,
];
Git.gitDeltaProvider = class extends delta_provider_1.DeltaProvider {
    constructor() {
        super(...arguments);
        this.name = 'git';
        this.deltaLineToken = '\t';
        this.deltas = new Map();
    }
    processDeltaLine(deltaLine) {
        const parts = deltaLine.split(this.deltaLineToken);
        this.deltas.set(utils_1.default.normalizePath(parts[1]), parts[0]);
    }
    getMessage(name) {
        return command_base_1.CommandBase.messages.getMessage(name);
    }
    async *diff(source) {
        // git has already done all of the hashing/diffing for us
        source = source ? utils_1.default.normalizePath(source) : this.deltaOptions.source;
        for (const [deltaFile, deltaKind] of this.deltas) {
            // Did we exclude the filepath?
            if (!deltaFile.startsWith(source)) {
                await this.logMessage(`Skipping delta file line: '${deltaFile}' not in source path: '${source}'.`, true);
                continue;
            }
            yield new delta_provider_1.Delta(deltaKind, deltaFile);
        }
    }
    async validateDeltaOptions(deltaOptions) {
        // Currently we don't allow creating the git-diff file
        if (!deltaOptions.deltaFilePath || !(await utils_1.default.pathExists(deltaOptions.deltaFilePath))) {
            return 'No delta -g(it) file specified or specified file does not exist.';
        }
        const results = await super.validateDeltaOptions(deltaOptions);
        return results;
    }
};
Git.flags = delta_command_1.DeltaCommandBase.getFlagsConfig({
    git: sf_plugins_core_1.Flags.file({
        char: 'g',
        description: command_base_1.CommandBase.messages.getMessage('source.delta.git.gitFlagDescription'),
    }),
});
exports.default = Git;
//# sourceMappingURL=git.js.map