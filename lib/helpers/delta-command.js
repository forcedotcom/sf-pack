"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeltaCommandBase = void 0;
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("./command-base");
const delta_options_1 = require("./delta-options");
const options_factory_1 = require("./options-factory");
class DeltaCommandBase extends command_base_1.CommandBase {
    static getFlagsConfig(flagsConfig) {
        if (!flagsConfig) {
            flagsConfig = {};
        }
        if (!flagsConfig.options) {
            flagsConfig.options = sf_plugins_core_1.Flags.file({
                char: 'o',
                description: command_base_1.CommandBase.messages.getMessage('source.delta.optionsFlagDescription')
            });
        }
        if (!flagsConfig.source) {
            flagsConfig.source = sf_plugins_core_1.Flags.file({
                char: 's',
                description: command_base_1.CommandBase.messages.getMessage('source.delta.sourceFlagDescription')
            });
        }
        if (!flagsConfig.destination) {
            flagsConfig.destination = sf_plugins_core_1.Flags.file({
                char: 'd',
                description: command_base_1.CommandBase.messages.getMessage('source.delta.destinationFlagDescription')
            });
        }
        if (!flagsConfig.force) {
            flagsConfig.force = sf_plugins_core_1.Flags.file({
                char: 'f',
                description: command_base_1.CommandBase.messages.getMessage('source.delta.forceFlagDescription')
            });
        }
        if (!flagsConfig.ignore) {
            flagsConfig.ignore = sf_plugins_core_1.Flags.file({
                char: 'i',
                description: command_base_1.CommandBase.messages.getMessage('source.delta.ignoreFlagDescription')
            });
        }
        if (!flagsConfig.deletereport) {
            flagsConfig.deletereport = sf_plugins_core_1.Flags.file({
                char: 'r',
                description: command_base_1.CommandBase.messages.getMessage('source.delta.deleteReportFlagDescription')
            });
        }
        if (!flagsConfig.check) {
            flagsConfig.check = sf_plugins_core_1.Flags.boolean({
                char: 'c',
                description: command_base_1.CommandBase.messages.getMessage('source.delta.checkFlagDescription')
            });
        }
        if (!flagsConfig.copyfulldir) {
            flagsConfig.copyfulldir = sf_plugins_core_1.Flags.string({
                char: 'a',
                description: command_base_1.CommandBase.messages.getMessage('source.delta.copyFullDirFlagDescription', [DeltaCommandBase.defaultCopyDirList.join()])
            });
        }
        return flagsConfig;
    }
    static async getDeltaOptions(flags) {
        let deltaOptions = new delta_options_1.DeltaOptions();
        if (!flags) {
            return deltaOptions;
        }
        // Read/Write the options file if it does not exist already
        if (flags.options) {
            deltaOptions = await options_factory_1.OptionsFactory.get(delta_options_1.DeltaOptions, flags.options);
        }
        else {
            deltaOptions.deltaFilePath = flags.deltaFilePath ?? null;
            deltaOptions.source = flags.source ?? null;
            deltaOptions.destination = flags.destination ?? null;
            deltaOptions.forceFile = flags.forceFile ?? null;
            deltaOptions.ignoreFile = flags.ignoreFile ?? null;
            if (flags.copyfulldir) {
                deltaOptions.fullCopyDirNames = flags.copyfulldir.split(',');
            }
            else {
                deltaOptions.fullCopyDirNames = DeltaCommandBase.defaultCopyDirList;
            }
        }
        return deltaOptions;
    }
}
exports.DeltaCommandBase = DeltaCommandBase;
DeltaCommandBase.defaultCopyDirList = ['aura', 'lwc', 'experiences', 'territory2Models', 'waveTemplates'];
//# sourceMappingURL=delta-command.js.map