import React, {useMemo, useState} from 'react';
import { extractCombinations, UpSetJS } from '@upsetjs/react';


function UpSet() {

    const elems = useMemo(
        () => [
          { name: 'A', sets: ['S1', 'S2'] },
          { name: 'B', sets: ['S1'] },
          { name: 'C', sets: ['S2'] },
          { name: 'D', sets: ['S1', 'S3'] },
        ],
        []
      );

      const { sets, combinations } = useMemo(() => extractCombinations(elems), [elems]);
      const [selection, setSelection] = useState(null);

      return <UpSetJS sets={sets} combinations={combinations} width={780} height={400} selection={selection} onHover={setSelection} />;
}

export default UpSet