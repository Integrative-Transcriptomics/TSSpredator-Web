
import React, { useEffect, useState, useRef } from 'react';
import { GoslingComponent } from "gosling.js";
import { ClipLoader } from "react-spinners";
import { createGenomeTrack, createWiggleTracks, createDetailTSSTrack, createBinnedView, createGFFTrack } from "./SharedGoslingFunctions.js"


/**
 * Renders a genome visualization using Gosling.js library.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The data used for visualization.
 * @returns {JSX.Element} - The rendered genome visualization component.
 */
function AlignedGenomeViz({ dataGosling, filter, filePath, gosRef, maxValueWiggleDict }) {


    const createTSSTrack = (binSizes, strand, maxGenome, title, filePath) => {
        let genomeName = title;
        const TSS_DETAIL_LEVEL_ZOOM = 50000;
        let sizesBins = Object.keys(binSizes).sort((a, b) => parseInt(a) - parseInt(b)).map((size, i, arr) => {
            const overflowForTransition = 40;
            return {
                "GT": i === 0 ? TSS_DETAIL_LEVEL_ZOOM : arr[i - 1] * overflowForTransition,
                "LT": (i === Object.keys(binSizes).length - 1) ? maxGenome * 1.1 : size * overflowForTransition,
                "size": parseInt(size),
                "maxValueBin": binSizes[size]
            }
        })
        let binnedViews = sizesBins.map(({ GT, LT, size, maxValueBin }) => createBinnedView(filePath, size, maxValueBin, filter, strand, GT, LT, "aligned", title));
        let specsWiggle = createWiggleTracks(strand, title, filePath)
        specsWiggle.map(spec => {
            let [strand, genome, type] = spec["id"].split("_").slice(2)
            let genomeID = genome.replace(/-/g, "_")
            let strandID = strand === "+" ? "Plus" : "Minus"
            const defaultMaxWiggle = 100;
            let maxValuesTemp = maxValueWiggleDict?.[genomeID]?.[strandID] || defaultMaxWiggle;
            spec["y"]["domain"] = [0, maxValuesTemp]
        })
        let detailTSSTrack = createDetailTSSTrack(filePath, strand, filter, TSS_DETAIL_LEVEL_ZOOM, "aligned", genomeName)
        return [
            {

                "alignment": "overlay",
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

    const createTracks = (filePath, data, genomeName, maxGenome, strand) => {
        let genes = createGFFTrack(filePath, genomeName, strand);
        let fastaTrack = createGenomeTrack(filePath, genomeName, strand);
        let TSSTracks = createTSSTrack(data["maxAggregatedTSS"], strand, maxGenome, genomeName, filePath);
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
                    "tracks": createTracks(filePath, data[genome], genome, data[genome]["lengthGenome"], strand)
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
    const completeView = (views, color, subtitle) => {
        return {
            "style": { "background": color, "backgroundOpacity": 0.25, "outline": "black", "outlineWidth": 2 },
            "subtitle": subtitle,
            "spacing": 0,
            "arrangement": "vertical",
            "views": views
        }
    }
    const data = dataGosling.current
    const maxValue = Math.max(...Object.values(data).map(d => d["lengthGenome"]));
    const [view_forward, view_reverse] = getViews(data, filePath);
    const distributedViews = [completeView(view_reverse, "lightblue", "Reverse strand"), completeView(view_forward, "#f59f95", "Forward strand")]

    const spec = {
        "title": "Visualization of TSSs and genes grouped by strand",
        "subtitle": "Distribution of TSSs and genes per strand. The aligned view allows for an easier comparison across genomes. At higher genomic zoom levels, the TSSs are binned and the number of TSSs per bin is shown. In deeper zoom levels, the individual TSSs and the respective transcriptomic data are shown.",
        "arrangement": "horizontal",
        "spacing": 50,
        "linkingId": "detail", // linkingId is used to enable zooming and panning across views

        "zoomLimits": [0, maxValue],
        "views": distributedViews,
    };

    return <>
        {spec === null ? <ClipLoader color='#ffa000' size={30} /> : <GoslingComponent spec={spec} ref={gosRef} experimental={{ "reactive": true }} />}
    </>
        ;



}



export default React.memo(AlignedGenomeViz)