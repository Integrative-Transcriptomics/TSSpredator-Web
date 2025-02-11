import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import JSZip from "jszip";
import "../css/Result.css";
import "../css/App.css";
import "../css/MasterTable.css";
import MasterTable from "./Result/MasterTable";
import UpSet from "./Result/UpSet";
import UpSetOverConditions from "./Result/UpSetOverConditions";
import Header from "./Main/Header";
import GenomeViewerWrapper from "./Result/GenomeViewerWrapper";
import ResultNotFoundPage from "./404Result";
import ConfigList from "./Main/ConfigList";

/**
 * creates page that displays result of TSS prediction
 */

function Result() {
  // filePath on server
  let { filePath } = useParams();

  // save files
  const [zipBlobFile, setZipBlobFile] = useState(new Blob());
  const [showDownload, setShowDownload] = useState(true);
  const [configData, setConfigData] = useState(null);

  // all genomes/conditions names
  const [allGenomes, setAllGenomes] = useState([]);

  // for master table
  const [tableColumns, setTableColumns] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [showTable, setShowTable] = useState(true);
  const [filterForPlots, setFilterForPlots] = useState("enriched");

  // Upset Plot
  const [showUpSet, setShowUpSet] = useState(false);
  const [showUpSetConditions, setShowUpSetConditions] = useState(false);

  // GoslingRef
  const gosRef = useRef();

  // Data ready for Visualization
  const [processedMasterTable, setProcessedMasterTable] = useState(false);

  // Genome Viewer
  const [showGenomeViewer, setShowGenomeViewer] = useState(false);

  const handleMasterTable = (masterTable) => {
    const allRows = masterTable.trim().split("\n"); // trim() removes trailing newline
    const headers = allRows[0].split("\t");

    const col = headers.map((h, i) => {
      return { Header: h, accessor: i.toString() };
    });
    const searchFor = headers.indexOf("Genome") !== -1 ? "Genome" : "Condition";
    const genomeIdx = headers.indexOf(searchFor);

    const allG = new Set();
    const dataRows = allRows.slice(1).map(row => {
      const tmp = row.split("\t");
      allG.add(tmp[genomeIdx]);
      return tmp.reduce((acc, content, j) => {
        acc[j.toString()] = content;
        return acc;
      }, {});
    });

    setTableColumns(col);
    setTableData(dataRows);
    setAllGenomes(allG);
  };



  // Extracted function for handling fetch errors
  const handleFetchError = (error) => {
    console.error("Fetch error:", error);
  };

  useEffect(() => {
    fetch(`/api/result/${filePath}/`)
      .then((res) => { // Check if file is found
        if (res.status === 404) {
          console.log("404");
          setZipBlobFile(404);
          throw new Error("404");
        }
        return res.blob();
      })
      .then((blob) => { // Load zip file
        setZipBlobFile(blob);
        return JSZip.loadAsync(blob);
      })
      .then((zip) => zip.file("MasterTable.tsv").async("string"))       // Read File and handle Master Table
      .then(handleMasterTable)
      .then(() => setProcessedMasterTable(true))
      .catch(handleFetchError);

    // Get Configuration used
    fetch(`/api/getConfig/${filePath}/`)
      .then((res) => res.json())
      .then(setConfigData)
      .catch(handleFetchError);
  }, [filePath]);

  /**
   * Downloads the files as a zip.
   */
  const downloadFiles = () => {
    const link = document.createElement("a");
    try {
      const url = window.URL.createObjectURL(new Blob([zipBlobFile]));
      link.href = url;
      link.setAttribute("download", `TSSpredator-prediction_${configData?.projectName?.replace(/ /g, "-")}.zip`);
      document.body.appendChild(link);
      // Start download
      link.click();
    } catch (error) {
      console.error("Error during file download:", error);
    } finally {
      // Ensure the link is removed from the document body
      // even if an error occurs during the download
      setTimeout(() => {
        document.body.removeChild(link);
      }, 0);
    }
  };

  /**
   * update plots for selected genome/condition
   */
  return (
    <>
      <Header />
      { // if file not found
        // TODO: improve 404 page
        zipBlobFile === 404 ? <>
          <ResultNotFoundPage filePath={filePath} />
        </> :
          <div className='result-container'>

            <div className="two-columns">
              <div style={{ maxWidth: "30%" }}>

                <h3 className='header click-param' onClick={() => setShowDownload(!showDownload)}>
                  {showDownload ? "-" : "+"} Download result of TSS prediction
                </h3>
                <div className={!showDownload ? "hidden" : null} >

                  <p style={{ marginLeft: "1em", marginBottom: "0.5em" }} className="info-text"> Results are only available online for seven days after their computation.
                    Please download the files for later usage.</p>

                  <div
                    className={"download-link"}
                    onClick={() => downloadFiles()}
                  >
                    {`TSSpredator-prediction_${configData?.projectName.replace(/ /g, "-")}.zip`}

                  </div>
                </div>

              </div>
              <ConfigList configData={configData} />

            </div>
            <div className='result-select'>
              <h3 className='select-header'>Show the following TSS in plots: </h3>
              <select onChange={(e) => setFilterForPlots(e.target.value)} value={filterForPlots}>
                <option value='enriched'>Only enriched TSSs</option>
                <option value='detected'>All detected TSSs</option>
              </select>
            </div>

            <GenomeViewerWrapper filePath={filePath} filterSelected={filterForPlots} gosRef={gosRef} showGFFViewer={showGenomeViewer} setGFFViewer={setShowGenomeViewer} />

            <div className='result-margin-left'>
              <h3 className='header click-param' onClick={() => setShowUpSet(!showUpSet)}>
                {showUpSet ? "-" : "+"} Distribution of TSS across classes
              </h3>
              {processedMasterTable ? (
                <UpSet
                  showUpSet={showUpSet}
                  allGenomes={allGenomes}
                  filterForPlots={filterForPlots}
                  tableColumns={tableColumns}
                  tableData={tableData}
                />
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>





            <div>
              <h3 className='header click-param' onClick={() => setShowTable(!showTable)}>
                {showTable ? "-" : "+"} Master Table
              </h3>
              {tableColumns.length > 0 ? (
                <MasterTable tableColumns={tableColumns} tableData={tableData} showTable={showTable} gosRef={gosRef} showGFFViewer={showGenomeViewer} />
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>
          </div>
      }
    </>
  );
}

export default Result;
