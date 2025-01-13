import { SfTasks } from './sf-tasks.js';
import { OptionsBase } from './options.js';
import { SfCore } from './sf-core.js';
export class PackageOptions extends OptionsBase {
    static CURRENT_VERSION = 1.0;
    excludeMetadataTypes = [];
    mdapiMap = new Map();
    mdapiNotStar = [];
    mdapiIgnore = ['featureParameters', 'moderation', 'territories', 'wave'];
    get currentVersion() {
        return PackageOptions.CURRENT_VERSION;
    }
    async loadDefaults() {
        // When the defaults are loaded - we will pull from the Metadata Coverage Report
        // If we are not allowing external connections at runtime (FedRAMP) - just set to empty array
        this.excludeMetadataTypes = this.settings.blockExternalConnections
            ? []
            : await SfTasks.getUnsupportedMetadataTypes();
        this.mdapiNotStar = [];
        this.mdapiIgnore = [];
        this.mdapiMap = new Map([
            ['actionLinkGroupTemplates', 'ActionLinkGroupTemplate'],
            ['analyticSnapshots', 'AnalyticSnapshot'],
            ['animationRules', 'AnimationRule'],
            ['appMenus', 'AppMenu'],
            ['applications', 'CustomApplication'],
            ['appointmentSchedulingPolicies', 'AppointmentSchedulingPolicy'],
            ['approvalProcesses', 'ApprovalProcess'],
            ['assignmentRules', 'AssignmentRules'],
            ['audience', 'Audience'],
            ['aura', 'AuraDefinitionBundle'],
            ['authproviders', 'AuthProvider'],
            ['autoResponseRules', 'AutoResponseRules'],
            ['bot', 'Bot'],
            ['brandingSets', 'BrandingSet'],
            ['cachePartitions', 'PlatformCachePartition'],
            ['callCenters', 'CallCenter'],
            ['campaignInfluenceModels', 'CampaignInfluenceModel'],
            ['CaseSubjectParticles', 'CaseSubjectParticle'],
            ['certs', 'Certificate'],
            ['channelLayouts', 'ChannelLayout'],
            ['ChatterExtensions', 'ChatterExtension'],
            ['classes', 'ApexClass'],
            ['cleanDataServices', 'CleanDataService'],
            ['cmsConnectSource', 'CMSConnectSource'],
            ['communities', 'Community'],
            ['communityTemplateDefinitions', 'CommunityTemplateDefinition'],
            ['communityThemeDefinitions', 'CommunityThemeDefinition'],
            ['components', 'ApexComponent'],
            ['connectedApps', 'ConnectedApp'],
            ['contentassets', 'ContentAsset'],
            ['corsWhitelistOrigins', 'CorsWhitelistOrigin'],
            ['cspTrustedSites', 'CspTrustedSite'],
            ['customApplicationComponents', 'CustomApplicationComponent'],
            ['customHelpMenuSections', 'CustomHelpMenuSection'],
            ['customMetadata', 'CustomMetadata'],
            ['customPermissions', 'CustomPermission'],
            ['dashboards', 'Dashboard'],
            ['dataSources', 'ExternalDataSource'],
            ['datacategorygroups', 'DataCategoryGroup'],
            ['delegateGroups', 'DelegateGroup'],
            ['documents', 'Document'],
            ['duplicateRules', 'DuplicateRule'],
            ['eclair', 'EclairGeoData'],
            ['email', 'EmailTemplate'],
            ['emailservices', 'EmailServicesFunction'],
            ['EmbeddedServiceBranding', 'EmbeddedServiceBranding'],
            ['EmbeddedServiceConfig', 'EmbeddedServiceConfig'],
            ['EmbeddedServiceFlowConfig', 'EmbeddedServiceFlowConfig'],
            ['EmbeddedServiceLiveAgent', 'EmbeddedServiceLiveAgent'],
            ['entitlementProcesses', 'EntitlementProcess'],
            ['experiences', 'ExperienceBundle'],
            ['escalationRules', 'EscalationRules'],
            ['eventDeliveries', 'EventDelivery'],
            ['eventSubscriptions', 'EventSubscription'],
            ['eventSubscriptions', 'EventSubscription'],
            ['externalServiceRegistrations', 'ExternalServiceRegistration'],
            ['featureParameters', 'FeatureParameters'],
            ['featureParameterBoolean', 'FeatureParameterBoolean'],
            ['featureParameterDate', 'FeatureParameterDate'],
            ['featureParameterInteger', 'FeatureParameterInteger'],
            ['feedFilters', 'CustomFeedFilter'],
            ['flexipages', 'FlexiPage'],
            ['flowCategories', 'FlowCategory'],
            ['flowDefinitions', 'FlowDefinition'],
            ['flows', 'Flow'],
            ['globalValueSetTranslations', 'GlobalValueSetTranslation'],
            ['globalValueSets', 'GlobalValueSet'],
            ['groups', 'Group'],
            ['homePageComponents', 'HomePageComponent'],
            ['homePageLayouts', 'HomePageLayout'],
            ['installedPackages', 'InstalledPackage'],
            ['keywords', 'KeywordList'],
            ['labels', 'CustomLabels'],
            ['layouts', 'Layout'],
            ['LeadConvertSettings', 'LeadConvertSettings'],
            ['letterhead', 'Letterhead'],
            ['lightningBolts', 'LightningBolt'],
            ['lightningExperienceThemes', 'LightningExperienceTheme'],
            ['lwc', 'LightningComponentBundle'],
            ['liveChatAgentConfigs', 'LiveChatAgentConfig'],
            ['liveChatButtons', 'LiveChatButton'],
            ['liveChatDeployments', 'LiveChatDeployment'],
            ['liveChatSensitiveDataRule', 'LiveChatSensitiveDataRule'],
            ['managedContentTypes', 'ManagedContentType'],
            ['managedTopics', 'ManagedTopics'],
            ['matchingRules', 'MatchingRules'],
            ['messageChannels', 'LightningMessageChannel'],
            ['milestoneTypes', 'MilestoneType'],
            ['MobileApplicationDetails', 'MobileApplicationDetail'],
            ['moderation', 'ModerationRule'],
            ['namedCredentials', 'NamedCredential'],
            ['navigationMenus', 'NavigationMenu'],
            ['networkBranding', 'NetworkBranding'],
            ['networks', 'Network'],
            ['notificationtypes', 'CustomNotificationType'],
            ['oauthcustomscopes', 'OauthCustomScope'],
            ['objectTranslations', 'CustomObjectTranslation'],
            ['objects', 'CustomObject'],
            ['pages', 'ApexPage'],
            ['pathAssistants', 'PathAssistant'],
            ['permissionsets', 'PermissionSet'],
            ['permissionsetgroups', 'PermissionSetGroup'],
            ['platformEventChannels', 'PlatformEventChannel'],
            ['platformEventChannelMembers', 'PlatformEventChannelMember'],
            ['portals', 'Portal'],
            ['postTemplates', 'PostTemplate'],
            ['presenceDeclineReasons', 'PresenceDeclineReason'],
            ['presenceUserConfigs', 'PresenceUserConfig'],
            ['profilePasswordPolicies', 'ProfilePasswordPolicy'],
            ['profileSessionSettings', 'ProfileSessionSetting'],
            ['profiles', 'Profile'],
            ['prompts', 'Prompt'],
            ['queues', 'Queue'],
            ['queueRoutingConfigs', 'QueueRoutingConfig'],
            ['quickActions', 'QuickAction'],
            ['recommendationStrategies', 'RecommendationStrategy'],
            ['recordActionDeployments', 'RecordActionDeployment'],
            ['remoteSiteSettings', 'RemoteSiteSetting'],
            ['reportTypes', 'ReportType'],
            ['reports', 'Report'],
            ['roles', 'Role'],
            ['rule', 'ModerationRule'],
            ['samlssoconfigs', 'SamlSsoConfig'],
            ['scontrols', 'Scontrol'],
            ['serviceChannels', 'ServiceChannel'],
            ['servicePresenceStatuses', 'ServicePresenceStatus'],
            ['settings', 'Settings'],
            ['sharingRules', 'SharingRules'],
            ['sharingSets', 'SharingSet'],
            ['siteDotComSites', 'SiteDotCom'],
            ['sites', 'CustomSite'],
            ['skills', 'Skill'],
            ['standardValueSetTranslations', 'StandardValueSetTranslation'],
            ['standardValueSets', 'StandardValueSet'],
            ['staticresources', 'StaticResource'],
            ['synonymDictionaries', 'SynonymDictionary'],
            ['tabs', 'CustomTab'],
            ['territories', 'Territory'],
            ['territory', 'Territory'],
            ['territory2', 'Territory2'],
            ['territory2Models', 'Territory2Model'],
            ['territory2Rule', 'Territory2Rule'],
            ['territory2Types', 'Territory2Type'],
            ['testSuites', 'ApexTestSuite'],
            ['timeSheetTemplates', 'TimeSheetTemplate'],
            ['topicsForObjects', 'TopicsForObjects'],
            ['transactionSecurityPolicies', 'TransactionSecurityPolicy'],
            ['translations', 'Translations'],
            ['triggers', 'ApexTrigger'],
            ['userCriteria', 'UserCriteria'],
            ['wapp', 'WaveApplication'],
            ['wave', 'WaveApplication'],
            ['wdash', 'WaveDashboard'],
            ['wdf', 'WaveDataflow'],
            ['wds', 'WaveDataset'],
            ['wlens', 'WaveLens'],
            ['weblinks', 'CustomPageWebLink'],
            ['workflows', 'Workflow'],
            ['xmd', 'WaveXmd'],
        ]);
        return;
    }
    async deserialize(serializedOptions) {
        return new Promise((resolve, reject) => {
            try {
                const options = JSON.parse(serializedOptions);
                this.excludeMetadataTypes = options.excludeMetadataTypes;
                this.mdapiMap = new Map(options.mdapiMap);
                this.mdapiNotStar = options.mdapiNotStar;
                this.mdapiIgnore = options.mdapiIgnore;
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async serialize() {
        return new Promise((resolve, reject) => {
            try {
                resolve(JSON.stringify({
                    excludeMetadataTypes: this.excludeMetadataTypes ? this.excludeMetadataTypes : [],
                    mdapiMap: Array.from(this.mdapiMap.entries()),
                    mdapiNotStar: this.mdapiNotStar ? this.mdapiNotStar : [],
                    mdapiIgnore: this.mdapiIgnore ? this.mdapiIgnore : [],
                }, null, SfCore.jsonSpaces));
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
//# sourceMappingURL=package-options.js.map