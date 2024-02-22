import React, { useEffect, useState } from 'react';

import { GoslingComponent } from "gosling.js";
const SingleWiggleViz = () => {
    // let [data, setData] = useState(null);
    // let getData = async () => {
    //     let response = await fetch('/api/provideBigWig/tmpPredViewer5d4lnta2/NC_002163_superFivePrimePlus_avg.bigwig/');
    //     let data = await response.json();
    //     return data;
    // }
    // useEffect(() => {
    //     getData().then(data => setData(data));
    // }, []);
    // // let data = getData().then(data => data);
    // // let spec = 
    return (
        <GoslingComponent spec={{
            "assembly": [["", 100000]],
            "tracks": [{
                "data": {
                    "url": "/getFile/parsetest/bigwig",
                    "type": "csv",
                    "delimiter": ",",
                    // "genomicFields": ["start", "end"],
                    "sampleLength": 100000,
                    // "headerNames": ["s1", "end", "value"],
                    // "row": "sample",
                    // "column": "position",
                    // "value": "peak",
                    // "categories": ["sample 1"]
                },
                "mark": "line",
                "x": { "field": "s1", "type": "genomic" },
                "y": { "field": "e2", "type": "quantitative" },
                "color": { "value": "black" },
                // "color": { "field": "peak", "type": "quantitative", "legend": true },
                "width": 600,
                "height": 130
            }]
        }} />
    );
};

export default SingleWiggleViz;
