console.log('Highcharts object:', Highcharts);
console.log('mapChart function available:', typeof Highcharts.mapChart);

document.addEventListener('DOMContentLoaded', function() {
    const yearSelect = document.getElementById('select_yearMonth');
    const monthSelect = document.getElementById('select_month');
    const mapInstruction = document.getElementById('map-instruction');
    mapContainer = document.getElementById('kenyamapmonth');

    // Update months when year changes
    yearSelect.addEventListener('change', function() {
        fetch('/get_months', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `year=${yearSelect.value}`
        })
        .then(response => response.json())
        .then(months => {
            monthSelect.innerHTML = months.map(month => `<option value="${month}">${month}</option>`).join('');
            updateCharts();
            updateKPIs();
        })
        .catch(error => {
            console.error('Error fetching months:', error);
        });
    });

    // Update charts and KPIs when month changes
    monthSelect.addEventListener('change', function() {
        updateCharts();
        updateKPIs();
    });

    // Initial load
    fetch('/get_months', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `year=${yearSelect.value}`
    })
    .then(response => response.json())
    .then(months => {
        monthSelect.innerHTML = months.map(month => `<option value="${month}">${month}</option>`).join('');
        updateCharts();
        updateKPIs();
    });

    function updateCharts() {
        fetch('/get_disease_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `year=${yearSelect.value}&month=${monthSelect.value}`
        })
        .then(response => response.json())
        .then(data => {
            Highcharts.chart('prioritydiseasesmonth', {
                chart: { type: 'bar' },
                title: { text: `Top 10 Diseases in ${monthSelect.value} ${yearSelect.value}` },
                xAxis: { categories: data.categories },
                yAxis: { title: { text: 'Reported cases' } },
                series: [{
                    name: 'Summary of sick animals',
                    data: data.data,
                    colorByPoint: true
                }],
                colors: ['#FF0000', '#FF5555', '#FF6666', '#FF7777', '#FF8888', '#FF9999', '#FFAAAA', '#FFBBBB', '#FFCCCC', '#FFDDDD'],
                plotOptions: {
                    series: {
                        cursor: 'pointer',
                        point: {
                            events: {
                                click: function() {
                                    fetchMapData(this.category);
                                }
                            }
                        }
                    }
                },
                tooltip: {
                    pointFormatter: function() {
                        return `<b>${this.category}</b><br>Species: ${this.Species_Affected}<br>Number Sick: ${this.y}`;
                    }
                },
                legend: { enabled: false }
            });
        })
        .catch(error => {
            console.error('Error fetching disease data:', error);
        });
    }

    function fetchMapData(disease) {
        mapInstruction.style.display = 'none';
        mapContainer.style.display = 'block';

        fetch('/get_map_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `year=${yearSelect.value}&month=${monthSelect.value}&disease=${encodeURIComponent(disease)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.data.length === 0) {
                mapInstruction.textContent = 'No data available for this disease.';
                mapInstruction.style.display = 'block';
                mapContainer.style.display = 'none';
                return;
            }

            Highcharts.mapChart('kenyamapmonth', {
                chart: { type: 'map' },
                title: { text: `Reported cases for ${disease} in ${monthSelect.value} ${yearSelect.value}` },
                mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
                colorAxis: {
                    min: 0,
                    max: Math.max(...data.data.map(d => d.value)) || 1,
                    stops: [
                        [0, '#FFFFCC'],
                        [0.1, '#FFEDA0'],
                        [0.2, '#FED976'],
                        [0.3, '#FEB24C'],
                        [0.4, '#FD8D3C'],
                        [0.5, '#FC4E2A'],
                        [0.6, '#E31A1C'],
                        [0.7, '#BD0026'],
                        [0.8, '#800026']
                    ]
                },
                series: [{
                    mapData: data.shapefile,
                    data: data.data,
                    joinBy: ['county', 'county'],
                    name: `Reported cases for ${disease}`,
                    dataLabels: { enabled: true, format: '{point.county}' },
                    tooltip: {
                        pointFormat: '<b style="color:#1874CD">Number Sick:</b> {point.value:.0f}<br>'
                    }
                }],
                exporting: { enabled: true }
            });
        })
        .catch(error => {
            console.error('Error rendering map:', error);
            mapInstruction.textContent = 'Error loading map. Please try again.';
            mapInstruction.style.display = 'block';
            mapContainer.style.display = 'none';
        });
    }

    function updateKPIs() {
        fetch('/get_kpi_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `year=${yearSelect.value}&month=${monthSelect.value}`
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('kpi-top-disease').textContent = data.top_disease;
            document.getElementById('kpi-top-county').textContent = data.top_county;
            document.getElementById('kpi-top-species').textContent = data.top_species;
            document.getElementById('kpi-total-sick').textContent = data.total_sick;
            document.getElementById('kpi-total-dead').textContent = data.total_dead;
            document.getElementById('kpi-total-at-risk').textContent = data.total_at_risk;
        })
        .catch(error => {
            console.error('Error fetching KPI data:', error);
        });
    }
});