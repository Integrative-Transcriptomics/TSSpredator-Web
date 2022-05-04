from json.encoder import INFINITY
import json

# für alle Parameter die mit einem Spinner oder Combo-box eingestellt werden

# Parameter bei denen die werte sich je nach preset ändern
class ParameterPreset:    
    def __init__(self, name, min, max, step, very_specific, more_specific, value, more_sensitive, very_sensitive):
        self.name = name
        self.min = min
        self.max = max
        self.step = step
        self.very_specific = very_specific
        self.more_specific = more_specific
        self.value = value
        self.more_sensitive = more_sensitive
        self.very_sensitive = very_sensitive

# Parameter bei denen die Werte sich nicht ändern
class ParameterConstant:
    def __init__(self, name, min, max, step, value):
        self.name = name
        self.min = min
        self.max = max
        self.step = step
        self.value = value

# für combo box
class ParameterCombo:
    def __init__(self, name, value, combo2):
        self.name = name
        self.value = value
        self.combo2 = combo2  


def defParamtersSetUpBox():
    study_typ = ParameterCombo("Type of Study", "Comparison of different strains/species", "Comparison of different conditions")
    number_genomes = ParameterConstant("Number of *Genomes*", 1, 100, 1, 1)
    number_replicates = ParameterConstant("Number of Replicates", 1, 26, 1, 1)
    return [study_typ, number_genomes, number_replicates]

def defParameterPrediction():
    step_height = ParameterPreset("step height", 0, None, 0.05, 1, 0.5, 0.3, 0.2, 0.1)
    step_height_reduction = ParameterPreset("step height reduction", 0, None, 0.05, 0.5, 0.2, 0.2, 0.15, 0.09)
    step_factor = ParameterPreset("step factor", 1, None, 0.1, 2, 2, 2, 1.5, 1)
    step_factor_reduction = ParameterPreset("step factor reduction", 0, None, 0.1, 0.5, 0.5, 0.5, 0.5, 0)
    enrichment_factor = ParameterPreset("enrichment factor", 0, None, 0.1, 3, 2, 2, 1.5, 1)
    processing_site_factor = ParameterPreset("processing site factor", 0, None, 0.1, 1, 1.2, 1.5, 2, 3)
    step_length = ParameterConstant("step length", 0, None, 1, 0)
    base_height = ParameterConstant("base height", 0, None, 0.05, 0)
    return [step_height, step_factor, enrichment_factor, step_height_reduction, step_factor_reduction, processing_site_factor, step_length, base_height]

def defParameterNorm():
    normalization_percentile = ParameterConstant("normalization percentile", 0, 1, 0.1, 0.9)
    enrichment_normalization_percentile = ParameterConstant("enrichment normalization percentile", 0, 1, 0.1, 0.5)
    return [normalization_percentile, enrichment_normalization_percentile]

def defParameterCluster():
    tss_clustering_distance = ParameterConstant("TSS clustering distance", 0, 100, 1, 3)
    cluster_method = ParameterCombo("cluster method", "HIGHEST", "FIRST")
    return [tss_clustering_distance, cluster_method]

def defParameterClass():
    utr_length = ParameterConstant("UTR length", 0, None, 10, 300)
    antisense_utr_length = ParameterConstant("antisense UTR length", 0, None, 10, 100)
    return [utr_length, antisense_utr_length]


def defParameterComparative():
    allowed_cross_genome_shift = ParameterConstant("allowed cross-*genome* shift", 0, 100, 1, 1)
    allowed_cross_replicate_shift = ParameterConstant("allowed cross-replicate shift", 0, 100, 1, 1)
    matching_replicates = ParameterConstant("matching replicates", 1, 1, 1, 1) #maximum ist die anzahl der replicates!!!!!
    return [allowed_cross_genome_shift, allowed_cross_replicate_shift, matching_replicates]


def convertToJson(array, name="parameters"):
    jsonString="\"" + name +"\": ["
    for p in array:
        jsonString += json.dumps(p.__dict__) + ","

    jsonString = jsonString[:-1] # letztes komma entfernen
    jsonString += "]"
    return jsonString


def getParameters():
    
    jsonString="{"
    jsonString+=convertToJson(defParamtersSetUpBox(), "setup") + ","
    jsonString+="\"parameterBox\": [{\"name\":\"Prediction\"," + convertToJson(defParameterPrediction()) + "},"
    jsonString+="{\"name\":\"Normalization\"," + convertToJson(defParameterNorm()) + "},"
    jsonString+="{\"name\":\"Clustering\"," + convertToJson(defParameterCluster()) + "},"
    jsonString+="{\"name\":\"Classification\"," + convertToJson(defParameterClass()) + "},"
    jsonString+="{\"name\":\"Comparative\"," + convertToJson(defParameterComparative()) + "}]}"

    return jsonString
    #print(jsonString)

#getParameters()