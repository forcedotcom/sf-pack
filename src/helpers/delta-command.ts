/* eslint-disable no-param-reassign */
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from './command-base.js';
import { DeltaOptions } from './delta-options.js';
import { OptionsFactory } from './options-factory.js';
import Constants from './constants.js';

export abstract class DeltaCommandBase extends CommandBase {
  public static getFlagsConfig(flagsConfig: any): any {
    if (!flagsConfig) {
      flagsConfig = {};
    }
    if (!flagsConfig.options) {
      flagsConfig.options = Flags.file({
        char: 'o',
        description: CommandBase.messages.getMessage('source.delta.optionsFlagDescription')
      });
    }
    if (!flagsConfig.source) {
      flagsConfig.source = Flags.file({
        char: 's',
        description: CommandBase.messages.getMessage('source.delta.sourceFlagDescription')
      });
    }
    if (!flagsConfig.destination) {
      flagsConfig.destination = Flags.file({
        char: 'd',
        description: CommandBase.messages.getMessage('source.delta.destinationFlagDescription')
      });
    }
    if (!flagsConfig.force) {
      flagsConfig.force = Flags.file({
        char: 'f',
        description: CommandBase.messages.getMessage('source.delta.forceFlagDescription')
      });
    }
    if (!flagsConfig.ignore) {
      flagsConfig.ignore = Flags.file({
        char: 'i',
        description: CommandBase.messages.getMessage('source.delta.ignoreFlagDescription')
      });
    }
    if (!flagsConfig.deletereport) {
      flagsConfig.deletereport = Flags.file({
        char: 'r',
        description: CommandBase.messages.getMessage('source.delta.deleteReportFlagDescription')
      });
    }
    if (!flagsConfig.check) {
      flagsConfig.check = Flags.boolean({
        char: 'c',
        description: CommandBase.messages.getMessage('source.delta.checkFlagDescription')
      });
    }
    if (!flagsConfig.copyfulldir) {
      flagsConfig.copyfulldir = Flags.string({
        char: 'a',
        description: CommandBase.messages.getMessage('source.delta.copyFullDirFlagDescription', [Constants.DEFAULT_COPY_DIR_LIST.join()])
      });
    }
    return flagsConfig;
  }

  public static async getDeltaOptions(flags: any): Promise<DeltaOptions> {
    let deltaOptions = new DeltaOptions();
    if (!flags) {
      return deltaOptions;
    }
    // Read/Write the options file if it does not exist already

    if (flags.options) {
      deltaOptions = await OptionsFactory.get(DeltaOptions, flags.options as unknown as string);
    } else {
      deltaOptions.deltaFilePath = flags.deltaFilePath ?? null;
      deltaOptions.source = flags.source ?? null;
      deltaOptions.destination = flags.destination ?? null;
      deltaOptions.forceFile = flags.forceFile ?? null;
      deltaOptions.ignoreFile = flags.ignoreFile ?? null;
      if (flags.copyfulldir) {
        deltaOptions.fullCopyDirNames = flags.copyfulldir.split(',');
      } else {
        deltaOptions.fullCopyDirNames = Constants.DEFAULT_COPY_DIR_LIST;
      }
    }
    return deltaOptions;
  }
}
