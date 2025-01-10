# Data Science Analytics Web Application

A full-stack web application for data analysis and machine learning model comparison, featuring an interactive dashboard for data visualization and model evaluation.

## Current Structure
```
.
├── dataprocess.py     # Flask backend for ML processing
├── dsFrontend.html   # Frontend interface
├── script.js         # Frontend logic
├── style.css        # Styling
└── magic04.data     # Sample data file
```

## Suggested Project Structure
```
.
├── README.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes.py          # API endpoints
│   │   ├── models/           # ML model implementations
│   │   │   ├── __init__.py
│   │   │   ├── classifiers.py
│   │   │   └── preprocessors.py
│   │   └── utils/            # Helper functions
│   │       ├── __init__.py
│   │       ├── data_loader.py
│   │       └── visualizations.py
│   ├── requirements.txt
│   └── config.py             # Configuration settings
├── frontend/
│   ├── index.html
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── main.js
│   │       ├── api.js        # API interaction
│   │       └── charts.js     # Chart rendering
│   └── components/          # Reusable UI components
└── data/                    # Sample datasets
    └── samples/
```

## Technical Architecture

### Backend (Flask)
- **Model Management**: Implements multiple ML models (Logistic Regression, KNN, Random Forest, etc.)
- **Data Processing**: Handles data preprocessing, feature selection, and sampling strategies
- **Visualization**: Generates correlation charts and confusion matrices
- **API Endpoints**: 
  - `/upload`: File upload and column analysis
  - `/process`: Data processing and model training

### Frontend
- **Component Structure**: Single-page application with modular form sections
- **Interactive Features**: Dynamic form validation and real-time updates
- **Visualization**: Renders charts using base64-encoded images from backend
- **Responsive Design**: Flexbox layout for adaptable UI

## Design Patterns & Best Practices

### Suggested Improvements

1. **Code Organization**
   - Separate ML models into individual classes
   - Create dedicated services for data processing and visualization
   - Implement proper error handling and logging

2. **Frontend Architecture**
   - Modularize JavaScript into separate concerns (API, UI, Charts)
   - Add proper type checking and validation
   - Implement loading states for async operations

3. **API Design**
   - Add proper API versioning
   - Implement request/response validation
   - Add rate limiting and error handling

4. **Development Workflow**
   - Add proper documentation for API endpoints
   - Include unit tests for both frontend and backend
   - Set up CI/CD pipeline

## Features

### Data Processing
- File upload support (CSV, Excel, .data)
- Column selection and filtering
- Feature correlation analysis
- Automated data preprocessing

### Machine Learning
- Multiple classification algorithms
- Model comparison and evaluation
- Sampling strategies (SMOTE, ADASYN, etc.)
- Threshold adjustment

### Visualization
- Feature correlation charts
- Distribution plots
- Confusion matrices
- Performance metrics

## Development Setup

1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

2. Frontend Setup
```bash
cd frontend
# Serve with any static file server
python -m http.server 8000
```

3. Access the application at `http://localhost:8000`

## Dependencies

### Backend
- Flask
- pandas
- scikit-learn
- imbalanced-learn
- matplotlib
- XGBoost
- LightGBM

### Frontend
- Pure JavaScript (No framework dependencies)
- CSS3 with Flexbox
