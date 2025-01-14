import { CommandBase } from '../../helpers/command-base.js';
import { ObjectDetail, FieldDetail, PermissionSet, MetadataDetail } from '../../helpers/sf-permission.js';
export default class Permissions extends CommandBase {
    static defaultReportPath: string;
    static defaultMetadataFolders: string[];
    static description: string;
    static examples: string[];
    static readonly flags: {
        source: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        report: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
        folders: import("@oclif/core/interfaces").OptionFlag<string, import("@oclif/core/interfaces").CustomOptions>;
    };
    protected defaultReportHeaderName: string;
    protected objectMetadata: Map<string, ObjectDetail>;
    protected fieldMetadata: Map<string, FieldDetail>;
    protected permissions: Map<string, PermissionSet>;
    protected reportHeaders: string[];
    protected runInternal(): Promise<void>;
    protected buildSheet(permCollectionPropertyName: string, metadataDetails?: Map<string, MetadataDetail>): string[][];
    protected getObjectDetails(name: string): ObjectDetail;
    protected getFieldDetails(name: string): FieldDetail;
    protected processObjectMeta(filePath: string, json: any): void;
    protected processFieldMeta(filePath: string, json: any): void;
    protected processPermissionSetMeta(filePath: string, json: any): void;
}
