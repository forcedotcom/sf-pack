import path from 'node:path';
import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base.js';
import Utils from '../../../helpers/utils.js';
import { ProfileDownload } from '../../../helpers/profile-download.js';
import SfProject from '../../../helpers/sf-project.js';

export default class ProfileRetrieve extends CommandBase {
  public static description = CommandBase.messages.getMessage('schema.profile.retrieve.commandDescription');

  public static examples = [
    `
    $ sf schema profile retrieve -u myOrgAlias -n "Admin,Support"
    Retrieves 5 profiles at a time. Default Path - force-app/main/default/profile `,
  ];

  public static readonly flags = {
    names: Flags.string({
      char: 'n',
      description: CommandBase.messages.getMessage('schema.profile.retrieve.names'),
      required: true,
    }),
    ...CommandBase.commonFlags,
    ...CommandBase.flags,
  };

  protected async runInternal(): Promise<void> {
    const { flags } = await this.parse(ProfileRetrieve);
    const profileList: string[] = flags.names.split(',');

    const packageDir = (await SfProject.default()).getDefaultDirectory();
    if (!(await Utils.pathExists(packageDir))) {
      this.raiseError('No default folder found in sf-project.json file');
    }

    const orgAllProfilesMap = await ProfileDownload.checkOrgProfiles(this.org);

    const orgAllProfiles = [...orgAllProfilesMap.keys()];

    if (profileList.length > 5) {
      this.raiseError('Only 5 Profiles can be retrieved at once');
    }

    const notAvailableProfiles: string[] = [];
    for (const profile of profileList) {
      if (!orgAllProfiles.includes(profile)) {
        notAvailableProfiles.push(profile);
      }
    }
    if (notAvailableProfiles.length > 0) {
      this.raiseError(`Profiles not found in Org: ${notAvailableProfiles.join(',')}`);
    }

    this.UX.log('Retrieving Profiles...');
    const profileDownloader = new ProfileDownload(this.org, profileList, orgAllProfilesMap, path.join(process.cwd()));

    // Profile Directory Path
    const profileDirPath = path.join(process.cwd(), packageDir, 'main', 'default', 'profiles');

    const profileByPath: Map<string, string> = new Map<string, string>();

    for (const profileName of profileList) {
      const filePath = profileName + '.profile-meta.xml';
      await Utils.mkDirPath(path.join(profileDirPath, filePath), true);
      profileByPath.set(profileName, path.join(profileDirPath, filePath));
    }

    const profiles = await profileDownloader.downloadPermissions();

    // Write files to XML
    for (const profileName of profiles.keys()) {
      const profileContent = await Utils.readFile(profiles.get(profileName));
      const profileJson = JSON.parse(profileContent);
      this.UX.log(`Writing "${profileName}" profile to folder...`);
      await ProfileDownload.writeProfileToXML(profileJson, profileByPath.get(profileName));
    }

    this.UX.log(`Done. Profiles stored in folder-> ${profileDirPath}`);
    await Utils.deleteDirectory(path.join(process.cwd(), Utils.tempFilesPath));
  }
}
