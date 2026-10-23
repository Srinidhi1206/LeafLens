"""General reference information shown next to a prediction (educational, not a diagnosis)."""

DISEASE_INFO = {
    "healthy": {
        "name": "Healthy",
        "pathogen": None,
        "description": "No signs of the diseases the model was trained on. The leaf shows normal, "
                       "uniform green colour and texture.",
        "symptoms": ["Even green colour", "No spots, lesions or powdery coating"],
        "prevention": [
            "Keep monitoring leaves regularly, especially after wet weather.",
            "Prune to keep the canopy open and well ventilated.",
            "Remove fallen leaves in autumn to reduce overwintering pathogens.",
            "Water at the base of the tree rather than over the foliage.",
        ],
    },
    "scab": {
        "name": "Apple Scab",
        "pathogen": "Venturia inaequalis (fungus)",
        "description": "One of the most common apple diseases. It thrives in cool, wet spring weather "
                       "and spreads through spores from infected fallen leaves.",
        "symptoms": ["Olive-green to brown velvety spots", "Spots darken and may cause leaves to curl or drop",
                     "Corky, scabby lesions on fruit"],
        "prevention": [
            "Rake and destroy fallen leaves to break the infection cycle.",
            "Plant scab-resistant apple varieties where possible.",
            "Prune for airflow so leaves dry quickly after rain.",
            "Apply a recommended fungicide program at green-tip / early spring (consult a local expert).",
        ],
    },
    "frog_eye_leaf_spot": {
        "name": "Frog Eye Leaf Spot",
        "pathogen": "Botryosphaeria obtusa (fungus, also causes black rot)",
        "description": "A fungal leaf spot that overwinters in dead wood, cankers and mummified fruit.",
        "symptoms": ["Small purple spots that enlarge", "Tan or brown centres with a purple border (\"frog eye\")",
                     "Heavy infection can cause leaf yellowing and drop"],
        "prevention": [
            "Remove dead branches, cankers and mummified fruit from the tree.",
            "Prune during dry weather and disinfect pruning tools.",
            "Keep trees vigorous with proper watering and nutrition.",
            "Use fungicides labelled for black rot / frog eye leaf spot when needed.",
        ],
    },
    "rust": {
        "name": "Cedar Apple Rust",
        "pathogen": "Gymnosporangium juniperi-virginianae (fungus)",
        "description": "A rust fungus that needs both apple and juniper / red cedar trees to complete its life cycle.",
        "symptoms": ["Bright yellow-orange spots on the upper leaf surface",
                     "Spots may develop a red border", "Small tube-like structures on the leaf underside"],
        "prevention": [
            "Remove nearby juniper / red cedar hosts or their galls where practical.",
            "Choose rust-resistant apple varieties.",
            "Apply protective fungicides from pink bud through early summer (consult a local expert).",
            "Remove and destroy heavily infected leaves.",
        ],
    },
    "powdery_mildew": {
        "name": "Powdery Mildew",
        "pathogen": "Podosphaera leucotricha (fungus)",
        "description": "A fungal disease favoured by warm days, cool nights and high humidity. Unlike scab, "
                       "it does not need rain to spread.",
        "symptoms": ["White to grey powdery coating on leaves", "Leaves may curl, crinkle or become narrow",
                     "Stunted shoot growth"],
        "prevention": [
            "Prune out infected shoots during winter and early spring.",
            "Avoid excessive nitrogen fertiliser, which promotes soft susceptible growth.",
            "Improve airflow and sunlight through the canopy.",
            "Apply sulphur or other labelled fungicides early in the season.",
        ],
    },
    "complex": {
        "name": "Complex (Multiple Diseases)",
        "pathogen": "Several pathogens at once",
        "description": "In the Plant Pathology 2021 dataset, 'complex' marks leaves with several diseases or "
                       "symptoms that are too unclear to assign to a single disease.",
        "symptoms": ["Mixed or overlapping lesions", "Symptoms that do not match one disease clearly"],
        "prevention": [
            "Have the leaf examined by a plant pathologist or agricultural extension officer.",
            "Follow general orchard hygiene: remove fallen leaves and infected wood.",
            "Maintain good airflow, balanced nutrition and correct watering.",
            "Avoid relying on a single automated prediction for treatment decisions.",
        ],
    },
}
