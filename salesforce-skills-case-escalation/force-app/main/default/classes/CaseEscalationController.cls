public with sharing class CaseEscalationController {

    @AuraEnabled(cacheable=true)
    public static List<Case> getOpenCases() {
        try {
            return [
                SELECT Id, CaseNumber, Subject, Status, Priority
                FROM Case
                WHERE Status != 'Closed'
                AND Status != 'Escalated'
                WITH SECURITY_ENFORCED
                ORDER BY CreatedDate DESC
                LIMIT 200
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void escalateCase(Id caseId, String reason, String newPriority) {
        if (caseId == null) {
            throw new AuraHandledException('Case ID is required.');
        }
        if (String.isBlank(reason)) {
            throw new AuraHandledException('Escalation reason is required.');
        }
        if (String.isBlank(newPriority)) {
            throw new AuraHandledException('New priority is required.');
        }

        try {
            Case caseRecord = [
                SELECT Id, Status, Priority
                FROM Case
                WHERE Id = :caseId
                WITH SECURITY_ENFORCED
                LIMIT 1
            ];

            caseRecord.Status = 'Escalated';
            caseRecord.Priority = newPriority;
            update caseRecord;

            CaseComment escalationComment = new CaseComment(
                ParentId = caseId,
                CommentBody = 'Escalation Reason: ' + reason,
                IsPublished = false
            );
            insert escalationComment;

        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
