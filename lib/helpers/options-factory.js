"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionsFactory = void 0;
class OptionsFactory {
    static async get(type, optionsFilePath, settings) {
        if (!type) {
            return null;
        }
        const options = new type();
        if (settings) {
            options.settings = settings;
        }
        await options.load(optionsFilePath);
        return options;
    }
    static async set(options, optionsFilePath) {
        if (!optionsFilePath) {
            throw new Error('You must specify an optionsFilePath.');
        }
        await options.save(optionsFilePath);
    }
}
exports.OptionsFactory = OptionsFactory;
//# sourceMappingURL=options-factory.js.map