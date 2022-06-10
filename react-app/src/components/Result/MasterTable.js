import React, { useMemo, useState } from 'react';
import { useTable } from 'react-table';
import InfiniteScroll from "react-infinite-scroll-component";


/**
 * create the Master Table
 * @param masterTable: String that contains data for the table
 */
function MasterTable({ tableColumns, tableData }) {

    const [moreRows, setMoreRows] = useState(true);
    const [counter, setCounter] = useState(100);
    const [currentData, setCurrentData] = useState(tableData.slice(0, 100));


    const fetchData = () => {

        if (currentData.length - 100 <= tableData.length) {
            setCurrentData(current => [...current, ...tableData.slice(counter, counter + 100)]);
            setCounter(c => c + 100);
        } else {
            setMoreRows(false);
        }
    }

    // prevent rerendering 
    const columns = useMemo(() => tableColumns, []);
    const data = useMemo(() => currentData, [currentData]);


    // create table instance
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

    return (



        <InfiniteScroll className='Container' dataLength={currentData.length} next={fetchData} hasMore={moreRows}>


            <table  {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()} >
                            {headerGroup.headers.map((column) => (
                                <th {...column.getHeaderProps()} >{column.render('Header')}</th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()} >
                    {rows.map((row) => {
                        prepareRow(row)
                        return (
                            <tr {...row.getRowProps()} >
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



        </InfiniteScroll >



    )
}

export default MasterTable