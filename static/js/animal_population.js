document.addEventListener('DOMContentLoaded', function() {
    const speciesPicker = document.getElementById('species_picker');
    const livestockMap = document.getElementById('livestockmap');
    const speciesBar = document.getElementById('species_bar');
    const dynamicTitle = document.getElementById('dynamic_title');

    // Initialize bootstrap-select
    if (window.jQuery && $.fn.selectpicker) {
        $(speciesPicker).selectpicker();
    } else {
        console.error('jQuery or bootstrap-select not loaded.');
        speciesPicker.removeAttribute('data-live-search');
    }

    // Fetch and render visualizations
    function updateVisuals() {
        if (!speciesPicker || !speciesPicker.value) return;

        fetch('/get_population_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `species=${encodeURIComponent(speciesPicker.value)}`
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('Population data:', data);

            // Update dynamic title
            if (dynamicTitle) {
                dynamicTitle.innerHTML = `County Statistics for ${speciesPicker.value}`;
            }

            // Render Livestock Map
            if (livestockMap && data.map_data.data.length > 0) {
                Highcharts.mapChart('livestockmap', {
                    chart: { type: 'map' },
                    title: { text: `Livestock Distribution in Kenya` },
                    mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
                    colorAxis: {
                        min: Math.min(...data.map_data.data.map(d => d.value)) || 0,
                        max: Math.max(...data.map_data.data.map(d => d.value)) || 1,
                        stops: [
                            [0, '#FFFFE5'], [0.125, '#F7FCB9'], [0.25, '#D9F0A3'], [0.375, '#ADDD8E'],
                            [0.5, '#78C679'], [0.625, '#41AB5D'], [0.75, '#238443'], [0.875, '#006837'],
                            [1, '#004529']
                        ]
                    },
                    series: [{
                        mapData: data.map_data.shapefile,
                        data: data.map_data.data,
                        joinBy: ['county', 'county'],
                        name: `Population of ${speciesPicker.value}`,
                        borderWidth: 0.8,
                        borderColor: 'black',
                        nullColor: 'white',
                        dataLabels: { enabled: true, format: '{point.county}' },
                        tooltip: {
                            useHTML: true,
                            headerFormat: '<p>',
                            pointFormat: '<b style="color:#1874CD">Aggregate population:</b> {point.value:.0f}<br>',
                            footerFormat: '</p>'
                        }
                    }],
                    exporting: { enabled: true },
                    accessibility: { enabled: false }
                });
            } else {
                livestockMap.innerHTML = '<p>No map data available.</p>';
            }

            // Render Bar Plot
            if (speciesBar && data.bar_data.values.length > 0) {
                Highcharts.chart('species_bar', {
                    chart: { type: 'bar' },
                    title: { text: null },
                    xAxis: { categories: data.bar_data.counties },
                    yAxis: { title: { text: 'Total Population' } },
                    colorAxis: {
                        minColor: '#FFFFE5',
                        maxColor: '#004529'
                    },
                    series: [{
                        name: 'Population',
                        data: data.bar_data.values,
                        colorByPoint: true
                    }],
                    tooltip: {
                        pointFormat: 'County: <b>{point.category}</b><br>Population: <b>{point.y:.0f}</b>'
                    },
                    plotOptions: {
                        bar: { dataLabels: { enabled: true } }
                    },
                    legend: { enabled: false },
                    exporting: { enabled: true }
                });
            } else {
                speciesBar.innerHTML = '<p>No bar data available.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching population data:', error);
            if (livestockMap) livestockMap.innerHTML = `<p>Error loading map: ${error.message}</p>`;
            if (speciesBar) speciesBar.innerHTML = `<p>Error loading bar plot: ${error.message}</p>`;
        });
    }

    // Event listener for species picker
    if (speciesPicker) {
        speciesPicker.addEventListener('change', updateVisuals);
    }

    // Initial render
    updateVisuals();
});
