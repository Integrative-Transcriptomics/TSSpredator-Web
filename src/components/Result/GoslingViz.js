import React from 'react';
import { GoslingComponent } from "gosling.js";


/** creates an Upset plot for the tss classes
 * 
 * @param classes: all classes and their frequency
 * @param showUpSet: boolean for showing/hiding the plot
 */
function GoslingGenomeViz({ data }) {

    let spec = {
        "alignment": "overlay",
        "title": "Position of TSSs",
        "assembly": [["", 250000]],
        "data": {
            "values": data,
            "type": "json",
            "genomicFields": ["pos"]
        },
        "row": { "field": "strand", "type": "nominal", "domain": ["+", "-"] },
        "color": {
            "field": "class",
            "type": "nominal",

            "domain": ["primary", "secondary", "internal", "antisense", "orphan"],
            "range": ["#7585FF", "#FF8A85", "#FFC785", "#85FFD9", "#B285FF"],
            "legend": true
        },
        "visibility": [
            {
                "operation": "less-than",
                "measure": "width",
                "threshold": "|xe-x|",
                "transitionPadding": 10,
                "target": "mark"
            }
        ],
        "opacity": { "value": 0.8 },
        "width": 350,
        "height": 100,
        "tracks": [
            {
                "dataTransform": [
                    { "type": "filter", "field": "strand", "oneOf": ["+"] }
                ],
                "mark": "triangleRight",
                "x": { "field": "pos", "type": "genomic", "axis": "top" },
                "size": { "value": 15 }
            },
            {
                "dataTransform": [
                    { "type": "filter", "field": "strand", "oneOf": ["-"] }
                ],
                "mark": "triangleLeft",
                "x": { "field": "pos", "type": "genomic" },
                "size": { "value": 15 },
                "style": { "align": "right" }

            }
        ]
    }

    return <GoslingComponent spec={spec} />;
}

export default GoslingGenomeViz