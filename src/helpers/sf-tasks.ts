import path from 'node:path';
import {
  DescribeMetadataResult,
  DescribeMetadataObject,
  ListMetadataQuery,
  FileProperties,
} from '@jsforce/jsforce-node/lib/api/metadata.js';
import { DescribeSObjectResult } from '@jsforce/jsforce-node/lib/types';
import { ensureArray } from '@salesforce/ts-types';
import { AuthInfo, Connection, Org, AuthFields } from '@salesforce/core';
import { ConfigAggregator, ConfigInfo } from '@salesforce/core';
import Utils, { RestResult } from './utils.js';
import { RestAction } from './utils.js';
import Constants from './constants.js';
import { SfCore } from './sf-core.js';
import { SfFolder, SfQuery, SfEntity } from './sf-query.js';
import { ApiKind, SfClient } from './sf-client.js';
import { SfUI } from './sf-ui.js';

export class SfJobInfo {
  public id: string;
  public batchId: string;
  public state: string;
  public createdDate: string;
  public statusCount: number;
  public maxStatusCount: number;
  public jobKind: ApiKind;

  public constructor() {
    this.statusCount = 0;
    this.maxStatusCount = 0;
  }

  public static fromRestResult(result: RestResult): SfJobInfo {
    if (!result) {
      return null;
    }
    const jobInfo = new SfJobInfo();
    jobInfo.createdDate = Date.now.toString();
    if (result.isError) {
      jobInfo.state = 'Failed';
    } else {
      jobInfo.state = 'Queued';
      jobInfo.id = result.body;
    }
    return jobInfo;
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  public static fromResults(results: any): SfJobInfo {
    if (!results) {
      return null;
    }
    const jobInfo = new SfJobInfo();
    if (results) {
      if (results?.[0]) {
        // If there is a jobId then we have a batch job
        // If not its is a single job
        if (results[0].jobId) {
          jobInfo.id = results[0].jobId;
          jobInfo.batchId = results[0].id;
        } else {
          jobInfo.id = results[0].id;
        }
        jobInfo.state = results[0].state;
        jobInfo.createdDate = results[0].createdDate;
      }
    }
    return jobInfo;
  }

  public isDone(): boolean {
    // Holding1, Queued, Preparing, Processing, Aborted, Completed,Failed
    return this.state === 'Aborted' || this.state === 'Completed' || this.state === 'Failed' || this.state === 'Closed';
  }
}

export class SfTasks {
  public static defaultMetaTypes = [
    'ApexClass',
    'ApexPage',
    'CustomApplication',
    'CustomObject',
    'CustomTab',
    'PermissionSet',
    'Profile',
  ];

  protected static proFolderPaths: Map<string, string> = null;

  public static async describeMetadata(org: Org): Promise<DescribeMetadataObject[]> {
    if (!org) {
      return null;
    }
    const response: DescribeMetadataResult = await org.getConnection().metadata.describe();
    return !response?.metadataObjects ? [] : ensureArray(response.metadataObjects);
  }

  public static async *getTypesForPackage(
    org: Org,
    describeMetadatas: Set<any>,
    namespaces: Set<string> = null
  ): AsyncGenerator<any, void, void> {
    if (!org || !describeMetadatas) {
      return null;
    }
    let folderPathMap: Map<string, string>;
    for (const describeMetadata of describeMetadatas) {
      const members = [];
      try {
        SfUI.writeMessageCallback(describeMetadata.xmlName as string);
        if (!describeMetadata.inFolder) {
          for await (const result of this.listMetadata(org, describeMetadata.xmlName as string, null, namespaces)) {
            members.push(result.fullName);
          }
        } else {
          const folderMetaName =
            describeMetadata.xmlName === SfCore.EMAIL_TEMPLATE_XML_NAME
              ? SfCore.EMAIL_TEMPLATE_XML_NAME
              : `${describeMetadata.xmlName as string}Folder`;

          // Get SOQL folder data (ONCE!)
          if (!folderPathMap) {
            folderPathMap = await this.getFolderSOQLData(org);
          }

          // Iterate all the folder metas
          for await (const folderMeta of this.listMetadata(org, folderMetaName, null, namespaces)) {
            // Set the parent Id (used for nested folders)
            // Salesforce does not return the full path in the metadada
            //
            const id = folderMeta.id;
            const folderPath = folderPathMap.has(id) ? folderPathMap.get(id) : folderMeta.fullName;

            // Add the meta for just the folder
            members.push(folderPath);

            for await (const inFolderMetadata of this.listMetadata(
              org,
              describeMetadata.xmlName as string,
              folderMeta.fullName,
              namespaces
            )) {
              // Add the meta for the item in the folder
              members.push([folderPath, path.basename(inFolderMetadata.fullName)].join('/'));
            }
          }
        }
      } catch (err) {
        SfUI.writeMessageCallback(`ERROR: ${JSON.stringify(err)}`);
      }

      yield { name: describeMetadata.xmlName, members };
    }
  }

