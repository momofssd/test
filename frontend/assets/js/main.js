import { uploadFile, processData } from './api.js';
import { renderResults } from './charts.js';

// DOM Elements
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

// Event Listeners
resetElement.addEventListener('click', () => window.location.reload());

uploadButton.addEventListener('click', async () => {
    const dataFile = document.getElementById('dataFile').files[0];
    resetStatusDisplay();

    if (!dataFile) {
        updateStatus("Please upload a file.", "error");
        return;
    }

    try {
        const columns = await uploadFile(dataFile);
        renderColumns(columns);
        dataread = true;
        updateStatus("File submitted successfully!", "success");
    } catch (error) {
        console.error('Error:', error);
        updateStatus(error.message || "Error connecting to the backend.", "error");
    }
});

// Status Display Functions
function resetStatusDisplay() {
    statusDisplayElement.textContent = "";
    statusDisplayElement.className = "";
}

function updateStatus(message, statusType) {
    statusDisplayElement.textContent = message;
    statusDisplayElement.className = `status-${statusType}`;
}

// Column Rendering
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

// Form Event Handlers
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

dsActionElement.addEventListener('change', () => {
    const dsAction = dsActionElement.value;
    dsAnalyzeElement.disabled = dsAction === "compare";
});

// Form Submission
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    resetStatusDisplay();

    const missingFields = validateForm();
    if (missingFields.length > 0) {
        updateStatus("Missing Fields: " + missingFields.join(', '), "error");
        return;
    }

    try {
        updateStatus("Processing...", "processing");
        const result = await processData(prepareFormData());
        renderResults(result, metricsDisplayElement, chartElement);
        updateStatus("Form submitted successfully!", "success");
    } catch (error) {
        console.error("Error:", error);
        updateStatus(error.message || "Error processing data. Please try again.", "error");
    }
});

// Form Validation and Data Preparation
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
