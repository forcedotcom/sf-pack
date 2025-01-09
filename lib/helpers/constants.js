"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
class Constants {
}
Constants.DEFAULT_XML_NAMESPACE = 'http://soap.sforce.com/2006/04/metadata';
Constants.METADATA_COVERAGE_REPORT_URL = 'https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report';
Constants.DEFAULT_PACKAGE_NAME = 'package.xml';
Constants.DEFAULT_PACKAGE_PATH = 'manifest/' + Constants.DEFAULT_PACKAGE_NAME;
Constants.SF_CONFIG_DEFAULT_USERNAME = 'target-org';
Constants.SF_CONFIG_MAX_QUERY_LIMIT = 'org-max-query-limit';
Constants.SF_PERMISSION_APEX_CLASS = 'ApexClass';
Constants.SF_PERMISSION_APEX_PAGE = 'PageAccesses';
Constants.SF_PERMISSION_CUSTOM_APP = 'CustomApplication';
Constants.SF_PERMISSION_CUSTOM_OBJ = 'CustomObject';
Constants.SF_PERMISSION_CUSTOM_FIELD = 'CustomField';
Constants.SF_PERMISSION_CUSTOM_TAB = 'CustomTab';
Constants.SF_PERMISSION_SET = 'PermissionSet';
Constants.SF_PERMISSION_PROFILE = 'Profile';
Constants.SF_PERMISSION_RECORD_TYPE = 'RecordType';
Constants.SF_PERMISSION_LAYOUT = 'Layout';
Constants.DEFAULT_PROJECT_FILE_NAME = 'sf-project.json';
Constants.DEFAULT_SFDC_LOGIN_URL = 'https://login.salesforce.com';
Constants.DEFAULT_PACKAGE_VERSION = '49.0';
Constants.ENOENT = 'ENOENT';
Constants.CONTENT_TYPE_APPLICATION = 'application/octetstream';
Constants.HEADERS_CONTENT_TYPE = 'content-type';
Constants.METADATA_FILE_SUFFIX = '-meta.xml';
Constants.HTTP_STATUS_REDIRECT = [301];
Constants.EOL = os.EOL;
Constants.CR = '\r';
Constants.LF = '\n';
Constants.CONENTVERSION_MAX_SIZE = 37000000;
Constants.MIME_JSON = 'application/json';
Constants.DEFAULT_CSV_TEXT_WRAPPERS = ['"'];
Constants.MAX_EXCEL_LENGTH = 32767;
Constants.CUSTOM_SUFFIX = '__c';
exports.default = Constants;
//# sourceMappingURL=constants.js.map