import React, { useState, useEffect } from "react";
import GenomeViewer from "./GenomeViewer";

function GenomeViewerWrapper({ filePath, filterSelected, gosRef, setGFFViewer, showGFFViewer }) {
    const [dataGosling, setDataGosling] = useState(null);

    const fetchDataGosling = async (filePath) => {
        const dataPerGenome = await fetch(`/api/TSSViewer/${filePath}/`);
        const data = await dataPerGenome.json();
        return data;
    };

    useEffect(() => {
        const tempData = fetchDataGosling(filePath);
        tempData.then((data) => {
            setDataGosling(data);
        });
    }, [filePath]);


    return (
        <div className='result-margin-left'>
            <h3 className='header click-param' onClick={() => setGFFViewer(!showGFFViewer)}>
                {showGFFViewer ? "-" : "+"} TSS positions with genome viewer
            </h3>
            {
                showGFFViewer &&
                <GenomeViewer
                    filePath={filePath}
                    dataGosling={dataGosling}
                    filter={filterSelected === "enriched" ? ["Enriched"] : ["Enriched", "Detected"]}
                    gosRef={gosRef}
                />

            }

        </div>
    );
}

export default React.memo(GenomeViewerWrapper);