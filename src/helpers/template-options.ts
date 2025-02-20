import { OptionsBase } from './options.js';

export class TemplateOptions extends OptionsBase {
  public metaDataTypes: string[] = [];
  public excludeFieldTypes: string[] = [];
  public includeReadOnly = false;

  public loadDefaults(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.metaDataTypes = [];
        this.excludeFieldTypes = [
          'reference',
          'combobox',
          'dataCategoryGroupReference'
        ];
        this.includeReadOnly = false;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}
