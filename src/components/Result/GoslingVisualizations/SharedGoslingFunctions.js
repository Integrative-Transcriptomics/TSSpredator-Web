
const COLORS_TSS = ["#377eb8", "#fb8072", "#fed9a6", "#8dd3c7", "#decbe4"]
const ORDER_TSS_CLASSES = ["Primary", "Secondary", "Internal", "Antisense", "Orphan"]


export const createWiggleTracks = (strand, genome, filePath, allowFetch,width) => {
    
    return ["Normal", "FivePrime"].map(type => {
        return {
            "data": {
                "url": `/api/provideBigWig/${filePath}/${genome}/${strand === "+" ? "Plus" : "Minus"}/${type}/${allowFetch}`,
                "type": "bigwig",
                "binSize": 5,
                "aggregation": "mean"
            },
            "id": `detail_wiggle_${strand}_${genome.replace(/_/g, "-")}_${type}`,
            "mark": "bar",
            width: width,

            "x": { "field": "start", "type": "genomic" },
            "xe": { "field": "end", "type": "genomic" },
            "style": { "align": strand === "+" ? "left" : "right", backgroundOpacity: 0 },
            "y": { "field": "value", "axis": type === "Normal" ? "left" : "none", "type": "quantitative", "range": strand === "+" & [0, 90], flip: strand === "-" },
            "color": { "value": type === "Normal" ? "gray" : "orange" },
            "stroke": { "value": "gray" },
            "opacity": { "value": 0.25 },
            "visibility": [
                {
                    "operation": "LT",
                    "measure": "zoomLevel",
                    "threshold": 2500,
                    "transitionPadding": 100,
                    "target": "track"
                }
            ],
            "tooltip": [
                { "field": "start", "alt": "Bin start" },
                { "field": "end", "alt": "Bin end" },
                {
                    "field": "value",
                    "alt": `Value of ${type} library `,
                },
            ],
        }
    }
    )
}

export const createGenomeTrack = (filePath, genome, strand = "+",width) => {
    return [{
        "alignment": "overlay",
        "height": 20,
        width: width,

        "id": `${genome}_${strand}_genome_track`,

        "data": {
            "url": `/api/provideFasta/${filePath}/${genome}/${strand}`,
            "type": "csv",
            "separator": "\t",
            "headerNames": ["pos", "base"],
        },
        "mark": "text",
        "text": { "field": "base", "type": "nominal" },
        "x": { "field": "pos", "type": "genomic" },
        "style": { "textFontWeight": "bold", "align": "center" , "textAlign": "center"},
        "size": { "value": 16 },
        "color": {
            "field": "base",
            "type": "nominal",
            "domain": ["A", "T", "G", "C", "-"],
            "range": ["#FF0000", "#0000FF", "#008000", "#FFA500", "#000000"]
        },
        "tracks": [
            {
                "visibility": [
                    {
                        "operation": "LT",
                        "measure": "zoomLevel",
                        "threshold": 125,
                        "transitionPadding": 50,
                        "target": "mark"
                    }]

            }

        ]
    }]


}

export const createBinnedView = (filePath, binSize, maxValueBin, filterTSS, strand, GT, LT, viewType, genomeName, width) => {
    let transitionPadding = 5000;
    return {
        "title": `TSS counts in ${strand === "+" ? "forward" : "reverse"} strand`,
        "data": {
            "type": "csv",
            "url": "/api/getAggregated/" + filePath + "/" + genomeName + "/" + binSize,
            "genomicFields": ["binStart", "binEnd"],
            "sampleLength": 2000
        },
        "dataTransform": [
            { "type": "filter", "field": "strand", "oneOf": [strand] },
            { "type": "filter", "field": "typeTSS", "oneOf": filterTSS }

        ],
        "id": `aggregated_tss_${strand}_${binSize}_${genomeName}`,
        "x": { "field": "binStart", "type": "genomic", "axis": "none" },
        "xe": { "field": "binEnd", "type": "genomic", "axis": "none" },
        "mark": "bar",
        width: width,
        "y": {
            "field": "count",
            "type": "quantitative",
            "axis": "left",
            "domain": [0, maxValueBin[strand]],
            "flip": strand === "-",
            "zeroBaseline": strand === "+"
        },
        "color": {
            "field": "mainClass",
            "type": "nominal",
            "domain": ORDER_TSS_CLASSES,
            "range": COLORS_TSS,
            "legend": viewType === "single" ? strand === "+" : false
        },
        "tooltip": [
            { "field": "binStart", "alt": "Bin start" },
            { "field": "binEnd", "alt": "Bin end" },
            {
                "field": "mainClass",
                "type": "nominal",
                "alt": "Main TSS class",
            },
            { "field": "count", "alt": "Number of TSS" },
            { "field": "typeTSS", "alt": "Enriched or Detected?" }
        ],
        "visibility": [
            {
                "operation": "GT",
                "measure": "zoomLevel",
                "threshold": GT,
                "transitionPadding": transitionPadding,
                "target": "track"
            },
            !isNaN(LT) &&
            {
                "operation": "LT",
                "measure": "zoomLevel",
                "threshold": LT,
                "transitionPadding": transitionPadding,
                "target": "track"
            }
        ]
    }
}

