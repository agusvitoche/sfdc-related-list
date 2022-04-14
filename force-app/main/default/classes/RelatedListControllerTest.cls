/**
 * @description       : Test class for RelatedListController
 * @author            : Agustín M. Etcheverry
 * @last modified on  : 04-15-2022
 * @last modified by  : Agustín M. Etcheverry
**/
@isTest()
public with sharing class RelatedListControllerTest {

    @isTest
    public static void testInit() {

        List<Account> account = NB_TestDataFactory.crearListaCuentas(1);
        Contact cnt = new Contact(LastName = 'test', AccountId = account[0].Id);
        insert cnt;
        
        Map<String, Object> requestMap = new Map<String, Object>();
        requestMap.put(NB_APX_RelatedListController.FIELDS_PARAM, 'AccountId, LastName');
        requestMap.put(NB_APX_RelatedListController.RELATED_FIELD_API_NAME_PARAM, 'AccountId');
        requestMap.put(NB_APX_RelatedListController.RECORD_ID_PARAM, account[0].Id);
        requestMap.put(NB_APX_RelatedListController.NUMBER_OF_RECORDS_PARAM, 1);
        requestMap.put(NB_APX_RelatedListController.SOBJECT_API_NAME_PARAM, 'Contact');
        requestMap.put(NB_APX_RelatedListController.SORTED_BY_PARAM, 'Name');
        requestMap.put(NB_APX_RelatedListController.SORTED_DIRECTION_PARAM, 'ASC');
        requestMap.put(NB_APX_RelatedListController.CUSTOM_FILTERS_PARAM, 'LastName != null');
        System.debug('RelatedListControllerTest - testInit - requestMap: ' + requestMap);
        
        String jsonData = NB_APX_RelatedListController.initData(JSON.serialize(requestMap));
        System.debug('RelatedListControllerTest - testInit - jsonData: ' + jsonData);

        Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(jsonData);
        System.debug('RelatedListControllerTest - testInit - responseMap: ' + responseMap);

        List<Object> records = (List<Object>)responseMap.get(NB_APX_RelatedListController.RECORDS_PARAM);
        System.debug('RelatedListControllerTest - testInit - records: ' + records);
        System.assert(!records.isEmpty());
    }
    
    @isTest
    public static void testInitException() {

        List<Account> account = NB_TestDataFactory.crearListaCuentas(1);
        Contact cnt = new Contact(LastName = 'test', AccountId = account[0].Id);
        insert cnt;
        
        Map<String, Object> requestMap = new Map<String, Object>();
        requestMap.put(NB_APX_RelatedListController.FIELDS_PARAM, 'AccountId, LastName, QQQ');
        requestMap.put(NB_APX_RelatedListController.RELATED_FIELD_API_NAME_PARAM, 'AccountId');
        requestMap.put(NB_APX_RelatedListController.RECORD_ID_PARAM, cnt.Id);
        requestMap.put(NB_APX_RelatedListController.NUMBER_OF_RECORDS_PARAM, 1);
        requestMap.put(NB_APX_RelatedListController.SOBJECT_API_NAME_PARAM, 'Contact');
        requestMap.put(NB_APX_RelatedListController.SORTED_BY_PARAM, 'Name');
        requestMap.put(NB_APX_RelatedListController.SORTED_DIRECTION_PARAM, 'ASC');
        System.debug('RelatedListControllerTest - testInit - requestMap: ' + requestMap);
        
        try {
            String jsonData = NB_APX_RelatedListController.initData(JSON.serialize(requestMap));
            System.debug('RelatedListControllerTest - testInit - jsonData: ' + jsonData);
    
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(jsonData);
            System.debug('RelatedListControllerTest - testInit - responseMap: ' + responseMap);
    
            List<Object> records = (List<Object>)responseMap.get(NB_APX_RelatedListController.RECORDS_PARAM);
            System.debug('RelatedListControllerTest - testInit - records: ' + records);
            System.assert(!records.isEmpty());
        } catch (Exception e) {
            System.debug('RelatedListControllerTest - testInit - ERROR: ' + e.getMessage());
            System.assert(true);
        }
    }

}