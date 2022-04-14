/* eslint-disable guard-for-in */
/* eslint-disable no-console */
import initDataMethod from "@salesforce/apex/RelatedListController.initData";

export default class RelatedListHelper {

    /**
     * Obtener los registros del controlador en SFDC
     * @param   {Object} state  Variables para obtener los registros
     * @returns {Object}        Registros y metadatos del objecto actual
     */
    fetchData(state) {
        let jsonData = Object.assign({}, state);
        jsonData.numberOfRecords = state.numberOfRecords + 1;
        jsonData = JSON.stringify(jsonData);
        return initDataMethod({jsonData})
            .then(response => {
                const data = JSON.parse(response);
                return this.processData(data, state);
            })
            .catch(error => {
                console.log(error);
            });
    }

    /**
     * Genera los enlaces a los registros y el título del componente
     * @param   {Object} data   Datos devueltos por el componente en SFDC
     * @param   {Object} state  Variables para obtener los registros
     * @returns {Object}        Registros con información adicional (link a registro, título componente)
     */
    processData(data, state) {
        const records = data.records;
        this.generateLinks(records, state);
        if (records.length > state.numberOfRecords) {
            data.title = `${data.sObjectLabelPlural} ${state.postLabel}(${state.numberOfRecords}+)`;
        } else {
            data.title = `${data.sObjectLabelPlural} ${state.postLabel}(${Math.min(state.numberOfRecords, records.length)})`;
        }
        return data;
    }

    /**
     * Añade las acciones, si es necesario, a los registros de la lista
     * @param   {Array} columns               Columnas de la tabla
     * @param   {Boolean} showRowActions      Mostrar o no las acciones en cada registro
     * @param   {Boolean} showStandardActions Mostrar o no las acciones estándar (Editar y Eliminar)
     * @param   {Array} customActions         Acciones personalizadas en el parámetro custom-actions
     * @returns {Array}                       Columnas con las acciones añadidas
     */
    initColumnsWithActions(columns, showRowActions, showStandardActions, customActions) {

        if (!showRowActions) {
            return columns;
        }

        var rowActions = [];
        if (showStandardActions) {
            rowActions = [
                { label: 'Editar', name: 'edit'}, //TODO-LABEL
                { label: 'Eliminar', name: 'delete'} //TODO-LABEL
            ];
        }
        if (customActions.length) {
            rowActions.concat(customActions);
        }
        return [...columns, { type: 'action', typeAttributes: { rowActions: rowActions }, cellAttributes: { class: { fieldName: 'cssClass' }}}];
    }

    /**
     * Generar los enlaces para redirigir a la página de detalle de cada registro
     * @param   {Array} records     Registros de la tabla
     * @param   {Object} state      Variables para obtener los registros
     */
    generateLinks(records, state) {
        records.forEach(record => { 
            record.LinkName = '/' + record.Id;
            for (const propertyName in record) {
                const propertyValue = record[propertyName];
                if (typeof propertyValue === 'object') {
                    const relObject = record[propertyName];
                    for (const relProperty in relObject) {
                        record[propertyName + relProperty] = relObject[relProperty];
                    }
                    const newValue = propertyValue.Id ? ('/' + propertyValue.Id) : null;
                    if (newValue !== null) {
                        record[propertyName + '_LinkName'] = newValue;
                    }
                    this.flattenStucture(record, propertyName + '_', propertyValue);
                }
            }
        });
    }

    /**
     * Metodo recursivo para modificar la estructura de los registros y añadir los enlaces
     * @param   {Object} topObject          Registro a modificar
     * @param   {String} prefix             Prefijo del campo a crear/modificar
     * @param   {String} toBeFlattened      Nombre del campo a crear/modificar
     */
    flattenStucture(topObject, prefix, toBeFlattened) {
        for (const propertyName in toBeFlattened) {
            const propertyValue = toBeFlattened[propertyName];
            if (typeof propertyValue === 'object') {
                this.flattenStucture(topObject, prefix + propertyName + '_', propertyValue);
            } else {
                topObject[prefix + propertyName] = propertyValue;
            }
        }
    }

}