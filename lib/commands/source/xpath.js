"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../helpers/command-base");
const utils_1 = require("../../helpers/utils");
const options_factory_1 = require("../../helpers/options-factory");
const xpath_options_1 = require("../../helpers/xpath-options");
class XPath extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(XPath);
        // Read/Write the options file if it does not exist already
        const options = await options_factory_1.OptionsFactory.get(xpath_options_1.XPathOptions, flags.options ?? XPath.defaultOptionsFileName);
        for (const [sourceFolder, rules] of options.rules) {
            if (!sourceFolder) {
                continue;
            }
            for await (const filePath of utils_1.default.getFiles(sourceFolder)) {
                this.UX.log(`Processing file: '${filePath}`);
                let xml = null;
                for await (const line of utils_1.default.readFileLines(filePath)) {
                    xml += line;
                }
                const xPaths = [];
                for (const rule of rules) {
                    xPaths.push(rule.xPath);
                }
                for (const [xPath, values] of utils_1.default.selectXPath(xml, xPaths)) {
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
XPath.description = command_base_1.CommandBase.messages.getMessage('source.xpath.commandDescription');
XPath.defaultOptionsFileName = 'xpath-options.json';
XPath.examples = [
    `$ sf source xpath -o ./xpathOptions.json"
    Validates the project source from the x-path rules specified in '${XPath.defaultOptionsFileName}'`,
];
XPath.flags = {
    options: sf_plugins_core_1.Flags.file({
        char: 'o',
        description: command_base_1.CommandBase.messages.getMessage('source.xpath.optionsFlagDescription'),
    }),
};
exports.default = XPath;
//# sourceMappingURL=xpath.js.map