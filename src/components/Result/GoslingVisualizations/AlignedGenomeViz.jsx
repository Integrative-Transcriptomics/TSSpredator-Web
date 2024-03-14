
import React, { useEffect, useState, useRef } from 'react';
import { GoslingComponent } from "gosling.js";
import { ClipLoader } from "react-spinners";
import { createGenomeTrack, createWiggleTracks, createDetailTSSTrack, createBinnedView } from "./SharedGoslingFunctions.js"


/**
 * Renders a genome visualization using Gosling.js library.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The data used for visualization.
 * @returns {JSX.Element} - The rendered genome visualization component.
 */
function AlignedGenomeViz({ dataGosling, filter, filePath, settingGosRef }) {


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
            "title": "Visualization of TSSs and genes grouped by strand",
            "subtitle": "Distribution of TSSs and genes per strand. The aligned view allows for an easier comparison across genomes",
            "arrangement": "horizontal",
            "spacing": 50,
            "linkingId": "detail", // linkingId is used to enable zooming and panning across views

            "zoomLimits": [0, maxValue],
            "views": distributedViews,
        };
        setSpec(spec);
        settingGosRef(gosRef)

    }, [dataGosling, filter]);



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
        let binnedViews = sizesBins.map(({ GT, LT, size, maxValueBin }) => createBinnedView(aggregatedTSS, size, maxValueBin, filter, strand, GT, LT, "aligned", title));
        let specsWiggle = createWiggleTracks(TSS_DETAIL_LEVEL_ZOOM, strand, title, filePath)
        let detailTSSTrack = createDetailTSSTrack(strand, TSS_DETAIL_LEVEL_ZOOM, "aligned", title)
        return [
            {

                "alignment": "overlay",
                "data": {
                    "values": data.filter(d => filter.includes(d["typeTSS"])),
                    "type": "json",
                    "genomicFields": ["superPos"],
                },
                "tracks": [
                    detailTSSTrack,
                    ...binnedViews,
                    ...specsWiggle


                ]
            }

        ]
    }

    const addLegendToTSS = (view) => {
        let elementsToModify = view["tracks"][0]["tracks"].map(d => {
            let id = d.id;
            if (id) {
                if (id.includes("detail_tss") | id.includes("aggregated_tss")) {
                    d["color"]["legend"] = true;
                }
            }


            return d;

        });
        view["tracks"][0]["tracks"] = elementsToModify;
        return view;
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
        let addLegend = true;
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
                if (addLegend)
                    tempView = addLegendToTSS(tempView)
                if (strand === "+") {
                    views_plus.push(tempView)
                } else {
                    views_minus.push(tempView)

                }

            }
            addLegend = false;
        }
        return [views_minus, views_plus];

    }



    return <>
        {spec === null ? <ClipLoader color='#ffa000' size={30} /> : <GoslingComponent spec={spec} ref={gosRef} />}
    </>
        ;



}



export default AlignedGenomeViz