package app.authz

default allow = false

# Allow if users clearance is >= resource classification
# Classification Levels:
# 0: UNCLASSIFIED
# 1: CUI
# 2: SECRET
# 3: TOP_SECRET

level_map := {
    "UNCLASSIFIED": 0,
    "CUI": 1,
    "SECRET": 2,
    "TOP_SECRET": 3
}

# Input schema:
# input.user.properties.clearance (string)
# input.resource.properties.classification (string)
# input.action (string)

allow if {
    user_level := level_map[input.user.properties.clearance]
    resource_level := level_map[input.resource.properties.classification]
    user_level >= resource_level
}

# Allow if resource has no classification (default to UNCLASSIFIED)
allow if {
    not input.resource.properties.classification
}

# Allow admins everything
allow if {
    input.user.properties.role == "ADMIN"
}
