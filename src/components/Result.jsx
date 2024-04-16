import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import JSZip from "jszip";
import "../css/Result.css";
import "../css/App.css";
import "../css/MasterTable.css";
import MasterTable from "./Result/MasterTable";
import UpSet from "./Result/UpSet";
import Header from "./Main/Header";
import GenomeViewerWrapper from "./Result/GenomeViewerWrapper";
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

  // GoslingRef
  const gosRef = useRef();

  // histograms
  const [processedMasterTable, setProcessedMasterTable] = useState(false);

  // Genome Viewer
  const [showGFFViewer, setGFFViewer] = useState(false);


  /**
   * get all files from TSS prediction as .zip from server
   */
  useEffect(() => {
    /**
     * extract info from mastertable string
     */
    const handleMasterTable = (masterTable) => {
      const allRows = masterTable.split("\n");
      // remove last empty row
      allRows.pop();

      // get column headers
      const headers = allRows[0].split("\t");
      // columns for the table
      const col = [];
      let genomeIdx;
      headers.forEach((h, i) => {
        const char = i.toString();
        col.push({ Header: h, accessor: char });
        if (h === "Genome" || h === "Condition") {
          genomeIdx = char;
        }
      });

      let allG = new Set();
      setTableColumns([...col]);

      // save rows
      const dataRows = [];
      allRows.forEach((row, i) => {
        if (i > 0) {
          const tmp = row.split("\t");
          var tmpRow = {};
          tmp.forEach((content, j) => {
            const char = j.toString();
            tmpRow[char] = content;
          });
          const tmpGenome = tmp[genomeIdx];
          // add genome to all genomes
          allG.add(tmpGenome);

          dataRows.push(tmpRow);
        }
      });
      setTableData([...dataRows]);
      setAllGenomes(allG);



    };

    // Fetch files from server and handle MasterTable
    fetch(`/api/result/${filePath}/`)
      .then((res) => {
        if (res.status === 404) {
          console.log("404");
          return 404
        }
        else {
          return res.blob();
        }
      }

      )
      .then((blob) => {
        if (blob === 404) {
          setZipBlobFile(404);
          return
        }
        setZipBlobFile(blob);

        JSZip.loadAsync(blob)
          .then((zip) => {
            return zip.file("MasterTable.tsv").async("string");
          })
          .then((data) => {
            handleMasterTable(data);
            setProcessedMasterTable(true);
          })
          .catch((error) => {
            console.log("Error loading MasterTable file:", error);
          });
      });


    fetch(`/api/getConfig/${filePath}/`)
      .then((res) => res.json())
      .then((data) => {
        setConfigData(data);
      });


  }, [filePath]);

  /**
   * download files action, after clicking on link
   */
  const downloadFiles = () => {
    // blob url to download files
    const url = window.URL.createObjectURL(new Blob([zipBlobFile]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TSSpredator-prediction.zip`);
    document.body.appendChild(link);

    // Start download
    link.click();

    // remove link
    link.parentNode.removeChild(link);
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
          <h2>404: File not found</h2>
          <h3>File {filePath} not found on server. Results are only available for seven days after creation. Please upload the corresponding zip for visualization or redo your analysis. </h3>
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
                    TSSpredator-prediction.zip

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

            <GenomeViewerWrapper filePath={filePath} filterSelected={filterForPlots} gosRef={gosRef} />

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
                <MasterTable tableColumns={tableColumns} tableData={tableData} showTable={showTable} gosRef={gosRef} showGFFViewer={showGFFViewer} />
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
