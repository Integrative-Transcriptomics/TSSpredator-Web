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
    // currently used data
    const allData = useRef([...tableData]);
    // current sorted column -> first index: column index, second index: d (descending) or a (ascending)
    const currentSortedCol = useRef(['0', 'a']);


    // sort Table
    const sortTable = (column) => {
        
        const sortData = [...tableData];
        // sort descending
        var biggerA = -1;
        var biggerB = 1;
        // sort currenlty sorted column
        if ((currentSortedCol.current)[0] === column) {
            
            // currently column sorted in descending order
            if ((currentSortedCol.current)[1] === "d") {
                // sort in ascending order
                biggerA = 1;
                biggerB = -1
                currentSortedCol.current = [column, 'a'];
            } else {
                currentSortedCol.current = [column, 'd'];
            }
        } else {
            currentSortedCol.current = [column, 'd'];
        }

        sortData.sort((a, b) => {
            return callSort(a[column], b[column], biggerA, biggerB);
        });
        console.log(sortData)
        setCounter(200);
        allData.current = [...sortData];
        setCurrentData(sortData.slice(0, 200));
    }

    const callSort = (first, second, biggerA, biggerB) => {

        // check if undefinde
        if (typeof first === 'undefined') return biggerB;
        if (typeof second === 'undefined') return biggerA;

        // check if NA
        if ((first === 'NA' && second === 'NA') || (first.length === 0 && second.length === 0) || (first === 'Infinity/Infinity' && second === 'Infinity/Infinity')) {
            return 0;
        }
        if (first === 'NA' || second === 'Infinity/Infinity' || first.length === 0) return biggerB;
        if (second === 'NA' || first === 'Infinity/Infinity' || second.length === 0) return biggerA;

        // check for '/'
        if (first.includes('/') && second.includes('/')) {
            if (first.split('/')[0] === 'Infinity' && second.split('/')[0] === 'Infinity') {
                first = first.split('/')[1];
                second = second.split('/')[1];
            } else {
                first = first.split('/')[0];
                second = second.split('/')[0];
            }
        }
        // check for >
        if (first[0] === '>') first = first.slice(1);
        if (second[0] === '>') second = second.slice(1);

        // check if it is a number
        if (!isNaN(first)) first = parseFloat(first);
        if (!isNaN(second)) second = parseFloat(second);

        // compare values
        if (first > second) return biggerA;
        if (first < second) return biggerB;
        return 0;
    }


    /**
     * add new rows to current data
     */
    const fetchData = () => {
        if (currentData.length - 100 <= allData.current.length) {
            setCurrentData(current => [...current, ...allData.current.slice(counter, counter + 100)]);
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
    const columns = useMemo(() => tableColumns, [tableColumns]);
    const data = useMemo(() => currentData, [currentData]);

    // create table instance
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

    return (
        <div className={showTable ? 'table-container' : 'hidden'}>
            <table {...getTableProps()}>
                <thead >
                    {headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()} >
                            {headerGroup.headers.map((column, i) => (                                
                                <th {...column.getHeaderProps()} onClick={() => sortTable((i.toString()))}>
                                    {column.render('Header')}
                                    {currentSortedCol.current[0] === i.toString() 
                                        ?  (currentSortedCol.current[1] === 'a' ? <i class="sort-arrow up"></i> : <i class="sort-arrow down"></i>)
                                        :  <span className='sort-symbol'>-</span>}
                                    </th>
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