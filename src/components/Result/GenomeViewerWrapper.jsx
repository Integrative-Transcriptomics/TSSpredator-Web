import React, { useRef, useEffect } from "react";
import GenomeViewer from "./GenomeViewer";

function GenomeViewerWrapper({ filePath, filterSelected, gosRef, setGFFViewer, showGFFViewer, nameGenomes }) {
    const dataGosling = useRef(null);

    const fetchDataGosling = async (filePath) => {
        const dataPerGenome = await fetch(`/api/TSSViewer/${filePath}/`);
        const data = await dataPerGenome.json();
        return data;
    };

    useEffect(() => {
        const tempData = fetchDataGosling(filePath);
        tempData.then((data) => {
            dataGosling.current = data;
        });
    }, [filePath]);

    let widthTrack = (window.innerWidth/2)*0.85
    console.log(nameGenomes)

    return (
        <div className='result-margin-left'>
            <h3 className='header click-param' onClick={() => setGFFViewer(!showGFFViewer)}>
                {showGFFViewer ? "-" : "+"} Genome Viewer for TSS data
            </h3>
            {
                showGFFViewer &&
                <GenomeViewer
                    filePath={filePath}
                    dataGosling={dataGosling}
                    filter={filterSelected === "enriched" ? ["Enriched"] : ["Enriched", "Detected"]}
                    gosRef={gosRef}
                    nameGenomes={nameGenomes}
                    widthTrack={widthTrack}
                />

            }

        </div>
    );
}

export default React.memo(GenomeViewerWrapper);