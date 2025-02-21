import { expect } from 'chai';
import { Field } from '@jsforce/jsforce-node';
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

  describe('generateValue Tests', () => {
    const createField = (type: string) => {
      return ({
        name: 'test_field_name__c',
        length: 50,
        type
      } as Field);
    };
    it('Can Handle Null', () => {
      expect(SfCore.generateValue(null)).is.null;
    });
    it('Can Handle Undefined', () => {
      expect(SfCore.generateValue(undefined)).is.undefined;
    });
    
    it('Can Create string-like', () => {
      let typeName = 'string';
      let field = createField(typeName);
      let value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal(field.type, `failed to create: ${typeName}`);
      expect(value.length).to.be.lessThanOrEqual(field.length);

      typeName = 'anytype';
      field = createField(typeName);
      value = SfCore.generateValue(field);
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName}`);
      expect(value.length).to.be.lessThanOrEqual(field.length);

      typeName = 'encryptedString';
      field = createField(typeName);
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName}`);
      expect(value.length).to.be.lessThanOrEqual(field.length);

      typeName = 'textarea';
      field = createField(typeName);
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName}`);
      expect(value.length).to.be.lessThanOrEqual(field.length);

      typeName = 'textarea1';
      field = createField(typeName);
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName}`);
      expect(value.length).to.be.lessThanOrEqual(field.length);
      // textarea1 should have multiple lines
      expect(value).to.contain('\n');

    });

    it('Can Create number-ish', () => {

      let typeName = 'int';
      let field = createField(typeName);
      let value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('number', `failed to create: ${typeName}`);

      typeName = 'integer';
      field = createField(typeName);
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('number', `failed to create: ${typeName}`);

      typeName = 'long';
      field = createField(typeName);
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('number', `failed to create: ${typeName}`);

      typeName = 'double';
      field = createField(typeName);
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('number', `failed to create: ${typeName}`);

      typeName = 'percent';
      field = createField(typeName);
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('number', `failed to create: ${typeName}`);

      typeName = 'currency';
      field = createField(typeName);
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('number', `failed to create: ${typeName}`);
    });

    it('Can Create decimal-ish', () => {
      let typeName = 'double';
      let field = createField(typeName);
      field.scale = 2;
      let value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('number', `failed to create: ${typeName}-ish`);
      let numString = '' + value;
      let parts = numString.split('.');
      expect(parts.length).to.equal(2, `failed to create: ${typeName} with scale`);
      expect(parts[1].length).to.equal(2, `failed to create: ${typeName} with scale`);

      typeName = 'percent';
      field = createField(typeName);
      field.scale = 2;
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('number', `failed to create: ${typeName}-ish`);
      numString = '' + value;
      parts = numString.split('.');
      expect(parts.length).to.equal(2, `failed to create: ${typeName} with scale`);
      expect(parts[1].length).to.equal(2, `failed to create: ${typeName} with scale`);

      typeName = 'currency';
      field = createField(typeName);
      field.scale = 2;
      value = SfCore.generateValue(field);
      
      expect(value).is.not.undefined;
      expect(typeof value).to.equal('number', `failed to create: ${typeName}-ish`);
      numString = '' + value;
      parts = numString.split('.');
      expect(parts.length).to.equal(2, `failed to create: ${typeName} with scale`);
      expect(parts[1].length).to.equal(2, `failed to create: ${typeName} with scale`);
    });

    it('Can Create address', () => {
      const typeName = 'address';
      const field = createField(typeName);
      const value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName} type`);
      expect(value).to.contain('123', `failed to create: ${typeName}`);
    });

    it('Can Create boolean', () => {
      const typeName = 'boolean';
      const field = createField(typeName);
      const value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('boolean', `failed to create: ${typeName}`);
    });

    it('Can Create date-ish', () => {
      let typeName = 'date';
      let field = createField(typeName);
      let value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName} type`);
      expect( new Date(value as string), `Date cannot be created from: ${value} (${typeName})`);

      typeName = 'datetime';
      field = createField(typeName);
      value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName} type`);
      expect( new Date(value as string), `Date cannot be created from: ${value} (${typeName})`);

      typeName = 'time';
      field = createField(typeName);
      value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName} type`);
      expect( new Date(value as string), `Date cannot be created from: ${value} (${typeName})`);
    });

    it('Can Create email', () => {
      const typeName = 'email';
      const field = createField(typeName);
      const value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName}`);
      expect(value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), `Invalid ${typeName} value: ${value}`);
    });

    it('Can Create phone', () => {
      const typeName = 'phone';
      const field = createField(typeName);
      const value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName}`);
      expect(value).to.contain('555', `${typeName} value (${value}) missing '555'`);
      expect(value).to.contain('-', `${typeName} value (${value}) missing '-'`);
      expect(value).to.contain('ext', `${typeName} value (${value}) missing 'ext'`);
    });

    it('Can Create picklist-ish', () => {
      const picklistObjects = [
        { 
          name: 'One',
          value: 'one',
          active: true
        },
        { 
          name: 'Two',
          value: 'two',
          active: true
        },
        { 
          name: 'Three',
          value: 'three',
          active: true
        }
      ];

      const picklistValues = ['one','two', 'three'];

      let typeName = 'picklist';
      let field = createField(typeName);
      field.picklistValues = picklistObjects;
      let value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName} type`);
      let values = value.split(';');
      expect(values.length).to.equal(1);
      expect(picklistValues).to.include(values[0]);

      typeName = 'multipicklist';
      field = createField(typeName);
      field.picklistValues = picklistObjects;
      value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(value).is.not.null;
      expect(typeof value).to.equal('string', `failed to create: ${typeName} type`);
      values = value.split(';');
      expect(values.length).to.be.greaterThan(1);
      for(const val of values) {
        expect(picklistValues).to.include(val);
      }
    });

    it('Can Create url', () => {
      const typeName = 'url';
      const field = createField(typeName);
      const value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName}`);
      expect(URL.canParse(value as string), `Invalid ${typeName} value: ${value}`);
    });

    it('Can Create id', () => {
      const typeName = 'id';
      const field = createField(typeName);
      const value = SfCore.generateValue(field);

      expect(value).is.not.undefined;
      expect(typeof value).to.equal('string', `failed to create: ${typeName}`);
      expect(value.length).equals(18);
    });

    it('Can NOT Create types', () => {
      let typeName = 'reference';
      let field = createField(typeName);
      let value = SfCore.generateValue(field);

      expect(value).is.undefined;

      typeName = 'combobox';
      field = createField(typeName);
      value = SfCore.generateValue(field);

      expect(value).is.undefined;

      typeName = 'dataCategoryGroupReference';
      field = createField(typeName);
      value = SfCore.generateValue(field);

      expect(value).is.undefined;
    });
  });
});