  public static async *listMetadata(
    org: Org,
    metadataType: string,
    folder: string = null,
    namespaces: Set<string> = null
  ): AsyncGenerator<FileProperties, void, void> {
    if (!org || !metadataType) {
      return;
    }

    const conn = org.getConnection();
    const query: ListMetadataQuery = folder ? { type: metadataType, folder } : { type: metadataType };

    const results: FileProperties[] = await conn.metadata.list(query);
    if (results) {
      for (const result of results) {
        // If we have a metadata namespace AND
        //  We are excluding namespaces OR
        //  The list of allowed namespaces does not include the metadata namespace
        // Continue.
        if (result.namespacePrefix && !namespaces?.has(result.namespacePrefix)) {
          continue;
        }
        yield result;
      }
    }
  }

  public static async listMetadatas(
    org: Org,
    metadataTypes: Iterable<string>,
    folder: string = null,
    namespaces: Set<string> = null
  ): Promise<Map<string, FileProperties[]>> {
    if (!org || !metadataTypes) {
      return null;
    }
    const response = new Map<string, FileProperties[]>();
    for (const metadataType of metadataTypes) {
      const members = [] as FileProperties[];
      for await (const member of this.listMetadata(org, metadataType, folder, namespaces)) {
        members.push(member);
      }
      response.set(metadataType, members);
    }
    return response;
  }

  public static async describeObject(org: Org, objectName: string): Promise<DescribeSObjectResult> {
    if (!org || !objectName) {
      return null;
    }
    const results = await org.getConnection().describe(objectName);
    return results;
  }

  public static async enqueueApexTests(
    org: Org,
    sfEntities?: SfEntity[],
    shouldSkipCodeCoverage = false
  ): Promise<RestResult> {
    if (!org) {
      return null;
    }

    // Create request body: https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/intro_rest_resources.htm
    const classIds = [];
    for (const record of sfEntities ?? []) {
      classIds.push(record.id);
    }
    const body = {
      classids: classIds.length > 0 ? classIds.toString() : null,
      maxFailedTests: -1,
      testLevel: classIds.length > 0 ? 'RunSpecifiedTests' : 'RunLocalTests',
      skipCodeCoverage: shouldSkipCodeCoverage,
    };
    const client = new SfClient(org);
    const uri = `${await client.getBaseUri(ApiKind.TOOLING)}runTestsAsynchronous/`;

    // NOTE: If this returns 500 the daily limit may have been reached
    const result = await client.doAction(RestAction.POST, uri, body);
    if (!result.id) {
      result.id = result.body;
    }
    return result;
  }

  public static async getBulkJobStatus(org: Org, jobInfo: SfJobInfo): Promise<SfJobInfo> {
    if (!org || !jobInfo) {
      return null;
    }

    // /services/data/vXX.X/jobs/ingest/jobID
    const client = new SfClient(org);
    const uri = `${await client.getBaseUri(jobInfo.jobKind)}${jobInfo.id}`;
    const result = await client.doAction(RestAction.GET, uri);

    const newJobInfo = new SfJobInfo();
    newJobInfo.id = jobInfo.id;
    newJobInfo.state = result.body.state;
    newJobInfo.createdDate = result.body.createdDate;
    newJobInfo.statusCount++;
    switch (result.body.state) {
      case 'JobComplete':
        newJobInfo.state = 'Complete';
        break;
      default:
        newJobInfo.state = result.body.state;
        break;
    }
    return newJobInfo;
  }

  public static async *waitForJob(
    org: Org,
    jobInfo: SfJobInfo,
    maxWaitSeconds = -1,
    sleepMilliseconds = 5000
  ): AsyncGenerator<SfJobInfo, SfJobInfo, void> {
    if (!org || !jobInfo) {
      return null;
    }
    const maxCounter = (maxWaitSeconds * 1000) / sleepMilliseconds;
    jobInfo.statusCount = 0;
    while ((maxCounter <= 0 || jobInfo.statusCount <= maxCounter) && !jobInfo.isDone()) {
      await Utils.sleep(sleepMilliseconds);

      jobInfo = await SfTasks.getBulkJobStatus(org, jobInfo);
      jobInfo.maxStatusCount = maxCounter;
      jobInfo.statusCount++;

      yield jobInfo;
    }

    return jobInfo;
  }

  public static async getOrgInfo(org: Org): Promise<AuthFields> {
    if (!org) {
      return null;
    }
    const authInfo = await AuthInfo.create({ username: org.getUsername() });
    return authInfo.getFields(true);
  }

