import { OptionsBase, OptionsSettings } from './options.js';
export declare class OptionsFactory {
    static get<T extends OptionsBase>(type: new () => T, optionsFilePath?: string, settings?: OptionsSettings): Promise<T | null>;
    static set(options: OptionsBase, optionsFilePath: string): Promise<void>;
}
