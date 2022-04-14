/**
 * @description       : Apex Controller for related lists LWC
 * @author            : Agustín M. Etcheverry
 * @last modified on  : 04-15-2022
 * @last modified by  : Agustín M. Etcheverry
**/
public with sharing class RelatedListController {
    
    /**
     * CONSTANTS
     */
    public static final String FIELDS_PARAM = 'fields';
    public static final String NUMBER_OF_RECORDS_PARAM = 'numberOfRecords';
    public static final String RECORD_ID_PARAM = 'recordId';
    public static final String SOBJECT_API_NAME_PARAM = 'sObjectApiName';
    public static final String SOBJECT_LABEL_PARAM = 'sObjectLabel';
    public static final String SOBJECT_LABEL_PLURAL_PARAM = 'sObjectLabelPlural';
    public static final String PARENT_RELATIONSHIP_API_NAME_PARAM = 'parentRelationshipApiName';
    public static final String RELATED_FIELD_API_NAME_PARAM = 'relatedFieldApiName';
    public static final String SUB_QUERY_PARAM = 'subQuery';
    public static final String SORTED_DIRECTION_PARAM = 'sortedDirection';
    public static final String SORTED_BY_PARAM = 'sortedBy';
    public static final String CUSTOM_FILTERS_PARAM = 'customFilters';
    public static final String RECORDS_PARAM = 'records';
    public static final String ICON_NAME_PARAM = 'iconName';

    /**
	 * Recupera toda la información necesaria para pintar la tabla
	 * @param   String      Parámetros del componente en formato JSON
     * @return  String      Información que se pintará en la tabla
	 */
    @AuraEnabled
    public static String initData(String jsonData) {
        System.debug('RelatedListController - initData - START: ' + jsonData);

        Map<String, Object> responseMap = new Map<String, Object>();
        try {
            Map<String, Object> requestMap = (Map<String, Object>) JSON.deserializeUntyped(jsonData);
            responseMap.put(RECORDS_PARAM, getRecords(jsonData));

            String sObjectApiName = (String) requestMap.get(SOBJECT_API_NAME_PARAM);
            responseMap.put(ICON_NAME_PARAM, getIconName(sObjectApiName));
            String recordId = (String) requestMap.get(RECORD_ID_PARAM);
            String relatedFieldApiName = (String) requestMap.get(RELATED_FIELD_API_NAME_PARAM);
            responseMap.put(PARENT_RELATIONSHIP_API_NAME_PARAM, getParentRelationshipName(recordId, sObjectApiName, relatedFieldApiName));

            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(sObjectApiName);
            Schema.DescribeSObjectResult sObjectDescribe = sObjectType.getDescribe();
            responseMap.put(SOBJECT_LABEL_PARAM, sObjectDescribe.getLabel());
            responseMap.put(SOBJECT_LABEL_PLURAL_PARAM, sObjectDescribe.getLabelPlural());

        } catch (Exception e) {
            System.debug('RelatedListController - initData - ERROR: ' + e);
            throw new AuraHandledException(e.getMessage());
        }

        System.debug('RelatedListController - initData - END: ' + responseMap);
        return JSON.serialize(responseMap);
    }

    /**
	 * Recupera los registros de la tabla
	 * @param   String          Información para construir la consulta
     * @return  List<SObject>   Registros a mostrar en la tabla
	 */
    @AuraEnabled
    public static List<SObject> getRecords(String jsonData) {
        System.debug('RelatedListController - getRecords - START: ' + jsonData);

        List<SObject> records = new List<SObject>();
        try {
            Map<String, Object> requestMap = (Map<String, Object>) JSON.deserializeUntyped(jsonData);
            String fields = (String) requestMap.get(FIELDS_PARAM);
            String recordId = (String) requestMap.get(RECORD_ID_PARAM);
		    String relatedFieldApiName = (String) requestMap.get(RELATED_FIELD_API_NAME_PARAM);
		    String sObjectApiName = (String) requestMap.get(SOBJECT_API_NAME_PARAM);        
		    String orderBy = (String) requestMap.get(SORTED_BY_PARAM) + ' ' + (String) requestMap.get(SORTED_DIRECTION_PARAM);
		    String customFilters = (String) requestMap.get(CUSTOM_FILTERS_PARAM);
		    String subQuery = (String) requestMap.get(SUB_QUERY_PARAM);

            // Montar la query a partir de los parámetros
            String query = 'SELECT ' + fields + ' FROM ' + sObjectApiName + ' ';
            query += 'WHERE ' + relatedFieldApiName;
            if (!String.isBlank(subQuery)) {
                query += ' IN ' + subQuery;
            } else {
                query += ' = :recordId ';
            }
            if (!String.isBlank(customFilters)) {
                query += 'AND (' + customFilters + ') ';
            }
            query += 'ORDER BY ' + orderBy + ' LIMIT 10000';
            System.debug('RelatedListController - getRecords - query: ' + query);
            records = Database.query(String.escapeSingleQuotes(query));

        } catch (Exception e) {
            System.debug('RelatedListController - getRecords - ERROR: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }

        System.debug('RelatedListController - getRecords - END: ' + records);
        return records;
    }

    /**
	 * Recupera el nombre de la relación en el padre hacía el hijo
	 * @param   Id          Id del registro actual
     * @param   String      API Name del objeto hijo
     * @param   String      API Name del campo que relaciona el objeto hijo con su padre
     * @return  String      Nombre de la relación en el padre hacía el hijo
	 */
    private static String getParentRelationshipName(Id recordId, String childsObjectApiName, String relatedFieldApiName) {
        System.debug('RelatedListController - getParentRelationshipName - START: ' + recordId);
        System.debug('RelatedListController - getParentRelationshipName - childsObjectApiName: ' + childsObjectApiName);
        System.debug('RelatedListController - getParentRelationshipName - relatedFieldApiName: ' + relatedFieldApiName);

        String name = '';
        Schema.DescribeSObjectResult descrRes = recordId.getSObjectType().getDescribe();
        for (Schema.ChildRelationship cr : descrRes.getChildRelationships()) {
            if (cr.getChildSObject().getDescribe().getName() == childsObjectApiName
            && cr.getField().getDescribe().getName() == relatedFieldApiName) {
                name = cr.getRelationshipName();
                break;
            }
        }

        System.debug('RelatedListController - getParentRelationshipName - END: ' + name);
        return name;
    }

    /**
	 * Recuperar el icono del objeto actual
     * @param   String      API Name del objeto
     * @return  String      Icono del objeto
	 */
    @AuraEnabled
    public static String getIconName(String sObjectApiName) {
        System.debug('RelatedListController - getIconName - START: ' + sObjectApiName);

        String iconName = '';
        try {
            List<Schema.DescribeTabSetResult> tabSetDesc = Schema.describeTabs();
            List<Schema.DescribeTabResult> tabDesc = new List<Schema.DescribeTabResult>();
            List<Schema.DescribeIconResult> iconDesc = new List<Schema.DescribeIconResult>();

            for (Schema.DescribeTabSetResult tsr : tabSetDesc) {
                tabDesc.addAll(tsr.getTabs()); 
            }

            for (Schema.DescribeTabResult tr : tabDesc) {
                if (sObjectApiName == tr.getSobjectName()) {
                    if (tr.isCustom()) {
                        iconDesc.addAll(tr.getIcons());
                    } else {
                        iconName = 'standard:' + sObjectApiName.toLowerCase();
                    }
                }
            }

            for (Schema.DescribeIconResult ir : iconDesc) {
                if (ir.getContentType() == 'image/svg+xml'){
                    iconName = 'custom:' + ir.getUrl().substringBetween('custom/','.svg').substringBefore('_');
                    break;
                }
            }
        } catch (Exception e) {
            System.debug('RelatedListController - getIconName - ERROR: ' + e);
            throw new AuraHandledException(e.getMessage());
        }

        System.debug('RelatedListController - getIconName - END: ' + iconName);
        return iconName;
    }

}
