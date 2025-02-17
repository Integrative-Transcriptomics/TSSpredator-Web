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
sortingFns: {
    myReplicateSorting: (row1, row2, columnID) => {
        let a = row1.original[columnID];
        let b = row2.original[columnID];
        if (a === b) return 0;
        // check if NA
        if ((a === 'NA' && b === 'NA') || (a.length === 0 && b.length === 0) || (a === 'Infinity/Infinity' && b === 'Infinity/Infinity')) {
            return 0;
        }
        if (a === 'NA' || b === 'Infinity/Infinity' || a.length === 0) return -1;
        if (b === 'NA' || a === 'Infinity/Infinity' || b.length === 0) return 1;

        // check for '/'
        if (a.includes('/') && b.includes('/')) {
            if (a.split('/')[0] === 'Infinity' && b.split('/')[0] === 'Infinity') {
                a = a.split('/')[1];
                b = b.split('/')[1];
            } else {
                a = a.split('/')[0];
                b = b.split('/')[0];
            }
        }
         // check for >
         if (a[0] === '>') a = a.slice(1);
         if (b[0] === '>') b = b.slice(1);
 
         // check if it is a number
         if (!isNaN(a)) a = parseFloat(a);
         if (!isNaN(b)) b = parseFloat(b);
 
         // compare values
         if (a > b) return 1;
         if (a < b) return -1;
         return 0;
        },
    myCappedSorting: (row1, row2, columnID) => {
        let a = row1.original[columnID];
        let b = row2.original[columnID];
        // if same return 0
        if (a === b) return 0;
        // check if NA
        if (a === 'NA' && b === 'NA')  {
            return 0;
        }
        if (a === 'NA') return -1;
        if (b === 'NA') return 1;
        // if any starts with >, remove it
        if (a[0] === '>') a = a.slice(1);
        if (b[0] === '>') b = b.slice(1);
          // check if it is a number
          if (!isNaN(a)) a = parseFloat(a);
          if (!isNaN(b)) b = parseFloat(b);
        console.log(a, b)
        // compare values
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;}
    },

        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(), 
        getFilteredRowModel: getFilteredRowModel() 
    });

    return (
        <div className={showTable ? 'table-and-filter' : 'hidden'}>
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
                                            backgroundColor: "#007bff",
                                            color: "white",
                                            padding: "0.5em",
                                            margin: "2px",
                                            border: "none",
                                            cursor: "pointer",
                                            borderRadius: "6px", 
                                            fontFamily: "Arial",
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
    )
  }


export default MasterTable