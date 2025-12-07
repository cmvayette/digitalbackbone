/**
 * Core holon type definitions for the Semantic Operating Model
 */
export var HolonType;
(function (HolonType) {
    HolonType["Person"] = "Person";
    HolonType["Position"] = "Position";
    HolonType["Organization"] = "Organization";
    HolonType["System"] = "System";
    HolonType["Asset"] = "Asset";
    HolonType["Mission"] = "Mission";
    HolonType["Capability"] = "Capability";
    HolonType["Qualification"] = "Qualification";
    // Event = 'Event', // Events are not Holons
    HolonType["Location"] = "Location";
    HolonType["Document"] = "Document";
    HolonType["Objective"] = "Objective";
    HolonType["LOE"] = "LOE";
    HolonType["Initiative"] = "Initiative";
    HolonType["Task"] = "Task";
    HolonType["MeasureDefinition"] = "MeasureDefinition";
    HolonType["LensDefinition"] = "LensDefinition";
    HolonType["Constraint"] = "Constraint";
    HolonType["Process"] = "Process";
})(HolonType || (HolonType = {}));
export var DocumentType;
(function (DocumentType) {
    DocumentType["Policy"] = "Policy";
    DocumentType["Order"] = "Order";
    DocumentType["Plan"] = "Plan";
    DocumentType["SOP"] = "SOP";
    DocumentType["Record"] = "Record";
    DocumentType["Instruction"] = "Instruction";
    DocumentType["Manual"] = "Manual";
    DocumentType["Charter"] = "Charter";
    DocumentType["Framework"] = "Framework";
    DocumentType["CONOPS"] = "CONOPS";
    DocumentType["OPLAN"] = "OPLAN";
    DocumentType["EXORD"] = "EXORD";
})(DocumentType || (DocumentType = {}));
export var ConstraintType;
(function (ConstraintType) {
    ConstraintType["Structural"] = "Structural";
    ConstraintType["Policy"] = "Policy";
    ConstraintType["Eligibility"] = "Eligibility";
    ConstraintType["Temporal"] = "Temporal";
    ConstraintType["Capacity"] = "Capacity";
    ConstraintType["Dependency"] = "Dependency";
    ConstraintType["Risk"] = "Risk";
})(ConstraintType || (ConstraintType = {}));
