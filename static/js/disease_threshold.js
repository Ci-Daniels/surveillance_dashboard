document.addEventListener('DOMContentLoaded', function() {
    const thresholdTab = document.getElementById('threshold_tab');
    const threshYear = document.getElementById('thresh_year');
    const threshCounty = document.getElementById('thresh_county');
    const threshDisease = document.getElementById('thresh_disease');
    const staticDisease = document.getElementById('static_disease');
    const staticCounty = document.getElementById('static_county');
    const staticYear = document.getElementById('static_year');
    const rollingDisease = document.getElementById('rolling_disease');
    const rollingCounty = document.getElementById('rolling_county');
    const nationalDisease = document.getElementById('national_disease');
    const threshTitle = document.getElementById('thresh_title');
    const alertStatusChart = document.getElementById('alert_status_chart');
    const priorityTable = document.getElementById('priority_table');
    const staticGrid = document.getElementById('static_grid');
    const rollingGrid = document.getElementById('rolling_grid');
    const nationalPlot = document.getElementById('national_plot');

    // Initialize bootstrap-select
    if (window.jQuery && $.fn.selectpicker) {
        $([thresholdTab, threshYear, threshCounty, threshDisease, staticDisease, staticCounty, staticYear, rollingDisease, rollingCounty, nationalDisease]).selectpicker();
    } else {
        console.error('jQuery or bootstrap-select not loaded.');
        [thresholdTab, threshYear, threshCounty, threshDisease, staticDisease, staticCounty, staticYear, rollingDisease, rollingCounty, nationalDisease].forEach(picker => {
            if (picker) picker.removeAttribute('data-live-search');
        });
    }

    // Toggle tab panes based on dropdown
    function toggleTabs() {
        const selectedTab = thresholdTab.value;
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.style.display = pane.id === selectedTab ? 'block' : 'none';
        });
    }

    // Initialize tab visibility
    toggleTabs();

    // Update visualizations
    function updateVisuals() {
        if (!threshYear.value || !threshCounty.value || !threshDisease.value) return;

        const formData = new FormData();
        formData.append('thresh_year', threshYear.value);
        formData.append('thresh_county', threshCounty.value);
        formData.append('thresh_disease', threshDisease.value);
        if (staticDisease.value && staticYear.value && $(staticCounty).val()) {
            formData.append('static_disease', staticDisease.value);
            $(staticCounty).val().forEach(county => formData.append('static_county', county));
            formData.append('static_year', staticYear.value);
        }
        if (rollingDisease.value && $(rollingCounty).val()) {
            formData.append('rolling_disease', rollingDisease.value);
            $(rollingCounty).val().forEach(county => formData.append('rolling_county', county));
        }
        if (nationalDisease.value) {
            formData.append('national_disease', nationalDisease.value);
        }

        // Debug FormData
        const formDataObj = {};
        formData.forEach((value, key) => {
            formDataObj[key] = formDataObj[key] ? [...(Array.isArray(formDataObj[key]) ? formDataObj[key] : [formDataObj[key]]), value] : value;
        });
        console.log('Sending FormData:', formDataObj);

        fetch('/get_disease_threshold_data', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('Received data:', {
                total_counties: data.total_counties,
                active_alerts: data.active_alerts,
                outbreaks: data.outbreaks,
                diseases_monitored: data.diseases_monitored,
                table_data: data.table_data.slice(0, 2),
                status_data: data.status_data.counties.slice(0, 2),
                static_data: Object.values(data.static_data).slice(0, 2),
                rolling_data: Object.values(data.rolling_data).slice(0, 2),
                national_data: data.national_data.dates.slice(0, 2)
            });
        
            const kpiUpdates = {
                'total_counties': data.total_counties,
                'active_alerts': data.active_alerts,
                'outbreaks': data.outbreaks,
                'diseases_monitored': data.diseases_monitored
            };
        
            Object.keys(kpiUpdates).forEach(kpiId => {
                const element = document.getElementById(kpiId);
                if (element) {
                    element.textContent = kpiUpdates[kpiId];
                    console.log(`Updated ${kpiId} to ${kpiUpdates[kpiId]}`);
                } else {
                    console.error(`Element with ID ${kpiId} not found in DOM`);
                }
            });
         
            // Alternative approach - try querySelector if getElementById fails
            if (!document.getElementById('total_counties')) {
                const totalCountiesEl = document.querySelector('#total_counties');
                if (totalCountiesEl) {
                    totalCountiesEl.textContent = data.total_counties;
                    console.log('Updated total_counties using querySelector');
                }
            }
    
            // Update thresh title
            if (threshTitle) {
                threshTitle.innerHTML = `Summary statistics for ${threshYear.value === 'all' ? 'All Years (2023-2025)' : threshYear.value}`;
            }

            // Render Alert Status Chart
            if (alertStatusChart && data.status_data.counties.length > 0) {
                const sortedData = data.status_data.counties.map((county, index) => ({
                    county,
                    total: (data.status_data.normal[index] || 0) + 
                           (data.status_data.alert[index] || 0) + 
                           (data.status_data.outbreak[index] || 0),
                    normal: data.status_data.normal[index] || 0,
                    alert: data.status_data.alert[index] || 0,
                    outbreak: data.status_data.outbreak[index] || 0
                })).sort((a, b) => b.total - a.total);

                Highcharts.chart('alert_status_chart', {
                    chart: { type: 'column' },
                    title: { text: `Total Cases for ${threshDisease.value === 'all' ? 'All Diseases' : threshDisease.value} by County in ${threshYear.value === 'all' ? 'All Years' : threshYear.value}` },
                    xAxis: { 
                        categories: sortedData.map(item => item.county), 
                        title: { text: 'County' } 
                    },
                    yAxis: { title: { text: 'Total Cases' } },
                    series: [
                        { name: 'Normal', data: sortedData.map(item => item.normal), color: '#28a745' },
                        { name: 'Alert', data: sortedData.map(item => item.alert), color: '#ffc107' },
                        { name: 'Outbreak', data: sortedData.map(item => item.outbreak), color: '#dc3545' }
                    ],
                    plotOptions: {
                        column: { stacking: 'normal', dataLabels: { enabled: false } }
                    },
                    tooltip: {
                        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.0f}</b><br/>'
                    },
                    exporting: { enabled: true }
                });
            } else {
                alertStatusChart.innerHTML = '<p>No alert status data available.</p>';
            }

            // Render Priority Table
            if (priorityTable && data.table_data.length > 0) {
                $(priorityTable).DataTable({
                    data: data.table_data,
                    columns: [
                        { title: 'County', data: 'county' },
                        { title: 'Disease', data: 'Disease_Condition' },
                        { title: 'Cases', data: 'Total_cases' },
                        { title: 'Alert (Avg mean +1SD)', data: 'Alert' },
                        { title: 'Outbreak (Avg mean +2SD)', data: 'Outbreak' },
                        { title: 'Exceeded Alert', data: 'Exceeded_Alert' }
                    ],
                    destroy: true,
                    searching: true,
                    paging: true,
                    pageLength: 4,
                    scrollY: '200px',
                    dom: 'Bltip',
                    buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
                    rowCallback: function(row, data) {
                        const status = data.Exceeded_Alert;
                        const bgColor = status === 'Normal' ? '#d4edda' : status === 'Alert' ? '#fff3cd' : '#f8d7da';
                        const textColor = status === 'Normal' ? '#155724' : status === 'Alert' ? '#856404' : '#721c24';
                        $(row).find('td:last').css({ 'background-color': bgColor, 'color': textColor });
                    }
                });
            } else {
                priorityTable.innerHTML = '<p>No priority alert data available.</p>';
            }

           // Static Grid Rendering with better validation
            if (staticGrid) {
                // First, check if we have the required form values
                console.log('DEBUG: Form values check:');
                console.log('staticDisease.value:', staticDisease.value);
                console.log('staticYear.value:', staticYear.value);
                console.log('$(staticCounty).val():', $(staticCounty).val());
                
                // Check if required parameters are missing
                if (!staticDisease.value || !staticYear.value || !$(staticCounty).val() || $(staticCounty).val().length === 0) {
                    console.log('DEBUG: Missing required form values for static data');
                    staticGrid.innerHTML = '<div class="col-md-12"><p>Please select disease, year, and at least one county for static threshold analysis.</p></div>';
                } else if (Object.keys(data.static_data).length > 0) {
                    staticGrid.innerHTML = '';
                    console.log('DEBUG: Static data keys:', Object.keys(data.static_data));
                    console.log('DEBUG: Number of counties with data:', Object.keys(data.static_data).length);
                    
                    Object.values(data.static_data).forEach(plotData => {
                        console.log('DEBUG: Processing static plot for county:', plotData.county);
                        console.log('DEBUG: Raw plotData structure:', {
                            county: plotData.county,
                            dates: plotData.dates?.slice(0, 3), // Show first 3 dates
                            values: plotData.values?.slice(0, 3), // Show first 3 values
                            mean: plotData.mean?.slice(0, 3), // Show first 3 mean values
                            dates_length: plotData.dates?.length,
                            values_length: plotData.values?.length,
                            mean_length: plotData.mean?.length
                        });
                        
                        // More lenient validation - check if we have any valid values
                        const hasValidValues = plotData.values && plotData.values.length > 0 && 
                                            plotData.values.some(v => v !== null && v !== undefined && !isNaN(v));
                        const hasValidDates = plotData.dates && plotData.dates.length > 0 && 
                                            plotData.dates.some(d => d !== null && d !== undefined);
                        const hasValidMean = plotData.mean && plotData.mean.length > 0 && 
                                        plotData.mean.some(v => v !== null && v !== undefined && !isNaN(v));
                        
                        console.log(`DEBUG: Validation for ${plotData.county}:`, {
                            hasValidValues,
                            hasValidDates,
                            hasValidMean
                        });
                        
                        if (hasValidValues && hasValidDates) {
                            const plotId = `static_plot_${plotData.county.replace(/\s+/g, '_')}`;
                            const div = document.createElement('div');
                            div.className = 'col-md-4';
                            div.innerHTML = `<div class="box"><div class="box-header">Static Threshold: ${plotData.county}</div><div id="${plotId}" style="height: 400px;"></div></div>`;
                            staticGrid.appendChild(div);
                            
                            // Clean the data arrays - replace null/undefined with actual null for Highcharts
                            const cleanValues = plotData.values.map(v => (v === null || v === undefined || isNaN(v)) ? null : parseFloat(v));
                            const cleanMean = plotData.mean?.map(v => (v === null || v === undefined || isNaN(v)) ? null : parseFloat(v)) || [];
                            const cleanAlert = plotData.alert?.map(v => (v === null || v === undefined || isNaN(v)) ? null : parseFloat(v)) || [];
                            const cleanOutbreak = plotData.outbreak?.map(v => (v === null || v === undefined || isNaN(v)) ? null : parseFloat(v)) || [];
                            
                            console.log(`DEBUG: Clean data lengths for ${plotData.county}:`, {
                                cleanValues: cleanValues.length,
                                cleanMean: cleanMean.length,
                                cleanAlert: cleanAlert.length,
                                cleanOutbreak: cleanOutbreak.length
                            });
                            
                            Highcharts.chart(plotId, {
                                chart: { type: 'line' },
                                title: { text: null },
                                xAxis: { 
                                    categories: plotData.dates, 
                                    title: { text: 'Date' } 
                                },
                                yAxis: { title: { text: 'Case Count' } },
                                series: [
                                    { name: 'Cases', data: cleanValues, color: '#1f77b4' },
                                    { name: 'Mean', data: cleanMean, color: '#1f77b4', dashStyle: 'Dash' },
                                    { name: 'Alert', data: cleanAlert, color: '#ff7f0e', dashStyle: 'Dash' },
                                    { name: 'Outbreak', data: cleanOutbreak, color: '#d62728', dashStyle: 'Dash' }
                                ],
                                tooltip: {
                                    shared: true,
                                    pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.2f}</b><br/>'
                                },
                                plotOptions: {
                                    line: {
                                        connectNulls: false,
                                        marker: { enabled: false }
                                    }
                                },
                                exporting: { enabled: true }
                            });
                            
                            console.log(`DEBUG: Successfully created chart for ${plotData.county}`);
                        } else {
                            const div = document.createElement('div');
                            div.className = 'col-md-4';
                            div.innerHTML = `<div class="box"><div class="box-header">Static Threshold: ${plotData.county}</div><p>No valid data for ${plotData.county}</p></div>`;
                            staticGrid.appendChild(div);
                            console.log(`DEBUG: No valid data for ${plotData.county} - Values: ${hasValidValues}, Dates: ${hasValidDates}, Mean: ${hasValidMean}`);
                        }
                    });
                } else {
                    console.log('DEBUG: No static data keys found in response');
                    console.log('DEBUG: Full data.static_data:', data.static_data);
                    console.log('DEBUG: Type of data.static_data:', typeof data.static_data);
                    staticGrid.innerHTML = '<div class="col-md-12"><p>No data available for the selected disease, year, and counties. Check server logs for details.</p></div>';
                }
            }
            // Rolling Grid Rendering with better validation
            if (rollingGrid && Object.keys(data.rolling_data).length > 0) {
                rollingGrid.innerHTML = '';
                const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                console.log('Rolling data keys:', Object.keys(data.rolling_data));
                
                Object.values(data.rolling_data).forEach(plotData => {
                    console.log('Processing rolling plot for county:', plotData.county);
                    console.log('Number_sick length:', plotData.number_sick?.length);
                    console.log('Non-null number_sick:', plotData.number_sick?.filter(v => v !== null && v !== undefined)?.length);
                    
                    // More lenient validation
                    const hasValidSick = plotData.number_sick && plotData.number_sick.length > 0 && 
                                        plotData.number_sick.some(v => v !== null && v !== undefined && !isNaN(v));
                    const hasValidMA = plotData.monthly_ma && plotData.monthly_ma.length > 0 && 
                                    plotData.monthly_ma.some(v => v !== null && v !== undefined && !isNaN(v));
                    const hasValidMonths = plotData.months && plotData.months.length > 0;
                    
                    if (hasValidSick && hasValidMonths) {
                        const plotId = `rolling_plot_${plotData.county.replace(/\s+/g, '_')}`;
                        const div = document.createElement('div');
                        div.className = 'col-md-4';
                        div.innerHTML = `<div class="box"><div class="box-header">Moving Average: ${plotData.county}</div><div id="${plotId}" style="height: 500px;"></div></div>`;
                        rollingGrid.appendChild(div);

                        const years = [...new Set(plotData.years)];
                        const yearColors = { '2023': '#0000FF', '2024': '#FFA500', '2025': '#008000' };
                        const series = [];
                        
                        years.forEach(year => {
                            const monthData = new Array(12).fill(null);
                            plotData.months.forEach((month, i) => {
                                if (plotData.years[i] === year) {
                                    const monthIndex = monthOrder.indexOf(month);
                                    if (monthIndex !== -1 && plotData.number_sick[i] !== null && plotData.number_sick[i] !== undefined) {
                                        monthData[monthIndex] = parseFloat(plotData.number_sick[i]);
                                    }
                                }
                            });
                            
                            // Only add series if it has some data
                            if (monthData.some(v => v !== null)) {
                                series.push({
                                    name: `Cases ${year}`,
                                    type: 'line',
                                    data: monthData,
                                    color: yearColors[year] || '#000000'
                                });
                            }
                        });

                        // Add moving average, alert, and outbreak lines
                        const maData = new Array(12).fill(null);
                        const alertData = new Array(12).fill(null);
                        const outbreakData = new Array(12).fill(null);
                        
                        plotData.months.forEach((month, i) => {
                            const monthIndex = monthOrder.indexOf(month);
                            if (monthIndex !== -1) {
                                if (plotData.monthly_ma[i] !== null && plotData.monthly_ma[i] !== undefined) {
                                    maData[monthIndex] = parseFloat(plotData.monthly_ma[i]);
                                }
                                if (plotData.alert[i] !== null && plotData.alert[i] !== undefined) {
                                    alertData[monthIndex] = parseFloat(plotData.alert[i]);
                                }
                                if (plotData.outbreak[i] !== null && plotData.outbreak[i] !== undefined) {
                                    outbreakData[monthIndex] = parseFloat(plotData.outbreak[i]);
                                }
                            }
                        });

                        if (maData.some(v => v !== null)) {
                            series.push({ name: 'Monthly Moving Average', type: 'line', data: maData, color: '#666666', dashStyle: 'Dash', marker: { enabled: false } });
                        }
                        if (alertData.some(v => v !== null)) {
                            series.push({ name: 'Alert Threshold', type: 'line', data: alertData, color: '#ff7f0e', dashStyle: 'Dot', marker: { enabled: false } });
                        }
                        if (outbreakData.some(v => v !== null)) {
                            series.push({ name: 'Outbreak Threshold', type: 'line', data: outbreakData, color: '#d62728', dashStyle: 'Dot', opacity: 0.5, marker: { enabled: false } });
                        }

                        Highcharts.chart(plotId, {
                            chart: { type: 'line' },
                            title: { text: null },
                            xAxis: { categories: monthOrder, title: { text: 'Month' } },
                            yAxis: { title: { text: 'Case Count' } },
                            series: series,
                            tooltip: {
                                shared: true,
                                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.2f}</b><br/>'
                            },
                            plotOptions: {
                                line: {
                                    connectNulls: false,
                                    marker: { enabled: false }
                                }
                            },
                            legend: { enabled: true },
                            exporting: { enabled: true }
                        });
                    } else {
                        const div = document.createElement('div');
                        div.className = 'col-md-4';
                        div.innerHTML = `<div class="box"><div class="box-header">Moving Average: ${plotData.county}</div><p>No valid data for ${plotData.county}</p></div>`;
                        rollingGrid.appendChild(div);
                        console.log(`No valid data for ${plotData.county} - Sick: ${hasValidSick}, Months: ${hasValidMonths}, MA: ${hasValidMA}`);
                    }
                });
            } else {
                rollingGrid.innerHTML = '<div class="col-md-12"><p>No data available for the selected disease and counties.</p></div>';
                console.log('No rolling data keys found:', Object.keys(data.rolling_data));
            }
            // Render National Plot
            if (nationalPlot && data.national_data.dates.length > 0) {
                Highcharts.chart('national_plot', {
                    chart: { type: 'line' },
                    title: { text: `National Static Thresholds for ${nationalDisease.value} 2023-2025` },
                    xAxis: {
                        type: 'datetime',
                        labels: { format: '{value:%b %Y}' },
                        dateTimeLabelFormats: { month: '%b %Y', year: '%Y' },
                        tickInterval: 1000 * 3600 * 24 * 30
                    },
                    yAxis: { title: { text: 'Cases' } },
                    series: [
                        { name: 'Average cases', data: data.national_data.dates.map((d, i) => [Date.parse(d + '-01'), data.national_data.values[i]]), color: '#1f77b4' },
                        { name: 'Monthly moving average', data: data.national_data.dates.map((d, i) => [Date.parse(d + '-01'), data.national_data.moving_average[i]]), dashStyle: 'Dash', color: 'black' },
                        { name: 'Alert', data: data.national_data.dates.map((d, i) => [Date.parse(d + '-01'), data.national_data.alert[i]]), dashStyle: 'Dash', color: '#ff7f0e' },
                        { name: 'Outbreak', data: data.national_data.dates.map((d, i) => [Date.parse(d + '-01'), data.national_data.outbreak[i]]), color: '#d62728' }
                    ],
                    tooltip: {
                        shared: true,
                        valueDecimals: 2,
                        dateTimeLabelFormats: { month: '%b %Y' }
                    },
                    plotOptions: { line: { marker: { enabled: false } } },
                    exporting: { enabled: true }
                });
            } else {
                nationalPlot.innerHTML = '<p>No national threshold data available.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching disease threshold data:', error);
            if (alertStatusChart) alertStatusChart.innerHTML = `<p>Error loading chart: ${error.message}</p>`;
            if (priorityTable) priorityTable.innerHTML = `<p>Error loading table: ${error.message}</p>`;
            if (staticGrid) staticGrid.innerHTML = `<p>Error loading static plots: ${error.message}</p>`;
            if (rollingGrid) rollingGrid.innerHTML = `<p>Error loading rolling plots: ${error.message}</p>`;
            if (nationalPlot) nationalPlot.innerHTML = `<p>Error loading national plot: ${error.message}</p>`;
        });
    }


    // Event listeners
    if (thresholdTab) thresholdTab.addEventListener('change', toggleTabs);
    [threshYear, threshCounty, threshDisease, staticDisease, staticCounty, staticYear, rollingDisease, rollingCounty, nationalDisease].forEach(picker => {
        if (picker) picker.addEventListener('change', updateVisuals);
    });


   updateVisuals()
;});

document.addEventListener('DOMContentLoaded', function() {
    function debugKPIElements() {
        const kpiIds = ['total_counties', 'active_alerts', 'outbreaks', 'diseases_monitored'];
        kpiIds.forEach(id => {
            const element = document.getElementById(id);
            console.log(`Element ${id}:`, element ? 'Found' : 'Not found', element);
        });
    }
    debugKPIElements();
});