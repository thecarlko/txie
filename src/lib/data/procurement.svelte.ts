

export class PurchaseRequest {

    contact: string;
    email: string;

    purpose: string;
    details: string;

    purchase: number;
    fitup: number
    misc: number;

    approval: 'draft' | 'pending' | 'approved' | 'rejected' = 'draft';

    vendor: string | undefined;
    model: string | undefined;
    location: string | undefined;
    


    constructor(data: any) {
        this.contact = data.contact;
        this.email = data.email;

        this.purpose = data.purpose;
        this.details = data.details;
        
        this.purchase = data.purchase;
        this.fitup = data.fitup;
        this.misc = data.misc;
    }
}

class Procurement {
    contracts : PurchaseRequest[] = $state([])
}


export const procurement = new Procurement();



