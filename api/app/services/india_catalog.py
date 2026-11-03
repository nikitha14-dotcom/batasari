"""Small, curated reference data for Batasari's India planning APIs.

Keep this data factual and non-commercial. City notes are prompts for research,
not rankings or guarantees about safety, affordability, or availability.
"""

INDIAN_CITIES = [
    {
        "id": "ahmedabad",
        "name": "Ahmedabad",
        "state": "Gujarat",
        "region": "West",
        "languages": ["Gujarati", "Hindi", "English"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
    {
        "id": "bengaluru",
        "name": "Bengaluru",
        "state": "Karnataka",
        "region": "South",
        "languages": ["Kannada", "English", "Hindi"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
    {
        "id": "chennai",
        "name": "Chennai",
        "state": "Tamil Nadu",
        "region": "South",
        "languages": ["Tamil", "English"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
    {
        "id": "delhi",
        "name": "Delhi",
        "state": "Delhi (NCT)",
        "region": "North",
        "languages": ["Hindi", "English", "Punjabi"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
    {
        "id": "hyderabad",
        "name": "Hyderabad",
        "state": "Telangana",
        "region": "South",
        "languages": ["Telugu", "Urdu", "English", "Hindi"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
    {
        "id": "jaipur",
        "name": "Jaipur",
        "state": "Rajasthan",
        "region": "North",
        "languages": ["Hindi", "Rajasthani", "English"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
    {
        "id": "kochi",
        "name": "Kochi",
        "state": "Kerala",
        "region": "South",
        "languages": ["Malayalam", "English", "Hindi"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
    {
        "id": "kolkata",
        "name": "Kolkata",
        "state": "West Bengal",
        "region": "East",
        "languages": ["Bengali", "Hindi", "English"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
    {
        "id": "mumbai",
        "name": "Mumbai",
        "state": "Maharashtra",
        "region": "West",
        "languages": ["Marathi", "Hindi", "English"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
    {
        "id": "pune",
        "name": "Pune",
        "state": "Maharashtra",
        "region": "West",
        "languages": ["Marathi", "Hindi", "English"],
        "currency": "INR",
        "timezone": "Asia/Kolkata",
    },
]

MOVE_CHECKLISTS = {
    "within_india": [
        {"id": "confirm-move-date", "title": "Confirm your move date and handover dates", "days_before": 30},
        {"id": "compare-movers", "title": "Compare written quotes from movers", "days_before": 21},
        {"id": "lease-address", "title": "Review your lease and update important addresses", "days_before": 14},
        {"id": "utilities", "title": "Arrange utility transfer or connection", "days_before": 7},
        {"id": "inventory", "title": "Photograph valuables and prepare an item inventory", "days_before": 3},
        {"id": "handover", "title": "Record meter readings and complete the home handover", "days_before": 0},
    ],
    "returning_to_india": [
        {"id": "travel-docs", "title": "Check passport, entry documents, and travel dates", "days_before": 60},
        {"id": "customs-guidance", "title": "Review current official customs guidance for your belongings", "days_before": 45},
        {"id": "housing", "title": "Arrange temporary or long-term accommodation", "days_before": 30},
        {"id": "shipment-quotes", "title": "Compare international shipment and baggage options", "days_before": 30},
        {"id": "arrival-plan", "title": "Plan airport transport, local SIM, and first-week essentials", "days_before": 7},
    ],
    "relocating_to_india": [
        {"id": "visa-check", "title": "Confirm your visa or entry requirements using official sources", "days_before": 90},
        {"id": "customs-guidance", "title": "Review current official customs guidance for your belongings", "days_before": 60},
        {"id": "housing", "title": "Arrange temporary or long-term accommodation", "days_before": 45},
        {"id": "shipment-quotes", "title": "Compare international shipment and baggage options", "days_before": 30},
        {"id": "arrival-plan", "title": "Plan airport transport, local SIM, and first-week essentials", "days_before": 7},
    ],
}

MOVE_TYPES = ("within_india", "returning_to_india", "relocating_to_india")

