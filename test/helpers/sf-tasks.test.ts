import { expect } from 'chai';
import { Org } from '@salesforce/core';
import { SfJobInfo, SfTasks } from '../../src/helpers/sf-tasks.js';
import { SfQuery } from '../../src/helpers/sf-query.js';
import { ApiKind, SfClient } from '../../src/helpers/sf-client.js';
import { RestAction } from '../../src/helpers/utils.js';
import Setup from './setup.js';

describe('SfJobInfo Tests', () => {
  it('Can Check if isDone', async function () {
    let jobInfo = new SfJobInfo();
    expect(jobInfo.isDone()).to.be.false;

    // return this.state === 'Aborted' || this.state === 'Completed' || this.state === 'Failed' || this.state === 'Closed';
    jobInfo.state = 'Aborted';
    expect(jobInfo.isDone()).to.be.true;

    jobInfo = new SfJobInfo();
    jobInfo.state = 'Completed';
    expect(jobInfo.isDone()).to.be.true;

    jobInfo = new SfJobInfo();
    jobInfo.state = 'Failed';
    expect(jobInfo.isDone()).to.be.true;

    jobInfo = new SfJobInfo();
    jobInfo.state = 'Closed';
    expect(jobInfo.isDone()).to.be.true;

    jobInfo = new SfJobInfo();
    jobInfo.state = 'Bogus';
    expect(jobInfo.isDone()).to.be.false;
  });
});
let org: Org = null;

const describeMetadatasTest = new Set<any>([
  {
    directoryName: 'installedPackages',
    inFolder: false,
    metaFile: false,
    suffix: 'installedPackage',
    xmlName: 'InstalledPackage',
    childXmlNames: [],
  },
  {
    childXmlNames: ['CustomLabel'],
    directoryName: 'labels',
    inFolder: false,
    metaFile: false,
    suffix: 'labels',
    xmlName: 'CustomLabels',
  },
  {
    directoryName: 'aura',
    inFolder: false,
    metaFile: false,
    xmlName: 'AuraDefinitionBundle',
    childXmlNames: [],
  },
  {
    directoryName: 'reports',
    inFolder: true,
    metaFile: false,
    suffix: 'report',
    xmlName: 'Report',
    childXmlNames: [],
  },
  {
    directoryName: 'email',
    inFolder: true,
    metaFile: true,
    suffix: 'email',
    xmlName: 'EmailTemplate',
    childXmlNames: [],
  },
]);

