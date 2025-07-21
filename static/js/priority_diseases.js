document.addEventListener('DOMContentLoaded', function() {
    const indicatorPicker = document.getElementById('indicator_picker');
    const timePeriodCards = document.querySelectorAll('.time-period-card');
    const kenyaMap = document.getElementById('kenyamap');
    const trendPlot = document.getElementById('trend_plot');
    const diseaseTable = document.getElementById('disease_table');
    const diseaseInfo = document.getElementById('disease_info');

    // Get disease from URL
    const disease = window.location.pathname.split('/').pop();

    // Initialize bootstrap-select
    if (window.jQuery && $.fn.selectpicker) {
        $(indicatorPicker).selectpicker();
    } else {
        console.error('jQuery or bootstrap-select not loaded.');
        indicatorPicker.removeAttribute('data-live-search');
    }

    // Handle time period card selection
    let selectedPeriod = '1y'; // Default to 1 year
    timePeriodCards.forEach(card => {
        card.addEventListener('click', function() {
            timePeriodCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            selectedPeriod = this.dataset.period;
            updateVisuals();
        });
    });

    // Fetch and render visualizations
    function updateVisuals() {
        if (!indicatorPicker.value || !selectedPeriod) return;

        fetch(`/get_disease_visuals/${disease}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `time_period=${encodeURIComponent(selectedPeriod)}&indicator=${encodeURIComponent(indicatorPicker.value)}`
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('Disease visuals data:', data);

            // Render National Map
            if (kenyaMap && data.map_data.data.length > 0) {
                Highcharts.mapChart('kenyamap', {
                    chart: { type: 'map' },
                    title: { text: `Reported cases for ${data.table_data[0]?.Disease_Condition || disease}` },
                    mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
                    colorAxis: {
                        min: Math.min(...data.map_data.data.map(d => d.value)) || 0,
                        max: Math.max(...data.map_data.data.map(d => d.value)) || 1,
                        stops: [
                            [0, '#FFFFCC'], [0.125, '#FFEDA0'], [0.25, '#FED976'], [0.375, '#FEB24C'],
                            [0.5, '#FD8D3C'], [0.625, '#FC4E2A'], [0.75, '#E31A1C'], [0.875, '#BD0026'],
                            [1, '#800026']
                        ]
                    },
                    series: [{
                        mapData: data.map_data.shapefile,
                        data: data.map_data.data,
                        joinBy: ['county', 'county'],
                        name: `Reported cases for ${data.table_data[0]?.Disease_Condition || disease}`,
                        borderWidth: 0.8,
                        borderColor: 'black',
                        nullColor: 'white',
                        dataLabels: { enabled: true, format: '{point.county}' },
                        tooltip: {
                            useHTML: true,
                            headerFormat: '<p>',
                            pointFormat: '<b style="color:#1874CD">Number Sick:</b> {point.value:.0f}<br>',
                            footerFormat: '</p>'
                        }
                    }],
                    exporting: { enabled: true },
                    accessibility: { enabled: false }
                });
            } else {
                kenyaMap.innerHTML = '<p>No map data available.</p>';
            }

            // Render Trend Plot
            if (trendPlot && data.trend_data.series.length > 0) {
                Highcharts.chart('trend_plot', {
                    chart: { type: 'spline' },
                    title: { text: `${data.table_data[0]?.Disease_Condition || disease} Trend` },
                    xAxis: { categories: data.trend_data.months },
                    yAxis: { title: { text: 'Count' } },
                    tooltip: { shared: true, valueSuffix: ' units' },
                    plotOptions: { line: { marker: { enabled: true } } },
                    series: data.trend_data.series,
                    exporting: { enabled: true }
                });
            } else {
                trendPlot.innerHTML = '<p>No trend data available.</p>';
            }

            // Render Data Table
            if (diseaseTable && data.table_data.length > 0) {
                // Destroy existing DataTable if initialized
                if ($.fn.DataTable.isDataTable('#disease_table')) {
                    $(diseaseTable).DataTable().destroy();
                }
                $(diseaseTable).DataTable({
                    data: data.table_data,
                    columns: [
                        { title: 'County', data: 'county' },
                        { title: 'Report Date', data: 'Month' },
                        { title: 'Disease Condition', data: 'Disease_Condition' },
                        { title: 'Species Affected', data: 'Species_List' },
                        { title: 'Cases', data: 'Reports' }
                    ],
                    pageLength: 8,
                    scrollX: true
                });
            } else {
                diseaseTable.innerHTML = '<p>No table data available.</p>';
            }

            // Render About Text
            if (diseaseInfo) {
                diseaseInfo.innerHTML = data.about_text;
            }
        })
        .catch(error => {
            console.error('Error fetching disease visuals:', error);
            if (kenyaMap) kenyaMap.innerHTML = `<p>Error loading map: ${error.message}</p>`;
            if (trendPlot) trendPlot.innerHTML = `<p>Error loading trend plot: ${error.message}</p>`;
            if (diseaseTable) diseaseTable.innerHTML = `<p>Error loading table: ${error.message}</p>`;
        });
    }

    // Event listeners for filters
    if (indicatorPicker) {
        indicatorPicker.addEventListener('change', updateVisuals);
    }

    // Initial render
    updateVisuals();
});
