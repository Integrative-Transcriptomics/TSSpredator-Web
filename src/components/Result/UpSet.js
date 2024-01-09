import React, { useMemo, useState } from 'react';
import { extractCombinations, UpSetJS } from '@upsetjs/react';

/** creates an Upset plot for the tss classes
 * 
 * @param classes: all classes and their frequency
 * @param showUpSet: boolean for showing/hiding the plot
 */
function UpSet({ classes, showUpSet }) {

  let elems = Object.entries(classes).map((other) => {
    return { name: other[0], sets: other[1] }
  })
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