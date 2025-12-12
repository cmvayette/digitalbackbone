package som.authz

default allow = false

# Allow if user is an Administrator
allow if {
    input.user.roles[_] == "Administrator"
}

# Allow access to unclassified resources
allow if {
    input.action == "read"
    input.resource.classification == "Unclassified"
}

# Allow access if user clearance is sufficient
allow if {
    input.action == "read"
    is_clearance_sufficient(input.user.clearance, input.resource.classification)
}

# Helper: Clearance Hierarchy
clearance_level := {
    "Unclassified": 0,
    "Confidential": 1,
    "Secret": 2,
    "TopSecret": 3
}

is_clearance_sufficient(user_clearance, resource_classification) if {
    clearance_level[user_clearance] >= clearance_level[resource_classification]
}

# Role-specific permissions
allow if {
    input.action == "submit_event"
    input.user.roles[_] == "Operator"
}

allow if {
    input.action == "submit_event"
    input.user.roles[_] == "DataSubmitter"
}

allow if {
    input.action == "propose_schema"
    input.user.roles[_] == "SchemaDesigner"
}

allow if {
    input.action == "view_health"
    input.user.roles[_] == "Operator"
}

# Access Control for specific Holon Types (example)
# Operators can access all holons if clearance permits
allow if {
    input.action == "read"
    input.user.roles[_] == "Operator"
    is_clearance_sufficient(input.user.clearance, input.resource.classification)
}
