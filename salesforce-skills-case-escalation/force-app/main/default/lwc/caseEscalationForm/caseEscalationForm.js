import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getOpenCases from '@salesforce/apex/CaseEscalationController.getOpenCases';
import escalateCase from '@salesforce/apex/CaseEscalationController.escalateCase';

const PRIORITY_OPTIONS = [
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' }
];

const DEFAULT_PRIORITY = 'High';

export default class CaseEscalationForm extends LightningElement {
    cases = [];
    isLoading = false;

    priorityOptions = PRIORITY_OPTIONS;
    _wiredCasesResult;

    @wire(getOpenCases)
    wiredCases(result) {
        this._wiredCasesResult = result;
        if (result.data) {
            this.cases = result.data.map(c => this._buildCaseRow(c));
        } else if (result.error) {
            this._showToast('Error', this._extractErrorMessage(result.error), 'error');
        }
    }

    get hasCases() {
        return this.cases && this.cases.length > 0;
    }

    handleEscalateClick(event) {
        const clickedId = event.currentTarget.dataset.id;
        this.cases = this.cases.map(c => ({
            ...c,
            showPanel: c.Id === clickedId ? !c.showPanel : false,
            reason: c.Id === clickedId ? c.reason : '',
            newPriority: c.Id === clickedId ? c.newPriority : DEFAULT_PRIORITY
        }));
    }

    handleInputChange(event) {
        const caseId = event.currentTarget.dataset.id;
        const field = event.currentTarget.dataset.field;
        const value = event.detail.value;
        this.cases = this.cases.map(c => {
            if (c.Id === caseId) {
                return { ...c, [field]: value };
            }
            return c;
        });
    }

    handleCancel(event) {
        const caseId = event.currentTarget.dataset.id;
        this.cases = this.cases.map(c => {
            if (c.Id === caseId) {
                return { ...c, showPanel: false, reason: '', newPriority: DEFAULT_PRIORITY };
            }
            return c;
        });
    }

    async handleConfirm(event) {
        const caseId = event.currentTarget.dataset.id;
        const caseItem = this.cases.find(c => c.Id === caseId);

        if (!caseItem?.reason?.trim()) {
            this._showToast('Validation Error', 'Escalation Reason is required.', 'error');
            return;
        }

        this.isLoading = true;
        try {
            await escalateCase({
                caseId,
                reason: caseItem.reason.trim(),
                newPriority: caseItem.newPriority
            });
            this._showToast('Success', `Case ${caseItem.CaseNumber} has been escalated.`, 'success');
            this.cases = this.cases.map(c => {
                if (c.Id === caseId) {
                    return { ...c, showPanel: false, reason: '', newPriority: DEFAULT_PRIORITY };
                }
                return c;
            });
            await refreshApex(this._wiredCasesResult);
        } catch (error) {
            this._showToast('Escalation Failed', this._extractErrorMessage(error), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    _buildCaseRow(record) {
        return {
            ...record,
            showPanel: false,
            reason: '',
            newPriority: DEFAULT_PRIORITY
        };
    }

    _showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    _extractErrorMessage(error) {
        if (error?.body?.message) return error.body.message;
        if (error?.message) return error.message;
        return 'An unexpected error occurred.';
    }
}
