export const chartGraph = (x, y, chartType, title, cWidth, cHeight, xtitle, ytitle, highestRange, fontSize, page, imagefromchart) => {
    const ReactApexChart = typeof document !== 'undefined' && require('react-apexcharts').default
    const Plot = typeof document !== "undefined" && require("react-plotly.js").default;
    const Plotly = typeof document !== "undefined" && require("plotly.js");

    const onupda = (figure, graphDiv) => {
        Plotly.toImage(graphDiv, { format: 'png', height: 400, width: 800 }).then((url) => {
            imagefromchart(url)
        })
    }

    switch (chartType) {
        case 'BAR':
            return (
                [<div className='w-100' key={chartType}>
                    <Plot
                        data={[
                            {
                                x: x,
                                y: y,
                                type: 'bar',
                                marker: { color: '#3158AD' }
                            }
                        ]}
                        layout={{
                            responsive: true,
                            width: cWidth,
                            height: cHeight,
                            title: title,
                            margin: { l: 20, r: 20, b: 20, t: 20, pad: 25 },
                            xaxis: {
                                fixedrange: true,
                                title: xtitle,
                                automargin: true,
                                color: 'grey',
                                showgrid: false,
                                // tickmode: "linear",
                                // tickangle: this.tickangle >= 45 ? 90 : this.tickangle
                            },
                            yaxis: {
                                fixedrange: true,
                                title: ytitle,
                                automargin: true,
                                color: 'grey',
                                showgrid: false,
                                // zeroline: false,
                                rangemode: 'nonnegative',
                                dtickrange: ["min", "max"],
                                dtick: `${highestRange < 10 || highestRange === '' ? 'd' : ''}`
                            },
                            showlegend: false,
                            hovermode: true
                        }}
                        config={{ displayModeBar: false, responsive: true }}
                        className="w-100"
                        onUpdate={onupda}
                    />
                </div>]
            );
        case 'LINE':
            return (
                [<div className='w-100' key={chartType}>
                    <Plot
                        data={[{
                            x: x,
                            y: y,
                            type: 'scatter',
                            mode: 'lines+markers',
                            marker: { color: '#42B9E9' }
                        }]}
                        layout={{
                            responsive: true,
                            width: cWidth,
                            height: cHeight,
                            margin: { l: 30, r: 0, b: 30, t: 0, pad: 2 },
                            xaxis: {
                                fixedrange: true,
                                title: xtitle,
                                automargin: true,
                                color: '#7d7a8b',
                                showgrid: false,
                            },
                            yaxis: {
                                fixedrange: true,
                                title: ytitle,
                                color: '#7d7a8b',
                                automargin: true,
                                showgrid: false,
                                rangemode: 'nonnegative',
                                dtickrange: ["min", "max"],
                                dtick: `${highestRange < 10 || highestRange === '' ? 'd' : ''}`
                            },
                            showlegend: false,
                            hovermode: true
                        }}
                        config={{ scrollZoom: false, displayModeBar: false, responsive: true }}
                        className='w-100'
                        onUpdate={onupda}
                    />
                </div>]
            );
        case 'SPLINE':
            return (
                [<div className='w-100' key={chartType}>
                    <Plot
                        data={[
                            {
                            x: x?.x1,
                            y: y?.y1,
                            type: 'scatter',
                            mode: 'lines',
                            line: { shape: 'spline' },
                            marker: { color: '#42B9E9' }
                        },
                        {
                            x: x?.x2,
                            y: y?.y2,
                            type: 'scatter',
                            mode: 'lines',
                            line: {
                                shape: "spline",
                                dash: "dot",
                                width: 2
                            },
                            marker: {
                                color: 'MediumSeaGreen'
                            }
                        }
                    ]}
                        layout={{
                            responsive: true,
                            width: cWidth,
                            height: cHeight,
                            margin: { l: 30, r: 0, b: 30, t: 0, pad: 2 },
                            xaxis: {
                                fixedrange: false,
                                title: xtitle,
                                automargin: true,
                                color: '#7d7a8b',
                                showgrid: false,
                                showline: true
                            },
                            yaxis: {
                                fixedrange: false,
                                title: ytitle,
                                color: '#7d7a8b',
                                automargin: true,
                                showgrid: true,
                                rangemode: 'nonnegative',
                                dtickrange: ["min", "max"],
                                // dtick: `${highestRange < 10 || highestRange === '' ? 'd' : ''}`
                            },
                            showlegend: false,
                            hovermode: true
                        }}
                        config={{ scrollZoom: true, displayModeBar: false, responsive: true }}
                        className='w-100'
                        onUpdate={onupda}
                    />
                </div>]
            );
        case 'SPLINE_DOT':
            return (
                [<div className='w-100' key={chartType}>
                    <Plot
                        data={[{
                            x: x,
                            y: y,
                            type: 'scatter',
                            mode: 'lines',
                            line: {
                                shape: "spline",
                                dash: "dot",
                                width: 2
                            },
                            marker: {
                                color: 'MediumSeaGreen'
                            }
                        }]}
                        layout={{
                            responsive: true,
                            width: cWidth,
                            height: cHeight,
                            margin: { l: 30, r: 0, b: 30, t: 0, pad: 2 },
                            xaxis: {
                                fixedrange: true,
                                title: xtitle,
                                automargin: true,
                                color: '#7d7a8b',
                                showgrid: false,
                                showline: true
                            },
                            yaxis: {
                                fixedrange: true,
                                title: ytitle,
                                color: '#7d7a8b',
                                automargin: true,
                                showgrid: true,
                                rangemode: 'nonnegative',
                                dtickrange: ["min", "max"],
                                dtick: `${highestRange < 10 || highestRange === '' ? 'd' : ''}`
                            },
                            showlegend: false,
                            hovermode: false
                        }}
                        config={{ scrollZoom: false, displayModeBar: false, responsive: true }}
                        className='w-100'
                        onUpdate={onupda}
                    />
                </div>]
            );
        case 'PIE':
            return (
                [<div className='w-100' key={chartType}>
                    <Plot
                        data={[{
                            values: y,
                            labels: x,
                            type: 'pie',
                            hole: 0,
                            insidetextorientation: "radial",
                            // marker: {
                            //     colors : ['#3333ff','#66d9ff','#33cccc','#b3b3cc','#ccccff','3399ff','#3333ff','#66d9ff','#33cccc','#b3b3cc','#ccccff','3399ff']
                            // },
                            marker: {
                                colors: ['#3333ff', '#66d9ff', '#33cccc', '#b3b3cc', '#ccccff', '3399ff', '#3333ff', '#66d9ff', '#33cccc', '#b3b3cc', '#ccccff', '3399ff']
                            },
                            textinfo: "label+percent",
                        }]}
                        layout={{
                            width: cWidth,
                            height: cHeight,
                            font: { size: fontSize, color: '#ffffff' },
                            title: title,
                            margin: { l: 0, r: 0, b: 0, t: 10, pad: 5 },
                            showlegend: false,
                            hovermode: true
                            // legend: {
                            //     "orientation": "h", "x": 0, "y": -0.3, font: {
                            //         family: 'Sora, "sans-serif"',
                            //         size: 8,
                            //     }
                            // }
                        }}
                        config={{ displayModeBar: false, responsive: true, automargin: true }}
                        className='w-100'
                        onUpdate={onupda}
                    />
                </div>]
            );
        case 'DONUT':
            return (
                [<div className='w-100' key={chartType}>
                    <Plot
                        data={[{
                            values: y,
                            labels: x,
                            type: 'pie',
                            hole: 0.5,
                            insidetextorientation: "radial",
                            // marker: {
                            //     colors : ['#3333ff','#66d9ff','#33cccc','#b3b3cc','#ccccff','3399ff','#3333ff','#66d9ff','#33cccc','#b3b3cc','#ccccff','3399ff']
                            // },
                            marker: {
                                colors: ['#3333ff', '#66d9ff', '#33cccc', '#b3b3cc', '#ccccff', '3399ff', '#3333ff', '#66d9ff', '#33cccc', '#b3b3cc', '#ccccff', '3399ff']
                            },
                            textinfo: "label+percent",
                        }]}
                        layout={{
                            width: cWidth,
                            height: cHeight,
                            font: { size: fontSize, color: '#ffffff' },
                            title: title,
                            margin: { l: 0, r: 0, b: 0, t: 10, pad: 5 },
                            showlegend: false,
                            hovermode: true
                            // legend: {
                            //     "orientation": "h", "x": 0, "y": -0.3, font: {
                            //         family: 'Sora, "sans-serif"',
                            //         size: 8,
                            //     }
                            // }
                        }}
                        config={{ displayModeBar: false, responsive: true, automargin: true }}
                        className='w-100'
                        onUpdate={onupda}
                    />
                </div>]
            );
        case 'A_SPLINE':
            return (
                [<div className='w-100' key={chartType}>
                    <ReactApexChart
                        options={{
                            chart: {
                                type: 'line',
                                // height: 'auto',
                                // width:'auto',
                                toolbar: { show: false },
                                zoom: {
                                    enabled: false
                                }
                            },
                            colors: ['#4415CB', '#66DA26', '#546E7A', '#E91E63', '#FF9800'],
                            dataLabels: {
                                enabled: false
                            },
                            stroke: {
                                curve: 'smooth',
                                width: 0.8
                            },
                            grid: {
                                row: {
                                    colors: ['transparent'],
                                    opacity: 0.5
                                },
                            },
                            xaxis: {
                                categories: x,
                                axisTicks: {
                                    show: false
                                },
                                labels: {
                                    show: true,
                                    offsetX: 0,
                                    offsetY: 5,
                                    // rotate: -90,
                                    // rotateAlways: false,
                                    // trim: false
                                }
                            },
                            yaxis: {
                                show: true,
                                labels: {
                                    show: true,
                                    offsetX: -23,
                                    offsetY: 0
                                }
                            },
                            legend: { show: false },
                            tooltip: { enabled: false },
                            markers: {
                                size: 2,
                                colors: "#008ffb",
                                strokeColors: "#008ffb"
                            },
                            grid: {
                                show: true,
                                xaxis: {
                                    lines: {
                                        show: false
                                    }
                                },
                                yaxis: {
                                    lines: {
                                        show: true
                                    }
                                }
                            }
                        }}
                        type='line'
                        series={
                            [{
                                type: 'line',
                                data: y
                            }]
                        }
                        width={page === 'search' ? 850 : 400}
                        height={cHeight}
                        onUpdate={onupda}
                    />
                </div>]
            );
        case 'AREA':
            return (
                [<div className='w-100' key={chartType}>
                    <ReactApexChart
                        options={{
                            chart: {
                                height: 280,
                                type: "area",
                                toolbar: { show: false },
                                zoom: {
                                    enabled: false
                                }
                            },
                            dataLabels: {
                                enabled: false
                            },
                            stroke: {
                                width: 1.5
                            },
                            fill: {
                                type: "gradient",
                                gradient: {
                                    shadeIntensity: 1,
                                    opacityFrom: 0.3,
                                    opacityTo: 0.6,
                                    stops: [0, 90, 100]
                                }
                            },
                            xaxis: {
                                categories: x,
                                axisBorder: {
                                    show: true,
                                    color: "rgba(128,128,128,0.1)"
                                },
                                axisTicks: {
                                    show: false
                                },
                                labels: {
                                    offsetX: 0,
                                    offsetY: 5,
                                    // rotate: -90,
                                    // rotateAlways: false,
                                    // trim: false
                                }
                            },
                            yaxis: {
                                show: true,
                                axisBorder: {
                                    show: true,
                                    color: "rgba(128,128,128,0.1)"
                                },
                                labels: {
                                    show: true,
                                    offsetX: 0,
                                    offsetY: 0
                                }
                            },
                            legend: { show: false },
                            tooltip: { enabled: false },
                            markers: {
                                size: 5,
                                colors: "white",
                                strokeColors: "#008ffb"
                            },
                            grid: {
                                show: true,
                                borderColor: "rgba(128,128,128,0.1)",
                                xaxis: {
                                    lines: {
                                        show: true
                                    }
                                },
                                yaxis: {
                                    lines: {
                                        show: true
                                    }
                                }
                            }
                        }}
                        type='area'
                        series={
                            [{
                                type: "area",
                                data: y
                            }]
                        }
                        width={page === 'search' ? 850 : 400}
                        height={cHeight}
                        onUpdate={onupda}
                    />
                </div>]
            );
        default:
            break;
    }
}
