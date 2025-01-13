import { Flags } from '@salesforce/sf-plugins-core';
import { CommandBase } from '../../../helpers/command-base.js';
import { SfQuery } from '../../../helpers/sf-query.js';
import { Office } from '../../../helpers/office.js';
export default class Report extends CommandBase {
    static defaultJobStatusWaitMax = -1;
    static description = CommandBase.messages.getMessage('apex.coverage.report.commandDescription');
    static defaultReportPath = 'CodeCoverageReport-{ORG}.xlsx';
    // public static testLevels = ['RunLocalTests', 'RunAllTestsInOrg', 'RunSpecifiedTests'];
    static examples = [
        `$ sf apex coverage report -u myOrgAlias -r myCodeCoverageReport.xlsx
    Pulls the Code Coverage metrics from myOrgAlias and generates a CodeCoverageReport-myOrgAlias.xlsx report.`,
    ];
    static flags = {
        report: Flags.file({
            char: 'r',
            description: CommandBase.messages.getMessage('apex.coverage.report.reportFlagDescription', [
                Report.defaultReportPath,
            ]),
        }),
        wait: Flags.integer({
            char: 'w',
            description: CommandBase.messages.getMessage('apex.coverage.report.waitDescription', [
                Report.defaultJobStatusWaitMax,
            ]),
        }),
        ...CommandBase.commonFlags,
        ...CommandBase.flags,
    };
    async runInternal() {
        const { flags } = await this.parse(Report);
        this.UX.log('Checking for pending tests...');
        const waitCountMaxSeconds = (flags.wait || Report.defaultJobStatusWaitMax) * 60;
        let recordCount = 0;
        for await (recordCount of SfQuery.waitForApexTests(this.org, null, waitCountMaxSeconds)) {
            if (recordCount === 0) {
                break;
            }
        }
        if (recordCount !== 0) {
            this.raiseError(`${recordCount} Apex Test(s) are still executing - please try again later.`);
        }
        // Get Code Coverage Report
        this.UX.log('Getting Code Coverage Report Data.');
        const codeCoverage = await SfQuery.getCodeCoverage(this.org);
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
        const records = await SfQuery.queryOrg(this.org, query);
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
        Office.writeXlxsWorkbook(workbookMap, reportPath);
        this.UX.log(`${reportPath} written.`);
    }
}
//# sourceMappingURL=report.js.map