import React, { useEffect, useState } from 'react';

import { GoslingComponent } from "gosling.js";
const SingleWiggleViz = () => {
    let [dataJSON, setDataJSON] = useState([]);
    let getData = async () => {
        let response = await fetch('/api/getFile/parsejson/test/');
        let data = await response.json();
        return data;
    }
    useEffect(() => {
        getData().then(data => {
            setDataJSON(data)
            console.log(data)
            console.log(dataJSON)
        });
    }, []);
    // let spec = 
    return (
        <GoslingComponent spec={{
            "assembly": [["", 100000]],
            "tracks": [{
                // "data": {
                //     "url": "/api/getFile/parsetest/bigwig",
                //     "type": "csv",
                //     "delimiter": ";",
                //     "genomicFields": ["start", "end"],
                //     "sampleLength": 100000,
                //     "headerNames": ["start", "end", "value"],
                // },
                "data": {
                    "type": "json",
                    "values": dataJSON,
                    "genomicFields": ["start", "end"],
                },
                "mark": "line",
                "x": { "field": "start", "type": "genomic" },
                "y": { "field": "value", "type": "quantitative" },
                "color": { "value": "black" },
                // "color": { "field": "peak", "type": "quantitative", "legend": true },

            }]
        }} />
    );
};

export default SingleWiggleViz;
