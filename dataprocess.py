from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    classification_report, accuracy_score, precision_recall_curve, 
    f1_score, precision_score, confusion_matrix, ConfusionMatrixDisplay
)
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from imblearn.over_sampling import (
    SMOTE, ADASYN, BorderlineSMOTE, SVMSMOTE, RandomOverSampler
)
import matplotlib
matplotlib.use('Agg')  # Use non-GUI backend for matplotlib
import matplotlib.pyplot as plt
from io import BytesIO
import base64
import json

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# ============================
# ROUTES
# ============================

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'dataFile' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['dataFile']
    try:
        data = load_data(file)
        return jsonify(data.columns.tolist())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/process', methods=['POST'])
def process_form():
    try:
        # Parse file and form data
        file, form_data = parse_form_data(request)

        # Load data from the uploaded file
        data = load_data(file)

        # Process classification task with unpacked arguments
        result = process_classification_task(data, **form_data)

        # Return the result as JSON
        return jsonify(result), 200
    except Exception as e:
        error_message = f"Error processing form: {str(e)}"
        print(error_message)
        return jsonify({"error": error_message}), 500



# ============================
# HELPER FUNCTIONS
# ============================

def load_data(file):
    """Load CSV or Excel file into a pandas DataFrame."""
    if file.filename.endswith(('.csv', '.data')):
        data = pd.read_csv(file, header=None)
    elif file.filename.endswith(('.xls', '.xlsx')):
        data = pd.read_excel(file, header=None)
    else:
        raise ValueError("Unsupported file format")

    # Determine if first row is header
    first_row = data.iloc[0]
    if all(isinstance(val, str) for val in first_row):
        data.columns = first_row
        data = data[1:]
    else:
        data.columns = [f"Feature_{i}" for i in range(data.shape[1])]
    
    return data


def parse_form_data(request):
    """Extract file and form data from the request."""
    file = request.files['dataFile']
    form_data = {
        'pCase': request.form.get('postiveCase'),
        'nCase': request.form.get('negativeCase'),
        'testSplit': float(request.form.get('testSplit')),
        'sampling': request.form.get('sampling'),
        'threshold': float(request.form.get('threshold')),
        'targetColumn': request.form.get('targetColumn'),
        'droppedColumns': json.loads(request.form.get('droppedColumns', '[]')),
        'fColCount': int(request.form.get('fColCount'))
    }
    return file, form_data



def process_classification_task(data, pCase, nCase, testSplit, sampling, threshold, targetColumn, droppedColumns, fColCount):
    """Process the classification task."""
    # Existing logic
    models = initialize_models()
    df = pre_process_classification(data, pCase, nCase, targetColumn, droppedColumns)
    
    X = df.drop(columns=targetColumn, errors='ignore')
    y = df[targetColumn]
    # Debug: Print feature columns and target column
    print("\nFeature columns (X):")
    print(X.head())
    print("\nTarget column (y):")
    print(y.head())
    # Analysis
    binary_ratio, data_shape = data_overall(X, y)
    selected_features, metrics = select_features_corr(X, y, fColCount)
    X_train, X_test, y_train, y_test = prepare_data(X, y, testSplit, sampling)
    reports = run_models(models, threshold, X_train, y_train, X_test, y_test)

    # Charts
    chart_image_cor = generate_correlation_chart(X, y)
    feature_distribution_plots = generate_feature_distribution_plots(X, y, selected_features)

    return {
        "data_description": {"binary_ratio": binary_ratio, "data_shape": data_shape},
        "selected_features": selected_features,
        "metrics": metrics,
        "chart_correlation": chart_image_cor,
        "feature_distribution_plots": feature_distribution_plots,
        "reports": reports,
    }



# ============================
# MODELS AND ANALYSIS
# ============================

def initialize_models():
    """Initialize classification models."""
    return {
        "GaussianNB": GaussianNB(),
        "KNN": KNeighborsClassifier(),
        "XGBClassifier": XGBClassifier(),
        "Random Forest": RandomForestClassifier(),
        "LGBMClassifier": LGBMClassifier(verbose=-1),
    }


