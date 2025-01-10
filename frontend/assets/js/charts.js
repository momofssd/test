// Chart rendering functions
export function renderChart(title, base64Image, container) {
    const chartDiv = document.createElement('div');
    chartDiv.className = 'chart-container';

    const chartImg = document.createElement('img');
    chartImg.src = `data:image/png;base64,${base64Image}`;
    chartImg.alt = title;

    const chartTitle = document.createElement('p');
    chartTitle.textContent = title;

    chartDiv.appendChild(chartImg);
    chartDiv.appendChild(chartTitle);
    container.appendChild(chartDiv);
}

export function renderResults(result, metricsDisplayElement, chartElement) {
    // Render metrics
    let htmlContent = "";

    if (result.data_description) {
        const { binary_ratio, data_shape } = result.data_description;
        const positiveCount = binary_ratio["1"].count;
        const negativeCount = binary_ratio["0"].count;
        const totalCount = positiveCount + negativeCount;
        const positivePercentage = ((positiveCount / totalCount) * 100).toFixed(2);
        const negativePercentage = ((negativeCount / totalCount) * 100).toFixed(2);

        htmlContent += `
            <h3>Data Overview</h3>
            <p><strong>Positive Case:</strong> ${positiveCount} (${positivePercentage}%)</p>
            <p><strong>Negative Case:</strong> ${negativeCount} (${negativePercentage}%)</p>
            <p><strong>Data Shape:</strong> Features: ${data_shape[0][1]}, Samples: ${data_shape[0][0]}</p>
        `;
    }

    if (result.metrics) {
        htmlContent += "<h3>Correlation</h3><div class='metrics-row'>";
        result.metrics.forEach((metric) => {
            htmlContent += `<div class='metric-item'>${metric.feature}: ${metric.score}</div>`;
        });
        htmlContent += "</div>";
    }

    if (result.reports) {
        htmlContent += "<h3>Classification Reports</h3><hr>";
        Object.entries(result.reports).forEach(([model, report]) => {
            htmlContent += `
                <div class='report-container'>
                    <h4>${model}</h4>
                    <pre class='report-content'>${report.report || ''}</pre>
                </div>
            `;
        });
    }

    metricsDisplayElement.innerHTML = htmlContent;

    // Clear previous charts
    chartElement.innerHTML = "";

    // Render new charts
    if (result.chart_correlation) {
        renderChart('Feature Correlations with Target', result.chart_correlation, chartElement);
    }

    if (result.reports) {
        Object.entries(result.reports).forEach(([model, report]) => {
            if (report.confusion_matrix_chart) {
                renderChart(`Confusion Matrix for ${model}`, report.confusion_matrix_chart, chartElement);
            }
        });
    }

    if (result.feature_distribution_plots) {
        Object.entries(result.feature_distribution_plots).forEach(([feature, base64Image]) => {
            renderChart(`Distribution for Feature: ${feature}`, base64Image, chartElement);
        });
    }
}
