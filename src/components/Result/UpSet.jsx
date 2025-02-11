import React, { useMemo, useState, useEffect } from 'react';
import { extractCombinations, UpSetJS } from '@upsetjs/react';


/** creates an Upset plot for the tss classes
 * 
 * @param classes: all classes and their frequency
 * @param showUpSet: boolean for showing/hiding the plot
 */
function UpSet({ showUpSet, allGenomes, filterForPlots, tableColumns, tableData }) {

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

  
  const [upsetClasses, setUpsetClasses] = useState([]);
  const [data, setData] = useState([]);
  // const [type, setType] = useState("all");
  // const [classUpsetPlot, setClassesUpsetPlot] = useState("tssClass");

  const [plotSettings, setPlotSettings] = useState({
    classUpsetPlot: "tssClass",
    type: "all",
  });
  
  const handleClassUpsetPlotChange = (value) => {
    setPlotSettings((prev) => ({ ...prev, classUpsetPlot: value, type: "all" }));
  };

  const handleTypeChange = (value) => {
    setPlotSettings((prev) => ({ ...prev, type: value }));
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
    const TSSperPosition = (rows, columns, typeIntersection = "all") => {
      // get column indices
      const primaryIdx = columns.findIndex((col) => col["Header"] === "Primary");
      const secondaryIdx = columns.findIndex((col) => col["Header"] === "Secondary");
      const internalIdx = columns.findIndex((col) => col["Header"] === "Internal");
      const antisenseIdx = columns.findIndex((col) => col["Header"] === "Antisense");
      const superPosIdx = columns.findIndex((col) => col["Header"] === "SuperPos");
      const variableFilterTSS = columns.findIndex((col) => col["Header"] === filterForPlots);
      const superStrandIdx = columns.findIndex((col) => col["Header"] === "SuperStrand");



      // save frequency of classes for a TSS (upset plot)
      let tssByClass = {};
      let tssWithMultipleClasses = {};
      // For the condition
      let tssByCondition = {};
      let tssWithMultipleConditions = {};

      rows.forEach((row) => {
        if (row[variableFilterTSS] === "1") {
          const tmpPos = row[superPosIdx];
          const tmpStrand = row[superStrandIdx];
          // Get genome/condition name
          const genomeIdx = columns.findIndex(
            (col) => col["Header"] === "Genome" || col["Header"] === "Condition"
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

          if (genomeName in tssByCondition) {
            if (!tssByCondition[genomeName].includes(tmpTuple)) {
              tssByCondition[genomeName].push(tmpTuple);
            } else if (typeIntersection === "dedup") {
              return; // Exit the current iteration of the loop
            }
          } else {
            tssByCondition[genomeName] = [tmpTuple];
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



          // add tss to tssByClass
          if (tmpClass in tssByClass) {
            if (!tssByClass[tmpClass].includes(tmpTuple)) {
              tssByClass[tmpClass].push(tmpTuple);
            } else if (typeIntersection === "dedup") {
              return; // Exit the current iteration of the loop
            }
          } else {
            tssByClass[tmpClass] = [tmpTuple];
          }

        }
      });
      if (plotSettings.classUpsetPlot === "tssClass") {
        return(tssWithMultipleClasses);
      }
      else {
        return(tssWithMultipleConditions);
      }
    };
    const selectedDataToShow = plotSettings.type;
    let processedData;
    if (selectedDataToShow === "all") {
      // create new plots
      processedData = TSSperPosition(tableData, tableColumns);
    }
    else if (selectedDataToShow === "dedup") {
      processedData = TSSperPosition(tableData, tableColumns, selectedDataToShow);
    }
    else {
      const genomeIdx = tableColumns.findIndex(
        (col) => col["Header"] === "Genome" || col["Header"] === "Condition"
      );
      const primaryIdx = tableColumns.findIndex((col) => col["Header"] === "Primary");
      const secondaryIdx = tableColumns.findIndex((col) => col["Header"] === "Secondary");
      const internalIdx = tableColumns.findIndex((col) => col["Header"] === "Internal");
      const antisenseIdx = tableColumns.findIndex((col) => col["Header"] === "Antisense");
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
      }}

      );
      // create new plots
      processedData = TSSperPosition(newData, tableColumns);
    }

    let color_tss = {}
  ORDER_TSS_CLASSES.forEach((x, i) => {
    color_tss[x] = COLORS_TSS[i]
  })
  let elems;
  if (plotSettings.type === "all") {
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
      for (let key of Object.keys(color_tss)) {
        sets.filter(x => x.name === key).forEach(x => x.color = color_tss[key])
      }

      filteredSet.sort((a, b) => ORDER_TSS_CLASSES.indexOf(b["name"]) - ORDER_TSS_CLASSES.indexOf(a["name"]))
    }
    else {
      filteredSet = sets.filter(x => !ORDER_TSS_CLASSES.includes(x.name))
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




  return <div className={showUpSet ? '' : 'hidden'}>
        <div className='result-select'>
      <h3 className='select-header'>Defined Classes</h3>
      <select onChange={(e) => {
        // setType("all")
        handleClassUpsetPlotChange(e.target.value)
        }} defaultValue={"tssClass"} value={plotSettings.classUpsetPlot}>
        <option value='tssClass'>TSS categories</option>
        <option value='conditions'>Conditions/Genomes</option>
      </select>
    </div>
    <div className='result-select'>
      <h3 className='select-header'>Show UpSet Plot for</h3>
      <select onChange={(e) => handleTypeChange(e.target.value)} defaultValue={"all"} value={plotSettings.type}>
        <option value='all'>Union of all TSS across {plotSettings.classUpsetPlot == "tssClass" ? "Conditions/Genomes" : "TSS classes"}</option>
        <option value='dedup'>Intersection of all TSS across {plotSettings.classUpsetPlot == "tssClass" ? "Conditions/Genomes" : "TSS classes"}</option>

        { // Create a list of all genomes/conditions since Set does not have .map
          (plotSettings.classUpsetPlot == "tssClass" ?  [...allGenomes] : [...ORDER_TSS_CLASSES]).map((col, i) => {
            return (
              <option value={col} key={i}>
                {col}
              </option>
            );
          })}
      </select>
    </div>

    <UpSetJS className={showUpSet ? '' : 'hidden'}
      sets={data}
      combinations={combinations}
      width={windowWidth * 0.7} height={windowHeight * 0.4} selection={selection} onHover={setSelection} 
      onClick={(selection)=>{
        console.log("clicked")
        console.log(selection)
      }}
       />
  </div>;
}

export default UpSet