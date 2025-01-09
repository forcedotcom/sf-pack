import { expect } from '@oclif/test';
import { Config } from '@oclif/core';
import { Org, Connection } from '@salesforce/core';
import { Ux } from '@salesforce/sf-plugins-core';
import { ConditionalError, CommandBase } from '../../src/helpers/command-base';
import Setup from './setup';


export class TestError extends Error {}
export class TestCommand extends CommandBase {
  public get testOrg(): Org {
    return this.org;
  }

  public get testOrgAlias(): string {
    return this.orgAlias;
  }

  public get testOrgId(): string {
    return this.orgId;
  }

  public get testConnection(): Connection {
    return this.connection;
  }

  public get testUX(): Ux {
    return this.UX;
  }

  public testRaiseError(message?: string): ConditionalError {
    let error: ConditionalError = null;
    try {
      this.raiseError(message);
    } catch (ex) {
      error = ex as ConditionalError;
    }
    return error;
  }

  public testErrorHandler(error: Error, throwEr: boolean): void {
    this.errorHandler(error, throwEr);
  }

  protected runInternal(): Promise<void> {
    return;
  }
}

const username = Setup.username;

describe('ConditionalError Tests', () => {
  it('Can handle nulls', () => {
    const error = new ConditionalError(null, null);
    expect(error).to.not.be.null;
  });
  it('Can create instance', () => {
    const error = new ConditionalError('test error', true);
    expect(error).to.not.be.null;
    expect(error.message).equals('test error');
    expect(error.isRethrown).equals(true);
  });
});

describe('CommandBase', () => {
  let command: TestCommand = null;

  before('Create Command', async () => {
    if (username) {
      command = new TestCommand(['-u', username], new Config(null));
    }
  });

  it('Can create instance', function () {
    if (!command) {
      this.skip();
    }
    expect(command).to.not.be.null;
    expect(command.testConnection).to.not.be.null;
    expect(command.testOrg).to.not.be.null;
    expect(command.testOrgAlias).to.not.be.null;
    expect(command.testOrgId).to.not.be.null;
    expect(command.testUX).to.not.be.null;
  });

  it('Can raiseError Handle Nulls', function () {
    if (!command) {
      this.skip();
    }
    const error: ConditionalError = command.testRaiseError();
    expect(error).to.not.be.null;
    expect(error.message).equals('');
    expect(error.isRethrown).equals(false);
  }).timeout(0);

  it('Can raiseError', function () {
    if (!command) {
      this.skip();
    }
    const error: ConditionalError = command.testRaiseError('test error');
    expect(error).to.not.be.null;
    expect(error.message).equals('test error');
    expect(error.isRethrown).equals(false);
  });

  it('Can errorHandler Handle Nulls', function () {
    if (!command) {
      this.skip();
    }
    try {
      command.testErrorHandler(null, false);
    } catch (ex) {
      expect.fail();
    }
  });

  it('Can errorHandler Handle Error ', function () {
    if (!command) {
      this.skip();
    }
    try {
      const err = new Error('error');
      command.testErrorHandler(err, false);
    } catch (ex) {
      expect.fail();
    }
  });

  it('Can errorHandler Handle and Rethrow Error ', function () {
    if (!command) {
      this.skip();
    }
    try {
      const err = new Error('error');
      command.testErrorHandler(err, true);
      expect.fail();
    } catch (ex) {
      // ex was re-thrown
    }
  });
  it('Can errorHandler Handle ConditionalError ', function () {
    if (!command) {
      this.skip();
    }
    try {
      const err = new ConditionalError('error');
      command.testErrorHandler(err, false);
    } catch (ex) {
      expect.fail();
    }
  });

  it('Can errorHandler Handle and Rethrow ConditionalError ', function () {
    if (!command) {
      this.skip();
    }
    try {
      const err = new ConditionalError('error');
      command.testErrorHandler(err, true);
      expect.fail();
    } catch (ex) {
      // ex was re-thrown
    }
  });
  it('Can errorHandler Handle TestError ', function () {
    if (!command) {
      this.skip();
    }
    try {
      const err = new TestError('error');
      command.testErrorHandler(err, false);
    } catch (ex) {
      expect.fail();
    }
  });

  it('Can errorHandler Handle and Rethrow TestError ', function () {
    if (!command) {
      this.skip();
    }
    try {
      const err = new TestError('error');
      command.testErrorHandler(err, true);
      expect.fail();
    } catch (ex) {
      // ex was re-thrown
    }
  });
  
  it('Can run', async function () {
    if (!command) {
      this.skip();
    }
    await command.run();
  })
});
