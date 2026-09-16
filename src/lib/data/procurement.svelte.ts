


export type PurchaseRequest = {
    id: string;
    proposals: Proposal[];
}


export type Proposal = {
    id: string;
    type: "process-module" | "test-vehicle" | "process-vehicle";
    requester: string;
    requesterEmail: string;

    purpose: string;
    details: string;
    due: string;    
}




