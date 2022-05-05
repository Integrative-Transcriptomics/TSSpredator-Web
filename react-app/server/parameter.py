from json.encoder import INFINITY
import json

# für alle Parameter die mit einem Spinner oder Combo-box eingestellt werden

# Parameter bei denen die werte sich je nach preset ändern
class ParameterPreset:    
    def __init__(self, name, min, max, step, very_specific, more_specific, value, more_sensitive, very_sensitive, group):
        self.name = name
        self.min = min
        self.max = max
        self.step = step
        self.very_specific = very_specific
        self.more_specific = more_specific
        self.value = value
        self.more_sensitive = more_sensitive
        self.very_sensitive = very_sensitive
        self.group = group

# Parameter bei denen die Werte sich nicht ändern
class ParameterConstant:
    def __init__(self, name, min, max, step, value, group):
        self.name = name
        self.min = min
        self.max = max
        self.step = step
        self.value = value
        self.group = group

# für combo box
class ParameterCombo:
    def __init__(self, name, value, combo1, combo2, group):
        self.name = name
        self.value = value
        self.combo1 = combo1
        self.combo2 = combo2  
        self.group = group


def defParamtersSetUpBox():
    study_typ = ParameterCombo("Type of Study", "Comparison of different strains/species", "Comparison of different strains/species", "Comparison of different conditions", "setup")
    number_genomes = ParameterConstant("Number of Genomes", 1, 100, 1, 1, "setup")
    number_replicates = ParameterConstant("Number of Replicates", 1, 26, 1, 1, "setup")
    return [study_typ, number_genomes, number_replicates]

def defParameterPrediction():
    step_height = ParameterPreset("step height", 0, None, 0.05, 1, 0.5, 0.3, 0.2, 0.1, "Prediction")
    step_height_reduction = ParameterPreset("step height reduction", 0, None, 0.05, 0.5, 0.2, 0.2, 0.15, 0.09, "Prediction")
    step_factor = ParameterPreset("step factor", 1, None, 0.1, 2, 2, 2, 1.5, 1, "Prediction")
    step_factor_reduction = ParameterPreset("step factor reduction", 0, None, 0.1, 0.5, 0.5, 0.5, 0.5, 0, "Prediction")
    enrichment_factor = ParameterPreset("enrichment factor", 0, None, 0.1, 3, 2, 2, 1.5, 1, "Prediction")
    processing_site_factor = ParameterPreset("processing site factor", 0, None, 0.1, 1, 1.2, 1.5, 2, 3, "Prediction")
    step_length = ParameterConstant("step length", 0, None, 1, 0, "Prediction")
    base_height = ParameterConstant("base height", 0, None, 0.05, 0, "Prediction")
    return [step_height, step_factor, enrichment_factor, step_height_reduction, step_factor_reduction, processing_site_factor, step_length, base_height]

def defParameterNorm():
    normalization_percentile = ParameterConstant("normalization percentile", 0, 1, 0.1, 0.9, "Normalization")
    enrichment_normalization_percentile = ParameterConstant("enrichment normalization percentile", 0, 1, 0.1, 0.5, "Normalization")
    return [normalization_percentile, enrichment_normalization_percentile]

def defParameterCluster():
    tss_clustering_distance = ParameterConstant("TSS clustering distance", 0, 100, 1, 3, "Clustering")
    cluster_method = ParameterCombo("cluster method", "HIGHEST", "HIGHEST", "FIRST", "Clustering")
    return [tss_clustering_distance, cluster_method]

def defParameterClass():
    utr_length = ParameterConstant("UTR length", 0, None, 10, 300, "Classification")
    antisense_utr_length = ParameterConstant("antisense UTR length", 0, None, 10, 100, "Classification")
    return [utr_length, antisense_utr_length]


def defParameterComparative():
    allowed_cross_genome_shift = ParameterConstant("allowed cross-genome shift", 0, 100, 1, 1, "Comparative")
    allowed_cross_replicate_shift = ParameterConstant("allowed cross-replicate shift", 0, 100, 1, 1, "Comparative")
    matching_replicates = ParameterConstant("matching replicates", 1, 1, 1, 1, "Comparative") #maximum ist die anzahl der replicates!!!!!
    return [allowed_cross_genome_shift, allowed_cross_replicate_shift, matching_replicates]


def convertToJson(array):

    #jsonString="\"" +"\": {"
    jsonString=""
    for p in array:
        jsonString += "\"" + (p.name).replace(" ", "") + "\":" + json.dumps(p.__dict__) + ","

    jsonString = jsonString[:-1] # letztes komma entfernen
    jsonString += "}"
    return jsonString


def getParameters():
    
    jsonString="{\"setup\":{"
    jsonString+=convertToJson(defParamtersSetUpBox()) + ","
    jsonString+="\"parameterBox\": {\"Prediction\": {" + convertToJson(defParameterPrediction()) + ","
    jsonString+="\"Normalization\": {" + convertToJson(defParameterNorm()) + ","
    jsonString+="\"Clustering\": {" + convertToJson(defParameterCluster()) + ","
    jsonString+="\"Classification\": {" + convertToJson(defParameterClass()) + ","
    jsonString+="\"Comparative\": {" + convertToJson(defParameterComparative()) + "}}"
    

    return jsonString
    #print(jsonString)

#getParameters()