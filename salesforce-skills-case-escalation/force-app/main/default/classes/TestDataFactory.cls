@IsTest
public class TestDataFactory {

    public static List<Case> createCases(Integer count, String status) {
        return createCases(count, status, 'Medium');
    }

    public static List<Case> createCases(Integer count, String status, String priority) {
        List<Case> cases = new List<Case>();
        for (Integer i = 0; i < count; i++) {
            cases.add(new Case(
                Subject  = 'Test Case ' + i,
                Status   = status,
                Priority = priority,
                Origin   = 'Phone'
            ));
        }
        insert cases;
        return cases;
    }
}
