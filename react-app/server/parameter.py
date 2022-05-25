from json.encoder import INFINITY
import json

# Parameter with specific presets
class ParameterPreset:    
    def __init__(self, key, name, min, max, step, very_specific, more_specific, default, more_sensitive, very_sensitive, value, group):
        self.key=key
        self.name = name
        self.min = min
        self.max = max
        self.step = step
        self.veryspecific = very_specific
        self.morespecific = more_specific
        self.default = default
        self.moresensitive = more_sensitive
        self.verysensitive = very_sensitive
        self.value = value
        self.group = group

# Parameter without presets
class ParameterConstant:
    def __init__(self, key, name, min, max, step, value, group):
        self.key=key
        self.name = name
        self.min = min
        self.max = max
        self.step = step
        self.value = value
        self.veryspecific = value
        self.morespecific = value
        self.default = value
        self.moresensitive = value
        self.verysensitive = value
        self.group = group

# combo box
class ParameterCombo:
    def __init__(self, key, name, value, combo1, combo2, group):
        self.key=key
        self.name = name
        self.value = value
        self.combo1 = combo1
        self.combo2 = combo2  
        self.group = group


def defParamtersSetUpBox():
    study_typ = ParameterCombo("typeofstudy","Type of Study", "genome", "Comparison of different strains/species", "Comparison of different conditions", "setup")
    number_genomes = ParameterConstant("numberofgenomes","Number of Genomes", 1, 100, 1, 1, "setup")
    number_replicates = ParameterConstant("numberofreplicates","Number of Replicates", 1, 26, 1, 1, "setup")
    return [study_typ, number_genomes, number_replicates]

def defParameterPrediction():
    step_height = ParameterPreset("stepheight","step height", 0, None, 0.05, 1, 0.5, 0.3, 0.2, 0.1, 0.3, "Prediction")
    step_height_reduction = ParameterPreset("stepheightreduction","step height reduction", 0, None, 0.05, 0.5, 0.2, 0.2, 0.15, 0.09, 0.2, "Prediction")
    step_factor = ParameterPreset("stepfactor", "step factor", 1, None, 0.1, 2, 2, 2, 1.5, 1, 2, "Prediction")
    step_factor_reduction = ParameterPreset("stepfactorreduction","step factor reduction", 0, None, 0.1, 0.5, 0.5, 0.5, 0.5, 0, 0.5, "Prediction")
    enrichment_factor = ParameterPreset("enrichmentfactor","enrichment factor", 0, None, 0.1, 3, 2, 2, 1.5, 1, 2, "Prediction")
    processing_site_factor = ParameterPreset("processingsitefactor", "processing site factor", 0, None, 0.1, 1, 1.2, 1.5, 2, 3, 1.5, "Prediction")
    step_length = ParameterConstant("steplength","step length", 0, None, 1, 0, "Prediction")
    base_height = ParameterConstant("baseheight","base height", 0, None, 0.05, 0, "Prediction")
    return [step_height, step_factor, enrichment_factor, step_height_reduction, step_factor_reduction, processing_site_factor, step_length, base_height]

def defParameterNorm():
    normalization_percentile = ParameterConstant("normalizationpercentile","normalization percentile", 0, 1, 0.1, 0.9, "Normalization")
    enrichment_normalization_percentile = ParameterConstant("enrichmentnormalizationpercentile","enrichment normalization percentile", 0, 1, 0.1, 0.5, "Normalization")
    return [normalization_percentile, enrichment_normalization_percentile]

def defParameterCluster():
    tss_clustering_distance = ParameterConstant("tssclusteringdistance","TSS clustering distance", 0, 100, 1, 3, "Clustering")
    cluster_method = ParameterCombo("clustermethod","cluster method", "HIGHEST", "HIGHEST", "FIRST", "Clustering")
    return [tss_clustering_distance, cluster_method]

def defParameterClass():
    utr_length = ParameterConstant("utrlength","UTR length", 0, None, 10, 300, "Classification")
    antisense_utr_length = ParameterConstant("antisenseutrlength","antisense UTR length", 0, None, 10, 100, "Classification")
    return [utr_length, antisense_utr_length]


def defParameterComparative():
    allowed_cross_genome_shift = ParameterConstant("allowedcrossgenomeshift","allowed cross-genome shift", 0, 100, 1, 1, "Comparative")
    allowed_cross_replicate_shift = ParameterConstant("allowedcrossreplicateshift","allowed cross-replicate shift", 0, 100, 1, 1, "Comparative")
    matching_replicates = ParameterConstant("matchingreplicates","matching replicates", 1, 1, 1, 1, "Comparative") #maximum ist die anzahl der replicates!!!!!
    return [allowed_cross_genome_shift, allowed_cross_replicate_shift, matching_replicates]


def convertToJson(array):

    #jsonString="\"" +"\": {"
    jsonString=""
    for p in array:
       
        jsonString += "\"" + p.key + "\":" + json.dumps(p.__dict__) + ","

    jsonString = jsonString[:-1] # remove last comma
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

