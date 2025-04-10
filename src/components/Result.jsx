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
import ResultNotFoundPage from "./404Result";
import ConfigList from "./Main/ConfigList";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sortingFns } from "@tanstack/react-table";
import SingleSelectDropdown from './Result/SingleSelect.jsx';


/**
 * creates page that displays result of TSS prediction
 */
const selectHeaders = ["detected", "enriched", "Genome", "Condition", "SuperStrand", "Strand", "Primary", "Secondary", "Antisense", "Internal", "contigID"]
const cappedValues = ["enrichmentFactor", "stepHeight", "stepFactor"]
function getFilterType(header) {
  const rangeHeaders = ["SuperPos", "Pos", "GeneLength", "UTRlength", "contigPos", "mapCount", "detCount", "classCount"]
  const nonFilterable = ["Sequence -50 nt upstream + TSS (51nt)"]

  if (rangeHeaders.includes(header)) {
    return "range";
  }
  else if (selectHeaders.includes(header)) {
    return "select";
  }
  else if (nonFilterable.includes(header)) {
    return "none";
  }
  return "text";
}

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
  const dataMetadataColumns = useRef(null);
  const [filterPositions, setFilterPositions] = useState([]);

  // Upset Plot
  const [showUpSet, setShowUpSet] = useState(false);

  // GoslingRef
  const gosRef = useRef();

  // Data ready for Visualization
  const [processedMasterTable, setProcessedMasterTable] = useState(false);

  // Genome Viewer
  const [showGenomeViewer, setShowGenomeViewer] = useState(false);

  const handleMasterTable = (masterTable) => {
    const allRows = masterTable.trim().split("\n"); // trim() removes trailing newline
    const headers = allRows[0].split("\t");
    let IDofSelectableColumns = []
    const isGenomeComparison = headers.indexOf("Genome") !== -1 
    let tmpMetadataColumns = {}
    let removedHeaders = [];
    let col = headers.map((h, i) => {
      if (!isGenomeComparison) {
        if (["Pos", "Strand"].includes(h)) {
          removedHeaders.push(i)
        }
        if (["SuperPos", "SuperStrand"].includes(h)) {
          // Remove "Super" prefix
          h = h.replace("Super", "");
        }
      }
      if (selectHeaders.includes(h)) {
        IDofSelectableColumns.push(i-removedHeaders.length)
      }
      let filterVariant = getFilterType(h)
      return {
        header: h,
        accessorKey: (i - removedHeaders.length).toString(),
        meta: {
          filterVariant: filterVariant,
        },
        filterFn: filterVariant === "range" ? 'inNumberRange' : filterVariant === "select" ? 'arrIncludesSome' : filterVariant === "none" ? 'none' : 'includesString',
        sortingFn: h.startsWith("rep") ? "myReplicateSorting" : cappedValues.includes(h) ? "myCappedSorting" : sortingFns.alphanumeric
      };
    });
    col = col.filter((_, i) => !removedHeaders.includes(i));
    const searchFor = isGenomeComparison ? "Genome" : "Condition";
    const genomeIdx = headers.indexOf(searchFor);

    const allG = new Set();
    const dataRows = allRows.slice(1).map(row => {
      let tmp = row.split("\t");
      if (!isGenomeComparison) {
        // remove indices of removed headers
       tmp = tmp.filter((_, i) => {
          return !removedHeaders.includes(i)
        })        
      }

      allG.add(tmp[genomeIdx]);
      return tmp.reduce((acc, content, j) => {
        if (IDofSelectableColumns.includes(j)) {
          if (tmpMetadataColumns[j.toString()] === undefined) {
            tmpMetadataColumns[j.toString()] = new Set()
          }
          tmpMetadataColumns[j.toString()].add(content)
        }
        acc[j.toString()] = content;
        return acc;
      }, {});
    });
    dataMetadataColumns.current = tmpMetadataColumns;

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
  let queryClient = new QueryClient();
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

            <div>
              <h3 className='header click-param' onClick={() => setShowTable(!showTable)}>
                {showTable ? "-" : "+"} Master Table
              </h3>
              {tableColumns.length > 0 ? (
                <QueryClientProvider client={queryClient}>
                  <MasterTable
                    adaptFilterFromUpset={setFilterPositions}
                    filterFromUpset={filterPositions}
                    selectionData={dataMetadataColumns.current}
                    tableColumns={tableColumns}
                    tableData={tableData}
                    showTable={showTable}
                    gosRef={gosRef}
                    showGFFViewer={showGenomeViewer} />
                </QueryClientProvider>
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>

            <SingleSelectDropdown
              label="Show the following TSS in plots"
              value={filterForPlots}
              onChange={(value) => setFilterForPlots(value)}
              options={[
                { value: "enriched", label: "Only enriched TSSs" },
                { value: "detected", label: "All detected TSSs" },
              ]}
              style={{ maxWidth: "30vw"}}
              helpText={`Show only enriched TSSs or all detected TSSs in the UpSet plot and the Genome Viewer`}

            />
            
            <div className='result-margin-left'>
              <h3 className='header click-param' onClick={() => setShowUpSet(!showUpSet)}>
                {showUpSet ? "-" : "+"} UpSet Plot: Distribution of TSS across Categories
              </h3>
              {processedMasterTable ? (
                <UpSet
                  showUpSet={showUpSet}
                  allGenomes={allGenomes}
                  filterForPlots={filterForPlots}
                  tableColumns={tableColumns}
                  tableData={tableData}
                  handleClickUpset={setFilterPositions}
                />
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>
            <GenomeViewerWrapper
              filePath={filePath}
              filterSelected={filterForPlots}
              gosRef={gosRef}
              showGFFViewer={showGenomeViewer}
              setGFFViewer={setShowGenomeViewer}
              nameGenomes={[...allGenomes]}
            />
           
          </div>
      }
    </>
  );
}

export default Result;
