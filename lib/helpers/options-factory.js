export class OptionsFactory {
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
//# sourceMappingURL=options-factory.js.map