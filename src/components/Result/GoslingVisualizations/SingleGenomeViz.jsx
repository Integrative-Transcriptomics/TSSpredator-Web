
import React, { useEffect, useState, useRef } from 'react';
import { GoslingComponent } from "gosling.js";
import { ClipLoader } from "react-spinners";
import { createWiggleTracksTest, createGenomeTrack } from "./SharedGoslingFunctions.js";
/**
 * Renders a genome visualization using Gosling.js library.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The data used for visualization.
 * @returns {JSX.Element} - The rendered genome visualization component.
 */
function SingleGenomeViz({ dataGosling, filter, filePath, settingGosRef, COLORS_TSS, ORDER_TSS_CLASSES }) {
    const [spec, setSpec] = useState(null);
    const gosRef = useRef(null);

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
            "title": "Visualization of TSSs and Genes grouped by genome/condition",
            "subtitle": "Distribution of TSSs and genes per the genomes/conditions. At higher levels, the TSSs are aggregated by their main class and their strand location.",
            "description": "The TSSs are aggregated by their main class and their strand location. At higher genomic zoom levels, the TSSs are binned and the number of TSSs per bin is shown.",
            "arrangement": "horizontal",
            "spacing": 50,
            "linkingId": "detail", // linkingId is used to enable zooming and panning across views
            "zoomLimits": [0, maxValue],
            "views": distributedViews,
        };
        setSpec(spec);
        settingGosRef(gosRef)

    }, [dataGosling]);

    // const createGenomeTrack = (filePath, genome) => {
    //     return [{
    //         "alignment": "overlay",
    //         "height": 20,
    //         "id": genome,
    //         "data": {
    //             "url": "/api/provideFasta/" + filePath + "/" + genome + "/",
    //             "type": "csv",
    //             "separator": "\t",
    //             "headerNames": ["pos", "base"],
    //         },
    //         "mark": "text",
    //         "text": { "field": "base", "type": "nominal" },
    //         "x": { "field": "pos", "type": "genomic" },
    //         "style": { "textFontWeight": "bold", "align": "center", background: "lightgray", backgroundOpacity: 0.25 },
    //         "size": { "value": 16 },
    //         "color": {
    //             "field": "base",
    //             "type": "nominal",
    //             "domain": ["A", "T", "G", "C", "-"],
    //             "range": ["#FF0000", "#0000FF", "#008000", "#FFA500", "#000000"]
    //         },
    //         "tracks": [
    //             {
    //                 "visibility": [
    //                     {
    //                         "operation": "LT",
    //                         "measure": "zoomLevel",
    //                         "threshold": 500,
    //                         "transitionPadding": 1000,
    //                         "target": "mark"
    //                     }]

    //             }

    //         ]
    //     }]


    // }

    const createGFFTrack = (data, strand) => {
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
            "style": { background: strand === "+" ? "lightblue" : "#f59f95", backgroundOpacity: 0.15 },
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
                "title": `TSS counts in ${strand === "+" ? "forward" : "reverse"} strand `,
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
                "style": { background: strand === "+" ? "lightblue" : "#f59f95", backgroundOpacity: 0.25 },
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
                    { "field": "binStart", "alt": "Bin start" },
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
        let specsWiggle = createWiggleTracksTest(TSS_DETAIL_LEVEL_ZOOM, strand, title, filePath)
        return [
            {

                "alignment": "overlay",
                "data": {
                    "values": data.filter(d => filter.includes(d["typeTSS"])),
                    "type": "json",
                    "genomicFields": ["superPos"],
                },
                "style": { background: strand === "+" ? "lightblue" : "#f59f95", backgroundOpacity: 0.25 },
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
        let forwardGenes = createGFFTrack(data["superGFF"].filter(d => d["strand"] === "+"), "+");
        let reverseGenes = createGFFTrack(data["superGFF"].filter(d => d["strand"] === "-"), "-");
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
                style: { background: "lightgray", backgroundOpacity: 0.25, outline: "black", outlineWidth: 2 },

                "alignment": "stack",
                "assembly": [[genome, data[genome]["lengthGenome"]]],
                "spacing": 0,
                "layout": "linear",
                "tracks": createTracks(data[genome], genome, data[genome]["lengthGenome"], filePath)
            })
        }
        return views;

    }



    return <>
        {spec === null ? <ClipLoader color='#ffa000' size={30} /> : <GoslingComponent spec={spec} ref={gosRef} />}
    </>
        ;



}



export default SingleGenomeViz