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
import { useVirtualizer, notUndefined } from '@tanstack/react-virtual'

import SearchInput from './SearchField';

/**
 * create mastertable with infinite scroll for faster rendering 
 * @param tableColumns: column headers
 * @param tableData: all table rows
 * @param showTable: true <-> show table, else hidden
 */

function MasterTable({ tableColumns, tableData, showTable, gosRef, showGFFViewer, selectionData, filterFromUpset, adaptFilterFromUpset }) {
    // currently used data
    const [isLoading, setIsLoading] = useState(false);
    const [filteredData, setFilteredData] = useState([...tableData]); // Store filtered data separately

    // const allData = useRef([...tableData]);

    useEffect(() => {
        setIsLoading(true); // Show loading overlay

        // Simulate async filtering process (use actual logic here)
        setTimeout(() => {
            const newData = tableData.filter(row => {
                if (filterFromUpset.length === 0) return true;
                let tmpTuple = `${row[0]},${row[1]}`;
                return filterFromUpset.some(filter => filter.positions.includes(tmpTuple));
            });

            setFilteredData(newData); // Update table data
            setIsLoading(false); // Hide loading overlay
        }, 300); // Small delay to ensure smooth transition
    }, [filterFromUpset, tableData]);

    const [columnFilters, setColumnFilters] = useState(
        []
    )
    const [sorting, setSorting] = useState([])


    // prevent rerendering 
    const columns = useMemo(() => tableColumns, [tableColumns]);
    const data = useMemo(() => filteredData, [filteredData]);

    // create table instance
    const table = useReactTable({
        columns, data,
        state: {
            columnFilters,
            sorting,
        },
        sortingFns: {
            myReplicateSorting: (row1, row2, columnID) => {
                let a = row1.original[columnID];
                let b = row2.original[columnID];
            
                // Directly return if values are equal
                if (a === b) return 0;
            
                // Handle empty values efficiently
                if (!a) return -1;
                if (!b) return 1;
            
                // Optimize '/' splitting and mean calculation
                const parseValues = (val) => {
                    if (!val.includes('/')) return val === "Infinity" ? Number.MAX_VALUE : val === "NA" ? 0 : parseFloat(val);
                    let numbers = val.split('/').map(x => x === "Infinity" ? Number.MAX_VALUE : x === "NA" ? 0 : parseFloat(x));
                    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
                };
            
                a = parseValues(a);
                b = parseValues(b);
            
                return a - b;
            },            
            myCappedSorting: (row1, row2, columnID) => {
                let a = row1.original[columnID];
                let b = row2.original[columnID];
            
                // Directly return if values are equal
                if (a === b) return 0;
            
                // Handle 'NA' cases efficiently
                if (a === 'NA') return -1;
                if (b === 'NA') return 1;
            
                // Remove '>' prefix if present
                if (a.startsWith('>')) a = a.slice(1);
                if (b.startsWith('>')) b = b.slice(1);
            
                // Convert to number only if necessary
                a = isNaN(a) ? a : parseFloat(a);
                b = isNaN(b) ? b : parseFloat(b);
            
                return a - b;
                        
            }
        },
        onSortingChange: setSorting,

        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel()
    });

    const { rows } = table.getRowModel();
    const parentRef = useRef(null);
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 50,
        overscan: 20,
    })

    const items = virtualizer.getVirtualItems();
    const [before, after] =
        items.length > 0
            ? [
                notUndefined(items[0]).start - virtualizer.options.scrollMargin,
                virtualizer.getTotalSize() - notUndefined(items[items.length - 1]).end
            ]
            : [0, 0];

    return (
        <div className={showTable ? 'table-and-filter' : 'hidden'}>
            <div className="table-filter">
                {filterFromUpset.map((column, i) => (
                    <div key={i} className="filter-card">
                        <span className="filter-text">{column.selectedType}</span>
                        <span className="filter-text">{column.classes}</span>
                        <button className="close-button" onClick={() => adaptFilterFromUpset(prev => prev.filter((_, index) => index !== i))}>
                            ✖
                        </button>
                    </div>
                ))}
            </div>

            <div 
                ref={parentRef} 
                className='table-container'
                style={{ overflow: "auto", overflowAnchor: "none" }}
            >
                <table>
                    <thead >
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr
                                key={headerGroup.id}
                                style={{
                                    position: "sticky",
                                    top: 0,
                                    background: "green",
                                    width: "100%",
                                }}
                            >
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
                    {isLoading && (
                <div className="loading-overlay" style={{ 
                    height: `${virtualizer.getTotalSize()}px`,
                    transform: `translateY(${virtualizer.getScrollOffset()}px)`}}>
                        <div className='loading-group' style={{transform: `translateY(${parseFloat(parentRef.current.clientHeight/2)}px)`}}>
                        <div className="spinner"></div>
                    <p>Loading...</p>
                        </div>
                </div>
            )}
                    <tbody  >
                        {before > 0 && (
                            <tr>
                                <td colSpan={columns.length} style={{ height: before }} />
                            </tr>
                        )}
                        {items.map((virtualRow, i) => {
                            const row = rows[virtualRow.index]
                            return (
                                // <tr {...row.getRowProps()} ref={(rows.length - 21 === i) ? lastRow : null}>
                                <tr
                                    key={row.id}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        // transform: `translateY(${virtualRow.start - i * virtualRow.size
                                        //     }px)`,
                                    }}
                                >

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
                        {after > 0 && (
                            <tr>
                                <td colSpan={columns.length} style={{ height: after }} />
                            </tr>
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