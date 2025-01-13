import { Ux, SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, Org, Connection } from '@salesforce/core';


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(process.cwd());

export class ConditionalError extends Error {
  public isRethrown = false;

  public constructor(message: string, isRethrown = false) {
    super(message);
    this.isRethrown = isRethrown;
  }
}

export abstract class CommandBase extends SfCommand<void> {
  // Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
  // or any library that is using the messages framework can also be loaded this way.
  public static messages = Messages.loadMessages('@salesforce/sf-pack', 'sf-pack');

  public static targetOrgFlagName = 'target-org';

  protected static commonFlags = {
    [CommandBase.targetOrgFlagName]: Flags.requiredOrg({
      aliases: ['username', 'u'],
    })
  }

  private static uxInst: Ux;

  public org: Org | undefined;

  protected gotError = false;

  protected get orgAlias(): string | undefined {
    this.debug('Start orgAlias');
    return this.org?.getUsername();
  }

  protected get orgId(): string | undefined {
    this.debug('Start orgId');
    return this.org?.getOrgId();
  }

  protected get connection(): Connection | undefined {
    this.debug('Start connection');
    return this.org?.getConnection();
  }

  protected get UX(): Ux {
    if(CommandBase.uxInst == null) {
      CommandBase.uxInst = new Ux({jsonEnabled: this.jsonEnabled()});
    }
    return CommandBase.uxInst;
  }

  public async run(): Promise<void> {
    this.debug('Start run');

    try {
      this.debug('Start runInternal');
      await this.runInternal();
      this.debug('End runInternal');
    } catch (err) {
      this.errorHandler(err as Error);
    } finally {
      this.log('Done.');
      process.exitCode = this.gotError ? 1 : 0;
    }
  }

  protected errorHandler(err: Error, throwErr = false): void {
    this.debug('Start errorHandler');
    this.gotError = true;
    let message: string = null as any;
    let error: Error | ConditionalError | null = null as any;
    
    if (err instanceof ConditionalError) {
      this.debug(err.stack);
      message = err.message;
      // Obey the re-thrown 
      error = throwErr && err.isRethrown ? err : null;
    } else if (err instanceof Error) {
      this.debug(err.stack);
      message = err.message;
      error = throwErr ? err : null;
    } else {
      message = `Error: ${JSON.stringify(err)}`;
      error = throwErr ? new Error(message) : null;
    }
    
    this.warn(message);
    if(error) {
      throw error;
    }
  }

  protected raiseError(message: string): void {
    throw new ConditionalError(message, false);
  }

  protected async parse(options?: any, argv?: string[]): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const flags = await super.parse(options,argv);
    this.org = flags.flags[CommandBase.targetOrgFlagName];
    return flags;
  }

  protected abstract runInternal(): Promise<void>;
}
