"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../../helpers/command-base");
const utils_1 = require("../../../helpers/utils");
const profile_download_1 = require("../../../helpers/profile-download");
const sf_project_1 = require("../../../helpers/sf-project");
class ProfileRetrieve extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(ProfileRetrieve);
        const profileList = flags.names.split(',');
        const packageDir = (await sf_project_1.default.default()).getDefaultDirectory();
        if (!(await utils_1.default.pathExists(packageDir))) {
            this.raiseError('No default folder found in sf-project.json file');
        }
        const orgAllProfilesMap = await profile_download_1.ProfileDownload.checkOrgProfiles(this.org);
        const orgAllProfiles = [...orgAllProfilesMap.keys()];
        if (profileList.length > 5) {
            this.raiseError('Only 5 Profiles can be retrieved at once');
        }
        const notAvailableProfiles = [];
        for (const profile of profileList) {
            if (!orgAllProfiles.includes(profile)) {
                notAvailableProfiles.push(profile);
            }
        }
        if (notAvailableProfiles.length > 0) {
            this.raiseError(`Profiles not found in Org: ${notAvailableProfiles.join(',')}`);
        }
        this.UX.log('Retrieving Profiles...');
        const profileDownloader = new profile_download_1.ProfileDownload(this.org, profileList, orgAllProfilesMap, path.join(process.cwd()));
        // Profile Directory Path
        const profileDirPath = path.join(process.cwd(), packageDir, 'main', 'default', 'profiles');
        const profileByPath = new Map();
        for (const profileName of profileList) {
            const filePath = profileName + '.profile-meta.xml';
            await utils_1.default.mkDirPath(path.join(profileDirPath, filePath), true);
            profileByPath.set(profileName, path.join(profileDirPath, filePath));
        }
        const profiles = await profileDownloader.downloadPermissions();
        // Write files to XML
        for (const profileName of profiles.keys()) {
            const profileContent = await utils_1.default.readFile(profiles.get(profileName));
            const profileJson = JSON.parse(profileContent);
            this.UX.log(`Writing "${profileName}" profile to folder...`);
            await profile_download_1.ProfileDownload.writeProfileToXML(profileJson, profileByPath.get(profileName));
        }
        this.UX.log(`Done. Profiles stored in folder-> ${profileDirPath}`);
        await utils_1.default.deleteDirectory(path.join(process.cwd(), utils_1.default.tempFilesPath));
    }
}
ProfileRetrieve.description = command_base_1.CommandBase.messages.getMessage('schema.profile.retrieve.commandDescription');
ProfileRetrieve.examples = [
    `
    $ sf schema profile retrieve -u myOrgAlias -n "Admin,Support"
    Retrieves 5 profiles at a time. Default Path - force-app/main/default/profile `,
];
ProfileRetrieve.flags = {
    names: sf_plugins_core_1.Flags.string({
        char: 'n',
        description: command_base_1.CommandBase.messages.getMessage('schema.profile.retrieve.names'),
        required: true,
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = ProfileRetrieve;
//# sourceMappingURL=retrieve.js.map