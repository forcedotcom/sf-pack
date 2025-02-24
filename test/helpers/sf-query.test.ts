import { expect } from 'chai';
import { Org } from '@salesforce/core';
import {
  SfQuery,
  SfCodeCoverage,
  SfEntity,
  SfPermissionSet,
  SfCodeCoverageItem,
  SfValidationRule,
} from '../../src/helpers/sf-query.js';
import Setup from './setup.js';

let org: Org = null;
describe('sf-query Tests', () => {
  before('Init', async function () {
    org = await Setup.org();
  });
  describe('getApexTestClasses Tests', () => {
    it('Can Handle Null', async function () {
      expect(await SfQuery.getApexTestClasses(null)).to.be.null;
      expect(await SfQuery.getApexTestClasses(null, null)).to.be.null;
      expect(await SfQuery.getApexTestClasses(null, [''])).to.be.null;
    }).timeout(0);
    it('Can get Test Classes', async function () {
      if (!org) {
        this.skip();
      }
      const testClasses = await SfQuery.getApexTestClasses(org);
      expect(testClasses).to.not.be.null;
      expect(testClasses).to.be.instanceOf(Array);

      expect(testClasses.length).to.be.greaterThan(0,'***Apex classes not found - Did you deploy the classes in the force-app folder? ***');
    }).timeout(0);
    it('Can get classes with no Tests By Namespace', async function () {
      if (!org) {
        this.skip();
      }
      const testClasses = await SfQuery.getApexTestClasses(org, ['ltngsharing', 'SDOC']);
      expect(testClasses).to.not.be.null;
      expect(testClasses).to.be.instanceOf(Array);
      expect(testClasses.length).to.equal(0);
    }).timeout(0);
  });

  describe('getCodeCoverage Tests', () => {
    it('Can Handle Null', async function () {
      expect(await SfQuery.getCodeCoverage(null)).to.be.null;
    });
    it('Can get Code Coverage', async function () {
      if (!org) {
        this.skip();
      }
      const codeCoverage = await SfQuery.getCodeCoverage(org);
      codeCoverage.calculateCodeCoverage();

      expect(codeCoverage).to.not.be.null;
      expect(codeCoverage).to.be.instanceOf(SfCodeCoverage);
      expect(codeCoverage.codeCoverage).to.be.instanceOf(Array);

      if (codeCoverage.codeCoveragePercent > 0) {
        expect(codeCoverage.codeCoverage.length).to.not.equal(0);
        expect(codeCoverage.totalCoveredLines).to.not.equal(0);

      } else {
        expect(codeCoverage.codeCoverage.length).to.equal(0);
        expect(codeCoverage.totalCoveredLines).to.equal(0);
      }
    }).timeout(0);
    it('Can get Code Coverage', async function () {
      const codeCoverage = new SfCodeCoverage();
      expect(codeCoverage.calculateCodeCoverage()).to.be.undefined;
    }).timeout(0);

    it('Can get Code Coverage Percent From Item', async function () {
      const codeCoverageItem = new SfCodeCoverageItem();
      codeCoverageItem.coveredLines = [1, 2, 3, 4, 5];
      codeCoverageItem.uncoveredLines = [6, 7, 8, 9];

      expect(codeCoverageItem.getCodeCoveragePercent()).to.not.equal(0);
    }).timeout(0);
  });

  describe('SfQuery Tests', () => {
    const customObjectType = 'Account';
    let testName = 'getCustomApplications';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        expect(await SfQuery.getCustomApplications(null)).to.be.null;
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        const results = await SfQuery.getCustomApplications(org);
        expect(results).to.not.be.null;
        expect(results).to.be.instanceOf(Array<SfEntity>);
        expect(results.length).to.be.greaterThan(0);
      }).timeout(0);
    });
    testName = 'getSetupEntityTypes';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        expect(await SfQuery.getSetupEntityTypes(null)).to.be.null;
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        const results = await SfQuery.getSetupEntityTypes(org);
        expect(results).to.not.be.null;
        expect(results).to.be.instanceOf(Array<SfEntity>);
        expect(results.length).to.be.greaterThan(0);
      }).timeout(0);
    });
    testName = 'getFolders';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        expect(await SfQuery.getFolders(null)).to.be.null;
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        const results = await SfQuery.getFolders(org);
        expect(results).to.not.be.null;
        expect(results).to.be.instanceOf(Array<string>);
        expect(results.length).to.be.greaterThan(0);
      }).timeout(0);
    });

    testName = 'getPermissions';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        expect(await SfQuery.getPermissions(null)).to.be.null;
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        const results = await SfQuery.getPermissions(org);
        expect(results).to.not.be.null;
        expect(results).to.be.instanceOf(Map<string, SfPermissionSet>);
        expect(results.size).to.be.greaterThan(0);
      }).timeout(0);
    });
    testName = 'getObjectPermissions';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        expect(await SfQuery.getObjectPermissions(null, null)).to.be.null;
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        const results = await SfQuery.getObjectPermissions(org, customObjectType);
        expect(results).to.not.be.null;
        expect(results).to.be.instanceOf(Array<string>);
        expect(results.length).to.be.greaterThan(0);
      }).timeout(0);
    });
    testName = 'getFieldPermissions';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        expect(await SfQuery.getFieldPermissions(null, null)).to.be.null;
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        const results = await SfQuery.getFieldPermissions(org, customObjectType);
        expect(results).to.not.be.null;
        expect(results).to.be.instanceOf(Array<string>);
        expect(results.length).to.be.greaterThan(0);
      }).timeout(0);
    });
    testName = 'getSetupEntityAccessForTypes';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        expect(await SfQuery.getSetupEntityAccessForTypes(null, [])).to.be.null;
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        const results = await SfQuery.getSetupEntityAccessForTypes(org, ['ApexClass']);
        expect(results).to.not.be.null;
        expect(results).to.be.instanceOf(Array<string>);
        expect(results.length).to.be.greaterThan(0);
      }).timeout(0);
    });
    testName = 'waitForApexTests';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        for await (const results of SfQuery.waitForApexTests(null, null, null)) {
          if (results) {
            expect.fail();
          }
        }
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        for await (const results of SfQuery.waitForApexTests(org, null, 1)) {
          expect(results).to.not.be.null;
          expect(results).to.be.a('number');
        }
      }).timeout(0);
    });
    testName = 'getInClause';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        expect(SfQuery.getInClause(null, false)).to.be.null;
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        const results = SfQuery.getInClause(['one', 'two', 'three'], false);
        expect(results).to.not.be.null;
        expect(results).to.equal("IN ('one','two','three')");
      }).timeout(0);
      it('Can ' + testName + ' with numbers', async function () {
        if (!org) {
          this.skip();
        }
        const results = SfQuery.getInClause(['1', '2', '3'], true);
        expect(results).to.not.be.null;
        expect(results).to.equal('IN (1,2,3)');
      }).timeout(0);
    });
    testName = 'getValidationRules';
    describe(testName + ' Tests', () => {
      it('Can ' + testName + ' Handle Null', async function () {
        expect(await SfQuery.getValidationRules(null)).to.be.null;
      });
      it('Can ' + testName, async function () {
        if (!org) {
          this.skip();
        }
        const results = await SfQuery.getValidationRules(org);
        expect(results).to.not.be.null;
        expect(results).to.be.instanceOf(Array<SfValidationRule>);
        expect(results.length).to.be.greaterThan(0);
      }).timeout(0);
      it('Can ' + testName + ' and logic', async function () {
        if (!org) {
          this.skip();
        }
        const results = await SfQuery.getValidationRules(org, true);
        expect(results).to.not.be.null;
        expect(results).to.be.instanceOf(Array<SfValidationRule>);
        expect(results.length).to.be.greaterThan(0);
        expect(results[0].errorConditionFormula).to.not.be.null;
      }).timeout(0);
    });
  });
});
