import { OptionsBase } from './options.js';
export class TemplateOptions extends OptionsBase {
    metaDataTypes = [];
    excludeFieldTypes = [];
    includeReadOnly = false;
    loadDefaults() {
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
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
//# sourceMappingURL=template-options.js.map