describe('Sf Tasks Tests', () => {
  before('Init', async function () {
    org = await Setup.org();
  });

  describe('describeMetadata Tests', () => {
    it('Can Handle Null', async function () {
      expect(await SfTasks.describeMetadata(null)).to.be.null;
    });
    it('Can describeMetadata', async function () {
      if (!org) {
        this.skip();
      }
      const results = await SfTasks.describeMetadata(org);

      expect(results).to.not.be.null;
      expect(results).to.be.instanceOf(Array);
      expect(results.length).to.be.greaterThan(0);
      expect(results[0].xmlName).to.not.be.null;
    }).timeout(0);
  });

  describe('listMetadata Tests', () => {
    it('Can Handle Null', async function () {
      const results = [];
      for await (const result of SfTasks.listMetadata(null, null)) {
        results.push(result);
      }
      expect(results.length).to.equal(0);
    });

    it('Can listMetadata', async function () {
      if (!org) {
        this.skip();
      }
      const results = [];
      for await (const result of SfTasks.listMetadata(org, 'CustomObject')) {
        results.push(result);
      }

      expect(results).to.not.be.null;
      expect(results).to.be.instanceOf(Array);
      expect(results.length).to.be.greaterThan(0);
      expect(results[0].xmlName).to.not.be.null;
    }).timeout(0);
  });

  describe('listMetadatas Tests', () => {
    it('Can Handle Null', async function () {
      expect(await SfTasks.listMetadatas(null, null)).to.be.null;
      expect(await SfTasks.listMetadatas(null, new Set<string>())).to.be.null;
    });

    it('Can listMetadatas', async function () {
      if (!org) {
        this.skip();
      }
      const typeName = 'CustomObject';
      const results = await SfTasks.listMetadatas(org, new Set<string>([typeName]));
      expect(results).to.not.be.null;
      expect(results.get(typeName)).to.not.be.null;
    }).timeout(0);
  });

  describe('describeObject Tests', () => {
    it('Can Handle Null', async function () {
      expect(await SfTasks.describeObject(null, null)).to.be.null;
      expect(await SfTasks.describeObject(null, '')).to.be.null;
    });

    it('Can describeObject', async function () {
      if (!org) {
        this.skip();
      }
      const name = 'Contact';
      const results = await SfTasks.describeObject(org, name);
      expect(results).to.not.be.null;
      expect(results.name).to.equal(name);
    }).timeout(0);
  });

  describe('enqueueApexTests Tests', () => {
    it('Can Handle Null', async function () {
      expect(await SfTasks.enqueueApexTests(null)).to.be.null;
    });

    it('Can enqueueApexTests for All', async function () {
      // this will eat up our async limits
      this.skip();

      if (!org) {
        this.skip();
      }
      const results = await SfTasks.enqueueApexTests(org, []);
      expect(results).to.not.be.null;
      expect(results.id).to.not.be.null;
      expect(results.id).to.not.be.undefined;
    }).timeout(0);

    it('Can enqueueApexTests and wait', async function () {
      if (!org) {
        this.skip();
      }

      const testClasses = await SfQuery.getApexTestClasses(org);
      expect(testClasses).to.not.be.null;
      if(testClasses.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('No Apex Tests exist in Org.');
        return;
      }
      const results = await SfTasks.enqueueApexTests(org, testClasses.slice(0, 1));
      if (results.isError) {
        // The DailyAsyncApexTests limit might have been reached
        if (results.code === 500) {
          this.skip();
        } else {
          results.throw();
        }
      }
      expect(results).to.not.be.null;
      expect(results.id).to.not.be.null;
      expect(results.id).to.not.be.undefined;

      for await (const recordCount of SfQuery.waitForApexTests(org, results.id)) {
        if (recordCount === 0) {
          break;
        }
      }
    }).timeout(0);
  });

  describe('getOrgInfo Tests', () => {
    it('Can Handle Null', async function () {
      expect(await SfTasks.getOrgInfo(null)).to.be.null;
    });
    it('Can getOrgInfo', async function () {
      if (!org) {
        this.skip();
      }
      const results = await SfTasks.getOrgInfo(org);
      expect(results.accessToken).to.not.be.null;
    }).timeout(0);
  });

  describe('getTypesForPackage Tests', () => {
    it('Can Handle Null', async function () {
      for await (const results of SfTasks.getTypesForPackage(null, null)) {
        expect(results).to.be.null;
        expect.fail();
      }
    });
    it('Can getTypesForPackage', async function () {
      if (!org) {
        this.skip();
      }
      for await (const results of SfTasks.getTypesForPackage(org, describeMetadatasTest)) {
        expect(results).to.not.be.null;
        expect(results.name).to.not.be.null;
      }
    }).timeout(0);
  });

  describe('getSourceTrackingStatus Tests', () => {
    it('Can Handle Null', () => {
      expect(SfTasks.getMapFromSourceTrackingStatus(null)).to.be.null;
    });
    it('Can Get Map', function () {
      const statuses = [
        {
          state: 'Remote Changed',
          fullName: 'Admin',
          type: 'Profile',
          filePath: 'force-app\\main\\default\\profiles\\Admin.profile-meta.xml',
        },
        {
          state: 'Remote Changed',
          fullName: 'Zip_Code__c-Zip Code Layout',
          type: 'Layout',
          filePath: 'force-app\\main\\default\\layouts\\Zip_Code__c-Zip Code Layout.layout-meta.xml',
        },
        {
          state: 'Remote Changed (Conflict)',
          fullName: 'Conflict Layout',
          type: 'Layout',
          filePath: 'force-app\\main\\default\\layouts\\Conflict Layout.layout-meta.xml',
        },
        {
          state: 'Remote Deleted',
          fullName: 'Zip_Code__c.My_Date__c',
          type: 'CustomField',
          filePath: 'force-app\\main\\default\\objects\\Zip_Code__c\\fields\\My_Date__c.field-meta.xml',
        },
      ];
      const results = SfTasks.getMapFromSourceTrackingStatus(statuses);
      const map = results.map;
      const deletes = results.deletes;
      const conflicts = results.conflicts;

      expect(map).to.not.be.null;
      expect(map).to.be.instanceOf(Map);
      expect(map.get('Profile')[0]).to.equal('Admin');

      expect(conflicts).to.be.instanceOf(Map);
      expect(conflicts.get('Layout')[0]).to.equal('Conflict Layout');

      expect(deletes).to.be.instanceOf(Map);
      expect(deletes.get('CustomField')[0]).to.equal('Zip_Code__c.My_Date__c');

      expect(map.get('Bogus')).to.be.undefined;
    });
  });

  describe('Config Tests', () => {
    it('Can Get Config Variable', async () => {
      const existingValue = await SfTasks.getMaxQueryLimit();
      expect(existingValue).to.not.be.null;
    }).timeout(0);

    it('Can Get getDefaultOrgAlias', async () => {
      const existingValue = await SfTasks.getDefaultOrgAlias();
      expect(existingValue).to.not.be.null;
    }).timeout(0);
  });

  describe('REST Tests', () => {
    it('Can getUnsupportedMetadataTypes', async () => {
      const types = await SfTasks.getUnsupportedMetadataTypes();
      expect(types).to.not.be.undefined;
      expect(types).to.not.be.null;
      expect(types.length).to.be.greaterThan(0);
    }).timeout(0);
  });

  describe('Org Connection Tests', () => {
    it('Can Handle Null', async () => {
      expect(await SfTasks.getConnection(null)).to.be.null;
    });
    it('Can connectToOrg', async function () {
      if (!Setup.username) {
        this.skip();
      }

      const results = await SfTasks.getConnection(Setup.username);
      expect(results).to.not.be.null;
      expect(results.getUsername()).to.not.be.null;
    }).timeout(0);
  });

  describe('waitForJob Tests', () => {
    it('Can Handle Null', async function () {
      expect(await SfTasks.getBulkJobStatus(null, null)).to.be.null;

      for await (const results of SfTasks.waitForJob(null, null)) {
        expect(results).to.be.null;
      }

      const jobInfo = new SfJobInfo();
      for await (const results of SfTasks.waitForJob(null, jobInfo)) {
        expect(results).to.be.null;
      }
    });

    it('Can waitForJob', async function () {
      if (!org) {
        this.skip();
      }

      const body = {
        operation: 'query',
        query: 'SELECT Id FROM Contact',
      };

      const client = new SfClient(org);
      const uri = await client.getBaseUri(ApiKind.BULK_QUERY);
      const results = await client.doAction(RestAction.POST, uri, body);

      const jobInfo = new SfJobInfo();
      jobInfo.id = results.body;
      jobInfo.jobKind = ApiKind.BULK_QUERY;
      expect(jobInfo.id).to.not.be.null;

      let counter = 0;
      for await (const status of SfTasks.waitForJob(org, jobInfo, 1, 500)) {
        expect(status).to.not.be.null;
        expect(status.id).to.not.be.null;
        expect(status.batchId).to.not.be.null;
        expect(status.createdDate).to.not.be.null;
        counter++;
        break;
      }
      if (counter === 0) {
        expect.fail('waitForJob returned nothing for job: ' + JSON.stringify(jobInfo));
      }
    }).timeout(0);

    describe('executeAnonymousBlock Tests', () => {
      it('Can Handle Null', async function () {
        expect(await SfTasks.executeAnonymousBlock(null, null)).to.be.null;
      });

      it('Can executeAnonymousBlock', async function () {
        if (!org) {
          this.skip();
        }

        const apex = `System.debug('executeAnonymousBlock Test Line 1');System.debug('executeAnonymousBlock Test Line 2');`;
        const results = await SfTasks.executeAnonymousBlock(org, apex);
        expect(results.isError).to.be.false;
        expect(results.body.compiled).to.be.true;
        expect(results.body.success).to.be.true;
      }).timeout(0);

      it('Can executeAnonymousBlock and return error', async function () {
        if (!org) {
          this.skip();
        }

        const apex = 'executeAnonymousBlock Test Line 1';
        const results = await SfTasks.executeAnonymousBlock(org, apex);
        expect(results.isError).to.be.true;
        expect(results.body.compiled).to.be.false;
        expect(results.body.success).to.be.false;
      }).timeout(0);
    });

    describe('getOrgLimits Tests', () => {
      it('Can Handle Null', async function () {
        expect(await SfTasks.getOrgLimits(null)).to.be.null;
      });

      it('Can getOrgLimits', async function () {
        if (!org) {
          this.skip();
        }

        const results = await SfTasks.getOrgLimits(org);
        expect(results.isError).to.be.false;
        expect(results.body.DailyApiRequests).to.not.be.null;
        expect(results.body.DailyApiRequests.Max).to.not.be.null;
        expect(results.body.DailyApiRequests.Remaining).to.not.be.null;
      }).timeout(0);
    });
  });
});
