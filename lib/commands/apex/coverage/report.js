"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const command_base_1 = require("../../../helpers/command-base");
const sf_query_1 = require("../../../helpers/sf-query");
const office_1 = require("../../../helpers/office");
class Report extends command_base_1.CommandBase {
    async runInternal() {
        const { flags } = await this.parse(Report);
        this.UX.log('Checking for pending tests...');
        const waitCountMaxSeconds = (flags.wait || Report.defaultJobStatusWaitMax) * 60;
        let recordCount = 0;
        for await (recordCount of sf_query_1.SfQuery.waitForApexTests(this.org, null, waitCountMaxSeconds)) {
            if (recordCount === 0) {
                break;
            }
        }
        if (recordCount !== 0) {
            this.raiseError(`${recordCount} Apex Test(s) are still executing - please try again later.`);
        }
        // Get Code Coverage Report
        this.UX.log('Getting Code Coverage Report Data.');
        const codeCoverage = await sf_query_1.SfQuery.getCodeCoverage(this.org);
        codeCoverage.calculateCodeCoverage();
        const workbookMap = new Map();
        // Code Coverage
        workbookMap.set(`${this.orgAlias} Code Coverage`, [
            ['Total Classes', 'Total Lines', 'Total Covered', 'Total Uncovered', 'Total % Covered'],
            [
                `${codeCoverage.codeCoverage.length}`,
                `${codeCoverage.totalCoveredLines + codeCoverage.totalUncoveredLines}`,
                `${codeCoverage.totalCoveredLines}`,
                `${codeCoverage.totalUncoveredLines}`,
                `${codeCoverage.codeCoveragePercent.toFixed(3)}`,
            ],
        ]);
        // Code Coverage Details
        let sheetData = [['Class Name', 'Covered Lines', 'Uncovered Lines', '% Covered']];
        for (const codeCoverageItem of codeCoverage.codeCoverage) {
            sheetData.push([
                codeCoverageItem.name,
                `${codeCoverageItem.coveredLines.length}`,
                `${codeCoverageItem.uncoveredLines.length}`,
                `${codeCoverageItem.getCodeCoveragePercent().toFixed(3)}`,
            ]);
        }
        workbookMap.set('Code Coverage Details', sheetData);
        // Check Apex Test Failures
        const today = `${new Date().toJSON().slice(0, 10)}T00:00:00.000Z`;
        const query = `SELECT ApexClass.Name, AsyncApexJobId, ApexTestRunResultId, Message, MethodName, StackTrace, TestTimestamp FROM ApexTestResult WHERE SystemModstamp >= ${today} AND Outcome='Fail' ORDER BY ApexClass.Name, MethodName, SystemModstamp ASC`;
        const records = await sf_query_1.SfQuery.queryOrg(this.org, query);
        sheetData = [
            [
                'Class Name',
                'Method Name',
                'Error Message',
                'Stack Trace',
                'AsyncApexJobId',
                'ApexTestRunResultId',
                'TestTimestamp',
            ],
        ];
        for (const record of records) {
            sheetData.push([
                record.ApexClass?.Name,
                record.MethodName,
                record.Message,
                record.StackTrace,
                record.AsyncApexJobId,
                record.ApexTestRunResultId,
                record.TestTimestamp,
            ]);
        }
        workbookMap.set('Apex Test Failures', sheetData);
        const reportPath = flags.report || Report.defaultReportPath.replace(/\{ORG\}/, this.orgAlias);
        office_1.Office.writeXlxsWorkbook(workbookMap, reportPath);
        this.UX.log(`${reportPath} written.`);
    }
}
Report.defaultJobStatusWaitMax = -1;
Report.description = command_base_1.CommandBase.messages.getMessage('apex.coverage.report.commandDescription');
Report.defaultReportPath = 'CodeCoverageReport-{ORG}.xlsx';
// public static testLevels = ['RunLocalTests', 'RunAllTestsInOrg', 'RunSpecifiedTests'];
Report.examples = [
    `$ sf apex coverage report -u myOrgAlias -r myCodeCoverageReport.xlsx
    Pulls the Code Coverage metrics from myOrgAlias and generates a CodeCoverageReport-myOrgAlias.xlsx report.`,
];
Report.flags = {
    report: sf_plugins_core_1.Flags.file({
        char: 'r',
        description: command_base_1.CommandBase.messages.getMessage('apex.coverage.report.reportFlagDescription', [
            Report.defaultReportPath,
        ]),
    }),
    wait: sf_plugins_core_1.Flags.integer({
        char: 'w',
        description: command_base_1.CommandBase.messages.getMessage('apex.coverage.report.waitDescription', [
            Report.defaultJobStatusWaitMax,
        ]),
    }),
    ...command_base_1.CommandBase.commonFlags,
};
exports.default = Report;
//# sourceMappingURL=report.js.map