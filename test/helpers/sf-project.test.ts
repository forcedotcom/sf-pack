import { expect } from '@oclif/test';
import SfProject, { PackageDirectory } from '../../src/helpers/sf-project';

describe('PackageDirectory Tests', () => {
  it('Can Create instance', async () => {
    const results = new PackageDirectory();
    expect(results).is.not.null;
  });
});

describe('SfProject Tests', () => {
  it('Is Not Null', async () => {
    const results = new SfProject();
    expect(results.packageDirectories.length).equals(0);
  });

  it('default Works', async () => {
    const results = await SfProject.default();
    expect(results.packageDirectories).to.not.be.null;
  });
  it('It Can getDefaultDirectory', async () => {
    const results = await SfProject.default();
    expect(results.getDefaultDirectory()).to.not.be.null;
  });
});

