import React from 'react';
import Plotly from "plotly.js-cartesian-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";

/** creates a Histogram
 * 
 * @param elements: data for the histogram
 * @param xaxis: xaxis label
 * @param steps: bin width
 * @param cap: the cap for the data
 * @param show: boolean for showing/hiding the histogram
 * @returns 
 */
function Histogramm({ elements, xaxis, steps, cap, show }) {

  const Plot = createPlotlyComponent(Plotly);
  const title = 'Histogram over all ' + xaxis + 's with a cap at ' + cap

  return (
    <div className={show ? '' : 'hidden'}>
      <Plot
        data={[
          { type: 'histogram', x: elements, xbins: { size: steps }, marker: { color: 'black', line: { color: 'white', width: 1 } } },
        ]}
        layout={{ width: 1500, height: 450, title: title, xaxis: { title: xaxis }, yaxis: { title: 'Count' } }}
      />
    </div>
  )
}

export default Histogramm