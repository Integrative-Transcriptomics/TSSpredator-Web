
import React, { useEffect, useState } from 'react';
import { GoslingComponent } from "gosling.js";

/**
 * Renders a genome visualization using Gosling.js library.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The data used for visualization.
 * @returns {JSX.Element} - The rendered genome visualization component.
 */
function GoslingGenomeViz({ dataKey, showPlot, filter }) {
    const COLORS_TSS = ["#377eb8", "#fb8072", "#fed9a6", "#8dd3c7", "#decbe4"]
    const ORDER_TSS_CLASSES = ["Primary", "Secondary", "Internal", "Antisense", "Orphan"]
    const [spec, setSpec] = useState(null);

    const fetchData = async (dataKey) => {
        const dataPerGenome = await fetch(`/api/TSSViewer/${dataKey}/`);
        const data = await dataPerGenome.json();
        console.log("Data fetched", data);
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
                const maxValue = Math.max(...Object.values(data["data"]).map(d => d["maxValue"]));
                const allViews = getViews(data["data"])
                const distributedViews = [{
                    "arrangement": "vertical",
                    "views": allViews.filter((_, i) => i < allViews.length / 2)
                }, {
                    "arrangement": "vertical",
                    "views": allViews.filter((_, i) => i >= allViews.length / 2)
                }]

                const spec = {
                    style: { background: "gray", backgroundOpacity: 0.05, outline: "black", outlineWidth: 2 },
                    "title": "Visualization of TSSs and Genes",
                    "arrangement": "horizontal",
                    "spacing": 50,
                    "linkingId": "detail",
                    "zoomLimits": [0, maxValue],

                    "views": distributedViews
                };
                setSpec(spec);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchDataAndSetSpec();
    }, [dataKey]);


    const createGeneTrack = (data) => {
        const TSS_DETAIL_LEVEL_ZOOM = 50000;
        let transitionPadding = 5000;


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
            "tracks": [
                {
                    "tooltip": [
                        { "field": "start", "type": "genomic", "alt": "Gene Start" },
                        { "field": "end", "type": "genomic", "alt": "Gene End" },
                        {
                            "field": "locus_tag",
                            "type": "nominal",
                            "alt": "Locus Tag",
                        }, {
                            "field": "gene_name",
                            "type": "nominal",
                            "alt": "Gene name",
                        },
                        { "field": "product", "alt": "Gene Product" },
                    ],

                    "dataTransform": [
                        { "type": "filter", "field": "strand", "oneOf": "+" }
                    ],
                }, {
                    "dataTransform": [
                        { "type": "filter", "field": "strand", "oneOf": ["+"] }
                    ],
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
                },
                {

                    "dataTransform": [
                        { "type": "filter", "field": "strand", "oneOf": "-" }
                    ],
                },
                {
                    "dataTransform": [
                        { "type": "filter", "field": "strand", "oneOf": ["-"] }
                    ],
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
                },
            ]
        }]


    }

    const createTSSTrack = (data, aggregatedTSS, binSizes, wiggleData, strand, maxGenome, title = null) => {
        console.log("Creating TSS track for strand", strand);
        console.log("Wiggle", wiggleData);
        const TSS_DETAIL_LEVEL_ZOOM = 50000;
        let sizesBins = Object.keys(binSizes).sort((a, b) => parseInt(a) - parseInt(b)).map((size, i, arr) => {
            return {
                "GT": i === 0 ? TSS_DETAIL_LEVEL_ZOOM : arr[i - 1] * 40,
                "LT": (i === Object.keys(binSizes).length - 1) ? maxGenome * 1.1 : size * 40,
                size: parseInt(size), maxValueBin: binSizes[size]
            }
        })
        let binnedViews = sizesBins.map(({ GT, LT, size, maxValueBin }) => {
            let transitionPadding = 5000;
            return {
                "data": {
                    "values": aggregatedTSS[size].filter(d => filter.includes(d["typeTSS"])).sort((a, b) => ORDER_TSS_CLASSES.indexOf(a["mainClass"]) - ORDER_TSS_CLASSES.indexOf(b["mainClass"])),
                    "type": "json",
                    "genomicFields": ["binStart", "binEnd"],
                },
                "dataTransform": [
                    { "type": "filter", "field": "strand", "oneOf": [strand] }
                ],
                "x": { "field": "binStart", "type": "genomic", "axis": strand === "+" ? "top" : "none", },
                "xe": { "field": "binEnd", "type": "genomic", "axis": "none" },
                "mark": "bar",
                "y": {
                    "field": "count",
                    "type": "quantitative",
                    axis: "left",
                    domain: [0, maxValueBin[strand]],
                    range: [0, 90],
                    // flip: strand === "-"
                },
                "color": {
                    "field": "mainClass",
                    "type": "nominal",
                    "domain": ORDER_TSS_CLASSES,
                    "range": COLORS_TSS,
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
                        "threshold": LT,
                        "transitionPadding": transitionPadding,
                        "target": "track"
                    }
                ]
            }
        });
        return [
            {

                "alignment": "overlay",
                "data": {
                    "values": data.filter(d => filter.includes(d["typeTSS"])),
                    "type": "json",
                    "genomicFields": ["superPos"],
                },


                "tracks": [{
                    "data": {
                        "url": `/api/provideBigWig/${wiggleData["FivePrime"]["path"]}/${wiggleData["FivePrime"]["filename"]}`,
                        "type": "bigwig",
                        value: "peak"
                    },
                    "mark": "line",
                    "x": { "field": "pos", "type": "genomic", "axis": "none" },
                    "y": { "field": "value", "type": "quantitative", "axis": "right" },
                    "color": { "value": "black" },
                    "size": { "value": 2 },
                    "visibility": [
                        {
                            "operation": "LT",
                            "measure": "zoomLevel",
                            "threshold": TSS_DETAIL_LEVEL_ZOOM,
                            "transitionPadding": 0,
                            "target": "track"
                        }
                    ]
                },
                {
                    "title": title,
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
                        "domain": ORDER_TSS_CLASSES,
                        "range": COLORS_TSS,
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
                            "threshold": TSS_DETAIL_LEVEL_ZOOM,
                            "transitionPadding": 0,
                            "target": "track"
                        }
                    ]
                }, ...binnedViews

                ]
            }

        ]
    }

    const createTracks = (data, title, maxGenome) => {
        let geneTracks = createGeneTrack(data["superGFF"]);
        // create dummy wiggle data
        let TSSTracks_plus = createTSSTrack(data["TSS"], data["aggregatedTSS"], data["maxAggregatedTSS"], data["RNAGraphs"]["plus"], "+", maxGenome, title);
        let TSSTracks_minus = createTSSTrack(data["TSS"], data["aggregatedTSS"], data["maxAggregatedTSS"], data["RNAGraphs"]["minus"], "-", maxGenome);
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
                "tracks": createTracks(data[genome], genome, data[genome]["maxValue"])
            })
        }
        return views;

    }

    return showPlot && (spec && <div style={{ padding: "0 !important", width: "100vw" }}>
        <GoslingComponent spec={spec} />
    </div>
    );



}



export default GoslingGenomeViz