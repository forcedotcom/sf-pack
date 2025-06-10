import os from 'node:os';

export default class Constants {
  public static readonly DEFAULT_XML_NAMESPACE = 'http://soap.sforce.com/2006/04/metadata';
  public static readonly METADATA_COVERAGE_REPORT_URL =
    'https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report';
  public static readonly DEFAULT_PACKAGE_NAME = 'package.xml';
  public static readonly DEFAULT_PACKAGE_PATH = 'manifest/' + Constants.DEFAULT_PACKAGE_NAME;
  public static readonly SF_CONFIG_DEFAULT_USERNAME = 'target-org';
  public static readonly SF_CONFIG_MAX_QUERY_LIMIT = 'org-max-query-limit';
  public static readonly SF_PERMISSION_APEX_CLASS = 'ApexClass';
  public static readonly SF_PERMISSION_APEX_PAGE = 'PageAccesses';
  public static readonly SF_PERMISSION_CUSTOM_APP = 'CustomApplication';
  public static readonly SF_PERMISSION_CUSTOM_OBJ = 'CustomObject';
  public static readonly SF_PERMISSION_CUSTOM_FIELD = 'CustomField';
  public static readonly SF_PERMISSION_CUSTOM_TAB = 'CustomTab';
  public static readonly SF_PERMISSION_SET = 'PermissionSet';
  public static readonly SF_PERMISSION_PROFILE = 'Profile';
  public static readonly SF_PERMISSION_RECORD_TYPE = 'RecordType';
  public static readonly SF_PERMISSION_LAYOUT = 'Layout';
  public static readonly DEFAULT_PROJECT_FILE_NAME = 'sf-project.json';
  public static readonly DEFAULT_SFDC_LOGIN_URL = 'https://login.salesforce.com';
  public static readonly DEFAULT_PACKAGE_VERSION = '49.0';
  public static readonly ENOENT = 'ENOENT';
  public static readonly CONTENT_TYPE_APPLICATION = 'application/octetstream';
  public static readonly CONTENT_TYPE_IMAGE = 'image/png';
  public static readonly CONTENT_TYPE_CSV = 'text/csv';
  public static readonly CONTENT_TYPE_TEXT = 'text/plain';
  public static readonly HEADERS_CONTENT_TYPE = 'content-type';
  public static readonly METADATA_FILE_SUFFIX = '-meta.xml';
  public static readonly HTTP_STATUS_REDIRECT = [301];
  public static readonly EOL = os.EOL;
  public static readonly CR = '\r';
  public static readonly LF = '\n';
  public static readonly CONTENT_VERSION_MAX_SIZE = 37_000_000;
  public static readonly MIME_JSON = 'application/json';
  public static readonly DEFAULT_CSV_TEXT_WRAPPERS = ['"'];
  public static readonly MAX_EXCEL_LENGTH = 32_767;
  public static readonly CUSTOM_SUFFIX = '__c';
  public static readonly DEFAULT_XML_EOF = '\n';
  public static readonly DEFAULT_XML_ENCODING = 'utf-8';
}
