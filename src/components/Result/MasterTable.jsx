import MultiSelectDropdown from './MultiSelectDropdown';
import RangeFilter from './RangeFilter';
import { useMemo, useState, useRef, useEffect } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer, notUndefined } from '@tanstack/react-virtual'
import { Info } from "lucide-react"; // Using lucide-react for the info icon


import SearchInput from './SearchField';
import "../../css/FilterCard.css";
import "../../css/MasterTable.css";


/**
 * create mastertable with infinite scroll for faster rendering 
 * @param tableColumns: column headers
 * @param tableData: all table rows
 * @param showTable: true <-> show table, else hidden
 */

function MasterTable({ tableColumns, tableData, showTable, gosRef, showGFFViewer, setShowTable,selectionData, filterFromUpset, adaptFilterFromUpset, setGFFViewer }) {
    // currently used data
    const [isLoading, setIsLoading] = useState(false);
    const [filteredData, setFilteredData] = useState([...tableData]); // Store filtered data separately
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
        // Jump to the div containing the table
        if (!showTable){
            setShowTable(true);
        }; // Only scroll if the table is visible
        // This ensures the table is visible when the component mounts or updates
        const div = document.getElementById('master-table');
        if (div) {
            div.scrollIntoView({ behavior: "smooth", block: "start" });
        }
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
        <div id="master-table" className={showTable ? 'table-and-filter' : 'hidden'}>
            <div className="table-tooltip">

                <div id='tooltip-genome' className="tooltip" style={{
                    position: "absolute",
                    visibility: "hidden",
                    height: "5em",
                    width: "10em",
                    opacity: 0,
                    transition: "opacity 0.3s ease-in-out",
                    zIndex: 15,
                }}>
                    To visualize the TSS position, open the genome viewer first
                </div>
            </div>
            <FilterCard filterFromUpset={filterFromUpset} adaptFilterFromUpset={adaptFilterFromUpset} />

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
                                    zIndex: 1,
                                    width: "100%",
                                }}
                            >
                                {showGFFViewer ? <th> Show Position </th> : <th >
                                    <button className="button-results" style={
                                        {
                                            backgroundColor: "white",
                                            color: "#007bff",
                                            padding: "0.5em",
                                            margin: "2px",
                                            border: "none",
                                            // make bold
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                            borderRadius: "6px",
                                            fontFamily: "Arial",
                                        }
                                    }

                                        onClick={() => {
                                            setGFFViewer(true)
                                        }}> Open Viewer</button></th>}

                                {
                                    headerGroup.headers.map((header, i) => (

                                        <th colSpan={header.colSpan} key={header.column.id}>
                                            <>
                                                <span
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
                                                </span>
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
                            transform: `translateY(${virtualizer.getScrollOffset()}px)`
                        }}>
                            <div className='loading-group' style={{ transform: `translateY(${parseFloat(parentRef.current.clientHeight / 2)}px)` }}>
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
                                <tr
                                    key={row.id}
                                    style={{
                                        height: `${virtualRow.size}px`,
                                    }}
                                >

                                    {<td key={`button-${row.id}`} className='cell-button'>
                                        <div className="tooltip-wrapper" onMouseEnter={(e) => {
                                        if (!showGFFViewer) {
                                            // get the tooltip element 
                                            let tooltip = document.getElementById('tooltip-genome');
                                            tooltip.style.visibility = "visible";
                                            tooltip.style.opacity = 1;
                                            // get position of the cursor and set to tooltip
                                            tooltip.style.left = `${e.clientX + 15}px`;
                                            tooltip.style.top = `${e.clientY - 100}px`;
                                                                                }                                        }
                                        }
                                            onMouseLeave={() => {
                                                document.getElementById('tooltip-genome').style.visibility = "hidden";
                                                document.getElementById('tooltip-genome').style.opacity = 0;
                                            }
                                            }>
                                            <button
                                                className="button-results"
                                                disabled={!showGFFViewer}
                                                style={{
                                                    backgroundColor: showGFFViewer ? "#007bff" : "grey",
                                                    color: "white",
                                                    padding: "0.5em",
                                                    margin: "2px",
                                                    border: "none",
                                                    cursor: showGFFViewer ? "pointer" : "not-allowed",
                                                    borderRadius: "6px",
                                                    fontFamily: "Arial",
                                                }}

                                                onClick={() => {
                                                    if (gosRef.current) {
                                                        gosRef.current.api.zoomTo(
                                                            `${row.original[4]}_${row.original[1]}_genome_track`,
                                                            `${row.original[4].trim()}:${parseInt(row.original[0]) - 150}-${parseInt(row.original[0]) + 150}`,
                                                            200
                                                        );
                                                        // Jump to the div
                                                        const div = document.getElementById(`genome-viewer`);
                                                        if (div) {
                                                            div.scrollIntoView({ behavior: "smooth", block: "center" });
                                                        }
                                                    }
                                                }}
                                            >
                                                Show in Viewer
                                            </button>


                                        </div>
                                    </td>

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


function FilterCard({ filterFromUpset, adaptFilterFromUpset }) {
    return (
        <div className="filter-container">
            {/* Title Bar enclosing all filter cards */}
            <div className="filter-title">
                <span>Filters from UpSet plot:</span>
                <div className="info-icon-container">
                    <Info style={{ color: "white" }} size={24} className="info-icon" />
                    <div className="tooltip">These filters allow to filter the MasterTable with respect to intersecting groups from the UpSet plot. Click on the specific group to get the corresponding subset. The TSS positions need to be in at least one filter group to appear on the list.</div>
                </div>
                {filterFromUpset.length > 0 && (
                    <button className="clear-button" onClick={() => adaptFilterFromUpset([])}>
                        Clear All ✖
                    </button>
                )}
            </div>

            <div className="filter-grid">
                {filterFromUpset.length === 0 && (
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        width: "100%",
                    }} >
                        <div className="filter-card">
                            <span className="filter-text">No global filters selected. Interact with the UpSet plot to include some global filters.</span>
                        </div>
                    </div>
                )

                }
                {filterFromUpset.map((column, i) => (
                    <div key={i} className="filter-card">
                        <span className="filter-text">Category: {column.selectedType}</span>
                        <span className="filter-text">Selected: {column.classes.join(" & ")}</span>
                        <button
                            className="close-button"
                            onClick={() => adaptFilterFromUpset((prev) => prev.filter((_, index) => index !== i))}
                        >
                            ✖
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default MasterTable