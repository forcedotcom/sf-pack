import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base';
import Utils from '../../../helpers/utils';
import { DeltaCommandBase } from '../../../helpers/delta-command';
import { DeltaProvider, Delta } from '../../../helpers/delta-provider';
import { DeltaOptions } from '../../../helpers/delta-options';

export default class Git extends CommandBase {
  public static description = CommandBase.messages.getMessage('source.delta.git.commandDescription');

  public static examples = [
    `$ sf source delta git -g git.txt -s force-app -d deploy
    Reads the specified -(g)it diff file 'git.txt' and uses it to identify the deltas in
    -(s)ource 'force-app' and copies them to -(d)estination 'deploy'`,
  ];

  public static gitDeltaProvider = class extends DeltaProvider {
    public name = 'git';
    public deltaLineToken = '\t';
    public deltas = new Map<string, string>();

    public processDeltaLine(deltaLine: string): void {
      const parts: string[] = deltaLine.split(this.deltaLineToken);
      this.deltas.set(Utils.normalizePath(parts[1]), parts[0]);
    }

    public getMessage(name: string): string {
      return CommandBase.messages.getMessage(name);
    }

    public async *diff(source?: string): AsyncGenerator<Delta, any, any> {
      // git has already done all of the hashing/diffing for us
      source = source ? Utils.normalizePath(source) : this.deltaOptions.source;
      for (const [deltaFile, deltaKind] of this.deltas) {
        // Did we exclude the filepath?
        if (!deltaFile.startsWith(source)) {
          await this.logMessage(`Skipping delta file line: '${deltaFile}' not in source path: '${source}'.`, true);
          continue;
        }
        yield new Delta(deltaKind, deltaFile);
      }
    }
    public async validateDeltaOptions(deltaOptions: DeltaOptions): Promise<string> {
      // Currently we don't allow creating the git-diff file
      if (!deltaOptions.deltaFilePath || !(await Utils.pathExists(deltaOptions.deltaFilePath))) {
        return 'No delta -g(it) file specified or specified file does not exist.';
      }
      const results = await super.validateDeltaOptions(deltaOptions);
      return results;
    }
  };

  public static readonly flags = DeltaCommandBase.getFlagsConfig({
    git: Flags.file({
      char: 'g',
      description: CommandBase.messages.getMessage('source.delta.git.gitFlagDescription'),
    }),
  });

  protected name = 'git';
  protected deltas = new Map<string, string>();

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(Git);
    const deltaOptions = await DeltaCommandBase.getDeltaOptions(flags);
    if(!deltaOptions.deltaFilePath) {
      deltaOptions.deltaFilePath = flags.git;
    }

    const provider = new Git.gitDeltaProvider();
    await provider.run(deltaOptions);
  }
}
