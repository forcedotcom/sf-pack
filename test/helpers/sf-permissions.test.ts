import path from 'node:path';
import { expect } from 'chai';
import { before } from 'mocha';
import Utils from '../../src/helpers/utils.js';
import {
  FieldDetail,
  ObjectDetail,
  PermissionSet,
  FieldPermission,
  ClassPermission,
  UserPermission,
  PagePermission,
  LayoutAssignment,
  RecordTypePermission,
  ApplicationPermission,
  TabPermission,
  ObjectPermission,
  SfPermission,
} from '../../src/helpers/sf-permission.js';
import Setup from './setup.js';

const profileMetadataFilePath = path.join(Setup.testFilesPath, 'force-app/main/default/profiles/sample.profile-meta.xml');
const permissionSetMetadataFilePath = path.join(Setup.testFilesPath, 'force-app/main/default/permissionsets/sample.permissionset-meta.xml');
const objectMetadataFilePath = path.join(Setup.testFilesPath, 'force-app/main/default/objects/Asset/Asset.object-meta.xml');
const fieldMetadataFilePath = path.join(Setup.testFilesPath, 'force-app/main/default/objects/Address__c/fields/Zip__c.field-meta.xml');

let testName = '';
describe('Sf Permission Tests', () => {
  before(async () => {
    const exists = await Utils.pathExists(path.resolve(profileMetadataFilePath));
    expect(exists).to.be.true;
  });
  testName = 'SfPermission';
  describe(testName + ' Tests', () => {
    it(testName + ' has arrays', () => {
      for (const item of SfPermission.defaultPermissionMetaTypes) {
        expect(item).to.not.be.null;
      }

      for (const item of SfPermission.permissionSetMetaTypes) {
        expect(item).to.not.be.null;
      }
    });
  });

  describe('Can read Metadata', () => {
    it('Can Handle Null', () => {
      let permissionSet = PermissionSet.fromJson(null, null);
      expect(permissionSet).is.null;

      permissionSet = PermissionSet.fromJson(null, {});
      expect(permissionSet).is.null;

      permissionSet = PermissionSet.fromJson('', {});
      expect(permissionSet).is.null;

      permissionSet = PermissionSet.fromJson(permissionSetMetadataFilePath, null);
      expect(permissionSet).is.null;
    });
    it('Can Load Profile Metadata', async () => {
      const profileJson = await Utils.readObjectFromXmlFile(profileMetadataFilePath);
      expect(profileJson).to.not.be.null;

      const permissionSet = PermissionSet.fromJson(permissionSetMetadataFilePath, profileJson);
      expect(permissionSet).is.not.null;
      expect(permissionSet.name).is.not.null;
      expect(permissionSetMetadataFilePath.includes(permissionSet.name)).to.be.true;
    });
    it('Can Load PermissionSet Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permissionSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      expect(permissionSet).is.not.null;
      expect(permissionSet.name).is.not.null;
      expect(permissionSetMetadataFilePath.includes(permissionSet.name)).to.be.true;

      const obj = permissionSet.toObj();
      expect(obj).is.not.null;

      for (const value of SfPermission.permissionSetMetaTypes) {
        const permColl = permissionSet.getPermissionCollection(value);
        expect(permColl).is.not.null;
      }

      const permColl = permissionSet.getPermissionCollection('bogus');
      expect(permColl).is.null;
    });
  });
  describe('Can read Object Metadata', () => {
    it('Can Handle Null', () => {
      let objectDetail = ObjectDetail.fromJson(null, null);
      expect(objectDetail).is.null;

      objectDetail = ObjectDetail.fromJson(null, {});
      expect(objectDetail).is.null;

      objectDetail = ObjectDetail.fromJson('', {});
      expect(objectDetail).is.null;

      objectDetail = ObjectDetail.fromJson(objectMetadataFilePath, null);
      expect(objectDetail).is.null;

      const obj = new ObjectDetail().toObj();
      expect(obj.CustomObject.label).equal(undefined);
    });
    it('Can Load Metadata', async () => {
      const objectJson = await Utils.readObjectFromXmlFile(objectMetadataFilePath);
      expect(objectJson).to.not.be.null;

      const objectDetail = ObjectDetail.fromJson(objectMetadataFilePath, objectJson);
      expect(objectDetail).is.not.null;
      expect(objectDetail.name).is.not.null;
      expect(objectMetadataFilePath.includes(objectDetail.name)).to.be.true;

      const obj = objectDetail.toObj();
      expect(obj.CustomObject.label).equal(objectDetail.label);
    });
  });
  describe('Can read Field Metadata', () => {
    it('Can Handle Null', () => {
      let fieldDetail = FieldDetail.fromJson(null, null);
      expect(fieldDetail).is.null;

      fieldDetail = FieldDetail.fromJson(null, {});
      expect(fieldDetail).is.null;

      fieldDetail = FieldDetail.fromJson('', {});
      expect(fieldDetail).is.null;

      fieldDetail = FieldDetail.fromJson(fieldMetadataFilePath, null);
      expect(fieldDetail).is.null;
    });
    it('Can Load Metadata', async () => {
      const fieldJson = await Utils.readObjectFromXmlFile(fieldMetadataFilePath);
      expect(fieldJson).to.not.be.null;

      const fieldDetail = FieldDetail.fromJson(fieldMetadataFilePath, fieldJson);
      expect(fieldDetail).is.not.null;
      expect(fieldDetail.name).is.not.null;
      expect(fieldMetadataFilePath.includes(fieldDetail.name.split('.')[1])).to.be.true;

      const obj = fieldDetail.toObj();
      expect(obj.CustomField.label).equal(fieldDetail.label);
    });
  });

  testName = 'FieldPermission';
  describe(testName + ' Tests', () => {
    it(testName + ' can Handle Null', () => {
      let perm = FieldPermission.fromJson(null);
      expect(perm).is.null;

      perm = FieldPermission.fromJson({});
      expect(perm).is.not.null;
      expect(perm.name).is.undefined;
    });
    it(testName + ' can Load Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      for (const [key, perm] of permSet.fieldPermissions) {
        expect(key).is.not.null;
        expect(perm.toObj()).is.not.null;
        expect(perm.toString()).is.not.null;
        expect(SfPermission.getPermissionString(perm)).is.not.null;
        break;
      }
    });
  });

  testName = 'ClassPermission';
  describe(testName + ' Tests', () => {
    it(testName + ' can Handle Null', () => {
      let perm = ClassPermission.fromJson(null);
      expect(perm).is.null;

      perm = ClassPermission.fromJson({});
      expect(perm).is.not.null;
      expect(perm.name).is.undefined;
    });
    it(testName + ' can Load Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      for (const [key, perm] of permSet.classAccesses) {
        expect(key).is.not.null;
        expect(perm.toObj()).is.not.null;
        expect(perm.toString()).is.not.null;
        expect(SfPermission.getPermissionString(perm)).is.not.null;
        break;
      }
    });
  });

  testName = 'UserPermission';
  describe(testName + ' Tests', () => {
    it(testName + ' can Handle Null', () => {
      let perm = UserPermission.fromJson(null);
      expect(perm).is.null;

      perm = UserPermission.fromJson({});
      expect(perm).is.not.null;
      expect(perm.name).is.undefined;
    });
    it(testName + ' can Load Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      for (const [key, perm] of permSet.userPermissions) {
        expect(key).is.not.null;
        expect(perm.toObj()).is.not.null;
        expect(perm.toString()).is.not.null;
        expect(SfPermission.getPermissionString(perm)).is.not.null;
        break;
      }
    });
  });

  testName = 'PagePermission';
  describe(testName + ' Tests', () => {
    it(testName + ' can Handle Null', () => {
      let perm = PagePermission.fromJson(null);
      expect(perm).is.null;

      perm = PagePermission.fromJson({});
      expect(perm).is.not.null;
      expect(perm.name).is.undefined;
    });
    it(testName + ' can Load Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      for (const [key, perm] of permSet.pageAccesses) {
        expect(key).is.not.null;
        expect(perm.toObj()).is.not.null;
        expect(perm.toString()).is.not.null;
        expect(SfPermission.getPermissionString(perm)).is.not.null;
        break;
      }
    });
  });

  testName = 'LayoutAssignment';
  describe(testName + ' Tests', () => {
    it(testName + ' can Handle Null', () => {
      let perm = LayoutAssignment.fromJson(null);
      expect(perm).is.null;

      perm = LayoutAssignment.fromJson({});
      expect(perm).is.not.null;
      expect(perm.name).is.undefined;
    });
    it(testName + ' can Load Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      for (const [key, perm] of permSet.layoutAssignments) {
        expect(key).is.not.null;
        expect(perm.toObj()).is.not.null;
        expect(perm.toString()).is.not.null;
        expect(SfPermission.getPermissionString(perm)).is.not.null;
        break;
      }
    });
  });

  testName = 'RecordTypePermission';
  describe(testName + ' Tests', () => {
    it(testName + ' can Handle Null', () => {
      let perm = RecordTypePermission.fromJson(null);
      expect(perm).is.null;

      perm = RecordTypePermission.fromJson({});
      expect(perm).is.not.null;
      expect(perm.name).is.undefined;
    });
    it(testName + ' can Load Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      for (const [key, perm] of permSet.recordTypeVisibilities) {
        expect(key).is.not.null;
        expect(perm.toObj()).is.not.null;
        expect(perm.toString()).is.not.null;
        expect(SfPermission.getPermissionString(perm)).is.not.null;
        break;
      }
    });
  });

  testName = 'ApplicationPermission';
  describe(testName + ' Tests', () => {
    it(testName + ' can Handle Null', () => {
      let perm = ApplicationPermission.fromJson(null);
      expect(perm).is.null;

      perm = ApplicationPermission.fromJson({});
      expect(perm).is.not.null;
      expect(perm.name).is.undefined;
    });
    it(testName + ' can Load Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      for (const [key, perm] of permSet.applicationVisibilities) {
        expect(key).is.not.null;
        expect(perm.toObj()).is.not.null;
        expect(perm.toString()).is.not.null;
        expect(SfPermission.getPermissionString(perm)).is.not.null;
        break;
      }
    });
  });

  testName = 'TabPermission';
  describe(testName + ' Tests', () => {
    it(testName + ' can Handle Null', () => {
      let perm = TabPermission.fromJson(null);
      expect(perm).is.null;

      perm = TabPermission.fromJson({});
      expect(perm).is.not.null;
      expect(perm.name).is.undefined;
    });
    it(testName + ' can Load Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      for (const [key, perm] of permSet.tabVisibilities) {
        expect(key).is.not.null;
        expect(perm.toObj()).is.not.null;
        expect(perm.toString()).is.not.null;
        expect(SfPermission.getPermissionString(perm)).is.not.null;
      }
    });
  });

  testName = 'ObjectPermission';
  describe(testName + ' Tests', () => {
    it(testName + ' can Handle Null', () => {
      let perm = ObjectPermission.fromJson(null);
      expect(perm).is.null;

      perm = ObjectPermission.fromJson({});
      expect(perm).is.not.null;
      expect(perm.name).is.undefined;
    });
    it(testName + ' can Load Metadata', async () => {
      const permissionSetJson = await Utils.readObjectFromXmlFile(permissionSetMetadataFilePath);
      expect(permissionSetJson).to.not.be.null;

      const permSet = PermissionSet.fromJson(permissionSetMetadataFilePath, permissionSetJson);
      for (const [key, perm] of permSet.objectPermissions) {
        expect(key).is.not.null;
        expect(perm.toObj()).is.not.null;
        expect(perm.toString()).is.not.null;
        expect(SfPermission.getPermissionString(perm)).is.not.null;
      }
    });
  });
});
