// References to form elements
const form = document.getElementById('dsForm');
const taskTypeElement = document.getElementById('taskType');
const postiveCaseElement = document.getElementById('postiveCase');
const negativeCaseElement = document.getElementById('negativeCase');
const samplingElement = document.getElementById('sampling');
const thresholdElement = document.getElementById('threshold');
const featureColElement = document.getElementById('featureCol');
const testSplitElement = document.getElementById('testingSplit');
const dsAnalyzeElement = document.getElementById('ds_analyze');
const dsActionElement = document.getElementById('ds_function');
const statusDisplayElement = document.getElementById('statusDisplay');
const metricsDisplayElement = document.getElementById('metricsDisplay');
const chartElement = document.getElementById('chartsContainer');
const droppedColumnsContainer = document.getElementById('droppedColumnsContainer');
const selectTargetColElement = document.getElementById('selectTargetColumn');
const resetElement = document.getElementById('reset');
const uploadButton = document.getElementById('uploadDataButton');

let dataread = false;

// Event Listener: Reset Button
resetElement.addEventListener('click', () => window.location.reload());

// Event Listener: Upload File Button
uploadButton.addEventListener('click', async () => {
  const dataFile = document.getElementById('dataFile').files[0];
  resetStatusDisplay();

  if (!dataFile) {
    updateStatus("Please upload a file.", "error");
    return;
  }

  const formData = new FormData();
  formData.append('dataFile', dataFile);

  try {
    const response = await fetch('http://localhost:5000/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const columns = await response.json();
      renderColumns(columns);
      dataread = true;
      updateStatus("File submitted successfully!", "success");
    } else {
      updateStatus("Error processing the file. Please try again.", "error");
    }
  } catch (error) {
    console.error('Error:', error);
    updateStatus("Error connecting to the backend.", "error");
  }
});

// Reset status display
function resetStatusDisplay() {
  statusDisplayElement.textContent = "";
  statusDisplayElement.className = "";
}

// Update status display
function updateStatus(message, statusType) {
  statusDisplayElement.textContent = message;
  statusDisplayElement.className = `status-${statusType}`;
}

// Render columns dynamically
function renderColumns(columns) {
  droppedColumnsContainer.innerHTML = '';
  selectTargetColElement.innerHTML = '<option value="" selected disabled>Select Target Column</option>';

  columns.forEach((col) => {
    // Checkbox for dropped columns
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `drop-${col}`;
    checkbox.name = 'droppedColumns';
    checkbox.className = 'checkboxInput';
    checkbox.value = col;

    const label = document.createElement('label');
    label.htmlFor = `drop-${col}`;
    label.textContent = col;

    const wrapper = document.createElement('div');
    wrapper.className = 'dropped-column-item';
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    droppedColumnsContainer.appendChild(wrapper);

    // Dropdown for target column
    const option = document.createElement('option');
    option.value = col;
    option.textContent = col;
    selectTargetColElement.appendChild(option);
  });
}

// Handle changes in selected target column
selectTargetColElement.addEventListener("change", () => {
  const selectedTargetColumn = selectTargetColElement.value;
  const checkboxes = droppedColumnsContainer.querySelectorAll('.checkboxInput');

  checkboxes.forEach((checkbox) => {
    const label = checkbox.nextElementSibling;
    if (checkbox.value === selectedTargetColumn) {
      checkbox.disabled = true;
      label.classList.add('disabled');
    } else {
      checkbox.disabled = false;
      label.classList.remove('disabled');
    }
  });
});

// Handle changes in task type
taskTypeElement.addEventListener('change', () => {
  const taskType = taskTypeElement.value;

  const disableClassificationFields = taskType === "Regression";
  samplingElement.disabled = disableClassificationFields;
  thresholdElement.disabled = disableClassificationFields;
  postiveCaseElement.disabled = disableClassificationFields;
  negativeCaseElement.disabled = disableClassificationFields;

  if (disableClassificationFields) {
    samplingElement.value = "";
    thresholdElement.value = "";
    postiveCaseElement.value = "";
    negativeCaseElement.value = "";
  }
});

// Handle changes in DS Action
dsActionElement.addEventListener('change', () => {
  const dsAction = dsActionElement.value;
  dsAnalyzeElement.disabled = dsAction === "compare";
});

// Submit Form
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  resetStatusDisplay();

  // Validate required fields
  const missingFields = validateForm();
  if (missingFields.length > 0) {
    updateStatus("Missing Fields: " + missingFields.join(', '), "error");
    return;
  }

  // Prepare form data
  const formData = prepareFormData();

  // Submit form data
  try {
    updateStatus("Processing...", "processing");
    const response = await fetch("http://localhost:5000/process", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      renderResults(result);
      updateStatus("Form submitted successfully!", "success");
    } else {
      const errorData = await response.json();
      updateStatus(errorData.error || "Error submitting form. Please try again.", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    updateStatus("Error connecting to the backend. Please try again later.", "error");
  }
});

// Validate form
function validateForm() {
  const missingFields = [];
  if (!selectTargetColElement.value) missingFields.push("Target Column");
  if (!taskTypeElement.value) missingFields.push("Task Type");
  if (taskTypeElement.value === "Classification") {
    if (!postiveCaseElement.value) missingFields.push("Positive Case");
    if (!negativeCaseElement.value) missingFields.push("Negative Case");
  }
  if (!dsActionElement.value) missingFields.push("DS Action");
  if (dsActionElement.value === "train" && !dsAnalyzeElement.value) missingFields.push("DS Analyze Mode");
  return missingFields;
}

// Prepare FormData
function prepareFormData() {
  const formData = new FormData();
  formData.append("dataFile", document.getElementById('dataFile').files[0]);
  formData.append("dsFunction", dsActionElement.value);
  formData.append("taskType", taskTypeElement.value);
  formData.append("postiveCase", postiveCaseElement.value);
  formData.append("negativeCase", negativeCaseElement.value);
  formData.append("fColCount", featureColElement.value || 1000);
  formData.append("testSplit", testSplitElement.value || 0.2);
  formData.append("sampling", samplingElement.value || "");
  formData.append("threshold", thresholdElement.value || 0.5);
  formData.append("dsAnalyzeMode", dsAnalyzeElement.value);
  formData.append("droppedColumns", JSON.stringify(
    Array.from(droppedColumnsContainer.querySelectorAll('input[type="checkbox"]:checked'))
      .map(checkbox => checkbox.value)
  ));
  formData.append("targetColumn", selectTargetColElement.value);
  return formData;
}

// Render Results
function renderResults(result) {
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
          <pre class='report-content'>${report.report}</pre>
        </div>
      `;
    });
  }

  metricsDisplayElement.innerHTML = htmlContent;

  // Render charts
  chartElement.innerHTML = "";

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

// Render chart helper
function renderChart(title, base64Image, container) {
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
