
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
                    "linkingId": "detail",
                    "views": getViews(data["data"])
                };
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
                "tooltip": [
                    { "field": "start", "type": "genomic", "alt": "Gene Start" },
                    { "field": "end", "type": "genomic", "alt": "Gene End" },
                    {
                        "field": "locus_tag",
                        "type": "nominal",
                        "alt": "Locus Tag",
                    },
                    { "field": "product", "alt": "Gene Product" },
                ],

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

    const createTSSTrack = (data, aggregatedTSS, strand, title = null) => {
        let binnedViews = [
            { "GT": 50000, "LT": 200000, "size": 5000 },
            { "GT": 200000, "LT": 500000, "size": 10000 },
            { "GT": 500000, "LT": NaN, "size": 50000 }].map(({ GT, LT, size }) => {
                let transitionPadding = 20000;
                return {
                    "data": {
                        "values": aggregatedTSS[size].filter(d => filter.includes(d["typeTSS"])),
                        "type": "json",
                        "genomicFields": ["binStart", "binEnd"],
                    },
                    "dataTransform": [
                        { "type": "filter", "field": "strand", "oneOf": [strand] }
                    ],
                    "x": { "field": "binStart", "type": "genomic", "axis": strand === "+" ? "top" : "none", },
                    "xe": { "field": "binEnd", "type": "genomic", },
                    "mark": "bar",
                    "y": { "field": "count", "type": "quantitative", axis: "left" },
                    "color": {
                        "field": "mainClass",
                        "type": "nominal",
                        "domain": ["Primary", "Secondary", "Internal", "Antisense", "Orphan"],
                        "range": ["#7585FF", "#FF8A85", "#FFC785", "#85FFD9", "#B285FF"],
                        "legend": strand === "+"
                    },
                    "tooltip": [
                        { "field": "binStart", "type": "genomic", "alt": "Bin start" },
                        { "field": "binEnd", "alt": "Bin end" },
                        {
                            "field": "mainClass",
                            "type": "nominal",
                            "alt": "Main TSS class",
                        },
                        { "field": "count", "alt": "Number of TSS" },
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
                            "threshold": LT + 7500,
                            "transitionPadding": transitionPadding,
                            "target": "track"
                        }
                    ]
                }
            });
        return [
            {
                "title": title,
                "alignment": "overlay",
                "data": {
                    "values": data.filter(d => filter.includes(d["typeTSS"])),
                    "type": "json",
                    "genomicFields": ["superPos"],
                },


                "tracks": [
                    {

                        "dataTransform": [
                            { "type": "filter", "field": "superStrand", "oneOf": [strand] }
                        ],
                        "x": { "field": "superPos", "type": "genomic", "axis": strand === "+" ? "top" : "none" },
                        "mark": strand === "+" ? "triangleRight" : "triangleLeft",
                        "style": { "align": strand === "+" ? "left" : "right" },
                        "size": { "value": 10, "legend": false, axis: "none" },
                        "color": {
                            "field": "mainClass",
                            "type": "nominal",
                            "domain": ["Primary", "Secondary", "Internal", "Antisense", "Orphan"],
                            "range": ["#7585FF", "#FF8A85", "#FFC785", "#85FFD9", "#B285FF"],
                            "legend": strand === "+"
                        },
                        "tooltip": [
                            { "field": "superPos", "type": "genomic", "alt": "TSS Position" },
                            {
                                "field": "mainClass",
                                "type": "nominal",
                                "alt": "Main TSS class",
                            },
                            { "field": "classesTSS", "alt": "All TSS classes" },
                        ],
                        "visibility": [
                            {
                                "operation": "LT",
                                "measure": "zoomLevel",
                                "threshold": 57500,
                                "transitionPadding": 0,
                                "target": "track"
                            }
                        ]
                    }, ...binnedViews
                ]
            }

        ]
    }

    const createTracks = (data, title) => {
        let geneTracks = createGeneTrack(data["superGFF"]);
        let TSSTracks_plus = createTSSTrack(data["TSS"], data["aggregatedTSS"], "+", title);
        let TSSTracks_minus = createTSSTrack(data["TSS"], data["aggregatedTSS"], "-");
        return TSSTracks_plus.concat(geneTracks).concat(TSSTracks_minus);
    }

    const getViews = (data) => {
        let views = [];
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