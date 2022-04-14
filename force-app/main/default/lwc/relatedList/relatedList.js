import { LightningElement, track, api } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import RelatedListHelper from "./relatedListHelper";

export default class RelatedList extends LightningElement {

    /**
     * PARÁMETROS DE CONFIGURACIÓN
     */
    @api recordId; // Id del registro actual, se rellena automáticamente
    @api iconName; // icon-name: Obligatorio. Nombre del icono del objeto que queremos representar en la lista relacionada. Referencia: https://www.lightningdesignsystem.com/icons/#standard
    @api iconColor; // icon-color: Obligatorio. Código hexadecimal o RGB del color de la pestaña del objeto que queremos representar en la lista relacionada.
    @api postLabel = ''; // post-label: Opcional. Texto adicional al nombre del objeto, para precisar mejor que dato se está mostrando en la lista relacionada.
    @api sObjectApiName; // s-object-api-name: Obligatorio. Nombre del objecto hijo. 
    @api relatedFieldApiName; // related-field-api-name: Obligatorio. Lookup/master-detail en el objeto hijo. Ruta desde el objeto hijo hasta el objecto padre, lo que utilizaríamos para filtrar una consulta SOQL. 
    @api subQuery; // sub-query: Opcional. Subquery para cuando no podemos llegar a los objetos a través de una relación directa
    @api numberOfRecords = 6; // number-of-records: Opcional. Por defecto 6. Número de registros por página, la cantidad de registros que se muestra al inicio y la cantidad de registros que se añaden cada vez que se da a “Ver Más”.
    @api sortedBy; // sorted-by: Obligatorio. Nombre del campo por el que ordenar. 
    @api sortedDirection = 'ASC'; // sorted-direction: Opcional. ASC ó DESC, por defecto ASC. 
    @api fields; // fields: Obligatorio. Lista de API Names de los campos a mostrar.
    @api columns; // columns: Obligatorio. Array de las columnas a mostrar, con sus tipos de datos. Referencia tipo datos: https://developer.salesforce.com/docs/component-library/bundle/lightning-datatable/documentation  
    @api customFilters = ''; // custom-filters: Opcional. Filtros adicionales a aplicar. 
    @api showNewButton = false; // show-new-button: Opcional. True ó false, por defecto false. Para mostrar o no el botón de nuevo registro en la cabecera del componente. 
    @api showRowActions = false; // show-row-actions: Opcional. True ó false, por defecto false. Para mostrar o no el selector de acciones en cada registro. 
    @api showStandardActions = false; // show-standard-actions: Opcional. True ó false, por defecto false. Para mostrar o no las acciones estándar (Editar y Eliminar) en cada registro. 
    @api customActions = []; // custom-actions: Opcional. Array de acciones personalizadas que se añadirán al selector de acciones de cada registro.  
    @api rowActionHandler; // row-action-handler: La acción que se ejecuta al hacer clic en las acciones de cada fila. Sobrescribe el comportamiento estándar. 

    @track state = {};
    helper = new RelatedListHelper();
    isLoadingTable = true;
    showViewMore = false;

    connectedCallback() {
        this.init();
    }
    handleRefreshData() {
        this.init();
    }
    
    /**
     * Comprueba si hay registros
     * @returns {Boolean}     True si al menos un registro para mostrar
     */
    get hasRecords() {
        return this.state.records != null && this.state.records.length;
    }
    /**
     * Construye la cláusula CSS para aplicar el color al fondo del icono
     * @returns {String}      Cláusula CSS
     */
    get iconStyle() {
        return `background-color: ${this.iconColor}`;
    }
    /**
     * Construye la URL para acceder al icono del objeto
     * @returns {String}      URL del icono png de 120 píxeles
     */
     get iconUrl() {
        return `https://salesforce.my.salesforce.com/img/icon/t4v35/custom/${this.iconName}_120.png`
    }

