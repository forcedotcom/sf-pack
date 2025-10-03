import Utils from './utils.js';
import { OptionsBase } from './options.js';
import Constants from './constants.js';

export class DeltaOptions extends OptionsBase {
  private static CURRENT_VERSION = 1.0;

  public deltaFilePath: string = null as any;
  public source: string = null as any;
  public destination: string = null as any;
  public deleteReportFile: string = null as any;
  public forceFile: string = null as any;
  public ignoreFile: string = null as any;
  public isDryRun = false;
  public fullCopyDirNames: string[] =  Constants.DEFAULT_COPY_DIR_LIST;
  public logAllMessagesToConsole = false;

  // Make sure we have a default ctor
  public constructor(init?: Partial<DeltaOptions>) {
    super(init);
    Object.assign(this, init);
  }

  protected get currentVersion(): number {
    return DeltaOptions.CURRENT_VERSION;
  }

  public normalize(): void {
    if (this.deltaFilePath) {
      this.deltaFilePath = Utils.normalizePath(this.deltaFilePath);
    }
    if (this.source) {
      this.source = Utils.normalizePath(this.source);
    }
    if (this.destination) {
      this.destination = Utils.normalizePath(this.destination);
    }
    if (this.deleteReportFile) {
      this.deleteReportFile = Utils.normalizePath(this.deleteReportFile);
    }
    if (this.forceFile) {
      this.forceFile = Utils.normalizePath(this.forceFile);
    }
    if (this.ignoreFile) {
      this.ignoreFile = Utils.normalizePath(this.ignoreFile);
    }
  }

  public loadDefaults(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.deltaFilePath = '';
        this.source = '';
        this.destination = '';
        this.deleteReportFile = '';
        this.forceFile = '';
        this.ignoreFile = '';
        this.isDryRun = false;
        this.fullCopyDirNames = Constants.DEFAULT_COPY_DIR_LIST;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}
