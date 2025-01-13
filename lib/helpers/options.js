import path from 'node:path';
import { promises as fs } from 'node:fs';
import Utils from './utils.js';
import { SfCore } from './sf-core.js';
export class OptionsSettings {
    ignoreVersion = false;
    blockExternalConnections = false;
}
export class OptionsBase {
    // This field should NOT be serialized see includeField method below
    version = 1.0;
    prvSettings;
    // Make sure we have a default ctor
    constructor(init) {
        Object.assign(this, init);
        this.prvSettings = new OptionsSettings();
    }
    get isCurrentVersion() {
        return this.version === this.currentVersion;
    }
    get settings() {
        return this.prvSettings;
    }
    set settings(optionSettings) {
        if (optionSettings) {
            this.prvSettings = optionSettings;
        }
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    get currentVersion() {
        return this.version;
    }
    async load(optionsPath) {
        const json = await this.readFile(optionsPath);
        if (!json) {
            await this.loadDefaults();
            if (optionsPath) {
                await this.save(optionsPath);
            }
        }
        else {
            await this.deserialize(json);
            // If we have a filepath AND the version is not current => write the current version
            if (!this.isCurrentVersion && !this.prvSettings.ignoreVersion && optionsPath) {
                this.setCurrentVersion();
                await this.save(optionsPath);
            }
        }
    }
    async save(optionsPath) {
        if (!optionsPath) {
            throw new Error('The optionsPath argument cannot be null.');
        }
        const dir = path.dirname(optionsPath);
        if (dir) {
            await Utils.mkDirPath(dir);
        }
        await fs.writeFile(optionsPath, await this.serialize());
    }
    ignoreField(fieldName) {
        return fieldName === 'prvSettings';
    }
    deserialize(serializedOptionBase) {
        return new Promise((resolve, reject) => {
            try {
                const options = JSON.parse(serializedOptionBase);
                for (const field of Object.keys(options)) {
                    if (Object.prototype.hasOwnProperty.call(this, field) && !this.ignoreField(field)) {
                        this[field] = options[field];
                    }
                }
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    serialize() {
        // Always check & set the current version before serializing
        if (!this.isCurrentVersion) {
            this.setCurrentVersion();
        }
        const stringify = (key, value) => {
            return (this.ignoreField(key) ? undefined : value);
        };
        return new Promise((resolve, reject) => {
            try {
                resolve(JSON.stringify(this, stringify, SfCore.jsonSpaces));
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async readFile(optionsPath) {
        if (!optionsPath) {
            return null;
        }
        if (await Utils.pathExists(optionsPath)) {
            return (await fs.readFile(optionsPath)).toString();
        }
        else {
            return null;
        }
    }
    setCurrentVersion() {
        this.version = this.currentVersion;
    }
}
//# sourceMappingURL=options.js.map