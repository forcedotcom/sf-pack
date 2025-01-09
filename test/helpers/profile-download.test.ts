import path = require('path');
import { expect } from '@oclif/test';
// import { UX } from '@salesforce/command';
import Utils from '../../src/helpers/utils';
import { ProfileDownload, ObjPermissionStructure, FieldPermissionStructure } from '../../src/helpers/profile-download';
import Setup from './setup';

const profileJson = {
  fullName: 'Admin',
  objectPermissions: [
    {
      allowCreate: true,
      allowDelete: true,
      allowEdit: true,
      allowRead: true,
      modifyAllRecords: true,
      object: 'Account',
      viewAllRecords: true,
    },
  ],
  fieldPermissions: [
    {
      editable: false,
      field: 'Account.AccountNumber',
      readable: false,
    },
  ],
  custom: true,
  userLicense: 'Salesforce',
};

const objectPermissionFromQuery = [
  new ObjPermissionStructure({
    PermissionsCreate: true,
    PermissionsDelete: true,
    PermissionsEdit: true,
    PermissionsModifyAllRecords: true,
    PermissionsRead: true,
    PermissionsViewAllRecords: true,
    SObjectType: 'Company__c',
  }),
];

const fieldPermissionsFromQuery = [
  new FieldPermissionStructure({
    Field: 'Company__c.Name__c',
    PermissionsEdit: true,
    PermissionsRead: true,
  }),
];

describe('Profile Command Tests', () => {
  describe('Get Org Profiles Tests', () => {
    it('Can Handle Nulls', async function () {
      const org = await Setup.org();
      if (!org) {
        this.skip();
      }
      const orgProfiles = await ProfileDownload.checkOrgProfiles(org);
      expect(orgProfiles).is.not.null;
    });

    it('Can construct', async function () {
      const org = await Setup.org();
      const inst = new ProfileDownload(org, [], new Map<string, string>(), 'rootDir');
      expect(inst).is.not.null;
    });
  });

  describe('Missing Objects', () => {
    it('Process missing Objects', () => {
      const getObjectPermissions = ProfileDownload.processMissingObjectPermissions(objectPermissionFromQuery, [
        'Account',
      ]);
      expect(getObjectPermissions).to.include.keys('Company__c');
    });
  });

  describe('Missing Fields', () => {
    it('Process missing Fields', () => {
      const getFieldPermissions = ProfileDownload.processMissingFieldPermissions(fieldPermissionsFromQuery);
      expect(getFieldPermissions).to.be.an('array');
    });
  });

  describe('Write to XML files', () => {
    it(' Write to XML and store file', async () => {
      await ProfileDownload.writeProfileToXML(profileJson, path.join(process.cwd(), 'temp'));
      const readData = await Utils.readObjectFromXmlFile(path.join(process.cwd(), 'temp'));
      expect(readData).is.not.null;
      await Utils.deleteFile(path.join(process.cwd(), 'temp'));
    });
  });
  describe('Download Permissions', () => {
    it(' Download Permission', async function() {
      const org = await Setup.org();
      if(!org) {
        this.skip();
      }
      const tempPath = path.join(process.cwd(), Utils.tempFilesPath);
      const orgAllProfilesMap = await ProfileDownload.checkOrgProfiles(org);
      const profileDownloader = new ProfileDownload(org, ['Admin'], orgAllProfilesMap, tempPath);
      const permissions = await profileDownloader.downloadPermissions();
      expect(permissions).is.not.null;
      await Utils.deleteDirectory(tempPath);
    }).timeout(0);
  });
});
