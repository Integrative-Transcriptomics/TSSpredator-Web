import React, { useEffect, useState } from 'react';
import SingleGenomeViz from './GoslingVisualizations/SingleGenomeViz';
import AlignedGenomeViz from './GoslingVisualizations/AlignedGenomeViz';


function GenomeViewer({ filePath, dataGosling, showGFFViewer, filterForPlots, settingGosRef }) {
    const [currentType, setCurrentType] = useState('single'); // single or aligned
    // const [aggregatedData, setAggregatedData] = useState([]);
    const COLORS_TSS = ["#377eb8", "#fb8072", "#fed9a6", "#8dd3c7", "#decbe4"]
    const ORDER_TSS_CLASSES = ["Primary", "Secondary", "Internal", "Antisense", "Orphan"]








    return (
        <>

            <div>
                <select onChange={(e) => setCurrentType(e.target.value)} defaultValue={"single"} value={currentType}>
                    <option value='single'>Single View</option>
                    <option value='aligned'>Aligned View</option>
                </select>
                {
                    (
                        currentType === 'single' ?
                            <SingleGenomeViz
                                dataGosling={dataGosling}
                                filePath={filePath}
                                filter={filterForPlots === "enriched" ? ["Enriched"] : ["Enriched", "Detected"]}
                                settingGosRef={settingGosRef} /> :
                            <AlignedGenomeViz />

                    )



                }



            </div>




        </>


    );

}

export default GenomeViewer;