import React, { useEffect, useState } from 'react';
import SingleGenomeViz from './GoslingVisualizations/SingleGenomeViz';
import AlignedGenomeViz from './GoslingVisualizations/AlignedGenomeViz';
import throttle from 'lodash/throttle';
import debounce from 'lodash/debounce';
import SingleSelectDropdown from './SingleSelect';


function GenomeViewer({ filePath, dataGosling, filter, gosRef, widthTrack }) {
    const [currentType, setCurrentType] = useState('single'); // single or aligned
    const [maxValueWiggleDict, setMaxValueWiggleDict] = useState({});
    const [currentPosition, setCurrentPosition] = useState([0, Number.MAX_SAFE_INTEGER]);
    const [enableUpdate, setEnableUpdate] = useState(false);

    useEffect(() => {
        setEnableUpdate(Math.abs(currentPosition[0] - currentPosition[1]) < 5500)
    }, [currentPosition])

    const updatePositionThrottled = throttle((start, end) => {
        setCurrentPosition([start, end]);
    }, 500); // Adjust the interval as needed

    useEffect(() => {
        gosRef.current?.api?.subscribe('location', (typeEvent, dataOfTrack) => {
            let referenceTrack = gosRef.current?.api?.getTracks().find(track => track.id.includes('detail_tss'));
            // console.log(dataOfTrack.id)
            if (dataOfTrack.id === referenceTrack.id) {
                let start = parseInt(dataOfTrack.genomicRange[0].position);
                let end = parseInt(dataOfTrack.genomicRange[1].position);
                if (Math.abs(start - end) < 7000) {
                    updatePositionThrottled(start, end);
                }

            }
        });
        return () => {
            gosRef.current?.api?.unsubscribe('location'); // Cleanup on unmount
        };
    }, []);


    const fetchMaxima = async () => {
        const response = await fetch(`/api/provideMax/${filePath}/${currentPosition[0]}/${currentPosition[1]}`);
        const data = await response.json();
        setMaxValueWiggleDict(data);
    };


    return (
        <div className='gosling-component'>
            <div className='genome-viewer-select' style={{ paddingBottom: "1.5em" }}>
                <SingleSelectDropdown
                    label="Change Genome Viewer Modus:"
                    value={currentType}
                    onChange={(value) => setCurrentType(value)}
                    options={[
                        { value: "single", label: "Single View" },
                        { value: "aligned", label: "Aligned View" },
                    ]}
                    style={{ maxWidth: "25%" }}
                />


                <div className='button-container'>
                    <label htmlFor="update-button" style={{ textAlign: "center" }}
                        data-title={enableUpdate ? "Update the Y-axis to show the corresponding values for wiggle files" : "Zoom in in the plot to visualize the wiggle data."} >

                        <button className="button-results" style={
                            {
                                backgroundColor: enableUpdate ? "#ffa000" : "darkgrey",
                                color: "white",
                                padding: "0.5em",
                                margin: "2px",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "6px",
                                fontFamily: "Arial",
                                cursor: enableUpdate ? "pointer" : "not-allowed",
                                maxWidth: "auto"
                            }
                        }
                            disabled={!enableUpdate} onClick={() => {
                                fetchMaxima()
                            }}>Update Y-Axes for wiggle files</button>
                    </label>
                </div>

                <div className='button-container'>
                <button className="button-results" style={
                            {
                                backgroundColor: "#ffa000",
                                color: "white",
                                padding: "0.5em",
                                margin: "2px",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "6px",
                                fontFamily: "Arial",
                                maxWidth: "auto"
                            }
                        } onClick={() => {
                        gosRef.current.api.exportPdf()
                    }}>Export as PDF</button>
                    <button className="button-results" style={
                            {
                                backgroundColor: "#ffa000",
                                color: "white",
                                padding: "0.5em",
                                margin: "2px",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "6px",
                                fontFamily: "Arial",
                                maxWidth: "auto"
                            }
                        } onClick={() => {
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
                                allowFetch={enableUpdate}
                                gosRef={gosRef}
                                widthTrack={widthTrack}
                            /> :
                            <AlignedGenomeViz
                                maxValueWiggleDict={maxValueWiggleDict}
                                dataGosling={dataGosling}
                                filePath={filePath}
                                allowFetch={enableUpdate}
                                filter={filter}
                                gosRef={gosRef}
                                widthTrack={widthTrack}

                            />

                    )

                }
            </div>
        </div>

    );

}

export default React.memo(GenomeViewer);