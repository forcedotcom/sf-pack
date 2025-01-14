import { expect } from 'chai';
import { SfUI } from '../../src/helpers/sf-ui.js';

describe('SfUI Tests', () => {
  it('Is Not Null', () => {
    expect(SfUI.writeMessageCallback).to.not.be.null;
  });

  it('Can handle null', () => {
    SfUI.writeMessageCallback(null);
    SfUI.writeMessageCallback('');
  });

  it('default Works', async () => {
    const actual = 'test-message';
    let expected: string = null;
    SfUI.writeMessageCallback = (message: string) => {
      expected = message;
    };
    SfUI.writeMessageCallback(actual);
    expect(expected).to.equal(actual);
  });
});