    /**
     * Inicializa todos los datos necesarios para mostrar la lista relacionada
     */
    async init() {

        this.state.showRelatedList = this.recordId != null;
        if (!(this.recordId && this.sObjectApiName && this.relatedFieldApiName && this.fields && this.columns)) {
            this.state.records = [];
            return;
        }

        // Si los parámetros se pasan desde Lightning Page, hay que convertir la String en un Array
        if (typeof this.columns == 'string') {
            this.columns = JSON.parse(this.columns);
        }
        if (typeof this.customActions == 'string') {
            this.customActions = JSON.parse(this.customActions);
        }

        this.state.fields = this.fields;
        this.state.relatedFieldApiName = this.relatedFieldApiName;
        this.state.subQuery = this.subQuery
        this.state.recordId = this.recordId;
        this.state.numberOfRecords = this.numberOfRecords;
        this.state.sObjectApiName = this.sObjectApiName;
        this.state.postLabel = this.postLabel + ' ';
        this.state.sortedBy = this.sortedBy;
        this.state.sortedDirection = this.sortedDirection;
        this.state.customFilters = this.customFilters;
        this.state.customActions = this.customActions;
        this.state.showNewButton = this.showNewButton;
        this.state.showRowActions = this.showRowActions;
        this.state.showStandardActions = this.showStandardActions;

        const data = await this.helper.fetchData(this.state);
        this.state.allRecords = data.records;
        this.state.records = data.records.slice(0, this.numberOfRecords);
        if (this.state.allRecords.length > this.numberOfRecords) {
            this.showViewMore = true;
        } else {
            this.showViewMore = false;
        }
        this.state.sObjectLabel = data.sObjectLabel;
        this.state.sObjectLabelPlural = data.sObjectLabelPlural;
        this.state.title = data.title;
        this.state.parentRelationshipApiName = data.parentRelationshipApiName;
        this.state.columns = this.helper.initColumnsWithActions(this.columns, this.showRowActions, this.showStandardActions, this.customActions);
        this.isLoadingTable = false;
        console.log(this.state)
        
    }

    /**
     * Manejar el evento de seleccionar una acción en una fila de la tabla
     * Se puede sobrescribir con el parámetro row-action-handler
     * @param {Object} event 
     */
    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        if (this.rowActionHandler) {
            this.rowActionHandler.call();
        } else {
            switch(actionName) {
                case 'delete':
                    this.handleDeleteRecord(row);
                    break;
                case 'edit':
                    this.handleEditRecord(row);
                    break;
                default:
            }
        }
    }

    /**
     * Redirigir a la página estándar con todos los registros relacionados
     */
    handleGoToRelatedList() {
        this[NavigationMixin.Navigate]({
            type: 'standard_recordRelationshipPage', 
            attributes: {
                recordId: this.recordId, 
                relationshipApiName: this.state.parentRelationshipApiName, 
                actionName: 'view', 
                objectApiName: this.sObjectApiName
            }
        });
    }

    /**
     * Añade más registros al darle a Ver Más
     */
    handleViewMore() {
        this.numberOfRecords += 6;
        this.state.numberOfRecords += 6;
        this.state.records = this.state.allRecords.slice(0, this.state.numberOfRecords);
        if (this.state.allRecords.length > this.state.numberOfRecords) {
            this.state.title = `${this.state.sObjectLabelPlural} ${this.state.postLabel}(${this.state.numberOfRecords}+)`;
        } else {
            this.state.title = `${this.state.sObjectLabelPlural} ${this.state.postLabel}(${this.state.allRecords.length})`;
        }
        if (this.state.allRecords.length > this.numberOfRecords) {
            this.showViewMore = true;
        } else {
            this.showViewMore = false;
        }
    }

    /**
     * Lanzar popup de creación de registros
     */
    handleCreateRecord() {
        const newEditPopup = this.template.querySelector('c-relatedlist-new-edit-popup');
        newEditPopup.recordId = null;
        newEditPopup.recordName = null;
        newEditPopup.sObjectApiName = this.sObjectApiName;
        newEditPopup.sObjectLabel = this.state.sObjectLabel;
        newEditPopup.show();
    }

    /**
     * Lanzar popup de edición de registros
     */
    handleEditRecord(row) {
        var newEditPopup = this.template.querySelector('c-relatedlist-new-edit-popup');
        newEditPopup.recordId = row.Id;
        newEditPopup.recordName = row.Name;
        newEditPopup.sObjectApiName = this.sObjectApiName;
        newEditPopup.sObjectLabel = this.state.sObjectLabel;
        newEditPopup.show();
    }

    /**
     * Lanzar popup de confirmación de borrado
     */
    handleDeleteRecord(row) {
        const newEditPopup = this.template.querySelector('c-relatedlist-delete-popup');
        newEditPopup.recordId = row.Id;
        newEditPopup.recordName = row.Name;
        newEditPopup.sObjectLabel = this.state.sObjectLabel;
        newEditPopup.show();
    }

}