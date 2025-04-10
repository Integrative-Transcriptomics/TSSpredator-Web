import React, { useMemo, useState, useEffect } from 'react';
import { extractCombinations, UpSetJS } from '@upsetjs/react';
import SingleSelectDropdown from './SingleSelect.jsx';


/** creates an Upset plot for the tss classes
 * 
 * @param classes: all classes and their frequency
 * @param showUpSet: boolean for showing/hiding the plot
 */
function UpSet({ showUpSet, allGenomes, filterForPlots, tableColumns, tableData, handleClickUpset }) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);



  const [data, setData] = useState([]);
  // const [type, setType] = useState("all");
  // const [classUpsetPlot, setClassesUpsetPlot] = useState("tssClass");

  const [plotSettings, setPlotSettings] = useState({
    classUpsetPlot: "tssClass",
    type: "all",
    countType: "position"
  });

  const handleClassUpsetPlotChange = (value) => {
    setPlotSettings((prev) => ({ ...prev, classUpsetPlot: value, type: "all" }));
  };

  const handleTypeChange = (value) => {
    setPlotSettings((prev) => ({ ...prev, type: value }));
  }; 
  
  const handleCountTSS = (value) => {
    setPlotSettings((prev) => ({ ...prev, countType: value }));
  };



  const COLORS_TSS = ["#377eb8", "#fb8072", "#fed9a6", "#8dd3c7", "#decbe4"]
  const ORDER_TSS_CLASSES = ["primary", "secondary", "internal", "antisense", "orphan"]

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
  useEffect(() => {
    /**
   * for upset plot: count frequncy of each tss class
   * and get all genome/condition names
   */
    const TSSperPosition = (rows, columns) => {
      // get column indices
      const primaryIdx = columns.findIndex((col) => col["header"] === "Primary");
      const secondaryIdx = columns.findIndex((col) => col["header"] === "Secondary");
      const internalIdx = columns.findIndex((col) => col["header"] === "Internal");
      const antisenseIdx = columns.findIndex((col) => col["header"] === "Antisense");
      // Either SuperPos or Pos
      // if superPos is not in the columns, use the Pos column
      const searchForPos = col["header"].includes("SuperPos") ? "SuperPos" : "Pos";
      const superPosIdx = columns.findIndex((col) => col["header"] === searchForPos);
      const variableFilterTSS = columns.findIndex((col) => col["header"] === filterForPlots);
      const searchForStrand = col["header"].includes("SuperStrand") ? "SuperStrand" : "Strand";
      const superStrandIdx = columns.findIndex((col) => col["header"] === searchForStrand);



      // save frequency of classes for a TSS (upset plot)
      let tssWithMultipleClasses = {};
      // For the condition
      let tssWithMultipleConditions = {};

      rows.forEach((row) => {
        if (row[variableFilterTSS] === "1") {
          const tmpPos = row[superPosIdx];
          const tmpStrand = row[superStrandIdx];
          // Get genome/condition name
          const genomeIdx = columns.findIndex(
            (col) => col["header"] === "Genome" || col["header"] === "Condition"
          );
          const genomeName = row[genomeIdx];
          let tmpClass = getClass(row, primaryIdx, secondaryIdx, internalIdx, antisenseIdx);
          const tmpTuple = [tmpPos, tmpStrand];

          if (tmpTuple in tssWithMultipleConditions) {
            // Add once to set
            if (!tssWithMultipleConditions[tmpTuple]["set"].includes(genomeName)) {
              tssWithMultipleConditions[tmpTuple]["set"].push(genomeName);
            }
            // But also add to TSS class
            if (!Object.keys(tssWithMultipleConditions[tmpTuple]).includes(tmpClass)) {
              tssWithMultipleConditions[tmpTuple][tmpClass] = [genomeName];
            }
            else if (!tssWithMultipleConditions[tmpTuple][tmpClass].includes(genomeName)) {
              tssWithMultipleConditions[tmpTuple][tmpClass].push(genomeName);
            }
          } else {
            tssWithMultipleConditions[tmpTuple] = { "set": [genomeName] }
            tssWithMultipleConditions[tmpTuple][tmpClass] = [genomeName]
          }

          // add tss to tssWithMultipleClasses
          if (tmpTuple in tssWithMultipleClasses) {
            // Add once to set
            if (!tssWithMultipleClasses[tmpTuple]["set"].includes(tmpClass)) {
              tssWithMultipleClasses[tmpTuple]["set"].push(tmpClass);
            }
            // But also add to genome/condition
            if (!Object.keys(tssWithMultipleClasses[tmpTuple]).includes(genomeName)) {
              tssWithMultipleClasses[tmpTuple][genomeName] = [tmpClass];
            }
            else if (!tssWithMultipleClasses[tmpTuple][genomeName].includes(tmpClass)) {
              tssWithMultipleClasses[tmpTuple][genomeName].push(tmpClass);
            }
          } else {
            tssWithMultipleClasses[tmpTuple] = { "set": [tmpClass] }
            tssWithMultipleClasses[tmpTuple][genomeName] = [tmpClass]
          }

        }
      });
      if (plotSettings.classUpsetPlot === "tssClass") {
        return (tssWithMultipleClasses);
      }
      else {
        return (tssWithMultipleConditions);
      }
    };
    const selectedDataToShow = plotSettings.type;
    let processedData;
    if (selectedDataToShow === "all") {
      // create new plots
      processedData = TSSperPosition(tableData, tableColumns);
    }
    else {
      const genomeIdx = tableColumns.findIndex(
        (col) => col["header"] === "Genome" || col["header"] === "Condition"
      );
      const primaryIdx = tableColumns.findIndex((col) => col["header"] === "Primary");
      const secondaryIdx = tableColumns.findIndex((col) => col["header"] === "Secondary");
      const internalIdx = tableColumns.findIndex((col) => col["header"] === "Internal");
      const antisenseIdx = tableColumns.findIndex((col) => col["header"] === "Antisense");
      // filter table
      const newData = [];
      tableData.forEach((row) => {
        if (plotSettings.classUpsetPlot === "tssClass") {
          if (row[genomeIdx] === selectedDataToShow) {
            newData.push(row);
          }
        }
        else {
          let tmpClass = getClass(row, primaryIdx, secondaryIdx, internalIdx, antisenseIdx);
          if (tmpClass === selectedDataToShow) {
            newData.push(row);
          }
        }
      }

      );
      // create new plots
      processedData = TSSperPosition(newData, tableColumns);
    }

    let color_tss = {}
    ORDER_TSS_CLASSES.forEach((x, i) => {
      color_tss[x] = COLORS_TSS[i]
    })
    let elems;
    if (plotSettings.countType === "classification") {
      elems = Object.entries(processedData).reduce((accum, curr) => {
        let tssName = curr[0]
        let mapGenomes = Object.entries(curr[1]).filter(x => x[0] !== "set").map((other) => {
          const typesOfTSS = other[1]
          const genomeFound = other[0]
          return { name: tssName, sets: [...typesOfTSS, genomeFound] }
        })
        // join accum and mapGenomes
        return accum.concat(mapGenomes)
      }, [])
    }
    else {
      elems = Object.entries(processedData).map((other) => {
        return { name: other[0], sets: other[1]["set"] }
      })
    }


    const { sets } = extractCombinations(elems);
    let filteredSet;
    if (plotSettings.classUpsetPlot === "tssClass") {
      filteredSet = sets.filter(x => ORDER_TSS_CLASSES.includes(x.name))
      filteredSet.forEach(x => x.color = color_tss[x.name])
      filteredSet.sort((a, b) => ORDER_TSS_CLASSES.indexOf(b["name"]) - ORDER_TSS_CLASSES.indexOf(a["name"]))
    }
    else {
      filteredSet = sets.filter(x => !ORDER_TSS_CLASSES.includes(x.name))
      if (plotSettings.type !== "all") {
        filteredSet.forEach(x => x.color = color_tss[plotSettings.type])
      }

    }

    setData(filteredSet);
  }, [plotSettings, filterForPlots, tableColumns, tableData]);

  const combinations = useMemo(
    () => ({
      type: 'distinctIntersection',
    }),
    []
  );
  const [selection, setSelection] = useState(null);




  return <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%"
  }} className={showUpSet ? '' : 'hidden'}>
    <div className="upset-settings">
    <SingleSelectDropdown
        label="Categories to Analyze"
        value={plotSettings.classUpsetPlot}
        onChange={(value) => handleClassUpsetPlotChange(value)}
        options={[
          { value: "tssClass", label: "TSS classes" },
          { value: "conditions", label: "Conditions/Genomes" },
        ]}
        helpText={`This option defines the axes of the UpSet plot.`}

      />

      <SingleSelectDropdown
        label="Show UpSet Plot for"
        value={plotSettings.type}
        onChange={(value) => handleTypeChange(value)}
        options={[
          {
            value: "all",
            label: `All ${plotSettings.classUpsetPlot === "tssClass"
                ? "Conditions/Genomes"
                : "TSS classes"
              }`,
          },
          ...(plotSettings.classUpsetPlot === "tssClass"
            ? [...allGenomes]
            : [...ORDER_TSS_CLASSES]
          ).map((col) => ({ value: col, label: col })),
        ]}
        helpText={`Either show data for all ${plotSettings.classUpsetPlot === "tssClass" ? "Conditions/Genomes" : "TSS classes"} or for specific ones`}
      />
      <SingleSelectDropdown
        label={`A TSSs is defined by its`}
        value={plotSettings.countType}
        onChange={(value) => handleCountTSS(value)}
        helpText={`A TSS can be associated with multiple ${plotSettings.classUpsetPlot === "tssClass"
                ? "Conditions/Genomes"
                : "TSS classes"
              }. However, the genomic position is the same. This option defines how to count the TSSs, either as unique genomic positions or account also for the classification. 
              Please consider that for the case that a TSS is classified twice as internal or antisense, it will only be counted once.`}

        options={[
          {
            value: "position",
            label: `Location`,
          },
          {
            value: "classification",
            label: `Location and ${plotSettings.classUpsetPlot === "tssClass"
              ? "Conditions/Genomes"
              : "TSS classes"
            }`,
          }
        ]}
      />
     

    </div>

    <UpSetJS className={showUpSet ? '' : 'hidden'}
      sets={data}
      combinations={combinations}
      width={windowWidth * 0.7} height={windowHeight * 0.4} selection={selection} onHover={setSelection}
      onClick={(selection) => {
        let selected = {
          positions: [...new Set(selection.elems.map(x => x.name))],
          classes: [...selection.sets].map(x => x.name),
          id: [...selection.sets].map(x => x.name).join(""),
          selectedType: plotSettings.classUpsetPlot === "tssClass" ? "TSS classes" : "Conditions/Genomes"
        };
      
        handleClickUpset((prev) => {
          // Check if selection already exists
          const exists = prev.some(item => item.id === selected.id);
      
          // If it doesn't exist, add it; otherwise, return the same state
          return exists ? prev : [...prev, selected];
        });
      }}
      
    />
  </div>;
}

export default UpSet