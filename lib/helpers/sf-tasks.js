import path from 'node:path';
import { ensureArray } from '@salesforce/ts-types';
import { AuthInfo, Connection } from '@salesforce/core';
import { ConfigAggregator } from '@salesforce/core';
import Utils from './utils.js';
import { RestAction } from './utils.js';
import Constants from './constants.js';
import { SfCore } from './sf-core.js';
import { SfQuery } from './sf-query.js';
import { ApiKind, SfClient } from './sf-client.js';
import { SfUI } from './sf-ui.js';
export class SfJobInfo {
    id;
    batchId;
    state;
    createdDate;
    statusCount;
    maxStatusCount;
    jobKind;
    constructor() {
        this.statusCount = 0;
        this.maxStatusCount = 0;
    }
    static fromRestResult(result) {
        if (!result) {
            return null;
        }
        const jobInfo = new SfJobInfo();
        jobInfo.createdDate = Date.now.toString();
        if (result.isError) {
            jobInfo.state = 'Failed';
        }
        else {
            jobInfo.state = 'Queued';
            jobInfo.id = result.body;
        }
        return jobInfo;
    }
    // eslint-disable-next-line @typescript-eslint/member-ordering
    static fromResults(results) {
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
                }
                else {
                    jobInfo.id = results[0].id;
                }
                jobInfo.state = results[0].state;
                jobInfo.createdDate = results[0].createdDate;
            }
        }
        return jobInfo;
    }
    isDone() {
        // Holding1, Queued, Preparing, Processing, Aborted, Completed,Failed
        return this.state === 'Aborted' || this.state === 'Completed' || this.state === 'Failed' || this.state === 'Closed';
    }
}
export class SfTasks {
    static defaultMetaTypes = [
        'ApexClass',
        'ApexPage',
        'CustomApplication',
        'CustomObject',
        'CustomTab',
        'PermissionSet',
        'Profile',
    ];
    static proFolderPaths = null;
    static async describeMetadata(org) {
        if (!org) {
            return null;
        }
        const response = await org.getConnection().metadata.describe();
        return !response?.metadataObjects ? [] : ensureArray(response.metadataObjects);
    }
    static async *getTypesForPackage(org, describeMetadatas, namespaces = null) {
        if (!org || !describeMetadatas) {
            return null;
        }
        let folderPathMap;
        for (const describeMetadata of describeMetadatas) {
            const members = [];
            try {
                SfUI.writeMessageCallback(describeMetadata.xmlName);
                if (!describeMetadata.inFolder) {
                    for await (const result of this.listMetadata(org, describeMetadata.xmlName, null, namespaces)) {
                        members.push(result.fullName);
                    }
                }
                else {
                    const folderMetaName = describeMetadata.xmlName === SfCore.EMAIL_TEMPLATE_XML_NAME
                        ? SfCore.EMAIL_TEMPLATE_XML_NAME
                        : `${describeMetadata.xmlName}Folder`;
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
                        for await (const inFolderMetadata of this.listMetadata(org, describeMetadata.xmlName, folderMeta.fullName, namespaces)) {
                            // Add the meta for the item in the folder
                            members.push([folderPath, path.basename(inFolderMetadata.fullName)].join('/'));
                        }
                    }
                }
            }
            catch (err) {
                SfUI.writeMessageCallback(`ERROR: ${JSON.stringify(err)}`);
            }
            yield { name: describeMetadata.xmlName, members };
        }
    }
    static async *listMetadata(org, metadataType, folder = null, namespaces = null) {
        if (!org || !metadataType) {
            return;
        }
        const conn = org.getConnection();
        const query = folder ? { type: metadataType, folder } : { type: metadataType };
        const results = await conn.metadata.list(query);
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
    static async listMetadatas(org, metadataTypes, folder = null, namespaces = null) {
        if (!org || !metadataTypes) {
            return null;
        }
        const response = new Map();
        for (const metadataType of metadataTypes) {
            const members = [];
            for await (const member of this.listMetadata(org, metadataType, folder, namespaces)) {
                members.push(member);
            }
            response.set(metadataType, members);
        }
        return response;
    }
    static async describeObject(org, objectName) {
        if (!org || !objectName) {
            return null;
        }
        const results = await org.getConnection().describe(objectName);
        return results;
    }
    static async enqueueApexTests(org, sfEntities, shouldSkipCodeCoverage = false) {
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
    static async getBulkJobStatus(org, jobInfo) {
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
    static async *waitForJob(org, jobInfo, maxWaitSeconds = -1, sleepMilliseconds = 5000) {
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
    static async getOrgInfo(org) {
        if (!org) {
            return null;
        }
        const authInfo = await AuthInfo.create({ username: org.getUsername() });
        return authInfo.getFields(true);
    }
    static getMapFromSourceTrackingStatus(sourceTrackingStatues) {
        if (!sourceTrackingStatues) {
            return null;
        }
        const metadataMap = new Map();
        const conflictTypes = new Map();
        const deleteTypes = new Map();
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
            }
            else if (actionParts[0] === 'Remote') {
                switch (actionParts[1]) {
                    case 'Add':
                    case 'Changed':
                        collection = metadataMap;
                        break;
                    case 'Deleted':
                        collection = deleteTypes;
                        break;
                    default:
                        throw new Error(`Unknown Action: ${actionParts[1]}`);
                }
            }
            if (collection != null) {
                if (!collection.has(typeName)) {
                    collection.set(typeName, [fullName]);
                }
                else {
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
    static async getConfigValue(configName) {
        const aggregator = await ConfigAggregator.create();
        const info = aggregator.getInfo(configName);
        return info?.value;
    }
    static async getMaxQueryLimit() {
        return Number(await SfTasks.getConfigValue(Constants.SF_CONFIG_MAX_QUERY_LIMIT));
    }
    static async getDefaultOrgAlias() {
        return SfTasks.getConfigValue(Constants.SF_CONFIG_DEFAULT_USERNAME);
    }
    static async getUnsupportedMetadataTypes() {
        const result = await Utils.getRestResult(RestAction.GET, Constants.METADATA_COVERAGE_REPORT_URL);
        if (!result || result.isError === true) {
            return [];
        }
        const memTypes = result.getContent().types;
        const myMap = new Map(Object.entries(memTypes));
        const types = [];
        for (const [key, value] of myMap) {
            if (value.channels && !value.channels.metadataApi) {
                types.push(key);
            }
        }
        return Utils.sortArray(types);
    }
    static async getConnection(username) {
        if (!username) {
            return null;
        }
        const authInfo = await AuthInfo.create({ username });
        const connection = await Connection.create({ authInfo });
        return connection;
    }
    static async executeAnonymousBlock(org, apex) {
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
    static async getOrgLimits(org) {
        if (!org) {
            return null;
        }
        // https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_limits.htm
        const client = new SfClient(org);
        const uri = `${await client.getBaseUri(ApiKind.LIMITS)}`;
        const result = await client.doAction(RestAction.GET, uri);
        return result;
    }
    static async getFolderSOQLData(org) {
        if (!this.proFolderPaths) {
            const allFolders = await SfQuery.getFolders(org);
            this.proFolderPaths = new Map();
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
    // SFDX only returns a entitie's direct parent.
    static getFolderFullPath(folders, currentFolder, pathParts) {
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
//# sourceMappingURL=sf-tasks.js.map