  public static getMapFromSourceTrackingStatus(sourceTrackingStatues: any[]): any {
    if (!sourceTrackingStatues) {
      return null;
    }
    const metadataMap: Map<string, string[]> = new Map<string, string[]>();
    const conflictTypes: Map<string, string[]> = new Map<string, string[]>();
    const deleteTypes: Map<string, string[]> = new Map<string, string[]>();

    for (const status of sourceTrackingStatues) {
      /*
              Actions: Add, Changed, Deleted
              {
                "state": "Local Add",
                "fullName": "SF86_Template",
                "type": "StaticResource",
                "filePath": "force-app\\main\\default\\staticresources\\SF86_Template.xml"
              },
              {
                "state": "Remote Add",
                "fullName": "Admin",
                "type": "Profile",
                "filePath": null
              },
               {
                "state": "Remote Changed (Conflict)",
                "fullName": "Custom%3A Support Profile",
                "type": "Profile",
                "filePath": "force-app\\main\\default\\profiles\\Custom%3A Support Profile.profile-meta.xml"
              },
            */
      const actionParts = status.state.split(' ');
      const typeName = status.type.trim().endsWith('Folder')
        ? status.type.replace(/Folder/, '').trim()
        : status.type.trim();
      const fullName = status.fullName.trim();

      let collection = null;
      if (status.state.includes('(Conflict)')) {
        collection = conflictTypes;
      } else if (actionParts[0] === 'Remote') {
        switch (actionParts[1]) {
          case 'Add':
          case 'Changed':
            collection = metadataMap;
            break;
          case 'Deleted':
            collection = deleteTypes;
            break;
          default:
            throw new Error(`Unknown Action: ${actionParts[1] as string}`);
        }
      }
      if (collection != null) {
        if (!collection.has(typeName)) {
          collection.set(typeName, [fullName]);
        } else {
          collection.get(typeName).push(fullName);
        }
      }
    }
    return {
      map: metadataMap,
      conflicts: conflictTypes,
      deletes: deleteTypes,
    };
  }

  public static async getConfigValue(configName: string): Promise<string> {
    const aggregator = await ConfigAggregator.create();
    const info: ConfigInfo = aggregator.getInfo(configName);
    return info?.value as string;
  }

  public static async getMaxQueryLimit(): Promise<number> {
    return Number(await SfTasks.getConfigValue(Constants.SF_CONFIG_MAX_QUERY_LIMIT));
  }

  public static async getDefaultOrgAlias(): Promise<string> {
    return SfTasks.getConfigValue(Constants.SF_CONFIG_DEFAULT_USERNAME);
  }

  public static async getUnsupportedMetadataTypes(): Promise<string[]> {
    const result = await Utils.getRestResult(RestAction.GET, Constants.METADATA_COVERAGE_REPORT_URL);
    if (!result || result.isError === true) {
      return [] as string[];
    }
    const memTypes: string[] = result.getContent().types;
    const myMap = new Map<string, any>(Object.entries(memTypes));
    const types = [];
    for (const [key, value] of myMap) {
      if (value.channels && !value.channels.metadataApi) {
        types.push(key);
      }
    }
    return Utils.sortArray(types) as string[];
  }

  public static async getConnection(username: string): Promise<Connection> {
    if (!username) {
      return null;
    }
    const authInfo = await AuthInfo.create({ username });
    const connection = await Connection.create({ authInfo });
    return connection;
  }

  public static async executeAnonymousBlock(org: Org, apex: string): Promise<RestResult> {
    if (!org || !apex) {
      return null;
    }

    // https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/intro_rest_resources.htm
    // req.setEndpoint('https://MyDomainName.my.salesforce.com/services/data/v59.0/tooling/executeAnonymous/?
    // anonymousBody=System.debug('Test')%3B');
    // req.setMethod('GET');
    const client = new SfClient(org);
    const uri = `${await client.getBaseUri(ApiKind.TOOLING)}executeAnonymous/?anonymousBody=${encodeURI(apex)}`;

    // NOTE: If this returns 500 the daily limit may have been reached
    const result = await client.doAction(RestAction.GET, uri);
    if (!result.isError) {
      // Count a compiler or execution error as a failure
      result.isError = !result.body.compiled || !result.body.success;
    }

    return result;
  }

  public static async getOrgLimits(org: Org): Promise<RestResult> {
    if (!org) {
      return null;
    }

    // https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_limits.htm
    const client = new SfClient(org);
    const uri = `${await client.getBaseUri(ApiKind.LIMITS)}`;

    const result = await client.doAction(RestAction.GET, uri);
    return result;
  }

  private static async getFolderSOQLData(org: Org): Promise<Map<string, string>> {
    if (!this.proFolderPaths) {
      const allFolders = await SfQuery.getFolders(org);

      this.proFolderPaths = new Map<string, string>();
      for (const folder of allFolders) {
        if (!folder) {
          continue;
        }
        const pathParts = this.getFolderFullPath(allFolders, folder, []);
        this.proFolderPaths.set(folder.id, pathParts.join('/'));
      }
    }
    return this.proFolderPaths;
  }

  // Recursively looks up a Folder's parent until it reaches the tree's root.
  // This is only needed for Folder structures which are more than one level deep.
  // SF only returns a entities's direct parent.
  private static getFolderFullPath(folders: SfFolder[], currentFolder: SfFolder, pathParts: string[]): string[] {
    if (currentFolder.developerName) {
      pathParts.unshift(currentFolder.developerName.trim());
    }

    for (const folder of folders) {
      if (folder.id === currentFolder.parentId) {
        pathParts = this.getFolderFullPath(folders, folder, pathParts);
      }
    }
    return pathParts;
  }
}
