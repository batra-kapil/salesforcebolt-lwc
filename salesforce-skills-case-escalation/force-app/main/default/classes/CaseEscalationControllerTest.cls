@IsTest
private class CaseEscalationControllerTest {

    @TestSetup
    static void setupTestData() {
        TestDataFactory.createCases(200, 'New', 'Medium');
    }

    // ── getOpenCases ────────────────────────────────────────────────────────

    @IsTest
    static void testGetOpenCases_ReturnsBulkData() {
        Test.startTest();
        List<Case> result = CaseEscalationController.getOpenCases();
        Test.stopTest();

        Assert.areNotEqual(null, result, 'Result should not be null');
        Assert.areEqual(200, result.size(), 'Should return all 200 open cases');
    }

    @IsTest
    static void testGetOpenCases_ExcludesClosedCases() {
        List<Case> openCases = [SELECT Id FROM Case LIMIT 5];
        for (Case c : openCases) {
            c.Status = 'Closed';
        }
        update openCases;

        Test.startTest();
        List<Case> result = CaseEscalationController.getOpenCases();
        Test.stopTest();

        Assert.areEqual(195, result.size(), 'Should exclude the 5 closed cases');
        for (Case c : result) {
            Assert.areNotEqual('Closed', c.Status, 'Closed cases must not appear in results');
        }
    }

    @IsTest
    static void testGetOpenCases_ExcludesEscalatedCases() {
        List<Case> cases = [SELECT Id FROM Case LIMIT 3];
        for (Case c : cases) {
            c.Status = 'Escalated';
        }
        update cases;

        Test.startTest();
        List<Case> result = CaseEscalationController.getOpenCases();
        Test.stopTest();

        Assert.areEqual(197, result.size(), 'Should exclude the 3 already-escalated cases');
        for (Case c : result) {
            Assert.areNotEqual('Escalated', c.Status, 'Escalated cases must not appear in results');
        }
    }

    @IsTest
    static void testGetOpenCases_ReturnsExpectedFields() {
        Test.startTest();
        List<Case> result = CaseEscalationController.getOpenCases();
        Test.stopTest();

        Assert.isFalse(result.isEmpty(), 'Result should not be empty');
        Case sample = result[0];
        Assert.areNotEqual(null, sample.Id,         'Id should be populated');
        Assert.areNotEqual(null, sample.CaseNumber, 'CaseNumber should be populated');
        Assert.areNotEqual(null, sample.Subject,    'Subject should be populated');
        Assert.areNotEqual(null, sample.Status,     'Status should be populated');
        Assert.areNotEqual(null, sample.Priority,   'Priority should be populated');
    }

    // ── escalateCase – success paths ────────────────────────────────────────

    @IsTest
    static void testEscalateCase_SuccessWithHighPriority() {
        Case testCase = [SELECT Id, CaseNumber FROM Case LIMIT 1];

        Test.startTest();
        CaseEscalationController.escalateCase(testCase.Id, 'Customer impacted severely', 'High');
        Test.stopTest();

        Case updated = [SELECT Id, Status, Priority FROM Case WHERE Id = :testCase.Id];
        Assert.areEqual('Escalated', updated.Status,   'Status should be Escalated');
        Assert.areEqual('High',      updated.Priority,  'Priority should be High');

        List<CaseComment> comments = [
            SELECT Id, CommentBody, IsPublished
            FROM CaseComment
            WHERE ParentId = :testCase.Id
        ];
        Assert.areEqual(1, comments.size(), 'Exactly one CaseComment should be created');
        Assert.isTrue(
            comments[0].CommentBody.contains('Customer impacted severely'),
            'Comment body should contain the escalation reason'
        );
        Assert.isFalse(comments[0].IsPublished, 'Comment should be internal (not published)');
    }

    @IsTest
    static void testEscalateCase_SuccessWithCriticalPriority() {
        Case testCase = [SELECT Id FROM Case LIMIT 1];

        Test.startTest();
        CaseEscalationController.escalateCase(testCase.Id, 'Critical system outage', 'Critical');
        Test.stopTest();

        Case updated = [SELECT Id, Status, Priority FROM Case WHERE Id = :testCase.Id];
        Assert.areEqual('Escalated', updated.Status,   'Status should be Escalated');
        Assert.areEqual('Critical',  updated.Priority,  'Priority should be Critical');
    }

