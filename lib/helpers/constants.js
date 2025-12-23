import os from 'node:os';
export default class Constants {
    static DEFAULT_XML_NAMESPACE = 'http://soap.sforce.com/2006/04/metadata';
    // curl -H "Accept: application/json" https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report > metadata-coverage.json
    static METADATA_COVERAGE_REPORT_URL = 'https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report';
    static DEFAULT_PACKAGE_NAME = 'package.xml';
    static DEFAULT_PACKAGE_PATH = 'manifest/' + Constants.DEFAULT_PACKAGE_NAME;
    static SF_CONFIG_DEFAULT_USERNAME = 'target-org';
    static SF_CONFIG_MAX_QUERY_LIMIT = 'org-max-query-limit';
    static SF_PERMISSION_APEX_CLASS = 'ApexClass';
    static SF_PERMISSION_APEX_PAGE = 'PageAccesses';
    static SF_PERMISSION_CUSTOM_APP = 'CustomApplication';
    static SF_PERMISSION_CUSTOM_OBJ = 'CustomObject';
    static SF_PERMISSION_CUSTOM_FIELD = 'CustomField';
    static SF_PERMISSION_CUSTOM_TAB = 'CustomTab';
    static SF_PERMISSION_SET = 'PermissionSet';
    static SF_PERMISSION_PROFILE = 'Profile';
    static SF_PERMISSION_RECORD_TYPE = 'RecordType';
    static SF_PERMISSION_LAYOUT = 'Layout';
    static DEFAULT_PROJECT_FILE_NAME = 'sf-project.json';
    static DEFAULT_SFDC_LOGIN_URL = 'https://login.salesforce.com';
    static DEFAULT_PACKAGE_VERSION = '49.0';
    static ENOENT = 'ENOENT';
    static CONTENT_TYPE_APPLICATION = 'application/octetstream';
    static CONTENT_TYPE_IMAGE = 'image/png';
    static CONTENT_TYPE_CSV = 'text/csv';
    static CONTENT_TYPE_TEXT = 'text/plain';
    static HEADERS_CONTENT_TYPE = 'content-type';
    static METADATA_FILE_SUFFIX = '-meta.xml';
    static HTTP_STATUS_REDIRECT = [301];
    static EOL = os.EOL;
    static CR = '\r';
    static LF = '\n';
    static CONTENT_VERSION_MAX_SIZE = 37_000_000;
    static MIME_JSON = 'application/json';
    static DEFAULT_CSV_TEXT_WRAPPERS = ['"'];
    static MAX_EXCEL_LENGTH = 32_767;
    static CUSTOM_SUFFIX = '__c';
    static DEFAULT_XML_EOF = '\n';
    static DEFAULT_XML_ENCODING = 'utf-8';
    static DEFAULT_COPY_DIR_LIST = [
        'aura', 'lwc', 'experiences', 'staticresources', 'territory2Models', 'waveTemplates', 'bots'
    ];
}
//# sourceMappingURL=constants.js.map