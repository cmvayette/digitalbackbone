export const MOCK_ORGS = [
    {
        id: "org-1",
        name: "Command Element",
        type: "HQ"
    },
    {
        id: "org-2",
        name: "Operations Dept",
        parentId: "org-1",
        type: "Department"
    },
    {
        id: "org-3",
        name: "Logistics Dept",
        parentId: "org-1",
        type: "Department"
    }
];
export const MOCK_POSITIONS = [
    {
        id: "pos-1",
        title: "Change Commander",
        orgId: "org-1",
        isVacant: false
    },
    {
        id: "pos-2",
        title: "Operations Officer",
        orgId: "org-2",
        isVacant: false
    },
    {
        id: "pos-3",
        title: "Logistics Officer",
        orgId: "org-3",
        isVacant: true
    },
    {
        id: "pos-4",
        title: "Training Officer",
        orgId: "org-2",
        isVacant: false
    }
];
