import React, { useMemo } from 'react';
import { useTable } from 'react-table';

/**
 * create the Master Table
 * @param masterTable: String that contains data for the table
 */
function MasterTable({ masterTable }) {

    const allRows = masterTable.split('\n');

    // column headers
    const headers = (allRows[0]).split('\t');

    // save rows
    const dataRows = [];
    allRows.forEach((row, i) => {
        if (i > 0) {
            const tmp = row.split('\t');
            var tmpRow = {};
            tmp.forEach((content, j) => {
                const char = j.toString()
                tmpRow[char] = content;
            })
            dataRows.push(tmpRow);
        }
    })

    // columns for the table
    const col = [];
    headers.forEach((h, i) => {
        const char = i.toString();
        col.push({ Header: h, accessor: char });
    })

    // prevent rerendering 
    const columns = useMemo(() => col, []);
    const data = useMemo(() => dataRows, []);

    // create table instance
    const table = useTable({ columns, data });
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = table

    return (
        <table {...getTableProps()}>
            <thead>
                {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                            <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody {...getTableBodyProps()}>
                {rows.map((row) => {
                    prepareRow(row)
                    return (
                        <tr {...row.getRowProps()}>
                            {row.cells.map((cell) => {
                                return (
                                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                )
                            })}
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}

export default MasterTable