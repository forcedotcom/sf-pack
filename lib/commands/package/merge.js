"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const xml_merge_1 = require("../../helpers/xml-merge");
class Merge extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Merge);
        await xml_merge_1.default.mergeXmlFiles(flags.source, flags.destination, flags.compare, this.UX);
    }
}
Merge.description = command_base_1.CommandBase.messages.getMessage('package.merge.commandDescription');
Merge.examples = [
    `$ sf package merge -s manifest/package.xml -d manifest/package-sprint17.xml
    Merges package.xml into package-sprint17.xml`,
    `$ sf package merge -s manifest/package-a.xml -d manifest/package-b.xml -c
    Compares package-a.xml to package-b.xml and removes common elements from BOTH packages - leaving only the differences.`,
];
Merge.flags = {
    source: sf_plugins_core_1.Flags.file({
        char: 's',
        required: true,
        description: command_base_1.CommandBase.messages.getMessage('package.merge.sourceFlagDescription'),
    }),
    destination: sf_plugins_core_1.Flags.file({
        char: 'd',
        required: true,
        description: command_base_1.CommandBase.messages.getMessage('package.merge.destinationFlagDescription'),
    }),
    compare: sf_plugins_core_1.Flags.boolean({
        char: 'c',
        description: command_base_1.CommandBase.messages.getMessage('package.merge.isPackageCompareFlagDescription'),
    }),
};
exports.default = Merge;
//# sourceMappingURL=merge.js.map