export const createDetailTSSTrack = (filePath, strand, filterTSS, TSS_DETAIL_LEVEL_ZOOM, viewType, genomeName, width) => {
    return {
        "data": {
            "type": "csv",
            "url": "/api/getSingleTSS/" + filePath + "/" + genomeName,
            "genomicFields": ["superPos"],
        },
        "dataTransform": [
            { "type": "filter", "field": "superStrand", "oneOf": [strand] },
            { "type": "filter", "field": "typeTSS", "oneOf": filterTSS }
        ],
        width: width,

        "id": `detail_tss_${strand}_${genomeName}`,
        "x": { "field": "superPos", "type": "genomic", "axis": "top" },
        "mark": strand === "+" ? "triangleRight" : "triangleLeft",
        "style": { "align": strand === "+" ? "left" : "right" },
        "size": { "value": 10, "legend": false, axis: "none" },
        "color": {
            "field": "mainClass",
            "type": "nominal",
            "domain": ORDER_TSS_CLASSES,
            "range": COLORS_TSS,
            "legend": viewType === "single" ? strand === "+" : false
        },
        "tooltip": [
            { "field": "superPos", "type": "genomic", "alt": "TSS Position" },
            {
                "field": "mainClass",
                "type": "nominal",
                "alt": "Main TSS class",
            },
            { "field": "classesTSS", "alt": "All TSS classes" },
            { "field": "typeTSS", "alt": "Enriched or Detected?" }

        ],
        "visibility": [
            {
                "operation": "LT",
                "measure": "zoomLevel",
                "threshold": TSS_DETAIL_LEVEL_ZOOM,
                "transitionPadding": 0,
                "target": "track"
            }
        ]
    };
}

export const createGFFTrack = (filePath, genomeName, strand, width) => {
    const TSS_DETAIL_LEVEL_ZOOM = 50000;
    let transitionPadding = 5000;
    return [{
        "alignment": "overlay",
        "height": 60,
        width: width,
        "data": {
            "type": "csv",
            "url": "/api/getGFFData/" + filePath + "/" + genomeName + "/" + (strand === "+" ? "Plus" : "Minus"),
            "genomicFields": ["start", "end"],
        },
        "mark": "rect",
        "x": { "field": "start", "type": "genomic", "axis": "none" },
        "xe": { "field": "end", "type": "genomic", "axis": "none" },
        "color": { "value": "darkgrey" },
        "opacity": { "value": 0.75 },
        "size": { "value": 4 },
        "tracks": [
            {
                "tooltip": [
                    { "field": "start", "alt": "Gene Start" },
                    { "field": "end", "alt": "Gene End" },
                    {
                        "field": "locus_tag",
                        "type": "nominal",
                        "alt": "Locus Tag",
                    },
                    { "field": "product", "alt": "Gene Product" },
                ],
            }, {
                "mark": "text",
                "text": { "field": "locus_tag", "type": "nominal" },
                "x": { "field": "start", "type": "genomic" },
                "xe": { "field": "end", "type": "genomic" },
                "size": { "value": 8 },
                "style": { "textFontSize": 8, "dy": -12 },
                "visibility": [
                    {
                        "operation": "LT",
                        "measure": "zoomLevel",
                        "threshold": TSS_DETAIL_LEVEL_ZOOM,
                        "transitionPadding": transitionPadding,
                        "target": "track"
                    }]
            }]
    }]

}
