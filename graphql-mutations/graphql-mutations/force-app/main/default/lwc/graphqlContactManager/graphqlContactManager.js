import { LightningElement, wire, track } from 'lwc';
import { gql, graphql, executeMutation } from 'lightning/graphql';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const CONTACTS_QUERY = gql`
    query GetContacts {
        uiapi {
            query {
                Contact(first: 10, orderBy: { LastName: { order: ASC } }) {
                    edges {
                        node {
                            Id
                            FirstName {
                                value
                            }
                            LastName {
                                value
                            }
                            Phone {
                                value
                            }
                        }
                    }
                }
            }
        }
    }
`;

const CREATE_CONTACT = gql`
    mutation CreateContact($firstName: String, $lastName: String!, $phone: String) {
        uiapi {
            ContactCreate(
                input: {
                    Contact: {
                        FirstName: $firstName
                        LastName: $lastName
                        Phone: $phone
                    }
                }
            ) {
                Record {
                    Id
                    LastName {
                        value
                    }
                }
                errors {
                    message
                    statusCode
                }
            }
        }
    }
`;

const UPDATE_CONTACT = gql`
    mutation UpdateContact($id: ID!, $phone: String) {
        uiapi {
            ContactUpdate(input: { fields: { Id: $id, Phone: $phone } }) {
                Record {
                    Id
                    Phone {
                        value
                    }
                }
                errors {
                    message
                    statusCode
                }
            }
        }
    }
`;

const DELETE_CONTACT = gql`
    mutation DeleteContact($id: ID!) {
        uiapi {
            ContactDelete(input: { fields: { Id: $id } }) {
                Record {
                    Id
                }
                errors {
                    message
                    statusCode
                }
            }
        }
    }
`;

const COLUMNS = [
    { label: 'First Name', fieldName: 'firstName' },
    { label: 'Last Name', fieldName: 'lastName' },
    { label: 'Phone', fieldName: 'phone' },
    {
        type: 'action',
        typeAttributes: {
            rowActions: [
                { label: 'Edit Phone', name: 'edit_phone' },
                { label: 'Delete', name: 'delete' }
            ]
        }
    }
];

export default class GraphqlContactManager extends LightningElement {
    // Query
    @wire(graphql, { query: CONTACTS_QUERY })
    wiredContacts;

    columns = COLUMNS;

    // Create form fields
    @track newFirstName = '';
    @track newLastName = '';
    @track newPhone = '';

    // Inline edit state
    @track editRowId = null;
    @track editPhone = '';

    isLoading = false;

    get contacts() {
        const edges = this.wiredContacts?.data?.uiapi?.query?.Contact?.edges;
        if (!edges) return [];
        return edges.map(({ node }) => ({
            id: node.Id,
            firstName: node.FirstName?.value ?? '',
            lastName: node.LastName?.value ?? '',
            phone: node.Phone?.value ?? ''
        }));
    }

    get hasContacts() {
        return this.contacts.length > 0;
    }

    // --- Create handlers ---

    handleFirstNameChange(event) {
        this.newFirstName = event.detail.value;
    }

    handleLastNameChange(event) {
        this.newLastName = event.detail.value;
    }

    handlePhoneChange(event) {
        this.newPhone = event.detail.value;
    }

    async handleCreate() {
        if (!this.newLastName.trim()) {
            this.showToast('Validation Error', 'Last Name is required.', 'error');
            return;
        }
        this.isLoading = true;
        try {
            const { data, errors } = await executeMutation({
                query: CREATE_CONTACT,
                operationName: 'CreateContact',
                variables: {
                    firstName: this.newFirstName || null,
                    lastName: this.newLastName,
                    phone: this.newPhone || null
                }
            });
            if (errors?.length) {
                this.showToast('Error', errors[0].message, 'error');
            } else {
                this.showToast('Success', 'Contact created successfully.', 'success');
                this.newFirstName = '';
                this.newLastName = '';
                this.newPhone = '';
                this.wiredContacts.refresh();
            }
        } catch (e) {
            this.showToast('Error', e?.message ?? 'Unexpected error.', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // --- Row action handlers ---

    handleRowAction(event) {
        const { action, row } = event.detail;
        if (action.name === 'edit_phone') {
            this.editRowId = row.id;
            this.editPhone = row.phone;
        } else if (action.name === 'delete') {
            this.handleDelete(row.id);
        }
    }

    // --- Update handlers ---

    handleInlinePhoneChange(event) {
        this.editPhone = event.detail.value;
    }

    async handleUpdateSave() {
        this.isLoading = true;
        try {
            const { data, errors } = await executeMutation({
                query: UPDATE_CONTACT,
                operationName: 'UpdateContact',
                variables: {
                    id: this.editRowId,
                    phone: this.editPhone
                }
            });
            if (errors?.length) {
                this.showToast('Error', errors[0].message, 'error');
            } else {
                this.showToast('Success', 'Phone updated successfully.', 'success');
                this.editRowId = null;
                this.editPhone = '';
            }
        } catch (e) {
            this.showToast('Error', e?.message ?? 'Unexpected error.', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    handleUpdateCancel() {
        this.editRowId = null;
        this.editPhone = '';
    }

    // --- Delete handler ---

    async handleDelete(id) {
        this.isLoading = true;
        try {
            const { data, errors } = await executeMutation({
                query: DELETE_CONTACT,
                operationName: 'DeleteContact',
                variables: { id }
            });
            if (errors?.length) {
                this.showToast('Error', errors[0].message, 'error');
            } else {
                this.showToast('Success', 'Contact deleted.', 'success');
            }
        } catch (e) {
            this.showToast('Error', e?.message ?? 'Unexpected error.', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    // --- Utility ---

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}
