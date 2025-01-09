import { expect } from '@oclif/test';
import { before } from 'mocha';
import { Record } from 'jsforce';
import Utils from '../../src/helpers/utils';
import { SfQuery } from '../../src/helpers/sf-query';
import { SfClient, ApiKind } from '../../src/helpers/sf-client';
import { RestAction } from '../../src/helpers/utils';
import Setup from '../helpers/setup';

const unknownId = '00000000001';
const NOT_FOUND = '(404) "Not Found"';

let sfClient: SfClient;
enum ApiTestKind {
  DEFAULT = 'Account',
  USER = 'User',
  TOOLING = 'ApexCodeCoverageAggregate',
  UNKNOWN = 'Bogus',
  FILE = 'ContentVersion',
}

const testData = new Map<ApiTestKind, Record[]>();
describe('Sf Client Tests', () => {
  before('Init', async function () {
    const org = await Setup.org();
    if (!org) {
      return;
    }
    this.timeout(0);
    /* eslint-disable-next-line no-console */
    console.log('Getting Test Data....');
    sfClient = new SfClient(org);
    let dataErr: Error = null;
    const getData = async (): Promise<void> => {
      try {
        let query = `SELECT Id, Name, Description FROM ${ApiTestKind.DEFAULT.toString()} LIMIT 5`;
        testData.set(ApiTestKind.DEFAULT, await SfQuery.queryOrg(org, query));
        /* eslint-disable-next-line no-console */
        console.log(`Got ${ApiTestKind.DEFAULT.toString()} Test Data.`);

        query = `SELECT Id FROM ${ApiTestKind.TOOLING.toString()} LIMIT 5`;
        testData.set(ApiTestKind.TOOLING, await SfQuery.queryOrg(org, query, true));
        /* eslint-disable-next-line no-console */
        console.log(`Got ${ApiTestKind.TOOLING.toString()} Test Data.`);

        query = `SELECT Id, Username, FirstName, Email FROM ${ApiTestKind.USER.toString()} LIMIT 5`;
        testData.set(ApiTestKind.USER, await SfQuery.queryOrg(org, query));
        /* eslint-disable-next-line no-console */
        console.log(`Got ${ApiTestKind.USER.toString()} Test Data.`);

        query = `SELECT Id, VersionData FROM ${ApiTestKind.FILE.toString()} ORDER BY CreatedDate DESC LIMIT 5`;
        testData.set(ApiTestKind.FILE, await SfQuery.queryOrg(org, query));
        /* eslint-disable-next-line no-console */
        console.log(`Got ${ApiTestKind.FILE.toString()} Test Data.`);
      } catch (err) {
        if (err.name === 'NoOrgFound') {
          /* eslint-disable-next-line no-console */
          console.warn(`Invalid OrgAlias: '${org.getUsername()}'. SfClient tests will be skipped.`);
          sfClient = null;
          return;
        }
        dataErr = err;
      }
    };
    await getData();
    if (dataErr) {
      /* eslint-disable-next-line no-console */
      console.log(`Error: ${dataErr.message}`);
      throw dataErr;
    }
    /* eslint-disable-next-line no-console */
    console.log('Got Test Data.');
  });

  describe('Rest Client Tests', () => {
    describe('do Tests', () => {
      it('Can Handle Nulls', async function() {
        try {
          new SfClient(null);
          expect.fail();
        }catch (err) {
          expect(err.message).to.equal('org is required');
        }
      });
      it('Can set API Version', async function() {
        if(!sfClient) {
          this.skip();
        }
        const client = new SfClient(await Setup.org());
        client.setApiVersion(55.5);
      });
      it('Can GET Scehma', async function() {
        if(!sfClient) {
          this.skip();
        }
        for await (const result of sfClient.getMetadataSchemas()) {
          expect(result).to.not.be.undefined;
          expect(result.name).to.not.be.undefined;
        }
      });
      it('Can GET Max API', async function() {
        if(!sfClient) {
          this.skip();
        }
        const result = await sfClient.getMaxApiVersion();
        expect(result).to.not.be.undefined;
      });
      it('Can GET Default Scehma Handle Nulls', async function() {
        if(!sfClient) {
          this.skip();
        }
        try {
          await sfClient.getMetadataSchema(null);
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('metadataType parameter is required.');
        }
      });
      it('Can GET Default Scehma', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.DEFAULT.toString();
        const result = (await sfClient.getMetadataSchema(metaDataType)).getContent();
        expect(result).to.not.be.undefined;
        expect(result.objectDescribe).to.not.be.undefined;
        expect(result.objectDescribe.name).to.equal(metaDataType);
      });
      it('Can GET Tooling Scehma', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.TOOLING.toString();
        const result = (await sfClient.getMetadataSchema(metaDataType, ApiKind.TOOLING)).getContent();
        expect(result).to.not.be.undefined;
        expect(result.objectDescribe).to.not.be.undefined;
        expect(result.objectDescribe.name).to.equal(metaDataType);
      });
      it('Can getById Handle Nulls', async function() {
        if(!sfClient) {
          this.skip();
        }
        try {
          await sfClient.getById(null, null);
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('metadataType parameter is required.');
        }
        try {
          await sfClient.getById(ApiTestKind.TOOLING.toString(), null);
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('id parameter is required.');
        }
      });
      it('Can getByIds Handle Nulls', async function() {
        if(!sfClient) {
          this.skip();
        }
        try {
          for await (const result of sfClient.getByIds(null, null)) {
            expect(result).to.be.undefined;
            expect.fail();
          }
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('metadataType parameter is required.');
        }
        const metaDataType = ApiTestKind.TOOLING.toString();
        try {
          for await (const result of sfClient.getByIds(metaDataType, null)) {
            expect(result).to.be.undefined;
            expect.fail();
          }
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('ids parameter is required.');
        }
      });
      it('Can Handle 404 (Default Schema)', async function() {
        if(!sfClient) {
          this.skip();
        }
        const unknownMetaDataType = ApiTestKind.UNKNOWN.toString();
        try {
          (await sfClient.getMetadataSchema(unknownMetaDataType)).getContent();
        } catch (err) {
          expect(err.message).to.contain(NOT_FOUND);
        }
      });
      it('Can Handle 404 (Default Record)', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.DEFAULT.toString();
        try {
          (await sfClient.getById(metaDataType, unknownId)).getContent();
        } catch (err) {
          expect(err.message).to.contain(NOT_FOUND);
        }
      });
      it('Can Handle 404 (Tooling Schema)', async function() {
        if(!sfClient) {
          this.skip();
        }
        const unknownMetaDataType = ApiTestKind.UNKNOWN.toString();
        try {
          (await sfClient.getMetadataSchema(unknownMetaDataType, ApiKind.TOOLING)).getContent();
        } catch (err) {
          expect(err.message).to.contain(NOT_FOUND);
        }
      });
      it('Can Handle 404 (Tooling Record)', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.DEFAULT.toString();
        try {
          (await sfClient.getById(metaDataType, unknownId, ApiKind.TOOLING)).getContent();
        } catch (err) {
          expect(err.message).to.contain(NOT_FOUND);
        }
      });
      it('Can get Tooling Instance', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.TOOLING.toString();
        const ids = Utils.getFieldValues(testData.get(ApiTestKind.TOOLING), 'Id', true);
        for (const id of ids) {
          const result = (await sfClient.getById(metaDataType, id, ApiKind.TOOLING)).getContent();
          expect(result).to.not.be.null;
          expect(result.Id).to.equal(id);
        }
      });
      it('Can get Tooling Instances', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.TOOLING.toString();
        const ids = Utils.getFieldValues(testData.get(ApiTestKind.TOOLING), 'Id', true);
        let counter = 0;
        for await (const result of sfClient.getByIds(metaDataType, ids, ApiKind.TOOLING)) {
          const content = result.getContent();
          expect(content).to.not.be.null;
          expect(content.Id).to.equal(ids[counter++]);
        }
      });
      it('Can get Default Instance', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.DEFAULT.toString();
        const ids = Utils.getFieldValues(testData.get(ApiTestKind.DEFAULT), 'Id', true);
        for (const id of ids) {
          const result = (await sfClient.getById(metaDataType, id)).getContent();
          expect(result).to.not.be.null;
          expect(result.Id).to.equal(id);
        }
      });
      it('Can get VersionData from ContentVersion', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.FILE.toString();
        const ids = Utils.getFieldValues(testData.get(ApiTestKind.FILE), 'Id', true);
        for (const id of ids) {
          const result = await sfClient.getById(metaDataType + '.VersionData', id);
          expect(result).to.not.be.null;
          expect(result.id).to.equal(id);
          expect(result.id).to.equal(id);
          expect(result.isBinary).to.be.true;
          const bytes = result.getContent();
          expect(bytes instanceof Buffer).to.be.true;
        }
      }).timeout(0);
      it('Can get Default Instances', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.DEFAULT.toString();
        const ids = Utils.getFieldValues(testData.get(ApiTestKind.DEFAULT), 'Id', true);
        let counter = 0;
        for await (const result of sfClient.getByIds(metaDataType, ids)) {
          const content = result.getContent();
          expect(content).to.not.be.null;
          expect(content.Id).to.equal(ids[counter++]);
        }
      });
      it('Can update Default Instance', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.DEFAULT.toString();
        const desc = new Date().toJSON();
        for (const record of testData.get(ApiTestKind.DEFAULT)) {
          const result = (
            await sfClient.updateByRecord(metaDataType, { Id: record.Id, Description: desc }, 'Id')
          ).getContent();
          expect(result).to.not.be.null;
          expect(result).to.equal(record.Id);
        }
      });
      it('Can update composite', async function() {
        if(!sfClient) {
          this.skip();
        }
        const desc = new Date().toJSON();

        const patchObj = {
          allOrNone: false,
          records: [],
        };

        for (const record of testData.get(ApiTestKind.DEFAULT)) {
          patchObj.records.push({
            attributes: { type: ApiTestKind.DEFAULT.toString() },
            id: record.Id,
            Description: desc,
          });
        }

        const results = (await sfClient.doComposite(RestAction.PATCH, patchObj)).getContent();
        for (const result of results) {
          if (result.errors && result.errors.length > 0) {
            expect.fail(JSON.stringify(result.errors));
          }
          expect(result.success).to.be.true;
        }
      });
      it('Can updateByRecord handle nulls', async function() {
        if(!sfClient) {
          this.skip();
        }
        try {
          await sfClient.updateByRecord(null, null);
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('metadataType parameter is required.');
        }
        const metaDataType = ApiTestKind.DEFAULT.toString();
        try {
          await sfClient.updateByRecord(metaDataType, null);
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('record parameter is required.');
        }
      });
      it('Can getByRecords handle nulls', async function() {
        if(!sfClient) {
          this.skip();
        }
        try {
          for await (const result of sfClient.getByRecords(null, null)) {
            expect(result).to.be.undefined;
            expect.fail();
          }
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('metadataType parameter is required.');
        }
        const metaDataType = ApiTestKind.TOOLING.toString();
        try {
          for await (const result of sfClient.getByRecords(metaDataType, null)) {
            expect(result).to.be.undefined;
            expect.fail();
          }
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('records parameter is required.');
        }
      }).timeout(0);
      it('Can getByRecords', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.DEFAULT.toString();
        const records = [];
        for (const record of testData.get(ApiTestKind.DEFAULT)) {
          records.push({
            attributes: { type: ApiTestKind.DEFAULT.toString() },
            id: record.Id,
            Description: 'test',
          });
        }
        for await (const result of sfClient.getByRecords(metaDataType, records)) {
          expect(result).to.not.be.null;
        }
      });
      it('Can updateByRecords handle nulls', async function() {
        if(!sfClient) {
          this.skip();
        }
        try {
          for await (const result of sfClient.updateByRecords(null, null)) {
            expect(result).to.be.undefined;
            expect.fail();
          }
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('metadataType parameter is required.');
        }
        const metaDataType = ApiTestKind.TOOLING.toString();
        try {
          for await (const result of sfClient.updateByRecords(metaDataType, null)) {
            expect(result).to.be.undefined;
            expect.fail();
          }
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('records parameter is required.');
        }
      });
      it('Can updateByRecords', async function() {
        if(!sfClient) {
          this.skip();
        }
        const metaDataType = ApiTestKind.DEFAULT.toString();
        const records = [];
        for (const record of testData.get(ApiTestKind.DEFAULT)) {
          records.push({
            attributes: { type: ApiTestKind.DEFAULT.toString() },
            id: record.Id,
            Description: 'test2',
          });
          break;
        }
        for await (const result2 of sfClient.updateByRecords(metaDataType, records)) {
          expect(result2).to.not.be.null;
        }
      }).timeout(0);
      it('Can postObjectMultipart handle nulls', async function() {
        if(!sfClient) {
          this.skip();
        }
       
        try {
          await sfClient.postObjectMultipart(null, null, null, null);
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('objectName parameter is required.');
        }

        try {
          await sfClient.postObjectMultipart('objectName', null, null, null);
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('objectRecord parameter is required.');
        }

        try {
          await sfClient.postObjectMultipart('objectName', 'objectRecord', null, null);
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('fileName parameter is required.');
        }
        try {
          await sfClient.postObjectMultipart('objectName', 'objectRecord', 'fileName', null);
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('filePath parameter is required.');
        }
      });
      it('Can postObjectMultipart', async function() {
        if(!sfClient) {
          this.skip();
        }
        const record = {
          PathOnClient: 'records.csv',
          ContentBody: ''
        };
        const results = await sfClient.postObjectMultipart('ContentVersion', record, 'records.csv', './test/records.csv');
        expect(results).to.not.be.null;
        
      }).timeout(0);
      it('Can do Handle Nulls', async function() {
        if(!sfClient) {
          this.skip();
        }
        try {
          for await (const result of sfClient.do(null, null)) {
            expect(result).to.be.undefined;
            expect.fail();
          }
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('action parameter is required.');
        }
        try {
          for await (const result of sfClient.do(RestAction.GET, null)) {
            expect(result).to.be.undefined;
            expect.fail();
          }
          expect.fail();
        }catch(err){
          expect(err.message).to.equal('metadataType parameter is required.');
        }
      });
      it('Can do', async function() {
        if(!sfClient) {
          this.skip();
        }
        const records = [{
          id: testData.get(ApiTestKind.DEFAULT)[0].Id 
        }];
        
        for await (const result of sfClient.do(RestAction.GET, 'Account', records, 'id', ApiKind.DEFAULT,[200])) {
          expect(result).to.not.be.undefined;
        }

      });
    });
  });
}).timeout(0);
