import React, { useMemo, useState } from 'react';
import { extractCombinations, UpSetJS } from '@upsetjs/react';

function UpSet({ rows, columns }) {

  // get column index
  const primaryIdx = columns.findIndex((col) => col['Header'] === 'Primary');
  const secondaryIdx = columns.findIndex((col) => col['Header'] === 'Secondary');
  const internalIdx = columns.findIndex((col) => col['Header'] === 'Internal');
  const antisenseIdx = columns.findIndex((col) => col['Header'] === 'Antisense');
  const superPosIdx = columns.findIndex((col) => col['Header'] === 'SuperPos');
  const genomeIdx = columns.findIndex((col) => col['Header'] === 'Genome');

  // create elements 
  var classes = { 'primary': 0, 'secondary': 0, 'internal': 0, 'antisense': 0, 'orphan': 0 };
  var currentPos = "";
  var currentGenome = "";
  var currentClass = {};

  rows.forEach(row => {

    const tmpPos = row[superPosIdx];
    const tmpGenome = row[genomeIdx];

    var tmpClass = "";
    // get class of this row
    if (row[primaryIdx] === '1') {
      tmpClass = 'primary';
    } else if (row[secondaryIdx] === '1') {
      tmpClass = 'secondary';
    } else if (row[internalIdx] === '1') {
      tmpClass = 'internal';
    } else if (row[antisenseIdx] === '1') {
      tmpClass = 'antisense';
      // orphan
    } else {
      tmpClass = 'orphan';
    }

    // different tss
    if (tmpPos !== currentPos || tmpGenome !== currentGenome) {
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
      // reset value
      currentClass = {};
    }
    currentPos = tmpPos;
    currentGenome = tmpGenome;
    // add class from current row 
    if (tmpClass in currentClass) {
      currentClass[tmpClass] += 1;
    } else {
      currentClass[tmpClass] = 1;
    }
  });

  // last tss
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

  const elements = [];
  Object.keys(classes).forEach((key, i) => {

    const tmpClasses = key.split('-');
    var m = [];

    tmpClasses.forEach(cl => {
      m.push(cl);
    })

    var tmp = { sets: [...m] }
   
      for (let j = 0; j < classes[key]; j++) {
        elements.push(tmp);
      }   
  });

  const elems = useMemo(() => [...elements], [elements]);
 
  const { sets } = useMemo(() => extractCombinations(elems), [elems]);
  const combinations = useMemo(
    () => ({
      type: 'distinctIntersection',
    }),
    []
  );
  const [selection, setSelection] = useState(null);

  return <UpSetJS 
  sets={sets} 
  combinations={combinations} 
  width={780} height={400} selection={selection} onHover={setSelection} />;
}

export default UpSet