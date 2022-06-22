import React, {useState, useMemo} from 'react';
import {Histogram} from '@upsetjs/plots';


function Histogramm() {
    const [selection, setSelection] = useState(null);
    const elems = useMemo(
      () =>
        Array(100)
          .fill(0)
          .map((_, i) => ({
            n: i.toString(),
            a: Math.random(),
          })),
      []
    );
    return (
       
       
      <Histogram
        selection={selection}
        onHover={setSelection}
        width={500}
        height={100}
        elems={elems}
        attr="a"
        title="As"
      />
    );
}

export default Histogramm