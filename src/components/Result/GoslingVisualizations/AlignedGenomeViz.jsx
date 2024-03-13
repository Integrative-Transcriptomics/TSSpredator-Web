
import React, { useEffect, useState, useRef } from 'react';
import { GoslingComponent } from "gosling.js";
import { ClipLoader } from "react-spinners";
import { createGenomeTrack, createWiggleTracksTest } from "./SharedGoslingFunctions.js"


/**
 * Renders a genome visualization using Gosling.js library.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The data used for visualization.
 * @returns {JSX.Element} - The rendered genome visualization component.
 */
function AlignedGenomeViz({ dataGosling, filter, filePath, settingGosRef, COLORS_TSS, ORDER_TSS_CLASSES }) {


    const [spec, setSpec] = useState(null);
    const gosRef = useRef(null);

    useEffect(() => {
        const data = dataGosling
        const maxValue = Math.max(...Object.values(data).map(d => d["lengthGenome"]));
        const [view_forward, view_reverse] = getViews(data, filePath)
        const distributedViews = [{
            "style": { "background": "lightblue", "backgroundOpacity": 0.25, "outline": "black", "outlineWidth": 2 },
            "subtitle": "Reverse strand",
            "spacing": 0,
            "arrangement": "vertical",
            "views": view_reverse
        }, {
            "style": { "background": "#f59f95", "backgroundOpacity": 0.25, "outline": "black", "outlineWidth": 2 },
            "subtitle": "Reverse strand",

            "spacing": 0,
            "arrangement": "vertical",
            "views": view_forward
        },]

        const spec = {
            // "style": { "background": "gray", "backgroundOpacity": 0.05, "outline": "black", "outlineWidth": 2 },
            "title": "Visualization of TSSs and genes grouped by strand",
            "arrangement": "horizontal",
            "spacing": 50,
            "linkingId": "detail", // linkingId is used to enable zooming and panning across views

            "zoomLimits": [0, maxValue],
            "views": distributedViews,
            // "views": [...view_reverse, ...view_forward,],
        };
        setSpec(spec);
        settingGosRef(gosRef)

    }, [dataGosling]);



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
                "y": { "field": "value", "type": "quantitative", flip: strand === "-" },
                "color": { "value": type === "Normal" ? "gray" : "orange" },
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
                "size": parseInt(size),
                "maxValueBin": binSizes[size]
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
                "x": { "field": "binStart", "type": "genomic", "axis": "none", },
                "xe": { "field": "binEnd", "type": "genomic", "axis": "none" },
                "mark": "bar",
                "y": {
                    "field": "count",
                    "type": "quantitative",
                    "axis": strand == "+" ? "left" : "right",
                    domain: [0, maxValueBin[strand]],
                    flip: strand === "-",
                    zeroBaseline: strand === "+"
                },
                "color": {
                    "field": "mainClass",
                    "type": "nominal",
                    "domain": ORDER_TSS_CLASSES,
                    "range": COLORS_TSS,
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
        let specsWiggle = createWiggleTracksTest(TSS_DETAIL_LEVEL_ZOOM, strand, title, filePath)
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
                        "x": { "field": "superPos", "type": "genomic", "axis": "top" },
                        "mark": strand === "+" ? "triangleRight" : "triangleLeft",
                        "style": { "align": strand === "+" ? "left" : "right" },
                        "size": { "value": 10, "legend": false, axis: "none" },
                        "color": {
                            "field": "mainClass",
                            "type": "nominal",
                            "domain": ORDER_TSS_CLASSES,
                            "range": COLORS_TSS,
                            // "legend": strand === "+"
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

    const createTracks = (data, genomeName, maxGenome, filePath, strand) => {
        let genes = createGFFTrack(data["superGFF"].filter(d => d["strand"] === strand));
        let fastaTrack = createGenomeTrack(filePath, genomeName, strand);
        let TSSTracks = createTSSTrack(data["TSS"], data["aggregatedTSS"], data["maxAggregatedTSS"], strand, maxGenome, genomeName, filePath);


        return [...TSSTracks, ...genes, ...fastaTrack];
    }

    const getViews = (data, filePath) => {
        let views_plus = [];
        let views_minus = [];
        for (let genome of Object.keys(data)) {
            for (let strand of ["+", "-"]) {
                let tempView = {
                    "alignment": "stack",
                    "title": `${genome}${strand}`,
                    "assembly": [[genome, data[genome]["lengthGenome"]]],
                    "spacing": 0,
                    "layout": "linear",
                    "tracks": createTracks(data[genome], genome, data[genome]["lengthGenome"], filePath, strand)
                }
                if (strand === "+") {
                    views_plus.push(tempView)
                } else {
                    views_minus.push(tempView)

                }

            }
        }
        return [views_minus, views_plus];

    }



    return <>
        {spec === null ? <ClipLoader color='#ffa000' size={30} /> : <GoslingComponent spec={spec} ref={gosRef} />}
    </>
        ;



}



export default AlignedGenomeViz