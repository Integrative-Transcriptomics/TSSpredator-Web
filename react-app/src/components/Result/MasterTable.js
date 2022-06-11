import React, { useMemo, useState, useCallback, useRef } from 'react';
import { useTable } from 'react-table';

/**
 * create mastertable with infinite scroll for faster rendering 
 * @param tableColumns: column headers
 * @param tableData: all table rows
 * @param: true <-> show table, else hidden
 */
function MasterTable({ tableColumns, tableData, showTable }) {

    const [loading, setLoading] = useState(false)
    const [moreRows, setMoreRows] = useState(true);
    const [counter, setCounter] = useState(200);
    // currently loaded rows
    const [currentData, setCurrentData] = useState(tableData.slice(0, 200));

    /**
     * add new rows to current data
     */
    const fetchData = () => {
        if (currentData.length - 100 <= tableData.length) {
            setCurrentData(current => [...current, ...tableData.slice(counter, counter + 100)]);
            setCounter(c => c + 100);
        } else {
            setMoreRows(false);
        }
        setLoading(false);
    }

    /**
     * add observer to 20th last row
     */
    const observer = useRef();
    const lastRow = useCallback(node => {

        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(rows => {
            if (rows[0].isIntersecting && moreRows) {
                setLoading(true);
                fetchData();
            }
        });
        if (node) observer.current.observe(node)
    }, [loading, moreRows])

    // prevent rerendering 
    const columns = useMemo(() => tableColumns, []);
    const data = useMemo(() => currentData, [currentData]);

    // create table instance
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

    return (
        <div className={showTable ? 'table-container' : 'hidden'}>
            <table {...getTableProps()}>
                <thead>
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()} >
                            {headerGroup.headers.map((column) => (
                                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()} >
                    {rows.map((row, i) => {
                        // add ref for observer to 20th last row
                        if (rows.length - 21 === i) {
                            prepareRow(row)
                            return (
                                <tr {...row.getRowProps()} ref={lastRow}>
                                    {row.cells.map((cell) => {
                                        return (
                                            <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                        )
                                    })}
                                </tr>
                            )
                        } else {
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
                        }
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default MasterTable