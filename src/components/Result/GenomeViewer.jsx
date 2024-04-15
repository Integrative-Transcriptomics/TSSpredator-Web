import React, { useEffect, useState } from 'react';
import SingleGenomeViz from './GoslingVisualizations/SingleGenomeViz';
import AlignedGenomeViz from './GoslingVisualizations/AlignedGenomeViz';


function GenomeViewer({ filePath, dataGosling, filter, gosRef }) {
    const [currentType, setCurrentType] = useState('single'); // single or aligned
    const [maxValueWiggleDict, setMaxValueWiggleDict] = useState({});
    const [currentPosition, setCurrentPosition] = useState([0, 0]);
    const [enableUpdate, setEnableUpdate] = useState(false);

    useEffect(() => {
        setEnableUpdate(Math.abs(currentPosition[0] - currentPosition[1]) < 5500)
    }, [currentPosition])

    const deepEqual = (obj1, obj2) => {
        // Base case: If both objects are identical, return true.
        if (obj1 === obj2) {
            return true;
        }
        // Check if both objects are objects and not null.
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
            return false;
        }
        // Get the keys of both objects.
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        // Check if the number of keys is the same.
        if (keys1.length !== keys2.length) {
            return false;
        }
        // Iterate through the keys and compare their values recursively.
        for (const key of keys1) {
            if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }
        // If all checks pass, the objects are deep equal.
        return true;
    }

    if (gosRef !== null && gosRef?.current) {
        gosRef.current.api.subscribe('location', (typeEvent, dataOfTrack) => {
            if (dataOfTrack.id.includes('detail_tss')) {
                let start = parseInt(dataOfTrack.genomicRange[0].position);
                let end = parseInt(dataOfTrack.genomicRange[1].position);

                setCurrentPosition((previousPosition) => {
                    if (previousPosition[0] !== start || previousPosition[1] !== end) {
                        return [start, end];
                    }
                    return previousPosition;
                });

            }
        });
    }

    const getMaximaFromPositions = () => {
        fetch(`/api/provideMax/${filePath}/${currentPosition[0]}/${currentPosition[1]}`)
            .then(response => response.json())
            .then(data => {
                setMaxValueWiggleDict((prevData) => {
                    if (!deepEqual(prevData, data))
                        return data
                })
            });
    }
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
                    <button className='button-results' disabled={!enableUpdate} style={{ "cursor": enableUpdate ? "pointer" : "not-allowed", "maxWidth": "auto" }} onClick={() => {
                        getMaximaFromPositions()
                    }}>Update Y-Axes for wiggle files</button>
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

export default GenomeViewer;