    // ── escalateCase – error/validation paths ───────────────────────────────

    @IsTest
    static void testEscalateCase_ErrorOnNullCaseId() {
        Test.startTest();
        try {
            CaseEscalationController.escalateCase(null, 'Some reason', 'High');
            Assert.fail('Expected AuraHandledException was not thrown');
        } catch (AuraHandledException e) {
            Assert.areNotEqual(null, e.getMessage(), 'Exception message should not be null');
        }
        Test.stopTest();
    }

    @IsTest
    static void testEscalateCase_ErrorOnBlankReason() {
        Case testCase = [SELECT Id FROM Case LIMIT 1];

        Test.startTest();
        try {
            CaseEscalationController.escalateCase(testCase.Id, '   ', 'High');
            Assert.fail('Expected AuraHandledException was not thrown');
        } catch (AuraHandledException e) {
            Assert.areNotEqual(null, e.getMessage(), 'Exception message should not be null');
        }
        Test.stopTest();
    }

    @IsTest
    static void testEscalateCase_ErrorOnBlankPriority() {
        Case testCase = [SELECT Id FROM Case LIMIT 1];

        Test.startTest();
        try {
            CaseEscalationController.escalateCase(testCase.Id, 'Valid reason', '');
            Assert.fail('Expected AuraHandledException was not thrown');
        } catch (AuraHandledException e) {
            Assert.areNotEqual(null, e.getMessage(), 'Exception message should not be null');
        }
        Test.stopTest();
    }

    @IsTest
    static void testEscalateCase_ErrorOnNonExistentCaseId() {
        // Create a case, capture the Id, then delete it so the Id is valid-format but non-existent
        Case tempCase = new Case(Subject = 'Temp', Status = 'New', Priority = 'Low', Origin = 'Phone');
        insert tempCase;
        Id deletedCaseId = tempCase.Id;
        delete tempCase;

        Test.startTest();
        try {
            CaseEscalationController.escalateCase(deletedCaseId, 'Some reason', 'High');
            Assert.fail('Expected AuraHandledException was not thrown');
        } catch (AuraHandledException e) {
            Assert.areNotEqual(null, e.getMessage(), 'Exception message should not be null');
        }
        Test.stopTest();
    }

    // ── bulk escalation ─────────────────────────────────────────────────────

    @IsTest
    static void testEscalateCase_BulkOf200Cases() {
        // Verify the 200-case dataset is in place, then escalate a subset that stays
        // within the 150-DML-statement governor limit (each call = 1 update + 1 insert = 2 DML)
        List<Case> allCases = [SELECT Id FROM Case];
        Assert.areEqual(200, allCases.size(), 'Should have 200 test cases in setup');

        // Query 200 cases then escalate the first 10 to validate bulk data handling
        List<Case> sampleCases = [SELECT Id FROM Case LIMIT 10];

        Test.startTest();
        for (Case c : sampleCases) {
            CaseEscalationController.escalateCase(c.Id, 'Bulk escalation test', 'Critical');
        }
        Test.stopTest();

        List<Id> sampleIds = new List<Id>();
        for (Case c : sampleCases) {
            sampleIds.add(c.Id);
        }

        List<Case> updatedCases = [SELECT Id, Status, Priority FROM Case WHERE Id IN :sampleIds];
        Assert.areEqual(10, updatedCases.size(), 'All 10 escalated cases should be retrievable');
        for (Case c : updatedCases) {
            Assert.areEqual('Escalated', c.Status,  'Status should be Escalated');
            Assert.areEqual('Critical',  c.Priority, 'Priority should be Critical');
        }

        List<CaseComment> comments = [
            SELECT Id FROM CaseComment
            WHERE ParentId IN :sampleIds
        ];
        Assert.areEqual(10, comments.size(), 'Each escalated case should have one CaseComment');
    }
}
