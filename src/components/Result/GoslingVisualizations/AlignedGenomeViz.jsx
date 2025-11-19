
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
function AlignedGenomeViz({ dataGosling, filter, filePath, gosRef, maxValueWiggleDict, allowWiggleVisualization, widthTrack }) {
     

    const createTSSTrack = (binSizes, strand, maxGenome, title, filePath, maxValueGenome) => {
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
        let detailTSSTrack = createDetailTSSTrack(filePath, strand, filter, TSS_DETAIL_LEVEL_ZOOM, "aligned", genomeName)
           let specsWiggle = []
            if (allowWiggleVisualization) {
            specsWiggle = createWiggleTracks(strand, title, filePath, widthTrack)
            specsWiggle.map(spec => {
                let [strand, genome, type] = spec["id"].split("_").slice(2)
                let genomeID = genome.replace(/-/g, "_")
                let strandID = strand === "+" ? "Plus" : "Minus"
                let maxValuesTemp = maxValueWiggleDict?.[genomeID]?.[strandID] || 100;
                spec["y"]["domain"] = [0, maxValuesTemp]
            })
            }
        return [
            {
                "spacing": 0,
                "data": {
                    "url": `/api/getTSSdata/${filePath}/${title}`,
                    "type": "csv",
                    "genomicFields": ["binStart","binEnd"],
                    "sampleLength": 100000
                },
                "alignment": "overlay",
                "zoomLimits": [50, Math.round(  maxValueGenome)],
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

    const createTracks = (filePath, data, genomeName, maxGenome, strand, maxValueGenome) => {
        let genes = createGFFTrack(filePath, genomeName, strand, widthTrack);
        let fastaTrack = createGenomeTrack(filePath, genomeName, strand, widthTrack);
        let TSSTracks = createTSSTrack(data["maxAggregatedTSS"], strand, maxGenome, genomeName, filePath, maxValueGenome);
        return [...TSSTracks, ...genes, ...fastaTrack];
    }

    const getViews = (data, filePath, maxValueGenome) => {
        let views_plus = [];
        let views_minus = [];
        let addLegend = true;
        for (let genome of Object.keys(data)) {
            for (let strand of ["+", "-"]) {
                let tempView = {
                    "alignment": "stack",
                    "assembly": [[genome, data[genome]["lengthGenome"]]],
                    "layout": "linear",
                    "tracks": createTracks(filePath, data[genome], genome, data[genome]["lengthGenome"], strand, maxValueGenome)
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


    const completeViewPerGenome = (viewsForward, viewsReverse) => {
        // Zip views
        let zippedViews = viewsForward.map((view, index) => {
            return {
                spacing: 0,
                "arrangement": "horizontal",
                "views":  [viewsReverse[index], view]
            }})
        return zippedViews;
        }



    const createSpecsGosling = (dataGosling, filePath, maxValueWiggleDict, filter) => { 
        const data = dataGosling.current
        const maxValue = Math.max(...Object.values(data).map(d => d["lengthGenome"]));
        const [view_forward, view_reverse] = getViews(data, filePath, maxValue);
        const distributedViews = [completeViewPerGenome(view_forward, view_reverse)].flat();

        const specs = React.useMemo(() => ({
            "title": "Visualization of TSSs and genes grouped by strand",
            "subtitle": "Distribution of TSSs and genes per strand. The aligned view allows for an easier comparison across genomes. At higher genomic zoom levels, the TSSs are binned and the number of TSSs per bin is shown. In deeper zoom levels, the individual TSSs and the respective transcriptomic data are shown.",
                "arrangement": "vertical",
                "spacing": 50,
                "linkingId": "detail", // linkingId is used to enable zooming and panning across views
                "zoomLimits": [50, Math.round(maxValue)],
                "views": distributedViews,
            }), [dataGosling, filePath, maxValueWiggleDict,filter, allowWiggleVisualization]); 
        return specs;
    }
    
    


    return <>
         {dataGosling === null ?
                    <ClipLoader color='#ffa000' size={30} /> :
                    <GoslingComponent spec={createSpecsGosling(dataGosling, filePath, maxValueWiggleDict, filter)} ref={gosRef}  reactive={true} />}
    </>
        ;



}



export default React.memo(AlignedGenomeViz)