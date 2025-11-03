import { number } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

function StatsTable() {
    const columns = newColumns()
    const DATA = starterData()
    const [data, setData] = useState(DATA);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });


    return (
        <div id="stats-table-container">
            <thead id="stats-table" w={table.getTotalSize()}>
                {table.getHeaderGroups().map(headerGroup => 
                <tr className="stats-row" key={headerGroup.id}>
                    {headerGroup.headers.map(header => 
                    <th className="stats-header" w={header.getSize()} key={header.id}>
                        {header.column.columnDef.header}
                    </th>
                    )}
                </tr>)}

                {table.getRowModel().rows.map(row =>
                    <tr className="stats-row" key={row.id}>
                        {row.getVisibleCells().map(cell =>
                            <td className="stats-data" w={cell.column.getSize()} key={cell.id}>
                                {
                                    flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )
                                }
                            </td>
                        )}
                    </tr>
                )}
            </thead>
        </div>
    )
}

function starterData() {
    const newStarterData =  
    [
        {
            name: "League of Legends",
            playTime: 4000,
            dailyAverage: 60,
            averageDaysPerWeek: 4
        },

        {
            name: "Hollow Knight: Silksong",
            playTime: 600,
            dailyAverage: 20,
            averageDaysPerWeek: 2
        },

        {
            name: "Hades II",
            playTime: 1000,
            dailyAverage: 20,
            averageDaysPerWeek: 3
        },

        {
            name: "Valorant",
            playTime: 60,
            dailyAverage: 10,
            averageDaysPerWeek: 1
        },
    ];

    return newStarterData;
}

function newColumns() {
    const columns = 
    [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: (props) => <p>{props.getValue()}</p>
        },

        {
            accessorKey: 'playTime',
            header: 'Playtime',
            cell: (props) => <p>{props.getValue()}</p>
        },

        {
            accessorKey: 'dailyAverage',
            header: 'Daily Average Playtime',
            cell: (props) => <p>{props.getValue()}</p>
        },

        {
            accessorKey: 'averageDaysPerWeek',
            header: 'Average Days Per Week Played',
            cell: (props) => <p>{props.getValue()}</p>
        },
    ];
    return columns;
}

export default StatsTable