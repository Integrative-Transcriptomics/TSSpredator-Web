from json.encoder import INFINITY
import json

# initialize all parameter presets

# Parameter with specific presets
class ParameterPreset:    
    def __init__(self, key, name, min, max, step, very_specific, more_specific, default, more_sensitive, very_sensitive, value, group, tooltip):
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
        self.tooltip = tooltip

# Parameter without presets
class ParameterConstant:
    def __init__(self, key, name, min, max, step, value, group, tooltip):
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
        self.tooltip = tooltip

# combo box
class ParameterCombo:
    def __init__(self, key, name, value, combo1, combo2, group, tooltip):
        self.key=key
        self.name = name
        self.value = value
        self.combo1 = combo1
        self.combo2 = combo2  
        self.group = group
        self.tooltip = tooltip


def defParamtersSetUpBox():
    study_typ = ParameterCombo("typeofstudy","Type of Study", "condition", "TSS prediction in different condition(s)", "Comparison of different strains/species",  "setup",  
                                "For a cross-strain analysis an alignment file has to be provided. When comparing different conditions the genomic sequence and genome annotation has to be set in the first genome tab only.")
    number_genomes = ParameterConstant("numberofgenomes","Number of Conditions", 1, 100, 1, 1, "setup" , 'Set the number of Conditions/Genomes.')
    number_replicates = ParameterConstant("numberofreplicates","Number of Replicates", 1, 26, 1, 1, "setup", 'Set the number of Replicates.')
    return [study_typ, number_genomes, number_replicates]

def defParameterPrediction():
    step_height = ParameterPreset("stepheight","step height", 0, None, 0.05, 1, 0.5, 0.3, 0.2, 0.1, 0.3, "Prediction",
                                "Minimal number of read starts at a certain genomic position to be considered as a TSS candidate. A lower value results in a higher sensitivity.")
    step_height_reduction = ParameterPreset("stepheightreduction","step height reduction", 0, None, 0.05, 0.5, 0.2, 0.2, 0.15, 0.09, 0.2, "Prediction",
                                            "When comparing different strains/conditions and the step height threshold is reached in at least one strain/condition, the threshold is reduced for the other strains/conditions by the value set here. A higher value results in a higher sensitivity.")
    step_factor = ParameterPreset("stepfactor", "step factor", 1, None, 0.1, 2, 2, 2, 1.5, 1, 2, "Prediction",
                                    "Minimal factor by which the TSS height has to exceed the local expression background. A lower value results in a higher sensitivity. Set this value to 1 to disable it.")
    step_factor_reduction = ParameterPreset("stepfactorreduction","step factor reduction", 0, None, 0.1, 0.5, 0.5, 0.5, 0.5, 0, 0.5, "Prediction", 
                                            "When comparing different strains/conditions and the step factor threshold is reached in at least one strain/condition, the threshold is reduced for the other strains/conditions by the value set here. A higher value results in a higher sensitivity.")
    enrichment_factor = ParameterPreset("enrichmentfactor","enrichment factor", 0, None, 0.1, 3, 2, 2, 1.5, 1, 2, "Prediction", 
                                        "Minimal enrichment factor for a TSS candidate. The threshold has to be exceeded in at least one strain/condition. If the threshold is not exceeded in another condition the TSS candidate is marked as detected but not as enriched in this strain/condition. A lower value results in a higher sensitivity. Set this value to 0 to disable it.")
    processing_site_factor = ParameterPreset("processingsitefactor", "processing site factor", 0, None, 0.1, 1, 1.2, 1.5, 2, 3, 1.5, "Prediction",
                                                "Maximal factor by which the untreated library may be higher than the treated library and above which the TSS candidate is considered as a processing site and not annotated as detected. A higher value results in a higher sensitivity.")
    step_length = ParameterConstant("steplength","step length", 0, None, 1, 0, "Prediction",
                                    "Minimal length of the TSS related expression region (bp). This value depends on the length of the reads that are stacking at the TSS position. In most cases this feature can be disabled by setting it to '0'. However, it can be useful if RNA-seq reads have been trimmed extensively before mapping.")
    base_height = ParameterConstant("baseheight","base height", 0, None, 0.05, 0, "Prediction",
                                    "Minimal number of reads in the non-enriched library that start at the TSS position. Set this value to 0 to disable it.")
    return [step_height, step_factor, enrichment_factor, step_height_reduction, step_factor_reduction, processing_site_factor, step_length, base_height]

def defParameterNorm():
    normalization_percentile = ParameterConstant("normalizationpercentile","normalization percentile", 0, 1, 0.1, 0.9, "Normalization", 
                                                "Percentile that is used as a normalization factor. Set this value to 0 to disable normalization.")
    enrichment_normalization_percentile = ParameterConstant("enrichmentnormalizationpercentile","enrichment normalization percentile", 0, 1, 0.1, 0.5, "Normalization",
                                                            "Percentile that is used as a normalization factor. Set this value to 0 to disable normalization.")
    return [normalization_percentile, enrichment_normalization_percentile]

def defParameterCluster():
    tss_clustering_distance = ParameterConstant("tssclusteringdistance","TSS clustering distance", 0, 100, 1, 3, "Clustering",
                                                "Maximal distance (bp) between TSS candidates to be clustered together. Set this value to '0' to disable clustering.")
    cluster_method = ParameterCombo("clustermethod","cluster method", "HIGHEST", "HIGHEST", "FIRST", "Clustering",
                                    "TSS candidates in close vicinity are clustered and only one of the candidates is kept. HIGHEST keeps the candidate with the highest expression. FIRST keeps the candidate that is located most upstream.")
    return [tss_clustering_distance, cluster_method]

def defParameterClass():
    utr_length = ParameterConstant("utrlength","UTR length", 0, None, 10, 300, "Classification", 
                                    "Maximal upstream distance (bp) of a TSS candidate from the start codon of a gene that is allowed to be assigned as a primary or secondary TSS for that gene.")
    antisense_utr_length = ParameterConstant("antisenseutrlength","antisense UTR length", 0, None, 10, 100, "Classification",
                                        "Maximal upstream or downstream distance (bp) of a TSS candidate from the start or end of a gene to which the TSS candidate is in antisense orientation that is allowed to be assigned as an antisense TSS for that gene.")
    return [utr_length, antisense_utr_length]


def defParameterComparative():
    allowed_cross_genome_shift = ParameterConstant("allowedcrossgenomeshift","allowed cross-condition shift", 0, 100, 1, 1, "Comparative",
                                                    "Maximal positional difference (bp) for TSS candidates from different strains/conditions to be assigned to each other.")
    allowed_cross_replicate_shift = ParameterConstant("allowedcrossreplicateshift","allowed cross-replicate shift", 0, 100, 1, 1, "Comparative",
                                                        "Maximal positional difference (bp) for TSS candidates from different replicates to be assigned to each other.")
    matching_replicates = ParameterConstant("matchingreplicates","matching replicates", 1, 1, 1, 1, "Comparative",
                                            "Minimal number of replicates in which a TSS candidate has to be detected. A lower value results in a higher sensitivity.") 
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

