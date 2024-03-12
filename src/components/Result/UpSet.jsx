import React, { useMemo, useState } from 'react';
import { extractCombinations, UpSetJS } from '@upsetjs/react';


/** creates an Upset plot for the tss classes
 * 
 * @param classes: all classes and their frequency
 * @param showUpSet: boolean for showing/hiding the plot
 */
function UpSet({ classes, showUpSet, type }) {
  const COLORS_TSS = ["#377eb8", "#fb8072", "#fed9a6", "#8dd3c7", "#decbe4"]
  const ORDER_TSS_CLASSES = ["primary", "secondary", "internal", "antisense", "orphan"]
  let color_tss = {}
  ORDER_TSS_CLASSES.forEach((x, i) => {
    color_tss[x] = COLORS_TSS[i]
  })
  let elems;
  if (type === "all") {
    elems = Object.entries(classes).reduce((accum, curr) => {
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
    elems = Object.entries(classes).map((other) => {
      return { name: other[0], sets: other[1]["set"] }
    })
  }


  let { sets } = useMemo(() => {
    const { sets } = extractCombinations(elems);
    for (let key of Object.keys(color_tss)) {
      sets.filter(x => x.name === key).forEach(x => x.color = color_tss[key])
    }
    return { sets };
  },

    [elems]);
  const combinations = useMemo(
    () => ({
      type: 'distinctIntersection',
    }),
    []
  );
  const [selection, setSelection] = useState(null);
  if (type === "all") {
    sets = sets.filter(x => ORDER_TSS_CLASSES.includes(x.name))
  }

  return <UpSetJS className={showUpSet ? '' : 'hidden'}
    sets={sets}
    combinations={combinations}
    width={780} height={400} selection={selection} onHover={setSelection} />;
}

export default UpSet