def run_models(models, threshold, X_train, y_train, X_test, y_test):
    """
    Run classification models and return their reports and confusion matrix charts.
    """
    results = {}

    for name, model in models.items():
        results[name] = mode_compare(name, model, threshold, X_train, y_train, X_test, y_test)

    return results



# ============================
# PREPROCESSING
# ============================

def pre_process_classification(df, pCase, nCase, targetColumn, droppedColumns):
    # Drop specified columns
    if droppedColumns:
        df = df.drop(columns=droppedColumns, errors='ignore')

    # Separate feature columns and exclude the target column
    feature_columns = df.drop(columns=[targetColumn], errors='ignore')

    # Preprocess only the feature columns
    for col in feature_columns.select_dtypes(include='number'):
        df[col] = df[col].fillna(df[col].median())

    for col in feature_columns.select_dtypes(include='object'):
        df[col] = pd.factorize(df[col])[0]

    # Explicitly process the target column
    df[targetColumn] = df[targetColumn].apply(lambda x: 1 if x == pCase else 0 if x == nCase else x)

    return df


# ============================
# ANALYSIS
# ============================

def data_overall(X, y):
    counts = y.value_counts().to_dict()
    total = len(y)
    binary_ratio = {k: {"count": v, "ratio": v / total} for k, v in counts.items()}
    data_shape = (X.shape, y.shape)
    return binary_ratio, data_shape


def select_features_corr(X, y, fColCount):
    correlation_scores = X.corrwith(y)
    top_features = correlation_scores.abs().nlargest(fColCount).index.tolist()
    metrics = [{"feature": f, "score": correlation_scores[f]} for f in top_features]
    return top_features, metrics


# ============================
# CHARTS
# ============================

def generate_correlation_chart(X, y):
    plt.figure(figsize=(8, 6), dpi=200)
    X.corrwith(y).sort_values().plot(kind='bar', color='skyblue')
    buf = BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    return base64.b64encode(buf.getvalue()).decode()


def generate_feature_distribution_plots(X, y, features):
    plots = {}
    for feature in features:
        buf = BytesIO()
        plt.figure(figsize=(6, 4), dpi=200)
        for label in np.unique(y):
            X.loc[y == label, feature].plot.hist(alpha=0.5, label=f'Class {label}')
        plt.legend()
        plt.savefig(buf, format='png')
        plt.close()
        plots[feature] = base64.b64encode(buf.getvalue()).decode()
    return plots


def prepare_data(X, y, testSplit, resample):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=testSplit, stratify=y)
    if resample:
        sampler = {"SMOTE": SMOTE, "ADASYN": ADASYN, "RandomOverSampler": RandomOverSampler}.get(resample, SMOTE)()
        X_train, y_train = sampler.fit_resample(X_train, y_train)
    return X_train, X_test, y_train, y_test


def mode_compare(name, model, threshold, X_train, y_train, X_test, y_test):
    """
    Run a model, generate a classification report, and create a confusion matrix chart.
    """
    # Fit the model
    model.fit(X_train, y_train)

    # Predict probabilities or class labels
    if hasattr(model, "predict_proba"):
        y_probs = model.predict_proba(X_test)[:, 1]
        y_pred = (y_probs >= threshold).astype(int)
    else:
        y_pred = model.predict(X_test)

    # Generate classification report
    report = classification_report(y_test, y_pred, digits=4)
    accuracy = accuracy_score(y_test, y_pred)

    # Generate confusion matrix chart
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(6, 6))
    cm_display = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['No Failure', 'Failure'])
    cm_display.plot(cmap='Blues', ax=ax)

    # Save confusion matrix chart as Base64 string
    buf = BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    cm_image_base64 = base64.b64encode(buf.read()).decode("utf-8")
    buf.close()
    plt.close()

    # Return report and confusion matrix chart as a dictionary
    return {
        "report": f"{report}\nAccuracy Score: {accuracy:.4f}",
        "confusion_matrix_chart": cm_image_base64
    }




# Run the Flask App
if __name__ == '__main__':
    app.run(debug=True)
