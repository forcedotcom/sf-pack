import { OptionsBase } from './options.js';
import { SfCore } from './sf-core.js';
export class XPathRule {
    name;
    xPath;
    values;
}
export class XPathOptions extends OptionsBase {
    rules;
    constructor() {
        super();
        this.rules = new Map();
    }
    loadDefaults() {
        return new Promise((resolve, reject) => {
            try {
                this.rules.set('force-app/main/default/profiles/*.profile-meta.xml', [
                    {
                        name: 'Bad FieldPermissions',
                        xPath: "//*[local-name()='Profile']/*[local-name()='fieldPermissions']/*[local-name()='field']/text()",
                        values: [
                            'Account.CleanStatus',
                            'Lead.CleanStatus',
                            'Account.DandbCompanyId',
                            'Lead.DandbCompanyId',
                            'Account.DunsNumber',
                            'Lead.CompanyDunsNumber',
                            'Account.NaicsCode',
                            'Account.NaicsDesc',
                            'Lead.PartnerAccountId',
                            'Account.YearStarted',
                            'Account.Tradestyle',
                        ],
                    },
                    {
                        name: 'Bad UserPermissions',
                        xPath: "//*[local-name()='Profile']/*[local-name()='userPermissions']/*[local-name()='name']/text()",
                        values: ['EnableCommunityAppLauncher', 'WorkDotComUserPerm', 'WorkCalibrationUser', 'CreateContentSpace'],
                    },
                ]);
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async deserialize(serializedOptions) {
        return new Promise((resolve, reject) => {
            try {
                if (!serializedOptions) {
                    return null;
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const rules = new Map(JSON.parse(serializedOptions));
                if (rules) {
                    this.rules = rules;
                }
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    serialize() {
        return new Promise((resolve, reject) => {
            try {
                resolve(JSON.stringify(Array.from(this.rules.entries()), null, SfCore.jsonSpaces));
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
//# sourceMappingURL=xpath-options.js.map