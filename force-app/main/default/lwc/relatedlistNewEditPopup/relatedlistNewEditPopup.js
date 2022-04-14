import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class RelatedlistNewEditPopup extends LightningElement {

    showModal = false;
    @api sObjectLabel;
    @api sObjectApiName;
    @api recordId;
    @api recordName;

    @api show() {
        this.showModal = true;
    }
    @api hide() {
        this.showModal = false;
    }

    handleClose() {
        this.showModal = false;     
    }
    handleDialogClose(){
        this.handleClose()
    }
    handleSave() {
        this.template.querySelector('lightning-record-form').submit();
    }
    handleSuccess() {
        this.hide();
        let name = this.recordName;
        name = name ? `"${name}"` : ''; // Si tenemos el nombre, lo entrecomillamos
        const message = `${this.sObjectLabel} ${name} ha sido ${((this.isNew() ? 'creado' : 'guardado'))}.`; //TODO-LABEL
        const event = new ShowToastEvent({
            title: message, 
            variant: 'success'
        });
        this.dispatchEvent(event); // Mostrar Toast confirmacion
        this.dispatchEvent(new CustomEvent('refreshdata')); // Recargar lista relacionada
    }

    isNew() {
        return this.recordId == null;
    }

    get header() {
        return this.isNew() ? `Nuevo ${this.sObjectLabel}` : `Editar ${this.sObjectLabel}`; //TODO-LABEL
    }

}