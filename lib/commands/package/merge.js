import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import xmlMerge from '../../helpers/xml-merge.js';
export default class Merge extends CommandBase {
    static description = CommandBase.messages.getMessage('package.merge.commandDescription');
    static examples = [
        `$ sf package merge -s manifest/package.xml -d manifest/package-sprint17.xml
    Merges package.xml into package-sprint17.xml`,
        `$ sf package merge -s manifest/package-a.xml -d manifest/package-b.xml -c
    Compares package-a.xml to package-b.xml and removes common elements from BOTH packages - leaving only the differences.`,
    ];
    static flags = {
        source: Flags.file({
            char: 's',
            required: true,
            description: CommandBase.messages.getMessage('package.merge.sourceFlagDescription'),
        }),
        destination: Flags.file({
            char: 'd',
            required: true,
            description: CommandBase.messages.getMessage('package.merge.destinationFlagDescription'),
        }),
        compare: Flags.boolean({
            char: 'c',
            description: CommandBase.messages.getMessage('package.merge.isPackageCompareFlagDescription'),
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    async runInternal() {
        const { flags } = await this.parse(Merge);
        await xmlMerge.mergeXmlFiles(flags.source, flags.destination, flags.compare, this.UX);
    }
}
//# sourceMappingURL=merge.js.map