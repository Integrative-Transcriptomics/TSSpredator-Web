import React, { useMemo, useState } from 'react';
import { extractCombinations, UpSetJS } from '@upsetjs/react';
import { map } from 'lodash';

/** creates an Upset plot for the tss classes
 * 
 * @param classes: all classes and their frequency
 * @param showUpSet: boolean for showing/hiding the plot
 */
function UpSet({ classes, showUpSet, type }) {
  let elems
  if (type === "dedup") {
    elems = Object.entries(classes).map((other) => {
      return { name: other[0], sets: other[1]["set"] }
    })
  }
  else {
    elems = Object.entries(classes).reduce((accum, curr) => {
      let tssName = curr[0]
      let mapGenomes = Object.entries(curr[1]).filter(x => x[0] !== "set").map((other) => {
        return { name: tssName, sets: [...other[1], other[0]] }


      })
      // join accum and mapGenomes
      return accum.concat(mapGenomes)
    }, [])
  }

  const { sets } = useMemo(() => extractCombinations(elems), [elems]);
  const combinations = useMemo(
    () => ({
      type: 'distinctIntersection',
    }),
    []
  );
  console.log(sets)
  console.log(combinations)
  const [selection, setSelection] = useState(null);

  return <UpSetJS className={showUpSet ? '' : 'hidden'}
    sets={sets}
    combinations={combinations}
    width={780} height={400} selection={selection} onHover={setSelection} />;
}

export default UpSet