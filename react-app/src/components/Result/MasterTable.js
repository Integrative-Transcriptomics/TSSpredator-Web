import React, { useMemo} from 'react';
import { useTable } from 'react-table';


/**
 * create the Master Table
 * @param masterTable: String that contains data for the table
 */
function MasterTable({ tableColumns, tableData }) {

    // prevent rerendering 
    const columns = useMemo(() => tableColumns, [tableColumns]);
    const data = useMemo(() => tableData, [tableData]);

    // create table instance
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

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