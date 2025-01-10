from flask import Blueprint, request, jsonify
from sklearn.model_selection import train_test_split
import json

from .models.classifiers import initialize_models
from .models.preprocessors import preprocess_classification, get_sampler
from .utils.data_loader import load_data, data_overall, select_features_corr
from .utils.visualizations import (
    generate_correlation_chart,
    generate_feature_distribution_plots,
    generate_confusion_matrix_plot
)

bp = Blueprint('main', __name__)

@bp.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and return column names."""
    if 'dataFile' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['dataFile']
    try:
        data = load_data(file)
        return jsonify(data.columns.tolist())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/process', methods=['POST'])
def process_form():
    """Process the uploaded data with specified parameters."""
    try:
        # Parse file and form data
        file = request.files['dataFile']
        form_data = {
            'pCase': request.form.get('postiveCase'),
            'nCase': request.form.get('negativeCase'),
            'testSplit': float(request.form.get('testSplit', 0.2)),
            'sampling': request.form.get('sampling'),
            'threshold': float(request.form.get('threshold', 0.5)),
            'targetColumn': request.form.get('targetColumn'),
            'droppedColumns': json.loads(request.form.get('droppedColumns', '[]')),
            'fColCount': int(request.form.get('fColCount', 1000))
        }

        # Load and preprocess data
        data = load_data(file)
        df = preprocess_classification(
            data, 
            form_data['pCase'],
            form_data['nCase'],
            form_data['targetColumn'],
            form_data['droppedColumns']
        )

        # Prepare features and target
        X = df.drop(columns=form_data['targetColumn'], errors='ignore')
        y = df[form_data['targetColumn']]

        # Analysis
        binary_ratio, data_shape = data_overall(X, y)
        selected_features, metrics = select_features_corr(X, y, form_data['fColCount'])

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=form_data['testSplit'],
            stratify=y
        )

        # Apply sampling if specified
        if form_data['sampling']:
            sampler = get_sampler(form_data['sampling'])()
            X_train, y_train = sampler.fit_resample(X_train, y_train)

        # Initialize and train models
        models = initialize_models()
        reports = {}
        
        for name, model in models.items():
            # Train model
            model.fit(X_train, y_train)
            
            # Get predictions
            y_pred = (model.predict_proba(X_test)[:, 1] >= form_data['threshold']).astype(int) \
                     if hasattr(model, "predict_proba") else model.predict(X_test)
            
            # Generate confusion matrix plot
            cm_image = generate_confusion_matrix_plot(y_test, y_pred)
            
            reports[name] = {
                "confusion_matrix_chart": cm_image
            }

        # Generate visualization charts
        chart_correlation = generate_correlation_chart(X, y)
        feature_distribution_plots = generate_feature_distribution_plots(X, y, selected_features)

        return jsonify({
            "data_description": {
                "binary_ratio": binary_ratio,
                "data_shape": data_shape
            },
            "selected_features": selected_features,
            "metrics": metrics,
            "chart_correlation": chart_correlation,
            "feature_distribution_plots": feature_distribution_plots,
            "reports": reports
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
