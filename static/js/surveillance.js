document.addEventListener('DOMContentLoaded', function() {
    const nationalTab = document.getElementById('national_tab');
    const diseaseSelect = document.getElementById('select_disease');
    const countySelect = document.getElementById('county_selector');
    const countyMapInstruction = document.getElementById('county-map-instruction');
    const countyMapContainer = document.getElementById('countymap');
    const timePeriodCards = document.querySelectorAll('.time-period-card');

    // Verify jQuery and bootstrap-select
    if (!window.jQuery || !$.fn.selectpicker) {
        console.error('jQuery or bootstrap-select not loaded. Falling back to native select.');
        diseaseSelect?.removeAttribute('data-live-search');
        countySelect?.removeAttribute('data-live-search');
    } else {
        try {
            $(diseaseSelect).selectpicker();
            $(countySelect).selectpicker();
        } catch (error) {
            console.error('Error initializing selectpicker:', error);
            diseaseSelect?.removeAttribute('data-live-search');
            countySelect?.removeAttribute('data-live-search');
        }
    }

    // Toggle tab panes based on dropdown
    function toggleTabs() {
        const selectedTab = nationalTab.value;
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === selectedTab);
        });
        // Update maps and trend when switching back to national tab
        if (selectedTab === 'national') {
            updateCounties();
            updateTrendPlot();
        }
    }

    // Initialize tab visibility
    if (nationalTab) {
        nationalTab.addEventListener('change', toggleTabs);
        toggleTabs();
    }

    // Verify Highcharts and Highcharts Maps
    if (!Highcharts || !Highcharts.mapChart) {
        console.error('Highcharts or Highcharts Maps module is not loaded.');
        if (countyMapInstruction) {
            countyMapInstruction.textContent = 'Error: Map module not loaded.';
            countyMapInstruction.style.display = 'block';
        }
        return;
    }

    // Handle time period selection
    timePeriodCards.forEach(card => {
        card.addEventListener('click', function() {
            timePeriodCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            updateTrendPlot();
        });
    });

    // Fetch initial data (diseases)
    fetch('/get_national_init', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Initial data received:', data);
        if (diseaseSelect) {
            diseaseSelect.innerHTML = data.diseases.map(disease => 
                `<option value="${disease}" ${disease === 'Brucellosis' ? 'selected' : ''}>${disease}</option>`
            ).join('');
            if ($.fn.selectpicker) {
                $(diseaseSelect).selectpicker('refresh');
            }
        }
        updateCounties();
        updateTrendPlot();
    })
    .catch(error => {
        console.error('Error fetching initial data:', error);
        if (diseaseSelect) {
            diseaseSelect.innerHTML = '<option value="">Error loading diseases</option>';
            if ($.fn.selectpicker) {
                $(diseaseSelect).selectpicker('refresh');
            }
        }
    });

    // Update counties when disease changes
    if (diseaseSelect) {
        diseaseSelect.addEventListener('change', () => {
            updateCounties();
            updateTrendPlot();
        });
    }

    // Update maps when county changes
    if (countySelect) {
        countySelect.addEventListener('change', updateMaps);
    }

    function updateCounties() {
        if (!diseaseSelect || !countySelect) return;
        fetch('/get_counties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `disease=${encodeURIComponent(diseaseSelect.value)}`
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(counties => {
            console.log('Counties received:', counties);
            countySelect.innerHTML = counties.map(county => 
                `<option value="${county}" ${county === 'Marsabit' ? 'selected' : ''}>${county}</option>`
            ).join('');
            if ($.fn.selectpicker) {
                $(countySelect).selectpicker('refresh');
            }
            updateMaps();
        })
        .catch(error => {
            console.error('Error fetching counties:', error);
            countySelect.innerHTML = '<option value="">Error loading counties</option>';
            if ($.fn.selectpicker) {
                $(countySelect).selectpicker('refresh');
            }
        });
    }

    function updateMaps() {
        if (!diseaseSelect?.value || !countySelect?.value) return;

        // Fetch national map data
        fetch('/get_national_map_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `disease=${encodeURIComponent(diseaseSelect.value)}`
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('National map data:', data);
            const kenyaMap = document.getElementById('kenyamap');
            if (!kenyaMap) {
                console.error('National map container (kenyamap) not found in DOM.');
                return;
            }
            if (data.data.length === 0) {
                kenyaMap.innerHTML = '<p>No data available for this selection.</p>';
                return;
            }
            Highcharts.mapChart('kenyamap', {
                chart: { type: 'map' },
                title: { text: `Reported cases for ${diseaseSelect.value}` },
                mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
                colorAxis: {
                    min: Math.min(...data.data.map(d => d.value)) || 0,
                    max: Math.max(...data.data.map(d => d.value)) || 1,
                    stops: [
                        [0, '#FFFFCC'], [0.125, '#FFEDA0'], [0.25, '#FED976'], [0.375, '#FEB24C'],
                        [0.5, '#FD8D3C'], [0.625, '#FC4E2A'], [0.75, '#E31A1C'], [0.875, '#BD0026'],
                        [1, '#800026']
                    ]
                },
                series: [{
                    mapData: data.shapefile,
                    data: data.data,
                    joinBy: ['county', 'county'],
                    name: `Reported cases for ${diseaseSelect.value}`,
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
        })
        .catch(error => {
            console.error('Error rendering national map:', error);
            const kenyaMap = document.getElementById('kenyamap');
            if (kenyaMap) {
                kenyaMap.innerHTML = `<p>Error loading map: ${error.message}</p>`;
            }
        });

        // Skip county map if containers are missing
        if (!countyMapInstruction || !countyMapContainer) {
            console.error('County map elements (county-map-instruction or countymap) not found in DOM.');
            return;
        }

        // Fetch county map data
        fetch('/get_county_map_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `disease=${encodeURIComponent(diseaseSelect.value)}&county=${encodeURIComponent(countySelect.value)}`
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('County map data:', data);
            console.log('Subcounty names in data:', data.data.map(d => d.sub_county));
            console.log('Subcounty names in shapefile:', data.shapefile.features.map(f => f.properties.sub_county));
            if (data.data.length === 0 || data.shapefile.features.length === 0) {
                countyMapInstruction.textContent = data.data.length === 0 
                    ? 'No data available for this county.' 
                    : 'No sub-county shapefile data available.';
                countyMapInstruction.style.display = 'block';
                countyMapContainer.style.display = 'none';
                return;
            }
            countyMapInstruction.style.display = 'none';
            countyMapContainer.style.display = 'block';
            Highcharts.mapChart('countymap', {
                chart: { type: 'map' },
                title: { text: `Reported cases for ${diseaseSelect.value} in ${countySelect.value}` },
                mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
                colorAxis: {
                    min: Math.min(...data.data.map(d => d.value)) || 0,
                    max: Math.max(...data.data.map(d => d.value)) || 1,
                    stops: [
                        [0, '#FFFFCC'], [0.125, '#FFEDA0'], [0.25, '#FED976'], [0.375, '#FEB24C'],
                        [0.5, '#FD8D3C'], [0.625, '#FC4E2A'], [0.75, '#E31A1C'], [0.875, '#BD0026'],
                        [1, '#800026']
                    ]
                },
                series: [{
                    mapData: data.shapefile,
                    data: data.data,
                    joinBy: ['sub_county', 'sub_county'],
                    name: `Reported cases for ${diseaseSelect.value}`,
                    borderWidth: 0.8,
                    borderColor: 'black',
                    nullColor: 'white',
                    dataLabels: { enabled: true, format: '{point.sub_county}' },
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
        })
        .catch(error => {
            console.error('Error rendering county map:', error);
            countyMapInstruction.textContent = `Error loading county map: ${error.message}`;
            countyMapInstruction.style.display = 'block';
            countyMapContainer.style.display = 'none';
        });
    }

    function updateTrendPlot() {
        if (!diseaseSelect?.value) return;

        const selectedPeriod = document.querySelector('.time-period-card.active')?.dataset.period || 'all';

        fetch('/get_trend_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `disease=${encodeURIComponent(diseaseSelect.value)}&period=${encodeURIComponent(selectedPeriod)}`
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('Trend data:', data);
            const trendPlot = document.getElementById('national_trend_plot');
            if (!trendPlot) {
                console.error('Trend plot container (national_trend_plot) not found in DOM.');
                return;
            }
            if (!data.series || data.series.length === 0) {
                trendPlot.innerHTML = '<p>No trend data available for this selection.</p>';
                return;
            }

            Highcharts.chart('national_trend_plot', {
                chart: { type: 'spline' },
                title: { text: `Trend of ${diseaseSelect.value} Cases Over Time` },
                xAxis: {
                    type: 'datetime',
                    title: { text: 'Date' },
                    dateTimeLabelFormats: {
                        month: '%b %Y',
                        year: '%Y'
                    }
                },
                yAxis: {
                    title: { text: 'Number Sick' },
                    min: 0
                },
                series: data.series.map(series => ({
                    name: series.name,
                    data: series.data.map(point => [new Date(point.date).getTime(), point.value])
                })),
                tooltip: {
                    useHTML: true,
                    headerFormat: '<p>{point.x:%Y-%m-%d}</p><br>',
                    pointFormat: '<b>{series.name}</b>: {point.y:.0f} cases<br>'
                },
                plotOptions: {
                    line: {
                        marker: { enabled: true, radius: 4 }
                    }
                },
                exporting: { enabled: true },
                accessibility: { enabled: false }
            });
        })
        .catch(error => {
            console.error('Error rendering trend plot:', error);
            const trendPlot = document.getElementById('national_trend_plot');
            if (trendPlot) {
                trendPlot.innerHTML = `<p>Error loading trend plot: ${error.message}</p>`;
            }
        });
    }
});