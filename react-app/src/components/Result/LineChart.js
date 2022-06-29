import React from 'react';
import Plotly from "plotly.js-cartesian-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";

/**
 * creates a line chart over all TSS positions. Each TSS class has an own trace
 * @param primary: data for primary trace (object)
 * @param secondary: data for secondary trace (object)
 * @param internal: data for internal trace (object)
 * @param antisense: data for antisense trace (object)
 * @param orphan: data for orphan trace (object)
 * @param binSize: binSize 
 * @param show: boolean for showing/hiding the plot
 */
function LineChart({ primary, secondary, internal, antisense, orphan, binSize, show }) {

    const Plot = createPlotlyComponent(Plotly);

    // transform all objects to two arrays
    const pKeys = Object.keys(primary);
    const pValues = [];
    pKeys.forEach(k => pValues.push(primary[k]));

    const sKeys = Object.keys(secondary);
    const sValues = [];
    sKeys.forEach(k => sValues.push(secondary[k]));
   
    const iKeys = Object.keys(internal);
    const iValues = [];
    iKeys.forEach(k => iValues.push(internal[k]));

    const asKeys = Object.keys(antisense);
    const asValues = [];
    asKeys.forEach(k => asValues.push(antisense[k]));

    const oKeys = Object.keys(orphan);
    const oValues = [];
    oKeys.forEach(k => oValues.push(orphan[k]));

    // initialize all traces
    var trace1 = {
        x: pKeys, y: pValues, type: 'scatter', name: 'Primary',
        line: {
            color: '#970FF2',
            width: 2
        }
    };
    var trace2 = {
        x: sKeys, y: sValues, type: 'scatter', name: 'Secondary',
        line: {
            color: '#0597F2',
            width: 2
        }
    };
    var trace3 = {
        x: iKeys, y: iValues, type: 'scatter', name: 'Internal',
        line: {
            color: '#49D907',
            width: 2
        }
    };
    var trace4 = {
        x: asKeys, y: asValues, type: 'scatter', name: 'Antisense',
        line: {
            color: '#F24607',
            width: 2
        }
    };
    var trace5 = {
        x: oKeys, y: oValues, type: 'scatter', name: 'Orphan',
        line: {
            color: '#EAF205',
            width: 2
        }
    };

    // initialize data
    var data = [trace1, trace2, trace3, trace4, trace5];

    return (
        <div className={show ? '' : 'hidden'}>
            <Plot
                data={data}
                layout={{ width: 1700, height: 550, title: 'TSS distribution over all Positions with a bin size of ' + binSize, xaxis: { title: 'Position in bp' }, yaxis: { title: 'Count' } }}
            />
        </div>
    )
}

export default LineChart