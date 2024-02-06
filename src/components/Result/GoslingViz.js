
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
        console.log(aggregatedTSS);
        console.log(data);
        return [
            {
                "title": title,
                "alignment": "overlay",
                "data": {
                    "values": data.filter(d => filter.includes(d["typeTSS"])),
                    "type": "json",
                    "genomicFields": ["superPos"],
                },

                "color": {
                    "field": "mainClass",
                    "type": "nominal",
                    "domain": ["Primary", "Secondary", "Internal", "Antisense", "Orphan"],
                    "range": ["#7585FF", "#FF8A85", "#FFC785", "#85FFD9", "#B285FF"],
                    "legend": strand === "+"
                },
                "tracks": [
                    {

                        "dataTransform": [
                            { "type": "filter", "field": "superStrand", "oneOf": [strand] }
                        ],
                        "x": { "field": "superPos", "type": "genomic", "axis": strand === "+" ? "top" : "none" },
                        "mark": strand === "+" ? "triangleRight" : "triangleLeft",
                        "style": { "align": strand === "+" ? "left" : "right" },
                        "size": { "value": 15 },
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
                                "threshold": 50000,
                                "transitionPadding": 500,
                                "target": "mark"
                            }
                        ]
                    }, ...[
                        { "GT": 50000, "LT": 200000, "size": 5000 },
                        { "GT": 200000, "LT": 500000, "size": 10000 },
                        { "GT": 500000, "LT": null, "size": 50000 }].map(({ GT, LT, size }) => {
                            console.log(GT, LT, size);
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
                                "y": { "field": "count", "type": "quantitative" },
                                "color": {
                                    "field": "mainClass",
                                    "type": "nominal",
                                    "domain": ["Primary", "Secondary", "Internal", "Antisense", "Orphan"],
                                    "range": ["#7585FF", "#FF8A85", "#FFC785", "#85FFD9", "#B285FF"],
                                    "legend": false
                                },
                                "tooltip": [
                                    { "field": "binStart", "type": "genomic", "alt": "Bin start" },
                                    {
                                        "field": "mainClass",
                                        "type": "nominal",
                                        "alt": "Main TSS class",
                                    },
                                    { "field": "count", "alt": "Number of TSS" },
                                    { "field": "binEnd", "alt": "Bin end" },
                                ],
                                "visibility": [
                                    {
                                        "operation": "GT",
                                        "measure": "zoomLevel",
                                        "threshold": GT,
                                        "transitionPadding": 10,
                                        "target": "mark"
                                    },
                                    {
                                        "operation": "LT",
                                        "measure": "zoomLevel",
                                        "threshold": LT,
                                        "transitionPadding": 10,
                                        "target": "mark"
                                    }
                                ]
                            }
                        })

                    ,
                    // {
                    //     "data": {
                    //         "values": [{ "test": 1, "binStart": 12, "binEnd": 412 }],
                    //         "type": "json",
                    //         // "genomicFields": ["binStart", "binEnd"],

                    //     },
                    //     // "dataTransform": [
                    //     //     { "type": "filter", "field": "strand", "oneOf": [strand] }
                    //     // ],
                    //     // "x": { "field": "binStart", "type": "genomic", "axis": "none" },
                    //     // "size": { "value": 1 },
                    //     // "color": {
                    //     //     "field": "typeTSS",
                    //     //     "type": "nominal",
                    //     //     "domain": ["Primary", "Secondary", "Internal", "Antisense", "Orphan"],
                    //     //     "range": ["#7585FF", "#FF8A85", "#FFC785", "#85FFD9", "#B285FF"],
                    //     //     "legend": false
                    //     // },
                    //     "mark": "bar",
                    // }
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