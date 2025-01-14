import { expect } from 'chai';
import { SfCore } from '../../src/helpers/sf-core.js';
import Utils from '../../src/helpers/utils.js';

describe('Sf Core Tests', () => {
  describe('getPackageBase Tests', () => {
    it('Is Not Null', async () => {
      const testPackage = await SfCore.getPackageBase();
      expect(testPackage).is.not.null;
    });
    it('Has Package', async () => {
      const testPackage = await SfCore.getPackageBase();
      expect(testPackage.Package);
    });
    it('Has Package.types', async () => {
      const testPackage = await SfCore.getPackageBase();
      expect(testPackage.Package.types);
      expect(testPackage.Package.types.length).equals(0);
    });
    it('Has Package.version', async () => {
      const testPackage = await SfCore.getPackageBase();
      expect(testPackage.Package.version);
      expect(testPackage.Package.version.length).greaterThan(0);
    });
  });

  describe('createPackage Tests', () => {
    let packMap: Map<string, string[]>;
    before(() => {
      packMap = new Map<string, string[]>();
      packMap.set('t1', ['t1m1', 't1m2', 't1m3', 't1m4']);
      packMap.set('t2', ['t2m1', 't2m2', 't2m3', 't2m4']);
    });
    it('Is Not Null', () => {
      expect(SfCore.createPackage(packMap)).is.not.null;
    });
    it('Has Package', async () => {
      const testPackage = await SfCore.createPackage(packMap);
      expect(testPackage.Package);
    });
    it('Has Package.types', async () => {
      const pack = await SfCore.createPackage(packMap);
      expect(pack.Package.types);
      expect(pack.Package.types.length).equals(2);
    });
    it('Has Package.type.members', async () => {
      const pack = await SfCore.createPackage(packMap);
      expect(pack.Package.types);
      for (const type of pack.Package.types) {
        expect(type.members.length).equals(4);
      }
    });
    it('Has Package.version', async () => {
      const pack = await SfCore.createPackage(packMap);
      expect(pack.Package.version);
      expect(pack.Package.version.length).greaterThan(0);
    });
  });

  describe('minifyPackage Tests', () => {
    it('Is Not Null', () => {
      const testPackage = null;
      expect(SfCore.minifyPackage(testPackage)).is.null;
    });
    it('Removes empty types', async () => {
      const packageObj = await SfCore.getPackageBase();
      packageObj.Package.types.push({
        name: ['ApexClass'],
        members: [],
      });
      packageObj.Package.types.push({
        name: ['CustomObject'],
        members: ['MyObject__c', ''],
      });
      packageObj.Package.types.push({
        name: ['Something'],
        members: ['', null, undefined],
      });
      const minPackage = SfCore.minifyPackage(packageObj);

      expect(minPackage).is.not.null;
      expect(minPackage.Package).is.not.null;
      expect(minPackage.Package.types).is.not.null;
      expect(minPackage.Package.types.length).equals(1);
      expect(minPackage.Package.types[0].name[0]).equals('CustomObject');
      expect(minPackage.Package.types[0].members.length).equals(1);
    });
  });

  describe('writePackageFile Tests', () => {
    let packMap: Map<string, string[]>;
    const packageFilePath = './test/writePackageFileText.xml';
    before(() => {
      packMap = new Map<string, string[]>();
      packMap.set('t1', ['t1m1', 't1m2', 't1m3', 't1m4']);
      packMap.set('t2', ['t2m1', 't2m2', 't2m3', 't2m4']);
    });
    after(async () => {
      await Utils.deleteFile(packageFilePath);
    });
    it('Writes Package', async () => {
      expect(await SfCore.writePackageFile(packMap, packageFilePath, false)).is.not.null;
    });
    it('Writes & Appends Package', async () => {
      expect(await SfCore.writePackageFile(packMap, packageFilePath, true)).is.not.null;
    });
  });
});
