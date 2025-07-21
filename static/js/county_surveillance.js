document.addEventListener('DOMContentLoaded', function() {
    const countyPicker = document.getElementById('county_picker');
    const subcountyPicker = document.getElementById('subcounty_picker');
    const diseasePicker = document.getElementById('disease_picker');
    const countyMap = document.getElementById('kenyacounty');
    const subcountyMap = document.getElementById('kenyasubcounty');
    const countyDiseases = document.getElementById('county_diseases');
    const signTrend = document.getElementById('sign_trend');
    const countyMapTitle = document.getElementById('county_map_title');
    const subcountyMapTitle = document.getElementById('subcounty_map_title');
    const priorityDiseasesTitle = document.getElementById('priority_diseases_title');
    const trendTitle = document.getElementById('trend_title');

    // Initialize bootstrap-select
    if (window.jQuery && $.fn.selectpicker) {
        $(countyPicker).selectpicker();
        $(subcountyPicker).selectpicker();
        $(diseasePicker).selectpicker();
    } else {
        console.error('jQuery or bootstrap-select not loaded.');
        [countyPicker, subcountyPicker, diseasePicker].forEach(picker => {
            if (picker) picker.removeAttribute('data-live-search');
        });
    }

    let clickedDisease = '';

    // Update subcounty dropdown based on county
    function updateSubcounties() {
        if (!countyPicker.value) return;

        fetch('/get_county_surveillance_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `county=${encodeURIComponent(countyPicker.value)}`
        })
        .then(response => response.json())
        .then(data => {
            subcountyPicker.innerHTML = '';
            data.subcounties.forEach(subcounty => {
                const option = document.createElement('option');
                option.value = subcounty;
                option.textContent = subcounty;
                subcountyPicker.appendChild(option);
            });
            if (data.subcounties.length > 0) {
                subcountyPicker.value = data.subcounties[0];
            }
            $(subcountyPicker).selectpicker('refresh');
            updateVisuals();
        })
        .catch(error => console.error('Error fetching subcounties:', error));
    }

    // Fetch and render visualizations
    function updateVisuals() {
        if (!countyPicker.value || !subcountyPicker.value || !diseasePicker.value) return;

        fetch('/get_county_surveillance_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `county=${encodeURIComponent(countyPicker.value)}&subcounty=${encodeURIComponent(subcountyPicker.value)}&disease=${encodeURIComponent(diseasePicker.value)}&clicked_disease=${encodeURIComponent(clickedDisease)}`
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('County surveillance data:', data);

            // Update titles
            if (countyMapTitle) countyMapTitle.innerHTML = `Disease Distribution for ${countyPicker.value}`;
            if (subcountyMapTitle) subcountyMapTitle.innerHTML = `Disease Distribution in ${subcountyPicker.value}`;
            if (priorityDiseasesTitle) priorityDiseasesTitle.innerHTML = `Priority Diseases in ${countyPicker.value} (Click a bar to see trend)`;
            if (trendTitle) trendTitle.innerHTML = clickedDisease ? `Trend for ${clickedDisease} in ${countyPicker.value}` : `Trend for Selected Disease in ${countyPicker.value}`;

            // Render County Map
            if (countyMap && data.county_map_data.length > 0) {
                Highcharts.mapChart('kenyacounty', {
                    chart: { type: 'map' },
                    title: { text: null },
                    mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
                    colorAxis: {
                        min: Math.min(...data.county_map_data.map(d => d.value)) || 0,
                        max: Math.max(...data.county_map_data.map(d => d.value)) || 1,
                        stops: [
                            [0, '#FFFFCC'], [0.125, '#FFEDA0'], [0.25, '#FED976'], [0.375, '#FEB24C'],
                            [0.5, '#FD8D3C'], [0.625, '#FC4E2A'], [0.75, '#E31A1C'], [0.875, '#BD0026'],
                            [1, '#800026']
                        ]
                    },
                    series: [{
                        mapData: data.county_shapefile,
                        data: data.county_map_data,
                        joinBy: ['sub_county', 'sub_county'],
                        name: 'Animal sick',
                        borderWidth: 0.8,
                        borderColor: 'black',
                        nullColor: 'white',
                        dataLabels: { enabled: true, format: '{point.sub_county}' },
                        tooltip: {
                            useHTML: true,
                            headerFormat: '<p>',
                            pointFormat: 'Sub-county: <b>{point.sub_county}</b><br/>Number sick: <b>{point.value:.0f} animals</b><br/>Species: <b>{point.Species_Affected}</b><br>',
                            footerFormat: '</p>'
                        }
                    }],
                    legend: {
                        layout: 'vertical',
                        align: 'right',
                        verticalAlign: 'middle',
                        title: { text: 'Cases per county' }
                    },
                    exporting: { enabled: true },
                    accessibility: { enabled: false }
                });
            } else {
                countyMap.innerHTML = `<p>No ${diseasePicker.value} cases in ${countyPicker.value}</p>`;
            }

            // Render Subcounty Map
            if (subcountyMap && data.subcounty_map_data.length > 0) {
                Highcharts.mapChart('kenyasubcounty', {
                    chart: { type: 'map' },
                    title: { text: null },
                    mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
                    colorAxis: {
                        min: Math.min(...data.subcounty_map_data.map(d => d.value)) || 0,
                        max: Math.max(...data.subcounty_map_data.map(d => d.value)) || 1,
                        stops: [
                            [0, '#FFFFCC'], [0.125, '#FFEDA0'], [0.25, '#FED976'], [0.375, '#FEB24C'],
                            [0.5, '#FD8D3C'], [0.625, '#FC4E2A'], [0.75, '#E31A1C'], [0.875, '#BD0026'],
                            [1, '#800026']
                        ]
                    },
                    series: [{
                        mapData: data.ward_shapefile,
                        data: data.subcounty_map_data,
                        joinBy: ['Ward', 'Ward'],
                        name: 'Animal sick',
                        borderWidth: 0.8,
                        borderColor: 'black',
                        nullColor: 'white',
                        dataLabels: { enabled: true, format: '{point.Ward}' },
                        tooltip: {
                            useHTML: true,
                            headerFormat: '<p>',
                            pointFormat: 'Ward: <b>{point.sub_county}</b><br/>Number sick: <b>{point.value:.0f} animals</b><br/>Species: <b>{point.Species_Affected}</b><br>',
                            footerFormat: '</p>'
                        }
                    }],
                    legend: {
                        layout: 'vertical',
                        align: 'right',
                        verticalAlign: 'middle',
                        title: { text: 'Cases per ward' }
                    },
                    exporting: { enabled: true },
                    accessibility: { enabled: false }
                });
            } else {
                subcountyMap.innerHTML = `<p>No ${diseasePicker.value} cases in ${subcountyPicker.value}</p>`;
            }

            // Render Priority Diseases Bar Plot
            if (countyDiseases && data.priority_data.values.length > 0) {
                Highcharts.chart('county_diseases', {
                    chart: { type: 'bar' },
                    title: { text: null },
                    xAxis: { categories: data.priority_data.diseases },
                    yAxis: { title: { text: 'Reported cases' } },
                    colorAxis: {
                        minColor: '#FFDDDD',
                        maxColor: '#FF0000'
                    },
                    series: [{
                        name: 'Summary of sick animals',
                        data: data.priority_data.values,
                        colorByPoint: true,
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    clickedDisease = this.category;
                                    updateVisuals();
                                }
                            }
                        }
                    }],
                    tooltip: {
                        pointFormat: '<b>{point.category}</b><br>Total cases: {point.y:.0f}'
                    },
                    legend: { enabled: false },
                    exporting: { enabled: true }
                });
            } else {
                countyDiseases.innerHTML = '<p>No priority disease data available.</p>';
            }

            // Render Trend Plot
            if (signTrend && data.trend_data.values.length > 0) {
                const seriesData = [];
                const speciesList = [...new Set(data.trend_data.species)];
                speciesList.forEach(species => {
                    const speciesValues = data.trend_data.months.map((month, i) => {
                        const index = data.trend_data.species.indexOf(species, i);
                        return index !== -1 ? [Date.parse(month), data.trend_data.values[index]] : null;
                    }).filter(v => v);
                    seriesData.push({ name: species, data: speciesValues });
                });

                Highcharts.chart('sign_trend', {
                    chart: { type: 'spline' },
                    title: { text: null },
                    xAxis: { type: 'datetime', title: { text: 'Date' } },
                    yAxis: { title: { text: 'Number sick' } },
                    series: seriesData,
                    tooltip: {
                        useHTML: true,
                        headerFormat: '',
                        pointFormat: 'Species: <b>{series.name}</b><br/>Date: <b>{point.x:%Y-%m}</b><br/>Number sick: <b>{point.y:.0f} animals</b><br/><hr>',
                        shared: true
                    },
                    plotOptions: {
                        spline: { marker: { enabled: true, symbol: 'dot' } }
                    },
                    exporting: { enabled: true }
                });
            } else {
                signTrend.innerHTML = '<p>No trend data available.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching county surveillance data:', error);
            if (countyMap) countyMap.innerHTML = `<p>Error loading map: ${error.message}</p>`;
            if (subcountyMap) subcountyMap.innerHTML = `<p>Error loading map: ${error.message}</p>`;
            if (countyDiseases) countyDiseases.innerHTML = `<p>Error loading bar plot: ${error.message}</p>`;
            if (signTrend) signTrend.innerHTML = `<p>Error loading trend plot: ${error.message}</p>`;
        });
    }

    // Event listeners
    if (countyPicker) countyPicker.addEventListener('change', updateSubcounties);
    if (subcountyPicker) subcountyPicker.addEventListener('change', updateVisuals);
    if (diseasePicker) diseasePicker.addEventListener('change', updateVisuals);

    // Initial render
    updateSubcounties();
});
