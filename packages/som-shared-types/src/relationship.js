/**
 * Relationship type definitions for the Semantic Operating Model
 */
export var RelationshipType;
(function (RelationshipType) {
    // Structural
    RelationshipType["CONTAINS"] = "CONTAINS";
    RelationshipType["HAS"] = "HAS";
    RelationshipType["OCCUPIES"] = "OCCUPIES";
    RelationshipType["MEMBER_OF"] = "MEMBER_OF";
    RelationshipType["BELONGS_TO"] = "BELONGS_TO";
    RelationshipType["PART_OF"] = "PART_OF";
    // Responsibility
    RelationshipType["RESPONSIBLE_FOR"] = "RESPONSIBLE_FOR";
    RelationshipType["OWNED_BY"] = "OWNED_BY";
    RelationshipType["OPERATED_BY"] = "OPERATED_BY";
    // Alignment
    RelationshipType["GROUPED_UNDER"] = "GROUPED_UNDER";
    RelationshipType["ALIGNED_TO"] = "ALIGNED_TO";
    // Support
    RelationshipType["SUPPORTS"] = "SUPPORTS";
    RelationshipType["ENABLES"] = "ENABLES";
    RelationshipType["USES"] = "USES";
    // Qualification
    RelationshipType["HELD_BY"] = "HELD_BY";
    RelationshipType["REQUIRED_FOR"] = "REQUIRED_FOR";
    RelationshipType["HAS_QUAL"] = "HAS_QUAL";
    // Governance
    RelationshipType["DEFINES"] = "DEFINES";
    RelationshipType["AUTHORIZES"] = "AUTHORIZES";
    RelationshipType["SUPERSEDES"] = "SUPERSEDES";
    RelationshipType["DERIVED_FROM"] = "DERIVED_FROM";
    // Temporal/Causal
    RelationshipType["CAUSED_BY"] = "CAUSED_BY";
    RelationshipType["FOLLOWS"] = "FOLLOWS";
    RelationshipType["GROUPED_WITH"] = "GROUPED_WITH";
    // Location
    RelationshipType["LOCATED_AT"] = "LOCATED_AT";
    RelationshipType["HOSTS"] = "HOSTS";
    RelationshipType["STAGING_FOR"] = "STAGING_FOR";
    RelationshipType["OCCURS_AT"] = "OCCURS_AT";
    // Work
    RelationshipType["ASSIGNED_TO"] = "ASSIGNED_TO";
    RelationshipType["PARTICIPATES_IN"] = "PARTICIPATES_IN";
    RelationshipType["PRODUCES"] = "PRODUCES";
    RelationshipType["PROVIDES"] = "PROVIDES";
    RelationshipType["DEPENDS_ON"] = "DEPENDS_ON";
    // Measurement
    RelationshipType["MEASURED_BY"] = "MEASURED_BY";
    RelationshipType["EMITS_MEASURE"] = "EMITS_MEASURE";
    RelationshipType["GROUNDED_IN"] = "GROUNDED_IN";
    RelationshipType["AFFECTS"] = "AFFECTS";
    RelationshipType["APPLIES_TO"] = "APPLIES_TO";
})(RelationshipType || (RelationshipType = {}));
