import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../helpers/command-base.js';
import Utils from '../../helpers/utils.js';
import { OptionsFactory } from '../../helpers/options-factory.js';
import { XPathOptions } from '../../helpers/xpath-options.js';
export default class XPath extends CommandBase {
    static description = CommandBase.messages.getMessage('source.xpath.commandDescription');
    static defaultOptionsFileName = 'xpath-options.json';
    static examples = [
        `$ sf source xpath -o ./xpathOptions.json"
    Validates the project source from the x-path rules specified in '${XPath.defaultOptionsFileName}'`,
    ];
    static flags = {
        options: Flags.file({
            char: 'o',
            description: CommandBase.messages.getMessage('source.xpath.optionsFlagDescription'),
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    async runInternal() {
        const { flags } = await this.parse(XPath);
        // Read/Write the options file if it does not exist already
        const options = await OptionsFactory.get(XPathOptions, flags.options ?? XPath.defaultOptionsFileName);
        for (const [sourceFolder, rules] of options.rules) {
            if (!sourceFolder) {
                continue;
            }
            for await (const filePath of Utils.getFiles(sourceFolder)) {
                this.UX.log(`Processing file: '${filePath}`);
                let xml = null;
                for await (const line of Utils.readFileLines(filePath)) {
                    xml += line;
                }
                const xPaths = [];
                for (const rule of rules) {
                    xPaths.push(rule.xPath);
                }
                for (const [xPath, values] of Utils.selectXPath(xml, xPaths)) {
                    for (const rule of rules) {
                        if (rule.xPath === xPath) {
                            for (const ruleValue of rule.values) {
                                for (const xmlValue of values) {
                                    if (ruleValue.trim() === xmlValue.trim()) {
                                        // Set the proper exit code to indicate violation/failure
                                        this.gotError = true;
                                        this.UX.log(`${rule.name} - Violation!`);
                                        this.UX.log(`\txpath: ${xPath}`);
                                        this.UX.log(`\tvalue: ${xmlValue}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return;
    }
}
//# sourceMappingURL=xpath.js.map