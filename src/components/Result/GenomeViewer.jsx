import React, { useEffect, useState } from 'react';
import SingleGenomeViz from './GoslingVisualizations/SingleGenomeViz';
import AlignedGenomeViz from './GoslingVisualizations/AlignedGenomeViz';


function GenomeViewer({ filePath, dataGosling, filter, gosRef }) {
    const [currentType, setCurrentType] = useState('single'); // single or aligned
    const [maxValueWiggleDict, setMaxValueWiggleDict] = useState({});
    const [currentPosition, setCurrentPosition] = useState([null, null]);
    const [enableUpdate, setEnableUpdate] = useState(false);

    useEffect(() => {
        console.log(currentPosition)
        if(currentPosition[0] !== null && currentPosition[1] !== null)
            setEnableUpdate(Math.abs(currentPosition[0] - currentPosition[1]) < 5500)
        
        else
            setEnableUpdate(false);
    }, [currentPosition])



    if (gosRef !== null && gosRef?.current) {
        gosRef.current.api.subscribe('location', (typeEvent, dataOfTrack) => {
            let referenceTrack = gosRef.current.api.getTracks().find(track => track.id.includes('detail_tss'));
            // console.log(dataOfTrack.id)
            // if (dataOfTrack.id === referenceTrack.id) {
                console.log(dataOfTrack.genomicRange)
                let start = parseInt(dataOfTrack.genomicRange[0].position);
                let end = parseInt(dataOfTrack.genomicRange[1].position);
                setCurrentPosition((previousPosition) => {
                    if (previousPosition[0] !== start || previousPosition[1] !== end) {
                        return [start, end];
                    }
                    return previousPosition;
                });

            // }
        });
    }

    const fetchMaxima = async () => {
        const response = await fetch(`/api/provideMax/${filePath}/${currentPosition[0]}/${currentPosition[1]}`);
        const data = await response.json();
        setMaxValueWiggleDict(data);
    };


    return (
        <div className='gosling-component'>
            <div className='genome-viewer-select' style={{ paddingBottom: "1.5em" }}>
                <div className="select-container">
                    <label htmlFor="view-select">Change modus:</label>
                    <select id="view-select" onChange={(e) => setCurrentType(e.target.value)} defaultValue={"single"} value={currentType}>
                        <option value='single'>Single View</option>
                        <option value='aligned'>Aligned View</option>
                    </select>
                </div>
                <div className='button-container'>
                    <label htmlFor="update-button" style={{ textAlign: "center" }}
                        data-title={enableUpdate ? "Update the Y-axis to show the corresponding values for wiggle files" : "Zoom in in the plot to visualize the wiggle data."} >

                        <button className='button-results'
                            disabled={!enableUpdate} style={{ "cursor": enableUpdate ? "pointer" : "not-allowed", "maxWidth": "auto" }} onClick={() => {
                                fetchMaxima()
                            }}>Update Y-Axes for wiggle files</button>
                    </label>
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
                                maxValueWiggleDict={maxValueWiggleDict}
                                dataGosling={dataGosling}
                                filePath={filePath}
                                filter={filter}
                                gosRef={gosRef}
                            /> :
                            <AlignedGenomeViz
                                maxValueWiggleDict={maxValueWiggleDict}
                                dataGosling={dataGosling}
                                filePath={filePath}
                                filter={filter}
                                gosRef={gosRef}
                            />

                    )

                }
            </div>
        </div>

    );

}

export default React.memo(GenomeViewer);