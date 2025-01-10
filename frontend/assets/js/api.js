// API endpoints
const API_ENDPOINTS = {
    UPLOAD: 'http://localhost:5000/upload',
    PROCESS: 'http://localhost:5000/process'
};

// API functions
export async function uploadFile(file) {
    const formData = new FormData();
    formData.append('dataFile', file);

    const response = await fetch(API_ENDPOINTS.UPLOAD, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Error uploading file');
    }

    return response.json();
}

export async function processData(formData) {
    const response = await fetch(API_ENDPOINTS.PROCESS, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error processing data");
    }

    return response.json();
}
