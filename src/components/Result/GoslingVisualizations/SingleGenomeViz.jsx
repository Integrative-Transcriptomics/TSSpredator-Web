
import React from 'react';
import { GoslingComponent } from "gosling.js";
import { ClipLoader } from "react-spinners";
import { createWiggleTracks, createGenomeTrack, createDetailTSSTrack, createGFFTrack, createBinnedView } from "./SharedGoslingFunctions.js";
/**
 * Renders a genome visualization using Gosling.js library.
 * @param {Object} props - The component props.
 * @param {Array} props.data - The data used for visualization.
 * @returns {JSX.Element} - The rendered genome visualization component.
 */
function SingleGenomeViz({ dataGosling, filter, filePath, gosRef, maxValueWiggleDict, allowFetch }) {

    const createTSSTrack = (binSizes, strand, maxGenome, title = null, filePath) => {
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
        let binnedViews = sizesBins.map(({ GT, LT, size, maxValueBin }) => createBinnedView(filePath, size, maxValueBin, filter, strand, GT, LT, "single", title));
        let specsWiggle = createWiggleTracks(strand, title, filePath, allowFetch)
        specsWiggle.map(spec => {
            let [strand, genome, type] = spec["id"].split("_").slice(2)
            let genomeID = genome.replace(/-/g, "_")
            let strandID = strand === "+" ? "Plus" : "Minus"
            let maxValuesTemp = maxValueWiggleDict?.[genomeID]?.[strandID] || 100;
            spec["y"]["domain"] = [0, maxValuesTemp]
        })


        let detailTSSTrack = createDetailTSSTrack(filePath, strand, filter, TSS_DETAIL_LEVEL_ZOOM, "single", title)
        if (strand === "-") detailTSSTrack["x"]["axis"] = "none";
        return [
            {
                "alignment": "overlay",
                "style": { background: strand === "+" ? "lightblue" : "#f59f95", backgroundOpacity: 0.25 },
                "tracks": [
                    detailTSSTrack,
                    ...binnedViews,
                    ...specsWiggle
                ]
            }

        ]
    }

    const createTracks = (data, genomeName, maxGenome, filePath) => {

        const createTracks = (filePath, genomeName, direction) => {
            const TSSTracks = createTSSTrack(data["maxAggregatedTSS"], direction, maxGenome, genomeName, filePath);
            const genes = createGFFTrack(filePath, genomeName, direction);
            const fastaTrack = createGenomeTrack(filePath, genomeName, direction);
            if (direction === "-") {
                // For Simmetry
                return [...fastaTrack, ...genes, ...TSSTracks];
            }
            return [...TSSTracks, ...genes, ...fastaTrack];
        };

        const tracks_plus = createTracks(filePath, genomeName, "+");
        const tracks_minus = createTracks(filePath, genomeName, "-");

        return [...tracks_plus, ...tracks_minus];
    }

    const getViews = (data, filePath) => {
        let views = [];
        for (let genome of Object.keys(data)) {
            views.push({
                style: {
                    background: "lightgray", backgroundOpacity: 0.25, outline: "black", outlineWidth: 2
                },
                "alignment": "stack",
                "assembly": [[genome, data[genome]["lengthGenome"]]],
                "spacing": 0,
                "layout": "linear",
                "tracks": createTracks(data[genome], genome, data[genome]["lengthGenome"], filePath)
            })
        }
        return views;

    }
    const data = dataGosling.current
    const maxValue = Math.max(...Object.values(data).map(d => d["lengthGenome"]));
    const allViews = getViews(data, filePath)
    const distributedViews = [{
        "arrangement": "vertical",
        "views": allViews.filter((_, i) => i < allViews.length / 2)
    }, {
        "arrangement": "vertical",
        "views": allViews.filter((_, i) => i >= allViews.length / 2)
    }]
    const specs = React.useMemo(() => ({
            "title": "Visualization of TSSs and Genes grouped by genome/condition",
            "subtitle": "The TSSs are aggregated by their main class and their strand location. At higher genomic zoom levels, the TSSs are binned and the number of TSSs per bin is shown. \n At lower zoom levels, the individual TSSs and the respective transcriptomic data are shown.",
            "arrangement": "horizontal",
            "spacing": 50,
            "linkingId": "detail", // linkingId is used to enable zooming and panning across views
            "zoomLimits": [50, maxValue],
            "views": distributedViews,
        }), [dataGosling, filePath, maxValueWiggleDict,filter, allowFetch]); 
        

    return <>
        {dataGosling === null ?
            <ClipLoader color='#ffa000' size={30} /> :
            <GoslingComponent spec={specs} ref={gosRef} experimental={{ "reactive": true }} />}
    </>
        ;
}



export default React.memo(SingleGenomeViz);