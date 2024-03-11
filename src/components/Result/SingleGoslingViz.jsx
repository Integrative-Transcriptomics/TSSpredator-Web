
import React, { useEffect, useState, useRef } from 'react';
import { GoslingComponent } from "gosling.js";

/**
 * Renders a genome visualization using Gosling.js library.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The data used for visualization.
 * @returns {JSX.Element} - The rendered genome visualization component.
 */
function GoslingGenomeViz({ dataGosling, showPlot, filter, filePath }) {
    const COLORS_TSS = ["#377eb8", "#fb8072", "#fed9a6", "#8dd3c7", "#decbe4"]
    const ORDER_TSS_CLASSES = ["Primary", "Secondary", "Internal", "Antisense", "Orphan"]
    const [spec, setSpec] = useState(null);
    const gosRef = useRef(null)




    useEffect(() => {
        const data = dataGosling
        const maxValue = Math.max(...Object.values(data).map(d => d["lengthGenome"]));
        const allViews = getViews(data, filePath)
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

    }, [dataGosling]);

    const createGenomeTrack = (filePath, genome) => {
        return [{
            "alignment": "overlay",
            "height": 20,
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

    const createGFFTrack = (data) => {
        const TSS_DETAIL_LEVEL_ZOOM = 50000;
        let transitionPadding = 5000;
        return [{
            "alignment": "overlay",
            "height": 60,
            "data": {
                "values": data,
                "type": "json",
                "genomicFields": ["start", "end"]
            },
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
    const createGeneTrack = (data, filePath, genome) => {
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
                }, {
                    "data": {
                        "url": "/api/provideFasta/" + filePath + "/" + genome + "/",
                        "type": "csv",
                        "separator": "\t",
                        "headerNames": ["pos", "base"],
                    },
                    "mark": "text",
                    "text": { "field": "base", "type": "nominal" },
                    "x": { "field": "pos", "type": "genomic" },
                    "y": { "value": 0 },
                    "style": { "textFontWeight": "bold", "dy": 2, "align": "center" },
                    "size": { "value": 18 },
                    "color": {
                        "field": "base",
                        "type": "nominal",
                        "domain": ["A", "T", "G", "C", "-"],
                    },
                    "displacement": { "type": "pile", "padding": 2 },

                    "visibility": [
                        {
                            "operation": "LT",
                            "measure": "zoomLevel",
                            "threshold": 150,
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
                            "measure": "width",
                            "threshold": "|xe-x|",
                            "transitionPadding": 30,
                            "target": "mark"
                        }
                    ],
                },
            ]
        }]


    }
    const createWiggleTracks = (TSS_DETAIL_LEVEL_ZOOM, strand, genome, filePath) => {
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
                "style": { "align": strand === "+" ? "left" : "right" },
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

    const createTSSTrack = (data, aggregatedTSS, binSizes, strand, maxGenome, title = null, filePath) => {
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
                    flip: strand === "-",
                    zeroBaseline: strand === "+"
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
        let specsWiggle = createWiggleTracks(TSS_DETAIL_LEVEL_ZOOM, strand, title, filePath)
        return [
            {

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
                    }, ...binnedViews,
                    ...specsWiggle


                ]
            }

        ]
    }

    const createTracks = (data, genomeName, maxGenome, filePath) => {
        let forwardGenes = createGFFTrack(data["superGFF"].filter(d => d["strand"] === "+"));
        let reverseGenes = createGFFTrack(data["superGFF"].filter(d => d["strand"] === "-"));
        let fastaTrack = createGenomeTrack(filePath, genomeName);


        let TSSTracks_plus = createTSSTrack(data["TSS"], data["aggregatedTSS"], data["maxAggregatedTSS"], "+", maxGenome, genomeName, filePath);
        let TSSTracks_minus = createTSSTrack(data["TSS"], data["aggregatedTSS"], data["maxAggregatedTSS"], "-", maxGenome, genomeName, filePath);
        let TSSTracks = [TSSTracks_plus, TSSTracks_minus];
        return [...TSSTracks[0], ...forwardGenes, ...fastaTrack, ...reverseGenes, ...TSSTracks[1]];
    }

    const getViews = (data, filePath) => {
        let views = [];
        for (let genome of Object.keys(data)) {
            views.push({
                "alignment": "stack",
                "title": genome,

                "assembly": [[genome, data[genome]["lengthGenome"]]],
                "spacing": 0,
                "layout": "linear",
                "tracks": createTracks(data[genome], genome, data[genome]["lengthGenome"], filePath)
            })
        }
        return views;

    }



    return <div style={{ padding: "0 !important", width: "100vw" }}>
        <GoslingComponent spec={spec} ref={gosRef} />
    </div>
        ;



}



export default GoslingGenomeViz