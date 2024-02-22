import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import GoslingGenomeViz from "./Result/SingleGoslingViz";
import JSZip from "jszip";
import "../css/Result.css";
import "../css/App.css";
import "../css/MasterTable.css";
import MasterTable from "./Result/MasterTable";
import UpSet from "./Result/UpSet";
import Header from "./Main/Header";
import SingleWiggleViz from "./Result/SingleWiggleViz";

/**
 * creates page that displays result of TSS prediction
 */

function Result() {
  // filePath on server
  let { filePath } = useParams();

  // save files
  const [blob, setBlob] = useState(new Blob());
  const [showDownload, setShowDownload] = useState(true);

  // all genomes/conditions names
  const [allGenomes, setAllGenomes] = useState([]);
  // currently used genome/condition data for the plot
  const [currentData, setCurrentData] = useState("all");

  // for master table
  const [tableColumns, setTableColumns] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [showTable, setShowTable] = useState(true);
  const [filterForPlots, setFilterForPlots] = useState("enriched");

  // Upset Plot
  const [showUpSet, setShowUpSet] = useState(false);
  const [upsetClasses, setUpsetClasses] = useState([]);

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

      let allG = [];
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
          if (!allG.includes(tmpGenome)) {
            allG.push(tmpGenome);
          }

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
          setBlob(404);
          return
        }
        setBlob(blob);

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
  }, [filePath]);

  /**
   * download files action, after clicking on link
   */
  const downloadFiles = () => {
    // blob url to download files
    const url = window.URL.createObjectURL(new Blob([blob]));
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
   * return tss class of current row
   */
  const getClass = (row, primaryIdx, secondaryIdx, internalIdx, antisenseIdx) => {
    // get class of this row
    if (row[primaryIdx] === "1") {
      return "primary";
    } else if (row[secondaryIdx] === "1") {
      return "secondary";
    } else if (row[internalIdx] === "1") {
      return "internal";
    } else if (row[antisenseIdx] === "1") {
      return "antisense";
      // orphan
    } else {
      return "orphan";
    }
  };

  /**
   * update plots for selected genome/condition
   */

  useEffect(() => {
    /**
   * for upset plot: count frequncy of each tss class
   * for line chart: count TSS per position
   * and get all genome/condition names
   */
    const TSSperPosition = (rows, columns, typeIntersection = "all") => {
      // get column indices
      const primaryIdx = columns.findIndex((col) => col["Header"] === "Primary");
      const secondaryIdx = columns.findIndex((col) => col["Header"] === "Secondary");
      const internalIdx = columns.findIndex((col) => col["Header"] === "Internal");
      const antisenseIdx = columns.findIndex((col) => col["Header"] === "Antisense");
      const superPosIdx = columns.findIndex((col) => col["Header"] === "SuperPos");
      const variableFilterTSS = columns.findIndex((col) => col["Header"] === filterForPlots);



      // save frequency of classes for a TSS (upset plot)
      let tssByClass = {};
      let tssWithMultipleClasses = {};

      rows.forEach((row) => {
        if (row[variableFilterTSS] === "1") {
          const tmpPos = row[superPosIdx];
          // Get genome/condition name
          const genomeIdx = columns.findIndex(
            (col) => col["Header"] === "Genome" || col["Header"] === "Condition"
          );
          const genomeName = row[genomeIdx];
          let tmpClass = getClass(row, primaryIdx, secondaryIdx, internalIdx, antisenseIdx);

          // add tss to tssWithMultipleClasses
          if (tmpPos in tssWithMultipleClasses) {
            // Add once to set
            if (!tssWithMultipleClasses[tmpPos]["set"].includes(tmpClass)) {
              tssWithMultipleClasses[tmpPos]["set"].push(tmpClass);
            }
            // But also add to genome/condition
            if (!Object.keys(tssWithMultipleClasses[tmpPos]).includes(genomeName)) {
              tssWithMultipleClasses[tmpPos][genomeName] = [tmpClass];
            }
            else if (!tssWithMultipleClasses[tmpPos][genomeName].includes(tmpClass)) {
              tssWithMultipleClasses[tmpPos][genomeName].push(tmpClass);
            }
          } else {
            tssWithMultipleClasses[tmpPos] = { "set": [tmpClass] }
            tssWithMultipleClasses[tmpPos][genomeName] = [tmpClass]
          }



          // add tss to tssByClass
          if (tmpClass in tssByClass) {
            if (!tssByClass[tmpClass].includes(tmpPos)) {
              tssByClass[tmpClass].push(tmpPos);
            } else if (typeIntersection === "dedup") {
              return; // Exit the current iteration of the loop
            }
          } else {
            tssByClass[tmpClass] = [tmpPos];
          }

        }
      });
      setUpsetClasses(tssWithMultipleClasses);
    };
    const value = currentData;
    if (value === "all") {
      // create new plots
      TSSperPosition(tableData, tableColumns);
    }
    else if (value === "dedup") {
      TSSperPosition(tableData, tableColumns, value);
    }
    else {
      const genomeIdx = tableColumns.findIndex(
        (col) => col["Header"] === "Genome" || col["Header"] === "Condition"
      );
      // filter table
      const newData = [];
      tableData.forEach((row) => {
        if (row[genomeIdx] === value) {
          newData.push(row);
        }
      });
      // create new plots
      TSSperPosition(newData, tableColumns);
    }
  }, [currentData, filterForPlots, tableColumns, tableData]);
  return (
    <>
      <Header />
      { // if file not found
        // TODO: improve 404 page
        blob === 404 ? <h2>404: File not found</h2> :
          <div className='result-container'>

            <div>
              <h3 className='header click-param' onClick={() => setShowDownload(!showDownload)}>
                {showDownload ? "-" : "+"} Download result of TSS prediction
              </h3>
              <div
                className={showDownload ? "download-link" : " hidden"}
                onClick={() => downloadFiles()}
              >
                TSSpredator-prediction.zip
              </div>
            </div>

            <div className='result-select'>
              <h3 className='select-header'>Show Plots for</h3>
              <select onChange={(e) => setCurrentData(e.target.value)} defaultValue={"all"} value={currentData}>
                <option value='all'>Union of all TSS across Conditions/Genomes</option>
                <option value='dedup'>Intersection of all TSS across Conditions/Genomes</option>
                {allGenomes.map((col, i) => {
                  return (
                    <option value={col} key={i}>
                      {col}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className='result-select'>
              <h3 className='select-header'>TSS to show</h3>
              <select onChange={(e) => setFilterForPlots(e.target.value)} defaultValue={"enriched"} value={filterForPlots}>
                <option value='enriched'>Only enriched TSSs</option>
                <option value='detected'>All detected TSSs</option>
              </select>
            </div>
            <div className='result-margin-left'>
              <h3 className='header click-param' onClick={() => setGFFViewer(!showGFFViewer)}>
                {showGFFViewer ? "-" : "+"} Annotation Viewer with TSS positions
              </h3>
              {processedMasterTable ? (
                <GoslingGenomeViz
                  showPlot={showGFFViewer}
                  dataKey={filePath}
                  filter={filterForPlots === "enriched" ? ["Enriched"] : ["Enriched", "Detected"]} />
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>

            <div className='result-margin-left'>
              <h3 className='header click-param' onClick={() => setShowUpSet(!showUpSet)}>
                {showUpSet ? "-" : "+"} TSS classes overview
              </h3>
              {processedMasterTable ? (
                <UpSet classes={upsetClasses} showUpSet={showUpSet} type={currentData} />
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>




            <div>
              <h3 className='header click-param' onClick={() => setShowTable(!showTable)}>
                {showTable ? "-" : "+"} Master Table
              </h3>
              {tableColumns.length > 0 ? (
                <MasterTable tableColumns={tableColumns} tableData={tableData} showTable={showTable} />
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
