@IsTest
public with sharing class SfPackApexTest {

    @IsTest
    static void dummyMethodTest() {
        Test.startTest();

        string result = sfPackApex.dummyMethod('');
        
        Test.stopTest();

        Assert.areEqual('', result);
        
    }
}