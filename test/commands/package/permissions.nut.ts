import path from 'node:path';
import { expect } from 'chai';
import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import Setup from '../../helpers/setup.js';

describe.skip('Test Exception handler', () => {
  let session: TestSession;
  before(async () => {
    process.env.TESTKIT_HUB_USERNAME = Setup.username;
    session = await TestSession.create({
      project: {
        gitClone: 'https://github.com/trailheadapps/dreamhouse-lwc.git',
      },
      devhubAuthStrategy: 'AUTO',
      scratchOrgs: [
        {
          config: path.join('config', 'project-scratch-def.json'),
          setDefault: true,
          alias: 'org',
        },
      ],
    });

    execCmd('project:deploy:start -o org --source-dir force-app', { ensureExitCode: 0, cli: 'sf' });
  });

  after(async () => {
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });

  it('Handles Bogus Path and set exit code', () => {
    const command = `package permissions -x blah/blah/package.xml`;
    const output = execCmd(command, { ensureExitCode: 1 }).shellOutput.stdout;
    // eslint-disable-next-line no-console
    console.log(output);
    expect(output).to.contain('The specified package folder does not exist:');
  }).timeout(0);
});
