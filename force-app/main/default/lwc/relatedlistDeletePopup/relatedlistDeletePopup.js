import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { deleteRecord } from 'lightning/uiRecordApi';

export default class RelatedlistDeletePopup extends LightningElement {

    showModal = false;
    @api sObjectLabel;
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
    handleDialogClose() {
        this.handleClose();
    }
    handleDelete() {
        deleteRecord(this.recordId)
            .then(() => {
                this.hide();
                const event = new ShowToastEvent({
                    title: `${this.sObjectLabel} "${this.recordName}" eliminado.`, // TODO-LABEL
                    variant: 'success'
                });
                this.dispatchEvent(event);
                this.dispatchEvent(new CustomEvent('refreshdata'));
            })
            .catch(error => {
                const event = new ShowToastEvent({
                    title: 'Error eliminando registro', //TODO-LABEL
                    message: error.body.message, 
                    variant: 'error'
                });
                this.dispatchEvent(event);
            });
    }

    get body() {
        return `¿Está seguro que quiere este ${this.sObjectLabel}?`; // TODO-LABEL
    }
    get header() {
        return `Eliminar ${this.sObjectLabel}`;
    }

}