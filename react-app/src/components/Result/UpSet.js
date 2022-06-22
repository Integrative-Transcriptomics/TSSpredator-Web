import React, { useMemo, useState } from 'react';
import { extractCombinations, UpSetJS } from '@upsetjs/react';

function UpSet({ rows, columns, showUpSet }) {

  // get column index
  const primaryIdx = columns.findIndex((col) => col['Header'] === 'Primary');
  const secondaryIdx = columns.findIndex((col) => col['Header'] === 'Secondary');
  const internalIdx = columns.findIndex((col) => col['Header'] === 'Internal');
  const antisenseIdx = columns.findIndex((col) => col['Header'] === 'Antisense');
  const superPosIdx = columns.findIndex((col) => col['Header'] === 'SuperPos');
  const genomeIdx = columns.findIndex((col) => col['Header'] === 'Genome');


  const calcFreq = () => {

    // save frequency of classes for a TSS
    var classes = { 'primary': 0, 'secondary': 0, 'internal': 0, 'antisense': 0, 'orphan': 0 };
    var currentPos = "";
    var currentGenome = "";
    var currentClass = {};

    rows.forEach(row => {

      const tmpPos = row[superPosIdx];
      const tmpGenome = row[genomeIdx];

      var tmpClass = getClass(row);

      // new TSS found -> add classes from previous TSS
      if (tmpPos !== currentPos || tmpGenome !== currentGenome) {
        classes = addNewTSS(currentClass, classes);
        // reset value
        currentClass = {};
      }
      // reset values
      currentPos = tmpPos;
      currentGenome = tmpGenome;

      // add class from current row 
      if (tmpClass in currentClass) {
        currentClass[tmpClass] += 1;
      } else {
        currentClass[tmpClass] = 1;
      }
    });

    // add last tss
    classes = addNewTSS(currentClass, classes);
    
    // save all classes in array
    const newElements = [];
    Object.keys(classes).forEach((key, i) => {

      const tmpClasses = key.split('-');
      var classArray = [];
      // each class is one array element
      tmpClasses.forEach(cl => {
        classArray.push(cl);
      })

      var tmp = { sets: [...classArray] }
      // add current classes to array, as often as the frequncy of the current classes 
      for (let j = 0; j < classes[key]; j++) {
        newElements.push(tmp);
      }
    });
    return newElements;
  }


  const getClass = (row) => {
    // get class of this row
    if (row[primaryIdx] === '1') {
      return 'primary';
    } else if (row[secondaryIdx] === '1') {
      return 'secondary';
    } else if (row[internalIdx] === '1') {
      return 'internal';
    } else if (row[antisenseIdx] === '1') {
      return 'antisense';
      // orphan
    } else {
      return 'orphan';
    }
  }

  
  const addNewTSS = (currentClass, classes) => {
    // last tss has at least two different classes
    if (Object.keys(currentClass).length > 1) {

      // sort classes
      const tmpKey = Object.keys(currentClass);
      const sortClasses = {};
      tmpKey.forEach(key => {
        sortClasses[key] = currentClass[key];
      })
      // create new class-group
      var node = "";
      Object.keys(sortClasses).forEach(cl => {
        node += cl + '-';
      });
      // remove last '-'
      node = node.slice(0, -1)
      // add class-group to classes
      if (node in classes) {
        classes[node] += 1;
      } else {
        classes[node] = 1;
      }
      // at least one class  
    } else if (Object.keys(currentClass).length > 0) {
      Object.keys(currentClass).forEach(cl => {
        classes[cl] += currentClass[cl];
      });
    }
    return classes;
  }

  const elements = calcFreq();

  const elems = useMemo(() => [...elements], [elements]);
 // create upset plot
  const { sets } = useMemo(() => extractCombinations(elems), [elems]);
  const combinations = useMemo(
    () => ({
      type: 'distinctIntersection',
    }),
    []
  );
  const [selection, setSelection] = useState(null);

  return <UpSetJS className={showUpSet ? '' : 'hidden'}
    sets={sets}
    combinations={combinations}
    width={780} height={400} selection={selection} onHover={setSelection} />;
}

export default UpSet