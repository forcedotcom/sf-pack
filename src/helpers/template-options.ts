import { OptionsBase } from './options.js';
import { SfCore } from './sf-core.js';

export class TemplateOptions extends OptionsBase {
  public metaDataTypes: string[] = [];
  public excludeRules: Map<string,any>;

  public loadDefaults(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.metaDataTypes = [];
        this.excludeRules = new Map<string, any>();
        this.excludeRules.set('createable',false);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  protected async deserialize(serializedOptions: string): Promise<void> {
      return new Promise((resolve, reject) => {
        try {
          const options = JSON.parse(serializedOptions) as TemplateOptions;
          this.metaDataTypes = options.metaDataTypes;
  
          if (options.excludeRules) {
            this.excludeRules = new Map(options.excludeRules)
          }
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
                metaDataTypes: this.metaDataTypes ? this.metaDataTypes : [],
                excludeRules: Array.from(this.excludeRules.entries()),
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
