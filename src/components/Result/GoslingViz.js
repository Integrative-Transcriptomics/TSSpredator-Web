
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
                    "views": getViews(data["data"])
                };
                console.log(spec);
                setSpec(spec);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchDataAndSetSpec();
    }, [dataKey]);


    const createGeneTrack = (data) => {
        const GeneTrackcreator = (data, strand) => {
            return {
                "data": {
                    "values": data,
                    "type": "json",
                    "genomicFields": ["start", "end"]
                },
                "dataTransform": [
                    { "type": "filter", "field": "strand", "oneOf": [strand] }
                ],
                "mark": "rect",
                "row": { "field": "strand", "type": "nominal", "domain": ["+", "-"] },
                "x": { "field": "start", "type": "genomic", "axis": "top" },
                "xe": { "field": "end", "type": "genomic", "axis": "top" },
                "color": { "value": "grey" },
                "style": { "opacity": 0.2 },
                "size": { "value": 5 }
            }
        }

        return [GeneTrackcreator(data, "+"), GeneTrackcreator(data, "-")]

    }

    const createTSSTrack = (data) => {
        const TSSTrackcreator = (data, strand) => {
            return {
                "data": {
                    "values": data.filter(d => filter.includes(d["typeTSS"])),
                    "type": "json",
                    "genomicFields": ["superPos"]
                },
                "row": { "field": "superStrand", "type": "nominal", "domain": ["+", "-"] },
                "dataTransform": [
                    { "type": "filter", "field": "superStrand", "oneOf": strand }
                ],
                "mark": strand === "+" ? "triangleRight" : "triangleLeft",
                "x": { "field": "superPos", "type": "genomic", "axis": "top" },
                "color": {
                    "field": "mainClass",
                    "type": "nominal",

                    "domain": ["Primary", "Secondary", "Internal", "Antisense", "Orphan"],
                    "range": ["#7585FF", "#FF8A85", "#FFC785", "#85FFD9", "#B285FF"],
                    "legend": true
                },
                "style": { "align": strand === "+" ? "right" : "left" },
                "size": { "value": 15 }
            }
        }

        return [
            TSSTrackcreator(data, "-"),
            TSSTrackcreator(data, "+")

        ]
    }

    const createTracks = (data) => {
        let geneTracks = createGeneTrack(data["superGFF"]);
        let TSSTracks = createTSSTrack(data["TSS"]);
        return geneTracks.concat(TSSTracks);

    }

    const getViews = (data) => {
        let views = [];
        console.log(data);
        for (let genome of Object.keys(data)) {
            views.push({
                "alignment": "overlay",
                "title": genome,
                "assembly": [["", data[genome]["maxValue"]]],

                "tracks": createTracks(data[genome])
            })
        }
        return views;

    }

    return <div className={showPlot ? '' : 'hidden'}>
        {spec && <GoslingComponent spec={spec} />}
    </div>;

}

//     "alignment": "overlay",
//     "title": "Position of TSSs",
//     "assembly": [["", 250000]],
//     "data": {
//         "values": data,
//         "type": "json",
//         "genomicFields": ["pos"]
//     },
//     "row": { "field": "strand", "type": "nominal", "domain": ["+", "-"] },
//     "color": {
//         "field": "mainClass",
//         "type": "nominal",
//         "domain": ["primary", "secondary", "internal", "antisense", "orphan"],
//         "range": ["#7585FF", "#FF8A85", "#FFC785", "#85FFD9", "#B285FF"],
//         "legend": true
//     },
//     "visibility": [
//         {
//             "operation": "less-than",
//             "measure": "width",
//             "threshold": "|xe-x|",
//             "transitionPadding": 10,
//             "target": "mark"
//         }
//     ],
//     "opacity": { "value": 0.8 },
//     "width": 350,
//     "height": 100,
//     "tracks": [
//         ,
//         {
//             "dataTransform": [
//                 { "type": "filter", "field": "strand", "oneOf": ["-"] }
//             ],
//             "mark": "triangleLeft",
//             "x": { "field": "pos", "type": "genomic" },
//             "size": { "value": 15 },
//             "style": { "align": "right" }

//         }
//     ]
// }


// }

export default GoslingGenomeViz