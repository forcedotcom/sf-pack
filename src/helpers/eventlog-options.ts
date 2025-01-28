import { OptionsBase } from './options.js';
import { SfCore } from './sf-core.js';

export class EventLogOptions extends OptionsBase {
  private static CURRENT_VERSION = 1.0;
  private static DEFAULT_QUERY: string = "SELECT Id, EventType, LogFile, LogDate, LogFileLength FROM EventLogFile WHERE LogDate>Yesterday AND EventType='ContentTransfer'";
  private static DEFAULT_OUTPUT_DIR: string = './';
  
  public soqlQuery: string = null;
  public outputFolder: string = null;

  protected get currentVersion(): number {
    return EventLogOptions.CURRENT_VERSION;
  }

  public async loadDefaults(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.soqlQuery = EventLogOptions.DEFAULT_QUERY
        this.outputFolder = EventLogOptions.DEFAULT_OUTPUT_DIR;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  protected async deserialize(serializedOptions: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const options = JSON.parse(serializedOptions) as EventLogOptions;
        this.soqlQuery = options.soqlQuery;
        this.outputFolder = options.outputFolder;

        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  protected async serialize(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        resolve(
          JSON.stringify(
            {
              soqlQuery: this.soqlQuery ? this.soqlQuery : EventLogOptions.DEFAULT_QUERY,
              outputFolder: this.outputFolder ? this.outputFolder : EventLogOptions.DEFAULT_OUTPUT_DIR,
            },
            null,
            SfCore.jsonSpaces
          )
        );
      } catch (err) {
        reject(err);
      }
    });
  }
}
