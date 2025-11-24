import { useEffect, useState } from "react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { formatMinutesToHoursMinutes } from "../utils/timeFormatter";

function StatsTable() {
    const columns = newColumns();
    const [data, setData] = useState([]);
    const [period, setPeriod] = useState('week');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel()
    });

    // Fetch stats data
    const fetchStats = async () => {
        try {
            setIsLoading(true);
            const options = { period };

            if (period === 'custom' && customStart && customEnd) {
                options.customStart = customStart;
                options.customEnd = customEnd;
            }

            const stats = await window.electronAPI.getGameStats(options);
            setData(stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
            setData([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch on mount and when period changes
    useEffect(() => {
        fetchStats();
    }, [period, customStart, customEnd]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchStats();
        }, 60000); // 60 seconds

        return () => clearInterval(intervalId);
    }, [period, customStart, customEnd]);


    return (
        <div id="stats-table-container">
            {/* Time Period Selector */}
            <div className="stats-controls">
                <div className="period-selector">
                    <button
                        className={period === 'week' ? 'active' : ''}
                        onClick={() => setPeriod('week')}
                    >
                        This Week
                    </button>
                    <button
                        className={period === 'month' ? 'active' : ''}
                        onClick={() => setPeriod('month')}
                    >
                        This Month
                    </button>
                    <button
                        className={period === 'total' ? 'active' : ''}
                        onClick={() => setPeriod('total')}
                    >
                        Total
                    </button>
                    <button
                        className={period === 'custom' ? 'active' : ''}
                        onClick={() => setPeriod('custom')}
                    >
                        Custom
                    </button>
                </div>

                {/* Custom Date Range Picker */}
                {period === 'custom' && (
                    <div className="custom-date-range">
                        <label>
                            Start:
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                            />
                        </label>
                        <label>
                            End:
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                            />
                        </label>
                    </div>
                )}
            </div>

            {/* Stats Table */}
            {isLoading ? (
                <p>Loading stats...</p>
            ) : data.length === 0 ? (
                <p>No gaming sessions found for this period.</p>
            ) : (
                <div id={period === 'custom'? 'stats-all-rows-custom' : 'stats-all-rows'}>
                <table id="stats-table">

                    <thead id="stats-headers">
                        {table.getHeaderGroups().map(headerGroup =>
                        <tr className="stats-row" key={headerGroup.id}>
                            {headerGroup.headers.map(header =>
                            <th className="stats-header" key={header.id}>
                                <p className="stats-header-text">{header.column.columnDef.header}</p>
                                {
                                    header.column.getCanSort() && 
                                    <button className="sortButton"
                                    onClick={header.column.getToggleSortingHandler()}></button>
                                }
                            </th>
                            )}
                        </tr>)}
                    </thead>
                    
                    <tbody>
                        {table.getRowModel().rows.map(row =>
                            <tr className="stats-row" key={row.id}>
                                {row.getVisibleCells().map(cell =>
                                    <td className="stats-data" key={cell.id}>
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
                        
                    </tbody>
                    
                </table>
                </div>
            )}
        </div>
    )
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
            cell: (props) => <p>{formatMinutesToHoursMinutes(props.getValue())}</p>
        },

        {
            accessorKey: 'dailyAverage',
            header: 'Daily Average Playtime',
            cell: (props) => <p>{formatMinutesToHoursMinutes(props.getValue())}</p>
        },

        {
            accessorKey: 'averageSessionLength',
            header: 'Average Session Length',
            cell: (props) => <p>{formatMinutesToHoursMinutes(props.getValue())}</p>
        },
    ];
    return columns;
}

export default StatsTable