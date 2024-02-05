
import React, { useEffect, useState } from 'react';
import { GoslingComponent } from "gosling.js";

/**
 * Renders a genome visualization using Gosling.js library.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The data used for visualization.
 * @returns {JSX.Element} - The rendered genome visualization component.
 */
function GoslingGenomeViz({ dataKey, showPlot, filter }) {

    const [spec, setSpec] = useState(null);

    const fetchData = async (dataKey) => {
        const dataPerGenome = await fetch(`/api/TSSViewer/${dataKey}/`);
        const data = await dataPerGenome.json();
        return data;
    };

    useEffect(() => {
        const fetchDataPerGenome = async () => {
            const data = await fetchData(dataKey);
            return data;
        };

        const fetchDataAndSetSpec = async () => {
            try {
                const data = await fetchDataPerGenome();
                if (data["result"] !== "success") {
                    console.error("Error fetching data:", data);
                    return;
                }
                const spec = {
                    "arrangement": "vertical",
                    "spacing": 50,
                    "views": getViews(data["data"])
                };
                console.log(spec);
                setSpec(spec);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchDataAndSetSpec();
    }, [dataKey]);


    const createGeneTrack = (data) => {

        return [{
            "alignment": "overlay",
            "data": {
                "values": data,
                "type": "json",
                "genomicFields": ["start", "end"]
            },
            "row": { "field": "strand", "type": "nominal", "domain": ["+", "-"] },
            "mark": "rect",
            "x": { "field": "start", "type": "genomic", "axis": "none" },
            "xe": { "field": "end", "type": "genomic", "axis": "none" },
            "color": { "value": "grey" },
            "opacity": { "value": 0.4 },
            "size": { "value": 4 },
            "tracks": [{

                "dataTransform": [
                    { "type": "filter", "field": "strand", "oneOf": "+" }
                ],
            }, {

                "dataTransform": [
                    { "type": "filter", "field": "strand", "oneOf": "-" }
                ],
            }
            ]
        }]


    }

    const createTSSTrack = (data, strand, title = null) => {
        return [
            {
                "title": title,
                "alignment": "overlay",
                "data": {
                    "values": data.filter(d => filter.includes(d["typeTSS"])),
                    "type": "json",
                    "genomicFields": ["superPos"],
                },
                // "row": { "field": "superStrand", "type": "nominal", "domain": ["+", "-"] },
                // "mark": "point",
                // "x": { "field": "superPos", "type": "genomic", "axis": "top" },

                "color": {
                    "field": "mainClass",
                    "type": "nominal",

                    "domain": ["Primary", "Secondary", "Internal", "Antisense", "Orphan"],
                    "range": ["#7585FF", "#FF8A85", "#FFC785", "#85FFD9", "#B285FF"],
                    "legend": strand === "+"
                },
                "tracks": [{
                    "dataTransform": [
                        { "type": "filter", "field": "superStrand", "oneOf": [strand] }
                    ],
                    "x": { "field": "superPos", "type": "genomic", "axis": strand === "+" ? "top" : "none" },
                    "mark": strand === "+" ? "triangleRight" : "triangleLeft",
                    "style": { "align": strand === "+" ? "left" : "right" },
                    "size": { "value": 15 },
                },
                {
                    "data": {
                        "values": data.filter(d => filter.includes(d["typeTSS"])),
                        "type": "json",
                        "genomicFields": ["superPos"],
                        "binSize": 10,
                    },
                    "dataTransform": [
                        { "type": "filter", "field": "superStrand", "oneOf": [strand] }
                    ],
                    "x": { "field": "superPos", "type": "genomic", "aggregate": "bin", "axis": "none" },
                    "xe": { "field": "superPos", "type": "genomic" },
                    // "size": { "value": 10 },
                    "y": {
                        "field": "mainClass", "type": "nominal", "axis": "none",
                        "domain": ["Primary", "Secondary", "Internal", "Antisense", "Orphan"],
                        "range": [50, 50, 50, 50, 50],
                        "aggregate": "count"

                    },
                    "mark": "bar",
                    // "y": { "type": "quantitative", "axis": "none" },
                }]
            }

        ]
    }

    const createTracks = (data, title) => {
        let geneTracks = createGeneTrack(data["superGFF"]);
        let TSSTracks_plus = createTSSTrack(data["TSS"], "+", title);
        let TSSTracks_minus = createTSSTrack(data["TSS"], "-");
        return TSSTracks_plus.concat(geneTracks).concat(TSSTracks_minus);

    }

    const getViews = (data) => {
        let views = [];
        console.log(data);
        for (let genome of Object.keys(data)) {
            views.push({
                "alignment": "stack",
                "title": genome,
                "assembly": [["", data[genome]["maxValue"]]],
                "spacing": 0,
                "layout": "linear",
                "tracks": createTracks(data[genome], genome,)
            })
        }
        return views;

    }

    return spec && <GoslingComponent spec={spec} />



}



export default GoslingGenomeViz