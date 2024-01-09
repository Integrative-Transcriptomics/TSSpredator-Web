import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { GoslingComponent } from "gosling.js";
import JSZip from "jszip";
import "../css/Result.css";
import "../css/App.css";
import "../css/MasterTable.css";
import MasterTable from "./Result/MasterTable";
import UpSet from "./Result/UpSet";
import Histogramm from "./Result/Histogramm";
import LineChart from "./Result/LineChart";

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
  const [stepHeight, setStepHeight] = useState({ detected: [], enriched: [] });
  const [showStepHeight, setShowStepHeight] = useState(false);
  const stepHeightCap = 100;
  const [stepFactor, setStepFactor] = useState({ detected: [], enriched: [] });
  const [showStepFactor, setShowStepFactor] = useState(false);
  const [enrichmentFactor, setEnrichmentFactor] = useState({ detected: [], enriched: [] });
  const [showEnrichFactor, setShowEnrichFactor] = useState(false);

  // line Chart
  const [showLineChart, setShowLineChart] = useState(false);
  const [linePrimary, setLinePrimary] = useState({});
  const [lineSecondary, setLineSecondary] = useState({});
  const [lineInternal, setLineInternal] = useState({});
  const [lineAntisense, setLineAntisense] = useState({});
  const [lineOrphan, setLineOrphan] = useState({});
  const binSize = 50000;

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
        console.log("res", res);

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
          console.log("404");
          setBlob(404);
          return
        }
        console.log("blob", blob);
        setBlob(blob);

        JSZip.loadAsync(blob)
          .then((zip) => {
            return zip.file("MasterTable.tsv").async("string");
          })
          .then((data) => {
            handleMasterTable(data);
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
   * calculate frequency for step height, step factor and enrichment factor
   */
  const stepHeightFactorEnrichementFreq = (rows, columns) => {
    // get column indices
    const stepHeightIdx = columns.findIndex((col) => col["Header"] === "stepHeight");
    const stepFactorIdx = columns.findIndex((col) => col["Header"] === "stepFactor");
    const detected = columns.findIndex((col) => col["Header"] === "detected");
    const enriched = columns.findIndex((col) => col["Header"] === "enriched");
    const enrichFactorIdx = columns.findIndex((col) => col["Header"] === "enrichmentFactor");

    const stepH = { detected: [], enriched: [] };
    const stepF = { detected: [], enriched: [] };
    const enrichmentF = { detected: [], enriched: [] };

    // count frequncy of stepheight, step factor and enrichment Factor
    rows.forEach((row, i) => {
      if (row[detected] === "1") {
        let type = "detected";

        if (row[enriched] === "1") {
          type = "enriched";
        }

        if (row[stepHeightIdx] !== "NA") {
          // cap at 'stepHeightCap' to make histogram readable
          if (row[stepHeightIdx] > stepHeightCap) {
            stepH[type].push(stepHeightCap);
          } else {
            stepH[type].push(row[stepHeightIdx]);
          }
        }

        if (row[stepFactorIdx] !== "NA") {
          if (row[stepFactorIdx].includes(">")) {
            stepF[type].push("100");
          } else {
            stepF[type].push(row[stepFactorIdx]);
          }
        }

        if (row[enrichFactorIdx] !== "NA") {
          if (row[enrichFactorIdx].includes(">")) {
            enrichmentF[type].push("100");
          } else {
            enrichmentF[type].push(row[enrichFactorIdx]);
          }
        }
      }
      setStepHeight(stepH);
      setStepFactor(stepF);
      setEnrichmentFactor(enrichmentF);
    });
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
   * line chart: add current TSS possition
   */
  const addTSSPosition = (tssClass, binSize, tmpPos) => {
    const tmpKeys = Object.keys(tssClass);
    var found = false;
    tmpKeys.forEach((k) => {
      if (parseInt(tmpPos) <= parseInt(k)) {
        tssClass[k] += 1;
        found = true;
        return;
      }
    });
    if (!found) {
      const arrOfNum = tmpKeys.map((str) => {
        return Number(str);
      });
      const index = Math.max.apply(Math, arrOfNum) + binSize;
      tssClass[index] = 1;
    }
    return tssClass;
  };

  /**
   * update plots for selected genome/condition
   */

  let spec = {
    "title": "Position of TSSs",
    "subtitle": "etst",
    "tracks": [
      {
        "layout": "linear",
        "width": 800,
        "height": 180,
        "data": {
          "url": "https://raw.githubusercontent.com/sehilyi/gemini-datasets/master/data/UCSC.HG38.Human.CytoBandIdeogram.csv",
          "type": "csv",
          "chromosomeField": "Chromosome",
          "genomicFields": ["chromStart", "chromEnd"]
        },
        "mark": "bar",
        "x": { "field": "chromStart", "type": "genomic", "axis": "bottom" },
        // "xe": { "field": "chromEnd", "type": "genomic" },
        "y": { "value": 150, "type": "quantitative", "axis": "right" },
        "size": { "value": 2 }
      }
    ]
  }
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


      // TSS per Position (line chart)
      var primary = { [binSize]: 0 };
      var secondary = { [binSize]: 0 };
      var internal = { [binSize]: 0 };
      var antisense = { [binSize]: 0 };
      var orphan = { [binSize]: 0 };

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
            if (!tssWithMultipleClasses[tmpPos]["set"].includes(tmpClass)) {
              tssWithMultipleClasses[tmpPos]["set"].push(tmpClass);
            }
            else if (!Object.keys(tssWithMultipleClasses[tmpPos]).includes(genomeName)) {
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
          // ---------------------
          // line chart
          if (tmpClass === "primary") {
            primary = addTSSPosition(primary, binSize, tmpPos);
          } else if (tmpClass === "secondary") {
            secondary = addTSSPosition(secondary, binSize, tmpPos);
          } else if (tmpClass === "internal") {
            internal = addTSSPosition(internal, binSize, tmpPos);
          } else if (tmpClass === "antisense") {
            antisense = addTSSPosition(antisense, binSize, tmpPos);
          } else {
            orphan = addTSSPosition(orphan, binSize, tmpPos);
          }
          // -----------------------
        }
      });


      setUpsetClasses(tssWithMultipleClasses);
      setLinePrimary(primary);
      setLineSecondary(secondary);
      setLineInternal(internal);
      setLineAntisense(antisense);
      setLineOrphan(orphan);
    };
    const value = currentData;
    if (value === "all") {
      // create new plots
      stepHeightFactorEnrichementFreq(tableData, tableColumns);
      TSSperPosition(tableData, tableColumns);
    }
    else if (value === "dedup") {
      stepHeightFactorEnrichementFreq(tableData, tableColumns);
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
      stepHeightFactorEnrichementFreq(newData, tableColumns);
      TSSperPosition(newData, tableColumns);
    }
  }, [currentData, filterForPlots, tableColumns, tableData]);
  return (
    <>
      <header>
        <h1>TSSpredator</h1>
      </header>

      { // if file not found
        // TODO: improve 404 page
        blob === 404 ? <h2>404: File not found</h2> :
          <div className='result-container'>
            <GoslingComponent spec={spec} />
            {/* <GoslingComponent spec={spec2} /> */}

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
              <h3 className='header click-param' onClick={() => setShowUpSet(!showUpSet)}>
                {showUpSet ? "-" : "+"} TSS classes overview
              </h3>
              {stepHeight["enriched"].length > 0 ? (
                <UpSet classes={upsetClasses} showUpSet={showUpSet} type={currentData} />
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>

            <div className='result-margin-left'>
              <h3 className='header click-param' onClick={() => setShowStepHeight(!showStepHeight)}>
                {showStepHeight ? "-" : "+"} Step Height overview
              </h3>
              {stepHeight["enriched"].length > 0 ? (
                <Histogramm
                  elements={stepHeight}
                  xaxis='Step Height'
                  steps={2}
                  cap={stepHeightCap}
                  show={showStepHeight}
                />
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>

            <div className='result-margin-left'>
              <h3 className='header click-param' onClick={() => setShowStepFactor(!showStepFactor)}>
                {showStepFactor ? "-" : "+"} Step Factor overview
              </h3>
              {stepFactor["enriched"].length > 0 ? (
                <Histogramm
                  elements={stepFactor}
                  xaxis='Step Factor'
                  steps={2}
                  cap='100'
                  show={showStepFactor}
                />
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>
            <div className='result-margin-left'>
              <h3 className='header click-param' onClick={() => setShowEnrichFactor(!showEnrichFactor)}>
                {showEnrichFactor ? "-" : "+"} Enrichment Factor overview
              </h3>
              {enrichmentFactor["enriched"].length > 0 ? (
                <Histogramm
                  elements={enrichmentFactor}
                  xaxis='Enrichment Factor'
                  steps={2}
                  cap='100'
                  show={showEnrichFactor}
                />
              ) : (
                <ClipLoader color='#ffa000' size={30} />
              )}
            </div>

            <div className='result-margin-left'>
              <h3 className='header click-param' onClick={() => setShowLineChart(!showLineChart)}>
                {showLineChart ? "-" : "+"} TSS distribution per position in bp
              </h3>
              {enrichmentFactor["enriched"].length > 0 ? (
                <LineChart
                  primary={linePrimary}
                  secondary={lineSecondary}
                  internal={lineInternal}
                  antisense={lineAntisense}
                  orphan={lineOrphan}
                  binSize={binSize}
                  show={showLineChart}
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
