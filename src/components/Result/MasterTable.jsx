import MultiSelectDropdown from './MultiSelectDropdown';
import RangeFilter from './RangeFilter';
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
    flexRender,
    // Column,
    // ColumnDef,
    // ColumnFiltersState,
    // RowData,
    // flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    // getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
  } from '@tanstack/react-table';
import SearchInput from './SearchField';

/**
 * create mastertable with infinite scroll for faster rendering 
 * @param tableColumns: column headers
 * @param tableData: all table rows
 * @param showTable: true <-> show table, else hidden
 */

function MasterTable({ tableColumns, tableData, showTable, gosRef, showGFFViewer, selectionData }) {
    const [loading, setLoading] = useState(false)
    const [moreRows, setMoreRows] = useState(true);
    const [counter, setCounter] = useState(200);
    // currently loaded rows
    const [currentData, setCurrentData] = useState(tableData.slice(0, 200));
    // currently used data
    const allData = useRef([...tableData]);
    // // current sorted column -> first index: column index, second index: d (descending) or a (ascending)
    // const currentSortedCol = useRef(['0', 'a']);
    // // seacrh string on column
    // const [searchColumn, setSearchColumn] = useState('0');
    // const [searchString, setSearchString] = useState("");
    const [columnFilters, setColumnFilters] = useState(
        []
      )


    // reset table
    const resetTable = () => {
        setFiltersForTable([]);
        allData.current = [...tableData];
        setCounter(200);
        setCurrentData(tableData.slice(0, 200));
    }

    // search for string in table column
    const startSearch = () => {
        if (filtersForTable.length === 0) return;

        const newData = [];
        tableData.forEach((row) => {
            if (checkRow(row)) {
                newData.push(row);
            }
        });
        setCounter(200);
        allData.current = [...newData];
        setCurrentData(newData.slice(0, 200));
    }

    // sort Table according to the given column
    const sortTable = (column) => {

        const sortData = [...allData.current];
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
        setCounter(200);
        allData.current = [...sortData];
        setCurrentData(sortData.slice(0, 200));
    }

    /**
     * do the sorting 
     */
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
     * add observer to 20th last row
     */
    // const observer = useRef();
    // const lastRow = useCallback(node => {
    //     if (loading) return;
    //     if (observer.current) observer.current.disconnect();
    //     observer.current = new IntersectionObserver(rows => {
    //         if (rows[0].isIntersecting && moreRows) {
    //             setLoading(true);
    //             /**
    //              * add new rows to current data
    //             */
    //             if (currentData.length - 100 <= allData.current.length) {
    //                 setCurrentData(current => [...current, ...allData.current.slice(counter, counter + 100)]);
    //                 setCounter(c => c + 100);
    //             } else {
    //                 setMoreRows(false);
    //             }
    //             setLoading(false);
    //         }
    //     });
    //     if (node) observer.current.observe(node)
    // }, [loading, moreRows, counter, currentData])

    // prevent rerendering 
    const columns = useMemo(() => tableColumns, [tableColumns]);
    const data = useMemo(() => currentData, [currentData]);

    // create table instance
    // const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useReactTable({ columns, data,    state: {
    const table = useReactTable({ columns, data,    
        state: {
            columnFilters,
          },
        //   filterFns:{

        //   }
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(), 
        getFilteredRowModel: getFilteredRowModel() });

        console.log(table.getState().columnFilters) // access the column filters state from the table instance



    return (
        <div className={showTable ? 'table-and-filter' : 'hidden'}>
            {/* <div className='table-filter'>Search column
                <select onChange={(e) => setSearchColumn(e.target.value)} value={searchColumn}>
                    {columns.map((col, i) => {
                        return <option value={i} key={i}>{col['header']}</option>
                    })}
                </select>
                for
                <input className='element' type='text' onChange={(e) => setSearchString(e.target.value)} value={searchString} />
                <button className='button' onClick={() => startSearch()}>Search</button>
                <p className='reset' onClick={() => resetTable()}>x</p>
            </div> */}
            <div className='table-container'>
                <table>
                {/* <table {...getTableProps()}> */}
                    <thead >
                        {table.getHeaderGroups().map((headerGroup) => (
                            // <tr {...headerGroup.getHeaderGroupProps()} >
                            <tr>
                                {showGFFViewer && <th> Zoom in Viewer </th>}
                            
                                {
                                headerGroup.headers.map((header, i) => (

                                    <th colSpan={header.colSpan} key={header.column.id}> 
                                    <>
                                    <div
                                        {...{
                                            className: header.column.getCanSort()
                                            ? 'cursor-pointer select-none'
                                            : '',
                                            onClick: header.column.getToggleSortingHandler(),
                                        }}
                                        >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                        {{
                                            asc: ' 🔼',
                                            desc: ' 🔽',
                                        }[header.column.getIsSorted()] ?? null}
                                    </div>
                                    {header.column.getCanFilter() ? (
                                        <div>
                                            <Filter column={header.column} selectionData={selectionData} />
                                        </div>
                                    ) : null}
                                    </>
                        
                                 </th> 
                                ))}
                            </tr>
                        ))}
                    </thead>
                    {/* <tbody {table.getTableBodyProps()} > */}
                    <tbody >
                        {table.getRowModel().rows.map((row, i) => {
                            return (
                                // <tr {...row.getRowProps()} ref={(rows.length - 21 === i) ? lastRow : null}>
                                <tr>

                                    {showGFFViewer && <td> <button className="button-results" style={
                                        {
                                            backgroundColor: "lightgrey",
                                            color: "black",
                                            padding: "2px",
                                            margin: "2px",
                                            border: "none",
                                            cursor: "pointer",
                                            borderRadius: "5px"
                                        }
                                    }
                                        onClick={() => {
                                            gosRef.current.api.zoomTo(
                                                `${row.original[4]}_${row.original[1]}_genome_track`,
                                                `${row.original[4].trim()}:${parseInt(row.original[0]) - 150}-${parseInt(row.original[0]) + 150}`,
                                                200)
                                        }}> Show in Viewer</button></td>
                                    }

                                    {
                                        row.getVisibleCells().map((cell) => {
                                            return (
                                                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                            )
                                        })
                                    }
                                </tr>)
                        }
                            )}
                    </tbody>
                </table>
            </div>

        </div >
    )
}

function Filter({ column, selectionData }) {
    const columnFilterValue = column.getFilterValue()
    const { filterVariant } = column.columnDef.meta ?? {}
 
    return filterVariant === 'range' ? (
      <RangeFilter column={column} columnFilterValue={columnFilterValue} />
    ) : filterVariant === 'select' ? (
        <MultiSelectDropdown column={column} selectionData={selectionData} columnFilterValue={columnFilterValue} />

    ) : filterVariant === 'none' ? (
        <> </>
    ) : (
        <SearchInput column={column} columnFilterValue={columnFilterValue} />
      // See faceted column filters example for datalist search suggestions
    )
  }

  // A typical debounced input react component
function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
  }) {
    const [value, setValue] = React.useState(initialValue)
  
    React.useEffect(() => {
      setValue(initialValue)
    }, [initialValue])
  
    React.useEffect(() => {
      const timeout = setTimeout(() => {
        onChange(value)
      }, debounce)
  
      return () => clearTimeout(timeout)
    }, [value])
  
    return (
      <input {...props} value={value} onChange={e => setValue(e.target.value)} />
    )
  }

export default MasterTable