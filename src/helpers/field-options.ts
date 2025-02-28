import { Field } from '@jsforce/jsforce-node';
import { OptionsBase } from './options.js';
import { SfCore } from './sf-core.js';

export abstract class FieldOptions extends OptionsBase {
  public metaDataTypes: string[] = [];
  public excludeRules: Map<string,any>;

  public loadDefaults(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.metaDataTypes = [];
        this.excludeRules = new Map<string, any>();
        this.excludeRules.set('createable', false);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  public removeExcluded(fields: Field[]): Field[] {
    if(fields) {
      if(this.excludeRules) {
        const included: Field[] = [];
        for(const field of fields) {
          if(!this.isExcluded(field)) {
            included.push(field);
          }
        }
        return included;
      }
    }
    return fields;
  }

  public isExcluded(field: Field): boolean {
    if(field){
      if(this.excludeRules) {
        for(const ruleAtt of this.excludeRules.keys()) {
          const ruleValue = this.excludeRules.get(ruleAtt);
          const attValue = (field as object)[ruleAtt];
          if(ruleValue === attValue) {
            return true;
          }
        }
      }
      return false;
    }
  }

  protected async deserialize(serializedOptions: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const options = JSON.parse(serializedOptions) as FieldOptions;
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
