import React, { useMemo, useState } from 'react';
import { extractCombinations, UpSetJS } from '@upsetjs/react';

/** creates an Upset plot for the tss classes
 * 
 * @param rows: all the rows from the master table, except the header row
 * @param columns: the column labels
 * @param showUpSet: boolean for showing/hiding the plot
 * @returns 
 */
function UpSet({ classes, showUpSet }) {

  const calcFreq = () => {
   
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