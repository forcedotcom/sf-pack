# sf-pack

SF CLI Extensions from Salesforce Customer Success Group (CSG)

[![Version](https://img.shields.io/npm/v/sf-pack.svg)](https://www.npmjs.com/package/@salesforce/sf-pack)
[![Downloads/week](https://img.shields.io/npm/dw/sf-pack.svg)](https://www.npmjs.com/package/@salesforce/sf-pack)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)


<!-- toc -->
* [sf-pack](#sf-pack)
* [Debugging your plugin](#debugging-your-plugin)
* [Installation](#installation)
* [Commands](#commands)
<!-- tocstop -->

# Debugging your plugin

We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `sf package build ` command:

```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run.cmd package build -u ORG_ALIAS
```

Some common debug commands:

```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run.cmd admin user access -u ORG_ALIAS
$ NODE_OPTIONS=--inspect-brk bin/run.cmd admin user unmask -u ORG_ALIAS -l test.user@trail.com.trail
$ NODE_OPTIONS=--inspect-brk bin/run.cmd admin user unmask -u ORG_ALIAS -f ./unmask-options.json
$ NODE_OPTIONS=--inspect-brk bin/run.cmd admin workspace delete -u ORG_ALIAS
$ NODE_OPTIONS=--inspect-brk bin/run.cmd admin workspace delete -u ORG_ALIAS -l test.user@trail.com.trail
$ NODE_OPTIONS=--inspect-brk bin/run.cmd apex coverage clear -u ORG_ALIAS
$ NODE_OPTIONS=--inspect-brk bin/run.cmd apex coverage execute -u ORG_ALIAS
$ NODE_OPTIONS=--inspect-brk bin/run.cmd apex coverage:report -u ORG_ALIAS
$ NODE_OPTIONS=--inspect-brk bin/run.cmd apex scaffold -u ORG_ALIAS -s Account
$ NODE_OPTIONS=--inspect-brk bin/run.cmd apex scaffold -u ORG_ALIAS -o scaffold-options.json
$ NODE_OPTIONS=--inspect-brk bin/run.cmd api get -u ORG_ALIAS -m Account -i 068r0000003slVtAAI
$ NODE_OPTIONS=--inspect-brk bin/run.cmd api get -u ORG_ALIAS -m ContentVersion.VersionData -i 068r0000003slVtAAI,068r0000003slVtAAB -f MyOrg-{Id}.pdf
$ NODE_OPTIONS=--inspect-brk bin/run.cmd api file get -u ORG_ALIAS -r ./test/files/api/ContentVersionGet.csv -f test/files/api/cvFiles
$ NODE_OPTIONS=--inspect-brk bin/run.cmd api file get -u ORG_ALIAS -r test/ContentVersionIds.csv -f ./Files
$ NODE_OPTIONS=--inspect-brk bin/run.cmd api file get -u ORG_ALIAS -r test/ContentVersionIds.csv -e FileExtension -f ./Files
$ NODE_OPTIONS=--inspect-brk bin/run.cmd api file post -u ORG_ALIAS -r test/files/api/ContentVersion.csv -f test/files/api/ContentVersion
$ NODE_OPTIONS=--inspect-brk bin/run.cmd package build -u ORG_ALIAS -o package-options.json
$ NODE_OPTIONS=--inspect-brk bin/run.cmd package build -u ORG_ALIAS -s -a
$ NODE_OPTIONS=--inspect-brk bin/run.cmd package build -f deploy
$ NODE_OPTIONS=--inspect-brk bin/run.cmd package merge -s ./test/commands/merge/package-a.xml -d ./test/commands/merge/package-b.xml
$ NODE_OPTIONS=--inspect-brk bin/run.cmd package permissions -u ORG_ALIAS -x manifest/package-profile.xml
$ NODE_OPTIONS=--inspect-brk bin/run.cmd schema dictionary -u ORG_ALIAS
$ NODE_OPTIONS=--inspect-brk bin/run.cmd schema profile retrieve -u ORG_ALIAS -n Admin
$ NODE_OPTIONS=--inspect-brk bin/run.cmd schema template -m Account,Case
$ NODE_OPTIONS=--inspect-brk bin/run.cmd schema usage -m Account,Case
$ NODE_OPTIONS=--inspect-brk bin/run.cmd source permissions -p force-app
$ NODE_OPTIONS=--inspect-brk bin/run.cmd source profile -u ORG_ALIAS -m -o test
$ NODE_OPTIONS=--inspect-brk bin/run.cmd source delta md5 -m test/md5.test.txt -s test/force-app -d test/deploy
$ NODE_OPTIONS=--inspect-brk bin/run.cmd source delta git -g test/git-full-dir.test.txt -s test/force-app -d test/deploy
$ NODE_OPTIONS=--inspect-brk bin/run.cmd source delta git -o delta-options.json
$ NODE_OPTIONS=--inspect-brk bin/run.cmd source xpath -o xpath-options.json
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program.
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
   ![Debug image](.images/vscodeScreenshot.png)
   Congrats, you are debugging!

# Installation

If you are contributing to this repo - you can just link the plugin to SF CLI:

```
sf plugins link
```

Otherwise install the plug-in:

```
sf plugins install @salesforce/sf-pack
```
or

```
sf plugins install https://github.com/forcedotcom/sf-pack
```

Verify link/install:

```
sf sf-pack -h
```

NOTE: [Installing unsigned plugins automatically](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm#sfdx_setup_allowlist)

# Commands

<!-- commands -->
* [`sf admin user access`](#sf-admin-user-access)
* [`sf admin user unmask`](#sf-admin-user-unmask)
* [`sf admin workspace delete`](#sf-admin-workspace-delete)
* [`sf apex coverage clear`](#sf-apex-coverage-clear)
* [`sf apex coverage execute`](#sf-apex-coverage-execute)
* [`sf apex coverage report`](#sf-apex-coverage-report)
* [`sf apex scaffold`](#sf-apex-scaffold)
* [`sf api eventlog`](#sf-api-eventlog)
* [`sf api file get`](#sf-api-file-get)
* [`sf api file post`](#sf-api-file-post)
* [`sf api get`](#sf-api-get)
* [`sf api query`](#sf-api-query)
* [`sf package build`](#sf-package-build)
* [`sf package merge`](#sf-package-merge)
* [`sf package permissions`](#sf-package-permissions)
* [`sf schema dictionary`](#sf-schema-dictionary)
* [`sf schema profile retrieve`](#sf-schema-profile-retrieve)
* [`sf schema template`](#sf-schema-template)
* [`sf schema usage`](#sf-schema-usage)
* [`sf source delta git`](#sf-source-delta-git)
* [`sf source delta md5`](#sf-source-delta-md5)
* [`sf source permissions`](#sf-source-permissions)
* [`sf source profile`](#sf-source-profile)
* [`sf source xpath`](#sf-source-xpath)

## `sf admin user access`

Generates a report which defines user access via PermissionSet to Salesforce Apps.

```
USAGE
  $ sf admin user access -o <value> [--json] [--flags-dir <value>] [-l <value>] [-r <value>]

FLAGS
  -l, --appList=<value>     A comma delimited list of Apps to check access for.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -r, --report=<value>      The optional path for the generated report.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Generates a report which defines user access via PermissionSet to Salesforce Apps.

EXAMPLES
  $ sf admin user access -u myOrgAlias
      Creates a report UserAccess-myOrgAlias.xlsx on User access to all the Apps based on PermissionSets and Profiles.

  $ sf admin user access -u myOrgAlias -l 'Sales','Platform'
      Creates a report UserAccess-myOrgAlias.xlsx on User access to the specified Apps based on PermissionSets and Profiles.
```

## `sf admin user unmask`

Removes the .invalid extension from a User's email address. This extension is automatically added when a sandbox is refreshed.

```
USAGE
  $ sf admin user unmask -o <value> [--json] [--flags-dir <value>] [-l <value>] [-f <value>]

FLAGS
  -f, --userFile=<value>    A file which contains a list of usernames for the User objects to update.
  -l, --userList=<value>    A comma delimited list of usernames for the User objects to update.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Removes the .invalid extension from a User's email address. This extension is automatically added when a sandbox is
  refreshed.

EXAMPLES
  $ sf admin user unmask -u myOrgAlias -l 'user1@sf.com, user2@sf.com, user3@sf.com'
      Removes the .invalid extension from the email address associated to the list of specified users in the specified Org.

  $ sf admin user unmask -u myOrgAlias -f qa-users.txt
      Removes the .invalid extension from the email address associated to the list of users in the specified file in the specified Org.
```

## `sf admin workspace delete`

Deletes the Developer Console IDEWorkspace object for the specified user(s).

```
USAGE
  $ sf admin workspace delete -o <value> [--json] [--flags-dir <value>] [-l <value>]

FLAGS
  -l, --userList=<value>    A comma delimited list of usernames to reset workspaces for.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Deletes the Developer Console IDEWorkspace object for the specified user(s).

EXAMPLES
  $ sf admin workspace delete -u myOrgAlias
      Deletes the Developer Console IDEWorkspace objects for the specified target username (-u).

  $ sf admin workspace delete -u myOrgAlias -l 'user1@sf.com, user2@sf.com, user3@sf.com'
      Deletes the Developer Console IDEWorkspace objects for the specified list of users (-l).
```

## `sf apex coverage clear`

Clears the Apex Code Coverage data from the specified Org.

```
USAGE
  $ sf apex coverage clear -o <value> [--json] [--flags-dir <value>] [-m <value>] [-n <value>]

FLAGS
  -m, --metadatas=<value>            An optional comma separated list of metadata to include. The defaults are:
                                     (ApexCodeCoverageAggregate.)
  -n, --classOrTriggerNames=<value>  An optional comma separated list of class or trigger names to include
  -o, --target-org=<value>           (required) Username or alias of the target org. Not required if the `target-org`
                                     configuration variable is already set.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Clears the Apex Code Coverage data from the specified Org.

EXAMPLES
  $ sf apex coverage clear -u myOrgAlias
      Deletes the existing instances of ApexCodeCoverageAggregate from the specific Org.
```

## `sf apex coverage execute`

Executes Apex tests and includes Code Coverage metrics.

```
USAGE
  $ sf apex coverage execute -o <value> [--json] [--flags-dir <value>] [-w <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -w, --wait=<value>        The optional wait time (minutes) for test execution to complete. A value of -1 means
                            infinite wait. A value of 0 means no wait. The default is -1

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Executes Apex tests and includes Code Coverage metrics.

EXAMPLES
  $ sf apex coverage execute -u myOrgAlias
      Enqueues Apex Tests to be run in myOrgAlias with Code Coverage metrics. The command block until all tests have completed.

  $ sf  apex coverage execute -u myOrgAlias -w 30
      Enqueues Apex Tests to be run in myOrgAlias with Code Coverage metrics and waits up to 30 minutes for test completion.

  $ sf apex coverage execute -u myOrgAlias -w 0
      Enqueues Apex Tests to be run in myOrgAlias with Code Coverage metrics and returns immediately.
```

## `sf apex coverage report`

Pull Code Coverage metrics and generates a report.

```
USAGE
  $ sf apex coverage report -o <value> [--json] [--flags-dir <value>] [-r <value>] [-w <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -r, --report=<value>      The optional path for the generated report.
  -w, --wait=<value>        The optional wait time (minutes) for test execution to complete. A value of -1 means
                            infinite wait. A value of 0 means no wait. The default is -1

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Pull Code Coverage metrics and generates a report.

EXAMPLES
  $ sf apex coverage report -u myOrgAlias -r myCodeCoverageReport.xlsx
      Pulls the Code Coverage metrics from myOrgAlias and generates a CodeCoverageReport-myOrgAlias.xlsx report.
```

## `sf apex scaffold`

Generates Apex test classes (and cls-meta files) for specified CustomObjects.

```
USAGE
  $ sf apex scaffold -s <value> -o <value> [--json] [--flags-dir <value>] [-o <value>]

FLAGS
  -o, --options=<value>     A file containing the Apex Test scaffold options. Specifying this option will create the
                            file if it doesn't exist already.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -s, --sobjects=<value>    (required) A comma separated list of SObject types generate Apex Test classes for. This list
                            overrides any SObjects list in the options file.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Generates Apex test classes (and cls-meta files) for specified CustomObjects.

EXAMPLES
  $ sf apex scaffold -u myOrgAlias -s Account,MyObject__c'
      Generates AccountTest.cls & MyObjectTest.cls Apex test classes (and cls-meta files) for the Account & MyObject__c SObject types. Random values assigned to required fields by default

  $ sf apex scaffold -u myOrgAlias -o scaffold-options.json
      Generates Apex test classes (and cls-meta files) for specified CustomObjects. The specified options file is used.
```

## `sf api eventlog`

Retrieves EventLog files from a Salesforce org based on the SOQL query pulled from the options file.

```
USAGE
  $ sf api eventlog -o <value> [--json] [--flags-dir <value>] [-o <value>]

FLAGS
  -o, --options=<value>     A file containing the package build options. Specifying this option will create the file if
                            it doesn't exist already.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Retrieves EventLog files from a Salesforce org based on the SOQL query pulled from the options file.

EXAMPLES
  $ sf api eventlog  -u myOrgAlias -o options/eventlog-options.json
      Retrieves the EventLog files from the myOrgAlias Org for the option specified in the options/eventlog-options.json file.
      $ sf api eventlog -o options/eventlog-options.json
      Retrieves the EventLog files from the default Org for the option specified in the options/eventlog-options.json file.
```

## `sf api file get`

GETs ContentVersion files from the Salesforce instance.

```
USAGE
  $ sf api file get -r <value> -o <value> [--json] [--flags-dir <value>] [-e <value>] [-c <value>] [-f <value>]
    [-a] [-m <value>]

FLAGS
  -a, --allornothing        Set this flag to stop the process on the first error
  -c, --columns=<value>     A comma separated list of the columns to use from the CSV file. If not specified, all the
                            columns are used.
  -e, --ext=<value>         OPTIONAL: Specify the CSV column name for file extension to append to the file.
  -f, --filespath=<value>   The directory which contains the files to get/post
  -m, --metadata=<value>    The metadata to execute the API against. The dot operator can be used to retrieve a specific
                            field (i.e. ContentVersion.VersionData)
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -r, --records=<value>     (required) The Path to the file (CSV) containing the ContentVersion record data to act on

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  GETs ContentVersion files from the Salesforce instance.

EXAMPLES
  $ sf api file get -u myOrgAlias -r ContentVersions.csv  -f ./output/files
      Downloads the ContentVersion records defined in ContentVersions.csv and writes them to './output/files/{Id}'.

  NOTE: the ContentVersion.csv file must have an Id column
```

## `sf api file post`

POSTs ContentVersion files using a multi-part message when necessary.

```
USAGE
  $ sf api file post -r <value> -o <value> [--json] [--flags-dir <value>] [-c <value>] [-f <value>] [-a] [-m
    <value>]

FLAGS
  -a, --allornothing        Set this flag to stop the process on the first error
  -c, --columns=<value>     A comma separated list of the columns to use from the CSV file. If not specified, all the
                            columns are used.
  -f, --filespath=<value>   The directory which contains the files to get/post
  -m, --metadata=<value>    The metadata to execute the API against. The dot operator can be used to retrieve a specific
                            field (i.e. ContentVersion.VersionData)
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -r, --records=<value>     (required) The Path to the file (CSV) containing the ContentVersion record data to act on

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  POSTs ContentVersion files using a multi-part message when necessary.

EXAMPLES
  $ sf api file post -u myOrgAlias -r ContentVersions.csv
      Uploads the ContentVersion records defined in ContentVersions.csv using the {id} named files in ./ContentVersion.

  $ sf api file post  -u myOrgAlias -r ContentVersions.csv -c ContentDocumentId,VersionData,PathOnClient
      Uploads the ContentVersion records defined in ContentVersions.csv using only the columns: ContentDocumentId,VersionData,PathOnClient.

  $ sf api file post  -u myOrgAlias -r ContentVersions.csv -a
      Uploads the ContentVersion records defined in ContentVersions.csv. The whole process will stop on the first failure.
```

## `sf api get`

Performs the GET REST action against the specified URL/URI.

```
USAGE
  $ sf api get -m <value> -i <value> -o <value> [--json] [--flags-dir <value>] [-f <value>] [-t]

FLAGS
  -f, --file=<value>        OPTIONAL: The output folder path for the files. The current directory is the default.
  -i, --ids=<value>         (required) A comma delimited list of Ids (or path to text file of Ids) to get. A file will
                            be written for each Id provided
  -m, --metadata=<value>    (required) The metadata to execute the API against. The dot operator can be used to retrieve
                            a specific field (i.e. ContentVersion.VersionData)
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -t, --tooling             Set to true to specify the Tooling API.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Performs the GET REST action against the specified URL/URI.

EXAMPLES
  $ sf api get -u myOrgAlias -m Account -i 068r0000003slVtAAI
      Performs the GET REST API action against the Account metadata type with an id of 068r0000003slVtAAI and writes the body to 068r0000003slVtAAI.json.

  $ sf api get -u myOrgAlias -t true -m Account -i 068r0000003slVtAAI -o ./output/files/{Id}.json
      Performs the GET REST API action against the Account metadata type with an id of 068r0000003slVtAAI and writes the body to ./output/files/068r0000003slVtAAI.json.

  $ sf api get -u myOrgAlias -m ContentVersion.VersionData -i 068r0000003slVtAAI -o ./output/files/{Id}.pdf
      Performs the GET REST API action against the ContentVersion metadata type with an id of 068r0000003slVtAAI and writes the VersionData field value body to 068r0000003slVtAAI.pdf.

  $ sf api get -u myOrgAlias -m ContentVersion.VersionData -i test/ContentVersionIds.txt -o ./output/files/{Id}.pdf
      Performs the GET REST API action against the ContentVersion metadata type for each of the ids contained in the test/ContentVersionIds.txt and writes the VersionData field value body to 068r0000003slVtAAI.pdf.

  NOTE: Not all metadata types support field data access.
```

## `sf api query`

Send the specified SOQL query to the Salesforce query API.

```
USAGE
  $ sf api query -q <value> -o <value> [--json] [--flags-dir <value>]

FLAGS
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -q, --query=<value>       (required) The SOQL query to send to the QUERY API

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Send the specified SOQL query to the Salesforce query API.

EXAMPLES
  $ sf api query -u myOrgAlias -q "SELECT Id, Name FROM Account"
      Performs the specified SOQL query against the query API endpoint and writes the JSON result to the console.
```

## `sf package build`

Builds a standard SF source format package file from the specified org's existing metadata.

```
USAGE
  $ sf package build -o <value> [--json] [--flags-dir <value>] [-x <value>] [-m <value>] [-o <value>] [-n <value>]
    [-f <value>] [-a]

FLAGS
  -a, --append              Set this flag to 'true' if you wish to append to the existing package.xml file. The default
                            (false) overwrites the existing file.
  -f, --folder=<value>      The path to the folder containing the MDAPI formatted files to create the package for.
  -m, --metadata=<value>    A comma separated list of metadata to include. This list overrides any exclude list in the
                            options file.
  -n, --namespaces=<value>  A comma separated list of namespaces to include when retrieving metadata. By default
                            namespaces are excluded.
  -o, --options=<value>     A file containing the package build options. Specifying this option will create the file if
                            it doesn't exist already.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -x, --package=<value>     The path to the package file to be generated. By default the path is 'package.xml'

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Builds a standard SF source format package file from the specified org's existing metadata.

EXAMPLES
  $ sf package build -o options/package-options.json -x manifest/package-acu.xml -u myOrgAlias
      Builds a SF package file (./manifest/package.xml) which contains all the metadata from the myOrgAlias.
      The options defined (options/package-options.json) are honored when building the package.

  $ sf package build -f deploy
      Builds a SF package file (./manifest/package.xml) from the MDAPI formatted data in the deploy folder .
```

## `sf package merge`

Merges one SF package file into another.

```
USAGE
  $ sf package merge -s <value> -d <value> -o <value> [--json] [--flags-dir <value>] [-c]

FLAGS
  -c, --compare              Include this flag to compare the two packages. Both packages will have common items
                             *removed*.
  -d, --destination=<value>  (required) The destination SF package which contains the merge results. It will be created
                             if it does not exist.
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
  -s, --source=<value>       (required) The source SF package. This package wins all conflict battles!

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Merges one SF package file into another.

EXAMPLES
  $ sf package merge -s manifest/package.xml -d manifest/package-sprint17.xml
      Merges package.xml into package-sprint17.xml

  $ sf package merge -s manifest/package-a.xml -d manifest/package-b.xml -c
      Compares package-a.xml to package-b.xml and removes common elements from BOTH packages - leaving only the differences.
```

## `sf package permissions`

Retrieve all metadata related to Profile security/access permissions.

```
USAGE
  $ sf package permissions -o <value> [--json] [--flags-dir <value>] [-x <value>] [-m <value>] [-n <value>]

FLAGS
  -m, --metadata=<value>    A comma separated list of the metadata types to include. This overrides the default list:
                            PermissionSet, Profile, ApexClass, PageAccesses, CustomApplication, CustomObject,
                            CustomField, CustomTab, RecordType, Layout.
  -n, --namespaces=<value>  A comma separated list of namespaces to include when retrieving metadata. By default
                            namespaces are excluded.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -x, --package=<value>     The path to the package file to be generated. By default the path is
                            'package-permissions.xml'

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Retrieve all metadata related to Profile security/access permissions.

EXAMPLES
  $ sf package permissions -u myOrgAlias
      Creates a package file (package-permissions.xml) which contains
      Profile & PermissionSet metadata related to PermissionSet, Profile, ApexClass, PageAccesses, CustomApplication, CustomObject, CustomField, CustomTab, RecordType, Layout permissions.

  $ sf package permissions -u myOrgAlias -m CustomObject,CustomApplication
      Creates a package file (package-permissions.xml) which contains
      Profile & PermissionSet metadata related to CustomObject & CustomApplication permissions.
```

## `sf schema dictionary`

Generates a DataDictionary-[Org].xlsx file from an Org's Object & Field metadata.

```
USAGE
  $ sf schema dictionary -o <value> [--json] [--flags-dir <value>] [-r <value>] [-n <value>] [-o <value>] [-t <value>]

FLAGS
  -n, --namespaces=<value>  A comma separated list of namespaces to include when retrieving metadata. By default
                            namespaces are excluded.
  -o, --options=<value>     OPTIONAL: A file containing the Data Dictionary options. Specifying this option will create
                            the file if it doesn't exist already.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -r, --report=<value>      The path for the data dictionary report XLSX file. This overrides the default:
                            DataDictionary-{ORG}.xlsx.
  -t, --tmpFile=<value>     OPTIONAL: The path of a pregenerated dictionary tmp file.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Generates a DataDictionary-[Org].xlsx file from an Org's Object & Field metadata.

EXAMPLES
  $ sf schema dictionary -u myOrgAlias
      Generates a DataDictionary-myOrgAlias.xlsx file from an Org's configured Object & Field metadata.
```

## `sf schema profile retrieve`

Retries Profiles from Org without need to generate package.xml

```
USAGE
  $ sf schema profile retrieve -n <value> -o <value> [--json] [--flags-dir <value>]

FLAGS
  -n, --names=<value>       (required) Comma separated profile names with out any extension.Example "Admin,Agent". 5
                            Profiles can be retrieved at a time
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Retries Profiles from Org without need to generate package.xml

EXAMPLES
      $ sf schema profile retrieve -u myOrgAlias -n "Admin,Support"
      Retrieves 5 profiles at a time. Default Path - force-app/main/default/profile
```

## `sf schema template`

Generates a DataTemplate-[Org].xlsx file from an Org's Object & Field metadata.

```
USAGE
  $ sf schema template -o <value> [--json] [--flags-dir <value>] [-r <value>] [-m <value>] [-o <value>]

FLAGS
  -m, --metadata=<value>    A comma separated list of metadata to include. This list overrides any exclude list in the
                            options file.
  -o, --options=<value>     OPTIONAL: A file containing the Data Template options. Specifying this option will create
                            the file if it doesn't exist already.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -r, --report=<value>      The path for the data template csv file(s). This overrides the default:
                            DataTemplate-{ORG}.csv.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Generates a DataTemplate-[Org].xlsx file from an Org's Object & Field metadata.

EXAMPLES
  $ sf schema template -u myOrgAlias
      Generates one or more DataTemplate-myOrgAlias.csv CSV import files for an Org's configured metadata.
```

## `sf schema usage`

Generates a custom field usage report for specified Objects.

```
USAGE
  $ sf schema usage -m <value> -o <value> [--json] [--flags-dir <value>] [-r <value>] [-n <value>]

FLAGS
  -m, --objects=<value>     (required) A comma separated list of standard or custom to include in the report.
  -n, --namespaces=<value>  A comma separated list of namespaces to include when retrieving metadata. By default
                            namespaces are excluded.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -r, --report=<value>      The path for the usage report XLSX file. This overrides the default:
                            CustomFieldUsage-{ORG}.xlsx.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Generates a custom field usage report for specified Objects.

EXAMPLES
  $ sf schema usage -u myOrgAlias
      Generates a CustomFieldUsage-myOrgAlias.xlsx report detailing the CustomField usage for the specified objects.
```

## `sf source delta git`

Uses a git-diff file to detect deltas. Generate a git-diff.txt diff file as follows: git --no-pager diff --name-status --no-renames -w <target branch> > git-diff.txt

```
USAGE
  $ sf source delta git [--json] [--flags-dir <value>] [-g <value>] [-o <value>] [-s <value>] [-d <value>] [-f
    <value>] [-i <value>] [-r <value>] [-c] [-a <value>]

FLAGS
  -a, --copyfulldir=<value>   Specifies a comma delimited list of directories where all files should be copied if one of
                              the files changed. The default list is:
                              aura,lwc,experiences,territory2Models,waveTemplates
  -c, --check                 Does a dry-run of a deployment. Inspect the log file for results. NOTE: This option is
                              ignored if no (d)estination option is provided.
  -d, --destination=<value>   The destination folder for the deltas.
  -f, --force=<value>         Path to a file containing folders & files to include in the delta destination. Will
                              override md5/git AND ignore file contents.
  -g, --git=<value>           The output of a git-diff command (https://git-scm.com/docs/git-diff)
  -i, --ignore=<value>        Path to a file containing folders & files to ignore. Will override md5/git file contents.
  -o, --options=<value>       A file containing the delta command options. Specifying this option will create the file
                              if it doesn't exist already.
  -r, --deletereport=<value>  Path to a file to write deleted files.
  -s, --source=<value>        The source folder to start the delta scan from.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Uses a git-diff file to detect deltas. Generate a git-diff.txt diff file as follows: git --no-pager diff --name-status
  --no-renames -w <target branch> > git-diff.txt

EXAMPLES
  $ sf source delta git -g git.txt -s force-app -d deploy
      Reads the specified -(g)it diff file 'git.txt' and uses it to identify the deltas in
      -(s)ource 'force-app' and copies them to -(d)estination 'deploy'
```

## `sf source delta md5`

Uses an MD5 hash file to detect deltas.

```
USAGE
  $ sf source delta md5 [--json] [--flags-dir <value>] [-m <value>] [-o <value>] [-s <value>] [-d <value>] [-f
    <value>] [-i <value>] [-r <value>] [-c] [-a <value>]

FLAGS
  -a, --copyfulldir=<value>   Specifies a comma delimited list of directories where all files should be copied if one of
                              the files changed. The default list is:
                              aura,lwc,experiences,territory2Models,waveTemplates
  -c, --check                 Does a dry-run of a deployment. Inspect the log file for results. NOTE: This option is
                              ignored if no (d)estination option is provided.
  -d, --destination=<value>   The destination folder for the deltas.
  -f, --force=<value>         Path to a file containing folders & files to include in the delta destination. Will
                              override md5/git AND ignore file contents.
  -i, --ignore=<value>        Path to a file containing folders & files to ignore. Will override md5/git file contents.
  -m, --md5=<value>           The MD5 hash list file to use
  -o, --options=<value>       A file containing the delta command options. Specifying this option will create the file
                              if it doesn't exist already.
  -r, --deletereport=<value>  Path to a file to write deleted files.
  -s, --source=<value>        The source folder to start the delta scan from.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Uses an MD5 hash file to detect deltas.

EXAMPLES
  $ sf source delta md5 -m md5.txt -s force-app -d deploy
      Reads the specified -(m)d5 file 'md5.txt' and uses it to identify the deltas in
      -(s)ource 'force-app' and copies them to -(d)estination 'deploy'
```

## `sf source permissions`

Generate a security report based on configured permissions.

```
USAGE
  $ sf source permissions -o <value> [--json] [--flags-dir <value>] [-p <value>] [-r <value>] [-f <value>]

FLAGS
  -f, --folders=<value>     OPTIONAL: A comma separated list of folders to include. This list overrides the defaults:
                            **/objects/*/*.object-meta.xml, **/objects/*/fields/*.field-meta.xml,
                            **/permissionsets/*.permissionset-meta.xml, **/profiles/*.profile-meta.xml.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -p, --source=<value>      OPTIONAL: The source folder to start the meta scan from. Overrides the project's default
                            package directory folder.
  -r, --report=<value>      OPTIONAL: The path for the permissions report XLSX file. This overrides the default:
                            PermissionsReport.xlsx.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Generate a security report based on configured permissions.
  The accuracy of this report is dependant on the configuration in the local project.
  It is suggested that a permissions package be created using the acu-pack:package:permissions
  command and that package is retrieved from the org prior to executing this command.

EXAMPLES
  $ sf source permissions -u myOrgAlias
      Reads security information from source-formatted configuration files (**/objects/*/*.object-meta.xml, **/objects/*/fields/*.field-meta.xml, **/permissionsets/*.permissionset-meta.xml, **/profiles/*.profile-meta.xml) located in default project source location and writes the 'PermissionsReport.xlsx' report file.
```

## `sf source profile`

Determines the compatibility for one or more profiles metadata files with a specified Org. WARNING: This command should be executed by a user with full read permissions to all objects & fields.

```
USAGE
  $ sf source profile -o <value> [--json] [--flags-dir <value>] [-p <value>] [-m] [-o <value>]

FLAGS
  -m, --modify              OPTIONAL: Setting this flag to true will updated the existing metadata to remove the
                            incompatible entries.
  -o, --output=<value>      OPTIONAL: The output folder path for the modified profile metadata files. The existing files
                            are overwritten if not specified.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.
  -p, --source=<value>      OPTIONAL: Comma separated path to the Profile and/or PermissionsSet  metadata to evaluate.
                            This overrides the defaults:
                            **/profiles/*.profile-meta.xml,**/permissionsets/*.permissionset-meta.xml.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Determines the compatibility for one or more profiles metadata files with a specified Org. WARNING: This command
  should be executed by a user with full read permissions to all objects & fields.

EXAMPLES
  $ sf source profile -u myOrgAlias
      Compares the profile metadata files in **/profiles/*.profile-meta.xml,**/permissionsets/*.permissionset-meta.xml to the specified Org to determine deployment compatibility.

  $ sf source profile -m true -u myOrgAlias
      Compares the profile metadata files in **/profiles/*.profile-meta.xml,**/permissionsets/*.permissionset-meta.xml to the specified Org to and updates the metadata files to ensure deployment compatibility.
```

## `sf source xpath`

Validates XML against xpath selects and known bad values.

```
USAGE
  $ sf source xpath -o <value> [--json] [--flags-dir <value>] [-o <value>]

FLAGS
  -o, --options=<value>     A file containing the XPathOptions json. Specifying this option will create the file if it
                            doesn't exist already.
  -o, --target-org=<value>  (required) Username or alias of the target org. Not required if the `target-org`
                            configuration variable is already set.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION

  Validates XML against xpath selects and known bad values.

EXAMPLES
  $ sf source xpath -o ./xpathOptions.json"
      Validates the project source from the x-path rules specified in 'xpath-options.json'
```
<!-- commandsstop -->
