import React, { useEffect, useState, useRef } from 'react';
import SingleGenomeViz from './GoslingVisualizations/SingleGenomeViz';
import AlignedGenomeViz from './GoslingVisualizations/AlignedGenomeViz';
import throttle from 'lodash/throttle';
import SingleSelectDropdown from './SingleSelect';


function GenomeViewer({ filePath, dataGosling, filter, gosRef, widthTrack, nameGenomes }) {
    const [currentType, setCurrentType] = useState('single'); // single or aligned
    const [maxValueWiggleDict, setMaxValueWiggleDict] = useState({});
    const [currentPosition, setCurrentPosition] = useState([0, Number.MAX_SAFE_INTEGER]);
    const [enableUpdate, setEnableUpdate] = useState(false);
    const [allowWiggleVisualization, setAllowWiggleVisualization] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);



    useEffect(() => {

        let abs_diff = Math.abs(currentPosition[0] - currentPosition[1]);
        if (abs_diff < 5500) {
            setEnableUpdate(true);
        }
        else{
            setEnableUpdate(false);
            setAllowWiggleVisualization(false);
        }
    }, [currentPosition])

    const updatePositionThrottled = throttle((start, end) => {
        setCurrentPosition([start, end]);
    }, 100); // Adjust the interval as needed


    useEffect(() => {
    
        if (gosRef.current) {
            console.log(gosRef.current.api.getViews())


            gosRef.current.api?.subscribe('location', (typeEvent, dataOfTrack) => {
                if (dataOfTrack.id === `gff_track_+_${nameGenomes[0]}`) {
                    let start = parseInt(dataOfTrack.genomicRange[0].position);
                    let end = parseInt(dataOfTrack.genomicRange[1].position);
                    if (Math.abs(start - end) < 10000) {
                        updatePositionThrottled(start, end);
                    }
                    
                }
            });
        }

        return () => {
            gosRef.current?.api?.unsubscribe('location'); // Cleanup on unmount
        };
    }, [gosRef.current]);


    const fetchMaxima = async () => {
        const response = await fetch(`/api/provideMax/${filePath}/${currentPosition[0]}/${currentPosition[1]}`);
        const data = await response.json();
        setMaxValueWiggleDict(data);
    };


    return (
        <div className='gosling-component'>
            <div className='genome-viewer-select' style={{ paddingBottom: "1.5em" }}>
                <SingleSelectDropdown
                        helpText={`Two different views are available: Single View shows the genome viewer grouped vertically by Genome/Condition, while the Aligned View aligns the strands vertically and the genomes/conditions on each row.`}

                    label="Change Genome Viewer Modus:"
                    value={currentType}
                    onChange={(value) => setCurrentType(value)}
                    options={[
                        { value: "single", label: "Single View" },
                        { value: "aligned", label: "Aligned View" },
                    ]}
                    style={{ maxWidth: "25%" }}
                />

                <div className="button-container">
                    <label
                        htmlFor="wiggle-toggle"
                        style={{
                           textAlign: "center"
                        }}
                        data-title={
                            allowWiggleVisualization
                                ? "Coverage profile visualization enabled. This consumes more resources, please, disable if unnecessary."
                                : "You can enable it when zoomed in, but consider that this requires a stable high-sppeed internet connection."
                        }
                    >
                        <input
                            id="wiggle-toggle"
                            type="checkbox"
                            disabled={!enableUpdate}
                            checked={allowWiggleVisualization}
                            onChange={(e) => setAllowWiggleVisualization(e.target.checked)}
                            style={{
                                width: "1.1em",
                                height: "1.1em",
                                cursor: "pointer",
                                accentColor: "#ffa000", // similar to your button color
                            }}
                        />
                        <span>
                            Enable read coverage visualization
                        </span>
                    </label>
</div>

                <div className='button-container'>
                    <label htmlFor="update-button" style={{ textAlign: "center" }}
                        data-title={enableUpdate ? "Update the Y-axis to show the corresponding values for wiggle files" : "Zoom in in the plot to visualize the wiggle data."} >

                        <button className="button-results" style={
                            {
                                backgroundColor: allowWiggleVisualization ? "#ffa000" : "darkgrey",
                                color: "white",
                                padding: "0.5em",
                                margin: "2px",
                                border: "none",
                                cursor: "pointer",
                                borderRadius: "6px",
                                fontFamily: "Arial",
                                cursor: allowWiggleVisualization ? "pointer" : "not-allowed",
                                maxWidth: "auto"
                            }
                        }
                            disabled={!allowWiggleVisualization} onClick={() => {
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
            <div id="genome-viewer" className='genome-viewer'>
                {
                    (
                        currentType === 'single' ?
                            <SingleGenomeViz
                                maxValueWiggleDict={maxValueWiggleDict}
                                dataGosling={dataGosling}
                                filePath={filePath}
                                filter={filter}
                                allowWiggleVisualization = {allowWiggleVisualization}
                                allowFetch={enableUpdate}
                                gosRef={gosRef}
                                widthTrack={widthTrack}
                                zoomLevel={zoomLevel}
                            /> :
                            <AlignedGenomeViz
                                maxValueWiggleDict       = {maxValueWiggleDict}
                                dataGosling              = {dataGosling}
                                filePath                 = {filePath}
                                allowFetch               = {enableUpdate}
                                allowWiggleVisualization = {allowWiggleVisualization}
                                filter                   = {filter}
                                gosRef                   = {gosRef}
                                widthTrack               = {widthTrack}

                            />

                    )

                }
            </div>
        </div>

    );

}

export default React.memo(GenomeViewer);