
export const createWiggleTracks = (TSS_DETAIL_LEVEL_ZOOM, strand, genome, filePath) => {
    return ["Normal", "FivePrime"].map(type => {
        return {
            "data": {
                "url": `/api/provideBigWig/${filePath}/${genome}/${strand === "+" ? "Plus" : "Minus"}/${type}`,
                "type": "bigwig",
                "binSize": 1,
                "aggregation": "mean"


            },
            "mark": "bar",
            "x": { "field": "start", "type": "genomic", },
            "xe": { "field": "end", "type": "genomic", },
            "style": { "align": strand === "+" ? "left" : "right", backgroundOpacity: 0 },
            "y": { "field": "value", "type": "quantitative", "range": strand === "+" & [0, 90], flip: strand === "-" },
            "color": { "value": type === "Normal" ? "gray" : "orange" },
            "stroke": { "value": "gray" },
            "opacity": { "value": 0.25 },

            "visibility": [
                {
                    "operation": "LT",
                    "measure": "zoomLevel",
                    "threshold": TSS_DETAIL_LEVEL_ZOOM,
                    "transitionPadding": 100,
                    "target": "track"
                }
            ],
            "tooltip": [
                { "field": "start", "alt": "start" },
                { "field": "end", "alt": "Bin end" },
                { "field": "position", "alt": "pos" },
                {
                    "field": "value",
                    "alt": "val",
                },
            ],
        }
    }
    )
}

export const createGenomeTrack = (filePath, genome, strand = "") => {
    return [{
        "alignment": "overlay",
        "height": 20,
        "id": `${genome}${strand}`,

        "data": {
            "url": "/api/provideFasta/" + filePath + "/" + genome + "/",
            "type": "csv",
            "separator": "\t",
            "headerNames": ["pos", "base"],
        },
        "mark": "text",
        "text": { "field": "base", "type": "nominal" },
        "x": { "field": "pos", "type": "genomic" },
        "style": { "textFontWeight": "bold", "align": "center" },
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
                        "threshold": 500,
                        "transitionPadding": 1000,
                        "target": "mark"
                    }]

            }

        ]
    }]


}