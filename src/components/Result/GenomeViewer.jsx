import React, { useState } from 'react';
import SingleGenomeViz from './GoslingVisualizations/SingleGenomeViz';
import AlignedGenomeViz from './GoslingVisualizations/AlignedGenomeViz';


function GenomeViewer({ filePath, dataGosling, filter, settingGosRef, gosRef }) {
    const [currentType, setCurrentType] = useState('single'); // single or aligned


    return (
        <div className='gosling-component'>
            <div className='genome-viewer-select' style={{ paddingBottom: "1.5em" }}>
                <div className="select-container">
                    <label for="view-select">Change modus:</label>
                    <select id="view-select" onChange={(e) => setCurrentType(e.target.value)} defaultValue={"single"} value={currentType}>
                        <option value='single'>Single View</option>
                        <option value='aligned'>Aligned View</option>
                    </select>
                </div>
                <div className='button-container'>
                    <button className='button-results' onClick={() => {
                        gosRef.current.api.exportPdf()
                    }}>Export as PDF</button>
                    <button className='button-results' onClick={() => {
                        gosRef.current.api.exportPng()
                    }}>Export as PNG</button>

                </div>


            </div>
            <div className='genome-viewer'>
                {
                    (
                        currentType === 'single' ?
                            <SingleGenomeViz
                                dataGosling={dataGosling}
                                filePath={filePath}
                                filter={filter}
                                settingGosRef={settingGosRef}
                            /> :
                            <AlignedGenomeViz
                                dataGosling={dataGosling}
                                filePath={filePath}
                                filter={filter}
                                settingGosRef={settingGosRef}
                            />

                    )

                }
            </div>
        </div>

    );

}

export default GenomeViewer;